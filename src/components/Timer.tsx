import {
    createSignal,
    createEffect,
    cleanUp,
    createPromise,
    computed,
} from "../index";

function TimerComponent() {
    const seconds = createSignal<number>(0);
    const other = createSignal({ a: [-1], b: 2, c: 3 });
    // const promise = createPromise(
    //     () =>
    //         new Promise<string>((resolve) =>
    //             setTimeout(() => resolve("hello"), 1000)
    //         )
    // );
    const seconds2 = computed(() => other.value.a[0]);
    // const interval = setInterval(() => {
    //     // other.update((other) => other.a++);
    //     seconds.update((seconds) => seconds + 1);
    // }, 1000);
    createEffect(() => {
        // seconds.update((prev) => prev + 1);
        // seconds.value;
        console.log(other.value);
        return () => {
            console.log("cleanup");
        };
    });

    // cleanUp(() => {
    //     // console.log("FC cleanup");
    //     clearInterval(interval);
    // });

    return (
        <p id="p">
            Elapsed Time: {() => seconds2.value}
            {/* {() => other.value.a.map((i) => <p>{i}</p>)} seconds */}
            <button
                onClick={() => {
                    // other.update((other) => other.a.push(seconds.value));
                    // other.value.a.push(seconds.value);
                    // seconds.update((prev) => prev + 1);
                    other.update((prev) => {
                        prev.a[0]++;
                    });
                }}
            >
                Click
            </button>
        </p>
    );
}

export default TimerComponent;
