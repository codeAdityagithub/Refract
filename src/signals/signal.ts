import { addEffect, addSignal } from "../rendering/functionalComponents";
import { isPlainObject, isPrimitive } from "../utils/general";
import { addEffectCleanup, batchUpdate } from "./batch";

let currentReactiveFunction: any = null;
let currentEffect: any = null;

function addSignalToReactiveFunction(signal: any) {
    if (!currentReactiveFunction.__signals)
        currentReactiveFunction.__signals = [signal];
    else currentReactiveFunction.__signals.push(signal);
}
function addSignalToEffect(signal: any) {
    if (!currentEffect.__signals) currentEffect.__signals = [signal];
    else currentEffect.__signals.push(signal);
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
    currentEffect = fn;
    addEffect(fn);
    const effectCleanup = fn();
    if (typeof effectCleanup === "function") addEffectCleanup(effectCleanup);
    currentEffect = null;
}

function computed<T extends NormalSignal>(val: () => T): PrimitiveSignal<T>;
function computed<T extends any[]>(val: () => T): ArraySignal<T>;
function computed<T extends Record<any, any>>(val: () => T): ObjectSignal<T>;
function computed<T extends NormalSignal | any[] | Record<any, any>>(
    fn: () => T
) {
    if (typeof fn !== "function")
        throw new Error("computed takes a function as the argument");

    currentEffect = () => {
        signal.value = fn();
    };
    addEffect(currentEffect);
    const val = fn();
    // @ts-expect-error
    const signal = createSignal<T>(val);
    currentEffect = null;

    return signal;
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
            triggerSignal.value.data = val;
            triggerSignal.value.status = "resolved";
        })
        .catch((err) => {
            triggerSignal.value.error = err;
            triggerSignal.value.status = "rejected";
        });

    return triggerSignal;
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

const NonMutatingArrayMethods = [
    "concat",
    "every",
    "filter",
    "find",
    "findIndex",
    "flat",
    "flatMap",
    "forEach",
    "includes",
    "indexOf",
    "join",
    "map",
    "reduce",
    "reduceRight",
    "slice",
    "some",
    "toLocaleString",
    "toString",
];
/**
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
        this.isNotified = true;

        this.deps.forEach((dep) =>
            batchUpdate(() => {
                // Reset the flag before calling the dependency
                this.isNotified = false;
                return dep;
            })
        );
    }

    public removeDep(fn: Function) {
        this.deps.delete(fn);
    }

    public clearDeps() {
        this.deps.clear();
    }

    abstract get value(): T;
    abstract set value(val: T);
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

    set value(val: T) {
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

/**
 * Signal for arrays.
 */
export class ArraySignal<T extends any[]> extends BaseSignal<T> {
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
                    return (...args: any[]) => {
                        const result = value.apply(target, args);
                        // Notify if the method is mutating.
                        if (!NonMutatingArrayMethods.includes(String(prop))) {
                            this.notify();
                        }
                        return result;
                    };
                }
                return value;
            },
            set: (target, prop, newValue) => {
                target[prop as any] = newValue;
                this.notify();
                return true;
            },
        });
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
        return this._val;
    }

    set value(val: T) {
        if (!Array.isArray(val)) {
            throw new Error(
                "Invalid type for ArraySignal; value must be an array"
            );
        }
        if (val === this._val) return;
        this._val = this.createProxy(val);
        this.notify();
    }
}

/**
 * Signal for plain objects.
 */
export class ObjectSignal<T extends Record<any, any>> extends BaseSignal<T> {
    constructor(val: T) {
        if (!isPlainObject(val)) {
            throw new Error(
                "Invalid type for ObjectSignal; value must be a plain object"
            );
        }
        super(val);
        this._val = this.createProxy(val);
    }

    private createProxy(val: T): T {
        return new Proxy(val, {
            set: (target, prop, newValue) => {
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

    get value(): T {
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

    set value(val: T) {
        if (!isPlainObject(val)) {
            throw new Error(
                "Invalid type for ObjectSignal; value must be a plain object"
            );
        }
        if (val === this._val) return;
        this._val = this.createProxy(val);
        this.notify();
    }
}

/**
 * Overloaded factory function to create a signal.
 */
function createSignal<T extends NormalSignal>(val: T): PrimitiveSignal<T>;
function createSignal<T extends any[]>(val: T): ArraySignal<T>;
function createSignal<T extends Record<any, any>>(val: T): ObjectSignal<T>;

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
            return signal;
        } else if (isPlainObject(val)) {
            const signal = new ObjectSignal(val);
            addSignal(signal);
            return signal;
        } else {
            throw new Error(
                "Invalid type for signal initialization: " + typeof val
            );
        }
    } else if (isPrimitive(val)) {
        const signal = new PrimitiveSignal(val);
        addSignal(signal);
        return signal;
    } else {
        throw new Error(
            "Invalid type for signal initialization: " + typeof val
        );
    }
}

export { computed, createSignal };
