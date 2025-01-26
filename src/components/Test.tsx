import { createSignal } from "../signals/signal";
import FC1 from "./FC1";
import FC2 from "./FC2";

const Test = () => {
    const textSignal = createSignal<string>("Initial Text");
    const itemsSignal = createSignal(["Item 1", "Item 2", "Item 3"]);
    const showTextSignal = createSignal<boolean>(true);

    return (
        <div>
            {/* Static content with reactivity */}
            <h1>{() => <span>{textSignal.value}</span>}</h1>

            {/* Fragment - Fragment with reactivity */}
            {/* {() =>
                showTextSignal.value ? (
                    <>
                        <p>
                            <span>{textSignal.value}</span>
                        </p>
                        <h2>{textSignal.value}</h2>
                    </>
                ) : (
                    <>
                        <p>
                            <span>Hidden Text</span>
                        </p>
                        <h2>Hello!!</h2>
                        <h3>Hi</h3>
                        <h3>Hi</h3>
                        <h3>Hi</h3>
                    </>
                )
            } */}
            {/* FC - Fragment */}
            {/* {() =>
                showTextSignal.value ? (
                    <FC1 />
                ) : (
                    <>
                        <p>
                            <span>{textSignal.value}</span>
                        </p>
                        <h2>{textSignal.value}</h2>
                        <h2>Hello!!</h2>
                        <h3>Hi</h3>
                    </>
                )
            } */}
            {/* FC - FC */}
            {() => (showTextSignal.value ? <FC2 /> : <FC1 />)}

            {/* Fragment - Node */}
            {/* {() =>
                showTextSignal.value ? (
                    <>
                        <p>
                            <span>{textSignal.value}</span>
                        </p>
                        <h2>{textSignal.value}</h2>
                        <div>hello</div>
                    </>
                ) : (
                    <div>
                        <h3>hello</h3>
                        <h3>hi</h3>
                        <>
                            <p>hi</p>
                            <p>hello</p>
                        </>
                    </div>
                )
            } */}

            {/* Node - Node with reactivity */}
            {/* {() =>
                showTextSignal.value ? (
                    <p>
                        <span>Extra</span>
                        {textSignal.value}
                    </p>
                ) : (
                    <div>
                        hidden
                        <span>hidden</span>
                        hidden
                    </div>
                )
            } */}

            {/* Node - FC with reactivity */}
            {/* {() =>
                showTextSignal.value ? (
                    <p>
                        <span>Extra</span>
                        {textSignal.value}
                    </p>
                ) : (
                    <FC1 />
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
        </div>
    );
};
export default Test;
