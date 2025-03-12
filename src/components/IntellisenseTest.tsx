import {
    createSignal,
    createPromise,
    createRef,
    createEffect,
    cleanUp,
    computed,
    lazy,
} from "../index";

const LazyFC = lazy(() => import("./FC1"));

const IntellisenseTest = () => {
    const count = createSignal<number>(0);
    const arr = createSignal<number[]>([1, 2]);
    const obj = createSignal({ a: 1, b: 2 });

    createEffect(() => {
        count.update((prev) => prev + 1);
        arr.update((prev) => prev.push(1));
        obj.update((prev) => prev.a++);
    });
    const comp = computed(() => arr.value[0]);
    const promise = createPromise(async () => {
        return await fetch("fakeapi");
    });
    const ref = createRef<HTMLDivElement>();

    cleanUp(() => {
        console.log("cleanup");
    });
    return (
        <div ref={ref}>
            IntellisenseTest
            <LazyFC
                fallback="hello"
                errorFallback={"error"}
            />
            <LazyFC
                fallback={"hello"}
                errorFallback={(err) => "hello" + err.message}
            />
            <LazyFC fallback={<div>hello</div>} />
            <LazyFC fallback={<Test />} />
            <LazyFC fallback={() => <Test />} />
            {() => {
                promise.value.status === "resolved"
                    ? promise.value.data
                    : promise.value.error;
            }}
            <div
                className={() => count.value.toString()}
                data-test="test"
            ></div>
            <>Fragment</>
        </div>
    );
};

const Test = () => {
    return <div>test</div>;
};
export default IntellisenseTest;
