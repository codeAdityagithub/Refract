import { reactive, Ref } from "../signals/signal";
import {
    Fiber,
    FiberChildren,
    NodeType,
    Props,
    RenderFunction,
} from "../types";
import { isPrimitive } from "../utils/general";
import {
    MATH_NAMESPACE,
    MATH_TAGS,
    SVG_NAMESPACE,
    SVG_TAGS,
} from "./constants";
import { setAttribute, setReactiveAttribute } from "./props";
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

export function createTextChildren(text: any): Fiber {
    // @ts-expect-error
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

export function createNode(element: Fiber): HTMLElement | Text {
    let namespace: string | null = null;

    if (SVG_TAGS.has(element.type as string)) namespace = SVG_NAMESPACE;
    else if (MATH_TAGS.has(element.type as string)) namespace = MATH_NAMESPACE;

    const dom =
        element.type === "TEXT_CHILD"
            ? document.createTextNode("")
            : namespace
            ? document.createElementNS(
                  namespace,
                  // @ts-expect-error
                  element.type,
                  element.props.is && element.props
              )
            : // @ts-expect-error
              document.createElement(element.type);

    if (!element.props) return dom as HTMLElement | Text;

    if (
        element.props.ref &&
        element.props.ref instanceof Ref &&
        dom instanceof HTMLElement
    ) {
        element.props.ref.current = dom;
    }

    for (const name in element.props) {
        if (!isProperty(name)) {
            continue;
        }
        const value = element.props[name];
        if (typeof value === "function" && name[0] !== "o" && name[1] !== "n") {
            // @ts-expect-error
            setReactiveAttribute(value, name, dom, namespace);
        } else {
            // @ts-expect-error
            setAttribute(name, value, dom, namespace);
        }
    }

    return dom as HTMLElement | Text;
}

export function updateDomProp(
    prop: string,
    dom: HTMLElement | Text,
    value: any
) {
    if (value == null || prop === "key") return;

    // @ts-expect-error
    setAttribute(prop, value, dom);
}

export const FRAGMENT = "FRAGMENT";
