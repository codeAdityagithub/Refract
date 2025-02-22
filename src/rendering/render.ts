import {
    clearReactiveAttributes,
    clearReactiveFunction,
    setReactiveFunction,
} from "../signals/batch";
import { BaseSignal } from "../signals/signal";
import { Fiber, FiberChildren } from "../types";
import { isPrimitive } from "../utils/general";
import {
    FRAGMENT_SYMBOL,
    createChildren,
    createNode,
    createTextChildren,
} from "./createElements";
import {
    cleanUpFC,
    clearCurrentFC,
    setCurrentFC,
} from "./functionalComponents";

export function render(element: Fiber, container: HTMLElement) {
    rootContainer = container;
    const fragment = document.createDocumentFragment();
    rootFragment = fragment;
    const rootFiber: Fiber = {
        type: "div",
        props: {
            children: [element],
        },
        // @ts-expect-error
        dom: fragment,
    };
    // console.log(element.type(element.props));
    element.parent = rootFiber;
    elements.push(element);
    requestIdleCallback(workLoop);

    // container.appendChild(fragment);
}

function commitRootFragment() {
    if (rootFragment && rootContainer) {
        rootContainer.appendChild(rootFragment);
        const endTime = performance.now();
        console.log(`Render time: ${endTime - startTime}ms`);
    }
}

let elements: Fiber[] = [];
let rootContainer: HTMLElement | null = null;
let rootFragment: DocumentFragment | null = null;
let startTime = -1;

function workLoop(deadline: IdleDeadline) {
    if (startTime === -1) startTime = performance.now();

    let shouldYield = false;
    while (elements.length > 0 && !shouldYield) {
        const element = elements.pop();
        renderNode(element!);
        shouldYield = deadline.timeRemaining() < 1;
    }

    if (elements.length == 0) {
        commitRootFragment();
        return;
    }
    requestIdleCallback(workLoop);
}

function renderNode(fiber: Fiber) {
    if (fiber.type === "FRAGMENT") {
        const isArray = !fiber.props.children[FRAGMENT_SYMBOL];
        let noKey = false;
        for (let i = fiber.props.children.length - 1; i >= 0; i--) {
            fiber.props.children[i].parent = fiber;

            if (
                isArray &&
                fiber.props.children[i].props.key === undefined &&
                fiber.renderFunction
            ) {
                noKey = true;
            }

            elements.push(fiber.props.children[i]);
        }
        if (noKey) {
            console.error("Array children must have a key attribute");
        }
        // console.log(fiber.props.children);
    } else if (typeof fiber.type === "function") {
        setCurrentFC(fiber);

        const children = fiber.type(fiber.props);
        clearCurrentFC();
        // fiber.type = "FRAGMENT";
        if (Array.isArray(children)) {
            // which means that the FC returned a fragment
            // console.log(children);
            for (let i = children.length - 1; i >= 0; i--) {
                children[i].parent = fiber;
                elements.push(children[i]);
            }
            fiber.props.children = children;
        } else {
            children.parent = fiber;
            fiber.props.children.push(children);
            elements.push(children);
        }
    } else {
        if (!fiber.dom) fiber.dom = createNode(fiber);
        let fiberParent: Fiber | undefined = fiber.parent;
        while (fiberParent && !fiberParent.dom) {
            fiberParent = fiberParent.parent;
        }
        if (fiberParent) {
            fiberParent.dom?.appendChild(fiber.dom);
        }

        for (let i = fiber.props.children.length - 1; i >= 0; i--) {
            fiber.props.children[i].parent = fiber;
            elements.push(fiber.props.children[i]);
        }
    }
    // console.log(fiber);
    setRenderFunction(fiber);
}

