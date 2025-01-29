import { createSignal } from "../signals/signal";

const Test = () => {
    const textSignal = createSignal<string>("Initial Text");
    const showTextSignal = createSignal<boolean>(true);

    return (
        <div>
            {/* Static content with reactivity */}
            {/* <h1>{() => textSignal.value}</h1> */}
            {/* Array rendering */}

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
                    <>
                        <FC1 />
                        <FC2 />
                    </>
                ) : (
                    <>
                        <p>
                            <span>{() => textSignal.value}</span>
                        </p>
                        <h2>{() => textSignal.value}</h2>
                        <h2>Hello!!</h2>
                        <h3>Hi</h3>
                    </>
                )
            } */}
            {/* FC - FC */}
            {/* {() => (showTextSignal.value ? <FC2 /> : <FC1 />)} */}

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
                            <p>{()=>textSignal.value}</p>
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
            {/* {() =>
                showTextSignal.value ? (
                    <>
                        <div
                            className={() =>
                                showTextSignal.value ? "visible" : "hidden"
                            }
                        >
                            {() => textSignal.value + "Hello"}
                        </div>
                        <FC1 />
                    </>
                ) : (
                    <>
                        <span>{() => textSignal.value}</span>
                        <span>Extra</span>
                        <span>Extra</span>
                    </>
                )
            } */}
            <div>{() => !showTextSignal.value && textSignal.value}</div>
            <button
                onClick={() => (showTextSignal.value = !showTextSignal.value)}
            >
                Toggle
            </button>

            {/* Event handlers with reactivity */}
            <button onClick={() => (textSignal.value = "Updated Text")}>
                Update Text
            </button>
            {/* <input
                type="checkbox"
                checked={() => showTextSignal.value}
            /> */}

            {/* <div
                style={() => ({
                    color: showTextSignal.value ? "red" : "blue",
                    backgroundColor: "lightgray",
                    fontSize: "40px",
                })}
            >
                Styled Text
            </div> */}
        </div>
    );
};
export default Test;
