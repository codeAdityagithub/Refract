import { describe, expect, it, vi } from "vitest";

import { cleanUp } from "../../rendering/functionalComponents";
import * as rendering from "../../rendering/render";
import { createSignal } from "../../signals/signal";

vi.stubGlobal("requestIdleCallback", (cb) => {
    queueMicrotask(() => cb({ timeRemaining: () => 2 }));
});

const createFiber = rendering.createFiber;
const commitFiber = rendering.commitFiber;
const commitDeletion = rendering.commitDeletion;
const updateFiber = rendering.updateFiber;

describe("updateFiber - Update Lists Efficiently Inplace", () => {
    it("Handles push operation in place", async () => {
        const count = createSignal([1, 2, 3]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );

        let fcLog = 0;
        let unmounted = 0;
        const FC = ({ text }) => {
            fcLog++;
            cleanUp(() => {
                unmounted++;
            });

            return <p>{text}</p>;
        };

        const fiber2 = (
            <div>
                {() =>
                    count.value.map((item) => (
                        <FC
                            text={item}
                            key={item}
                        />
                    ))
                }
            </div>
        );
        createFiber(fiber2);
        commitFiber(fiber2);
        createFiber(fiber);
        commitFiber(fiber);
        expect(fiber.dom.innerHTML).toBe("<p>1</p><p>2</p><p>3</p>");
        expect(fiber2.dom.innerHTML).toBe("<p>1</p><p>2</p><p>3</p>");
        expect(fcLog).toBe(3);

        const prevNodes = fiber.props.children.map((item) => item.dom);

        count.value.push(4);
        await Promise.resolve();

        expect(fiber.dom.innerHTML).toBe("<p>1</p><p>2</p><p>3</p><p>4</p>");
        expect(fiber2.dom.innerHTML).toBe("<p>1</p><p>2</p><p>3</p><p>4</p>");

        // log only runs once since the previous FC keys have not changed so no need to rerun the FC
        expect(fcLog).toBe(4);
        expect(unmounted).toBe(0);
        const newNodes = fiber.props.children
            .map((item) => item.dom)
            .splice(0, 3);

        newNodes.forEach((node, index) => {
            expect(node).toBe(prevNodes[index]);
        });
    });
});