function createFiber(fiber: Fiber) {
    if (fiber.type === "FRAGMENT") {
        const isFragment = fiber.props.children[FRAGMENT_SYMBOL];
        if (isFragment) {
            for (const child of fiber.props.children) {
                child.parent = fiber;
                createFiber(child);
            }
        } else {
            let noKey = false;
            for (const child of fiber.props.children) {
                child.parent = fiber;
                if (child.props.key === undefined) {
                    noKey = true;
                }
                createFiber(child);
            }
            if (noKey) {
                console.error("Array children must have a key attribute");
            }
        }
    } else if (typeof fiber.type !== "function") {
        for (const child of fiber.props.children) {
            child.parent = fiber;
            createFiber(child);
        }
    }
    // console.log(fiber);
    setRenderFunction(fiber);
}
function commitFiber(
    fiber: Fiber,
    referenceNode?: Node,
    replace?: boolean,
    needCreation?: boolean,
    customParent?: Node
) {
    if (fiber.type === "FRAGMENT") {
        for (const child of fiber.props.children) {
            if (needCreation) child.parent = fiber;
            commitFiber(
                child,
                referenceNode,
                replace,
                needCreation,
                customParent
            );
        }
    } else if (typeof fiber.type === "function") {
        setCurrentFC(fiber);

        const children = fiber.type(fiber.props);
        clearCurrentFC();

        // console.log("commit FC", children);
        if (Array.isArray(children)) {
            // which means that the FC returned a fragment
            // console.log(children);
            for (const child of children) {
                child.parent = fiber;
                commitFiber(child, referenceNode, replace, true, customParent);
            }
            fiber.props.children = children;
        } else {
            children.parent = fiber;
            fiber.props.children.push(children);
            commitFiber(children, referenceNode, replace, true, customParent);
        }
    } else {
        if (!fiber.dom) fiber.dom = createNode(fiber);

        let parentDom: Node | undefined = undefined;
        if (customParent) {
            parentDom = customParent;
        } else {
            let fiberParent: Fiber | undefined = fiber.parent;

            while (fiberParent && !fiberParent.dom) {
                fiberParent = fiberParent.parent;
            }
            parentDom = fiberParent?.dom;
        }
        if (referenceNode) {
            if (replace) parentDom?.replaceChild(fiber.dom, referenceNode);
            else parentDom?.insertBefore(fiber.dom, referenceNode);
        } else parentDom?.appendChild(fiber.dom);
        for (const child of fiber.props.children) {
            if (needCreation) child.parent = fiber;

            commitFiber(child, undefined, undefined, needCreation, fiber.dom);
        }
    }
    if (needCreation) {
        setRenderFunction(fiber);
    }
}

let ToCommitDeletion = true;

function commitDeletion(fiber: Fiber, toClearReactiveFunction?: boolean) {
    if (!fiber || !ToCommitDeletion) return;
    if (fiber.renderFunction) {
        if (toClearReactiveFunction)
            clearReactiveFunction(fiber.renderFunction);
        delete fiber.renderFunction;
    }
    if (fiber.dom) {
        for (const prop of Object.keys(fiber.props)) {
            if (isEvent(prop)) {
                const eventName = prop.toLowerCase().substring(2);

                fiber.dom.removeEventListener(eventName, fiber.props[prop]);
                delete fiber.props[prop];
            } else if (typeof fiber.props[prop] === "function") {
                clearReactiveAttributes(fiber.props[prop]);
            }
        }

        fiber.dom.remove();
    }
    if (typeof fiber.type === "function") {
        cleanUpFC(fiber, fiber.props);
        // @ts-expect-error
        delete fiber.type;
    }
    fiber.props.children.forEach((child) => commitDeletion(child, true));
}

function setRenderFunction(fiber: Fiber) {
    if (!fiber.renderFunction) return;
    setReactiveFunction(fiber.renderFunction, fiber);
}

export function updateFiber(prevFiber: Fiber, newValue) {
    // console.log("Prev value", prevFiber, newValue);
    startTime = performance.now();
    if (isPrimitive(newValue)) {
        // console.log(fiber, newValue);
        const newFragment: Fiber = {
            ...createTextChildren(newValue),
            parent: prevFiber.parent,
        };
        createFiber(newFragment);
        // console.log("New Text Fiber", newFragment);

        updateNode(prevFiber, newFragment);
    } else if (Array.isArray(newValue)) {
        const isFragment = newValue[FRAGMENT_SYMBOL];

        const newFragment: Fiber = {
            type: "FRAGMENT",
            props: {
                children: isFragment ? newValue : createChildren(newValue),
            },
            parent: prevFiber.parent,
        };

        createFiber(newFragment);
        updateNode(prevFiber, newFragment);
    } else {
        const newFragment = { ...newValue, parent: prevFiber.parent };
        createFiber(newFragment);
        // console.log("New Node Fiber", newFragment);
        updateNode(prevFiber, newFragment);
    }
    const endTime = performance.now();
    console.log("Update Time:", (endTime - startTime).toFixed(2), "ms");
}

