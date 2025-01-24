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
        if (!fiber.dom) fiber.dom = createNode(fiber);

        for (const child of fiber.props.children) {
            child.parent = fiber;
            createFiber(child);
        }
    }
    // console.log(fiber);
    setRenderFunction(fiber);
}
function commitFiber(fiber: Fiber, referenceNode?: Node) {
    if (fiber.type === "FRAGMENT" || typeof fiber.type === "function") {
        for (const child of fiber.props.children) {
            commitFiber(child, referenceNode);
        }
    } else {
        if (fiber.dom) {
            let fiberParent: Fiber | undefined = fiber.parent;
            while (fiberParent && !fiberParent.dom) {
                fiberParent = fiberParent.parent;
            }
            if (referenceNode)
                fiberParent?.dom?.insertBefore(fiber.dom, referenceNode);
            else fiberParent?.dom?.appendChild(fiber.dom);
        }
        for (const child of fiber.props.children) {
            commitFiber(child);
        }
    }
}

function setRenderFunction(fiber: Fiber) {
    if (!fiber.renderFunction) return;

    setReactiveFunction(fiber.renderFunction, (newValue) => {
        console.log(newValue, "New Value");
        if (isPrimitive(newValue)) {
            // console.log(fiber, newValue);
            updateNode(fiber, createTextChildren(String(newValue)));
        } else if (Array.isArray(newValue)) {
            const newFragment: Fiber = {
                type: "FRAGMENT",
                props: {
                    children: createChildren(newValue),
                },
                parent: fiber.parent,
            };

            updateNode(fiber, newFragment);
        } else {
            console.log("update non primitive", fiber, newValue);
            updateNode(fiber, newValue);
        }
    });
}

export const isEvent = (key: string) => key.startsWith("on");
export const isProperty = (key: string) => key !== "children" && !isEvent(key);
const isNew = (prev: any, next: any, key: string) => prev[key] !== next[key];
const isGone = (prev: any, next: any, key: string) => !(key in next);

function updateNode(prev: Fiber, next: Fiber): Fiber | undefined {
    const prevProps = prev?.props;
    const nextProps = next?.props;
    const node = prev?.dom;
    if (!node && prev.type === "FRAGMENT") {
        // Cases:
        // Fragment-Fragment
        // Fragment-Node
        // Fragment-FC
        next.parent = prev.parent;
        if (prev.renderFunction) {
            next.renderFunction = prev.renderFunction;

            console.log("resetting render function");
            setRenderFunction(next);
        }
        createFiber(next);
        if (next.dom) {
            // Fragment-Node
            commitFiber(next, prev.props.children[0].dom);

            // removing all nodes of previous fragment
            for (const child of prev.props.children) {
                if (child.dom) prev.parent?.dom?.removeChild(child.dom);
            }
            prev.parent?.props.children.forEach((child, i) => {
                if (child === prev) {
                    // @ts-expect-error
                    prev.parent.props.children[i] = next;
                }
            });
            console.log("New fiber commited", next);
        } else if (next.type === "FRAGMENT") {
            // Fragment-Fragment
        } else if (typeof next.type === "function") {
            // Fragment-FC
        } else {
            console.log("UnknownCase", prev, next);
        }
        return;
    } else if (!node && typeof prev.type === "function") {
        // Cases:
        // FC-Fragment
        // FC-Node
        // FC-FC
        return;
    } else {
        if (!node) return;
    }

    // remove old properties and event listeners from NODE
    for (const prop of Object.keys(prevProps)) {
        if (isProperty(prop) && isGone(prevProps, nextProps, prop)) {
            node[prop] = "";
            console.log("property removed", prop);
        } else if (
            isEvent(prop) &&
            (!(prop in nextProps) || isNew(prevProps, nextProps, prop))
        ) {
            const eventName = prop.toLowerCase().substring(2);

            node.removeEventListener(eventName, prevProps[prop]);
            console.log("event listener removed", prop);
        }
    }
    if (prev.type !== next.type) {
        // prev.dom = undefined;
        next.parent = prev.parent;
        createFiber(next);
        console.log("Different type", prev, next);
        if (prev.renderFunction) {
            next.renderFunction = prev.renderFunction;

            console.log("resetting render function");
            setRenderFunction(next);
        }
        const parent = prev.parent;
        if (parent?.dom) {
            if (next.dom) {
                commitFiber(next);
                parent.props.children.forEach((child, i) => {
                    if (child === prev) {
                        parent.props.children[i] = next;
                    }
                });
                parent.dom.replaceChild(next.dom, node);
            } else if (next.type === "FRAGMENT") {
                commitFiber(next, node);
                parent.dom.removeChild(node);
                parent.props.children.forEach((child, i) => {
                    if (child === prev) {
                        parent.props.children[i] = next;
                    }
                });
            } else if (typeof next.type === "function") {
                console.log("Replacing node with a function component");
            }
        }
    } else {
        // add new properties
        console.log("same type");
        for (const prop of Object.keys(nextProps)) {
            if (isProperty(prop) && isNew(prevProps, nextProps, prop)) {
                node[prop] = nextProps[prop];
                console.log("property added", prop, nextProps[prop]);
                prevProps[prop] = nextProps[prop];
            } else if (isEvent(prop) && isNew(prevProps, nextProps, prop)) {
                const eventName = prop.toLowerCase().substring(2);
                console.log("event listener added", prop);
                node.addEventListener(eventName, nextProps[prop]);
                prevProps[prop] = nextProps[prop];
            }
        }
        const len = Math.max(
            prevProps.children.length,
            nextProps.children.length
        );
        for (let i = 0; i < len; i++) {
            const prevChild = prevProps.children[i];
            const nextChild = nextProps.children[i];

            if (!prevChild) {
                nextChild.parent = prev;
                createFiber(nextChild);
                console.log("To insert new ", nextChild);

                if (nextChild.dom) {
                    commitFiber(nextChild);
                    node.appendChild(nextChild.dom);

                    prev.props.children.push(nextChild);
                } else {
                    console.log("To insert new node that does not have a dom");
                }

                return;
            } else if (prevChild.dom && !nextChild) {
                console.log("extra prevChildNode removed", prevChild);
                prev.props.children = prev.props.children.filter(
                    (child) => child !== prevChild
                );
                node.removeChild(prevChild.dom);
            } else {
                updateNode(prevChild, nextChild);
            }
        }
    }
}
