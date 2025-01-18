export function isPlainObject(variable: any) {
    return (
        typeof variable === "object" && // Must be an object
        variable !== null && // Cannot be null
        !Array.isArray(variable) && // Cannot be an array
        Object.prototype.toString.call(variable) === "[object Object]" // Must be a plain object
    );
}
export function isPrimitive(val: any) {
    return (
        ["boolean", "string", "number", "undefined"].includes(typeof val) ||
        val === null
    );
}
