import { cleanUp, createSignal } from "../index";

const FC1 = () => {
    const str = createSignal<string>("FC1");
    const clicked = createSignal<boolean>(false);
    const interval = setInterval(() => {
        console.log("Interval");
    }, 1000);

    cleanUp(() => {
        clearInterval(interval);
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