describe("updateFiber - Array Mutations (In-Place)", () => {
    // 1. PUSH: Append an item
    it("handles push operation in place", async () => {
        const count = createSignal([1, 2, 3]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        expect(fiber.dom.innerHTML).toBe("<p>1</p><p>2</p><p>3</p>");

        count.value.push(4);
        await Promise.resolve();

        expect(fiber.dom.innerHTML).toBe("<p>1</p><p>2</p><p>3</p><p>4</p>");
    });

    // 2. UNSHIFT: Prepend an item
    it("handles unshift operation in place", async () => {
        const count = createSignal([2, 3, 4]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        expect(fiber.dom.innerHTML).toBe("<p>2</p><p>3</p><p>4</p>");

        count.value.unshift(1);
        await Promise.resolve();

        expect(fiber.dom.innerHTML).toBe("<p>1</p><p>2</p><p>3</p><p>4</p>");
    });

    // 3. POP: Remove the last item
    it("handles pop operation in place", async () => {
        const count = createSignal([1, 2, 3, 4]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        expect(fiber.dom.innerHTML).toBe("<p>1</p><p>2</p><p>3</p><p>4</p>");

        count.value.pop();
        await Promise.resolve();

        expect(fiber.dom.innerHTML).toBe("<p>1</p><p>2</p><p>3</p>");
    });

    // 4. SHIFT: Remove the first item
    it("handles shift operation in place", async () => {
        const count = createSignal([1, 2, 3, 4]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        expect(fiber.dom.innerHTML).toBe("<p>1</p><p>2</p><p>3</p><p>4</p>");

        count.value.shift();
        await Promise.resolve();

        expect(fiber.dom.innerHTML).toBe("<p>2</p><p>3</p><p>4</p>");
    });

    // 5. INSERT: Insert at an arbitrary index using splice
    it("handles insert at an arbitrary index in place", async () => {
        const count = createSignal([1, 3, 4]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        expect(fiber.dom.innerHTML).toBe("<p>1</p><p>3</p><p>4</p>");

        // Insert 2 at index 1
        count.value.splice(1, 0, 2);
        await Promise.resolve();

        expect(fiber.dom.innerHTML).toBe("<p>1</p><p>2</p><p>3</p><p>4</p>");
    });

    // 6. REMOVE: Remove an item at an arbitrary index using splice
    it("handles removal at an arbitrary index in place", async () => {
        const count = createSignal([1, 2, 3, 4]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        expect(fiber.dom.innerHTML).toBe("<p>1</p><p>2</p><p>3</p><p>4</p>");

        // Remove item at index 2 (the number 3)
        count.value.splice(2, 1);
        await Promise.resolve();

        expect(fiber.dom.innerHTML).toBe("<p>1</p><p>2</p><p>4</p>");
    });

    // 7. REPLACE: Update an element in place
    it("handles replacement of an item at an index in place", async () => {
        const count = createSignal([1, 2, 3]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        expect(fiber.dom.innerHTML).toBe("<p>1</p><p>2</p><p>3</p>");

        // Replace the second element by mutating the array directly.
        count.value[1] = 20;
        await Promise.resolve();

        expect(fiber.dom.innerHTML).toBe("<p>1</p><p>20</p><p>3</p>");
    });

    // 8. SPLICE ADD: Add multiple elements using splice
    it("handles splice to add multiple elements in place", async () => {
        const count = createSignal([1, 4, 5]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        expect(fiber.dom.innerHTML).toBe("<p>1</p><p>4</p><p>5</p>");

        // Insert 2 and 3 at index 1
        count.value.splice(1, 0, 2, 3);
        await Promise.resolve();

        expect(fiber.dom.innerHTML).toBe(
            "<p>1</p><p>2</p><p>3</p><p>4</p><p>5</p>"
        );
    });

    // 9. SPLICE REMOVE: Remove multiple elements using splice
    it("handles splice to remove multiple elements in place", async () => {
        const count = createSignal([1, 2, 3, 4, 5]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        expect(fiber.dom.innerHTML).toBe(
            "<p>1</p><p>2</p><p>3</p><p>4</p><p>5</p>"
        );

        // Remove elements 2, 3, and 4 (from index 1, remove 3 items)
        count.value.splice(1, 3);
        await Promise.resolve();
        // console.log(count.value);
        expect(fiber.dom.innerHTML).toBe("<p>1</p><p>5</p>");
    });

    // 10. SPLICE REPLACE: Replace multiple elements using splice
    it("handles splice to replace multiple elements in place", async () => {
        const count = createSignal([1, 2, 3, 4, 5]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        expect(fiber.dom.innerHTML).toBe(
            "<p>1</p><p>2</p><p>3</p><p>4</p><p>5</p>"
        );

        // Replace elements at index 2 and 3 with 30 and 40
        count.value.splice(2, 2, 30, 40);
        await Promise.resolve();

        expect(fiber.dom.innerHTML).toBe(
            "<p>1</p><p>2</p><p>30</p><p>40</p><p>5</p>"
        );
    });

    // 11. REVERSE: Reverse the array in place
    it("handles reverse operation in place", async () => {
        const count = createSignal([1, 2, 3, 4]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        expect(fiber.dom.innerHTML).toBe("<p>1</p><p>2</p><p>3</p><p>4</p>");

        count.value.reverse();
        await Promise.resolve();

        expect(fiber.dom.innerHTML).toBe("<p>4</p><p>3</p><p>2</p><p>1</p>");
    });

    // 12. SORT: Sort the array in place
    it("handles sort operation in place", async () => {
        const count = createSignal([4, 1, 3, 2]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        expect(fiber.dom.innerHTML).toBe("<p>4</p><p>1</p><p>3</p><p>2</p>");

        count.value.sort((a, b) => a - b);
        await Promise.resolve();

        expect(fiber.dom.innerHTML).toBe("<p>1</p><p>2</p><p>3</p><p>4</p>");
    });

    // 13. SHUFFLE: Shuffle the array in place
    it("handles shuffle operation in place", async () => {
        const original = [1, 2, 3, 4, 5];
        const count = createSignal([...original]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        // Verify initial order
        expect(fiber.dom.innerHTML).toBe(
            "<p>1</p><p>2</p><p>3</p><p>4</p><p>5</p>"
        );

        // In-place Fisher-Yates shuffle
        const arr = count.value;
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        await Promise.resolve();

        // Check that all original items are present (order is likely changed)
        original.forEach((item) => {
            expect(fiber.dom.innerHTML).toContain(`<p>${item}</p>`);
        });
    });

    // 14. EMPTY ARRAY: Update an empty array by pushing items
    it("handles updates on an initially empty array", async () => {
        const count = createSignal([]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        expect(fiber.dom.innerHTML).toBe("");

        count.value.push(1, 2, 3);
        await Promise.resolve();

        expect(fiber.dom.innerHTML).toBe("<p>1</p><p>2</p><p>3</p>");
    });

    // 15. REMOVE ALL: Remove all elements in place
    it("handles removal of all elements in place", async () => {
        const count = createSignal([1, 2, 3]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        expect(fiber.dom.innerHTML).toBe("<p>1</p><p>2</p><p>3</p>");

        // Remove all elements using splice
        count.value.splice(0, count.value.length);
        await Promise.resolve();

        expect(fiber.dom.innerHTML).toBe("");
    });

    // 16. LARGE ARRAY: Perform mutations on a large array
    it("handles large array modifications in place", async () => {
        const largeArray = Array.from({ length: 1000 }, (_, i) => i);
        const count = createSignal(largeArray);
        const fiber = (
            <div>
                {() =>
                    count.value.map((item) => <span key={item}>{item},</span>)
                }
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        expect(fiber.dom.textContent).toContain("0,");
        expect(fiber.dom.textContent).toContain("999,");

        // Mutate: remove 500 elements from the middle
        count.value.splice(250, 500);
        await Promise.resolve();

        const result = fiber.dom.textContent;
        expect(result).toContain("249,");
        expect(result).toContain("750,");
        // Ensure total count is now 500
        expect(fiber.dom.children.length).toBe(500);
    });

    // 17. HIGH FREQUENCY: Rapid in-place mutations
    it("handles high frequency mutations in place", async () => {
        const count = createSignal([1, 2, 3]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        expect(fiber.dom.innerHTML).toBe("<p>1</p><p>2</p><p>3</p>");

        // Rapidly alternate push and pop 10 times
        for (let i = 0; i < 10; i++) {
            count.value.push(100 + i);
            await Promise.resolve();
            count.value.pop();
            await Promise.resolve();
        }
        // Final state should be unchanged.
        expect(fiber.dom.innerHTML).toBe("<p>1</p><p>2</p><p>3</p>");
    });
});

function captureKeyedNodes(fiber) {
    return fiber.props.children.reduce((acc, child) => {
        const key = child.props.key;
        acc[key] = child.dom;
        return acc;
    }, {});
}
function captureKeyedFC(fiber) {
    return fiber.props.children.reduce((acc, child) => {
        const key = child.props.key;
        acc[key] = child.props.children[0].dom;
        return acc;
    }, {});
}
describe("DOM Node Reuse Tests", () => {
    // Utility function: maps keyed children to their DOM node references.

    // -----------------------------
    // 1. Basic Mutations: Insertion & Removal
    // -----------------------------

    it("should reuse existing DOM nodes when pushing a new element", async () => {
        const count = createSignal([1, 2, 3]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        const initialNodes = captureKeyedNodes(fiber.props.children[0]);

        count.value.push(4);
        await Promise.resolve();

        const newNodes = captureKeyedNodes(fiber.props.children[0]);

        // Verify that nodes for keys 1, 2, and 3 are reused.
        expect(newNodes[1]).toBe(initialNodes[1]);
        expect(newNodes[2]).toBe(initialNodes[2]);
        expect(newNodes[3]).toBe(initialNodes[3]);
        // And that a new node for key 4 was added.
        expect(newNodes[4]).not.toBeUndefined();
    });
    it("should reuse existing DOM nodes when pushing a new element - FC", async () => {
        const count = createSignal([1, 2, 3]);
        const FC = ({ text }) => <p>{text}</p>;
        const fiber = (
            <div>
                {() =>
                    count.value.map((item) => (
                        <FC
                            key={item}
                            text={item}
                        />
                    ))
                }
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        const initialNodes = captureKeyedFC(fiber.props.children[0]);

        count.value.push(4);
        await Promise.resolve();

        const newNodes = captureKeyedFC(fiber.props.children[0]);

        // Verify that nodes for keys 1, 2, and 3 are reused.
        expect(newNodes[1]).toBe(initialNodes[1]);
        expect(newNodes[2]).toBe(initialNodes[2]);
        expect(newNodes[3]).toBe(initialNodes[3]);
        // And that a new node for key 4 was added.
        expect(newNodes[4]).not.toBeUndefined();
    });

    it("should reuse existing DOM nodes when popping the last element", async () => {
        const count = createSignal([1, 2, 3, 4]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        const initialNodes = captureKeyedNodes(fiber);

        count.value.pop();
        await Promise.resolve();

        const newNodes = captureKeyedNodes(fiber);
        // Nodes for keys 1, 2, and 3 should be reused.
        expect(newNodes[1]).toBe(initialNodes[1]);
        expect(newNodes[2]).toBe(initialNodes[2]);
        expect(newNodes[3]).toBe(initialNodes[3]);
        // Key 4 should no longer exist.
        expect(newNodes[4]).toBeUndefined();
    });

    it("should reuse existing DOM nodes when popping the last element - FC", async () => {
        const count = createSignal([1, 2, 3, 4]);
        const FC = ({ text }) => <p>{text}</p>;
        const fiber = (
            <div>
                {() =>
                    count.value.map((item) => (
                        <FC
                            key={item}
                            text={item}
                        />
                    ))
                }
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        const initialNodes = captureKeyedFC(fiber);

        count.value.pop();
        await Promise.resolve();

        const newNodes = captureKeyedFC(fiber);
        // Nodes for keys 1, 2, and 3 should be reused.
        expect(newNodes[1]).toBe(initialNodes[1]);
        expect(newNodes[2]).toBe(initialNodes[2]);
        expect(newNodes[3]).toBe(initialNodes[3]);
        // Key 4 should no longer exist.
        expect(newNodes[4]).toBeUndefined();
    });

    it("should reuse existing DOM nodes when unshifting a new element", async () => {
        const count = createSignal([2, 3, 4]);

        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        const initialNodes = captureKeyedNodes(fiber.props.children[0]);

        count.value.unshift(1);
        await Promise.resolve();

        const newNodes = captureKeyedNodes(fiber.props.children[0]);
        // Existing nodes for keys 2, 3, and 4 should be reused even though their positions have shifted.
        expect(newNodes[2]).toBe(initialNodes[2]);
        expect(newNodes[3]).toBe(initialNodes[3]);
        expect(newNodes[4]).toBe(initialNodes[4]);
        // And a new node for key 1 is created.
        expect(newNodes[1]).not.toBeUndefined();
    });

    it("should reuse existing DOM nodes when unshifting a new element - FC", async () => {
        const count = createSignal([2, 3, 4]);

        const FC = ({ text }) => <p>{text}</p>;
        const fiber = (
            <div>
                {() =>
                    count.value.map((item) => (
                        <FC
                            key={item}
                            text={item}
                        />
                    ))
                }
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        const initialNodes = captureKeyedFC(fiber.props.children[0]);

        count.value.unshift(1);
        await Promise.resolve();

        const newNodes = captureKeyedFC(fiber.props.children[0]);
        // Existing nodes for keys 2, 3, and 4 should be reused even though their positions have shifted.
        expect(newNodes[2]).toBe(initialNodes[2]);
        expect(newNodes[3]).toBe(initialNodes[3]);
        expect(newNodes[4]).toBe(initialNodes[4]);
        // And a new node for key 1 is created.
        expect(newNodes[1]).not.toBeUndefined();
    });

    it("should reuse existing DOM nodes when shifting (removing the first element)", async () => {
        const count = createSignal([1, 2, 3, 4]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        const initialNodes = captureKeyedNodes(fiber.props.children[0]);

        count.value.shift();
        await Promise.resolve();

        const newNodes = captureKeyedNodes(fiber.props.children[0]);
        // After removal, nodes for keys 2, 3, and 4 should be reused.
        expect(newNodes[2]).toBe(initialNodes[2]);
        expect(newNodes[3]).toBe(initialNodes[3]);
        expect(newNodes[4]).toBe(initialNodes[4]);
        // Node for key 1 should no longer exist.
        expect(newNodes[1]).toBeUndefined();
    });
    it("should reuse existing DOM nodes when shifting (removing the first element) - FC", async () => {
        const count = createSignal([1, 2, 3, 4]);
        const FC = ({ text }) => <p>{text}</p>;

        const fiber = (
            <div>
                {() =>
                    count.value.map((item) => (
                        <FC
                            key={item}
                            text={item}
                        />
                    ))
                }
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        const initialNodes = captureKeyedFC(fiber.props.children[0]);

        count.value.shift();
        await Promise.resolve();

        const newNodes = captureKeyedFC(fiber.props.children[0]);
        // After removal, nodes for keys 2, 3, and 4 should be reused.
        expect(newNodes[2]).toBe(initialNodes[2]);
        expect(newNodes[3]).toBe(initialNodes[3]);
        expect(newNodes[4]).toBe(initialNodes[4]);
        // Node for key 1 should no longer exist.
        expect(newNodes[1]).toBeUndefined();
    });

    it("should reuse nodes when inserting an element via splice", async () => {
        const count = createSignal([1, 3, 4]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);
        const initialNodes = captureKeyedNodes(fiber.props.children[0]);

        // Insert 2 at index 1.
        count.value.splice(1, 0, 2);
        await Promise.resolve();

        const newNodes = captureKeyedNodes(fiber.props.children[0]);
        // Nodes for keys 1, 3, and 4 should be reused.
        expect(newNodes[1]).toBe(initialNodes[1]);
        expect(newNodes[3]).toBe(initialNodes[3]);
        expect(newNodes[4]).toBe(initialNodes[4]);
        // A new node for key 2 should be created.
        expect(newNodes[2]).not.toBeUndefined();
    });
    it("should reuse nodes when inserting an element via splice - FC", async () => {
        const count = createSignal([1, 3, 4]);
        const FC = ({ text }) => <p>{text}</p>;

        const fiber = (
            <div>
                {() =>
                    count.value.map((item) => (
                        <FC
                            key={item}
                            text={item}
                        />
                    ))
                }
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);
        const initialNodes = captureKeyedFC(fiber.props.children[0]);

        // Insert 2 at index 1.
        count.value.splice(1, 0, 2);
        await Promise.resolve();

        const newNodes = captureKeyedFC(fiber.props.children[0]);
        // Nodes for keys 1, 3, and 4 should be reused.
        expect(newNodes[1]).toBe(initialNodes[1]);
        expect(newNodes[3]).toBe(initialNodes[3]);
        expect(newNodes[4]).toBe(initialNodes[4]);
        // A new node for key 2 should be created.
        expect(newNodes[2]).not.toBeUndefined();
    });

    it("should reuse nodes when removing elements via splice", async () => {
        const count = createSignal([1, 2, 3, 4, 5]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);
        const initialNodes = captureKeyedNodes(fiber);

        // Remove items with keys 2, 3, and 4.
        count.value.splice(1, 3);
        await Promise.resolve();

        const newNodes = captureKeyedNodes(fiber);
        // Keys 1 and 5 should be reused.
        expect(newNodes[1]).toBe(initialNodes[1]);
        expect(newNodes[5]).toBe(initialNodes[5]);
        // Keys 2, 3, and 4 should have been removed.
        expect(newNodes[2]).toBeUndefined();
        expect(newNodes[3]).toBeUndefined();
        expect(newNodes[4]).toBeUndefined();
    });
    it("should reuse nodes when removing elements via splice - FC", async () => {
        const count = createSignal([1, 2, 3, 4, 5]);
        const FC = ({ text }) => <p>{text}</p>;

        const fiber = (
            <div>
                {() =>
                    count.value.map((item) => (
                        <FC
                            key={item}
                            text={item}
                        />
                    ))
                }
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);
        const initialNodes = captureKeyedFC(fiber);

        // Remove items with keys 2, 3, and 4.
        count.value.splice(1, 3);
        await Promise.resolve();

        const newNodes = captureKeyedFC(fiber);
        // Keys 1 and 5 should be reused.
        expect(newNodes[1]).toBe(initialNodes[1]);
        expect(newNodes[5]).toBe(initialNodes[5]);
        // Keys 2, 3, and 4 should have been removed.
        expect(newNodes[2]).toBeUndefined();
        expect(newNodes[3]).toBeUndefined();
        expect(newNodes[4]).toBeUndefined();
    });

    // -----------------------------
    // 2. Reordering
    // -----------------------------

    // -----------------------------
    // 3. Component Reusability & Advanced Edge Cases
    // -----------------------------

    it("should not re-render functional components if keys remain unchanged", async () => {
        const count = createSignal([1, 2, 3]);
        let renderCount = 0;
        const FC = ({ text }) => {
            renderCount++;
            return <p>{text}</p>;
        };
        const fiber = (
            <div>
                {() =>
                    count.value.map((item) => (
                        <FC
                            key={item}
                            text={item}
                        />
                    ))
                }
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        expect(renderCount).toBe(3);
        const initialNodes = captureKeyedNodes(fiber);

        // Mutate the array in a way that preserves existing keys.
        count.value.push(4);
        await Promise.resolve();
        const newNodes = captureKeyedNodes(fiber);

        // Verify that the nodes for keys 1,2,3 are reused.
        expect(newNodes[1]).toBe(initialNodes[1]);
        expect(newNodes[2]).toBe(initialNodes[2]);
        expect(newNodes[3]).toBe(initialNodes[3]);
        // Only one new render should occur for the new item.
        expect(renderCount).toBe(4);
    });

    it("should reuse DOM nodes for unkeyed nodes based on index when array is mutated", async () => {
        const count = createSignal(["a", "b", "c"]);
        const fiber = (
            <div>{() => count.value.map((item) => <p>{item}</p>)}</div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        // Capture nodes by their DOM order.
        const initialNodes = Array.from(fiber.dom.children);

        // Reverse the array.
        count.value.reverse();
        await Promise.resolve();

        const newNodes = Array.from(fiber.dom.children);
        // For unkeyed nodes, the framework should reuse nodes by index.
        // After reverse, the first node should be the last original node, etc.
        expect(newNodes[0]).toBe(initialNodes[0]);
        expect(newNodes[1]).toBe(initialNodes[1]);
        expect(newNodes[2]).toBe(initialNodes[2]);
    });

    it("should handle duplicate keys gracefully and reuse nodes based on their positions", async () => {
        // Intentionally using duplicate keys.
        const count = createSignal([
            { key: "dup", value: 1 },
            { key: "dup", value: 2 },
        ]);
        const fiber = (
            <div>
                {() =>
                    count.value.map((item) => (
                        <p key={item.key}>{item.value}</p>
                    ))
                }
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        // Capture nodes based on order since keys are duplicated.
        const initialNodes = fiber.props.children.map((child) => child.dom);

        // Swap the order.
        count.value.reverse();
        await Promise.resolve();
        const newNodes = fiber.props.children.map((child) => child.dom);

        // Even with duplicate keys, the diffing should reassign based on position.
        expect(newNodes[0]).toBe(initialNodes[1]);
        expect(newNodes[1]).toBe(initialNodes[0]);
    });

    it("should consistently reuse DOM nodes through a rapid sequence of mutations", async () => {
        const count = createSignal([1, 2, 3, 4, 5]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        const initialNodes = captureKeyedNodes(fiber);

        // Sequence of in-place mutations:
        count.value.splice(2, 1); // remove item with key 3
        await Promise.resolve();
        count.value.push(6); // add new item with key 6
        await Promise.resolve();
        count.value.reverse();
        await Promise.resolve();
        count.value.splice(1, 2, 7, 8); // replace two items in the middle
        await Promise.resolve();

        const finalNodes = captureKeyedNodes(fiber);
        // For each key that existed in the initial array and wasn’t replaced, its node should be reused.
        [1, 2, 4, 5].forEach((key) => {
            if (initialNodes[key] && finalNodes[key]) {
                expect(finalNodes[key]).toBe(initialNodes[key]);
            }
        });
    });
    it("should consistently reuse DOM nodes through a rapid sequence of mutations - FC", async () => {
        const count = createSignal([1, 2, 3, 4, 5]);
        const FC = ({ text }) => <p>{text}</p>;

        const fiber = (
            <div>
                {() =>
                    count.value.map((item) => (
                        <FC
                            key={item}
                            text={item}
                        />
                    ))
                }
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        const initialNodes = captureKeyedFC(fiber);

        // Sequence of in-place mutations:
        count.value.splice(2, 1); // remove item with key 3
        await Promise.resolve();
        count.value.push(6); // add new item with key 6
        await Promise.resolve();
        count.value.reverse();
        await Promise.resolve();
        count.value.splice(1, 2, 7, 8); // replace two items in the middle
        await Promise.resolve();

        const finalNodes = captureKeyedFC(fiber);
        // For each key that existed in the initial array and wasn’t replaced, its node should be reused.
        [1, 2, 4, 5].forEach((key) => {
            if (initialNodes[key] && finalNodes[key]) {
                expect(finalNodes[key]).toBe(initialNodes[key]);
            }
        });
    });
});

describe("Dom node reuse - edge cases", () => {
    it("should reuse DOM nodes in this special case", async () => {
        const itemsSignal = createSignal([1, 2, 3]);
        function Test({ text }) {
            const signal = createSignal<boolean>(true);
            const timeout = setTimeout(() => (signal.value = false), 1000);

            cleanUp(() => {
                clearTimeout(timeout);
                console.log("unmounted");
            });
            return (
                <p>
                    {text}
                    {() => signal.value}
                </p>
            );
        }

        const fiber = (
            <ul>
                {() =>
                    itemsSignal.value.map((item, index) => (
                        <Test
                            key={`item-${item}`}
                            text={item}
                        />
                    ))
                }
            </ul>
        );

        createFiber(fiber);
        commitFiber(fiber);

        expect(fiber.dom.innerHTML).toBe(
            `<p>1true</p><p>2true</p><p>3true</p>`
        );
        // wait 1 second
        await new Promise((resolve) => setTimeout(resolve, 1100));

        expect(fiber.dom.innerHTML).toBe(`<p>1</p><p>2</p><p>3</p>`);
        let swap = 0;
        function specialSwap() {
            if (itemsSignal.value.length < 2) return;

            const temp = itemsSignal.value[swap % itemsSignal.value.length];
            itemsSignal.value[swap] =
                itemsSignal.value[(swap + 1) % itemsSignal.value.length];
            itemsSignal.value[(swap + 1) % itemsSignal.value.length] = temp;
            swap = (swap + 1) % itemsSignal.value.length;
        }

        for (let i = 0; i < 6; i++) {
            specialSwap();
            await Promise.resolve();
            expect(fiber.dom.innerHTML).toBe(
                `<p>${itemsSignal.value[0]}</p><p>${itemsSignal.value[1]}</p><p>${itemsSignal.value[2]}</p>`
            );
        }
        for (let i = 0; i < 3; i++) {
            itemsSignal.value.unshift(itemsSignal.value.pop());
            await Promise.resolve();
            expect(fiber.dom.innerHTML).toBe(
                `<p>${itemsSignal.value[0]}</p><p>${itemsSignal.value[1]}</p><p>${itemsSignal.value[2]}</p>`
            );
        }

        expect(fiber.dom.innerHTML).toBe(`<p>1</p><p>2</p><p>3</p>`);
    });
    it("should reuse DOM nodes when reversing the array", async () => {
        const count = createSignal([1, 2, 3, 4]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);
        const initialNodes = captureKeyedNodes(fiber.props.children[0]);

        count.value.reverse();
        await Promise.resolve();

        const newNodes = captureKeyedNodes(fiber.props.children[0]);
        // Even though the order is reversed, the same nodes (by key) should be reused.
        expect(newNodes[1]).toBe(initialNodes[1]);
        expect(newNodes[2]).toBe(initialNodes[2]);
        expect(newNodes[3]).toBe(initialNodes[3]);
        expect(newNodes[4]).toBe(initialNodes[4]);

        // Optionally, verify that the DOM children order has reversed.
        const children = Array.from(fiber.dom.children);
        expect(children[0]).toBe(newNodes[4]);
        expect(children[1]).toBe(newNodes[3]);
        expect(children[2]).toBe(newNodes[2]);
        expect(children[3]).toBe(newNodes[1]);
    });

    it("should reuse DOM nodes when sorting the array", async () => {
        const count = createSignal([4, 1, 3, 2]);
        const fiber = (
            <div>
                {() => count.value.map((item) => <p key={item}>{item}</p>)}
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);
        const initialNodes = captureKeyedNodes(fiber.props.children[0]);

        // // Sort the array so that it becomes [1, 2, 3, 4].
        count.value.sort((a, b) => a - b);
        await Promise.resolve();

        const newNodes = captureKeyedNodes(fiber.props.children[0]);
        console.log(initialNodes, newNodes, newNodes[2]);
        expect(newNodes[1]).toBe(initialNodes[1]);
        expect(newNodes[2]).toBe(initialNodes[2]);
        expect(newNodes[3]).toBe(initialNodes[3]);
        expect(newNodes[4]).toBe(initialNodes[4]);

        // Verify DOM order is sorted.
        const children = Array.from(fiber.dom.children);
        expect(children[0]).toBe(newNodes[1]);
        expect(children[1]).toBe(newNodes[2]);
        expect(children[2]).toBe(newNodes[3]);
        expect(children[3]).toBe(newNodes[4]);
    });
});
