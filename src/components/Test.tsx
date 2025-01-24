import { createSignal } from "../signals/signal";

const Test = () => {
    const textSignal = createSignal<string>("Initial Text");
    const itemsSignal = createSignal(["Item 1", "Item 2", "Item 3"]);
    const showTextSignal = createSignal<boolean>(true);

    return (
        <div>
            {/* Static content with reactivity */}
            <h1>{() => <span>{textSignal.value}</span>}</h1>

            {/* Fragment - Fragment with reactivity */}
            {() =>
                showTextSignal.value ? (
                    <>
                        <p>
                            <span>{textSignal.value}</span>
                        </p>
                        <h2>{textSignal.value}</h2>
                    </>
                ) : (
                    <h3>Hello</h3>
                    // <>
                    //     <p>
                    //         <span>Hidden Text</span>
                    //     </p>
                    //     <h2>Hello!!</h2>
                    // </>
                )
            }

            {/* Node - Node with reactivity */}
            {/* {() =>
                showTextSignal.value ? (
                    <p>
                        <span>Extra</span>
                        {textSignal.value}
                    </p>
                ) : (
                    <p>
                        hidden <span>hidden</span> hidden
                    </p>
                )
            } */}

            <button
                onClick={() => (showTextSignal.value = !showTextSignal.value)}
            >
                Toggle
            </button>

            {/* Event handlers with reactivity */}
            <button onClick={() => (textSignal.value = "Updated Text")}>
                Update Text
            </button>

            {/* TODO: Attributes with reactivity */}

            <br />
        </div>
    );
};
export default Test;
