# Refract-js

## Overview

This is a lightweight JSX framework designed to provide a simple, efficient, and flexible way to build UI components without relying on heavy external libraries like React. It offers a minimalistic approach while maintaining the power of JSX syntax for defining UI components. It uses a minimal custom implementation of signals for faster UI updates.

## Features

-   **Lightweight**: No dependencies, making it fast and efficient.
-   **JSX Support**: Uses JSX for defining UI components.
-   **Component-Based**: Encourages reusable and modular UI development.
-   **Efficient Rendering**: Provides an optimized rendering mechanism.
-   **State Management**: Supports a simple and efficient state management system based on signals.

## Installation

To use this library, install it via npm:

```sh
npm install refract-js
```

Or with yarn:

```sh
yarn add refract-js
```

## Usage

### Creating a Component

```jsx
import { render } from "refract-js";

const App = () => {
    return (
        <div>
            <h1>Hello, World!</h1>
        </div>
    );
};

render(<App />, document.getElementById("root"));
```

### State Management

In Refract-js, functions serve as an intuitive way to create dynamic nodes.

> Functional components rerender only once;after that, signals handle the DOM reconciliation process efficiently.

You can use
`createSignal()`
to create signals and access the signal's value using `signal.value`

```jsx
import { createSignal } from "refract-js";

function Counter() {
    const count = createSignal(0);

    return (
        <div>
            {/* Functions for dynamic values that depend on signals */}
            <p>Count: {() => count.value}</p>

            {/* use the update function to update the count.value */}
            <button onClick={() => count.update((prevCount) => prevCount + 1)}>
                Increment
            </button>
        </div>
    );
}

export default Counter;
```

### Effects

Effects can be created using the `createEffect` function.

-   Effect runs after the components has been mounted to the dom.
-   You don't need to declare dependency array as dependencies are automatically tracked.
-   Effect re-runs whenever the signals used inside the effect are updated using the update function.
-   The cleanup function that is returned from the effect will run when the component unmounts or when the effect is rerun.

```jsx
import { createSignal, createEffect } from "refract-js";

function TimerComponent() {
    const seconds = createSignal(0);

    createEffect(() => {
        const interval = setInterval(() => {
            seconds.update((prev) => prev + 1);
        }, 1000);

        // Cleanup function to clear the interval when the component unmounts or the seconds.value is updated
        return () => clearInterval(interval);
    });

    createEffect(() => {
        // This effect only runs once after the component mounts.

        return () => {
            // this cleanup will only run when the component mounts
        };
    });

    return <p>Elapsed Time: {seconds} seconds</p>;
}
```

## API Reference

### `createElement(type, props, ...children)`

Creates a virtual DOM element.

### `render(element, container)`

Renders a JSX component to the DOM.

### `useState(initialValue)`

A simple state management hook.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
