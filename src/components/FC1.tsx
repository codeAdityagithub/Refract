import { cleanUp, createEffect, createSignal } from "../index";
import { BaseSignal } from "../signals/signal";
import { textSignal } from "./Test";
// import { computed } from "../signals/signal";

const FC1 = () => {
    const str = createSignal<string>("FC1");
    const clicked = createSignal<boolean>(false);
    let value = 0;
    createEffect(() => {
        console.log("Effect", value);
        textSignal.value;
        str.value;
        return () => {
            console.log("Cleanup", value);
            value++;
        };
    });
    cleanUp(() => {
        console.log("Cleanup FC1");
    });
    // const compText = computed(() => "FC1" + str.value);
    return (
        <>
            This is FC1 {() => textSignal.value + str.value}
            <h2>This is {() => str.value}</h2>
            <button
                onClick={() => {
                    clicked.value = !clicked.value;
                    str.value = clicked.value ? "FC1 Clicked" : "FC1";
                }}
                className={() => (textSignal.value ? "clicked" : "")}
            >
                Click
            </button>
        </>
    );
};
export default FC1;
