import { isValidStyle, preprocessStyle, styleObjectToString } from "../lib";
import { setReactiveAttributes } from "../signals/batch";
import { reactive, reactiveAttribute, Ref } from "../signals/signal";
import {
    Element,
    Fiber,
    FiberChildren,
    NodeType,
    Props,
    RenderFunction,
} from "../types";
import { isPrimitive } from "../utils/general";
export const FRAGMENT_SYMBOL = Symbol("FRAGMENT");

export function createElement(
    type: any,
    props: object | null,
    ...children: any[]
): Fiber | FiberChildren {
    if (type === "FRAGMENT") {
        const fragments = createChildren(children);
        fragments[FRAGMENT_SYMBOL] = true;

        return fragments;
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
                if (child === null) {
                    return createTextChildren("");
                }
                if (!child.type || !child.props) {
                    throw new Error(
                        "Invalid type for a dom node, found " + child
                    );
                }
                return child;
            } else if (typeof child === "function") {
                const val = reactive(child);
                if (isPrimitive(val)) {
                    return createSignalChild(
                        "TEXT_CHILD",
                        {
                            nodeValue:
                                val !== undefined &&
                                val !== null &&
                                val !== false
                                    ? String(val)
                                    : "",
                            children: [],
                        },
                        child
                    );
                } else if (Array.isArray(val)) {
                    // console.log(createChildren(val));
                    const isFragment = val[FRAGMENT_SYMBOL];
                    return createSignalChild(
                        "FRAGMENT",
                        { children: isFragment ? val : createChildren(val) },
                        child
                    );
                } else if (!val.type || !val.props) {
                    throw new Error(
                        "Invalid type for a dom node, found " + val
                    );
                }
                return createSignalChild(val.type, val.props, child);
            } else {
                return createTextChildren(child);
            }
        })
        .flat();
}

export function createTextChildren(text: any): Element {
    return {
        type: "TEXT_CHILD",
        props: {
            nodeValue:
                text !== null && text !== undefined && text !== false
                    ? String(text)
                    : "",
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
    return key !== "children" && key !== "key" && key !== "ref";
}
export function createNode(element: Fiber) {
    const dom =
        element.type === "TEXT_CHILD"
            ? document.createTextNode("")
            : // @ts-expect-error
              document.createElement(element.type);
    if (!element.props) return dom;

    if (
        element.props.ref &&
        element.props.ref instanceof Ref &&
        dom instanceof HTMLElement
    ) {
        element.props.ref.current = dom;
    }

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

                if (!val && val !== 0) {
                    return;
                }
                if (
                    name === "style" &&
                    typeof val !== "string" &&
                    dom instanceof HTMLElement
                ) {
                    if (!isValidStyle(val))
                        throw new Error(
                            "Style attribute must be a plain object or a string"
                        );
                    const processedStyle = preprocessStyle(val);
                    dom.setAttribute(
                        "style",
                        styleObjectToString(processedStyle)
                    );
                } else {
                    if (
                        dom instanceof HTMLElement &&
                        (name in dom || name.startsWith("data-"))
                    ) {
                        dom.setAttribute(
                            name === "className" ? "class" : name,
                            String(val)
                        );
                    } else {
                        dom[name] = String(val);
                    }
                }
                // this is a reactive attribute
                if (func.__signal) setReactiveAttributes(func, dom);
            } else {
                if (!element.props[name] && element.props[name] !== 0) {
                    return;
                }

                if (
                    name === "style" &&
                    typeof element.props[name] !== "string" &&
                    dom instanceof HTMLElement
                ) {
                    const style = element.props[name];
                    if (!isValidStyle(style))
                        throw new Error(
                            "Style attribute must be a plain object or a string"
                        );
                    const processedStyle = preprocessStyle(style);
                    dom.setAttribute(
                        "style",
                        styleObjectToString(processedStyle)
                    );
                } else {
                    if (
                        dom instanceof HTMLElement &&
                        (name in dom || name.startsWith("data-"))
                    ) {
                        dom.setAttribute(
                            name === "className" ? "class" : name,
                            String(element.props[name])
                        );
                    } else {
                        dom[name] = String(element.props[name]);
                    }
                }
            }
        });
    return dom;
}

export function updateDomProp(prop: string, dom: HTMLElement | Text, value) {
    if (!value || prop == "key") return;
    if (
        prop === "style" &&
        typeof value !== "string" &&
        dom instanceof HTMLElement
    ) {
        if (!isValidStyle(value))
            throw new Error(
                "Style attribute must be a plain object or a string"
            );

        const processedStyle = preprocessStyle(value);
        dom.setAttribute("style", styleObjectToString(processedStyle));
    } else {
        if (
            dom instanceof HTMLElement &&
            (prop in dom || prop.startsWith("data-"))
        ) {
            if (prop === "classProp") prop = "class";

            dom.setAttribute(prop, String(value));
        } else {
            dom[prop] = String(value);
        }
    }
}

export const FRAGMENT = "FRAGMENT";
