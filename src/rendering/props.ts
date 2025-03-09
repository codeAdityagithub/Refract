import { isValidStyle, preprocessStyle, styleObjectToString } from "../lib";
import { setReactiveAttributes } from "../signals/batch";
import { reactiveAttribute } from "../signals/signal";
import { SVG_NAMESPACE } from "./constants";

export function setStyle(
    style: Record<string, string | number> | string,
    dom: HTMLElement
) {
    if (!isValidStyle(style))
        throw new Error("Style attribute must be a plain object or a string");

    if (typeof style === "string") {
        dom.setAttribute("style", style);
    } else {
        const processedStyle = preprocessStyle(style);

        dom.setAttribute("style", styleObjectToString(processedStyle));
    }
}

// handles setting the reactive attributes returned from a reactiveFunction
export function setReactiveAttribute(
    reactiveFunction: any,
    name: string,
    dom: HTMLElement,
    namespace?: string
) {
    reactiveFunction.__propName = name;
    // registers the function in corresponding signal
    const val = reactiveAttribute(reactiveFunction);
    if (val === null || val === undefined || val === false) {
        return;
    }

    setAttribute(name, val, dom, namespace);
    // track this using signals if the function depended on any signal
    if (reactiveFunction.__signals)
        setReactiveAttributes(reactiveFunction, dom);
}

const CAPTURE_REGEX = /(PointerCapture)$|Capture$/i;

export function setAttribute(
    name: string,
    value: any,
    dom: HTMLElement,
    namespace?: string
) {
    if (name == "style") {
        setStyle(value, dom);
        return;
    }
    if (name[0] === "o" && name[1] === "n" && typeof value === "function") {
        const useCapture = name != (name = name.replace(CAPTURE_REGEX, "$1"));

        if (
            name.toLowerCase() in dom ||
            name == "onFocusOut" ||
            name == "onFocusIn" ||
            name === "onGotPointerCapture" ||
            name === "onLostPointerCapture"
        )
            name = name.toLowerCase().slice(2);
        else name = name.slice(2);
        // handle eventListeners
        dom.addEventListener(name, value, useCapture);
        return;
    }

    if (namespace === SVG_NAMESPACE) {
        name = name.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
    }
    // For certain properties that exist on the dom element,
    // attempt to set them directly.
    else if (
        name !== "width" &&
        name !== "height" &&
        name !== "href" &&
        name !== "list" &&
        name !== "form" &&
        name !== "tabIndex" &&
        name !== "download" &&
        name !== "rowSpan" &&
        name !== "colSpan" &&
        name !== "role" &&
        name !== "popover" &&
        name in dom
    ) {
        try {
            // Set the property directly on the DOM element.
            if (name === "value" && dom.tagName === "SELECT") {
                setTimeout(() => {
                    dom[name] = value == null ? "" : value;
                });
            } else {
                dom[name] = value == null ? "" : value;
            }
            // console.log(dom[name], dom);

            // We simply return after setting the property.
            return;
        } catch (e) {
            // If setting the property fails, fall through to update attributes.
        }
    }

    if (value != null && (value !== false || name[4] === "-")) {
        // For most attributes, if the value is valid, set the attribute.
        // Special case: for "popover", if value is true, set attribute to an empty string.

        dom.setAttribute(
            name,
            name === "popover" && value === true ? "" : value
        );
    }
}
