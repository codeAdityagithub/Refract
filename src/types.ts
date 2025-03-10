export type RenderFunction = () => any;
export type Type =
    | string
    | "TEXT_CHILD"
    | "SIGNAL_CHILD"
    | "FRAGMENT"
    | Function;

export type NodeType = string | "TEXT_CHILD" | "SIGNAL_CHILD" | "FRAGMENT";

export type Props =
    | {
          [key: string]: any;
          children: Fiber[];
      }
    | {
          nodeValue: string;
          children: [];
          [key: string]: any;
      };

export type FiberChildren = Fiber[];

export type Fiber = {
    type: Type;
    props: Props & { children: FiberChildren };
    dom?: HTMLElement | Text;
    parent: Fiber;
    renderFunction?: RenderFunction;
};
export type NodeFiber = {
    type: NodeType;
    props: Props & { children: FiberChildren };
    dom?: HTMLElement | Text;
    parent: Fiber;
    renderFunction?: RenderFunction;
};
export type FunctionFiber = {
    type: Function;
    props: Props & { children: FiberChildren };
    dom?: HTMLElement | Text;
    parent: Fiber;
    renderFunction?: RenderFunction;
};
