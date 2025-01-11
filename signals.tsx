function createElement(type: any, props: object | null, ...children: any[]) {
    return {
        type,
        props: {
            ...props,
            children: children.map((child) => {
                if (typeof child === "object") return child;

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

    constructor(val: any) {
        this.val = val;
        this.deps = new Set();
    }

    get value() {
        return this.val;
    }
    set value(val) {
        if (val === this.val) return;
        this.val = val;
        this.deps.forEach((dep) => batchUpdate(() => dep(val)));
    }

    public subscribe(fn: (value: any) => any) {
        this.deps.add(fn);
        // initial call
        let val = this.val;
        fn(val);
    }
    public clearDeps() {
        this.deps.clear();
    }
}

function signal(val: any) {
    return new Signal(val);
}
for (let i = 0; i < 10; i++) {
    const count = signal(i);

    count.subscribe((value) => {
        console.log("Called", value);
    });
    count.value = i + 1;
}

// temp.value = 2;
// count.value = 2;

// const App = (props: any, signal: any) => {
//     // const [count, setCount] = signal.New(0);
//     const name = "world";
//     return (
//         <div>
//             <h1>hello {name}</h1>
//             <button
//                 onClick={() => {
//                     console.log("first");
//                 }}
//             >
//                 Increment
//             </button>
//         </div>
//     );
// };

// App({}, {});
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
