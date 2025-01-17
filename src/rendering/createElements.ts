import { Children, Element, RenderFunction, Type } from "../types";

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
                return createSignalChild(child);
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

function createSignalChild(returnFunction: RenderFunction): Element {
    return {
        type: "SIGNAL_CHILD",
        renderFunction: returnFunction,
        props: {
            children: [],
        },
    };
}
