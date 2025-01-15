import { createSignal, reactive } from "../signals";

const App = (props: any) => {
    const count = createSignal(1);
    // const count2 = createSignal(1);
    return (
        <div>
            {/* <Test /> */}
            {reactive(() =>
                count.value % 2 == 0 ? (
                    <div>
                        <div className="even">even</div>
                    </div>
                ) : (
                    <div>
                        <div className="odd">odd</div>
                    </div>
                )
            )}
            {/* <h1>
                world
                {reactive(() => count2.value)}
            </h1>
            <h1>sum {reactive(() => count.value + count2.value)}</h1>
            } */}
            <button
                onClick={() => {
                    count.value += 1;
                    // count.value -= 1;
                }}
            >
                Increment
            </button>
            {/*
            <button
                onClick={() => {
                    count2.value -= 1;
                }}
            >
                decrement
            </button> */}
        </div>
    );
};

export default App;
