import { computed, createSignal } from "../signals";
import Test from "./Test";

const App = (props: any) => {
    const count = createSignal(1);
    const count2 = createSignal(1);
    return (
        <div>
            <Test />
            <h1>
                world
                {computed(() => count2.value)}
            </h1>
            <h1>sum {computed(() => count.value + count2.value)}</h1>
            <button
                onClick={() => {
                    count.value += 1;
                }}
            >
                Increment
            </button>
            <button
                onClick={() => {
                    count2.value -= 1;
                }}
            >
                decrement
            </button>
        </div>
    );
};

export default App;
