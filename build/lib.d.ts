export declare const IS_NON_DIMENSIONAL: RegExp;
export declare function styleObjectToString(style: Record<string, string | number>): string;
export declare function preprocessStyle(style: Record<string, any>): Record<string, string | number>;
export declare function isValidStyle(style: any): boolean;
export declare function applyMoves<T>(arr: T[], moves: Record<string, {
    from: number;
    to: number;
}>): T[];
/**
 * Computes the indices of the longest increasing subsequence in the given array.
 * @param arr - An array of numbers.
 * @returns An array of indices representing the longest increasing subsequence.
 *
 * Time Complexity: O(n log n)
 */
export declare function longestIncreasingSubsequenceIndices(arr: number[]): number[];
