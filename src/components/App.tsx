import { createSignal, reactive } from "../../signals";

const App = (props: any) => {
    const count = createSignal(1);
    // const count2 = createSignal(1);
    return (
        <div>
            {/* <Test /> */}
            {/* <>
                <>
                    <div>Nested Fragment 1</div>
                </>
                <>
                    <div>Nested Fragment 2</div>
                </>
            </>
            
            <div>
                <>
                    <span>Inside Fragment</span>
                    <span>Another Inside Fragment</span>
                </>
            </div> */}

            {reactive(() =>
                count.value % 2 != 0 ? (
                    <div>
                        <h2>even</h2>
                        <h2>even</h2>
                        <h2>even</h2>
                    </div>
                ) : (
                    <>
                        <h2>odd</h2>
                        <h3>odd</h3>
                        <h2>odd</h2>
                        <h2>odd</h2>
                    </>
                )
            )}
            {/* {reactive(() =>
                count.value % 2 == 0 ? <h1>even</h1> : <ReactiveFc />
            )} */}
            <button
                onClick={() => {
                    count.value += 1;
                    // count.value -= 1;
                }}
            >
                Increment
            </button>
            {/* <h1>
                world
                {reactive(() => count2.value)}
            </h1>
            <h1>sum {reactive(() => count.value + count2.value)}</h1>
            } */}
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
