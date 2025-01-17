let scheduled = false;
const batch = new Set<Function>();
const depset = new Set();
const reactiveFunctionsMap = new Map();

export function batchUpdate(cb: Function) {
    batch.add(cb);
    if (!scheduled) {
        scheduled = true;
        queueMicrotask(() => {
            // console.log("Current batch has: ", batch.size, " Functions");
            batch.forEach((fn) => {
                const dep = fn();
                if (depset.has(dep)) {
                    return;
                }
                depset.add(dep);

                // effects and reactive nodes
                dep();

                if (reactiveFunctionsMap.has(dep)) {
                    // for updating reactive nodes
                    reactiveFunctionsMap.get(dep)();
                }
            });
            depset.clear();
            batch.clear();
            scheduled = false;
        });
    }
}

export function setReactiveFunction(fn: Function, dep: Function) {
    reactiveFunctionsMap.set(dep, fn);
}

export function clearReactiveFunction(fn: Function) {
    reactiveFunctionsMap.delete(fn);
}
