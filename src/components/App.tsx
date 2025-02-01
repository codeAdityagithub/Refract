import { createSignal } from "../index.ts";
import Computed from "./Computed.tsx";
import ListsTest from "./ListsTest.tsx";
import Test from "./Test.tsx";

const App = (props: any) => {
    const count = createSignal(1);
    // const count2 = createSignal(1);
    // return <ReactiveComponent />;
    // return <NonReactiveComponent />;
    return <Test />;
    // return <ListsTest />;
    // return <Computed />;
};

export default App;
