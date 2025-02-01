import { BaseSignal } from "../signals/signal";

let currentFC = null;
let fcMap = new WeakMap<
    Function,
    { signals: Set<BaseSignal<any>>; cleanup: Function; effects: Function[] }
>();

export function setCurrentFC(fc) {
    currentFC = fc;
}
export function clearCurrentFC() {
    currentFC = null;
}
export function getCurrentFC() {
    return currentFC;
}

export function cleanUp(fn: Function) {
    if (currentFC) {
        if (fcMap.has(currentFC)) {
            const fcData = fcMap.get(currentFC)!;
            if (fcData.cleanup)
                throw new Error(
                    "A Functional Component can only have one cleanup function"
                );

            fcData.cleanup = fn;
        } else {
            fcMap.set(currentFC, {
                signals: new Set(),
                cleanup: fn,
                effects: [],
            });
        }
    }
}

export function addEffect(fn: Function) {
    if (currentFC) {
        if (fcMap.has(currentFC)) {
            const fcData = fcMap.get(currentFC)!;
            fcData.effects.push(fn);
        } else {
            fcMap.set(currentFC, {
                signals: new Set(),
                cleanup: null,
                effects: [fn],
            });
        }
    }
}
export function addSignal(signal: BaseSignal<any>) {
    if (currentFC) {
        if (fcMap.has(currentFC)) {
            const fcData = fcMap.get(currentFC)!;
            fcData.signals.add(signal);
        } else {
            const signals = new Set<BaseSignal<any>>();
            signals.add(signal);
            fcMap.set(currentFC, {
                signals: signals,
                cleanup: null,
                effects: [],
            });
        }
    }
}

export function cleanUpFC(currentFC, props) {
    const fcData = fcMap.get(currentFC)!;
    if (fcData) {
        // console.log("Cleaning up FC", currentFC, fcData);
        if (fcData.cleanup) fcData.cleanup();

        fcData.cleanup = null;

        for (const prop of Object.values(props)) {
            if (prop instanceof BaseSignal) {
                // console.log("External signal removing effect");
                for (const effect of fcData.effects) {
                    prop.removeDep(effect);
                }
            }
        }

        fcData.signals.forEach((signal) => signal.clearDeps());
        fcData.signals.clear();
    }
    fcMap.delete(currentFC);
}
