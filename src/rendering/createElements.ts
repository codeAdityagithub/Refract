import { reactive } from "../signals/signal";
import {
    Element,
    Fiber,
    FiberChildren,
    NodeType,
    Props,
    RenderFunction,
} from "../types";
import { isPrimitive } from "../utils/general";

export function createElement(
    type: any,
    props: object | null,
    ...children: Element[]
): Fiber | FiberChildren {
    // console.log(type);
    if (type === "FRAGMENT") {
        return createChildren(children);
    }
    return {
        type,
        props: {
            ...props,
            children: createChildren(children),
        },
    };
}

export function createChildren(children: FiberChildren): FiberChildren {
    return children
        .map((child) => {
            if (typeof child === "object") {
                if (Array.isArray(child)) {
                    return createChildren(child);
                }
                return child;
            } else if (typeof child === "function") {
                const val = reactive(child);
                if (isPrimitive(val))
                    return createSignalChild(
                        "TEXT_CHILD",
                        { nodeValue: String(val), children: [] },
                        child
                    );
                else if (Array.isArray(val)) {
                    console.log(createChildren(val));
                    return createSignalChild(
                        "FRAGMENT",
                        { children: createChildren(val) },
                        child
                    );
                }
                return createSignalChild(val.type, val.props, child);
            } else {
                return createTextChildren(child);
            }
        })
        .flat();
}

export function createTextChildren(text: string): Element {
    return {
        type: "TEXT_CHILD",
        props: {
            nodeValue: text,
            children: [],
        },
    };
}

function createSignalChild(
    type: NodeType,
    props: Props,
    renderFunction: RenderFunction
) {
    return {
        type,
        renderFunction,
        props,
    };
}

function isProperty(key: string) {
    return key !== "children";
}
export function createNode(element: Fiber) {
    const dom =
        element.type === "TEXT_CHILD"
            ? document.createTextNode("")
            : // @ts-expect-error
              document.createElement(element.type);
    if (!element.props) return dom;
    Object.keys(element.props)
        .filter(isProperty)
        .forEach((name) => {
            if (
                name.startsWith("on") &&
                typeof element.props[name] === "function"
            ) {
                console.log(
                    "adding event listener to",
                    dom,
                    element.props[name]
                );
                dom.addEventListener(
                    name.slice(2).toLowerCase(),
                    element.props[name]
                );
            } else {
                dom[name] = element.props[name];
            }
        });
    return dom;
}
