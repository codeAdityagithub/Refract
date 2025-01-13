function createElement(type: any, props: object | null, ...children: any[]) {
    return {
        type,
        props: {
            ...props,
            children: children.map((child) => {
                if (typeof child === "object") {
                    return child;
                } else if (typeof child === "function") {
                    const sigval = child();
                    if (sigval instanceof Array) {
                        const signal = sigval[0];
                        if (signal instanceof Signal) {
                            return createSignalChild(signal, sigval[1]);
                        } else {
                            throw new Error(
                                "Other function that returns some array"
                            );
                        }
                    } else {
                        throw new Error(
                            `Invalid function return value, return value of type ${typeof sigval} cannot be a dom node`
                        );
                    }
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

function createSignalChild(
    signal: Signal,
    returnFunction: (signalValue: any) => string
) {
    return {
        type: "SIGNAL_CHILD",
        signal,
        renderFunction: returnFunction,
        props: {
            children: [],
        },
    };
}
let scheduled = false;
const batch = new Set<Function>();

function batchUpdate(cb: Function) {
    batch.add(cb);
    if (!scheduled) {
        scheduled = true;
        queueMicrotask(() => {
            // console.log("Current batch has: ", batch.size, " Functions");
            batch.forEach((fn) => fn());
            batch.clear();
            scheduled = false;
        });
    }
}

class Signal {
    private val: any;
    private deps: Set<Function>;
    private rerenderFunctions: Map<any, any>;

    constructor(val: any) {
        this.val = val;
        this.deps = new Set();
        this.rerenderFunctions = new Map();
    }

    get value() {
        return this.val;
    }
    set value(val) {
        if (val === this.val) return;
        this.val = val;
        console.log("updating state");
        console.log(this.deps.size);
        this.deps.forEach((dep) => batchUpdate(() => dep(val)));
    }

    public subscribe(fn: (value: any) => any) {
        this.deps.add(fn);
        // initial call
        let val = this.val;
        fn(val);
    }
    public rerender(element, container) {}
    public clearDeps() {
        this.deps.clear();
    }
    public component(fn: (cur: any) => any) {
        const component = function () {
            return [this, fn];
        };
        return component.bind(this);
    }
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
    const reactiveChild = element.props.children.find(
        (c) => c.type === "SIGNAL_CHILD"
    );

    if (!reactiveChild) {
        element.props.children.forEach((child) => {
            render(child, dom);
        });
    } else {
        reactiveChild.signal.subscribe((val) => {
            if (dom) dom.innerHTML = "";
            element.props.children.forEach((child) => {
                if (child.type !== "SIGNAL_CHILD") render(child, dom);
                else render(createTextChildren(child.renderFunction(val)), dom);
            });
        });
        // return;
    }
    container.appendChild(dom);
}

const App = (props: any) => {
    const count = createSignal(1);
    return (
        <div>
            <h1>hello {count.component((c) => c)}</h1>
            <button
                onClick={() => {
                    count.value += 1;
                }}
            >
                Increment
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
