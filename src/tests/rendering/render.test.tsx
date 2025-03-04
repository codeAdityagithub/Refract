import { beforeEach, describe, expect, it, vi } from "vitest";
import { FRAGMENT_SYMBOL } from "../../rendering/createElements";

import * as rendering from "../../rendering/render";
import { createSignal } from "../../signals/signal";

const mockFiber = (type: any, children: any[] = [], props: any = {}) => ({
    type,
    props: { children, ...props },
    parent: null,
    dom: null as HTMLElement | null,
});
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

describe("createFiber", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should handle a fragment with FRAGMENT_SYMBOL", () => {
        const fragmentFiber = mockFiber("FRAGMENT", [
            mockFiber("div"),
            mockFiber("span"),
        ]);
        fragmentFiber.props.children[FRAGMENT_SYMBOL] = true;

        createFiber(fragmentFiber);

        expect(fragmentFiber.props.children[0].parent).toBe(fragmentFiber);
        expect(fragmentFiber.props.children[1].parent).toBe(fragmentFiber);
    });

    it("should warn if children of a fragment lack a key", () => {
        console.error = vi.fn();

        const fragmentFiber = mockFiber("FRAGMENT", [
            mockFiber("div", [], { key: undefined }),
        ]);

        createFiber(fragmentFiber);

        expect(console.error).toHaveBeenCalledWith(
            "Array children must have a key attribute"
        );
    });

    it("should handle function components returning an array", () => {
        const funcComponent = vi.fn(() => [
            mockFiber("p"),
            mockFiber("button"),
        ]);

        const fiber = mockFiber(funcComponent);
        createFiber(fiber);
        commitFiber(fiber);
        // expect(setCurrentFC).toHaveBeenCalledWith(funcComponent);
        // expect(clearCurrentFC).toHaveBeenCalled();
        expect(fiber.type).toEqual(funcComponent);
        expect(fiber.props.children).toHaveLength(2);
        expect(fiber.props.children[0].parent).toBe(fiber);
    });

    it("should handle function components returning a single element", () => {
        const FC = () => {
            return <p>hello</p>;
        };

        const fiber = (
            <div>
                <FC />
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);

        expect(fiber.props.children).toHaveLength(1);
        expect(fiber.props.children[0].parent).toBe(fiber);
    });

    it("should recursively process children for normal elements", () => {
        const fiber = mockFiber("div", [
            mockFiber("span"),
            mockFiber("strong"),
        ]);

        createFiber(fiber);

        expect(fiber.props.children[0].parent).toBe(fiber);
        expect(fiber.props.children[1].parent).toBe(fiber);
    });
});

