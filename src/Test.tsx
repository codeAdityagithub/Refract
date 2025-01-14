import { createEffect, createSignal } from "../signals";

const Test = () => {
    let i = 0;
    const age = { age: i };
    const list = createSignal({ name: "Adi" });
    createEffect(() => {
        console.log("Effect Called", list.value.age);
    });

    return (
        <>
            <h3
                onClick={() => {
                    list.value = { name: "Sidd" };
                }}
            >
                List
            </h3>
            <ul className="">
                {/* {list.value.map((i) => (
                <li>{i}</li>
                ))} */}
                <li
                    onClick={() => {
                        list.value.age = age;
                    }}
                >
                    Test
                </li>
            </ul>
        </>
    );
};
export default Test;
