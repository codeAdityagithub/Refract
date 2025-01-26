import { setReactiveFunction } from "../signals/batch";
import { Fiber } from "../types";
import { isPrimitive } from "../utils/general";
import {
    createChildren,
    createNode,
    createTextChildren,
} from "./createElements";

export function render(element: Fiber, container: HTMLElement) {
    // const fragment = document.createDocumentFragment();
    const rootFiber: Fiber = {
        type: "div",
        props: {
            children: [element],
        },
        dom: container,
    };
    // console.log(element.type(element.props));
    element.parent = rootFiber;
    renderNode(element);
    // container.appendChild(fragment);
}

let elements: Fiber[] = [];

function workLoop(deadline: IdleDeadline) {
    let shouldYield = false;
    while (elements.length > 0 && !shouldYield) {
        const element = elements.pop();
        renderNode(element!);
        shouldYield = deadline.timeRemaining() < 1;
    }

    if (elements.length == 0) {
        return;
    }
    requestIdleCallback(workLoop);
}
requestIdleCallback(workLoop);

function renderNode(fiber: Fiber) {
    if (fiber.type === "FRAGMENT") {
        for (let i = fiber.props.children.length - 1; i >= 0; i--) {
            fiber.props.children[i].parent = fiber;
            elements.push(fiber.props.children[i]);
        }
    } else if (typeof fiber.type === "function") {
        const children = fiber.type(fiber.props);
        fiber.type = "FRAGMENT";
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
        for (const child of fiber.props.children) {
            child.parent = fiber;
            createFiber(child);
        }
    } else if (typeof fiber.type === "function") {
        const children = fiber.type(fiber.props);
        fiber.type = "FRAGMENT";
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

function commitDeletion(fiber: Fiber) {
    if (fiber.dom) fiber.dom.remove();
    else {
        fiber.props.children.forEach((child) => commitDeletion(child));
    }
}

function setRenderFunction(fiber: Fiber) {
    if (!fiber.renderFunction) return;

    setReactiveFunction(fiber.renderFunction, (newValue) => {
        console.log("Prev value", fiber);
        if (isPrimitive(newValue)) {
            // console.log(fiber, newValue);
            const newFragment: Fiber = {
                ...createTextChildren(String(newValue)),
                parent: fiber.parent,
            };
            createFiber(newFragment);
            console.log("New Text Fiber", newFragment);

            updateNode(fiber, newFragment);
        } else if (Array.isArray(newValue)) {
            const newFragment: Fiber = {
                type: "FRAGMENT",
                props: {
                    children: createChildren(newValue),
                },
                parent: fiber.parent,
            };
            createFiber(newFragment);
            console.log("New Fragment Fiber", newValue);
            updateNode(fiber, newFragment);
        } else {
            const newFragment = { ...newValue, parent: fiber.parent };
            createFiber(newFragment);
            console.log("New Node Fiber", newFragment);
            updateNode(fiber, newFragment);
        }
    });
}

function replaceRenderFunction(prev: Fiber, next: Fiber) {
    if (prev.renderFunction) {
        next.renderFunction = prev.renderFunction;
        setRenderFunction(next);
    }
}

function replaceChildFromParent(prev: Fiber, next: Fiber) {
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

function updateNode(prev: Fiber | undefined, next: Fiber | undefined) {
    if (!prev && !next) return;

    if (prev && !next) {
        commitDeletion(prev);
        console.log("to remove", prev);
        prev.parent.props.children = prev.parent.props.children.filter(
            (child) => child !== prev
        );
    } else if (prev && next) {
        const prevProps = prev.props;
        const nextProps = next.props;
        if (prev.type === "FRAGMENT") {
            // PREV IS FRAGMENT
            if (next.type === "FRAGMENT") {
                console.log("Fragment-Fragment");
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
                replaceChildFromParent(prev, next);
            }
        } else if (typeof prev.type === "function") {
            // PREV IS FC
            console.error("How is prev fragment");
        } else {
            // PREV IS NODE
            if (
                prev.props.key === next.props.key &&
                prev.type === next.type &&
                prev.props.key
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
                console.log("no node found", prev, next);
                return;
            }
            // console.log(prev);
            if (next.type === "FRAGMENT") {
                // console.log("Node-Fragment");
                next.parent = prev.parent;
                replaceRenderFunction(prev, next);

                commitFiber(next, node);
                node.remove();
                replaceChildFromParent(prev, next);
            } else if (typeof next.type === "function") {
                console.error("How is next fragment");
            } else {
                // console.log("Node-Node");
                // remove old properties and event listeners from NODE
                for (const prop of Object.keys(prevProps)) {
                    if (
                        isProperty(prop) &&
                        isGone(prevProps, nextProps, prop)
                    ) {
                        node[prop] = "";
                        console.log("property removed", prop);
                    } else if (
                        isEvent(prop) &&
                        (!(prop in nextProps) ||
                            isNew(prevProps, nextProps, prop))
                    ) {
                        const eventName = prop.toLowerCase().substring(2);

                        node.removeEventListener(eventName, prevProps[prop]);
                        console.log("event listener removed", prop);
                    }
                }
                if (prev.type !== next.type) {
                    // console.log("Different type", prev, next);
                    next.parent = prev.parent;

                    replaceRenderFunction(prev, next);

                    commitFiber(next, node, true);
                    replaceChildFromParent(prev, next);

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
                            console.log(
                                "property added",
                                prop,
                                nextProps[prop]
                            );
                            prevProps[prop] = nextProps[prop];
                        } else if (
                            isEvent(prop) &&
                            isNew(prevProps, nextProps, prop)
                        ) {
                            const eventName = prop.toLowerCase().substring(2);
                            console.log("event listener added", prop);
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

function updateChildren(prev: Fiber, next: Fiber) {
    let len = Math.max(prev.props.children.length, next.props.children.length);

    for (let i = 0; i < len; i++) {
        const prevChild = prev.props.children[i];
        const nextChild = next.props.children[i];

        if (nextChild) nextChild.parent = prev;
        if (!prevChild && nextChild) {
            // console.log(
            //     "To insert new ",
            //     nextChild,
            //     // prev.props.children.at(-1)?.dom?.nextSibling
            // );

            commitFiber(
                nextChild,
                // @ts-expect-error
                prev.props.children.at(-1)?.dom?.nextSibling
            );
            prev.props.children.push(nextChild);
        } else {
            console.log(
                "Updating child",
                prevChild,
                "with",
                nextChild,
                "of",
                prev
            );
            updateNode(prevChild, nextChild);
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
// function updateNode(prev: Fiber, next: Fiber): Fiber | undefined {
//     const prevProps = prev?.props;
//     const nextProps = next?.props;
//     const node = prev?.dom;
//     if (!node && prev.type === "FRAGMENT") {
//         next.parent = prev.parent;
//         if (prev.renderFunction && prev.type !== next.type) {
//             next.renderFunction = prev.renderFunction;

//             console.log("resetting render function");
//             setRenderFunction(next);
//         }
//         if (next.dom) {
//             // Fragment-Node
//             commitFiber(next, prev.props.children[0].dom);

//             // removing all nodes of previous fragment
//             for (const child of prev.props.children) {
//                 if (child.dom) prev.parent?.dom?.removeChild(child.dom);
//             }
//             prev.parent?.props.children.forEach((child, i) => {
//                 if (child === prev) {
//                     // @ts-expect-error
//                     prev.parent.props.children[i] = next;
//                 }
//             });
//             console.log("New fiber commited", next);
//         } else if (next.type === "FRAGMENT") {
//             // Fragment-Fragment
//             const len = Math.max(
//                 prevProps.children.length,
//                 nextProps.children.length
//             );
//             for (let i = 0; i < len; i++) {
//                 const prevChild = prevProps.children[i];
//                 const nextChild = nextProps.children[i];

//                 if (!prevChild) {
//                     nextChild.parent = prev;
//                     console.log("To insert new ", nextChild);

//                     if (nextChild.dom) {
//                         commitFiber(
//                             nextChild,
//                             // @ts-expect-error
//                             prev.props.children.at(-1)?.dom?.nextSibling
//                         );

//                         prev.props.children.push(nextChild);
//                     } else {
//                         console.log(
//                             "To insert new node that does not have a dom"
//                         );
//                     }

//                     return;
//                 } else if (prevChild.dom && !nextChild) {
//                     console.log("extra prevChildNode removed", prevChild);
//                     prev.props.children = prev.props.children.filter(
//                         (child) => child !== prevChild
//                     );
//                     prevChild.dom.remove();
//                 } else {
//                     updateNode(prevChild, nextChild);
//                 }
//             }
//             console.log("Fragment-Fragment", prev, next);
//         } else if (typeof next.type === "function") {
//             // Fragment-FC
//             console.log("Replace fragment with FC", prev, next);
//         } else {
//             console.log("UnknownCase", prev, next);
//         }
//         return;
//     } else if (!node && typeof prev.type === "function") {
//         // Cases:
//         next.parent = prev.parent;
//         if (prev.renderFunction && prev.type !== next.type) {
//             next.renderFunction = prev.renderFunction;

//             console.log("resetting render function");
//             setRenderFunction(next);
//         }
//         // FC-Node
//         if (next.dom) {
//             commitFiber(next, prev.props.children[0].dom);

//             // removing all nodes of previous FC
//             for (const child of prev.props.children) {
//                 if (child.dom) prev.parent?.dom?.removeChild(child.dom);
//             }
//             prev.parent?.props.children.forEach((child, i) => {
//                 if (child === prev) {
//                     // @ts-expect-error
//                     prev.parent.props.children[i] = next;
//                 }
//             });
//             console.log("next", next);
//         } else if (next.type === "FRAGMENT") {
//             console.log("FC-Fragment", prev, next);
//         }
//         return;
//     } else {
//         if (!node) return;
//     }

//     // remove old properties and event listeners from NODE
//     for (const prop of Object.keys(prevProps)) {
//         if (isProperty(prop) && isGone(prevProps, nextProps, prop)) {
//             node[prop] = "";
//             console.log("property removed", prop);
//         } else if (
//             isEvent(prop) &&
//             (!(prop in nextProps) || isNew(prevProps, nextProps, prop))
//         ) {
//             const eventName = prop.toLowerCase().substring(2);

//             node.removeEventListener(eventName, prevProps[prop]);
//             console.log("event listener removed", prop);
//         }
//     }
//     if (prev.type !== next.type) {
//         // prev.dom = undefined;

//         console.log("Different type", prev, next);
//         if (prev.renderFunction) {
//             next.renderFunction = prev.renderFunction;

//             console.log("resetting render function");
//             setRenderFunction(next);
//         }
//         const parent = prev.parent;
//         let parentDom: Fiber | undefined = parent;
//         while (parentDom && !parentDom.dom) parentDom = parentDom.parent;
//         if (parent) {
//             if (next.dom) {
//                 // Node-Node
//                 commitFiber(next);
//                 parent.props.children.forEach((child, i) => {
//                     if (child === prev) {
//                         parent.props.children[i] = next;
//                     }
//                 });
//                 parentDom?.dom?.replaceChild(next.dom, node);
//             } else if (next.type === "FRAGMENT") {
//                 // Node-Fragment
//                 commitFiber(next, node);
//                 parentDom?.dom?.removeChild(node);
//                 parent.props.children.forEach((child, i) => {
//                     if (child === prev) {
//                         parent.props.children[i] = next;
//                     }
//                 });
//             } else if (typeof next.type === "function") {
//                 // Node-FC
//                 commitFiber(next, node);
//                 parentDom?.dom?.removeChild(node);
//                 parent.props.children.forEach((child, i) => {
//                     if (child === prev) {
//                         parent.props.children[i] = next;
//                     }
//                 });
//                 console.log("Replacing node with a function component", next);
//             }
//         }
//     } else {
//         // add new properties
//         console.log("same type");
//         for (const prop of Object.keys(nextProps)) {
//             if (isProperty(prop) && isNew(prevProps, nextProps, prop)) {
//                 node[prop] = nextProps[prop];
//                 console.log("property added", prop, nextProps[prop]);
//                 prevProps[prop] = nextProps[prop];
//             } else if (isEvent(prop) && isNew(prevProps, nextProps, prop)) {
//                 const eventName = prop.toLowerCase().substring(2);
//                 console.log("event listener added", prop);
//                 node.addEventListener(eventName, nextProps[prop]);
//                 prevProps[prop] = nextProps[prop];
//             }
//         }
//         const len = Math.max(
//             prevProps.children.length,
//             nextProps.children.length
//         );
//         for (let i = 0; i < len; i++) {
//             const prevChild = prevProps.children[i];
//             const nextChild = nextProps.children[i];

//             if (!prevChild) {
//                 nextChild.parent = prev;
//                 console.log("To insert new ", nextChild);

//                 if (nextChild.dom) {
//                     commitFiber(nextChild);

//                     prev.props.children.push(nextChild);
//                 } else {
//                     console.log("To insert new node that does not have a dom");
//                 }

//                 return;
//             } else if (prevChild.dom && !nextChild) {
//                 console.log("extra node removed", prevChild);
//                 prev.props.children = prev.props.children.filter(
//                     (child) => child !== prevChild
//                 );
//                 node.removeChild(prevChild.dom);
//             } else {
//                 updateNode(prevChild, nextChild);
//             }
//         }
//     }
// }
