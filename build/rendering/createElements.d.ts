import { Element, Fiber, FiberChildren } from '../types';
export declare const FRAGMENT_SYMBOL: unique symbol;
export declare function createElement(type: any, props: object | null, ...children: any[]): Fiber | FiberChildren;
export declare function createChildren(children: FiberChildren): FiberChildren;
export declare function createTextChildren(text: any): Element;
export declare function createNode(element: Fiber): HTMLElement | Text;
export declare function updateDomProp(prop: string, dom: HTMLElement | Text, value: any): void;
export declare const FRAGMENT = "FRAGMENT";
