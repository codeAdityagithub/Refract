type PropsOf<T extends (...args: any) => any> = Parameters<T> extends [] ? {} : Parameters<T>[0];
export declare function lazy<T extends (props: any) => any>(importFn: () => Promise<{
    default: T;
}>): (props: PropsOf<T> & {
    fallback?: string | Node;
    errorFallback?: string | Node | ((error: Error) => Node);
}) => ReturnType<T>;
export {};
