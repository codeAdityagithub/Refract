import { describe, expect, it } from "vitest";
import {
    createChildren,
    createElement,
    createNode,
    createTextChildren,
} from "../../rendering/createElements";
import { createSignal } from "../../signals/signal";

describe("createElement", () => {
    it("creates a basic element with no props or children", () => {
        const element = createElement("div", null);
        expect(element).toEqual({
            type: "div",
            props: { children: [] },
        });
    });

    it("creates an element with props", () => {
        const element = createElement("div", {
            id: "it",
            className: "container",
        });
        expect(element).toEqual({
            type: "div",
            props: {
                id: "it",
                className: "container",
                children: [],
            },
        });
    });

    it("creates an element with children", () => {
        const element = createElement(
            "div",
            null,
            createElement("span", null, "child1"),
            createElement("span", null, "child2")
        );
        expect(element).toEqual({
            type: "div",
            props: {
                children: [
                    {
                        type: "span",
                        props: {
                            children: [
                                {
                                    type: "TEXT_CHILD",
                                    props: {
                                        nodeValue: "child1",
                                        children: [],
                                    },
                                },
                            ],
                        },
                    },
                    {
                        type: "span",
                        props: {
                            children: [
                                {
                                    type: "TEXT_CHILD",
                                    props: {
                                        nodeValue: "child2",
                                        children: [],
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
        });
    });

    // it("creates a FRAGMENT element", () => {
    //     const element = createElement(FRAGMENT, null, "text1", "text2");
    //     console.log({ element });
    //     expect(element).toEqual([
    //         { type: "TEXT_CHILD", props: { nodeValue: "text1", children: [] } },
    //         { type: "TEXT_CHILD", props: { nodeValue: "text2", children: [] } },
    //     ]);
    // });
});

describe("createChildren", () => {
    it("flattens nested children", () => {
        const children = createChildren(["text1", ["text2", "text3"]]);
        expect(children).toEqual([
            { type: "TEXT_CHILD", props: { nodeValue: "text1", children: [] } },
            { type: "TEXT_CHILD", props: { nodeValue: "text2", children: [] } },
            { type: "TEXT_CHILD", props: { nodeValue: "text3", children: [] } },
        ]);
    });

    it("handles signal functions", () => {
        const children = createChildren([() => "signalText"]);
        expect(children).toEqual([
            {
                type: "TEXT_CHILD",
                props: { nodeValue: "signalText", children: [] },
                renderFunction: expect.any(Function),
            },
        ]);
    });
});

describe("createTextChildren", () => {
    it("creates a text child", () => {
        const textChild = createTextChildren("hello");
        expect(textChild).toEqual({
            type: "TEXT_CHILD",
            props: { nodeValue: "hello", children: [] },
        });
    });
});

describe("createNode", () => {
    it("creates a DOM node for an element", () => {
        const element = {
            type: "div",
            props: { id: "it", children: [] },
        };
        const dom = createNode(element);
        expect(dom.tagName).toBe("DIV");
        expect(dom.id).toBe("it");
    });

    it("creates a DOM text node", () => {
        const textElement = {
            type: "TEXT_CHILD",
            props: { nodeValue: "hello", children: [] },
        };
        const dom = createNode(textElement);
        expect(dom.nodeType).toBe(Node.TEXT_NODE);
        expect(dom.nodeValue).toBe("hello");
    });

    it("adds event listeners", () => {
        let count = 0;
        const clickHandler = (e) => {
            // console.log(e.target);
            count++;
        };
        const element = {
            type: "button",
            props: { onClick: clickHandler, children: [] },
        };
        const dom = createNode(element);
        dom.click();
        expect(count).toBe(1);
    });

    it("adds correct style attribute", () => {
        const element = {
            type: "div",
            props: {
                style: {
                    color: "red",
                    fontSize: null,
                    hover: { color: "blue" },
                },
                children: [],
            },
        };
        const dom = createNode(element);
        console.log(dom.style.hover);
        expect(dom.style.color).toBe("red");
        expect(dom.style.fontSize).toBe("");
        expect(dom.style.hover).toBeUndefined();
    });
    it("updates attribute with signal changes", async () => {
        const signal = createSignal<boolean>(true);

        const element = {
            type: "div",
            props: {
                style: () =>
                    signal.value ? { color: "red" } : { color: "blue" },
                children: [],
            },
        };
        const dom = createNode(element);
        expect(dom.style.color).toBe("red");
        signal.value = false;
        await Promise.resolve();
        expect(dom.style.color).toBe("blue");
    });
});
