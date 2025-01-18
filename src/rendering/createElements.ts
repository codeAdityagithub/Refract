import { reactive } from "../signals/signal";
import { Children, Element, Props, RenderFunction, Type } from "../types";
import { isPrimitive } from "../utils/general";

export function createElement(
    type: Type,
    props: object | null,
    ...children: any[]
): Element | Element[] {
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

function createChildren(children: any[]): Children {
    return children
        .map((child) => {
            if (typeof child === "object") {
                if (Array.isArray(child)) {
                    return createChildren(child);
                }
                return child;
            } else if (typeof child === "function") {
                const val = reactive(child);
                if (isPrimitive(val)) return createTextChildren(String(val));
                return createSignalChild(val.type, val.props, child);
            } else {
                return createTextChildren(child);
            }
        })
        .flat();
}

function createTextChildren(text: string): Element {
    return {
        type: "TEXT_CHILD",
        props: {
            nodeValue: text,
            children: [],
        },
    };
}

function createSignalChild(
    type: Type,
    props: Props,
    renderFunction: RenderFunction
): Element {
    return {
        type,
        renderFunction,
        props,
    };
}
