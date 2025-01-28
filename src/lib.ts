import { isPlainObject } from "./utils/general";

export function styleObjectToString(
    style: Record<string, string | number>
): string {
    return Object.entries(style)
        .map(([key, value]) => {
            const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase(); // CamelCase to kebab-case
            return `${cssKey}: ${value};`;
        })
        .join(" ");
}

export function preprocessStyle(
    style: Record<string, any>
): Record<string, string | number> {
    const processedStyle: Record<string, string | number> = {};

    for (const [key, value] of Object.entries(style)) {
        // Handle nested styles
        if (typeof value === "object" && value !== null) {
            console.warn(`Nested styles not allowed for ${key}`);
            continue; // Skip nested styles
        }

        // Remove falsy values
        if (
            value === null ||
            value === undefined ||
            value === false ||
            value === ""
        ) {
            continue;
        }

        // Otherwise, add to processed style
        processedStyle[key] = value;
    }

    return processedStyle;
}

export function isValidStyle(style: any) {
    return isPlainObject(style) || typeof style === "string";
}
