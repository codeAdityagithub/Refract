import { createSignal } from "../index";

export default function ListsTest() {
    const itemsSignal = createSignal(["Item 1", "Item 2", "Item 3"]);

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
            </div>
            {/* Conditional Lists with reactivity */}
            {/* <ul>
                {() =>
                    !showTextSignal.value ? (
                        <>
                            <p>Hidden Text</p>
                        </>
                    ) : (
                        itemsSignal.value.map((item, index) => (
                            <li key={item}>{item}</li>
                        ))
                    )
                }
            </ul> */}
            {/* Simple Lists with reactivity */}
            <ul>
                {() =>
                    itemsSignal.value.map((item, index) => (
                        <li key={item}>{item}</li>
                    ))
                }
            </ul>

            {/* Forms */}
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
                <input type="text" />
            </form>
        </div>
    );
}
