/**
 * Signal for arrays.
 */
export declare const FRAGMENT = "FRAGMENT";

export declare class ArraySignal<T extends any[]> extends BaseSignal<T> {
    constructor(val: T);
    private createProxy;
    get value(): T;
    set value(val: T);
}

/**
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
    abstract get value(): T;
    abstract set value(val: T);
}

export declare function cleanUp(fn: Function): void;

export declare function computed<T extends NormalSignal>(
    val: () => T
): PrimitiveSignal<T>;

export declare function computed<T extends any[]>(val: () => T): ArraySignal<T>;

export declare function computed<T extends Record<any, any>>(
    val: () => T
): ObjectSignal<T>;

export declare function createEffect(fn: Function): void;

export declare function createElement(
    type: any,
    props: object | null,
    ...children: any[]
): Fiber | FiberChildren;

export declare function createPromise<T>(
    fn: () => Promise<T>
): ObjectSignal<PromiseOverload<T>>;

export declare function createRef<T extends HTMLElement>(): Ref<T>;

/**
 * Overloaded factory function to create a signal.
 */
export declare function createSignal<T extends NormalSignal>(
    val: T
): PrimitiveSignal<T>;

export declare function createSignal<T extends any[]>(val: T): ArraySignal<T>;

export declare function createSignal<T extends Record<any, any>>(
    val: T
): ObjectSignal<T>;

declare type Fiber = {
    type: Type;
    props: Props & {
        children: FiberChildren;
    };
    dom?: HTMLElement | Text;
    parent: Fiber;
    renderFunction?: RenderFunction;
};

declare type FiberChildren = Fiber[];

export declare function lazy<T extends (props: any) => any>(
    importFn: () => Promise<{
        default: T;
    }>
): (
    props: PropsOf<T> & {
        fallback?: string | Node;
        errorFallback?: string | Node | ((error: Error) => Node);
    }
) => ReturnType<T>;

declare type NormalSignal =
    | boolean
    | string
    | number
    | undefined
    | null
    | Error;

/**
 * Signal for plain objects.
 */
export declare class ObjectSignal<
    T extends Record<any, any>
> extends BaseSignal<T> {
    constructor(val: T);
    private createInternalArrayProxy;
    private createProxy;
    get value(): T;
    set value(val: T);
}

/**
 * Signal for primitive types.
 */
export declare class PrimitiveSignal<
    T extends NormalSignal
> extends BaseSignal<T> {
    constructor(val: T);
    get value(): T;
    set value(val: T);
}

declare type PromiseOverload<T> =
    | {
          status: "pending";
          data: null;
          error: null;
      }
    | {
          status: "resolved";
          data: T;
          error: null;
      }
    | {
          status: "rejected";
          data: null;
          error: Error;
      };

declare type Props =
    | {
          [key: string]: any;
          children: Fiber[];
      }
    | {
          nodeValue: string;
          children: [];
          [key: string]: any;
      };

declare type PropsOf<T extends (...args: any) => any> = Parameters<T> extends []
    ? {}
    : Parameters<T>[0];

declare class Ref<T extends HTMLElement> {
    current: T | null;
    constructor(val: T | null);
}

export declare function render(element: Fiber, container: HTMLElement): void;

declare type RenderFunction = () => any;

declare type Type =
    | string
    | "TEXT_CHILD"
    | "SIGNAL_CHILD"
    | "FRAGMENT"
    | Function;

export {};
