export type RenderFunction = () => any;
export type Type =
    | string
    | "TEXT_CHILD"
    | "SIGNAL_CHILD"
    | "FRAGMENT"
    | Function;

export type Children = Element[];
export type Props =
    | {
          children: Element[];
          [key: string]: any;
      }
    | {
          children: Element[];
          nodeValue: string;
          [key: string]: any;
      }
    | {
          children: Element[];
          [key: string]: any;
      };
export type Element = {
    type: Type;
    props: Props;
    renderFunction?: RenderFunction;
};
export type ReactiveElement = {
    type: Type;
    props: Props & { children: ReactiveElement[] };
    dom: HTMLElement | Text;
    parent?: ReactiveElement;
};
