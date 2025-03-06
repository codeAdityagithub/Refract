import { describe, expect, it, vi } from "vitest";
import {
    cleanUp,
    cleanUpFC,
    clearCurrentFC,
    setCurrentFC,
} from "../../rendering/functionalComponents";
import * as rendering from "../../rendering/render";

import {
    computed,
    createEffect,
    createRef,
    createSignal,
} from "../../signals/signal";

vi.stubGlobal("requestIdleCallback", (cb) => {
    queueMicrotask(() => cb({ timeRemaining: () => 2 }));
});

// @ts-expect-error
const createFiber = rendering.createFiber;
// @ts-expect-error
const commitFiber = rendering.commitFiber;
// @ts-expect-error
const commitDeletion = rendering.commitDeletion;

describe("Functional Components life cycle", () => {
    it("should be defined", () => {
        expect(cleanUp).toBeTruthy();
    });
    it("should add cleanup to the FC", () => {
        let FC = () => {
            console.log("FC");
        };
        // @ts-expect-error
        setCurrentFC(FC);
        let count = 0;
        let cleanup = () => {
            count++;
        };
        cleanUp(cleanup);
        clearCurrentFC();

        cleanUpFC(FC, {});
        expect(count).toBe(1);
        cleanUpFC(FC, {});
        expect(count).toBe(1);
    });
    it("Should remove all listeners and signals inside FC from a signal", async () => {
        let count = 0;
        const propSignal = createSignal<number>(0);
        let computedCount = 0;

        const FC = ({ propSignal }) => {
            const signal = createSignal(0);
            const comp = computed(() => {
                computedCount++;
                return propSignal.value * 2;
            });

            createEffect(() => {
                signal.value;
                count++;
            });
            createEffect(() => {
                propSignal.value;
                count++;
            });
            return <div>Hello</div>;
        };

        const fiber = (
            <div>
                <FC propSignal={propSignal} />
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);

        expect(count).toBe(0);

        await Promise.resolve();

        expect(count).toBe(2);
        expect(computedCount).toBe(1);

        propSignal.update(1);
        await Promise.resolve();

        expect(count).toBe(3);
        expect(computedCount).toBe(2);

        commitDeletion(fiber);

        expect(count).toBe(3);
        expect(computedCount).toBe(2);

        propSignal.update(2);
        await Promise.resolve();

        expect(computedCount).toBe(2);
    });
});

describe("hooks lifecycle", () => {
    it("create effect should run synchrounously when outside of a FC", async () => {
        let count = 0;
        createEffect(() => {
            count++;
        });
        await Promise.resolve();
        expect(count).toBe(1);
    });
    it("computed should run synchrounously when outside of a FC or inside and should run only once", async () => {
        let fn = vi.fn();

        const signal = createSignal(1);
        const comp = computed(() => {
            fn();
            return signal.value * 2;
        });
        expect(fn).toHaveBeenCalledTimes(1);
        expect(comp.value).toBe(2);

        // inside FC
        const FC = () => {
            const signal = createSignal(1);
            const comp = computed(() => {
                fn();
                return signal.value * 2;
            });
            return <div></div>;
        };

        const fiber = (
            <div>
                <FC />
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);

        expect(fn).toHaveBeenCalledTimes(2);
        await Promise.resolve();
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it("create effect should run asynchronously when inside of a FC, in render and commitFiber both", async () => {
        let fn1 = vi.fn();
        let fn2 = vi.fn();
        // render
        const FC = () => {
            createEffect(() => {
                fn1();
            });
            fn2();
            return <div></div>;
        };

        const container = document.createElement("div");

        rendering.render(<FC />, container);
        await Promise.resolve();

        expect(container.innerHTML).toBe("<div></div>");
        expect(fn1).toHaveBeenCalledAfter(fn2);

        // commitFiber
        const fiber = (
            <div>
                <FC />
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);

        expect(container.innerHTML).toBe("<div></div>");
        await Promise.resolve();

        expect(fn1).toHaveBeenCalledTimes(2);
        expect(fn2).toHaveBeenCalledTimes(2);
        expect(fn1).toHaveBeenCalledAfter(fn2);
    });

    // this is just a test to make sure that this does not cause an infinite loop and it is an anti-pattern
    it("create effect should run twice not infinitely when inside a FC with self dependency", async () => {
        let fn1 = vi.fn();
        let fn2 = vi.fn();
        // render
        const FC = () => {
            const signal = createSignal<number>(1);
            createEffect(() => {
                signal.value;
                // if the signal is registered first then only it will be called twice
                signal.update((prev) => prev + 1);
                fn1();
            });
            fn2();
            return <div></div>;
        };

        const fiber = (
            <div>
                <FC />
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);

        await Promise.resolve();

        expect(fn1).toHaveBeenCalledTimes(1);
        await Promise.resolve();

        // if the signal is registered first then only it will be called twice
        expect(fn1).toHaveBeenCalledTimes(2);
    });

    it("createEffect with a ref should always have the ref defined", async () => {
        // render

        const fn = vi.fn();
        const FC = () => {
            const ref = createRef();

            createEffect(() => {
                fn(ref.current);
            });

            return (
                <div>
                    <p>Child1</p>
                    <div>
                        Child2
                        <p>Subchild 2</p>
                        <div>
                            Subchild 3<p ref={ref}>Subchild 4</p>
                        </div>
                    </div>
                </div>
            );
        };

        const fiber = (
            <div>
                <FC />
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);

        expect(fn).toHaveBeenCalledTimes(0);
        await Promise.resolve();

        expect(fn).toHaveBeenCalledWith(expect.any(HTMLParagraphElement));
    });
    it("createEffect with a ref should always have the ref defined, with render also", async () => {
        // render

        const fn = vi.fn();
        const FC = () => {
            const ref = createRef();

            createEffect(() => {
                fn(ref.current);
            });

            return (
                <div>
                    <p>Child1</p>
                    <div>
                        Child2
                        <p>Subchild 2</p>
                        <div>
                            Subchild 3<p ref={ref}>Subchild 4</p>
                        </div>
                    </div>
                </div>
            );
        };

        rendering.render(<FC />, document.body);

        expect(document.body.innerHTML).toBe("");
        expect(fn).toHaveBeenCalledTimes(0);
        await Promise.resolve();
        expect(document.body.innerHTML).toBe(
            "<div><p>Child1</p><div>Child2<p>Subchild 2</p><div>Subchild 3<p>Subchild 4</p></div></div></div>"
        );
        expect(fn).toHaveBeenCalledWith(expect.any(HTMLParagraphElement));
    });
});
