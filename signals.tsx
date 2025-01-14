function createElement(type: any, props: object | null, ...children: any[]) {
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
        if (val === this.val) return;
        this.val = val;
        // console.log("updating state");
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

function createEffect(fn: () => any) {
    fn();
    return fn;
}

function createSignal(val: any) {
    // console.log(this);
    return new Signal(val);
}

function render(element: any, container: HTMLElement) {
    if (element instanceof Signal) {
        throw new Error("Signal cannot be a dom node");
    }

    if (typeof element.type === "function") {
        const component = element.type(element.props);
        render(component, container);
        return;
    }
    const dom =
        element.type == "TEXT_CHILD"
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
}

function renderAllChild(element: any, dom: any) {
    element.props.children.forEach((child) => {
        if (child.type !== "SIGNAL_CHILD") render(child, dom);
        else {
            // render(createTextChildren(child.renderFunction()), dom);
            const prevNode = document.createTextNode(child.renderFunction());
            dom.appendChild(prevNode);
            functionMap.set(child.renderFunction, () => {
                prevNode.nodeValue = child.renderFunction();
            });
        }
    });
}

const App = (props: any) => {
    const count = createSignal(1);
    const count2 = createSignal(1);

    return (
        <div>
            <h1>
                hello
                {computed(() => count.value)}
            </h1>
            <h1>
                world
                {computed(() => count2.value)}
            </h1>
            <h1>sum {computed(() => count.value + count2.value)}</h1>
            <button
                onClick={() => {
                    count.value += 1;
                }}
            >
                Increment
            </button>
            <button
                onClick={() => {
                    count2.value -= 1;
                }}
            >
                decrement
            </button>
        </div>
    );
};

render(<App />, document.getElementById("root")!);
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
