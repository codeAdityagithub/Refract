export function createElement(
    type: any,
    props: object | null,
    ...children: any[]
) {
    if (type === "Fragment") {
        return {
            type: "FRAGMENT",
            props: {
                children,
            },
        };
    }
    return {
        type,
        props: {
            ...props,
            children: children.map((child) => {
                if (typeof child === "object") {
                    return child;
                } else if (typeof child === "function") {
                    return createSignalChild(child);
                } else {
                    return createTextChildren(child);
                }
            }),
        },
    };
}

function createTextChildren(text: string) {
    return {
        type: "TEXT_CHILD",
        props: {
            nodeValue: text,
            children: [],
        },
    };
}

function createSignalChild(returnFunction: (signalValue: any) => string) {
    return {
        type: "SIGNAL_CHILD",
        renderFunction: returnFunction,
        props: {
            children: [],
        },
    };
}
let scheduled = false;
const batch = new Set<Function>();
const functionMap = new Map();
const depset = new Set();

function batchUpdate(cb: Function) {
    batch.add(cb);
    if (!scheduled) {
        scheduled = true;
        queueMicrotask(() => {
            // console.log("Current batch has: ", batch.size, " Functions");
            batch.forEach((fn) => {
                const dep = fn();
                if (depset.has(dep)) {
                    // console.log("already called");
                    return;
                }
                depset.add(dep);
                dep();
                if (functionMap.has(dep)) {
                    // for rerendering
                    functionMap.get(dep)();
                }
            });
            depset.clear();
            batch.clear();
            scheduled = false;
        });
    }
}

let currentEffect: any = null;

function reactive(fn: Function) {
    if (typeof fn !== "function")
        throw new Error("reactive takes a render function as the argument");

    currentEffect = fn;
    const retVal = fn();

    if (
        !isPrimitive(retVal) &&
        !Array.isArray(retVal) &&
        typeof retVal !== "object" &&
        retVal &&
        typeof retVal.type !== "function"
    )
        throw new Error(
            "Reactive value must be primitive or functional component, got: " +
                typeof retVal
        );
    currentEffect = null;
    return fn;
}
function createEffect(fn: Function) {
    currentEffect = fn;
    fn();
    currentEffect = null;
}
class Signal {
    private val: any;
    private deps: Set<Function>;
    private isNotified: boolean = false;

    constructor(val: any) {
        this.val = val;
        this.deps = new Set();
    }

    get value() {
        if (currentEffect) {
            this.deps.add(currentEffect);
        }
        return this.val;
    }

    set value(val) {
        if (!isPrimitive(val)) return;

        if (val === this.val) return;
        this.val = val;

        this.notify();
    }
    private notify() {
        if (this.isNotified) return;
        this.isNotified = true;
        this.deps.forEach((dep) =>
            batchUpdate(() => {
                this.isNotified = false;
                return dep;
            })
        );
    }

    public clearDeps() {
        this.deps.clear();
    }
}

class ArraySignal {
    private _val: any;
    private deps: Set<Function>;
    private isNotified: boolean = false;

    private notify() {
        if (this.isNotified) return;
        this.isNotified = true;

        this.deps.forEach((dep) =>
            batchUpdate(() => {
                this.isNotified = false;
                return dep;
            })
        );
    }
    constructor(val: any) {
        if (typeof val !== "object")
            throw new Error(
                "Invalid type for Reference Signal; can be array or object only"
            );

        this.deps = new Set();

        if (Array.isArray(val)) {
            this.createNewProxy(val);
        } else {
            throw new Error(
                "Invalid type for Reference Signal; can be array only"
            );
        }
    }
    get value() {
        if (currentEffect) {
            this.deps.add(currentEffect);
        }

        return this._val;
    }
    set value(val) {
        if (val === this._val) return;
        if (Array.isArray(val)) {
            this.createNewProxy(val);
            this.notify();
        } else {
            throw new Error(
                "Invalid type for Reference Signal; can be array only"
            );
        }
    }
    private createNewProxy(val: any) {
        this._val = new Proxy(val, {
            get: (target, prop) => {
                const val = target[prop];
                // Return the method wrapped with notify logic
                if (typeof val === "function") {
                    return (...args: any[]) => {
                        const result = val.apply(target, args);

                        if (prop !== "map") this.notify();
                        return result;
                    };
                }
                return val;
            },
            set: (target, prop, value) => {
                target[prop as any] = value; // Update the array
                this.notify(); // Notify changes
                return true;
            },
        });
    }
}
class ObjectSignal {
    private _val: any;
    private deps: Set<Function>;
    private isNotified: boolean = false;

