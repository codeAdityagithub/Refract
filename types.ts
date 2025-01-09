export type RefractChildren = string | object;

export type TEXT_CHILD = "TEXT_CHILD";

export type Fiber = {
    type: string | TEXT_CHILD;
    props:
        | {
              children: Fiber[];
              [additionalKey: string]: any;
          }
        | { nodeValue: string; children: [] };
    node?: HTMLElement | Text;

    child?: Fiber;
    parent?: Fiber;
    sibling?: Fiber;
    alternate?: Fiber;
    effectTag?: "UPDATE" | "DELETION" | "PLACEMENT";
};

export type CompletedFiber = {
    type: string | TEXT_CHILD;
    props:
        | {
              children: CompletedFiber[];
              [additionalKey: string]: any;
          }
        | { nodeValue: string; children: [] };
    node: HTMLElement | Text;

    child?: CompletedFiber;
    parent: CompletedFiber;
    sibling?: CompletedFiber;
    alternate?: CompletedFiber;
    effectTag?: "UPDATE" | "DELETION" | "PLACEMENT";
};
