import { createSignal, createEffect, cleanUp } from "../index";

function TimerComponent() {
    const seconds = createSignal<number>(0);
    const other = createSignal({ a: [-1], b: 2, c: 3 });

    const interval = setInterval(() => {
        // other.update((other) => other.a++);
        seconds.update((seconds) => seconds + 1);
    }, 1000);

    createEffect(() => {
        // other.value.a += 1;
        // seconds.value;
        // other.update((other) => other.a.push(seconds.value));
        // console.log(other.value.a);
        // seconds.value;
        // console.log(other.value);
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
        <p id="p">
            {/* Elapsed Time: {() => seconds.value} */}
            {() => other.value.a.map((i) => <p>{i}</p>)} seconds
            <button
                onClick={() => {
                    other.update((other) => other.a.push(seconds.value));
                    // other.value.a.push(seconds.value);
                }}
            >
                Click
            </button>
        </p>
    );
}

export default TimerComponent;
