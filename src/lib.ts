import { isPlainObject } from "./utils/general";

export function styleObjectToString(
    style: Record<string, string | number>
): string {
    const newStyles: string[] = [];

    for (const key in style) {
        const value = style[key];
        const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase(); // CamelCase to kebab-case

        if (typeof value === "number") {
            newStyles.push(`${cssKey}: ${value}px;`); // Convert numbers to strings with px suffix
        } else {
            newStyles.push(`${cssKey}: ${value};`); // Convert numbers to strings with px suffix
        }
    }
    return newStyles.join(" ");
}

export function preprocessStyle(
    style: Record<string, any>
): Record<string, string | number> {
    const processedStyle: Record<string, string | number> = {};

    for (const key in style) {
        const value = style[key];
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
 * Computes the indices of the longest increasing subsequence in the given array.
 * @param arr - An array of numbers.
 * @returns An array of indices representing the longest increasing subsequence.
 *
 * Time Complexity: O(n log n)
 */
export function longestIncreasingSubsequenceIndices(arr: number[]): number[] {
    const n = arr.length;
    const predecessors = new Array(n).fill(-1); // Track the previous index for each element in the subsequence.
    const lisIndices: number[] = []; // Stores indices of the smallest tail for all increasing subsequences of each length.

    for (let i = 0; i < n; i++) {
        const x = arr[i];

        // Binary search for the insertion point in lisIndices.
        let low = 0;
        let high = lisIndices.length;
        while (low < high) {
            const mid = Math.floor((low + high) / 2);
            if (arr[lisIndices[mid]] < x) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }

        // If low is at the end, extend lisIndices; otherwise, update the tail value.
        if (low === lisIndices.length) {
            lisIndices.push(i);
        } else {
            lisIndices[low] = i;
        }

        // Set the predecessor of arr[i] (if low is not the start of a subsequence).
        predecessors[i] = low > 0 ? lisIndices[low - 1] : -1;
    }

    // Reconstruct the longest increasing subsequence using the predecessors.
    const lis: number[] = [];
    let k = lisIndices.length > 0 ? lisIndices[lisIndices.length - 1] : -1;
    for (let i = lisIndices.length - 1; i >= 0; i--) {
        lis[i] = k;
        k = predecessors[k];
    }
    return lis;
}
