import { createSignal, createEffect, cleanUp } from "refract-js";

function TimerComponent() {
    const seconds = createSignal<number>(0);
    const other = createSignal([1, 2, 3]);

    const interval = setInterval(() => {
        seconds.update((seconds) => seconds + 1);
    }, 1000);

    createEffect(() => {
        console.log("Effect");
        other.update((prev) => prev.push(4));
        // Cleanup function to clear the interval when the component unmounts
        return () => {
            console.log("cleanup");
        };
    });

    cleanUp(() => {
        // console.log("FC cleanup");
        clearInterval(interval);
    });

    return (
        <p>
            Elapsed Time: {() => seconds.value}
            {() => other.value.map((i) => i)} seconds
        </p>
    );
}

export default TimerComponent;
