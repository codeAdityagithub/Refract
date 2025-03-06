import {
    addEffect,
    addSignal,
    cleanUp,
    cleanUpWFiber,
    getCurrentFC,
} from "../rendering/functionalComponents";
import { Fiber } from "../types";
import { isPlainObject, isPrimitive } from "../utils/general";
import { batchUpdate } from "./batch";

let currentReactiveFunction: any = null;
let currentEffect: any = null;

function addSignalToReactiveFunction(signal: any) {
    if (!currentReactiveFunction.__signals) {
        currentReactiveFunction.__signals = new Set();
    }
    currentReactiveFunction.__signals.add(signal);
}
function addSignalToEffect(signal: any) {
    if (!currentEffect.__signals) currentEffect.__signals = new Set();
    currentEffect.__signals.add(signal);
}

export function reactive(fn: Function) {
    if (typeof fn !== "function")
        throw new Error("reactive takes a render function as the argument");

    currentReactiveFunction = fn;
    const retVal = fn();
    currentReactiveFunction = null;
    if (
        !isPrimitive(retVal) &&
        isPlainObject(retVal) &&
        !retVal.type &&
        !retVal.props &&
        !retVal.props?.children
    )
        throw new Error(
            "Reactive value must be primitive or functional component, got: " +
                typeof retVal
        );
    return retVal;
}
export function reactiveAttribute(fn: Function) {
    if (typeof fn !== "function")
        throw new Error("reactive takes a render function as the argument");

    currentReactiveFunction = fn;
    const retVal = fn();
    currentReactiveFunction = null;

    return retVal;
}
export function createEffect(fn: Function) {
    if (typeof fn !== "function")
        throw new Error("createEffect takes a effect function as the argument");

    addEffect(fn);
    if (!getCurrentFC()) runEffect(fn);
}

export function runEffect(effect: Function, fiber?: Fiber) {
    if (typeof effect !== "function") return;

    currentEffect = effect;

    const effectCleanup = effect();

    if (currentEffect.__signals && typeof effectCleanup === "function") {
        currentEffect.__cleanup = effectCleanup;
    }

    if (
        !currentEffect.__signals &&
        effectCleanup &&
        typeof effectCleanup === "function"
    ) {
        // which means this effect does not have any signals associated with so its just a cleanup function that we need to call when the component unmounts
        if (!fiber) {
            cleanUp(effectCleanup);
        } else {
            cleanUpWFiber(effectCleanup, fiber);
        }
    }

    currentEffect = null;
}

function computed<T extends NormalSignal | any[] | Record<any, any>>(
    fn: () => T
) {
    if (typeof fn !== "function")
        throw new Error("computed takes a function as the argument");

    let firstRun = getCurrentFC() !== null;
    currentEffect = () => {
        if (firstRun) {
            firstRun = false;
            return;
        }
        signal.update(fn());
    };

    addEffect(currentEffect);

    const val = fn();

    // @ts-expect-error - Type assertion for signal
    const signal = createSignal<T>(val);

    currentEffect = null;
    return {
        get value() {
            return signal.value;
        },
    };
}

type PromiseOverload<T> =
    | { status: "pending"; data: null; error: null }
    | { status: "resolved"; data: T; error: null }
    | { status: "rejected"; data: null; error: Error };

export function createPromise<T>(fn: () => Promise<T>) {
    if (typeof fn !== "function")
        throw new Error("createPromise takes a function as the argument");
    const promise = fn();

    if (!(promise instanceof Promise)) {
        throw new Error(
            "createPromise takes a function that returns a promise"
        );
    }
    const triggerSignal = createSignal<PromiseOverload<T>>({
        status: "pending",
        data: null,
        error: null,
    });

    promise
        .then((val) => {
            triggerSignal.update((prev) => {
                prev.data = val;
                prev.status = "resolved";
            });
        })
        .catch((err) => {
            triggerSignal.update((prev) => {
                prev.error = err;
                prev.status = "rejected";
            });
        });

    return {
        get value() {
            return triggerSignal.value;
        },
    };
}

export class Ref<T extends HTMLElement> {
    current: T | null;
    constructor(val: T | null) {
        this.current = val;
    }
}

export function createRef<T extends HTMLElement>() {
    const ref = new Ref<T>(null);
    return ref;
}

// const NonMutatingArrayMethods = [
//     "constructor",
//     "concat",
//     "every",
//     "filter",
//     "find",
//     "findIndex",
//     "flat",
//     "flatMap",
//     "forEach",
//     "includes",
//     "indexOf",
//     "join",
//     "map",
//     "reduce",
//     "reduceRight",
//     "slice",
//     "some",
//     "toLocaleString",
//     "toString",
// ];
const MutatingMethods = [
    "push",
    "pop",
    "unshift",
    "shift",
    "splice",
    "fill",
    "copyWithin",
    "sort",
    "reverse",
];