    private notify() {
        if (this.isNotified) return;
        this.isNotified = true;

        this.deps.forEach((dep) =>
            batchUpdate(() => {
                this.isNotified = false;
                return dep;
            })
        );
    }
    constructor(val: any) {
        if (!isPlainObject(val))
            throw new Error(
                "Invalid type for Reference Signal; can be object only"
            );

        this.deps = new Set();

        this.createNewProxy(val);
    }
    get value() {
        if (currentEffect) {
            this.deps.add(currentEffect);
        }
        return this._val;
    }
    set value(val) {
        if (!isPlainObject(val))
            throw new Error(
                "Invalid type for Reference Signal; can be object only"
            );
        if (val === this._val) return;

        this.createNewProxy(val);
        this.notify();
    }
    private createNewProxy(val: any) {
        this._val = new Proxy(val, {
            set: (target, prop, value) => {
                target[prop] = value; // Update the object
                this.notify(); // Notify changes
                return true;
            },
        });
    }
}

function createSignal(val: any) {
    if (typeof val === "function")
        throw new Error("Functions cannot be used as signal value");

    if (typeof val === "object" && val !== null) {
        if (Array.isArray(val)) return new ArraySignal(val);
        else if (Object.prototype.toString.call(val) === "[object Object]") {
            return new ObjectSignal(val);
        } else {
            throw new Error(
                "Invalid type for signal initialization: " + typeof val
            );
        }
    } else if (isPrimitive(val)) {
        return new Signal(val);
    } else {
        throw new Error(
            "Invalid type for signal initialization: " + typeof val
        );
    }
}
function isPlainObject(variable: any) {
    return (
        typeof variable === "object" && // Must be an object
        variable !== null && // Cannot be null
        !Array.isArray(variable) && // Cannot be an array
        Object.prototype.toString.call(variable) === "[object Object]" // Must be a plain object
    );
}
function isPrimitive(val: any) {
    return (
        ["boolean", "string", "number", "undefined"].includes(typeof val) ||
        val === null
    );
}

function render(
    element: any,
    container: HTMLElement,
    append: boolean,
    toReturn?: boolean
) {
    if (element instanceof Signal) {
        throw new Error("Signal cannot be a dom node");
    }
    if (typeof element.type === "function") {
        const component = element.type(element.props);

        if (toReturn) return render(component, container, true, true);

        render(component, container, true);
        return;
    }
    if (element.type === "FRAGMENT") {
        renderAllChild(element, container);
        return;
    }
    const dom =
        element.type === "TEXT_CHILD"
            ? document.createTextNode("")
            : document.createElement(element.type);

    const isProperty = (key) => key !== "children";

    Object.keys(element.props)
        .filter(isProperty)
        .forEach((name) => {
            if (name.startsWith("on")) {
                dom.addEventListener(
                    name.slice(2).toLowerCase(),
                    element.props[name]
                );
            } else {
                dom[name] = element.props[name];
            }
        });

    renderAllChild(element, dom);
    if (append) container.appendChild(dom);
    if (toReturn) return dom;
}

