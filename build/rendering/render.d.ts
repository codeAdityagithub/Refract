import { Fiber } from '../types';
export declare function render(element: Fiber, container: HTMLElement): void;
export declare function updateFiber(prevFiber: Fiber, newValue: any): void;
export declare const isEvent: (key: string) => boolean;
export declare const isProperty: (key: string) => boolean;
