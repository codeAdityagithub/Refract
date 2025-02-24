import { lazy } from "../lazy/Lazyloading.jsx";
import { cleanUp } from "../rendering/functionalComponents";
import {
    createEffect,
    createPromise,
    createRef,
    createSignal,
} from "../signals/signal";

// Lazy load components
const LazyFC1 = lazy(() => import("./FC1.jsx"));
const LazyFC2 = lazy(() => import("./FC2.jsx"));

const showTextSignal = createSignal<boolean>(true);
export const textSignal = createSignal<string>("Initial Text");

const Test = () => {
    createEffect(() => {
        console.log(showTextSignal.value);
    });

    const h1ref = createRef<HTMLHeadingElement>();

    return (
        <div>
            {/* Static content with reactivity */}
            <h1 ref={h1ref}>{() => textSignal.value}</h1>

            {() =>
                showTextSignal.value ? (
                    <LazyFC2
                        fallback={<h2>Loading...</h2>}
                        errorFallback={(error) => <h2>{error.message}</h2>}
                    />
                ) : (
                    <LazyFC1
                        fallback={"Loading..."}
                        errorFallback={(error) => <h2>{error.message}</h2>}
                    />
                )
            }
            <button
                onClick={() => (showTextSignal.value = !showTextSignal.value)}
            >
                Toggle
            </button>

            {/* Event handlers with reactivity */}
            <button onClick={() => (textSignal.value = "Updated Text")}>
                Update Text
            </button>
        </div>
    );
};
export default Test;
