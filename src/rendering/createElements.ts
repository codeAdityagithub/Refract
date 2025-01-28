import { setReactiveAttributes } from "../signals/batch";
import { reactive, reactiveAttribute } from "../signals/signal";
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
    ...children: any[]
): Fiber | FiberChildren {
    // console.log(type);
    if (type === "FRAGMENT") {
        return createChildren(children);
    }
    // @ts-expect-error
    return {
        type,
        props: {
            ...props,
            children: createChildren(children),
        },
    };
}

export function createChildren(children: FiberChildren): FiberChildren {
    // @ts-expect-error
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
                    // console.log(createChildren(val));
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
                dom.addEventListener(
                    name.slice(2).toLowerCase(),
                    element.props[name]
                );
            } else if (
                typeof element.props[name] === "function" &&
                !name.startsWith("on")
            ) {
                const func = element.props[name];
                func.__propName = name;
                // registers the function in corresponding signal
                const val = reactiveAttribute(func);
                setReactiveAttributes(func, dom);
                dom[name] = val;
            } else {
                dom[name] = element.props[name];
            }
        });
    return dom;
}

export function updateDomProp(prop: string, dom: HTMLElement | Text, value) {
    if (dom) {
        dom[prop] = value;
    }
}

export const FRAGMENT = "FRAGMENT";
