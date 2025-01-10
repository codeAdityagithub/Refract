import { CompletedFiber, Fiber, RefractChildren } from "./types";

function createElement(
    type: any,
    props: object | null,
    ...children: RefractChildren[]
): Fiber {
    return {
        type,
        props: {
            ...props,
            children: children.map((child) => {
                if (typeof child === "object") return child as Fiber;

                return createTextChildren(child);
            }),
        },
    };
}

function createTextChildren(text: string): Fiber {
    return {
        type: "TEXT_CHILD",
        props: {
            nodeValue: text,
            children: [],
        },
    };
}

function createNode(fiber: Fiber) {
    const node =
        fiber.type === "TEXT_CHILD"
            ? document.createTextNode("")
            : document.createElement(fiber.type);

    // adding props to node
    updateNode(node, {}, fiber.props);
    return node;
}

const isEvent = (key: string) => key.startsWith("on");
const isProperty = (key: string) => key !== "children" && !isEvent(key);
const isNew = (prev: any, next: any, key: string) => prev[key] !== next[key];
const isGone = (prev: any, next: any, key: string) => !(key in next);

function updateNode(node: HTMLElement | Text, prevProps: any, nextProps: any) {
    // remove old properties and event listeners

    for (const prop of Object.keys(prevProps)) {
        if (isProperty(prop) && !isGone(prevProps, nextProps, prop)) {
            node[prop] = "";
        } else if (
            (isEvent(prop) && !(prop in nextProps)) ||
            isNew(prevProps, nextProps, prop)
        ) {
            const eventName = prop.toLowerCase().substring(2);

            node.removeEventListener(eventName, prevProps[prop]);
        }
    }

    // add new properties

    for (const prop of Object.keys(nextProps)) {
        if (isProperty(prop) && isNew(prevProps, nextProps, prop)) {
            node[prop] = nextProps[prop];
        } else if (isEvent(prop) && isNew(prevProps, nextProps, prop)) {
            const eventName = prop.toLowerCase().substring(2);

            node.addEventListener(eventName, nextProps[prop]);
        }
    }
}

function commitRoot() {
    // commit all the fibers to the actual dom
    if (!fiberRoot) return;
    deletions?.forEach((fiber) => commitWork(fiber as CompletedFiber));

    // @ts-expect-error  expecting that the fiber tree has been constructed
    commitWork(fiberRoot.child);

    currentFiberRoot = fiberRoot as CompletedFiber;

    fiberRoot = null;
}

function commitWork(fiber: CompletedFiber | undefined) {
    if (!fiber) return;

    let parentFiber = fiber.parent;

    while (!parentFiber.node) {
        parentFiber = parentFiber.parent;
    }

    const parentNode = parentFiber.node;

    if (parentNode && fiber.effectTag === "PLACEMENT" && fiber.node) {
        parentNode.appendChild(fiber.node);
    } else if (fiber.effectTag === "DELETION" && fiber.node) {
        commitDeletion(fiber, parentNode);
    } else if (fiber.effectTag === "UPDATE" && fiber.node) {
        updateNode(fiber.node, fiber.alternate?.props, fiber.props);
    }
    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

function commitDeletion(
    fiber: Fiber | undefined,
    domParent: HTMLElement | Text
) {
    if (fiber && fiber.node) {
        domParent.removeChild(fiber.node);
    } else {
        commitDeletion(fiber?.child, domParent);
    }
}

function render(element: Fiber, container: HTMLElement) {
    fiberRoot = {
        node: container,
        props: {
            children: [element],
        },
        type: "div",
        alternate: currentFiberRoot,
    };
    deletions = [];
    nextUnitOfWork = fiberRoot;
}

let nextUnitOfWork: Fiber | null = null;
let fiberRoot: Fiber | null = null;
let currentFiberRoot: CompletedFiber | undefined = undefined;

let deletions: Fiber[] | null = null;

function workLoop(deadline: IdleDeadline) {
    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        shouldYield = deadline.timeRemaining() < 1;
    }

    if (!nextUnitOfWork && fiberRoot) {
        commitRoot();
    }
    requestIdleCallback(workLoop);
}
requestIdleCallback(workLoop);

function performUnitOfWork(fiber: Fiber): Fiber | null {
    if (fiber.type instanceof Function) {
        updateFunctionComponent(fiber);
    } else {
        updateHostComponent(fiber);
    }

    if (fiber.child)
        // returning next unit of work
        return fiber.child;

    let nextFiber: Fiber | undefined = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) return nextFiber.sibling;
        nextFiber = nextFiber.parent;
    }
    return null;
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

const Refract = {
    render,
    createElement,
};

const root = document.getElementById("root")!;

// const heading = createElement("h1", null, "Hello");

// const Heading = (props: any) => {
//     return (
//         <div>
//             {props.children}
//             {props.name}
//         </div>
//     );
// };
// Heading({ children: "hello", name: "world" });
// Refract.render(heading, root);
