import { ComponentChildren } from '../index';
type PropsOf<T extends (...args: any) => any> = Parameters<T> extends [] ? {} : Parameters<T>[0];
export declare function lazy<T extends (props: any) => any>(importFn: () => Promise<{
    default: T;
}>): (props: PropsOf<T> & {
    fallback?: ComponentChildren;
    errorFallback?: ComponentChildren | ((error: Error) => ComponentChildren);
}) => ReturnType<T>;
export {};