function replaceRenderFunction(prev: Fiber, next: Fiber) {
    if (prev.renderFunction) {
        next.renderFunction = prev.renderFunction;
        // console.log("Replace render function", prev, next);
        // deleteReactiveFunction(prev.renderFunction);
        setRenderFunction(next);
    }
}

function replaceChildFromParent(prev: Fiber, next: Fiber, index?: number) {
    if (index !== undefined) {
        prev.parent.props.children[index] = next;
        return;
    }
    prev.parent?.props.children.forEach((child, i) => {
        if (child === prev) {
            prev.parent.props.children[i] = next;
        }
    });
}

export const isEvent = (key: string) => key.startsWith("on");
export const isProperty = (key: string) =>
    key !== "children" && !isEvent(key) && key !== "key";
const isNew = (prev: any, next: any, key: string) => prev[key] !== next[key];
const isGone = (prev: any, next: any, key: string) => !(key in next);

function deepCompareFibers(fiberA: any, fiberB: any): boolean {
    // Fast path: identical references
    if (fiberA === fiberB) {
        return true;
    }

    // Compare the fiber types (e.g., function for FCs, string for DOM nodes)
    if (fiberA.type !== fiberB.type) {
        return false;
    }

    // Compare keys if they exist
    if (fiberA.props?.key !== fiberB.props?.key) {
        return false;
    }
    return deepEqual(fiberA.props, fiberB.props);
}

function deepEqual(objA: any, objB: any): boolean {
    if (objA === objB) {
        // console.log("Signal prop");

        if (objA instanceof BaseSignal && objB instanceof BaseSignal)
            return deepEqual(objA.value, objB.value);
        if (Array.isArray(objA) && Array.isArray(objB)) {
            if (objA.length !== objB.length) return false;
            for (let i = 0; i < objA.length; i++) {
                if (!deepEqual(objA[i], objB[i])) return false;
            }
        }
        return true;
    } // Same reference or primitive value

    if (isPrimitive(objA) && isPrimitive(objB)) {
        return objA === objB; // One is not an object or is null
    }

    if (typeof objA !== typeof objB) return false;

    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) return false; // Different number of keys

    for (let key of keysA) {
        if (key === "children") continue;
        if (!keysB.includes(key)) return false; // Missing key in one of them
        if (!deepEqual(objA[key], objB[key])) return false; // Recurse for nested objects/arrays
    }

    return true;
}

function findFirstDom(fiber: Fiber): HTMLElement | Text | undefined {
    if (!fiber) return;

    if (fiber.dom) return fiber.dom;

    for (const child of fiber.props.children) {
        const dom = findFirstDom(child);
        if (dom) return dom;
    }
}
// function findFirstChildDom(fiber: Fiber): HTMLElement | Text | undefined {
//     if (!fiber) return;

//     for (const child of fiber.props.children) {
//         const dom = findFirstDom(child);
//         if (dom) return dom;
//     }
// }
function findLastDom(fiber: Fiber): HTMLElement | Text | undefined {
    if (!fiber) return;

    if (fiber.dom) return fiber.dom;

    for (let i = fiber.props.children.length - 1; i >= 0; i--) {
        const child = fiber.props.children[i];
        const dom = findLastDom(child);
        if (dom) return dom;
    }
}
function findLastChildDom(fiber: Fiber): HTMLElement | Text | undefined {
    if (!fiber) return;

    for (let i = fiber.props.children.length - 1; i >= 0; i--) {
        const child = fiber.props.children[i];
        const dom = findLastDom(child);
        if (dom) return dom;
    }
}
function findParentFiberWithDom(fiber: Fiber): Fiber | undefined {
    if (!fiber) return;
    let fiberParent = fiber.parent;
    while (fiberParent && !fiberParent.dom) {
        fiberParent = fiberParent.parent;
    }
    return fiberParent;
}
function findNearestParentWithDom(fiber: Fiber): Fiber | undefined {
    if (!fiber) return;
    if (fiber.dom) return fiber;

    let fiberParent = fiber.parent;
    while (fiberParent && !fiberParent.dom) {
        fiberParent = fiberParent.parent;
    }
    return fiberParent;
}

