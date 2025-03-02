export default function NonReactiveComponent() {
    const items = ["Item 1", "Item 2", "Item 3"];
    const showText = true;

    return (
        <>
            hello
            <div>
                {/* Static content */}
                <h1>Non-Reactive JSX</h1>

                {/* Conditional rendering */}
                {showText && <p>This text is conditionally rendered.</p>}

                {/* Lists */}
                <ul>
                    {items.map((item, index) => (
                        <li>{item}</li>
                    ))}
                </ul>

                {/* Inline styling */}
                {/* TODO: Add inline styling support */}
                <div style="color: blue; font-size: 20px">Styled text</div>

                {/* Event handlers */}
                <button onClick={() => alert("Clicked!")}>Click Me</button>

                {/* Fragments */}
                <>
                    <span>Fragment part 1</span>
                    <span>
                        <>Fragment part 2</>
                    </span>
                </>

                {/* Nested elements */}
                <div>
                    <h2>Nested Elements</h2>
                    <p>Inside a parent container.</p>
                </div>

                {/* Attributes */}
                <img
                    src="https://via.placeholder.com/150"
                    alt="Placeholder"
                />
            </div>
        </>
    );
}
