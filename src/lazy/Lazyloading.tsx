import { createSignal, PublicSignal } from "../index";

declare const FRAGMENT = "FRAGMENT";

// If the component takes no parameters, treat its props as {}
type PropsOf<T extends (...args: any) => any> = Parameters<T> extends []
    ? {}
    : Parameters<T>[0];

export function lazy<T extends (props: any) => any>(
    importFn: () => Promise<{ default: T }>
): (
    props: PropsOf<T> & {
        fallback?: string | Node;
        errorFallback?: string | Node | ((error: Error) => Node);
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
        // Validate fallback and errorFallback types
        const isValidNode = (val: any) =>
            typeof val === "string" ||
            (val && typeof val === "object" && "props" in val && "type" in val);

        if (props.fallback !== undefined && !isValidNode(props.fallback)) {
            throw new Error(
                "Invalid fallback: Expected a string or a valid JSX node."
            );
        }
        if (
            props.errorFallback !== undefined &&
            !(
                typeof props.errorFallback === "function" ||
                isValidNode(props.errorFallback)
            )
        ) {
            throw new Error(
                "Invalid errorFallback: Expected a string, a valid JSX node, or a function returning a JSX node."
            );
        }

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
                        : Component && <Component {...props} />
                }
            </>
        ) as unknown as ReturnType<T>;
    };
}
