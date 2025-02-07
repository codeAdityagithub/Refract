import { beforeEach, describe, expect, it, vi } from "vitest";
import { FRAGMENT_SYMBOL } from "../../rendering/createElements";

import * as rendering from "../../rendering/render";

const mockFiber = (type: any, children: any[] = [], props: any = {}) => ({
    type,
    props: { children, ...props },
    parent: null,
    dom: null as HTMLElement | null,
});
vi.stubGlobal("requestIdleCallback", (cb) => {
    queueMicrotask(() => cb({ timeRemaining: () => 2 }));
});

const createFiber = rendering.createFiber;
const commitFiber = rendering.commitFiber;
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

        // expect(setCurrentFC).toHaveBeenCalledWith(funcComponent);
        // expect(clearCurrentFC).toHaveBeenCalled();
        expect(fiber.type).toEqual(funcComponent);
        expect(fiber.props.children).toHaveLength(2);
        expect(fiber.props.children[0].parent).toBe(fiber);
    });

    it("should handle function components returning a single element", () => {
        const funcComponent = vi.fn(() => mockFiber("h1"));

        const fiber = mockFiber(funcComponent);
        createFiber(fiber);

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

describe("render FC returning array fragment", () => {
    it("Should be able to render FC returning array fragment and warn for key not being present", () => {
        const ArrayReturningFC = () => {
            const count = [1, 2, 3];
            return <>{() => count.map((item) => <div>{item}</div>)}</>;
        };

        const fiber = (
            <div>
                <ArrayReturningFC />
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);

        expect(fiber.dom.innerHTML).toBe(
            "<div>1</div><div>2</div><div>3</div>"
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
        const fiber = <ComponentA />;
        createFiber(fiber);
        commitFiber(fiber);

        const newFiber = <ComponentB />;

        updateFiber(fiber, newFiber);
        expect(fiber.type).toBe(ComponentB);
        expect(fiber.props.children[0].dom.innerHTML).toBe("B");
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

// describe("updateFiber - Reordering Nodes", () => {
//     it("Should swap nodes without unnecessary re-creation", () => {
//         const fiber = (
//             <div>
//                 <p>Hello</p>
//                 <span>World</span>
//             </div>
//         );

//         createFiber(fiber);
//         commitFiber(fiber);

//         const prevP = fiber.props.children[0].dom;
//         const prevSpan = fiber.props.children[1].dom;

//         const newFiber = (
//             <div>
//                 <span>World</span>
//                 <p>Hello</p>
//             </div>
//         );

//         updateFiber(fiber, newFiber);

//         expect(fiber.props.children[0].dom).toBe(prevSpan);
//         expect(fiber.props.children[1].dom).toBe(prevP);
//         expect(fiber.dom.innerHTML).toBe("<span>World</span><p>Hello</p>");
//     });
// });