function updateNode(
    prev: Fiber | undefined,
    next: Fiber | undefined,
    index?: number
) {
    if (!prev && !next) return;

    if (prev && !next) {
        commitDeletion(prev, true);
        // console.log("to remove", prev);
        prev.parent.props.children = prev.parent.props.children.filter(
            (child) => child !== prev
        );
    } else if (prev && next) {
        const prevProps = prev.props;
        const nextProps = next.props;
        if (prev.type === "FRAGMENT" || typeof prev.type === "function") {
            // PREV IS FRAGMENT
            if (next.type === "FRAGMENT" || typeof next.type === "function") {
                // console.log("Fragment-Fragment", prev, next);
                if (
                    typeof prev.type === typeof next.type &&
                    typeof prev.type === "function"
                ) {
                    const areSame = deepCompareFibers(prev, next);
                    if (!areSame) {
                        commitFiber(next, findFirstDom(prev), undefined, true);

                        commitDeletion(prev);
                        replaceChildFromParent(prev, next, index);
                        // console.log(prev.parent.props.children, next, index);
                    }
                } else {
                    // console.log("fragment-fragment", { ...prev }, next);

                    updateChildren(prev, next);
                }
                // replaceChildFromParent(prev, next);
            } else {
                // console.log("Fragment-Node", prev, next);
                next.parent = prev.parent;
                let firstChild: Fiber | undefined = prev.props.children[0];
                while (firstChild && !firstChild.dom)
                    firstChild = firstChild.props.children[0];
                replaceRenderFunction(prev, next);
                commitFiber(next, firstChild?.dom);

                // removing all nodes of previous fragment
                commitDeletion(prev);
                replaceChildFromParent(prev, next, index);
            }
        } else {
            // PREV IS NODE

            const node = prev.dom;
            if (
                prev.type === "TEXT_CHILD" &&
                next.type === "TEXT_CHILD" &&
                !next.dom
            )
                next.dom = prev.dom;
            if (node === undefined) {
                console.error("no node found", prev, next);
                return;
            }
            // console.log(prev);
            if (next.type === "FRAGMENT" || typeof next.type === "function") {
                // console.log("Node-Fragment");
                next.parent = prev.parent;
                replaceRenderFunction(prev, next);

                commitFiber(next, node);
                commitDeletion(prev);
                replaceChildFromParent(prev, next, index);
            } else {
                // console.log("Node-Node");
                // remove old properties and event listeners from NODE
                for (const prop of Object.keys(prevProps)) {
                    if (
                        isProperty(prop) &&
                        isGone(prevProps, nextProps, prop)
                    ) {
                        node[prop] = "";
                        // console.log("property removed", prop);
                    } else if (
                        isEvent(prop) &&
                        (!(prop in nextProps) ||
                            isNew(prevProps, nextProps, prop))
                    ) {
                        const eventName = prop.toLowerCase().substring(2);

                        node.removeEventListener(eventName, prevProps[prop]);
                        // console.log("event listener removed", prop);
                    }
                }
                if (prev.type !== next.type) {
                    // console.log("Different type", prev, next);
                    next.parent = prev.parent;

                    replaceRenderFunction(prev, next);

                    commitFiber(next, node, true);
                    commitDeletion(prev);
                    replaceChildFromParent(prev, next, index);

                    // console.log(prev.parent);
                } else {
                    // add new properties
                    // console.log("same type", prev, next);

                    for (const prop of Object.keys(nextProps)) {
                        if (
                            isProperty(prop) &&
                            isNew(prevProps, nextProps, prop)
                        ) {
                            node[prop] = nextProps[prop];
                            // console.log(
                            //     "property added",
                            //     prop,
                            //     nextProps[prop]
                            // );
                            prevProps[prop] = nextProps[prop];
                        } else if (
                            isEvent(prop) &&
                            isNew(prevProps, nextProps, prop)
                        ) {
                            const eventName = prop.toLowerCase().substring(2);
                            // console.log("event listener added", prop);
                            node.addEventListener(eventName, nextProps[prop]);
                            prevProps[prop] = nextProps[prop];
                        }
                    }
                    updateChildren(prev, next);
                }
            }
        }
    }
}

