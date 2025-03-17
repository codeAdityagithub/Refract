export declare const IS_NON_DIMENSIONAL: RegExp;
export declare function styleObjectToString(style: Record<string, string | number>): string;
export declare function preprocessStyle(style: Record<string, any>): Record<string, string | number>;
export declare function isValidStyle(style: any): boolean;
export declare function applyMoves<T>(arr: T[], moves: Record<string, {
    from: number;
    to: number;
}>): T[];
export declare function longestIncreasingSubsequenceIndices(arr: number[]): number[];
