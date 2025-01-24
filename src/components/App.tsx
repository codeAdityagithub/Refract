import { createSignal } from "../index.ts";
import Test from "./Test.tsx";

const App = (props: any) => {
    const count = createSignal(1);
    // const count2 = createSignal(1);
    // return <ReactiveComponent />;
    // return <NonReactiveComponent />;
    return <Test />;
};

export default App;
