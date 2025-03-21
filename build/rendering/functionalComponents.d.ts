import { BaseSignal } from '../signals/signal';
import { Fiber } from '../types';
export declare function setCurrentFC(fc: Fiber): void;
export declare function clearCurrentFC(): void;
export declare function getCurrentFC(): Fiber | null;
export declare function runAllEffects(FC: Fiber): void;
export declare function cleanUp(fn: Function): void;
export declare function cleanUpWFiber(fn: Function, fiber: Fiber): void;
export declare function addEffect(fn: Function): void;
export declare function addSignal(signal: BaseSignal<any>): void;
export declare function cleanUpFC(currentFC: any, props: any): void;
