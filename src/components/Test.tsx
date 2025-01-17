import { createEffect, createSignal, reactive } from "../../signals";

const Test = () => {
    const list = createSignal([1, 2, 3]);
    const val = createSignal(1);
    const obj = createSignal({ a: 1, b: 2 });

    createEffect(() => {
        console.log("Effect Called", list.value, val.value, obj.value);
    });

    return (
        <>
            <h3
                onClick={() => {
                    list.value.forEach((_, i) => {
                        list.value[i]++;
                    });
                    val.value++;
                    obj.value.a++;
                }}
            >
                List rendering push
            </h3>
            <ul className="">
                {reactive(() =>
                    list.value.map((i) => (
                        <li>
                            {i}
                            {val.value}
                            {obj.value.a}
                        </li>
                    ))
                )}
            </ul>
        </>
    );
};
export default Test;