describe("commitFiber", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should commit fiber to the Parent", () => {
        const root = document.createElement("div");
        const rootFiber = {
            type: "div",
            props: { children: [] },
            parent: null,
            dom: root,
        };

        const fiber = mockFiber("div");
        fiber.parent = rootFiber;

        commitFiber(fiber);

        expect(fiber.dom.parentElement).toBe(root);
    });
    it("should commit fiber to the Parent if current is fragment", () => {
        const root = document.createElement("div");
        const rootFiber = {
            type: "div",
            props: { children: [] },
            parent: null,
            dom: root,
        };

        const fragmentFiber = mockFiber("FRAGMENT", [
            mockFiber("div"),
            mockFiber("span"),
        ]);

        fragmentFiber.parent = rootFiber;

        createFiber(fragmentFiber);
        commitFiber(fragmentFiber);

        expect(fragmentFiber.dom).toBeFalsy();
        expect(fragmentFiber.props.children[0].dom.parentElement).toBe(root);
        expect(fragmentFiber.props.children[1].dom.parentElement).toBe(root);
    });

    it("should append children to the parent before the reference node", () => {
        const root = document.createElement("div");
        const firstChild = document.createElement("p");

        const firstChildFiber = mockFiber("p");
        firstChildFiber.dom = firstChild;

        root.appendChild(firstChild);

        const rootFiber = {
            type: "div",
            props: { children: [firstChildFiber] },
            parent: null,
            dom: root,
        };
        firstChildFiber.parent = rootFiber;

        const newFiber = mockFiber("div");
        newFiber.parent = rootFiber;

        createFiber(newFiber);
        commitFiber(newFiber, firstChild);

        expect(newFiber.dom.parentElement).toBe(root);
        expect(newFiber.dom.nextElementSibling).toBe(firstChild);
        expect(root.children.length).toBe(2);
    });
    it("should replace children on the parent with the reference node", () => {
        const root = document.createElement("div");
        const firstChild = document.createElement("p");

        const firstChildFiber = mockFiber("p");
        firstChildFiber.dom = firstChild;

        root.appendChild(firstChild);

        const rootFiber = {
            type: "div",
            props: { children: [firstChildFiber] },
            parent: null,
            dom: root,
        };
        firstChildFiber.parent = rootFiber;

        const newFiber = mockFiber("div");
        newFiber.parent = rootFiber;

        createFiber(newFiber);
        commitFiber(newFiber, firstChild, true);

        expect(newFiber.dom.parentElement).toBe(root);
        expect(root.firstChild).toBe(newFiber.dom);
        expect(root.children.length).toBe(1);
    });
});

