import { describe, expect, it, vi } from "vitest";
import { render } from "../../rendering/render";
import { createSignal } from "../../signals/signal";

vi.stubGlobal("requestIdleCallback", (cb) => {
    queueMicrotask(() => cb({ timeRemaining: () => 2 }));
});

describe("Static Rendering Tests", () => {
    it("renders a basic element", async () => {
        const FC = () => <div>Hello, world!</div>;
        const root = document.createElement("div");
        render(<FC />, root);
        await Promise.resolve();

        expect(root.innerHTML).toBe("<div>Hello, world!</div>");
    });

    it("renders nested elements", async () => {
        const FC = () => (
            <div>
                <span>Nested</span>
                <p>Content</p>
            </div>
        );
        const root = document.createElement("div");
        render(<FC />, root);
        await Promise.resolve();

        expect(root.innerHTML).toBe(
            "<div><span>Nested</span><p>Content</p></div>"
        );
    });

    it("renders attributes correctly", async () => {
        const FC = () => (
            <input
                type="text"
                placeholder="Enter name"
            />
        );
        const root = document.createElement("div");
        render(<FC />, root);
        await Promise.resolve();

        const input = root.querySelector("input");
        expect(input).toBeTruthy();
        expect(input.type).toBe("text");
        expect(input.placeholder).toBe("Enter name");
    });

    it("renders classes correctly", async () => {
        const FC = () => <div className="box">Styled</div>;
        const root = document.createElement("div");
        render(<FC />, root);
        await Promise.resolve();

        expect(root.innerHTML).toBe('<div class="box">Styled</div>');
    });

    it("renders inline styles correctly", async () => {
        const FC = () => (
            <div style="color: red; font-size: 20px;">Styled Text</div>
        );
        const root = document.createElement("div");
        render(<FC />, root);
        await Promise.resolve();

        const div = root.querySelector("div");
        expect(div.style.color).toBe("red");
        expect(div.style.fontSize).toBe("20px");
    });

    it("renders self-closing elements", async () => {
        const FC = () => (
            <img
                src="logo.png"
                alt="Logo"
            />
        );
        const root = document.createElement("div");
        render(<FC />, root);
        await Promise.resolve();

        const img = root.querySelector("img");
        expect(img).toBeTruthy();
        expect(img.src).toContain("logo.png");
        expect(img.alt).toBe("Logo");
    });

    it("renders text content properly", async () => {
        const FC = () => <p>This is a test</p>;
        const root = document.createElement("div");
        render(<FC />, root);
        await Promise.resolve();

        expect(root.innerHTML).toBe("<p>This is a test</p>");
    });

    it("renders fragments correctly", async () => {
        const FC = () => (
            <>
                <h1>Title</h1>
                <p>Paragraph</p>
            </>
        );
        const root = document.createElement("div");
        render(<FC />, root);
        await Promise.resolve();

        expect(root.innerHTML).toBe("<h1>Title</h1><p>Paragraph</p>");
    });

    it("renders lists properly", async () => {
        const FC = () => (
            <ul>
                <li>Item 1</li>
                <li>Item 2</li>
                <li>Item 3</li>
            </ul>
        );
        const root = document.createElement("div");
        render(<FC />, root);
        await Promise.resolve();

        expect(root.innerHTML).toBe(
            "<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>"
        );
    });
    it("renders JSX with variables", async () => {
        const name = "John Doe";
        const age = 30;

        const FC = () => (
            <p>
                {name} is {age} years old.
            </p>
        );

        const root = document.createElement("div");
        render(<FC />, root);
        await Promise.resolve();

        expect(root.innerHTML).toBe("<p>John Doe is 30 years old.</p>");
    });
    it("renders a list using map()", async () => {
        const items = ["Apple", "Banana", "Cherry"];

        const FC = () => (
            <ul>
                {items.map((item) => (
                    <li>{item}</li>
                ))}
            </ul>
        );

        const root = document.createElement("div");
        render(<FC />, root);
        await Promise.resolve();
        expect(root.innerHTML).toBe(
            "<ul><li>Apple</li><li>Banana</li><li>Cherry</li></ul>"
        );
    });
    it("renders JSX with object properties", async () => {
        const user = { firstName: "Alice", lastName: "Johnson" };

        const FC = () => (
            <h1>
                {user.firstName} {user.lastName}
            </h1>
        );

        const root = document.createElement("div");
        render(<FC />, root);
        await Promise.resolve();

        expect(root.innerHTML).toBe("<h1>Alice Johnson</h1>");
    });
    it("renders a list of objects using map()", async () => {
        const users = [
            { id: 1, name: "Alice" },
            { id: 2, name: "Bob" },
            { id: 3, name: "Charlie" },
        ];

        const FC = () => (
            <ul>
                {users.map((user) => (
                    <li key={user.id}>{user.name}</li>
                ))}
            </ul>
        );

        const root = document.createElement("div");
        render(<FC />, root);
        await Promise.resolve();

        expect(root.innerHTML).toBe(
            "<ul><li>Alice</li><li>Bob</li><li>Charlie</li></ul>"
        );
    });
    it("renders nothing when list is empty", async () => {
        const items = [];

        const FC = () => (
            <ul>
                {items.map((item) => (
                    <li>{item}</li>
                ))}
            </ul>
        );

        const root = document.createElement("div");
        render(<FC />, root);
        await Promise.resolve();
        expect(root.innerHTML).toBe("<ul></ul>"); // Or expect no `<ul>` element
    });
    it("conditionally renders content based on a variable", async () => {
        const isLoggedIn = true;

        const FC = () => (
            <div>
                {isLoggedIn ? <p>Welcome, User!</p> : <p>Please log in</p>}
            </div>
        );

        const root = document.createElement("div");
        render(<FC />, root);
        await Promise.resolve();
        expect(root.innerHTML).toBe("<div><p>Welcome, User!</p></div>");
    });
    it("conditionally renders list items based on a condition", async () => {
        const items = [
            { name: "Apple", available: true },
            { name: "Banana", available: false },
            { name: "Cherry", available: true },
        ];

        const FC = () => (
            <ul>
                {items.map((item) =>
                    item.available ? <li>{item.name}</li> : null
                )}
            </ul>
        );

        const root = document.createElement("div");
        render(<FC />, root);
        await Promise.resolve();
        expect(root.innerHTML).toBe("<ul><li>Apple</li><li>Cherry</li></ul>");
    });
    it("renders list while safely handling null or undefined items", async () => {
        const items = ["Apple", null, "Cherry", undefined];

        const FC = () => (
            <ul>{items.map((item) => (item ? <li>{item}</li> : null))}</ul>
        );

        const root = document.createElement("div");
        render(<FC />, root);
        await Promise.resolve();
        expect(root.innerHTML).toBe("<ul><li>Apple</li><li>Cherry</li></ul>");
    });
    it("renders empty strings as empty list items", async () => {
        const items = ["Apple", "", "Cherry"];

        const FC = () => (
            <ul>{items.map((item) => (item ? <li>{item}</li> : null))}</ul>
        );

        const root = document.createElement("div");
        render(<FC />, root);
        await Promise.resolve();
        expect(root.innerHTML).toBe("<ul><li>Apple</li><li>Cherry</li></ul>");
    });
    it("renders based on complex conditions", async () => {
        const user = { isLoggedIn: true, role: "admin" };

        const FC = () => (
            <div>
                {user.isLoggedIn ? (
                    user.role === "admin" ? (
                        <h1>Admin Dashboard</h1>
                    ) : (
                        <h1>User Dashboard</h1>
                    )
                ) : (
                    <h1>Please log in</h1>
                )}
            </div>
        );

        const root = document.createElement("div");
        render(<FC />, root);
        await Promise.resolve();
        expect(root.innerHTML).toBe("<div><h1>Admin Dashboard</h1></div>");
    });
    it("renders nothing for an empty object", async () => {
        const user = {};

        const FC = () => (
            <div>
                {/* @ts-expect-error */}
                {user.firstName ? <p>{user.firstName}</p> : <p>No user data</p>}
            </div>
        );

        const root = document.createElement("div");
        render(<FC />, root);
        await Promise.resolve();

        expect(root.innerHTML).toBe("<div><p>No user data</p></div>");
    });
    it("renders a large list correctly", async () => {
        const totalChildren = 1000;
        const items = createSignal(
            Array.from({ length: totalChildren }, (_, i) => `Item ${i + 1}`)
        );

        const FC = () => (
            <ul>{() => items.value.map((item, index) => <li>{item}</li>)}</ul>
        );

        const root = document.createElement("div");

        const start = performance.now();

        render(<FC />, root);
        await Promise.resolve();

        const end = performance.now();
        const renderTime = end - start;

        console.log(`Render time for large list: ${renderTime}ms`);
        // @ts-expect-error
        expect(root.firstChild.children.length).toBe(totalChildren);

        const start2 = performance.now();
        items.value = Array.from(
            { length: totalChildren },
            (_, i) => `Item ${i + 1} updated`
        );
        await Promise.resolve();
        const end2 = performance.now();
        const renderTime2 = end2 - start2;

        console.log(`Rerender time for large list: ${renderTime2}ms`);
        // expect(renderTime).toBeLessThanOrEqual(100);
    });
});
