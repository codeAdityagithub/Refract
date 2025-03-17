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
    setTimeout(() => {
        showTextSignal.update((prev) => !prev);
    }, 2000);
    const h1ref = createRef<HTMLHeadingElement>();
    // console.log("hello");
    return (
        <div>
            {/* Static content with reactivity */}
            <h1 ref={h1ref}>
                <>{() => textSignal.value}</>
            </h1>

            {/* <svg
                width="100"
                height="100"
            >
                <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="green"
                    stroke-width="4"
                    fill="yellow"
                />
            </svg> */}

            {/* <select value="B">
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
            </select> */}
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
