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

    currentEffect = fn;
    const retVal = fn();
    currentEffect = null;

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

// export function computed<T>(fn: () => T) {
//     if (typeof fn !== "function")
//         throw new Error("createEffect takes a effect function as the argument");
//     currentEffect = fn;
//     const val = fn();
//     currentEffect = null;
//     return val as T;
// }

type NormalSignal = boolean | string | number | undefined | null;
export class Signal<T extends NormalSignal> {
    private val: T;
    private deps: Set<Function>;
    private isNotified: boolean = false;

    constructor(val: T) {
        this.val = val;
        this.deps = new Set();
    }

    get value() {
        if (currentEffect) {
            this.deps.add(currentEffect);
        }
        if (currentReactiveFunction) {
            currentReactiveFunction.__signal = this;
            this.deps.add(currentReactiveFunction);
        }
        // console.log(this.deps);
        return this.val;
    }

    set value(val: T) {
        if (!isPrimitive(val))
            throw new Error(
                "Invalid type for Signal, valid types: [boolean, string, number, undefined, null]"
            );

        if (val === this.val) return;
        this.val = val;

        this.notify();
    }
    private notify() {
        if (this.isNotified) return;
        this.isNotified = true;
        this.deps.forEach((dep) =>
            batchUpdate(() => {
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
export class ArraySignal<T extends any[]> {
    private _val: T;
    private deps: Set<Function>;
    private isNotified: boolean = false;

    private notify() {
        if (this.isNotified) return;
        this.isNotified = true;

        this.deps.forEach((dep) =>
            batchUpdate(() => {
                this.isNotified = false;
                return dep;
            })
        );
    }
    constructor(val: T) {
        if (typeof val !== "object")
            throw new Error(
                "Invalid type for Reference Signal; can be array or object only"
            );

        this.deps = new Set();

        if (Array.isArray(val)) {
            this.createNewProxy(val);
        } else {
            throw new Error(
                "Invalid type for Reference Signal; can be array only"
            );
        }
    }
    get value() {
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
        if (val === this._val) return;
        if (Array.isArray(val)) {
            this.createNewProxy(val);
            this.notify();
        } else {
            throw new Error(
                "Invalid type for Reference Signal; can be array only"
            );
        }
    }
    public removeDep(fn: Function) {
        this.deps.delete(fn);
    }
    public clearDeps() {
        this.deps.clear();
    }
    private createNewProxy(val: T) {
        this._val = new Proxy(val, {
            get: (target, prop) => {
                const val = target[prop];
                // Return the method wrapped with notify logic
                if (typeof val === "function") {
                    return (...args: any[]) => {
                        const result = val.apply(target, args);

                        if (!NonMutatingArrayMethods.includes(String(prop)))
                            this.notify();
                        return result;
                    };
                }
                return val;
            },
            set: (target, prop, value) => {
                target[prop as any] = value; // Update the array
                this.notify(); // Notify changes
                return true;
            },
        });
    }
}
export class ObjectSignal<T extends Record<any, any>> {
    private _val: T;
    private deps: Set<Function>;
    private isNotified: boolean = false;

    private notify() {
        if (this.isNotified) return;
        this.isNotified = true;

        this.deps.forEach((dep) =>
            batchUpdate(() => {
                this.isNotified = false;
                return dep;
            })
        );
    }
    constructor(val: T) {
        if (!isPlainObject(val))
            throw new Error(
                "Invalid type for Reference Signal; can be object only"
            );

        this.deps = new Set();

        this.createNewProxy(val);
    }
    get value() {
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
        if (!isPlainObject(val))
            throw new Error(
                "Invalid type for Reference Signal; can be object only"
            );
        if (val === this._val) return;

        this.createNewProxy(val);
        this.notify();
    }
    public removeDep(fn: Function) {
        this.deps.delete(fn);
    }

    public clearDeps() {
        this.deps.clear();
    }
    private createNewProxy(val: any) {
        this._val = this.newProxy(val);
    }
    private newProxy(val: any) {
        return new Proxy(val, {
            set: (target, prop, value) => {
                if (typeof value === "function") return false;
                if (typeof value === "object" && value !== null) {
                    value = this.newProxy(value);
                }
                if (value === target[prop]) return true;
                target[prop] = value; // Update the object
                this.notify(); // Notify changes
                return true;
            },
            deleteProperty: (target, key) => {
                // Handle deletion
                const result = delete target[key];
                // Trigger reactivity
                this.notify();
                return result;
            },
        });
    }
}

function createSignal<T extends NormalSignal>(val: T): Signal<T>;
function createSignal<T extends any[]>(val: T): ArraySignal<T>;
function createSignal<T extends Record<any, any>>(val: T): ObjectSignal<T>;

function createSignal<T extends NormalSignal | any[] | Record<any, any>>(
    val: T
) {
    if (typeof val === "function")
        throw new Error("Functions cannot be used as signal value");

    if (typeof val === "object" && val !== null) {
        if (Array.isArray(val)) return new ArraySignal(val);
        else if (Object.prototype.toString.call(val) === "[object Object]") {
            return new ObjectSignal(val);
        } else {
            throw new Error(
                "Invalid type for signal initialization: " + typeof val
            );
        }
    } else if (isPrimitive(val)) {
        // @ts-expect-error
        return new Signal(val);
    } else {
        throw new Error(
            "Invalid type for signal initialization: " + typeof val
        );
    }
}

export { createSignal };
