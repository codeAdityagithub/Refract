import { ComponentChild, createSignal, PublicSignal } from "../index";

declare const FRAGMENT = "FRAGMENT";

// If the component takes no parameters, treat its props as {}
type PropsOf<T extends (...args: any) => any> = Parameters<T> extends []
    ? {}
    : Parameters<T>[0];

export function lazy<T extends (props: any) => any>(
    importFn: () => Promise<{ default: T }>
): (
    props: PropsOf<T> & {
        fallback?: ComponentChild;
        errorFallback?: ComponentChild | ((error: Error) => ComponentChild);
    }
) => ReturnType<T> {
    let Component: T | null = null;

    const load = (
        loading: PublicSignal<boolean>,
        error: PublicSignal<Error | null>
    ) => {
        if (!Component) {
            importFn()
                .then((mod) => {
                    if (mod.default) {
                        if (typeof mod.default !== "function") {
                            throw new Error(
                                "Lazy-loaded component must be a functional component"
                            );
                        }
                        Component = mod.default;

                        loading.update(false);
                        error.update(null);
                    } else {
                        error.update(
                            new Error(
                                "No default export found from lazy-loaded module"
                            )
                        );
                    }
                })
                .catch((err) => {
                    error.update(err);
                    loading.update(false);
                });
        } else {
            loading.update(false);
            error.update(null);
        }
    };

    return (
        props: PropsOf<T> & {
            fallback?: Node;
            errorFallback?: Node;
        }
    ): ReturnType<T> => {
        const loading = createSignal<boolean>(true);
        const error = createSignal<Error | null>(null);

        load(loading, error);

        return (
            <>
                {() =>
                    loading.value
                        ? props.fallback
                        : error.value !== null
                        ? props.errorFallback
                            ? typeof props.errorFallback === "function"
                                ? props.errorFallback(error.value)
                                : props.errorFallback
                            : "Unknown error occurred while lazy loading component, use errorFallback prop to override"
                        : // @ts-expect-error
                          Component && <Component {...props} />
                }
            </>
        ) as unknown as ReturnType<T>;
    };
}
