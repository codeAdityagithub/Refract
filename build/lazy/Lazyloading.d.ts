import { ComponentChild } from '../index';
type PropsOf<T extends (...args: any) => any> = Parameters<T> extends [] ? {} : Parameters<T>[0];
export declare function lazy<T extends (props: any) => any>(importFn: () => Promise<{
    default: T;
}>): (props: PropsOf<T> & {
    fallback?: ComponentChild;
    errorFallback?: ComponentChild | ((error: Error) => ComponentChild);
}) => ReturnType<T>;
export {};
