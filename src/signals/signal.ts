import { getCurrentFC } from "../rendering/cleanup";
import { isPlainObject, isPrimitive } from "../utils/general";
import { addEffectCleanup, batchUpdate } from "./batch";

let currentReactiveFunction: any = null;
let currentEffect: any = null;

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
    const effectCleanup = fn();
    if (typeof effectCleanup === "function") addEffectCleanup(effectCleanup);
    currentEffect = null;
}

// export function computed<T extends NormalSignal | any[] | Record<any, any>>(
//     fn: () => T
// ) {
//     if (typeof fn !== "function")
//         throw new Error("createEffect takes a effect function as the argument");

//     currentEffect = () => {
//         signal.value = fn();
//     };
//     const val = fn();
//     const signal = createSignal(val);
//     currentEffect = null;

//     return signal;
// }

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
abstract class BaseSignal<T> {
    protected _val: T;
    protected deps: Set<Function>;
    protected isNotified: boolean = false;

    constructor(val: T) {
        this._val = val;
        this.deps = new Set();

        const currentFC = getCurrentFC();
        if (currentFC && currentFC.__signals && currentFC.__signals.push) {
            currentFC.__signals.push(this);
        }
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

type NormalSignal = boolean | string | number | undefined | null;
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
        }
        if (currentReactiveFunction) {
            currentReactiveFunction.__signal = this;
            this.deps.add(currentReactiveFunction);
        }
        // (Optional) debug logging:
        console.log(this.deps);
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
        }
        if (currentReactiveFunction) {
            currentReactiveFunction.__signal = this;
            this.deps.add(currentReactiveFunction);
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
        }
        if (currentReactiveFunction) {
            currentReactiveFunction.__signal = this;
            this.deps.add(currentReactiveFunction);
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
            return new ArraySignal(val);
        } else if (Object.prototype.toString.call(val) === "[object Object]") {
            return new ObjectSignal(val);
        } else {
            throw new Error(
                "Invalid type for signal initialization: " + typeof val
            );
        }
    } else if (isPrimitive(val)) {
        // @ts-expect-error
        return new PrimitiveSignal(val);
    } else {
        throw new Error(
            "Invalid type for signal initialization: " + typeof val
        );
    }
}

export { createSignal };
