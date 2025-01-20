import { clearReactiveFunction, setReactiveFunction } from "../signals/batch";
import { Element, Fiber, FunctionFiber, NodeFiber } from "../types";
import { isPrimitive } from "../utils/general";
import { createNode, createTextChildren } from "./createElements";

export function render(element: Fiber, container: HTMLElement) {
    fiberRoot = {
        dom: container,
        props: {
            children: [element],
        },
        type: "div",
    };
    deletions = [];
    nextUnitOfWork = fiberRoot;
}
function commitRoot() {
    if (!fiberRoot) return;
    // deletions?.forEach((fiber) => commitWork(fiber as CompletedFiber));

    commitWork(fiberRoot.child);

    // currentFiberRoot = fiberRoot as CompletedFiber;

    // fiberRoot = null;
}

function commitWork(fiber: Fiber | undefined) {
    if (!fiber) return;
    let parentFiber = fiber.parent;

    while (!parentFiber?.dom) {
        // console.log(parentFiber);
        // for fragments of functional components
        parentFiber = parentFiber.parent;
    }
    const parentNode = parentFiber?.dom;
    if (parentNode && fiber.dom) {
        // console.log(fiber);
        if (fiber.dom) parentNode.appendChild(fiber.dom);
        setRenderFunction(fiber);
    }
    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

function setRenderFunction(fiber: Fiber) {
    if (!fiber.renderFunction) return;

    setReactiveFunction(fiber.renderFunction, (newValue) => {
        console.log(newValue, "New Value");
        if (isPrimitive(newValue)) {
            console.log(fiber, newValue);
            updateNode(fiber, createTextChildren(String(newValue)));
        } else {
            console.log("update non primitive", fiber, newValue);
            updateNode(fiber, newValue);
        }
    });
}
let nextUnitOfWork: Fiber | null = null;
let fiberRoot: Fiber | null = null;
// let currentFiberRoot: CompletedFiber | undefined = undefined;

let deletions: Fiber[] | null = null;

function workLoop(deadline: IdleDeadline) {
    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        shouldYield = deadline.timeRemaining() < 1;
    }

    if (!nextUnitOfWork && fiberRoot) {
        commitRoot();
        fiberRoot = null;
        return;
    }
    requestIdleCallback(workLoop);
}
requestIdleCallback(workLoop);

function performUnitOfWork(fiber: Fiber): Fiber | null {
    if (fiber.type instanceof Function) {
        // @ts-expect-error
        updateFunctionComponent(fiber);
    } else if (fiber.type === "FRAGMENT") {
        updateFragmentComponent(fiber);
    } else {
        // @ts-expect-error
        updateHostComponent(fiber);
    }
    // console.log(fiber);
    if (fiber.child) return fiber.child;

    let nextFiber: Fiber | undefined = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) return nextFiber.sibling;
        nextFiber = nextFiber.parent;
    }
    return null;
}

function updateFunctionComponent(fiber: FunctionFiber) {
    const children = fiber.type(fiber.props);
    if (Array.isArray(children)) reconcileChildren(fiber, children);
    else reconcileChildren(fiber, [children]);
}
function updateFragmentComponent(fiber: Fiber) {
    const children = fiber.props.children;
    reconcileChildren(fiber, children);
}
function updateHostComponent(fiber: NodeFiber) {
    if (!fiber.dom) {
        fiber.dom = createNode(fiber);
    }
    reconcileChildren(fiber, fiber.props.children);
}

function reconcileChildren(fiber: Fiber, elements: Fiber[]) {
    let index = 0;

    // corresponds to elements[0]
    // let oldFiber = fiber.alternate?.child;
    let prevSibling: Fiber | undefined = undefined;

    while (index < elements.length) {
        const element = elements[index];
        // console.log(element);
        let newFiber: Fiber | undefined = undefined;

        newFiber = {
            type: element.type,
            parent: fiber,
            props: element.props,
        };
        if (element.renderFunction)
            newFiber.renderFunction = element.renderFunction;

        if (index === 0) {
            fiber.child = newFiber;
        } else {
            // @ts-expect-error
            prevSibling.sibling = newFiber;
        }

        prevSibling = newFiber;
        index++;
    }
}

function reconcileNewFiber(fiber: Fiber) {
    let curFiber: Fiber | null = fiber;
    while (curFiber) {
        curFiber = performUnitOfWork(curFiber);
    }
}
export const isEvent = (key: string) => key.startsWith("on");
export const isProperty = (key: string) => key !== "children" && !isEvent(key);
const isNew = (prev: any, next: any, key: string) => prev[key] !== next[key];
const isGone = (prev: any, next: any, key: string) => !(key in next);

function updateNode(prev: Fiber | undefined, next: Element | undefined) {
    if (!prev || !next) return;
    if (!prev.dom) {
        // updateNode(prev?.child, next);
        console.log("no dom on ", prev);
        return;
    }
    console.log("updating", prev, next);
    const prevProps = prev?.props;
    const nextProps = next?.props;
    const node = prev.dom;

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
        let newFiber: Fiber | undefined = {
            type: next.type,
            props: next.props,
            parent: prev.parent,
        };
        if (prev.renderFunction) {
            newFiber.renderFunction = prev.renderFunction;
            clearReactiveFunction(prev.renderFunction);

            prev.renderFunction = undefined;
            console.log("resetting render function");
            setRenderFunction(newFiber);
        }
        if (prev.parent) {
            // console.log(newFiber, "new fiber", prev);
            reconcileNewFiber(newFiber);
            console.log("different fiber", prev, newFiber);
            // console.log("first child");
            commitWork(newFiber);
            while (newFiber && !newFiber.dom) {
                newFiber = newFiber.child;
            }
            if (newFiber?.dom)
                prev.parent.dom?.replaceChild(newFiber.dom, prev.dom);
            // console.log(prev.renderFunction);
            if (prev.parent.child === prev) {
                prev.parent.child = newFiber;
            } else {
                let prevSibling: Fiber | undefined = prev.parent.child;
                while (prevSibling && prevSibling.sibling !== prev) {
                    prevSibling = prevSibling.sibling;
                }
                if (prevSibling) {
                    prevSibling.sibling = newFiber;
                }
            }
        }
    } else {
        // add new properties
        console.log("same type");
        for (const prop of Object.keys(nextProps)) {
            if (isProperty(prop) && isNew(prevProps, nextProps, prop)) {
                node[prop] = nextProps[prop];
                console.log("property added", prop);
                prevProps[prop] = nextProps[prop];
            } else if (isEvent(prop) && isNew(prevProps, nextProps, prop)) {
                const eventName = prop.toLowerCase().substring(2);
                console.log("event listener added", prop);
                node.addEventListener(eventName, nextProps[prop]);
                prevProps[prop] = nextProps[prop];
            }
        }
        let nextFiber = prev.child;
        let prevFiber: Fiber | undefined = undefined;
        const len = Math.max(
            prevProps.children.length,
            nextProps.children.length
        );

        for (let i = 0; i < len; i++) {
            // console.log(nextFiber, nextProps.children[i]);
            const nextEl = nextProps.children[i];
            if (!nextFiber && nextEl) {
                console.log("to add fiber", nextEl);
            } else if (!nextEl && nextFiber) {
                console.log("to remove fiber", nextFiber);
            } else {
                updateNode(nextFiber, nextEl);
                prevFiber = nextFiber;
                nextFiber = nextFiber?.sibling;
            }
        }
    }
}
