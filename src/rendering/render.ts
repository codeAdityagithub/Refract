import {
    clearReactiveAttributes,
    clearReactiveFunction,
    setReactiveFunction,
} from "../signals/batch";
import { Fiber } from "../types";
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
    renderNode(element);
    requestIdleCallback(workLoop);

    // container.appendChild(fragment);
}

function commitRootFragment() {
    if (rootFragment && rootContainer) {
        rootContainer.appendChild(rootFragment);
    }
}

let elements: Fiber[] = [];
let rootContainer: HTMLElement | null = null;
let rootFragment: DocumentFragment | null = null;

function workLoop(deadline: IdleDeadline) {
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
                !fiber.props.children[i].props.key &&
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
        setCurrentFC(fiber.type);

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
            renderNode(children);
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
    } else if (typeof fiber.type === "function") {
        setCurrentFC(fiber.type);
        const children = fiber.type(fiber.props);
        clearCurrentFC();
        // fiber.type = "FRAGMENT";
        if (Array.isArray(children)) {
            // which means that the FC returned a fragment
            // console.log(children);
            for (const child of children) {
                child.parent = fiber;
                createFiber(child);
            }
            fiber.props.children = children;
        } else {
            children.parent = fiber;
            fiber.props.children.push(children);
            createFiber(children);
        }
    } else {
        for (const child of fiber.props.children) {
            child.parent = fiber;
            createFiber(child);
        }
    }
    // console.log(fiber);
    setRenderFunction(fiber);
}
function commitFiber(fiber: Fiber, referenceNode?: Node, replace?: boolean) {
    if (fiber.type === "FRAGMENT" || typeof fiber.type === "function") {
        for (const child of fiber.props.children) {
            commitFiber(child, referenceNode, replace);
        }
    } else {
        if (!fiber.dom) fiber.dom = createNode(fiber);

        let fiberParent: Fiber | undefined = fiber.parent;
        while (fiberParent && !fiberParent.dom) {
            fiberParent = fiberParent.parent;
        }
        if (referenceNode) {
            if (replace)
                fiberParent?.dom?.replaceChild(fiber.dom, referenceNode);
            else fiberParent?.dom?.insertBefore(fiber.dom, referenceNode);
        } else fiberParent?.dom?.appendChild(fiber.dom);
        for (const child of fiber.props.children) {
            commitFiber(child);
        }
    }
}

function commitDeletion(fiber: Fiber, toClearReactiveFunction?: boolean) {
    if (!fiber) return;
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
        cleanUpFC(fiber.type, fiber.props);
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
    prev.parent.props.children.forEach((child, i) => {
        if (child === prev) {
            prev.parent.props.children[i] = next;
        }
    });
}

export const isEvent = (key: string) => key.startsWith("on");
export const isProperty = (key: string) => key !== "children" && !isEvent(key);
const isNew = (prev: any, next: any, key: string) => prev[key] !== next[key];
const isGone = (prev: any, next: any, key: string) => !(key in next);

function updateNode(
    prev: Fiber | undefined,
    next: Fiber | undefined,
    index?: number
) {
    if (!prev && !next) return;

    if (prev && !next) {
        commitDeletion(prev);
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
                // console.log("Fragment-Fragment");
                updateChildren(prev, next);
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
            if (
                prev.props.key &&
                prev.props.key === next.props.key &&
                prev.type === next.type
            ) {
                console.log("Same key", prev.props.key);
                return;
            }
            const node = prev.dom;
            if (
                prev.type === "TEXT_CHILD" &&
                next.type === "TEXT_CHILD" &&
                !next.dom
            )
                next.dom = prev.dom;
            if (!node) {
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

// function findKeySwaps(oldFibers: FiberChildren, newFibers: FiberChildren) {
//     const swaps: Record<string, { from: number; to: number }> = {};

//     // Map each fiber's key to its index in the old array
//     const oldFiberMap = oldFibers.reduce((map, fiber, index) => {
//         if (fiber.props.key) map[fiber.props.key] = index;
//         return map;
//     }, {});

//     // Compare the new fibers with the old fiber map to detect swaps
//     newFibers.forEach((newFiber, newIndex) => {
//         if (newFiber.props.key) {
//             const oldIndex = oldFiberMap[newFiber.props.key];
//             if (oldIndex !== undefined && oldIndex !== newIndex) {
//                 // This indicates a swap

//                 swaps[newFiber.props.key] = {
//                     from: oldIndex,
//                     to: newIndex,
//                 };
//             }
//         }
//     });

//     return swaps;
// }
function updateChildren(prev: Fiber, next: Fiber) {
    let len = Math.max(prev.props.children.length, next.props.children.length);
    // const swaps = findKeySwaps(prev.props.children, next.props.children);
    // console.log(swaps);
    const isFragment =
        next.props.children[FRAGMENT_SYMBOL] || typeof next.type === "function";
    const wasFragment =
        prev.props.children[FRAGMENT_SYMBOL] || typeof prev.type === "function";

    if (!isFragment && !wasFragment) {
        // console.log("Array was updated to array or was modified");
    }

    for (let i = 0; i < len; i++) {
        let prevChild = prev.props.children[i];
        let nextChild = next.props.children[i];

        if (nextChild) nextChild.parent = prev;
        if (!prevChild && nextChild) {
            commitFiber(
                nextChild,
                // @ts-expect-error
                prev.props.children.at(-1)?.dom?.nextSibling
            );
            prev.props.children.push(nextChild);
        } else {
            // console.log(
            //     "Updating child",
            //     prevChild,
            //     "with",
            //     nextChild,
            //     "of",
            //     prev
            // );
            // const prevSwap = swaps[prevChild.props.key];
            // const nextSwap = swaps[nextChild.props.key];
            // if (prevSwap && nextSwap) {
            //     console.log("Swap", prevSwap, nextSwap);
            // } else if (prevSwap) {
            //     console.log("Prev swap", prevSwap);
            // } else if (nextSwap) {
            //     console.log("Next swap", nextSwap);
            // }
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
    if (isFragment) {
        prev.props.children[FRAGMENT_SYMBOL] = true;
    } else {
        prev.props.children[FRAGMENT_SYMBOL] = false;
    }
    prev.type = next.type;
}
// @ts-expect-error
if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
    // @ts-expect-error
    module.exports = { createFiber, commitDeletion, commitFiber, updateFiber };
}
