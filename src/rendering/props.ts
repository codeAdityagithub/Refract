import { isValidStyle, preprocessStyle, styleObjectToString } from "../lib";
import { setReactiveAttributes } from "../signals/batch";
import { reactiveAttribute } from "../signals/signal";
import { SVG_NAMESPACE } from "./constants";
// export function setProperty(dom, name, value, oldValue, namespace) {
//     o: if (name == "style") {
//         if (typeof value == "string") {
//             dom.style.cssText = value;
//         } else {
//             if (typeof oldValue == "string") {
//                 dom.style.cssText = oldValue = "";
//             }

//             if (oldValue) {
//                 for (name in oldValue) {
//                     if (!(value && name in value)) {
//                         setStyle(dom.style, name, "");
//                     }
//                 }
//             }

//             if (value) {
//                 for (name in value) {
//                     if (!oldValue || value[name] !== oldValue[name]) {
//                         setStyle(dom.style, name, value[name]);
//                     }
//                 }
//             }
//         }
//     }
//     // Benchmark for comparison: https://esbench.com/bench/574c954bdb965b9a00965ac6
//     else if (name[0] == "o" && name[1] == "n") {
//         useCapture = name != (name = name.replace(CAPTURE_REGEX, "$1"));

//         // Infer correct casing for DOM built-in events:
//         if (
//             name.toLowerCase() in dom ||
//             name == "onFocusOut" ||
//             name == "onFocusIn"
//         )
//             name = name.toLowerCase().slice(2);
//         else name = name.slice(2);

//         if (!dom._listeners) dom._listeners = {};
//         dom._listeners[name + useCapture] = value;

//         if (value) {
//             if (!oldValue) {
//                 value._attached = eventClock;
//                 dom.addEventListener(
//                     name,
//                     useCapture ? eventProxyCapture : eventProxy,
//                     useCapture
//                 );
//             } else {
//                 value._attached = oldValue._attached;
//             }
//         } else {
//             dom.removeEventListener(
//                 name,
//                 useCapture ? eventProxyCapture : eventProxy,
//                 useCapture
//             );
//         }
//     } else {
//         if (namespace == SVG_NAMESPACE) {
//             // Normalize incorrect prop usage for SVG:
//             // - xlink:href / xlinkHref --> href (xlink:href was removed from SVG and isn't needed)
//             // - className --> class
//             name = name.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
//         } else if (
//             name != "width" &&
//             name != "height" &&
//             name != "href" &&
//             name != "list" &&
//             name != "form" &&
//             // Default value in browsers is `-1` and an empty string is
//             // cast to `0` instead
//             name != "tabIndex" &&
//             name != "download" &&
//             name != "rowSpan" &&
//             name != "colSpan" &&
//             name != "role" &&
//             name != "popover" &&
//             name in dom
//         ) {
//             try {
//                 dom[name] = value == NULL ? "" : value;
//                 // labelled break is 1b smaller here than a return statement (sorry)
//                 break o;
//             } catch (e) {}
//         }

//         // aria- and data- attributes have no boolean representation.
//         // A `false` value is different from the attribute not being
//         // present, so we can't remove it. For non-boolean aria
//         // attributes we could treat false as a removal, but the
//         // amount of exceptions would cost too many bytes. On top of
//         // that other frameworks generally stringify `false`.

//         if (typeof value == "function") {
//             // never serialize functions as attribute values
//         } else if (value != null && (value !== false || name[4] == "-")) {
//             dom.setAttribute(
//                 name,
//                 name == "popover" && value == true ? "" : value
//             );
//         } else {
//             dom.removeAttribute(name);
//         }
//     }
// }

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

    if (name[0] === "o" && name[1] === "n") {
        if (
            name.toLowerCase() in dom ||
            name == "onFocusOut" ||
            name == "onFocusIn"
        )
            name = name.toLowerCase().slice(2);
        else name = name.slice(2);
        // handle eventListeners
        dom.addEventListener(name, value);
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
            dom[name] = value == null ? "" : value;
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
