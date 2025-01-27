let currentFC = null;

export function setCurrentFC(fc) {
    currentFC = fc;
}
export function clearCurrentFC() {
    currentFC = null;
}

export function cleanUp(fn: Function) {
    if (currentFC) {
        currentFC.__cleanup = fn;
    }
}
