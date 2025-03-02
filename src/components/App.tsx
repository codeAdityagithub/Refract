import { createSignal } from "../../src/index.ts";
import ListsTest from "./ListsTest.tsx";
import PerformanceTest from "./Performance.tsx";
import StylesTest from "./StylesTest.tsx";
import Test from "./Test.tsx";
import TimerComponent from "./Timer.tsx";

const App = (props: any) => {
    const count = createSignal(1);
    // const count2 = createSignal(1);
    // return <ReactiveComponent />;
    // return <NonReactiveComponent />;
    // return <Test />;
    return <TimerComponent />;
    // return <StylesTest />;
    // return <ListsTest />;
    // return <PerformanceTest />;
    // return <ArrayReturningFC />;
    // return <Computed />;
};

export default App;
