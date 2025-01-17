export type RenderFunction = () => any;
export type Type = string | "TEXT_CHILD" | "SIGNAL_CHILD" | "FRAGMENT";

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
