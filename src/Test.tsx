import { createEffect, createSignal } from "../signals";

const Test = () => {
    const list = createSignal({ name: "Aditya", age: 20 });
    createEffect(() => {
        console.log(list.value);
    });
    return (
        <>
            <h3
                onClick={() => {
                    list.value.age = 40;
                }}
            >
                List
            </h3>
            <ul className="">
                {/* {list.value.map((i) => (
                <li>{i}</li>
                ))} */}
            </ul>
        </>
    );
};
export default Test;
