import { BaseSignal } from "./signal";

export const MutatingMethods = [
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

function isMutating(prop: any) {
    return MutatingMethods.includes(String(prop));
}

const isProd =
    // @ts-expect-error
    process.env.NODE_ENV === "production" ||
    // @ts-expect-error
    import.meta.env.MODE === "production";

export function throwNonPrimitiveError() {
    if (isProd) return;
    throw new Error(
        "Invalid type for PrimitiveSignal. Valid types: [boolean, string, number, undefined, null]"
    );
}
export function throwNotUpdateCalled() {
    if (isProd) return;
    throw new Error(
        "Cannot set a value on a signal, use the update method instead."
    );
}
export function throwNotArray() {
    if (isProd) return;
    throw new Error("Invalid type for ArraySignal; value must be an array");
}
export function throwNotObject() {
    if (isProd) return;
    throw new Error("Invalid type for ObjectSignal; value must be an object");
}
export function throwInvalidSignalType(val: any) {
    if (isProd) return;
    throw new Error("Invalid type for signal initialization: " + typeof val);
}

export function publicSignal(signal: BaseSignal<any>) {
    return {
        get value() {
            return signal.value;
        },
        update: signal.update.bind(signal) as typeof signal.update,
    };
}

export const createArrayProxy = (arr: any[], signal: any) => {
    return new Proxy(arr, {
        get: (target, prop) => {
            const value = target[prop as any];
            // If a function is accessed, wrap it to trigger notifications on mutation.

            if (typeof value === "function") {
                if (isMutating(prop) && !signal.updateCalled) {
                    throw new Error(
                        "Cannot set a value on an array signal, use the update method for updating the array."
                    );
                }

                return (...args: any[]) => {
                    const result = value.apply(target, args);
                    // Notify if the method is mutating.
                    if (isMutating(prop)) {
                        signal.notify();
                    }
                    return result;
                };
            }
            return value;
        },
        set: (target, prop, newValue) => {
            if (!signal.updateCalled) {
                throw new Error(
                    "Cannot set a value on an array signal, use the update method for updating the array."
                );
            }
            target[prop as any] = newValue;

            signal.notify();
            return true;
        },
    });
};
