export function createElement(
    type: any,
    props: object | null,
    ...children: any[]
) {
    if (type === "Fragment") {
        // return {
        //     type: "FRAGMENT",
        //     fragmentLength: children.length,
        //     props: {
        //         children: children.map((child) => {
        //             if (typeof child === "object") {
        //                 return child;
        //             } else if (typeof child === "function") {
        //                 return createSignalChild(child);
        //             } else {
        //                 return createTextChildren(child);
        //             }
        //         }),
        //     },
        // };
        return createChildren(children);
    }
    return {
        type,
        props: {
            ...props,
            children: createChildren(children),
        },
    };
}

function createChildren(children: any[]) {
    return children
        .map((child) => {
            if (typeof child === "object") {
                if (Array.isArray(child)) {
                    return createChildren(child);
                }
                return child;
            } else if (typeof child === "function") {
                return createSignalChild(child);
            } else {
                return createTextChildren(child);
            }
        })
        .flat();
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
    container: HTMLElement | DocumentFragment,
    append: boolean,
    toReturn?: boolean
) {
    if (element instanceof Signal) {
        throw new Error("Signal cannot be a dom node");
    }
    if (typeof element.type === "function") {
        const component = element.type(element.props);
        if (Array.isArray(component)) {
            const fragment = document.createDocumentFragment();

            component.forEach((el) => {
                render(el, fragment, true);
            });

            container.appendChild(fragment);

            if (toReturn) return container;
        } else {
            if (toReturn) return render(component, container, true, true);

            render(component, container, true);
            return;
        }
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
    element.props.children.forEach((child, childIndex) => {
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
                    console.log(newValue);
                    if (newValue.type !== value.type) {
                        const newNode = render(newValue, dom, false, true);
                        dom.replaceChild(newNode, insertedNode);
                        insertedNode = newNode;
                    } else {
                        console.log(newValue);
                        updateNode(insertedNode, value, newValue);
                    }
                    value = newValue;
                });
            } else if (isArray) {
                const fragment = document.createDocumentFragment();

                value.forEach((el) => {
                    render(el, fragment, true);
                });

                dom.appendChild(fragment);
                functionMap.set(child.renderFunction, () => {
                    const newArray = child.renderFunction();

                    if (newArray.length === value.length) {
                        newArray.forEach((el, i) => {
                            updateNode(dom.children[i], value[i], el);
                        });
                    } else {
                        const max = Math.max(newArray.length, value.length);
                        for (let i = 0; i < max; i++) {
                            updateNode(
                                dom.children[i + childIndex],
                                value[i],
                                newArray[i],
                                dom
                            );
                        }
                    }
                    value = newArray;
                });
                return;
            } else if (typeof value.type === "function") {
                // This is for reactive functional components

                // this can be parent for fragment returning fc
                const component = value.type(value.props);
                if (Array.isArray(component)) {
                    const fragment = document.createDocumentFragment();

                    component.forEach((el) => {
                        render(el, fragment, true);
                    });
                    dom.appendChild(fragment);
                } else {
                    let insertedNode = render(value, dom, true, true);

                    functionMap.set(child.renderFunction, () => {
                        const newValue = child.renderFunction();
                        if (newValue.type !== value.type) {
                            // dom.replaceChild(newNode, insertedNode);
                            const newNode = render(newValue, dom, false, true);
                            if (dom === insertedNode) {
                                console.log("Fragment");
                                // dom.innerHTML = "";
                                console.log(newNode);
                            } else {
                                dom.replaceChild(newNode, insertedNode);
                                insertedNode = newNode;
                            }
                        } else {
                            console.log("Fc changed");
                            console.log(insertedNode);
                            updateNode(
                                insertedNode,
                                value.type(value.props),
                                newValue.type(newValue.props)
                            );
                        }
                        value = newValue;
                    });
                }
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
    next: any,
    parent?: HTMLElement
) {
    const prevProps = prev?.props;
    const nextProps = next?.props;

    if (!prevProps) {
        if (node && node.parentElement) {
            // node.insertBefore(
            //     render(next, node.parentElement, false, true),
            //     node
            // );
            const toInsert = render(next, node.parentElement, false, true);
            node.parentElement.insertBefore(toInsert, node);
        } else if (parent) {
            render(next, parent, true);

            return;
        }
        return;
    } else if (node && !nextProps) {
        // console.log("extra node removed", node);
        node.remove();
        return;
    }

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
        }
    } else {
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
            const prevChild = prevProps.children[i];
            const nextChild = nextProps.children[i];
            if (prevChild && nextChild) updateNode(child, prevChild, nextChild);
        });
    }
}

export { createEffect, createSignal, reactive, render };
