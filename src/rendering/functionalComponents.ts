import { BaseSignal } from "../signals/signal";

let currentFC = null;
let fcMap = new WeakMap<
    Function,
    {
        signals: Set<BaseSignal<any>>;
        cleanup: Function | null;
        effects: Set<Function>;
    }
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
        // console.log(currentFC, fcMap.has(currentFC));
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
                effects: new Set(),
            });
        }
    }
}

export function addEffect(fn: Function) {
    if (currentFC) {
        if (fcMap.has(currentFC)) {
            const fcData = fcMap.get(currentFC)!;
            fcData.effects.add(fn);
        } else {
            const effects = new Set<Function>();
            effects.add(fn);
            fcMap.set(currentFC, {
                signals: new Set(),
                cleanup: null,
                effects: effects,
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
                effects: new Set(),
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

        for (const effect of fcData.effects) {
            // @ts-expect-error
            if (effect.__signals && Array.isArray(effect.__signals)) {
                // @ts-expect-error
                for (const signal of effect.__signals) {
                    signal.removeDep(effect);
                }
            }
            // @ts-expect-error
            delete effect.__signals;
        }

        fcData.signals.forEach((signal) => signal.clearDeps());
        fcData.signals.clear();
    }
    fcMap.delete(currentFC);
}
