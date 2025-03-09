import { vi, describe, it, expect } from "vitest";
import * as rendering from "../../rendering/render";
import { createSignal } from "../../signals/signal";

vi.stubGlobal("requestIdleCallback", (cb) => {
    queueMicrotask(() => cb({ timeRemaining: () => 2 }));
});

// @ts-expect-error
const createFiber = rendering.createFiber;
// @ts-expect-error
const commitFiber = rendering.commitFiber;

describe("mathml", () => {
    it("should render with the correct namespace URI", () => {
        const fiber = (
            <div>
                <math />
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);
        let namespace = fiber.dom.querySelector("math").namespaceURI;

        expect(namespace).to.equal("http://www.w3.org/1998/Math/MathML");
    });

    it("should render children with the correct namespace URI", () => {
        const fiber = (
            <div>
                <math>
                    <mrow />
                </math>
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);
        let namespace = fiber.dom.querySelector("mrow").namespaceURI;

        expect(namespace).to.equal("http://www.w3.org/1998/Math/MathML");
    });

    it("should inherit correct namespace URI from parent", () => {
        const fiber = (
            <div>
                <math>
                    <mrow />
                </math>
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);

        let namespace = fiber.dom.querySelector("mrow").namespaceURI;
        expect(namespace).to.equal("http://www.w3.org/1998/Math/MathML");
    });

    it("should inherit correct namespace URI from parent upon updating", async () => {
        const show = createSignal<boolean>(true);

        const App = () => {
            return <>{() => (show.value ? <mi>1</mi> : <mo>2</mo>)}</>;
        };

        const fiber = (
            <div>
                <math>
                    <App />
                </math>
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);

        let namespace = fiber.dom.querySelector("mi").namespaceURI;
        expect(namespace).to.equal("http://www.w3.org/1998/Math/MathML");

        show.update((prev) => !prev);

        await Promise.resolve();
        namespace = null;

        namespace = fiber.dom.querySelector("mo").namespaceURI;
        expect(namespace).to.equal("http://www.w3.org/1998/Math/MathML");
    });

    it("should transition from DOM to MathML and back", () => {
        const fiber = (
            <div>
                <math>
                    <msup>
                        <mi>c</mi>
                        <mn>2</mn>
                    </msup>
                </math>
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);

        expect(fiber.dom).to.be.an("HTMLDivElement");
        const mathFiber = fiber.props.children[0];
        expect(mathFiber.type).toEqual("math");
        expect(mathFiber.dom.namespaceURI).toEqual(
            "http://www.w3.org/1998/Math/MathML"
        );
        expect(mathFiber.dom).toBeInstanceOf(Element);
    });
});
