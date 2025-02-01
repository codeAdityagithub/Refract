import { computed, createEffect, createSignal } from "../signals/signal";

const Computed = () => {
    const signal = createSignal<number>(2);
    const comp = computed(() => signal.value * 2);
    createEffect(() => console.log(comp.value));

    return (
        <div>
            <h2>{() => signal.value}</h2>*2 = <h2>{() => comp.value}</h2>
            <button onClick={() => (signal.value += 1)}>Click</button>
        </div>
    );
};
export default Computed;
