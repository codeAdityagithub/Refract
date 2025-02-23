import { describe, expect, it, vi } from "vitest";

import * as rendering from "../../rendering/render";
import {
    createEffect,
    createPromise,
    createRef,
    createSignal,
} from "../../signals/signal";
import { cleanUp } from "../../rendering/functionalComponents";

vi.stubGlobal("requestIdleCallback", (cb) => {
    queueMicrotask(() => cb({ timeRemaining: () => 2 }));
});

// @ts-expect-error
const createFiber = rendering.createFiber;
// @ts-expect-error
const commitFiber = rendering.commitFiber;
// @ts-expect-error
const commitDeletion = rendering.commitDeletion;
const updateFiber = rendering.updateFiber;

describe("Promises within components", () => {
    it("should not block rendering and update the dom when promise resolved", async () => {
        const FC = () => {
            const promise = createPromise(() => {
                return new Promise<string>((resolve) => {
                    setTimeout(() => resolve("resolved"), 100);
                });
            });

            return (
                <div>
                    <p>
                        {() =>
                            promise.value.status !== "resolved"
                                ? "pending"
                                : promise.value.data.toUpperCase()
                        }
                    </p>
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

        expect(fiber.dom.innerHTML).toBe("<div><p>pending</p></div>");
        await new Promise((resolve) => setTimeout(resolve, 110));

        expect(fiber.dom.innerHTML).toBe("<div><p>RESOLVED</p></div>");
    });
    it("should update the dom when promise is rejected", async () => {
        const FCReject = () => {
            const promise = createPromise(() => {
                return new Promise<string>((_resolve, reject) => {
                    setTimeout(() => reject(new Error("error occurred")), 100);
                });
            });
            return (
                <div>
                    <p>
                        {() =>
                            promise.value.status !== "rejected"
                                ? "pending"
                                : `error: ${promise.value.error.message}`
                        }
                    </p>
                </div>
            );
        };
        const fiber = (
            <div>
                <FCReject />
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);

        expect(fiber.dom.innerHTML).toBe("<div><p>pending</p></div>");
        await new Promise((resolve) => setTimeout(resolve, 110));
        expect(fiber.dom.innerHTML).toBe(
            "<div><p>error: error occurred</p></div>"
        );
    });
    it("should update the dom correctly for multiple promises", async () => {
        const FCMulti = () => {
            const promise1 = createPromise(
                () =>
                    new Promise<string>((resolve) =>
                        setTimeout(() => resolve("first"), 100)
                    )
            );
            const promise2 = createPromise(
                () =>
                    new Promise<string>((resolve) =>
                        setTimeout(() => resolve("second"), 150)
                    )
            );

            return (
                <div>
                    <p id="p1">
                        {() =>
                            promise1.value.status !== "resolved"
                                ? "pending"
                                : promise1.value.data
                        }
                    </p>
                    <p id="p2">
                        {() =>
                            promise2.value.status !== "resolved"
                                ? "pending"
                                : promise2.value.data
                        }
                    </p>
                </div>
            );
        };
        const fiber = (
            <div>
                <FCMulti />
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);

        // Initially, both promises are pending.
        expect(fiber.dom.querySelector("#p1")?.textContent).toBe("pending");
        expect(fiber.dom.querySelector("#p2")?.textContent).toBe("pending");

        // After 110ms, promise1 should resolve.
        await new Promise((resolve) => setTimeout(resolve, 110));
        expect(fiber.dom.querySelector("#p1")?.textContent).toBe("first");
        expect(fiber.dom.querySelector("#p2")?.textContent).toBe("pending");

        // After an additional 50ms, promise2 should resolve.
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(fiber.dom.querySelector("#p2")?.textContent).toBe("second");
    });
    it("should maintain resolved state on re-render", async () => {
        const FCReRender = () => {
            const promise = createPromise(
                () =>
                    new Promise<string>((resolve) =>
                        setTimeout(() => resolve("final"), 100)
                    )
            );
            const testSignal = createSignal<string>("initial");

            setTimeout(() => {
                testSignal.value = "updated";
            }, 200);

            return (
                <div>
                    {() => testSignal.value}
                    <p>
                        {() =>
                            promise.value.status !== "resolved"
                                ? "pending"
                                : promise.value.data
                        }
                    </p>
                </div>
            );
        };
        const fiber = (
            <div>
                <FCReRender />
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);
        await new Promise((resolve) => setTimeout(resolve, 110));
        expect(fiber.dom.innerHTML).toBe("<div>initial<p>final</p></div>");

        // Simulate a re-render
        await new Promise((resolve) => setTimeout(resolve, 110));
        expect(fiber.dom.innerHTML).toBe("<div>updated<p>final</p></div>");
    });

    it("should correctly render falsy resolved values", async () => {
        const FCFalsy = () => {
            const promise = createPromise(
                () =>
                    new Promise<number>((resolve) =>
                        setTimeout(() => resolve(0), 100)
                    )
            );
            return (
                <div>
                    <p>
                        {() =>
                            promise.value.status !== "resolved"
                                ? "pending"
                                : String(promise.value.data)
                        }
                    </p>
                </div>
            );
        };
        const fiber = (
            <div>
                <FCFalsy />
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);

        expect(fiber.dom.innerHTML).toBe("<div><p>pending</p></div>");
        await new Promise((resolve) => setTimeout(resolve, 110));
        expect(fiber.dom.innerHTML).toBe("<div><p>0</p></div>");
    });
    it("should not update the dom if component is unmounted before promise resolves", async () => {
        const FCUnmount = () => {
            const promise = createPromise(
                () =>
                    new Promise<string>((resolve) =>
                        setTimeout(() => resolve("late result"), 100)
                    )
            );
            return (
                <div>
                    <p>
                        {() =>
                            promise.value.status !== "resolved"
                                ? "pending"
                                : promise.value.data
                        }
                    </p>
                </div>
            );
        };
        const fiber = (
            <div>
                <FCUnmount />
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);

        // Unmount the component (assuming destroyFiber is provided)
        commitDeletion(fiber);

        await new Promise((resolve) => setTimeout(resolve, 110));
        // Since the fiber is unmounted, its DOM should not be updated.
        expect(fiber.dom.innerHTML).toBe("");
    });
});

describe("Refs", () => {
    const renderComponent = (component) => {
        const fiber = component;
        createFiber(fiber);
        commitFiber(fiber);
        return fiber;
    };
    it("should initialize ref.current as null", () => {
        const myRef = createRef();
        expect(myRef.current).toBe(null);
    });

    it("should assign ref to the DOM element after mounting", () => {
        const myRef = createRef();

        const FC = () => <div ref={myRef}>Hello</div>;

        const fiber = renderComponent(<FC />);
        // After commit, the ref should point to the div element.
        expect(myRef.current).not.toBe(null);

        expect(myRef.current?.tagName).toBe("DIV");
        expect(myRef.current?.innerHTML).toContain("Hello");
    });

    it("should update ref when element is conditionally rendered", async () => {
        const myRef = createRef();
        const showSignal = createSignal<boolean>(true);

        const FC = () => (
            <div>
                {() =>
                    showSignal.value ? (
                        <span ref={myRef}>Conditional</span>
                    ) : (
                        <p>No Element</p>
                    )
                }
            </div>
        );

        let fiber = renderComponent(<FC />);
        // Initially, the element is rendered.
        expect(myRef.current).not.toBe(null);
        expect(myRef.current?.tagName).toBe("SPAN");

        // Update the signal to unmount the <span>.
        showSignal.value = false;
        await Promise.resolve();

        commitFiber(fiber);

        // After unmounting, the ref should be reset to null.
        expect(myRef.current).toBe(null);
    });

    it("should persist the same ref if the element remains after re-render", async () => {
        const myRef = createRef();
        const countSignal = createSignal(0);

        const FC = () => (
            <div>
                <span ref={myRef}>Count is {() => countSignal.value}</span>
            </div>
        );

        const fiber = renderComponent(<FC />);
        const initialRef = myRef.current;

        // Trigger an update that does not remove the element.
        countSignal.value++;
        await Promise.resolve();

        // The ref should remain the same across re-renders.
        expect(myRef.current).toBe(initialRef);
    });

    it("should update ref when element is removed and remounted", async () => {
        const myRef = createRef();
        const showSignal = createSignal<boolean>(false);

        const FC = () => (
            <div>
                <button onClick={() => (showSignal.value = !showSignal.value)}>
                    Toggle
                </button>
                {() =>
                    showSignal.value ? (
                        <input ref={myRef} />
                    ) : (
                        <div>No Input</div>
                    )
                }
            </div>
        );

        const fiber = renderComponent(<FC />);

        // Initially, no input is rendered so ref should be null.
        expect(myRef.current).toBe(null);

        // Toggle to mount the <input>.
        showSignal.value = true;
        await Promise.resolve();

        expect(myRef.current).not.toBe(null);
        expect(myRef.current?.tagName).toBe("INPUT");

        // Toggle again to unmount the <input>.
        showSignal.value = false;
        await Promise.resolve();

        // After unmounting, the ref should be reset to null.
        expect(myRef.current).toBe(null);
    });
});

describe("Extra Edge cases", () => {
    it("Should handle FC FC edge case", async () => {
        const FC1 = ({ textSignal }) => {
            const str = createSignal<string>("FC1");
            const clicked = createSignal<boolean>(false);
            let value = 0;
            createEffect(() => {
                console.log("Effect", value);
                textSignal.value;
                str.value;
                return () => {
                    console.log("Cleanup", value);
                    value++;
                };
            });
            cleanUp(() => {
                console.log("Cleanup FC1");
            });
            // const compText = computed(() => "FC1" + str.value);
            return (
                <>
                    This is FC1
                    <h2>This is {() => str.value}</h2>
                    <button
                        onClick={() => {
                            clicked.value = !clicked.value;
                            str.value = clicked.value ? "FC1 Clicked" : "FC1";
                        }}
                    >
                        Click
                    </button>
                </>
            );
        };
        const FC2 = () => {
            return (
                <div>
                    This is FC2
                    <h2>This is FC2</h2>
                </div>
            );
        };
        const showTextSignal = createSignal<boolean>(false);
        const textSignal = createSignal<string>("Initial Text");

        const fiber = (
            <div>
                {() =>
                    showTextSignal.value ? (
                        <FC2 />
                    ) : (
                        <FC1 textSignal={textSignal} />
                    )
                }
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);

        expect(fiber.dom.innerHTML).toBe(
            "This is FC1<h2>This is FC1</h2><button>Click</button>"
        );

        showTextSignal.value = true;
        await Promise.resolve();

        expect(fiber.dom.innerHTML).toBe(
            "<div>This is FC2<h2>This is FC2</h2></div>"
        );

        showTextSignal.value = false;
        await Promise.resolve();

        expect(fiber.dom.innerHTML).toBe(
            "This is FC1<h2>This is FC1</h2><button>Click</button>"
        );
    });
});
