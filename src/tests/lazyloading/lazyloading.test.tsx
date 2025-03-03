import { describe, it, expect, vi } from "vitest";

import * as rendering from "../../rendering/render";
import { BaseSignal, createSignal } from "../../signals/signal";
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
        loading: BaseSignal<boolean>,
        error: BaseSignal<Error | null>
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

vi.stubGlobal("requestIdleCallback", (cb) => {
    queueMicrotask(() => cb({ timeRemaining: () => 2 }));
});

// @ts-expect-error
const createFiber = rendering.createFiber;
// @ts-expect-error
const commitFiber = rendering.commitFiber;

describe("lazy component", () => {
    it("renders the fallback initially", () => {
        const FakeComponent = ({ text }) => <div>{text}</div>;
        const fakeImport = vi.fn(() =>
            Promise.resolve({ default: FakeComponent })
        );
        const LazyComponent = lazy(fakeImport);
        const fiber = (
            <div>
                <LazyComponent
                    text={"H"}
                    fallback={<span>Loading...</span>}
                />
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);
        expect(fiber.dom.innerHTML).toBe("<span>Loading...</span>");
    });

    it("loads and renders the component", async () => {
        const FakeComponent = ({ text }) => <div>{text}</div>;
        const fakeImport = vi.fn(
            () =>
                new Promise<{ default: typeof FakeComponent }>((resolve) =>
                    setTimeout(() => resolve({ default: FakeComponent }), 50)
                )
        );

        const LazyComponent = lazy(fakeImport);
        const fiber = (
            <div>
                <LazyComponent
                    text="Hello"
                    fallback={<span>Loading...</span>}
                />
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);
        expect(fiber.dom.innerHTML).toBe("<span>Loading...</span>");

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(fiber.dom.innerHTML).toBe("<div>Hello</div>");
    });

    it("renders error fallback on load failure", async () => {
        const failingImport = vi.fn(
            () =>
                new Promise<{ default: never }>((resolve, reject) =>
                    setTimeout(reject, 50)
                )
        );
        const LazyFailing = lazy(failingImport);

        const fiber = (
            <div>
                <LazyFailing errorFallback={<span>Error</span>} />
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);

        expect(fiber.dom.innerHTML).toBe("");

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(fiber.dom.innerHTML).toBe("<span>Error</span>");
    });
    it("renders error fallback with function on load failure", async () => {
        const failingImport = vi.fn(
            () =>
                new Promise<{ default: never }>((resolve, reject) =>
                    setTimeout(() => reject(new Error("ERROR")), 50)
                )
        );
        const LazyFailing = lazy(failingImport);

        const fiber = (
            <div>
                <LazyFailing
                    errorFallback={(error) => <span>{error.message}</span>}
                />
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);

        expect(fiber.dom.innerHTML).toBe("");

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(fiber.dom.innerHTML).toBe("<span>ERROR</span>");
    });
});
