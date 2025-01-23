import { createSignal } from "../index";

export default function ReactiveComponent() {
    const textSignal = createSignal<string>("Initial Text");
    const itemsSignal = createSignal(["Item 1", "Item 2", "Item 3"]);
    const showTextSignal = createSignal<boolean>(true);

    return (
        <div>
            {/* Static content with reactivity */}
            <h1>{() => <span>{textSignal.value}</span>}</h1>

            {/* Conditional rendering with reactivity */}
            {/* {() =>
                showTextSignal.value ? (
                    <>
                        <p>
                            <span>{textSignal.value}</span>
                            <span>extra</span>
                        </p>
                        <h2>{textSignal.value}</h2>
                    </>
                ) : (
                    <>
                        <p>
                            <span>Hidden Text</span>
                        </p>
                        <h2>Hello!!</h2>
                    </>
                )
            } */}

            <button
                onClick={() => (showTextSignal.value = !showTextSignal.value)}
            >
                Toggle
            </button>
            {/* Inline styling */}
            {/* <div style={{ color: "blue", fontSize: "20px" }}>Styled text</div> */}

            {/* Event handlers with reactivity */}
            <button onClick={() => (textSignal.value = "Updated Text")}>
                Update Text
            </button>

            {/* Fragments */}
            <>
                <span>{() => <span>{textSignal.value}</span>}</span>
                <span>{() => <span>Dynamic Fragment</span>}</span>
            </>

            {/* Nested elements */}
            <div>
                <h2>Nested Elements</h2>
                <p>{() => <span>{textSignal.value}</span>}</p>
            </div>

            {/* TODO: Attributes with reactivity */}
            <img
                src="https://via.placeholder.com/150"
                alt={() => `Alt: ${textSignal.value}`}
            />
            <br />
            <div>
                <button onClick={() => itemsSignal.value.push("New Item")}>
                    Push Item
                </button>
                <button onClick={() => itemsSignal.value.pop()}>
                    Pop Item
                </button>
            </div>
            {/* Lists with reactivity */}
            <ul>
                {() =>
                    showTextSignal.value ? (
                        <>
                            <p>Hidden Text</p>
                        </>
                    ) : (
                        itemsSignal.value.map((item, index) => (
                            <li key={item}>{item}</li>
                        ))
                    )
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
