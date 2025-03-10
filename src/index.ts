import { cleanUp } from "./rendering/functionalComponents";
import { render } from "./rendering/render";
import { createElement } from "./rendering/createElements";
import { lazy } from "./lazy/Lazyloading";
import {
    createEffect,
    createSignal,
    createPromise,
    createRef,
    computed,
} from "./signals/signal";
import type {
    ArraySignal,
    BaseSignal,
    ObjectSignal,
    PrimitiveSignal,
    PublicArraySignal,
    PublicObjectSignal,
    PublicSignal,
    Ref,
} from "./signals/signal";

export * from "./jsx";
import { JSXInternal } from "./jsx";
declare global {
    // @ts-expect-error
    export import JSX = JSXInternal;
}
export * from "./types";
export {
    cleanUp,
    createEffect,
    createSignal,
    render,
    createPromise,
    createRef,
    computed,
    createElement,
    lazy,
    ArraySignal,
    BaseSignal,
    ObjectSignal,
    PrimitiveSignal,
    PublicArraySignal,
    PublicObjectSignal,
    PublicSignal,
    Ref,
};
