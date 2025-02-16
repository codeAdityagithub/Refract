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

export function applyMoves<T>(
    arr: T[],
    moves: Record<string, { from: number; to: number }>
): T[] {
    const n = arr.length;
    // Create an array for the final result (we use undefined as a marker)
    const result: (T | undefined)[] = new Array(n).fill(undefined);
    // Keep track of which indices in the original array are moved.
    const movedFrom = new Set<number>();

    // First, place all moved elements at their target positions.
    // (For a swap both targets will be filled by the respective moves.)
    for (const key in moves) {
        const { from, to } = moves[key];
        // You can optionally ignore moves that are no-ops (from === to)
        if (from === to) continue;
        result[to] = arr[from];
        movedFrom.add(from);
    }

    // Next, fill in the "gaps" with the unmoved elements,
    // preserving their original order.
    let fillIndex = 0; // current position in `result` to fill
    for (let i = 0; i < n; i++) {
        // Skip any element that was moved.
        if (movedFrom.has(i)) continue;

        // Advance fillIndex until we find an empty slot in result.
        while (fillIndex < n && result[fillIndex] !== undefined) {
            fillIndex++;
        }
        if (fillIndex < n) {
            result[fillIndex] = arr[i];
            fillIndex++;
        }
    }

    return result as T[];
}

/**
 * Computes the indices of the longest increasing subsequence in an array.
 * For each position in the resulting subsequence, the value at that index
 * is strictly increasing relative to the previous.
 *
 * @param arr - Array of numbers (here: the old indices in new order)
 * @returns An array of indices into `arr` representing the longest increasing subsequence.
 */
export function longestIncreasingSubsequenceIndices(arr: number[]): number[] {
    const n = arr.length;
    const p = new Array(n).fill(0); // To track predecessors
    const result: number[] = [];

    for (let i = 0; i < n; i++) {
        const x = arr[i];
        // Binary search for the insertion point in result.
        let low = 0;
        let high = result.length;
        while (low < high) {
            const mid = Math.floor((low + high) / 2);
            if (arr[result[mid]] < x) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        if (low === result.length) {
            result.push(i);
        } else {
            result[low] = i;
        }
        p[i] = low > 0 ? result[low - 1] : -1;
    }

    // Reconstruct the longest increasing subsequence.
    let lis: number[] = [];
    let k = result.length > 0 ? result[result.length - 1] : -1;
    for (let i = result.length - 1; i >= 0; i--) {
        lis[i] = k;
        k = p[k];
    }
    return lis;
}
