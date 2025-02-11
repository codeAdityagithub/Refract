import { cleanUp, createSignal } from "../index";

function Test({ text }) {
    const signal = createSignal<boolean>(true);
    const timeout = setTimeout(() => (signal.value = false), 1000);

    cleanUp(() => {
        clearTimeout(timeout);
        console.log("unmounted");
    });
    return (
        <div>
            <p>
                {text}
                {() => signal.value}
            </p>
        </div>
    );
}

// function Test2() {
//     const count = [1, 2, 3];

//     return <>{() => count.map((c) => <div>{c}</div>)}</>;
// }

export default function ListsTest() {
    const itemsSignal = createSignal(["Item 1", "Item 2", "Item 3"]);
    const showTextSignal = createSignal<boolean>(true);

    return (
        <div>
            {/* Static content with reactivity */}

            <div>
                <button onClick={() => itemsSignal.value.push("New Item")}>
                    Push Item
                </button>
                <button onClick={() => itemsSignal.value.pop()}>
                    Pop Item
                </button>

                <button
                    onClick={() =>
                        (showTextSignal.value = !showTextSignal.value)
                    }
                >
                    {" "}
                    Toggle Text{" "}
                </button>
            </div>
            {/* Conditional Lists with reactivity */}
            {/* <ul>
                {() =>
                    showTextSignal.value ? (
                        <>
                            <p>Hidden Text</p>
                        </>
                    ) : (
                        itemsSignal.value.map((item, index) => <li>{item}</li>)
                    )
                }
            </ul> */}
            {/* Simple Lists with reactivity */}
            <ul>
                {() =>
                    itemsSignal.value.map((item, index) => (
                        <div>
                            hello<li>{item}</li>
                            {index % 2 == 0 && <Test text={item} />}
                        </div>
                    ))
                }
            </ul>
            {/* <Test2 /> */}

            {/* Forms */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    const [index1, index2] = e.target[0].value
                        .split(" ")
                        .splice(0, 2);
                    const ind1 = Number(index1);
                    const ind2 = Number(index2);
                    if (!isNaN(ind1) && !isNaN(ind2)) {
                        const temp = itemsSignal.value[ind1];
                        itemsSignal.value[ind1] = itemsSignal.value[ind2];
                        itemsSignal.value[ind2] = temp;
                    }
                    e.currentTarget.reset();
                }}
            >
                <input
                    placeholder="index index"
                    type="text"
                />
            </form>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    const [index, value] = e.target[0].value
                        .split(" ")
                        .splice(0, 2);
                    const ind = Number(index);
                    if (!isNaN(ind)) itemsSignal.value[ind] = value;
                    e.currentTarget.reset();
                }}
            >
                <input
                    placeholder="index value"
                    type="text"
                />
            </form>
        </div>
    );
}
