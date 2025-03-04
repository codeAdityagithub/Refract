import { BaseSignal } from '../signals/signal';
export declare function setCurrentFC(fc: any): void;
export declare function clearCurrentFC(): void;
export declare function getCurrentFC(): null;
export declare function cleanUp(fn: Function): void;
export declare function addEffect(fn: Function): void;
export declare function addSignal(signal: BaseSignal<any>): void;
export declare function cleanUpFC(currentFC: any, props: any): void;