function reconcileList(prev: Fiber, next: Fiber) {
    const oldFibers = prev.props.children;
    const newFibers = next.props.children;

    // Create a map from key to fiber for oldFibers.
    const oldMap: Record<string, any> = {};
    for (let i = 0; i < oldFibers.length; i++) {
        const key = oldFibers[i].props.key;
        if (
            key === null ||
            key === undefined ||
            oldMap.hasOwnProperty(String(key))
        ) {
            // If any fiber is missing a key, we cannot reconcile.
            // oldFibers[i].props.key =
            return false;
        }
        oldMap[String(key)] = oldFibers[i];
    }
    const referenceNode = findLastChildDom(prev)?.nextSibling as
        | Node
        | undefined;
    // Create newChildren array based on newFibers order.
    const fiberParent = findParentFiberWithDom(prev);
    const fragment = document.createDocumentFragment();

    if (newFibers.length === 0) {
        prev.props.children.length = 0;
        if (fiberParent?.dom instanceof HTMLElement)
            fiberParent.dom.innerHTML = "";
        return;
    }
    const prevLen = prev.props.children.length;

    // const newChildren = new Array(newFibers.length);
    for (let i = 0; i < newFibers.length; i++) {
        const newFiber = newFibers[i];
        const key = newFiber.props.key;
        const keyStr = String(key);
        // If the fiber exists in the old list, reuse it.
        if (oldMap.hasOwnProperty(keyStr)) {
            const oldFiber = oldMap[keyStr];

            if (prevLen > i) prev.props.children[i] = oldFiber;
            else prev.props.children.push(oldFiber);

            delete oldMap[keyStr];

            const newFiber = next.props.children[i];

            if (newFiber) newFiber.parent = prev;

            updateNode(oldFiber, newFiber, i);
            applyFiber(prev.props.children[i], fragment, referenceNode);
        } else {
            // Otherwise, use the new fiber.
            // console.log(first)
            if (prevLen > i) prev.props.children[i] = newFiber;
            else prev.props.children.push(newFiber);

            newFiber.parent = prev;
            commitFiber(newFiber, referenceNode, false, false, fragment);
        }
    }
    for (const key in oldMap) {
        if (oldMap.hasOwnProperty(key)) {
            const fiber = oldMap[key];
            commitDeletion(fiber, true);
        }
    }
    while (prev.props.children.length > next.props.children.length) {
        prev.props.children.pop();
    }

    fiberParent?.dom?.appendChild(fragment);
}

function applyFiber(fiber: Fiber, parent: Node, referenceNode?: Node) {
    if (fiber.dom) {
        if (fiber.dom === parent || fiber.dom === referenceNode) return;
        if (referenceNode) {
            parent.insertBefore(fiber.dom, referenceNode);
        } else parent.appendChild(fiber.dom);
    } else {
        for (const child of fiber.props.children) {
            applyFiber(child, parent, referenceNode);
        }
    }
}

function updateChildren(prev: Fiber, next: Fiber) {
    const isList =
        next.type === "FRAGMENT" && !next.props.children[FRAGMENT_SYMBOL];

    const wasList =
        prev.type === "FRAGMENT" && !prev.props.children[FRAGMENT_SYMBOL];

    // console.log(isList, wasList);

    if (isList && wasList) {
        const result = reconcileList(prev, next);
        if (result === false) {
            updateNonListChildrenWithKeys(prev, next);
        }
    } else {
        updateNonListChildrenWithKeys(prev, next);
    }
    if (next.type === "FRAGMENT" && next.props.children[FRAGMENT_SYMBOL]) {
        prev.props.children[FRAGMENT_SYMBOL] = true;
    } else {
        prev.props.children[FRAGMENT_SYMBOL] = false;
    }

    prev.type = next.type;
}

function updateNonListChildren(prev: Fiber, next: Fiber) {
    let len = Math.max(prev.props.children.length, next.props.children.length);
    for (let i = 0; i < len; i++) {
        let prevChild = prev.props.children[i];
        let nextChild = next.props.children[i];

        if (nextChild) nextChild.parent = prev;
        if (!prevChild && nextChild) {
            commitFiber(
                nextChild,
                // @ts-expect-error
                findLastDom(prev.props.children.at(-1))?.nextSibling
            );
            prev.props.children.push(nextChild);
        } else if (!nextChild && prevChild) {
            commitDeletion(prevChild, true);
            prev.props.children.splice(i, 1);
            len = prev.props.children.length;
            i--;
        } else {
            updateNode(prevChild, nextChild, i);
            const newLen = Math.max(
                prev.props.children.length,
                next.props.children.length
            );
            if (newLen < len) {
                len = newLen;
                i--;
            }
        }
    }
}

