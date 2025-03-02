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
Functional components rerender only once; after that, signals handle the DOM reconciliation process efficiently.

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
            <button onClick={() => count.value++}>Increment</button>
        </div>
    );
}

export default Counter;
```

### Effects

```jsx
import { createSignal, createEffect } from "refract-js";

function TimerComponent() {
    const seconds = createSignal(0);

    createEffect(() => {
        const interval = setInterval(() => {
            seconds.value++;
        }, 1000);

        // Cleanup function to clear the interval when the component unmounts
        return () => clearInterval(interval);
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
