import { createEffect, createSignal } from "../signals/signal";

const Test = () => {
    const textSignal = createSignal<string>("Initial Text");
    const showTextSignal = createSignal<boolean>(true);
    createEffect(() => {
        console.log(showTextSignal.value);
    });
    return (
        <div>
            {/* Static content with reactivity */}
            <h1>{() => textSignal.value}</h1>
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
            {/* <div>{() => !showTextSignal.value && textSignal.value}</div> */}
            {/* <div id={() => `id-${textSignal.value}`}>Dynamic ID</div> */}
            {/* <div className={null}>No Data</div> */}
            {/* <button
                onClick={() => {
                    textSignal.value = showTextSignal.value
                        ? "Reacted to Toggle"
                        : "Reset Text";
                }}
            >
                Dynamic Event Listener Reactivity
            </button> */}
            {/* <div className={() => "Class"}>
                Attributes that are functions but not reactive to any signal
            </div> */}
            {/* <div>
                {() => {
                    if (showTextSignal.value) return <p>{textSignal.value}</p>;
                    return <h2>Not hidden</h2>;
                }}
            </div> */}
            {/* <div
                id="type-coerce"
                // data-count={() => 123}
                data-count="12"
            >
                Type coersion
            </div>
            <textarea
                name="area"
                id=""
                rows={() => 30}
            ></textarea>
            <div unknown-attr="value">Unknown attribute ignore</div> */}
            {/* <div tabIndex={() => 0}>Focusable</div> */}
            {/* <div className={() => ["class1", "class2"].join(" ")}>Styled</div> */}
            <input />
            <button
                onClick={() => (showTextSignal.value = !showTextSignal.value)}
            >
                Toggle
            </button>

            {/* Event handlers with reactivity */}
            <button onClick={() => (textSignal.value = "Updated Text")}>
                Update Text
            </button>
            {/* <button onClick={() => alert("Clicked!")}>Click Me</button> */}
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
