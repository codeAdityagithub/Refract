import { createSignal, reactive } from "../signals";

const Test = () => {
    const list = createSignal({ name: "Adi" });
    // createEffect(() => {
    //     console.log("Effect Called", list.value.age);
    // });

    return (
        <>
            <h3
                onClick={() => {
                    list.value = { name: "Sidd" };
                }}
            >
                {reactive(() => list.value.name + list.value.age)}
            </h3>
            <ul className="">
                {/* {list.value.map((i) => (
                <li>{i}</li>
                ))} */}
                <li
                    onClick={() => {
                        list.value.age = 40;
                    }}
                >
                    Test
                </li>
            </ul>
        </>
    );
};
export default Test;
