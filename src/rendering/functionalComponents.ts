import { BaseSignal, runEffect } from "../signals/signal";
import { Fiber } from "../types";

let currentFC: Fiber | null = null;
let fcMap = new WeakMap<
    Fiber,
    {
        signals: Set<BaseSignal<any>>;
        cleanup: Function[];
        effects: Set<Function>;
    }
>();

export function setCurrentFC(fc: Fiber) {
    currentFC = fc;
}

export function clearCurrentFC() {
    currentFC = null;
}
export function getCurrentFC() {
    return currentFC;
}

function getNewFC(): any {
    return {
        signals: new Set(),
        cleanup: [],
        effects: new Set(),
    };
}

export function runAllEffects(FC: Fiber) {
    if (fcMap.has(FC)) {
        const fcData = fcMap.get(FC)!;

        for (const effect of fcData.effects) {
            runEffect(effect, FC);
        }
    }
}

export function cleanUp(fn: Function) {
    if (currentFC) {
        // console.log(currentFC, fcMap.has(currentFC));
        if (fcMap.has(currentFC)) {
            fcMap.get(currentFC)!.cleanup.push(fn);
        } else {
            let newFC = getNewFC();
            newFC.cleanup.push(fn);
            fcMap.set(currentFC, newFC);
        }
    }
}
export function cleanUpWFiber(fn: Function, fiber: Fiber) {
    if (fiber) {
        // console.log(currentFC, fcMap.has(currentFC));
        if (fcMap.has(fiber)) {
            fcMap.get(fiber)!.cleanup.push(fn);
        } else {
            let newFC = getNewFC();
            newFC.cleanup.push(fn);
            fcMap.set(fiber, newFC);
        }
    }
}

export function addEffect(fn: Function) {
    if (currentFC) {
        if (fcMap.has(currentFC)) {
            fcMap.get(currentFC)!.effects.add(fn);
        } else {
            let newFC = getNewFC();
            newFC.effects.add(fn);
            fcMap.set(currentFC, newFC);
        }
    }
}
export function addSignal(signal: BaseSignal<any>) {
    if (currentFC) {
        if (fcMap.has(currentFC)) {
            fcMap.get(currentFC)!.signals.add(signal);
        } else {
            let newFC = getNewFC();
            newFC.signals.add(signal);
            fcMap.set(currentFC, newFC);
        }
    }
}

export function cleanUpFC(currentFC, props) {
    const fcData = fcMap.get(currentFC)!;
    if (fcData) {
        // console.log("Cleaning up FC", currentFC, fcData);
        if (fcData.cleanup) {
            for (const fn of fcData.cleanup) {
                fn();
            }
        }

        fcData.cleanup = [];

        for (const effect of fcData.effects) {
            // @ts-expect-error
            if (effect.__cleanup) {
                // @ts-expect-error
                effect.__cleanup();
            }
            // @ts-expect-error
            if (effect.__signals) {
                // @ts-expect-error
                for (const signal of effect.__signals) {
                    signal.removeDep(effect);
                }
            }
            // @ts-expect-error
            delete effect.__signals;
            // @ts-expect-error
            delete effect.__cleanup;
        }

        fcData.signals.forEach((signal) => signal.clearDeps());
        fcData.signals.clear();
    }
    fcMap.delete(currentFC);
}
