import { createSignal } from "../../src/index.ts";
import ListsTest from "./ListsTest.tsx";
import PerformanceTest from "./Performance.tsx";
import StylesTest from "./StylesTest.tsx";
import Test from "./Test.tsx";
import TimerComponent from "./Timer.tsx";

const App = (props: any) => {
    const visible = createSignal<boolean>(true);
    // const count2 = createSignal(1);
    // return <ReactiveComponent />;
    // return <NonReactiveComponent />;
    // return <Test />;
    return (
        <>
            <button onClick={() => visible.update((prev) => !prev)}>
                Show/Hide
            </button>
            {() => (visible.value ? <TimerComponent /> : "Hidden")}
        </>
    );
    // return <StylesTest />;
    // return <ListsTest />;
    // return <PerformanceTest />;
    // return <ArrayReturningFC />;
    // return <Computed />;
};

export default App;