function renderAllChild(element: any, dom: HTMLElement) {
    element.props.children.forEach((child) => {
        if (child.type !== "SIGNAL_CHILD") render(child, dom, true);
        else {
            let value = child.renderFunction();
            if (!value) {
                value = String(value);
            }
            const isArray = Array.isArray(value);
            if (
                typeof value === "object" &&
                typeof value.type !== "function" &&
                !isArray
            ) {
                if (!value.type || !value.props || !value.props?.children)
                    throw new Error("Object cannot be used as dom nodes.");

                // this is for rendering other tags inside reactive state
                let insertedNode = render(value, dom, true, true);

                functionMap.set(child.renderFunction, () => {
                    const newValue = child.renderFunction();

                    if (newValue.type !== value.type) {
                        // dom.replaceChild(newNode, insertedNode);
                        const newNode = render(newValue, dom, false, true);
                        dom.replaceChild(newNode, insertedNode);
                        insertedNode = newNode;
                    } else {
                        updateNode(insertedNode, value, newValue);
                    }
                    value = newValue;
                });
            } else if (isArray) {
                // console.log("Array found", element);
                const prevInsertedNodes: any[] = [];

                value.forEach((el) => {
                    prevInsertedNodes.push(render(el, dom, true, true));
                });
                functionMap.set(child.renderFunction, () => {
                    const newArray = child.renderFunction();

                    console.log("rerender list");
                    if (newArray.length === prevInsertedNodes.length) {
                        newArray.forEach((el, i) => {
                            updateNode(
                                prevInsertedNodes[i],
                                value[i].props,
                                el.props
                            );
                        });
                        value = newArray;
                    } else {
                        console.log("to handle different length array");
                    }
                });
                return;
            } else if (typeof value.type === "function") {
                // This is for reactive functional components
                // TODO:this need to be checked for optimization
                // let insertedNode = render(value, dom, true);

                // functionMap.set(child.renderFunction, () => {
                //     const newValue = child.renderFunction();
                //     console.log(newValue.props, value.props);
                //     if (newValue.props !== value.props) {
                //         const newNode = render(newValue, dom, true);
                //         dom.replaceChild(newNode, insertedNode);
                //         insertedNode = newNode;
                //         console.log("different props");
                //     } else {
                //         console.log("same props");
                //         // updateNode(insertedNode, value.props, newValue.props);
                //     }
                //     value = newValue;
                // });
                console.log("Functional component found");
            } else {
                // simple reactive text nodes
                const prevNode = document.createTextNode(
                    child.renderFunction()
                );
                dom.appendChild(prevNode);

                functionMap.set(child.renderFunction, () => {
                    prevNode.nodeValue = child.renderFunction();
                });
            }
        }
    });
}

const isEvent = (key: string) => key.startsWith("on");
const isProperty = (key: string) => key !== "children" && !isEvent(key);
const isNew = (prev: any, next: any, key: string) => prev[key] !== next[key];
const isGone = (prev: any, next: any, key: string) => !(key in next);

function updateNode(
    node: HTMLElement | Text | ChildNode,
    prev: any,
    next: any
) {
    // console.log(prev, next);
    const prevProps = prev.props;
    const nextProps = next.props;

    // remove old properties and event listeners
    for (const prop of Object.keys(prevProps)) {
        if (isProperty(prop) && isGone(prevProps, nextProps, prop)) {
            node[prop] = "";
        } else if (
            isEvent(prop) &&
            (!(prop in nextProps) || isNew(prevProps, nextProps, prop))
        ) {
            const eventName = prop.toLowerCase().substring(2);

            node.removeEventListener(eventName, prevProps[prop]);
        }
    }

    if (prev.type !== next.type) {
        const parent = node.parentElement;
        if (parent) {
            const newNode = render(next, parent, false, true);
            parent.replaceChild(newNode, node);
            console.log("replacing the whole node", newNode, node);
        }
    } else {
        // add new properties
        console.log("updating just props", node);
        for (const prop of Object.keys(nextProps)) {
            if (isProperty(prop) && isNew(prevProps, nextProps, prop)) {
                node[prop] = nextProps[prop];
            } else if (isEvent(prop) && isNew(prevProps, nextProps, prop)) {
                const eventName = prop.toLowerCase().substring(2);

                node.addEventListener(eventName, nextProps[prop]);
            }
        }
        node.childNodes.forEach((child, i) => {
            // updateNode(child, );
            updateNode(child, prevProps.children[i], nextProps.children[i]);
        });
    }
}

export { createEffect, createSignal, reactive, render };
