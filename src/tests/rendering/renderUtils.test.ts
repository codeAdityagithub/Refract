import { describe, expect, it } from "vitest";
import * as rendering from "../../rendering/render";
import { createSignal } from "../../signals/signal";

const deepCompareFibers = rendering.deepCompareFibers;
const deepEqual = rendering.deepEqual;

describe("deepCompareFibers", () => {
    it("identical references should return true", () => {
        const fiber = { type: "div", props: { key: "1", className: "test" } };
        expect(deepCompareFibers(fiber, fiber)).toBe(true);
    });

    it("different types should return false", () => {
        const fiberA = { type: "div", props: { key: "1" } };
        const fiberB = { type: "span", props: { key: "1" } };
        expect(deepCompareFibers(fiberA, fiberB)).toBe(false);
    });

    it("different keys should return false", () => {
        const fiberA = { type: "div", props: { key: "1" } };
        const fiberB = { type: "div", props: { key: "2" } };
        expect(deepCompareFibers(fiberA, fiberB)).toBe(false);
    });

    it("identical props should return true", () => {
        const fiberA = { type: "div", props: { key: "1", className: "test" } };
        const fiberB = { type: "div", props: { key: "1", className: "test" } };
        expect(deepCompareFibers(fiberA, fiberB)).toBe(true);
    });
});

describe("deepEqual", () => {
    it("identical primitives should return true", () => {
        expect(deepEqual(1, 1)).toBe(true);
        expect(deepEqual("hello", "hello")).toBe(true);
        expect(deepEqual(null, null)).toBe(true);
    });

    it("different primitives should return false", () => {
        expect(deepEqual(1, 2)).toBe(false);
        expect(deepEqual("hello", "world")).toBe(false);
        expect(deepEqual(null, undefined)).toBe(false);
    });

    it("identical objects should return true", () => {
        const objA = { a: 1, b: 2 };
        const objB = { a: 1, b: 2 };
        expect(deepEqual(objA, objB)).toBe(true);
    });

    it("different objects should return false", () => {
        const objA = { a: 1, b: 2 };
        const objB = { a: 1, b: 3 };
        expect(deepEqual(objA, objB)).toBe(false);
    });

    it("arrays should be deeply compared", () => {
        expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
        expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
        expect(deepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true);
    });

    it("objects with different key counts should return false", () => {
        expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it("BaseSignal instances should be deeply compared", () => {
        const signalA = createSignal(5);
        const signalB = createSignal(5);
        expect(deepEqual(signalA, signalB)).toBe(true);

        const signalC = createSignal(10);
        expect(deepEqual(signalA, signalC)).toBe(false);
    });

    it("children key should be ignored", () => {
        const objA = { a: 1, children: ["test"] };
        const objB = { a: 1, children: ["changed"] };
        expect(deepEqual(objA, objB)).toBe(true);
    });
});
