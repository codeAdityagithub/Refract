import { setReactiveFunction } from "../signals/batch";
import { ArraySignal, ObjectSignal, Signal } from "../signals/signal";

export function render(
    element: any,
    container: HTMLElement | DocumentFragment,
    append: boolean,
    toReturn?: boolean
) {
    if (
        element instanceof Signal ||
        element instanceof ArraySignal ||
        element instanceof ObjectSignal
    ) {
        throw new Error("Signal cannot be a dom node");
    }
    if (typeof element.type === "function") {
        const component = element.type(element.props);
        if (Array.isArray(component)) {
            const fragment = document.createDocumentFragment();

            component.forEach((el) => {
                render(el, fragment, true);
            });

            container.appendChild(fragment);

            if (toReturn) return container;
        } else {
            if (toReturn) return render(component, container, true, true);

            render(component, container, true);
            return;
        }
    }

    const dom =
        element.type === "TEXT_CHILD"
            ? document.createTextNode("")
            : document.createElement(element.type);

    const isProperty = (key) => key !== "children";
    Object.keys(element.props)
        .filter(isProperty)
        .forEach((name) => {
            if (name.startsWith("on")) {
                dom.addEventListener(
                    name.slice(2).toLowerCase(),
                    element.props[name]
                );
            } else {
                dom[name] = element.props[name];
            }
        });
    renderAllChild(element, dom);
    if (append) container.appendChild(dom);
    if (toReturn) return dom;
}

function renderAllChild(element: any, dom: HTMLElement) {
    element.props.children.forEach((child, childIndex) => {
        if (child.type !== "SIGNAL_CHILD") render(child, dom, true);
        else {
            let value = child.renderFunction();
            if (!value) {
                value = String(value);
            }
            const isArray = Array.isArray(value);
            if (
                typeof value === "object" &&
                typeof value.type !== "function" &&
                !isArray
            ) {
                if (!value.type || !value.props || !value.props?.children)
                    throw new Error("Object cannot be used as dom nodes.");

                // this is for rendering other tags inside reactive state
                let insertedNode = render(value, dom, true, true);

                setReactiveFunction(child.renderFunction, () => {
                    const newValue = child.renderFunction();
                    console.log(newValue);
                    if (newValue.type !== value.type) {
                        const newNode = render(newValue, dom, false, true);
                        dom.replaceChild(newNode, insertedNode);
                        insertedNode = newNode;
                    } else {
                        console.log(newValue);
                        updateNode(insertedNode, value, newValue);
                    }
                    value = newValue;
                });
            } else if (isArray) {
                const fragment = document.createDocumentFragment();

                value.forEach((el) => {
                    render(el, fragment, true);
                });

                dom.appendChild(fragment);
                setReactiveFunction(child.renderFunction, () => {
                    const newArray = child.renderFunction();

                    if (newArray.length === value.length) {
                        newArray.forEach((el, i) => {
                            updateNode(dom.children[i], value[i], el);
                        });
                    } else {
                        const max = Math.max(newArray.length, value.length);
                        for (let i = 0; i < max; i++) {
                            updateNode(
                                dom.children[i + childIndex],
                                value[i],
                                newArray[i],
                                dom
                            );
                        }
                    }
                    value = newArray;
                });
                return;
            } else if (typeof value.type === "function") {
                // This is for reactive functional components

                // this can be parent for fragment returning fc
                const component = value.type(value.props);
                if (Array.isArray(component)) {
                    const fragment = document.createDocumentFragment();

                    component.forEach((el) => {
                        render(el, fragment, true);
                    });
                    dom.appendChild(fragment);
                } else {
                    let insertedNode = render(value, dom, true, true);

                    setReactiveFunction(child.renderFunction, () => {
                        const newValue = child.renderFunction();
                        if (newValue.type !== value.type) {
                            // dom.replaceChild(newNode, insertedNode);
                            const newNode = render(newValue, dom, false, true);
                            if (dom === insertedNode) {
                                console.log("Fragment");
                                // dom.innerHTML = "";
                                console.log(newNode);
                            } else {
                                dom.replaceChild(newNode, insertedNode);
                                insertedNode = newNode;
                            }
                        } else {
                            console.log("Fc changed");
                            console.log(insertedNode);
                            updateNode(
                                insertedNode,
                                value.type(value.props),
                                newValue.type(newValue.props)
                            );
                        }
                        value = newValue;
                    });
                }
            } else {
                // simple reactive text nodes
                const prevNode = document.createTextNode(
                    child.renderFunction()
                );
                dom.appendChild(prevNode);
                setReactiveFunction(child.renderFunction, () => {
                    prevNode.nodeValue = child.renderFunction();
                });
            }
        }
    });
}

const isEvent = (key: string) => key.startsWith("on");
const isProperty = (key: string) => key !== "children" && !isEvent(key);
const isNew = (prev: any, next: any, key: string) => prev[key] !== next[key];
const isGone = (prev: any, next: any, key: string) => !(key in next);

function updateNode(
    node: HTMLElement | Text | ChildNode,
    prev: any,
    next: any,
    parent?: HTMLElement
) {
    const prevProps = prev?.props;
    const nextProps = next?.props;

    if (!prevProps) {
        if (node && node.parentElement) {
            // node.insertBefore(
            //     render(next, node.parentElement, false, true),
            //     node
            // );
            const toInsert = render(next, node.parentElement, false, true);
            node.parentElement.insertBefore(toInsert, node);
        } else if (parent) {
            render(next, parent, true);

            return;
        }
        return;
    } else if (node && !nextProps) {
        // console.log("extra node removed", node);
        node.remove();
        return;
    }

    // remove old properties and event listeners
    for (const prop of Object.keys(prevProps)) {
        if (isProperty(prop) && isGone(prevProps, nextProps, prop)) {
            node[prop] = "";
        } else if (
            isEvent(prop) &&
            (!(prop in nextProps) || isNew(prevProps, nextProps, prop))
        ) {
            const eventName = prop.toLowerCase().substring(2);

            node.removeEventListener(eventName, prevProps[prop]);
        }
    }

    if (prev.type !== next.type) {
        const parent = node.parentElement;
        if (parent) {
            const newNode = render(next, parent, false, true);
            parent.replaceChild(newNode, node);
        }
    } else {
        // add new properties

        for (const prop of Object.keys(nextProps)) {
            if (isProperty(prop) && isNew(prevProps, nextProps, prop)) {
                node[prop] = nextProps[prop];
            } else if (isEvent(prop) && isNew(prevProps, nextProps, prop)) {
                const eventName = prop.toLowerCase().substring(2);

                node.addEventListener(eventName, nextProps[prop]);
            }
        }
        node.childNodes.forEach((child, i) => {
            const prevChild = prevProps.children[i];
            const nextChild = nextProps.children[i];
            if (prevChild && nextChild) updateNode(child, prevChild, nextChild);
        });
    }
}
