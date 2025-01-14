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

function batchUpdate(cb: Function) {
    batch.add(cb);
    if (!scheduled) {
        scheduled = true;
        queueMicrotask(() => {
            // console.log("Current batch has: ", batch.size, " Functions");
            batch.forEach((fn) => {
                const dep = fn();
                if (functionMap.has(dep)) {
                    functionMap.get(dep)();
                }
            });
            batch.clear();
            scheduled = false;
        });
    }
}

let currentEffect: any = null;

function reactive(fn: Function) {
    currentEffect = fn;
    const retVal = fn();
    if (!isPrimitive(retVal))
        throw new Error(
            "Reactive value must be primitive, got: " + typeof retVal
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
    protected val: any;
    protected deps: Set<Function>;

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
        this.deps.forEach((dep) =>
            batchUpdate(() => {
                dep();
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

    private notify() {
        this.deps.forEach((dep) =>
            batchUpdate(() => {
                dep();
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
                        this.notify();
                        return result;
                    };
                }
                return val;
            },
            set: (target, prop, value) => {
                // console.log(target, prop, value);
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

    private notify() {
        this.deps.forEach((dep) =>
            batchUpdate(() => {
                dep();
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

function render(element: any, container: HTMLElement, toReturn?: boolean) {
    if (element instanceof Signal) {
        throw new Error("Signal cannot be a dom node");
    }
    if (typeof element.type === "function") {
        const component = element.type(element.props);

        if (toReturn) return render(component, container, true);

        render(component, container);
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
    container.appendChild(dom);
    if (toReturn) return dom;
}

function renderAllChild(element: any, dom: HTMLElement) {
    element.props.children.forEach((child) => {
        if (child.type !== "SIGNAL_CHILD") render(child, dom);
        else {
            let value = child.renderFunction();
            if (!value) {
                value = String(value);
            }
            if (typeof value === "object" && typeof value.type !== "function") {
                if (!value.type || !value.props || !value.props?.children)
                    throw new Error("Object cannot be used as dom nodes.");

                let insertedNode = render(value, dom, true);

                functionMap.set(child.renderFunction, () => {
                    const newValue = child.renderFunction();
                    if (newValue.type !== value.type) {
                        dom.removeChild(insertedNode);
                        // console.log("tag removed");
                        insertedNode = render(newValue, dom, true);
                    } else {
                        updateNode(insertedNode, value.props, newValue.props);
                    }
                    value = newValue;
                });
            } else if (typeof value.type === "function") {
                let insertedNode = render(value, dom, true);

                functionMap.set(child.renderFunction, () => {
                    const newValue = child.renderFunction();
                    dom.removeChild(insertedNode);
                    insertedNode = render(newValue, dom, true);
                    value = newValue;
                });
            } else {
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
    prevProps: any,
    nextProps: any
) {
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
    // add new properties

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
        updateNode(
            child,
            prevProps.children[i].props,
            nextProps.children[i].props
        );
    });
}

export { createEffect, createSignal, reactive, render };
