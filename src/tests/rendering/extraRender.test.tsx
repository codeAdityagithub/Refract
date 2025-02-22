import { describe, expect, it, vi } from "vitest";

import * as rendering from "../../rendering/render";
import { createPromise, createSignal } from "../../signals/signal";

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
