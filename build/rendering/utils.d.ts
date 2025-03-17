import { Fiber } from '../types';
export declare function deepCompareFibers(fiberA: any, fiberB: any): boolean;
export declare function deepEqual(objA: any, objB: any): boolean;
export declare function findFirstDom(fiber: Fiber): HTMLElement | Text | undefined;
export declare function findParentFiberWithDom(fiber: Fiber): Fiber | undefined;
export declare function findNearestParentWithDom(fiber: Fiber): Fiber | undefined;
