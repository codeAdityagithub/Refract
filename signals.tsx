function createElement(type: any, props: object | null, ...children: any[]) {
    return {
        type,
        props: {
            ...props,
            children: children.map((child) => {
                if (typeof child === "object" || typeof child === "function") {
                    // console.log({ child });
                    return child;
                }
                return createTextChildren(child);
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
        // if (val === this.val) return;
        this.val = val;
        this.deps.forEach((dep) => batchUpdate(() => dep(val)));
    }

    public subscribe(fn: (value: any) => any) {
        this.deps.add(fn);
        // initial call
        console.log(this.deps.size);
        // let val = this.val;
        // fn(val);
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
    element.props.children.forEach((child) => {
        if (typeof child === "function") {
            // register that function and its container in the signal
            const sigval = child();
            if (sigval instanceof Array) {
                const signal = sigval[0];
                if (signal instanceof Signal) {
                    render(createTextChildren(sigval[1](signal.value)), dom);
                    signal.subscribe((val) => {
                        console.log("changed", val);
                        container.removeChild(dom);
                        // container
                        render(element, container);
                    });
                } else {
                    console.log("Other function that returns some array");
                }
            } else {
                throw new Error(
                    `Invalid function return value, return value of type ${typeof sigval} cannot be a dom node`
                );
            }
        } else {
            render(child, dom);
        }
    });
    container.appendChild(dom);
}

const App = (props: any) => {
    const name = createSignal("world");
    return (
        <div>
            <h1>hello {name.component((name) => name)}</h1>
            <button
                onClick={() => {
                    name.value = "hello";
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
