import { createEffect, createSignal } from "../index";

const FC1 = () => {
    const str = createSignal<string>("FC1");
    const clicked = createSignal<boolean>(false);
    let value = 0;
    createEffect(() => {
        console.log("Effect", value);

        str.value;
        return () => {
            console.log("Cleanup", value);
            value++;
        };
    });
    return (
        <>
            This is FC1
            <h2>This is {() => str.value}</h2>
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
