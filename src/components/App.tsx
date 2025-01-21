import { createSignal } from "../index.ts";
import ReactiveComponent from "./ReactiveFc.tsx";

const App = (props: any) => {
    const count = createSignal(1);
    // const count2 = createSignal(1);
    return <ReactiveComponent />;
    // return <NonReactiveComponent />;
};

export default App;
