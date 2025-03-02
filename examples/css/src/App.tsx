import { createSignal } from "@/refract";
import Emotion from "./Emotion";
import Sass from "./Sass";
import Tailwind from "./Tailwind";
import TimerComponent from "./Timer";

const App = () => {
    const show = createSignal<boolean>(true);

    return (
        <div>
            <button onClick={() => (show.value = !show.value)}>
                Show/Hide
            </button>
            {() => (show.value ? <TimerComponent /> : "Hidden")}
        </div>
        // <>
        //     <Emotion />
        //     <Tailwind />
        //     <Sass />
        // </>
    );
};
export default App;