describe("commitDeletion", () => {
    it("should remove the DOM element", () => {
        const container = <div></div>;

        const fiber = <div>Test</div>;

        fiber.parent = container;
        fiber.parent.props.children = [fiber];

        createFiber(container);
        commitFiber(container);

        expect(container.dom.innerHTML).toBe("<div>Test</div>");

        commitDeletion(fiber);

        expect(container.dom.innerHTML).toBe("");
    });

    it("should remove event listeners and properties", () => {
        const onClick = vi.fn();
        const container = <div></div>;

        const fiber = <div onClick={onClick}>Test</div>;
        fiber.parent = container;
        fiber.parent.props.children = [fiber];

        createFiber(container);
        commitFiber(container);

        expect(container.dom.innerHTML).toBe("<div>Test</div>");
        fiber.dom.click();
        expect(onClick).toHaveBeenCalled();

        commitDeletion(fiber);
        fiber.dom.click();

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("should stop updates after deletion", async () => {
        const count = createSignal<number>(0);

        const container = <div></div>;

        const fiber = <div>{() => count.value}</div>;
        fiber.parent = container;
        fiber.parent.props.children = [fiber];

        createFiber(container);
        commitFiber(container);

        expect(container.dom.innerHTML).toBe("<div>0</div>");
        expect(fiber.props.children[0].renderFunction).toBeDefined();

        count.update(1);
        await Promise.resolve();

        expect(container.dom.innerHTML).toBe("<div>1</div>");

        commitDeletion(fiber, true);
        expect(fiber.props.children[0].renderFunction).toBeUndefined();
        expect(container.dom.innerHTML).toBe("");

        count.update(2);
        await Promise.resolve();

        expect(container.dom.innerHTML).toBe("");
    });
});

describe("render FC returning array fragment", () => {
    it("Should be able to render FC returning array fragment and warn for key not being present", async () => {
        const count = createSignal([1, 2, 3]);

        const ArrayReturningFC = ({ count }) => {
            return <>{() => count.value.map((item) => <div>{item}</div>)}</>;
        };

        const fiber = (
            <div>
                <ArrayReturningFC count={count} />
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);

        expect(fiber.dom.innerHTML).toBe(
            "<div>1</div><div>2</div><div>3</div>"
        );
        count.update((prev) => prev.push(4));
        await Promise.resolve();
        expect(count.value[count.value.length - 1]).toBe(4);

        expect(fiber.dom.innerHTML).toBe(
            "<div>1</div><div>2</div><div>3</div><div>4</div>"
        );
        expect(console.error).toBeCalled();
    });
});

describe("updateFiber - Basic Node Replacement", () => {
    it("Should replace a node correctly", () => {
        const fiber = (
            <div>
                <p>Hello</p>
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        expect(fiber.dom.innerHTML).toBe("<p>Hello</p>");

        const newFiber = (
            <div>
                <h3>World</h3>
            </div>
        );
        updateFiber(fiber, newFiber);

        expect(fiber.props.children[0].type).toBe("h3");
        expect(fiber.dom.innerHTML).toBe("<h3>World</h3>");
    });
});

describe("updateFiber - Should update inplace if same nodes are", () => {
    it("Should update a node correctly", () => {
        const fiber = (
            <div>
                <p>Hello</p>
                <h3>hi</h3>
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        const prevP = fiber.props.children[0].dom;
        const prevh3 = fiber.props.children[1].dom;

        expect(fiber.dom.innerHTML).toBe("<p>Hello</p><h3>hi</h3>");

        const newFiber = (
            <div>
                <p>HI</p>
                <h3 onClick={() => {}}>World</h3>
            </div>
        );
        updateFiber(fiber, newFiber);

        expect(fiber.dom.innerHTML).toBe("<p>HI</p><h3>World</h3>");
        expect(fiber.dom.children[1].onclick).toBeDefined();

        expect(fiber.props.children[0].dom).toBe(prevP);
        expect(fiber.props.children[1].dom).toBe(prevh3);
    });
});

describe("updateFiber - Updating Text Content", () => {
    it("Should update text content in place", () => {
        const fiber = <p>Hello</p>;
        createFiber(fiber);
        commitFiber(fiber);

        const prevDom = fiber.dom;

        const newFiber = <p>World</p>;
        updateFiber(fiber, newFiber);

        expect(fiber.dom).toBe(prevDom);
        expect(fiber.dom.textContent).toBe("World");
    });
});
describe("updateFiber - Updating Attributes", () => {
    it("Should update element attributes", () => {
        const fiber = <button disabled />;
        createFiber(fiber);
        commitFiber(fiber);

        expect(fiber.dom.hasAttribute("disabled")).toBe(true);

        const newFiber = <button />;
        updateFiber(fiber, newFiber);

        expect(fiber.dom.hasAttribute("disabled")).toBe(false);
    });
});

describe("updateFiber - Removing a Node", () => {
    it("Should remove a child node correctly", () => {
        const fiber = (
            <div>
                <p>Hello</p>
                <span>World</span>
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);

        const newFiber = (
            <div>
                <span>World</span>
            </div>
        );

        updateFiber(fiber, newFiber);

        expect(fiber.props.children.length).toBe(1);
        expect(fiber.dom.innerHTML).toBe("<span>World</span>");
    });
});

describe("updateFiber - Adding a New Node", () => {
    it("Should add a new child node correctly", () => {
        const fiber = (
            <ul>
                <li>Apple</li>
                <li>Banana</li>
            </ul>
        );

        createFiber(fiber);
        commitFiber(fiber);

        const newFiber = (
            <ul>
                <li>Apple</li>
                <li>Banana</li>
                <li>Cherry</li>
            </ul>
        );

        updateFiber(fiber, newFiber);

        expect(fiber.props.children.length).toBe(3);
        expect(fiber.dom.innerHTML).toBe(
            "<li>Apple</li><li>Banana</li><li>Cherry</li>"
        );
    });
});

describe("updateFiber - Component Replacement FC-FC", () => {
    function ComponentA() {
        return <p>A</p>;
    }

    function ComponentB() {
        return <p>B</p>;
    }
    it("Should replace a component correctly", () => {
        const fiber = (
            <div>
                <ComponentA />
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);

        const newFiber = (
            <div>
                <ComponentB />
            </div>
        );

        updateFiber(fiber, newFiber);

        expect(fiber.props.children[0].type).toBe(ComponentB);
        expect(fiber.props.children[0].props.children[0].dom.innerHTML).toBe(
            "B"
        );
    });
});

describe("updateFiber - Null and Undefined Children", () => {
    it("Should handle null and undefined children gracefully", () => {
        const fiber = <div>{null}</div>;
        createFiber(fiber);
        commitFiber(fiber);

        expect(fiber.dom.innerHTML).toBe("");

        const newFiber = <div>Text</div>;
        updateFiber(fiber, newFiber);

        expect(fiber.dom.innerHTML).toBe("Text");
    });
});

describe("updateFiber - Handling Empty Nodes", () => {
    it("Should handle empty nodes properly", () => {
        const fiber = <div></div>;
        createFiber(fiber);
        commitFiber(fiber);

        const newFiber = (
            <div>
                <p>Content</p>
            </div>
        );
        updateFiber(fiber, newFiber);

        expect(fiber.dom.innerHTML).toBe("<p>Content</p>");
    });
});

describe("updateFiber - Fragment-Fragment", () => {
    it("Should update fragments correctly", () => {
        const fiber = (
            <div>
                <>
                    <p>Hello</p>
                    <span>World</span>
                </>
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);

        const newFiber = (
            <div>
                <>
                    <h1>Updated</h1>
                </>
            </div>
        );
        updateFiber(fiber, newFiber);

        expect(fiber.dom.innerHTML).toBe("<h1>Updated</h1>");
    });
});
describe("updateFiber - Node-FC", () => {
    it("Should update node with FC correctly", () => {
        const fiber = (
            <div>
                <p>Hello</p>
                <span>World</span>
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        const FC = () => {
            return <div>FC</div>;
        };
        const newFiber = (
            <div>
                <FC />
            </div>
        );
        updateFiber(fiber, newFiber);
        expect(fiber.props.children.length).toBe(1);
        expect(fiber.props.children[0].type).toBe(FC);
        expect(fiber.dom.innerHTML).toBe("<div>FC</div>");
    });
});
describe("updateFiber - Node-Fragment", () => {
    it("Should update node with FC correctly", () => {
        const fiber = (
            <div>
                <p>Hello</p>
                <span>World</span>
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);

        const newFiber = (
            <div>
                <>
                    <div>Fragment 1</div>
                    <div>Fragment 2</div>
                    <div>Fragment 3</div>
                </>
            </div>
        );
        updateFiber(fiber, newFiber);

        expect(fiber.props.children.length).toBe(3);
        expect(fiber.dom.innerHTML).toBe(
            "<div>Fragment 1</div><div>Fragment 2</div><div>Fragment 3</div>"
        );
    });
});
describe("updateFiber - FC-Fragment", () => {
    it("Should update node with FC correctly", () => {
        const FC = () => {
            return <p>Hello</p>;
        };
        const fiber = (
            <div>
                <FC />
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        expect(fiber.dom.innerHTML).toBe("<p>Hello</p>");

        const newFiber = (
            <div>
                {() => (
                    <>
                        <div>Fragment 1</div>
                        <div>Fragment 2</div>
                        <div>Fragment 3</div>
                    </>
                )}
            </div>
        );
        // console.dir(fiber.props.children[0].type);
        updateFiber(fiber, newFiber);
        expect(fiber.props.children.length).toBe(1);
        expect(fiber.props.children[0].type).toBe("FRAGMENT");
        expect(fiber.dom.innerHTML).toBe(
            "<div>Fragment 1</div><div>Fragment 2</div><div>Fragment 3</div>"
        );
    });
});

describe("updateChildren - edge case", () => {
    it("should handle last child not having dom node", () => {
        const fiber = (
            <div>
                <p>Hello</p>
                <span>World</span>
                {() => (
                    <>
                        <div>Fragment 1</div>
                        <div>Fragment 2</div>
                    </>
                )}
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);

        const newFiber = (
            <div>
                <p>Hello</p>
                <span>World</span>

                {() => (
                    <>
                        <div>Fragment 3</div>
                        <div>Fragment 4</div>
                    </>
                )}
                <div>New Node2</div>
            </div>
        );

        // console.log(fiber.props.children.at(-1));
        updateFiber(fiber, newFiber);
        expect(fiber.dom.innerHTML).toBe(
            "<p>Hello</p><span>World</span><div>Fragment 3</div><div>Fragment 4</div><div>New Node2</div>"
        );
    });
});

describe("render Functional components mapped by a list", () => {
    it("renders a FC mapped by a list", async () => {
        const items = createSignal(["Apple", "Banana", "Cherry"]);

        const FC = ({ text }) => {
            return <p>{text}</p>;
        };
        const element = (
            <div>
                {() => items.value.map((item, index) => <FC text={item} />)}
            </div>
        );

        createFiber(element);
        commitFiber(element);
        expect(element.dom.innerHTML).toBe(
            "<p>Apple</p><p>Banana</p><p>Cherry</p>"
        );
    });
});

describe("Key-based node swap reconciliation", () => {
    it("should swap two keyed elements and reuse their DOM nodes", () => {
        const fiber = (
            <div>
                <p key="1">First</p>
                <p key="2">Second</p>
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);

        const firstNode = fiber.props.children[0].dom;
        const secondNode = fiber.props.children[1].dom;

        // Swap the order based on key
        const newFiber = (
            <div>
                <p key="2">Second</p>
                <p key="1">First</p>
            </div>
        );
        updateFiber(fiber, newFiber);

        expect(fiber.dom.innerHTML).toBe("<p>Second</p><p>First</p>");
        expect(fiber.props.children[0].dom).toBe(secondNode);
        expect(fiber.props.children[1].dom).toBe(firstNode);
    });

    it("should handle insertion and removal in keyed lists", () => {
        const fiber = (
            <div>
                <p key="1">One</p>
                <p key="2">Two</p>
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);

        const node1 = fiber.props.children[0].dom;
        const node2 = fiber.props.children[1].dom;

        // Insert a new element with key "3" between the existing ones.
        const newFiber = (
            <div>
                <p key="1">One</p>
                <p key="3">Three</p>
                <p key="2">Two</p>
            </div>
        );
        updateFiber(fiber, newFiber);

        expect(fiber.dom.innerHTML).toBe("<p>One</p><p>Three</p><p>Two</p>");
        expect(fiber.props.children[0].dom).toBe(node1);
        expect(fiber.props.children[2].dom).toBe(node2);
        // The new element (key "3") must be a new node.
        expect(fiber.props.children[1].dom).not.toBe(node1);
        expect(fiber.props.children[1].dom).not.toBe(node2);
    });

    it("should correctly handle mixed keyed and unkeyed children", () => {
        const fiber = (
            <div>
                <p>Hello</p>
                <p key="a">A</p>
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);

        const keyedNode = fiber.props.children[1].dom;

        // Swap their order: the keyed element should be found by key,
        // while the unkeyed element is reconciled by its position.
        const newFiber = (
            <div>
                <p key="a">A</p>
                <p>Hello</p>
            </div>
        );
        updateFiber(fiber, newFiber);

        expect(fiber.dom.innerHTML).toBe("<p>A</p><p>Hello</p>");
        console.log(fiber.props.children[0].dom, keyedNode);
        expect(fiber.props.children[0].dom).toBe(keyedNode);
    });

    it("should warn or handle duplicate keys gracefully", () => {
        // Spy on console.warn to check if a duplicate key warning is issued.
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        const fiber = (
            <div>
                <p key="dup">First</p>
                <p key="dup">Duplicate</p>
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);

        // Swap the order; duplicate keys may force a fallback to position diffing.
        const newFiber = (
            <div>
                <p key="dup">Duplicate</p>
                <p key="dup">First</p>
            </div>
        );
        updateFiber(fiber, newFiber);

        expect(fiber.dom.innerHTML).toBe("<p>Duplicate</p><p>First</p>");
        expect(warnSpy).toHaveBeenCalled();

        warnSpy.mockRestore();
    });

    it("should not remount functional components when swapped", () => {
        let mountCount = 0;
        // A simple functional component that increments a counter when mounted.
        const TestFunctional = () => {
            mountCount++;
            return <div>Functional</div>;
        };

        const fiber = (
            <div>
                <TestFunctional key="1" />
                <TestFunctional key="2" />
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);

        // Capture the DOM nodes of the mounted functional components.
        const node1 = fiber.props.children[0].dom;
        const node2 = fiber.props.children[1].dom;
        const initialMountCount = mountCount;

        // Swap the order of the functional components.
        const newFiber = (
            <div>
                <TestFunctional key="2" />
                <TestFunctional key="1" />
            </div>
        );
        updateFiber(fiber, newFiber);

        expect(fiber.dom.innerHTML).toBe(
            "<div>Functional</div><div>Functional</div>"
        );
        expect(fiber.props.children[0].dom).toBe(node2);
        expect(fiber.props.children[1].dom).toBe(node1);
        // The mountCount should not increase if the functional components were reused.
        expect(mountCount).toBe(initialMountCount);
    });
});

describe("Complex keyed nodes reconciliation", () => {
    it("should handle reordering, insertion, and removal with multiple keyed nodes then reverse update", () => {
        // Original fiber with 4 keyed children.
        const originalFiber = (
            <div>
                <div key="A">A</div>
                <p key="B">B</p>
                <span key="C">C</span>
                <h1 key="D">D</h1>
            </div>
        );

        createFiber(originalFiber);
        commitFiber(originalFiber);

        // Save the initial DOM node references.
        const nodeA = originalFiber.props.children[0].dom;
        const nodeB = originalFiber.props.children[1].dom;
        const nodeC = originalFiber.props.children[2].dom;
        const nodeD = originalFiber.props.children[3].dom;

        // New fiber: reordering keys and modifying the list.
        // Order: B, D, A, and a new element E (while "C" is removed).
        const newFiber = (
            <div>
                <p key="B">B</p>
                <h1 key="D">D</h1>
                <div key="A">A</div>
                <section key="E">E</section>
            </div>
        );
        updateFiber(originalFiber, newFiber);

        // Check innerHTML is updated accordingly.
        expect(originalFiber.dom.innerHTML).toBe(
            "<p>B</p><h1>D</h1><div>A</div><section>E</section>"
        );

        // Ensure the nodes with keys A, B, and D were reused.
        expect(originalFiber.props.children[0].dom).toBe(nodeB);
        expect(originalFiber.props.children[1].dom).toBe(nodeD);
        expect(originalFiber.props.children[2].dom).toBe(nodeA);
        // The node for key "E" is new.

        // Reverse update: go back to the original fiber.
        const reverseFiber = (
            <div>
                <div key="A">A</div>
                <p key="B">B</p>
                <span key="C">C</span>
                <h1 key="D">D</h1>
            </div>
        );
        updateFiber(originalFiber, reverseFiber);

        // Verify the DOM is restored to the original structure.
        expect(originalFiber.dom.innerHTML).toBe(
            "<div>A</div><p>B</p><span>C</span><h1>D</h1>"
        );

        // Check that keys A, B, and D reuse their previous nodes.
        expect(originalFiber.props.children[0].dom).toBe(nodeA);
        expect(originalFiber.props.children[1].dom).toBe(nodeB);
        expect(originalFiber.props.children[3].dom).toBe(nodeD);

        // Since "C" was removed in the intermediate step, its node should be new.
        expect(originalFiber.props.children[2].dom).not.toBe(nodeC);
    });

    it("should handle complex reordering in a list of multiple keyed nodes and then reverse update", () => {
        // Original list of 5 items.
        const fiber = (
            <ul>
                <li key="1">Item 1</li>
                <li key="2">Item 2</li>
                <li key="3">Item 3</li>
                <li key="4">Item 4</li>
                <li key="5">Item 5</li>
            </ul>
        );

        createFiber(fiber);
        commitFiber(fiber);

        // Capture initial node references.
        const node1 = fiber.props.children[0].dom;
        const node2 = fiber.props.children[1].dom;
        const node3 = fiber.props.children[2].dom;
        const node4 = fiber.props.children[3].dom;
        const node5 = fiber.props.children[4].dom;

        // New fiber: reorder the items to: 3, 1, 4, 2, 5.
        const newFiber = (
            <ul>
                <li key="3">Item 3</li>
                <li key="1">Item 1</li>
                <li key="4">Item 4</li>
                <li key="2">Item 2</li>
                <li key="5">Item 5</li>
            </ul>
        );
        updateFiber(fiber, newFiber);

        // Verify the innerHTML order.
        expect(fiber.dom.innerHTML).toBe(
            "<li>Item 3</li><li>Item 1</li><li>Item 4</li><li>Item 2</li><li>Item 5</li>"
        );

        // Ensure the nodes are reused correctly.
        expect(fiber.props.children[0].dom).toBe(node3);
        expect(fiber.props.children[1].dom).toBe(node1);
        expect(fiber.props.children[2].dom).toBe(node4);
        expect(fiber.props.children[3].dom).toBe(node2);
        expect(fiber.props.children[4].dom).toBe(node5);

        // Reverse update: revert back to the original order.
        const reverseFiber = (
            <ul>
                <li key="1">Item 1</li>
                <li key="2">Item 2</li>
                <li key="3">Item 3</li>
                <li key="4">Item 4</li>
                <li key="5">Item 5</li>
            </ul>
        );
        updateFiber(fiber, reverseFiber);

        // Check the innerHTML order is back to the original.
        expect(fiber.dom.innerHTML).toBe(
            "<li>Item 1</li><li>Item 2</li><li>Item 3</li><li>Item 4</li><li>Item 5</li>"
        );

        // Validate that nodes are back in their original positions.
        expect(fiber.props.children[0].dom).toBe(node1);
        expect(fiber.props.children[1].dom).toBe(node2);
        expect(fiber.props.children[2].dom).toBe(node3);
        expect(fiber.props.children[3].dom).toBe(node4);
        expect(fiber.props.children[4].dom).toBe(node5);
    });

    it("should handle non-adjacent swaps with multiple keyed nodes then reverse update", () => {
        // Original fiber with 5 keyed elements of different types.
        const fiber = (
            <div>
                <span key="s1">S1</span>
                <div key="d1">D1</div>
                <p key="p1">P1</p>
                <article key="a1">A1</article>
                <section key="sec1">Sec1</section>
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);

        // Save original node references.
        const nodeS1 = fiber.props.children[0].dom;
        const nodeD1 = fiber.props.children[1].dom;
        const nodeP1 = fiber.props.children[2].dom;
        const nodeA1 = fiber.props.children[3].dom;
        const nodeSec1 = fiber.props.children[4].dom;

        // New fiber: swap non-adjacent nodes: move last node to first, first to last.
        const newFiber = (
            <div>
                <section key="sec1">Sec1</section>
                <div key="d1">D1</div>
                <p key="p1">P1</p>
                <article key="a1">A1</article>
                <span key="s1">S1</span>
            </div>
        );
        updateFiber(fiber, newFiber);

        // Verify the new order.
        expect(fiber.dom.innerHTML).toBe(
            "<section>Sec1</section><div>D1</div><p>P1</p><article>A1</article><span>S1</span>"
        );
        expect(fiber.props.children[0].dom).toBe(nodeSec1);
        expect(fiber.props.children[1].dom).toBe(nodeD1);
        expect(fiber.props.children[2].dom).toBe(nodeP1);
        expect(fiber.props.children[3].dom).toBe(nodeA1);
        expect(fiber.props.children[4].dom).toBe(nodeS1);

        // Reverse update: return to original order.
        const reverseFiber = (
            <div>
                <span key="s1">S1</span>
                <div key="d1">D1</div>
                <p key="p1">P1</p>
                <article key="a1">A1</article>
                <section key="sec1">Sec1</section>
            </div>
        );
        updateFiber(fiber, reverseFiber);

        // Check that the DOM is restored.
        expect(fiber.dom.innerHTML).toBe(
            "<span>S1</span><div>D1</div><p>P1</p><article>A1</article><section>Sec1</section>"
        );
        expect(fiber.props.children[0].dom).toBe(nodeS1);
        expect(fiber.props.children[1].dom).toBe(nodeD1);
        expect(fiber.props.children[2].dom).toBe(nodeP1);
        expect(fiber.props.children[3].dom).toBe(nodeA1);
        expect(fiber.props.children[4].dom).toBe(nodeSec1);
    });
});

describe("Complex update: different number of children with keyed and unkeyed nodes", () => {
    it("should update correctly when reducing then increasing the number of children", () => {
        // Initial fiber: a mix of unkeyed and keyed nodes.
        const fiber = (
            <div>
                <p>Paragraph 1</p>
                <span key="1">Span 1</span>
                <p key="2">Paragraph 2</p>
                <p>Paragraph 3</p>
                <div key="3">Div 3</div>
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);

        // Capture initial keyed node references for later reuse verification.
        const keyedSpan = fiber.props.children[1].dom;
        const keyedP2 = fiber.props.children[2].dom;
        const keyedDiv3 = fiber.props.children[4].dom;

        // Verify initial DOM structure.
        expect(fiber.dom.innerHTML).toBe(
            "<p>Paragraph 1</p><span>Span 1</span><p>Paragraph 2</p><p>Paragraph 3</p><div>Div 3</div>"
        );

        // First update: reduce children (removing both unkeyed nodes and key "3").
        const fewerFiber = (
            <div>
                <span key="1">Span 1</span>
                <p key="2">Paragraph 2</p>
            </div>
        );
        updateFiber(fiber, fewerFiber);

        // Verify that the DOM now contains only the two keyed nodes.
        expect(fiber.dom.innerHTML).toBe(
            "<span>Span 1</span><p>Paragraph 2</p>"
        );

        // Check that the keyed nodes for keys "1" and "2" are reused.
        expect(fiber.props.children[0].dom).toBe(keyedSpan);
        expect(fiber.props.children[1].dom).toBe(keyedP2);

        // Second update: increase children by reintroducing unkeyed nodes, key "3",
        // and adding a new unkeyed node at the end.
        const moreFiber = (
            <div>
                <p>Paragraph 1</p>
                <span key="1">Span 1 Updated</span>
                <p key="2">Paragraph 2</p>
                <p>Paragraph 3</p>
                <div key="3">Div 3</div>
                <footer>Footer</footer>
            </div>
        );
        updateFiber(fiber, moreFiber);

        // Verify the final DOM structure.
        expect(fiber.dom.innerHTML).toBe(
            "<p>Paragraph 1</p><span>Span 1 Updated</span><p>Paragraph 2</p><p>Paragraph 3</p><div>Div 3</div><footer>Footer</footer>"
        );

        // Check keyed nodes reuse:
        // - Key "1" and "2" should be reused from the previous update.
        expect(fiber.props.children[1].dom).toBe(keyedSpan);
        expect(fiber.props.children[2].dom).toBe(keyedP2);

        // - Key "3" was removed in the fewer update; therefore, it is expected to be a new node.
        expect(fiber.props.children[4].dom).not.toBe(keyedDiv3);
    });
});
