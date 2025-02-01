let currentFC = null;

export function setCurrentFC(fc) {
    currentFC = fc;
    currentFC.__signals = [];
}
export function clearCurrentFC() {
    currentFC = null;
}
export function getCurrentFC() {
    return currentFC;
}

export function cleanUp(fn: Function) {
    if (currentFC) {
        currentFC.__cleanup = fn;
    }
}
