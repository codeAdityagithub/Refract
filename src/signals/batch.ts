import { updateDomProp } from "../rendering/createElements";
import { updateFiber } from "../rendering/render";
import { Fiber } from "../types";

let scheduled = false;
const batch = new Set<Function>();
const depset = new Set();
const reactiveFiberMap = new WeakMap();
const domAttributeMap = new WeakMap<Function, HTMLElement | Text>();

export function batchUpdate(cb: Function) {
    batch.add(cb);
    if (!scheduled) {
        scheduled = true;
        queueMicrotask(() => {
            // console.log("Current batch has: ", batch.size, " Functions");

            batch.forEach((fn) => {
                const dep = fn();
                if (depset.has(dep)) {
                    return;
                }
                depset.add(dep);
                // effects and reactive nodes
                if (dep.__cleanup && typeof dep.__cleanup === "function") {
                    dep.__cleanup();
                    dep.__cleanup = null;
                }

                const val = dep();

                if (typeof val === "function") {
                    dep.__cleanup = val;
                }
                // console.log(dep, "dep");
                if (reactiveFiberMap.has(dep)) {
                    // for updating reactive nodes
                    const fiber = reactiveFiberMap.get(dep);
                    if (fiber) {
                        // console.log("dep", fiber);
                        updateFiber(fiber, val);
                    }
                }
                if (domAttributeMap.has(dep)) {
                    // for updating reactive nodes
                    const dom = domAttributeMap.get(dep);
                    if (dom && dep.__propName) {
                        updateDomProp(dep.__propName, dom, val);
                    }
                }
            });
            depset.clear();
            batch.clear();
            scheduled = false;
        });
    }
}

export function setReactiveFunction(fn: Function, fiber: Fiber) {
    reactiveFiberMap.set(fn, fiber);
}
export function setReactiveAttributes(fn: Function, dom: HTMLElement | Text) {
    // console.log("reactive attrubite", fn);
    domAttributeMap.set(fn, dom);
}
export function clearReactiveAttributes(fn: any) {
    domAttributeMap.delete(fn);

    const signals = fn.__signals;
    if (signals) {
        for (const signal of signals) {
            signal.removeDep(fn);
        }
        fn.__signals = null;
    }
}

export function clearReactiveFunction(fn: Function) {
    reactiveFiberMap.delete(fn);
    // @ts-expect-error
    const signals = fn.__signals;
    if (signals) {
        for (const signal of signals) {
            signal.removeDep(fn);
        }
        // @ts-expect-error
        fn.__signals = null;
    }
}

export function deleteReactiveFunction(fn: Function) {
    reactiveFiberMap.delete(fn);
}
