import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "../../rendering/render";
import * as rendering from "../../rendering/render";

vi.stubGlobal("requestIdleCallback", (cb) => {
    queueMicrotask(() => cb({ timeRemaining: () => 2 }));
});

// @ts-expect-error
const createFiber = rendering.createFiber;
// @ts-expect-error
const commitFiber = rendering.commitFiber;
// @ts-expect-error
const commitDeletion = rendering.commitDeletion;

describe("event handling", () => {
    // beforeEach(() => {
    //     document.body.innerHTML = "";
    // });

    it("should only register on* functions as handlers", () => {
        let click = vi.fn(() => {}),
            onclick = vi.fn(() => {});

        const fiber = (
            <div>
                <div
                    onclick={onclick}
                    click={click}
                />
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        fiber.props.children[0].dom.click();

        expect(onclick).toHaveBeenCalledTimes(1);
        expect(click).toHaveBeenCalledTimes(1);
    });

    it("should only register truthy values as handlers", () => {
        const fooHandler = vi.fn();
        const falsyHandler = false;

        const fiber = (
            <div>
                <div
                    onClick={falsyHandler}
                    onOtherClick={fooHandler}
                />
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);

        expect(fooHandler).not.toHaveBeenCalled();
        expect(fiber.props.children[0].dom.hasAttribute("onclick")).toBe(false);
    });

    it("should support native event names", () => {
        let click = vi.fn(),
            mousedown = vi.fn();

        const fiber = (
            <div>
                <div
                    onclick={click}
                    onmousedown={mousedown}
                />
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        fiber.props.children[0].dom.click();
        const event = new MouseEvent("mousedown");
        fiber.props.children[0].dom.dispatchEvent(event);
        expect(click).toHaveBeenCalledExactlyOnceWith(new MouseEvent("click"));
        expect(mousedown).toHaveBeenCalledTimes(1);
    });

    it("should remove event handlers", () => {
        let click = vi.fn(),
            mousedown = vi.fn();

        const fiber = (
            <div>
                <div
                    onclick={click}
                    onmousedown={mousedown}
                />
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        fiber.props.children[0].dom.click();
        const event = new MouseEvent("mousedown");
        fiber.props.children[0].dom.dispatchEvent(event);

        expect(click).toHaveBeenCalledTimes(1);
        expect(mousedown).toHaveBeenCalledTimes(1);

        commitDeletion(fiber);
        fiber.props.children[0].dom.click();
        const newEv = new MouseEvent("mousedown");
        fiber.props.children[0].dom.dispatchEvent(newEv);

        expect(click).toHaveBeenCalledTimes(1);
        expect(mousedown).toHaveBeenCalledTimes(1);
    });

    it("should register events not appearing on dom nodes", () => {
        let onAnimationEnd = vi.fn(() => {});

        const fiber = (
            <div>
                <div onanimationend={onAnimationEnd} />
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        const testEvent = new Event("animationend");
        fiber.props.children[0].dom.dispatchEvent(testEvent);

        expect(onAnimationEnd).toHaveBeenCalledTimes(1);
    });

    // Skip test if browser doesn't support passive events
    it("should use capturing for event props ending with *Capture", () => {
        let click = vi.fn();

        const fiber = (
            <div>
                <div onClickCapture={click}>
                    <button type="button">Click me</button>
                </div>
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);

        let btn = fiber.props.children[0].props.children[0].dom;
        btn.click();

        expect(click).toHaveBeenCalledOnce(); // capturing
    });

    it("should support both capturing and non-capturing events on the same element", () => {
        let click = vi.fn(),
            clickCapture = vi.fn();

        const fiber = (
            <div>
                <div
                    onClick={click}
                    onClickCapture={clickCapture}
                >
                    <button />
                </div>
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);
        fiber.props.children[0].dom.children[0].click();

        expect(click, "click").toHaveBeenCalledTimes(1);
        expect(clickCapture, "click").toHaveBeenCalledTimes(1);
    });

    // Uniquely named in that the base event names end with 'Capture'
    it("should support (got|lost)PointerCapture events", () => {
        let gotPointerCapture = vi.fn(),
            gotPointerCaptureCapture = vi.fn(),
            lostPointerCapture = vi.fn(),
            lostPointerCaptureCapture = vi.fn();

        const fiber = (
            <div>
                <div
                    onGotPointerCapture={gotPointerCapture}
                    onLostPointerCapture={lostPointerCapture}
                />
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);

        const fiber2 = (
            <div>
                <div
                    onGotPointerCaptureCapture={gotPointerCaptureCapture}
                    onLostPointerCaptureCapture={lostPointerCaptureCapture}
                />
            </div>
        );

        createFiber(fiber2);
        commitFiber(fiber2);

        fiber.props.children[0].dom.dispatchEvent(
            new Event("gotpointercapture")
        );
        fiber2.props.children[0].dom.dispatchEvent(
            new Event("gotpointercapture")
        );

        expect(gotPointerCapture).toHaveBeenCalledTimes(1);
        expect(gotPointerCaptureCapture).toHaveBeenCalledTimes(1);

        fiber.props.children[0].dom.dispatchEvent(
            new Event("lostpointercapture")
        );
        fiber2.props.children[0].dom.dispatchEvent(
            new Event("lostpointercapture")
        );

        expect(lostPointerCapture).toHaveBeenCalledTimes(1);
        expect(lostPointerCaptureCapture).toHaveBeenCalledTimes(1);
    });

    it("should support camel-case focus event names", () => {
        const focusIn = vi.fn(),
            focusOut = vi.fn();
        const fiber = (
            <div>
                <div
                    onFocusIn={focusIn}
                    onFocusOut={focusOut}
                />
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);

        fiber.props.children[0].dom.dispatchEvent(new Event("focusin"));
        fiber.props.children[0].dom.dispatchEvent(new Event("focusout"));

        expect(focusIn).toHaveBeenCalledTimes(1);
        expect(focusOut).toHaveBeenCalledTimes(1);
    });
});
