import { BaseSignal } from "../signals/signal";
import { Fiber } from "../types";
import { isPrimitive } from "../utils/general";

export function deepCompareFibers(fiberA: any, fiberB: any): boolean {
    // Fast path: identical references
    if (fiberA === fiberB) {
        return true;
    }

    // Compare the fiber types (e.g., function for FCs, string for DOM nodes)
    if (fiberA.type !== fiberB.type) {
        return false;
    }

    // Compare keys if they exist
    if (fiberA.props?.key !== fiberB.props?.key) {
        return false;
    }
    return deepEqual(fiberA.props, fiberB.props);
}

export function deepEqual(objA: any, objB: any): boolean {
    if (objA === objB) {
        if (objA instanceof BaseSignal && objB instanceof BaseSignal)
            return deepEqual(objA.value, objB.value);
        if (Array.isArray(objA) && Array.isArray(objB)) {
            if (objA.length !== objB.length) return false;
            for (let i = 0; i < objA.length; i++) {
                if (!deepEqual(objA[i], objB[i])) return false;
            }
        }
        return true;
    } // Same reference or primitive value

    if (isPrimitive(objA) && isPrimitive(objB)) {
        return objA === objB; // One is not an object or is null
    }

    if (typeof objA !== typeof objB) return false;
    const vis = {};
    for (let key in objA) {
        if (key === "children") continue;
        if (!(key in objB)) return false; // Missing key in one of them
        if (!deepEqual(objA[key], objB[key])) return false; // Recurse for nested objects/arrays
        vis[key] = true;
    }

    for (let key in objB) {
        if (key === "children") continue;
        if (!(key in objA)) return false; // Missing key in one of them
    }

    return true;
}

export function findFirstDom(fiber: Fiber): HTMLElement | Text | undefined {
    if (!fiber) return;

    if (fiber.dom) return fiber.dom;

    for (const child of fiber.props.children) {
        const dom = findFirstDom(child);
        if (dom) return dom;
    }
}
export function findParentFiberWithDom(fiber: Fiber): Fiber | undefined {
    if (!fiber) return;
    let fiberParent = fiber.parent;
    while (fiberParent && !fiberParent.dom) {
        fiberParent = fiberParent.parent;
    }
    return fiberParent;
}
export function findNearestParentWithDom(fiber: Fiber): Fiber | undefined {
    if (!fiber) return;
    if (fiber.dom) return fiber;
    return findParentFiberWithDom(fiber);
}
