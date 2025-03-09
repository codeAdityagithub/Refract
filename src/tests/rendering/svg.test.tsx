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

function sortAttributes(html) {
    return html.replace(
        /<([a-z0-9-]+)((?:\s[a-z0-9:_.-]+=".*?")+)((?:\s*\/)?>)/gi,
        (s, pre, attrs, after) => {
            let list = attrs
                .match(/\s[a-z0-9:_.-]+=".*?"/gi)
                .sort((a, b) => (a > b ? 1 : -1));
            if (~after.indexOf("/")) after = "></" + pre + ">";
            return "<" + pre + list.join("") + after;
        }
    );
}

describe("svg", () => {
    // beforeEach(() => {
    //     document.body.innerHTML = "";
    // });
    it("should render SVG to string", () => {
        const fiber = (
            <div>
                <svg viewBox="0 0 360 360">
                    <path
                        stroke="white"
                        fill="black"
                        d="M 347.1 357.9 L 183.3 256.5 L 13 357.9 V 1.7 h 334.1 v 356.2 Z M 58.5 47.2 v 231.4 l 124.8 -74.1 l 118.3 72.8 V 47.2 H 58.5 Z"
                    />
                </svg>
            </div>
        );
        createFiber(fiber);
        commitFiber(fiber);

        let html = sortAttributes(
            String(fiber.dom.innerHTML).replace(
                ' xmlns="http://www.w3.org/2000/svg"',
                ""
            )
        );
        expect(html).to.equal(
            sortAttributes(
                `
			<svg viewBox="0 0 360 360">
				<path d="M 347.1 357.9 L 183.3 256.5 L 13 357.9 V 1.7 h 334.1 v 356.2 Z M 58.5 47.2 v 231.4 l 124.8 -74.1 l 118.3 72.8 V 47.2 H 58.5 Z" fill="black" stroke="white"></path>
			</svg>
		`.replace(/[\n\t]+/g, "")
            )
        );
    });

    it("should support svg xlink:href attribute", async () => {
        const div = document.createElement("div");
        rendering.render(
            createElement(
                "svg",
                {},
                createElement("use", { "xlink:href": "#foo" })
            ) as Fiber,
            div
        );
        await Promise.resolve();
        expect(div.innerHTML).to.contain(` href="#foo"`);
    });

    it("should support svg attributes", async () => {
        const div = document.createElement("div");
        const Demo = ({ url }: { url?: string }) => (
            <svg
                viewBox="0 0 360 360"
                xlinkHref={url}
            >
                <path
                    d="M 347.1 357.9 L 183.3 256.5 L 13 357.9 V 1.7 h 334.1 v 356.2 Z M 58.5 47.2 v 231.4 l 124.8 -74.1 l 118.3 72.8 V 47.2 H 58.5 Z"
                    fill="black"
                    stroke="white"
                />
            </svg>
        );
        rendering.render(<Demo url="www.preact.com" />, div);
        await Promise.resolve();

        let html = String(div.innerHTML).replace(
            ' xmlns="http://www.w3.org/2000/svg"',
            ""
        );
        html = sortAttributes(
            html.replace(' xmlns:xlink="http://www.w3.org/1999/xlink"', "")
        );
        expect(html).to.equal(
            sortAttributes(
                `
			<svg viewBox="0 0 360 360" href="www.preact.com">
				<path d="M 347.1 357.9 L 183.3 256.5 L 13 357.9 V 1.7 h 334.1 v 356.2 Z M 58.5 47.2 v 231.4 l 124.8 -74.1 l 118.3 72.8 V 47.2 H 58.5 Z" fill="black" stroke="white"></path>
			</svg>
		`.replace(/[\n\t]+/g, "")
            )
        );

        div.innerHTML = "";
        rendering.render(<Demo />, div);
        await Promise.resolve();

        html = String(div.innerHTML).replace(
            ' xmlns="http://www.w3.org/2000/svg"',
            ""
        );
        html = sortAttributes(
            html.replace(' xmlns:xlink="http://www.w3.org/1999/xlink"', "")
        );
        expect(html).to.equal(
            sortAttributes(
                `
			<svg viewBox="0 0 360 360">
				<path d="M 347.1 357.9 L 183.3 256.5 L 13 357.9 V 1.7 h 334.1 v 356.2 Z M 58.5 47.2 v 231.4 l 124.8 -74.1 l 118.3 72.8 V 47.2 H 58.5 Z" fill="black" stroke="white"></path>
			</svg>
		`.replace(/[\n\t]+/g, "")
            )
        );
    });

    it("should render SVG to DOM", async () => {
        const Demo = () => (
            <svg viewBox="0 0 360 360">
                <path
                    d="M 347.1 357.9 L 183.3 256.5 L 13 357.9 V 1.7 h 334.1 v 356.2 Z M 58.5 47.2 v 231.4 l 124.8 -74.1 l 118.3 72.8 V 47.2 H 58.5 Z"
                    fill="black"
                    stroke="white"
                />
            </svg>
        );
        rendering.render(<Demo />, document.body);
        await Promise.resolve();
        let html = sortAttributes(
            String(document.body.innerHTML).replace(
                ' xmlns="http://www.w3.org/2000/svg"',
                ""
            )
        );
        expect(html).to.equal(
            sortAttributes(
                '<svg viewBox="0 0 360 360"><path stroke="white" fill="black" d="M 347.1 357.9 L 183.3 256.5 L 13 357.9 V 1.7 h 334.1 v 356.2 Z M 58.5 47.2 v 231.4 l 124.8 -74.1 l 118.3 72.8 V 47.2 H 58.5 Z"></path></svg>'
            )
        );
    });

    it("should render with the correct namespace URI", () => {
        rendering.render(<svg />, document.body);

        let namespace = document.body.querySelector("svg")?.namespaceURI;

        expect(namespace).to.equal("http://www.w3.org/2000/svg");
    });

    it("should render children with the correct namespace URI", async () => {
        rendering.render(
            <svg>
                <text />
            </svg>,
            document.body
        );
        await Promise.resolve();
        let namespace = document.body.querySelector("text")?.namespaceURI;

        expect(namespace).to.equal("http://www.w3.org/2000/svg");
    });

    it("should inherit correct namespace URI from parent", () => {
        const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );
        document.body.appendChild(svg);

        rendering.render(<text />, document.body.firstChild as HTMLElement);

        let namespace = document.body.querySelector("text")?.namespaceURI;

        expect(namespace).to.equal("http://www.w3.org/2000/svg");
    });

    // it("should inherit correct namespace URI from parent upon updating", () => {

    //     const svg = document.createElementNS(
    //         "http://www.w3.org/2000/svg",
    //         "svg"
    //     );
    //     document.body.appendChild(svg);

    //     class App extends Component {
    //         state = { show: true };
    //         componentDidMount() {
    //             // eslint-disable-next-line
    //             this.setState({ show: false }, () => {
    //                 expect(
    //                     document.body.querySelector("circle")?.namespaceURI
    //                 ).to.equal("http://www.w3.org/2000/svg");
    //             });
    //         }
    //         rendering.render() {
    //             return this.state.show ? <text /> : <circle />;
    //         }
    //     }

    //     rendering.render(<App />, document.body.firstChild as HTMLElement);
    // });

    // it("should use attributes for className", () => {
    //     const Demo = ({ c }) => (
    //         <svg
    //             viewBox="0 0 360 360"
    //             {...(c ? { class: "foo_" + c } : {})}
    //         >
    //             <path
    //                 class={c && "bar_" + c}
    //                 stroke="white"
    //                 fill="black"
    //                 d="M347.1 357.9L183.3 256.5 13 357.9V1.7h334.1v356.2zM58.5 47.2v231.4l124.8-74.1 118.3 72.8V47.2H58.5z"
    //             />
    //         </svg>
    //     );
    //     rendering.render(<Demo c="1" />, document.body);
    //     let root = document.body.firstChild;
    //     sinon.spy(root, "removeAttribute");
    //     rendering.render(<Demo />, document.body);
    //     expect(root.removeAttribute).to.have.been.calledOnce.and.calledWith(
    //         "class"
    //     );

    //     root.removeAttribute.restore();

    //     rendering.render(<div />, document.body);
    //     rendering.render(<Demo />, document.body);
    //     root = document.body.firstChild;
    //     sinon.spy(root, "setAttribute");
    //     rendering.render(<Demo c="2" />, document.body);
    //     expect(root.setAttribute).to.have.been.calledOnce.and.calledWith(
    //         "class",
    //         "foo_2"
    //     );

    //     root.setAttribute.restore();
    // });

    // it("should still support class attribute", () => {
    //     rendering.render(
    //         <svg
    //             viewBox="0 0 1 1"
    //             class="foo bar"
    //         />,
    //         document.body
    //     );

    //     expect(document.body.innerHTML).to.contain(` class="foo bar"`);
    // });

    // it("should still support className attribute", () => {
    //     rendering.render(
    //         <svg
    //             viewBox="0 0 1 1"
    //             className="foo bar"
    //         />,
    //         document.body
    //     );

    //     expect(document.body.innerHTML).to.contain(` class="foo bar"`);
    // });

    // it("should switch back to HTML for <foreignObject>", () => {
    //     rendering.render(
    //         <svg>
    //             <g>
    //                 <foreignObject>
    //                     <a href="#foo">test</a>
    //                 </foreignObject>
    //             </g>
    //         </svg>,
    //         document.body
    //     );

    //     expect(document.body.getElementsByTagName("a"))
    //         .to.have.property("0")
    //         .that.is.a("HTMLAnchorElement");
    // });

    // it("should render foreignObject as an svg element", () => {
    //     rendering.render(
    //         <svg>
    //             <g>
    //                 <foreignObject>
    //                     <a href="#foo">test</a>
    //                 </foreignObject>
    //             </g>
    //         </svg>,
    //         document.body
    //     );

    //     expect(document.body.querySelector("foreignObject").localName).to.equal(
    //         "foreignObject"
    //     );
    // });

    // it("should transition from DOM to SVG and back", () => {
    //     rendering.render(
    //         <div>
    //             <svg
    //                 id="svg1923"
    //                 width="700"
    //                 xmlns="http://www.w3.org/2000/svg"
    //                 height="700"
    //             >
    //                 <circle
    //                     cy="333"
    //                     cx="333"
    //                     r="333"
    //                 />
    //                 <circle
    //                     cy="333"
    //                     cx="333"
    //                     r="333"
    //                     fill="#fede58"
    //                 />
    //             </svg>
    //         </div>,
    //         document.body
    //     );

    //     expect(document.body.firstChild).to.be.an("HTMLDivElement");
    //     expect(document.body.firstChild.firstChild).to.be.an("SVGSVGElement");
    // });
});
