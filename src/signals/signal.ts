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
import {
    createArrayProxy,
    publicSignal,
    throwInvalidSignalType,
    throwNonPrimitiveError,
    throwNotArray,
    throwNotObject,
    throwNotUpdateCalled,
} from "./utils";

let currentReactiveFunction: any = null;
let currentEffect: any = null;

function setCurrentEffect(effect: any) {
    currentEffect = effect;
}
function clearCurrentEffect() {
    currentEffect = null;
}
function setCurrentReactiveFunction(effect: any) {
    currentReactiveFunction = effect;
}
function clearCurrentReactiveFunction() {
    currentReactiveFunction = null;
}

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

    setCurrentReactiveFunction(fn);
    const retVal = fn();
    clearCurrentReactiveFunction();
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

    setCurrentReactiveFunction(fn);

    const retVal = fn();
    clearCurrentReactiveFunction();

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

    setCurrentEffect(effect);

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

    clearCurrentEffect();
}

function computed<T extends NormalSignal | any[] | Record<any, any>>(
    fn: () => T
) {
    if (typeof fn !== "function")
        throw new Error("computed takes a function as the argument");

    let firstRun = getCurrentFC() !== null;
    setCurrentEffect(() => {
        if (firstRun) {
            firstRun = false;
            return;
        }
        signal.update(fn());
    });

    addEffect(currentEffect);

    const val = fn();

    // @ts-expect-error - Type assertion for signal
    const signal = createSignal<T>(val);

    clearCurrentEffect();
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

export class Ref<T extends EventTarget> {
    current: T | null;
    constructor(val: T | null) {
        this.current = val;
    }
}

export function createRef<T extends EventTarget>() {
    const ref = new Ref<T>(null);
    return ref;
}

type DeepReadonly<T> = {
    readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

/**
 *
 * Base class for signals.
 */
export abstract class BaseSignal<T extends any> {
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

    abstract update(val: T | ((prev: T) => T)): void;
}

type NormalSignal = boolean | string | number | undefined | null | Error;
/**
 * Signal for primitive types.
 */
export class PrimitiveSignal<T extends NormalSignal> extends BaseSignal<T> {
    constructor(val: T) {
        super(val);
    }

    public update(val: T | ((prev: T) => T)) {
        if (typeof val === "function") {
            const newVal = val(this._val);
            if (!isPrimitive(newVal)) {
                throwNonPrimitiveError();
            }
            if (newVal === this._val) return;
            this._val = newVal;
            this.notify();
        } else {
            if (!isPrimitive(val)) {
                throwNonPrimitiveError();
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
            throwNotArray();
        }
        // Call the base constructor with a proxy-wrapped array.
        super(val);
        this._val = this.createProxy(val);
    }

    private createProxy(val: T): T {
        return createArrayProxy(val, this) as T;
    }

    public update(val: T | ((prev: T) => void)) {
        this.updateCalled = true;
        if (typeof val === "function") {
            val(this._val);
        } else {
            if (!Array.isArray(val)) {
                throwNotArray();
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
            throwNotArray();
        }
        super(val);
        this._val = this.createProxy(val);
    }
    private createInternalArrayProxy<A extends any[]>(val: A): A {
        return createArrayProxy(val, this) as A;
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
                    throwNotUpdateCalled();
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
    public update(val: T | ((prev: T) => void)) {
        this.updateCalled = true;
        if (typeof val === "function") {
            val(this._val);
        } else {
            if (!isPlainObject(val)) {
                throwNotObject();
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
    if (typeof val === "object" && val !== null) {
        if (Array.isArray(val)) {
            const signal = new ArraySignal(val);
            addSignal(signal);
            return publicSignal(signal);
        } else if (isPlainObject(val)) {
            const signal = new ObjectSignal(val);
            addSignal(signal);
            return publicSignal(signal);
        } else {
            throwInvalidSignalType(val);
        }
    } else if (isPrimitive(val)) {
        const signal = new PrimitiveSignal(val);
        // @ts-expect-error
        addSignal(signal);
        // @ts-expect-error
        return publicSignal(signal);
    } else {
        throwInvalidSignalType(val);
    }
}

export { computed, createSignal };
