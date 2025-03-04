import { Fiber } from '../types';
export declare function addEffectCleanup(fn: Function): void;
export declare function batchUpdate(cb: Function): void;
export declare function setReactiveFunction(fn: Function, fiber: Fiber): void;
export declare function setReactiveAttributes(fn: Function, dom: HTMLElement | Text): void;
export declare function clearReactiveAttributes(fn: any): void;
export declare function clearReactiveFunction(fn: Function): void;
export declare function deleteReactiveFunction(fn: Function): void;
