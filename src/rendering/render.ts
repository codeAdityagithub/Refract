import { ArraySignal, ObjectSignal, Signal } from "../signals/signal";
import { Element, ReactiveElement } from "../types";

type UnitOfWork = {
    element: Element | Element[];
    container: HTMLElement | DocumentFragment;
};
export function render(element: Element, container: HTMLElement) {
    // deletions = [];
    const fragment = document.createDocumentFragment();
    rootElement = container;
    rootFragment = fragment;
    nextUnitOfWork = { element, container: fragment };
}

let nextUnitOfWork: UnitOfWork | null = null;
let rootFragment: DocumentFragment | null = null;
let rootElement: HTMLElement | null = null;
// let currentFiberRoot: CompletedFiber | undefined = undefined;

// let deletions: Fiber[] | null = null;

function workLoop(deadline: IdleDeadline) {
    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
        let next: UnitOfWork | null = null;

        if (
            nextUnitOfWork.element instanceof Array &&
            nextUnitOfWork.element.length > 0
        ) {
            const val = performUnitOfWork(
                nextUnitOfWork.element.pop()!,
                nextUnitOfWork.container,
                false
            );
            if (val) next = val;
        } else {
            const val = performUnitOfWork(
                // @ts-expect-error
                nextUnitOfWork.element,
                nextUnitOfWork.container
            );
            if (val) next = val;
        }
        if (next) nextUnitOfWork = next;
        shouldYield = deadline.timeRemaining() < 1;
    }

    if (!nextUnitOfWork && rootElement && rootFragment) {
        rootElement.appendChild(rootFragment);
        console.log("Done");
    }
    requestIdleCallback(workLoop);
}
requestIdleCallback(workLoop);

function performUnitOfWork(
    element: Element,
    container: HTMLElement | DocumentFragment,
    toReturn?: boolean
): UnitOfWork | undefined {
    if (
        element instanceof Signal ||
        element instanceof ArraySignal ||
        element instanceof ObjectSignal
    ) {
        throw new Error("Signal cannot be a dom node");
    }
    if (typeof element.type === "function") {
        const children = [element.type(element.props)] as Element[];

        return {
            element: children,
            container,
        };
    }
    const dom =
        element.type === "TEXT_CHILD"
            ? document.createTextNode("")
            : document.createElement(element.type);

    const isProperty = (key) => key !== "children";
    Object.keys(element.props)
        .filter(isProperty)
        .forEach((name) => {
            if (name.startsWith("on")) {
                dom.addEventListener(
                    name.slice(2).toLowerCase(),
                    element.props[name]
                );
            } else {
                dom[name] = element.props[name];
            }
        });

    container.appendChild(dom);
    if (element.type === "TEXT_CHILD") {
        return;
    }
    if (element.props.children) {
        return {
            element: element.props.children.reverse(),
            // @ts-expect-error
            container: dom,
        };
    }
}

function updateFunctionComponent(fiber: Fiber) {
    const children = [fiber.type(fiber.props)];

    reconcileChildren(fiber, children);
}
function updateHostComponent(fiber: Fiber) {
    if (!fiber.node) {
        fiber.node = createNode(fiber);
    }
    reconcileChildren(fiber, fiber.props.children);
}

function reconcileChildren(fiber: Fiber, elements: Fiber[]) {
    let index = 0;

    // corresponds to elements[0]
    let oldFiber = fiber.alternate?.child;

    let prevSibling: Fiber | undefined = undefined;

    while (index < elements.length || oldFiber != undefined) {
        const element = elements[index];
        let newFiber: Fiber | undefined = undefined;

        const sameType = oldFiber && element && element.type === oldFiber.type;

        if (sameType) {
            newFiber = {
                ...oldFiber,
                parent: fiber,
                props: element.props,
                alternate: oldFiber,
                effectTag: "UPDATE",
            };
        } else if (element !== undefined) {
            // not same type so replace
            newFiber = {
                type: element.type,
                props: element.props,
                parent: fiber,
                effectTag: "PLACEMENT",
            };
            // mark old fiber for deletion
            if (oldFiber) {
                oldFiber.effectTag = "DELETION";
                deletions?.push(oldFiber);
            }
        }

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

const isEvent = (key: string) => key.startsWith("on");
const isProperty = (key: string) => key !== "children" && !isEvent(key);
const isNew = (prev: any, next: any, key: string) => prev[key] !== next[key];
const isGone = (prev: any, next: any, key: string) => !(key in next);

function updateNode(
    node: HTMLElement | Text | ChildNode,
    prev: ReactiveElement,
    next: ReactiveElement
) {
    const prevProps = prev?.props;
    const nextProps = next?.props;

    // if (!prevProps) {
    //     if (node && node.parentElement) {
    //         const toInsert = render(next, node.parentElement, false, true);
    //         node.parentElement.insertBefore(toInsert, node);
    //     } else if (parent) {
    //         render(next, parent, true);

    //         return;
    //     }
    //     return;
    // } else if (node && !nextProps) {
    //     // console.log("extra node removed", node);
    //     node.remove();
    //     return;
    // }

    // remove old properties and event listeners
    for (const prop of Object.keys(prevProps)) {
        if (isProperty(prop) && isGone(prevProps, nextProps, prop)) {
            node[prop] = "";
        } else if (
            isEvent(prop) &&
            (!(prop in nextProps) || isNew(prevProps, nextProps, prop))
        ) {
            const eventName = prop.toLowerCase().substring(2);

            node.removeEventListener(eventName, prevProps[prop]);
        }
    }

    if (prev.type !== next.type) {
        const parent = node.parentElement;
        if (parent) {
            const newNode = render(next, parent, false, true);
            parent.replaceChild(newNode, node);
        }
    } else {
        // add new properties

        for (const prop of Object.keys(nextProps)) {
            if (isProperty(prop) && isNew(prevProps, nextProps, prop)) {
                node[prop] = nextProps[prop];
                // console.log(prop);
            } else if (isEvent(prop) && isNew(prevProps, nextProps, prop)) {
                const eventName = prop.toLowerCase().substring(2);

                node.addEventListener(eventName, nextProps[prop]);
            }
        }
        node.childNodes.forEach((child, i) => {
            const prevChild = prevProps.children[i];
            const nextChild = nextProps.children[i];
            if (prevChild && nextChild) updateNode(child, prevChild, nextChild);
        });
    }
}