function updateNonListChildrenWithKeys(prev: Fiber, next: Fiber) {
    let len = Math.max(prev.props.children.length, next.props.children.length);
    const oldMap: Record<string, { fiber: Fiber; index: number }> = {};
    let count = 0;
    for (let i = 0; i < prev.props.children.length; i++) {
        const key = prev.props.children[i].props.key;
        if (key === null || key === undefined) {
            continue;
        }
        count++;
        if (oldMap.hasOwnProperty(String(key))) {
            console.warn("Found two children with the same key", key);
            console.warn(
                "When two fibers are found having same key the whole children will default to manual updates, which can be slower than with key based reconciliation"
            );
            updateNonListChildren(prev, next);
            return;
        }
        oldMap[String(key)] = { fiber: prev.props.children[i], index: i };
    }
    if (count == 0) {
        updateNonListChildren(prev, next);
    }
    const newMap: Record<
        string,
        { fiber: Fiber; newIndex: number; oldIndex: number }
    > = {};

    for (let i = 0; i < next.props.children.length; i++) {
        const key = next.props.children[i].props.key;
        if (key === null || key === undefined) {
            continue;
        }
        const oldFiber = oldMap[String(key)];
        if (oldFiber) {
            if (newMap.hasOwnProperty(String(key))) {
                console.warn("Found two children with the same key", key);
                console.warn(
                    "When two fibers are found having same key the whole children will default to manual updates, which can be slower than with key based reconciliation"
                );
                updateNonListChildren(prev, next);
                return;
            }
            newMap[String(key)] = {
                fiber: oldFiber.fiber,
                newIndex: i,
                oldIndex: oldFiber.index,
            };
        }
    }
    // console.log(prev, next);
    const parent = findNearestParentWithDom(prev);

    for (let i = 0; i < len; i++) {
        let prevChild = prev.props.children[i];
        let nextChild = next.props.children[i];
        // console.log(prevChild, nextChild);

        const nextKey = nextChild?.props.key ? String(nextChild.props.key) : "";
        const isReused = newMap.hasOwnProperty(nextKey);

        let prevKey = prevChild?.props.key ? String(prevChild.props.key) : "";

        if (prevKey && nextKey && prevKey === nextKey) {
            // console.log("same", prevChild, nextChild);
            updateNode(prevChild, nextChild, i);

            if (parent?.dom) applyFiber(prev.props.children[i], parent.dom);
            continue;
        }

        const isUsedLater =
            newMap.hasOwnProperty(prevKey) && newMap[prevKey].newIndex > i;
        const isUsedPreviously =
            newMap.hasOwnProperty(prevKey) && newMap[prevKey].newIndex < i;

        if (isUsedLater || isUsedPreviously) {
            ToCommitDeletion = false;
        }

        if (nextChild) nextChild.parent = prev;

        if (!prevChild && nextChild) {
            if (isReused) {
                const { fiber } = newMap[nextKey];

                prev.props.children.push(fiber);

                updateNode(fiber, nextChild, i);

                if (parent?.dom) applyFiber(prev.props.children[i], parent.dom);
            } else {
                // needCreation just creates parent child heirarchy
                if (parent?.dom)
                    commitFiber(nextChild, undefined, false, false, parent.dom);
                prev.props.children.push(nextChild);
            }
        } else if (!nextChild && prevChild) {
            commitDeletion(prevChild, true);
            prev.props.children.splice(i, 1);
            len = prev.props.children.length;
            i--;
        } else {
            if (isReused) {
                const { fiber } = newMap[nextKey];

                commitDeletion(prevChild, true);
                // because updateNode can call commitDeletion internally
                ToCommitDeletion = true;

                prev.props.children[i] = fiber;

                updateNode(fiber, nextChild, i);

                if (parent?.dom) applyFiber(prev.props.children[i], parent.dom);
            } else {
                // console.log(ToCommitDeletion);
                if (isUsedLater || isUsedPreviously) {
                    if (parent?.dom)
                        commitFiber(
                            nextChild,
                            undefined,
                            false,
                            false,
                            parent.dom
                        );
                    prev.props.children[i] = nextChild;
                } else {
                    updateNode(prevChild, nextChild, i);
                    if (parent?.dom)
                        applyFiber(prev.props.children[i], parent.dom);

                    const newLen = Math.max(
                        prev.props.children.length,
                        next.props.children.length
                    );
                    if (newLen < len) {
                        len = newLen;
                        i--;
                    }
                }
            }
        }
        ToCommitDeletion = true;
    }
    // console.log(prev.props.children, next.props.children);
}

// @ts-expect-error
if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
    // @ts-expect-error
    module.exports = {
        createFiber,
        commitDeletion,
        commitFiber,
        updateFiber,
        deepCompareFibers,
        deepEqual,
    };
}
