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
git clone https://github.com/codeAdityagithub/refract-starter.git your-project-name
cd your-project-name
npm install
npm run dev
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

#### Syntax:

```jsx
const signal = createSignal(initialValue);

signal.value; // This is a readonly value that must be used if you want to make reactive nodes
signal.update(newValue); // update the value to a newValue
signal.update((prev) => {
    // mutate the previous value if it is a array or object.
    // or
    // return a new value if it is a primitive.
});
```

#### Note:

>

-   You cannot update signal values into different types ie., `You cannot update a array value to a object value or a primitive and vice-versa`.

-   Primitive Values includes the following: `String, Number, Boolean, undefined, null and Error`.
    -   These values can be updated into one another ie., `a number signal can be updated to any of the above types`.

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

### Computed Values

The built-in `computed` function creates a state that automatically updates whenever its dependent signals change.

> This behaves similarly to React's `useMemo` hook but doesn't require specifying a dependency array.

```jsx
import { createSignal, computed } from "refract-js";

function Counter() {
    const count = createSignal(0);
    const double = computed(() => count.value * 2);

    return (
        <div>
            {/* Functions for dynamically accessing signal-based values */}
            <p>Count: {() => count.value}</p>
            <p>Double: {() => double.value}</p>

            {/* Use the update function to modify count.value */}
            <button onClick={() => count.update((prev) => prev + 1)}>
                Increment
            </button>
        </div>
    );
}

export default Counter;
```

### Effects

Effects can be created using the `createEffect` function.

-   An effect runs after the component has mounted to the DOM.
-   You don't need to specify a dependency array—dependencies are automatically tracked.
-   The effect re-runs whenever the signals used inside it are updated via the `update` function.
-   If the effect returns a cleanup function, it runs when the component unmounts or before the effect re-runs.

```jsx
import { createSignal, createEffect } from "refract-js";

function TimerComponent() {
    const seconds = createSignal(0);

    createEffect(() => {
        const interval = setInterval(() => {
            seconds.update((prev) => prev + 1);
        }, 1000);

        // Cleanup function to clear the interval when the component unmounts or the effect re-runs
        return () => clearInterval(interval);
    });

    createEffect(() => {
        // This effect runs once after the component mounts.

        return () => {
            // Cleanup runs only when the component unmounts
        };
    });

    return <p>Elapsed Time: {() => seconds.value} seconds</p>;
}
```

### Cleanup in Functional Components

The built-in `cleanUp` function allows you to define cleanup logic for any functional component.  
Since functional components only render once, any logic can be written inline for better clarity.

```jsx
import { createSignal, cleanUp } from "refract-js";

function AlternateTimerComponent() {
    const seconds = createSignal(0);

    // Since the component renders once, logic can be written synchronously
    const interval = setInterval(() => {
        seconds.update((prev) => prev + 1);
    }, 1000);

    // Cleanup function to clear the interval when the component unmounts
    cleanUp(() => {
        clearInterval(interval);
    });

    return <p>Elapsed Time: {() => seconds.value} seconds</p>;
}
```

### Ref's for dom elements

Use the `createRef` function to create references to dom elements.

-   The `ref.current` is null until the component has rendered.
-   `ref.current` property is defined when inside a effect or inside any event listener.

```jsx
import { createEffect, createRef } from "refract-js";

export default function Form() {
    const inputRef = createRef();

    createEffect(() => {
        console.log(inputRef.current); // it is defined here
    });

    function handleClick() {
        inputRef.current.focus(); // is is defined here
    }

    console.log(inputRef.current); // prints null to the console

    return (
        <>
            <input ref={inputRef} />
            <button onClick={handleClick}>Focus the input</button>
        </>
    );
}
```

### Handling Asynchronous Tasks

The `createPromise` function allows handling promises and asynchronous tasks with ease.

#### Syntax:

```jsx
type Data = {
    // typedata
}
const getData = async () => {
    const data = await fetch(...)

    return data as Data;
};

const promise = createPromise(getData);

promise.data;    // Data  | null

promise.error;   // Error | null

promise.status;  // "pending" || "resolved" || "rejected"
```

#### Example:

```jsx
import { createPromise } from "refract-js";

const getUser = async () => {
    try {
        const response = await axios.get("https://jsonplaceholder.typicode.com/users/1");
        return response.data.username;
    } catch (err) {
        throw new Error("Cannot fetch User. Error: " + (err as Error).message);
    }
};
const Users = () => {
    const promise = createPromise(getUser);

    return (
        <div>
            {() => {
                if (promise.value.data) {
                    return <div>{promise.value.data}</div>;
                }
                if (promise.value.error) {
                    return <div>{promise.value.error.message}</div>;
                }
                return <div>Loading...</div>;
            }}
        </div>
    );
};

export default Users;
```

### Lazy Loading Components

You can use the built-in `lazy` function to load components only when they are needed. This improves initial load times and enables a smoother user experience by displaying a pending UI while the component loads.

> Note: Lazy loading only works for loading functional components.
> Important Points:

-   The `lazy` function returns another functional component that wraps your imported component.
-   The new component has two extra props `errorFallback` and `fallback`.
    -   `fallback` takes another component or jsx as a fallback UI while the component loads.
    -   `errorFallback` takes a fallback component or a function with the error as argument ie.,

```jsx
 errorFallback = {(error)=><div>{error.message}</div>}
```

Example:

```jsx
import { lazy } from "refract-js";

const Component = lazy(() => import("./Component.tsx"));

const App = ()=>{

    return (

        <div>
            <Component otherProps = {...} fallback = {<div>Loading...</div>} errorFallback = {(error)=><div>{error.message}</div>} />
        </div>
    )
}

```

### Context/Global State

Refract doesn’t come with a built-in way to create context or global state—but who needs that when you can just toss your signals into a separate file and import them wherever you want? It works exactly as expected. It’s just JavaScript, so why overcomplicate things? 🤷‍♂️

## API Reference

### `createElement(type, props, ...children)`

Creates a virtual DOM element. This function is used internally by JSX to convert JSX syntax into virtual DOM representations.

### `render(element, container)`

Renders a JSX component to the DOM. It takes a JSX element and a container DOM node as parameters.

### `createSignal(initialValue)`

Creates a signal for state management.

-   **Properties:**
    -   `value`: A read-only reactive value.
-   **Methods:**
    -   `update(newValue | updater)`: Updates the signal's value.

### `computed(computation)`

Creates a computed value that automatically updates when its dependent signals change.

-   **Parameter:**
    -   `computation`: A function that returns a computed value based on one or more signals.

### `createEffect(effect)`

Creates an effect that runs after the component has mounted and whenever its dependent signals update.

-   **Parameter:**
    -   `effect`: A function that can optionally return a cleanup function.

### `cleanUp(cleanupFn)`

Registers a cleanup function to be executed when the component unmounts.

-   **Parameter:**
    -   `cleanupFn`: A function that performs cleanup operations.

### `createRef()`

Creates a reference object for DOM elements.

-   **Property:**
    -   `current`: Initially `null`, then set to the DOM element once rendered.

### `createPromise(asyncFunction)`

Wraps an asynchronous function into a promise handler that tracks its state.

-   **Returns:**
    -   A read-only signal with properties:
        -   `data`: The resolved data or `null`.
        -   `error`: The error object or `null`.
        -   `status`: `"pending"`, `"resolved"`, or `"rejected"`.

### `lazy(loader)`

Lazily loads a functional component.

-   **Parameter:**
    -   `loader`: A function that returns a promise resolving to a module with a default export (the component).
-   **Additional Props on the Lazy Component:**
    -   `fallback`: JSX to render while loading.
    -   `errorFallback`: A fallback UI or function to render if an error occurs.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
