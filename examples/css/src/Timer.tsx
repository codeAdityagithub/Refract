import { createSignal, createEffect, cleanUp, createRef } from "refract-js";

function TimerComponent() {
    const seconds = createSignal<number>(0);
    const ref = createRef();

    createEffect(() => {
        console.log(ref.current);
        const interval = setInterval(() => {
            seconds.update((seconds) => seconds + 1);
        }, 1000);

        // Cleanup function to clear the interval when the component unmounts
        return () => {
            console.log("cleanup");
            clearInterval(interval);
        };
    });

    return <p ref={ref}>Elapsed Time: {() => seconds.value}</p>;
}

export default TimerComponent;
