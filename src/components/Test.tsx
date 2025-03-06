import { lazy } from "../../src/lazy/Lazyloading.jsx";
import {
    createEffect,
    createRef,
    createSignal,
} from "../../src/signals/signal.js";

// Lazy load components
const LazyFC1 = lazy(() => import("./FC1.jsx"));
const LazyFC2 = lazy(() => import("./FC2.jsx"));

export const textSignal = createSignal<string>("Initial Text");

const Test = () => {
    const showTextSignal = createSignal<boolean>(true);
    createEffect(() => {
        console.log(showTextSignal.value, "Effect");

        return () => {
            console.log("cleanup");
        };
    });

    const h1ref = createRef<HTMLHeadingElement>();
    // console.log("hello");
    return (
        <div>
            {/* Static content with reactivity */}
            <h1 ref={h1ref}>
                <>{() => textSignal.value}</>
            </h1>

            {/* {() =>
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
            } */}
            <button onClick={() => showTextSignal.update((prev) => !prev)}>
                Toggle
            </button>

            {/* Event handlers with reactivity
            <button onClick={() => (textSignal.value = "Updated Text")}>
                Update Text
            </button> */}
        </div>
    );
};
export default Test;
