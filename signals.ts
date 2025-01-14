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

function computed(fn: Function) {
    currentEffect = fn;
    fn();
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
        console.log("updating state");
        if (val === this.val) return;
        this.val = val;
        // console.log(this.deps.size);
        this.deps.forEach((dep) =>
            batchUpdate(() => {
                dep(val);
                return dep;
            })
        );
    }

    // public subscribe(fn: (value: any) => any) {
    //     this.deps.add(fn);
    //     // initial call
    //     let val = this.val;
    //     fn(val);
    // }
    public clearDeps() {
        this.deps.clear();
    }
    // public component(fn: (cur: any) => any) {
    //     const component = function () {
    //         return [this, fn];
    //     };
    //     return component.bind(this);
    // }
}

function createSignal(val: any) {
    // console.log(this);
    return new Signal(val);
}

function render(element: any, container: HTMLElement, toReturn?: boolean) {
    if (element instanceof Signal) {
        throw new Error("Signal cannot be a dom node");
    }
    // console.log(element.type === "SIGNAL_CHILD");
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
            // console.log(value);
            if (typeof value === "object" && typeof value.type !== "function") {
                let insertedNode = render(value, dom, true);
                functionMap.set(child.renderFunction, () => {
                    const newValue = child.renderFunction();
                    if (newValue.type !== value.type) {
                        dom.removeChild(insertedNode);
                        console.log("tag removed");
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

export { computed, createEffect, createSignal, render };

/*
 Ideal implementation:
                    this signal is like either a default or can be a parent signal
                        |
                        v
 const App = (props, signal)=>{

    const [count, setCount] = signal.New(0);

    return (
        <div>
            <h1>{count}</h1>
            <button onClick={()=>setCount(count+1)}>Increment</button>
        </div>
    )
 }
*/
