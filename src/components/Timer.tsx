import {
    createSignal,
    createEffect,
    cleanUp,
    createPromise,
    computed,
    createRef,
} from "../index";

function TimerComponent() {
    const ref = createRef();
    const other = createSignal({ a: [-1], b: 2, c: 3 });

    const seconds = createSignal<number>(0);
    const seconds2 = computed(() => {
        console.log("hello");
        return seconds.value * 2;
    });

    createEffect(() => {
        // seconds.value;
        // seconds.update((prev) => prev + 1);
        // console.log(ref.current);
        console.log(seconds2.value);
        // console.log("first");
        return () => {
            console.log("cleanup");
        };
    });
    // console.log("inside fc");
    return (
        <>
            <p id="p">
                Elapsed Time: {() => seconds.value}
                Computed Time: {() => seconds2.value}
                <button
                    onClick={() => {
                        // other.update((prev) => {
                        //     prev.a[0]++;
                        // });
                        seconds.update((prev) => prev + 1);
                    }}
                >
                    Click
                </button>
            </p>
            {/* <div>
                <p ref={ref}>I am the last child of TimerComponent</p>
            </div> */}
        </>
    );
}

export default TimerComponent;
