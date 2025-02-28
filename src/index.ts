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
} from "./signals/signal";

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
};
