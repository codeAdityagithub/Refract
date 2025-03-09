import { vi, describe, it, expect, beforeEach } from "vitest";
import * as rendering from "../../rendering/render";
import { createSignal } from "../../signals/signal";
import { createElement } from "../../rendering/createElements";
import { Fiber } from "../../types";

vi.stubGlobal("requestIdleCallback", (cb) => {
    queueMicrotask(() => cb({ timeRemaining: () => 2 }));
});

// @ts-expect-error
const createFiber = rendering.createFiber;
// @ts-expect-error
const commitFiber = rendering.commitFiber;

describe("Select", () => {
    it("should set <select> value", async () => {
        const div = document.createElement("div");
        function App() {
            return (
                <select value="B">
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                </select>
            );
        }

        rendering.render(<App />, div);
        await Promise.resolve();

        setTimeout(() => {
            expect(div.firstChild?.value).to.equal("B");
        });
    });

    it("should set value with selected", async () => {
        const scratch = document.createElement("div");
        function App() {
            return (
                <select>
                    <option value="A">A</option>
                    <option
                        selected
                        value="B"
                    >
                        B
                    </option>
                    <option value="C">C</option>
                </select>
            );
        }

        rendering.render(<App />, scratch);
        await Promise.resolve();
        expect(scratch.firstChild?.value).to.equal("B");
    });

    it("should work with multiple selected", async () => {
        const scratch = document.createElement("div");
        function App() {
            return (
                <select multiple>
                    <option value="A">A</option>
                    <option
                        selected
                        value="B"
                    >
                        B
                    </option>
                    <option
                        selected
                        value="C"
                    >
                        C
                    </option>
                </select>
            );
        }

        rendering.render(<App />, scratch);
        await Promise.resolve();
        Array.prototype.slice
            .call(scratch.firstChild?.childNodes)
            .forEach((node) => {
                if (node.value === "B" || node.value === "C") {
                    expect(node.selected).to.equal(true);
                }
            });
        expect(scratch.firstChild?.value).to.equal("B");
    });
});
