import { createEffect, createSignal } from "../index";
// import { computed } from "../signals/signal";

const FC1 = ({ textSignal }) => {
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
    // const compText = computed(() => "FC1" + str.value);
    return (
        <>
            This is FC1
            <h2>This is {() => textSignal.value}</h2>
            <button
                onClick={() => {
                    clicked.value = !clicked.value;
                    str.value = clicked.value ? "FC1 Clicked" : "FC1";
                }}
            >
                Click
            </button>
        </>
    );
};
export default FC1;