type DeepReadonly<T> = {
    readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

/**
 *
 * Base class for signals.
 */
export abstract class BaseSignal<T> {
    protected _val: T;
    protected deps: Set<Function>;
    protected isNotified: boolean = false;

    constructor(val: T) {
        this._val = val;
        this.deps = new Set();
    }

    protected notify() {
        if (this.isNotified) return;

        if (this.deps.size !== 0) this.isNotified = true;

        this.deps.forEach((dep) => {
            batchUpdate(() => {
                // Reset the flag before calling the dependency
                this.isNotified = false;
                return dep;
            });
        });
    }

    public removeDep(fn: Function) {
        this.deps.delete(fn);
    }

    public clearDeps() {
        this.deps.clear();
    }

    abstract get value(): T | DeepReadonly<T>;

    abstract update(val: T | ((prev: T) => T)): void;
}

type NormalSignal = boolean | string | number | undefined | null | Error;
/**
 * Signal for primitive types.
 */
export class PrimitiveSignal<T extends NormalSignal> extends BaseSignal<T> {
    constructor(val: T) {
        if (!isPrimitive(val)) {
            throw new Error(
                "Invalid type for PrimitiveSignal. Valid types: [boolean, string, number, undefined, null]"
            );
        }
        super(val);
    }

    get value(): T {
        if (currentEffect) {
            this.deps.add(currentEffect);
            addSignalToEffect(this);
        }
        if (currentReactiveFunction) {
            this.deps.add(currentReactiveFunction);

            addSignalToReactiveFunction(this);
        }
        // (Optional) debug logging:
        // console.log(this.deps);
        return this._val;
    }

    public update(val: T | ((prev: T) => T)) {
        if (typeof val === "function") {
            const newVal = val(this._val);
            if (!isPrimitive(newVal)) {
                throw new Error(
                    "Invalid type for PrimitiveSignal. Valid types: [boolean, string, number, undefined, null]"
                );
            }
            if (newVal === this._val) return;
            this._val = newVal;
            this.notify();
        } else {
            if (!isPrimitive(val)) {
                throw new Error(
                    "Invalid type for PrimitiveSignal. Valid types: [boolean, string, number, undefined, null]"
                );
            }
            if (val === this._val) return;

            this._val = val;

            this.notify();
        }
    }
}

/**
 * Signal for arrays.
 */
export class ArraySignal<T extends any[]> extends BaseSignal<T> {
    private updateCalled: boolean = false;

    constructor(val: T) {
        if (!Array.isArray(val)) {
            throw new Error(
                "Invalid type for ArraySignal; value must be an array"
            );
        }
        // Call the base constructor with a proxy-wrapped array.
        super(val);
        this._val = this.createProxy(val);
    }

    private createProxy(val: T): T {
        return new Proxy(val, {
            get: (target, prop) => {
                const value = target[prop as any];
                // If a function is accessed, wrap it to trigger notifications on mutation.

                if (typeof value === "function") {
                    if (
                        MutatingMethods.includes(String(prop)) &&
                        !this.updateCalled
                    ) {
                        throw new Error(
                            "Cannot set a value on an array signal, use the update method for updating the array."
                        );
                    }

                    return (...args: any[]) => {
                        const result = value.apply(target, args);
                        // Notify if the method is mutating.
                        if (MutatingMethods.includes(String(prop))) {
                            this.notify();
                        }
                        return result;
                    };
                }
                return value;
            },
            set: (target, prop, newValue) => {
                if (!this.updateCalled) {
                    throw new Error(
                        "Cannot set a value on an array signal, use the update method for updating the array."
                    );
                }
                target[prop as any] = newValue;
                this.notify();
                return true;
            },
        });
    }

    get value(): DeepReadonly<T> {
        if (currentEffect) {
            this.deps.add(currentEffect);
            addSignalToEffect(this);
        }
        if (currentReactiveFunction) {
            this.deps.add(currentReactiveFunction);
            addSignalToReactiveFunction(this);
        }

        return this._val;
    }

    public update(val: T | ((prev: T) => void)) {
        this.updateCalled = true;
        if (typeof val === "function") {
            val(this._val);
        } else {
            if (!Array.isArray(val)) {
                throw new Error(
                    "Invalid type for ArraySignal; value must be an array"
                );
            }
            if (val === this._val) return;

            this._val = this.createProxy(val);

            this.notify();
        }
        this.updateCalled = false;
    }
}

/**
 * Signal for plain objects.
 */
export class ObjectSignal<T extends Record<any, any>> extends BaseSignal<T> {
    private updateCalled: boolean = false;
    constructor(val: T) {
        if (!isPlainObject(val)) {
            throw new Error(
                "Invalid type for ObjectSignal; value must be a plain object"
            );
        }
        super(val);
        this._val = this.createProxy(val);
    }
    private createInternalArrayProxy<A extends any[]>(val: A): A {
        return new Proxy(val, {
            get: (target, prop) => {
                const value = target[prop as any];
                // If a function is accessed, wrap it to trigger notifications on mutation.
                if (typeof value === "function") {
                    if (
                        !this.updateCalled &&
                        MutatingMethods.includes(String(prop))
                    ) {
                        throw new Error(
                            "Cannot set a value on an object signal, use the update method for updating the object."
                        );
                    }

                    return (...args: any[]) => {
                        const result = value.apply(target, args);
                        // Notify if the method is mutating.
                        if (MutatingMethods.includes(String(prop))) {
                            this.notify();
                        }
                        return result;
                    };
                }
                return value;
            },
            set: (target, prop, newValue) => {
                if (!this.updateCalled) {
                    throw new Error(
                        "Cannot set a value on an object signal, use the update method for updating the object."
                    );
                }
                target[prop as any] = newValue;
                this.notify();
                return true;
            },
        });
    }
    private createProxy(val: T): T {
        return new Proxy(val, {
            get: (target, prop) => {
                const value = target[prop as any];
                if (Array.isArray(value)) {
                    // @ts-expect-error
                    target[prop as any] =
                        this.createInternalArrayProxy<typeof value>(value);

                    return target[prop as any];
                }
                // console.log("get", target, prop, value);
                return value;
            },
            set: (target, prop, newValue) => {
                if (!this.updateCalled) {
                    throw new Error(
                        "Cannot set a value on an object signal, use the update method for updating the object."
                    );
                }
                // Do not allow functions to be set as values.
                if (typeof newValue === "function") return false;
                // For nested objects, wrap them as well.
                if (typeof newValue === "object" && newValue !== null) {
                    newValue = this.createProxy(newValue);
                }
                if (newValue === target[prop as any]) return true;

                // @ts-expect-error
                target[prop as any] = newValue;

                this.notify();

                return true;
            },
            deleteProperty: (target, prop) => {
                const result = delete target[prop as any];
                this.notify();
                return result;
            },
        });
    }

    get value(): DeepReadonly<T> {
        if (currentEffect) {
            this.deps.add(currentEffect);
            addSignalToEffect(this);
        }
        if (currentReactiveFunction) {
            this.deps.add(currentReactiveFunction);
            addSignalToReactiveFunction(this);
        }
        return this._val;
    }

    public update(val: T | ((prev: T) => void)) {
        this.updateCalled = true;
        if (typeof val === "function") {
            val(this._val);
        } else {
            if (!isPlainObject(val)) {
                throw new Error(
                    "Invalid type for ObjectSignal; value must be a plain object"
                );
            }
            if (val === this._val) return;
            this._val = this.createProxy(val);
            this.notify();
        }
        this.updateCalled = false;
    }
}

export interface PublicSignal<T> {
    readonly value: DeepReadonly<T>;
    update(val: T | ((prev: T) => T)): void;
}

export interface PublicArraySignal<T extends any[]> extends PublicSignal<T> {
    update(val: T | ((prev: T) => void)): void; // Mutation allowed
}

export interface PublicObjectSignal<T extends Record<any, any>>
    extends PublicSignal<T> {
    update(val: T | ((prev: T) => void)): void; // Mutation allowed
}
/**
 * Overloaded factory function to create a signal.
 */
function createSignal<T extends NormalSignal>(val: T): PublicSignal<T>;
function createSignal<T extends any[]>(val: T): PublicArraySignal<T>;
function createSignal<T extends Record<any, any>>(
    val: T
): PublicObjectSignal<T>;

function createSignal<T extends NormalSignal | any[] | Record<any, any>>(
    val: T
) {
    if (typeof val === "function") {
        throw new Error("Functions cannot be used as signal value");
    }

    if (typeof val === "object" && val !== null) {
        if (Array.isArray(val)) {
            const signal = new ArraySignal(val);
            addSignal(signal);
            return {
                get value() {
                    return signal.value;
                },
                update: signal.update.bind(signal) as typeof signal.update,
            };
        } else if (isPlainObject(val)) {
            const signal = new ObjectSignal(val);
            addSignal(signal);
            return {
                get value() {
                    return signal.value;
                },
                update: signal.update.bind(signal) as typeof signal.update,
            };
        } else {
            throw new Error(
                "Invalid type for signal initialization: " + typeof val
            );
        }
    } else if (isPrimitive(val)) {
        const signal = new PrimitiveSignal(val);
        addSignal(signal);
        return {
            get value() {
                return signal.value;
            },
            update: signal.update.bind(signal) as typeof signal.update,
        };
    } else {
        throw new Error(
            "Invalid type for signal initialization: " + typeof val
        );
    }
}

export { computed, createSignal };
