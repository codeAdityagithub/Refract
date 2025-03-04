export declare function reactive(fn: Function): any;
export declare function reactiveAttribute(fn: Function): any;
export declare function createEffect(fn: Function): void;
declare function computed<T extends NormalSignal | any[] | Record<any, any>>(fn: () => T): {
    readonly value: DeepReadonly<T>;
};
type PromiseOverload<T> = {
    status: "pending";
    data: null;
    error: null;
} | {
    status: "resolved";
    data: T;
    error: null;
} | {
    status: "rejected";
    data: null;
    error: Error;
};
export declare function createPromise<T>(fn: () => Promise<T>): {
    readonly value: DeepReadonly<PromiseOverload<T>>;
};
export declare class Ref<T extends HTMLElement> {
    current: T | null;
    constructor(val: T | null);
}
export declare function createRef<T extends HTMLElement>(): Ref<T>;
type DeepReadonly<T> = {
    readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};
/**
 *
 * Base class for signals.
 */
export declare abstract class BaseSignal<T> {
    protected _val: T;
    protected deps: Set<Function>;
    protected isNotified: boolean;
    constructor(val: T);
    protected notify(): void;
    removeDep(fn: Function): void;
    clearDeps(): void;
    abstract get value(): T | DeepReadonly<T>;
    abstract update(val: T | ((prev: T) => T)): void;
}
type NormalSignal = boolean | string | number | undefined | null | Error;
/**
 * Signal for primitive types.
 */
export declare class PrimitiveSignal<T extends NormalSignal> extends BaseSignal<T> {
    constructor(val: T);
    get value(): T;
    update(val: T | ((prev: T) => T)): void;
}
/**
 * Signal for arrays.
 */
export declare class ArraySignal<T extends any[]> extends BaseSignal<T> {
    private updateCalled;
    constructor(val: T);
    private createProxy;
    get value(): DeepReadonly<T>;
    update(val: T | ((prev: T) => void)): void;
}
/**
 * Signal for plain objects.
 */
export declare class ObjectSignal<T extends Record<any, any>> extends BaseSignal<T> {
    private updateCalled;
    constructor(val: T);
    private createInternalArrayProxy;
    private createProxy;
    get value(): DeepReadonly<T>;
    update(val: T | ((prev: T) => void)): void;
}
export interface PublicSignal<T> {
    readonly value: DeepReadonly<T>;
    update(val: T | ((prev: T) => T)): void;
}
export interface PublicArraySignal<T extends any[]> extends PublicSignal<T> {
    update(val: T | ((prev: T) => void)): void;
}
export interface PublicObjectSignal<T extends Record<any, any>> extends PublicSignal<T> {
    update(val: T | ((prev: T) => void)): void;
}
/**
 * Overloaded factory function to create a signal.
 */
declare function createSignal<T extends NormalSignal>(val: T): PublicSignal<T>;
declare function createSignal<T extends any[]>(val: T): PublicArraySignal<T>;
declare function createSignal<T extends Record<any, any>>(val: T): PublicObjectSignal<T>;
export { computed, createSignal };
