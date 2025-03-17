import { BaseSignal } from './signal';
export declare const MutatingMethods: string[];
export declare function throwNonPrimitiveError(): void;
export declare function throwNotUpdateCalled(): void;
export declare function throwNotArray(): void;
export declare function throwNotObject(): void;
export declare function throwInvalidSignalType(val: any): void;
export declare function publicSignal(signal: BaseSignal<any>): {
    readonly value: {
        readonly [x: string]: any;
    };
    update: typeof signal.update;
};
export declare const createArrayProxy: (arr: any[], signal: any) => any[];
