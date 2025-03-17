function isPlainObject(variable) {
  return typeof variable === "object" && // Must be an object
  variable !== null && // Cannot be null
  !Array.isArray(variable) && // Cannot be an array
  Object.prototype.toString.call(variable) === "[object Object]";
}
function isPrimitive(val) {
  return ["boolean", "string", "number", "undefined"].includes(typeof val) || val === null || val instanceof Error;
}
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const SVG_TAGS = /* @__PURE__ */ new Set([
  "svg",
  "a",
  "circle",
  "clipPath",
  "defs",
  "desc",
  "ellipse",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "filter",
  "foreignObject",
  "g",
  "image",
  "line",
  "linearGradient",
  "marker",
  "mask",
  "metadata",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "script",
  "set",
  "stop",
  "style",
  "switch",
  "symbol",
  "text",
  "textPath",
  "title",
  "tspan",
  "use",
  "view"
]);
const MATH_TAGS = /* @__PURE__ */ new Set([
  "math",
  "maction",
  "maligngroup",
  "malignmark",
  "menclose",
  "merror",
  "mfenced",
  "mfrac",
  "mglyph",
  "mi",
  "mlabeledtr",
  "mlongdiv",
  "mmultiscripts",
  "mn",
  "mo",
  "mover",
  "mpadded",
  "mphantom",
  "mroot",
  "mrow",
  "ms",
  "mscarries",
  "mscarry",
  "msgroup",
  "msline",
  "mspace",
  "msqrt",
  "msrow",
  "mstack",
  "mstyle",
  "msub",
  "msup",
  "msubsup",
  "mtable",
  "mtd",
  "mtext",
  "mtr",
  "munder",
  "munderover"
]);
const MATH_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
const CAPTURE_REGEX$1 = /(PointerCapture)$|Capture$/i;
const IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
function styleObjectToString(style) {
  const newStyles = [];
  for (const key in style) {
    const value = style[key];
    const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    if (typeof value != "number" || IS_NON_DIMENSIONAL.test(cssKey)) {
      newStyles.push(`${cssKey}: ${value};`);
    } else {
      newStyles.push(`${cssKey}: ${value}px;`);
    }
  }
  return newStyles.join(" ");
}
function preprocessStyle(style) {
  const processedStyle = {};
  for (const key in style) {
    const value = style[key];
    if (typeof value === "object" && value !== null) {
      console.warn(`Nested styles not allowed for ${key}`);
      continue;
    }
    if (value === null || value === void 0 || value === false || value === "") {
      continue;
    }
    processedStyle[key] = value;
  }
  return processedStyle;
}
function isValidStyle(style) {
  return isPlainObject(style) || typeof style === "string";
}
function setStyle(style, dom) {
  if (!isValidStyle(style))
    throw new Error("Style attribute must be a plain object or a string");
  if (typeof style === "string") {
    dom.setAttribute("style", style);
  } else {
    const processedStyle = preprocessStyle(style);
    dom.setAttribute("style", styleObjectToString(processedStyle));
  }
}
function setReactiveAttribute(reactiveFunction, name, dom, namespace) {
  reactiveFunction.__propName = name;
  const val = reactiveAttribute(reactiveFunction);
  if (val === null || val === void 0 || val === false) {
    return;
  }
  setAttribute(name, val, dom, namespace);
  if (reactiveFunction.__signals)
    setReactiveAttributes(reactiveFunction, dom);
}
const CAPTURE_REGEX = /(PointerCapture)$|Capture$/i;
function setAttribute(name, value, dom, namespace) {
  if (name == "style") {
    setStyle(value, dom);
    return;
  }
  if (name[0] === "o" && name[1] === "n" && typeof value === "function") {
    const useCapture = name != (name = name.replace(CAPTURE_REGEX, "$1"));
    if (name.toLowerCase() in dom || name == "onFocusOut" || name == "onFocusIn" || name === "onGotPointerCapture" || name === "onLostPointerCapture")
      name = name.toLowerCase().slice(2);
    else name = name.slice(2);
    dom.addEventListener(name, value, useCapture);
    return;
  }
  if (namespace === SVG_NAMESPACE) {
    name = name.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
  } else if (name !== "width" && name !== "height" && name !== "href" && name !== "list" && name !== "form" && name !== "tabIndex" && name !== "download" && name !== "rowSpan" && name !== "colSpan" && name !== "role" && name !== "popover" && name in dom) {
    try {
      if (name === "value" && dom.tagName === "SELECT") {
        setTimeout(() => {
          dom[name] = value == null ? "" : value;
        });
      } else {
        dom[name] = value == null ? "" : value;
      }
      return;
    } catch (e) {
    }
  }
  if (value != null && (value !== false || name[4] === "-")) {
    dom.setAttribute(
      name,
      name === "popover" && value === true ? "" : value
    );
  }
}
const FRAGMENT_SYMBOL = Symbol("FRAGMENT");
function createElement(type, props, ...children) {
  if (type === "FRAGMENT") {
    const fragments = createChildren(children);
    fragments[FRAGMENT_SYMBOL] = true;
    return fragments;
  }
  return {
    type,
    props: {
      ...props,
      children: createChildren(children)
    }
  };
}
function createChildren(children) {
  return children.map((child) => {
    if (typeof child === "object") {
      if (Array.isArray(child)) {
        return createChildren(child);
      }
      if (child === null) {
        return createTextChildren("");
      }
      if (!child.type || !child.props) {
        throw new Error(
          "Invalid type for a dom node, found " + child
        );
      }
      return child;
    } else if (typeof child === "function") {
      const val = reactive(child);
      if (isPrimitive(val)) {
        return createSignalChild(
          "TEXT_CHILD",
          {
            nodeValue: val !== void 0 && val !== null && val !== false ? String(val) : "",
            children: []
          },
          child
        );
      } else if (Array.isArray(val)) {
        const isFragment = val[FRAGMENT_SYMBOL];
        return createSignalChild(
          "FRAGMENT",
          { children: isFragment ? val : createChildren(val) },
          child
        );
      } else if (!val.type || !val.props) {
        throw new Error(
          "Invalid type for a dom node, found " + val
        );
      }
      return createSignalChild(val.type, val.props, child);
    } else {
      return createTextChildren(child);
    }
  }).flat();
}
function createTextChildren(text) {
  return {
    type: "TEXT_CHILD",
    props: {
      nodeValue: text !== null && text !== void 0 && text !== false ? String(text) : "",
      children: []
    }
  };
}
function createSignalChild(type, props, renderFunction) {
  return {
    type,
    renderFunction,
    props
  };
}
function isProperty$1(key) {
  return key !== "children" && key !== "key" && key !== "ref";
}
function createNode(element) {
  let namespace = null;
  if (SVG_TAGS.has(element.type)) namespace = SVG_NAMESPACE;
  else if (MATH_TAGS.has(element.type)) namespace = MATH_NAMESPACE;
  const dom = element.type === "TEXT_CHILD" ? document.createTextNode("") : namespace ? document.createElementNS(
    namespace,
    // @ts-expect-error
    element.type,
    element.props.is && element.props
  ) : (
    // @ts-expect-error
    document.createElement(element.type)
  );
  if (!element.props) return dom;
  if (element.props.ref && element.props.ref instanceof Ref && dom instanceof HTMLElement) {
    element.props.ref.current = dom;
  }
  for (const name in element.props) {
    if (!isProperty$1(name)) {
      continue;
    }
    const value = element.props[name];
    if (typeof value === "function" && name[0] !== "o" && name[1] !== "n") {
      setReactiveAttribute(value, name, dom, namespace);
    } else {
      setAttribute(name, value, dom, namespace);
    }
  }
  return dom;
}
function updateDomProp(prop, dom, value) {
  if (value == null || prop === "key") return;
  setAttribute(prop, value, dom);
}
function render(element, container) {
  rootContainer = container;
  const fragment = document.createDocumentFragment();
  rootFragment = fragment;
  const rootFiber = {
    type: "div",
    props: {
      children: [element]
    },
    // @ts-expect-error
    dom: fragment
  };
  element.parent = rootFiber;
  elements.push(element);
  requestIdleCallback(workLoop);
}
function commitRootFragment() {
  if (rootFragment && rootContainer) {
    rootContainer.appendChild(rootFragment);
  }
}
let elements = [];
let rootContainer = null;
let rootFragment = null;
let effectQueue = [];
function processEffectQueue() {
  for (let i = 0; i < effectQueue.length; i++) {
    const fiber = effectQueue[i];
    runAllEffects(fiber);
  }
  effectQueue.length = 0;
}
function workLoop(deadline) {
  processEffectQueue();
  let shouldYield = false;
  while (elements.length > 0 && !shouldYield) {
    const element = elements.pop();
    renderNode(element);
    shouldYield = deadline.timeRemaining() < 1;
  }
  if (elements.length == 0) {
    commitRootFragment();
    processEffectQueue();
    return;
  }
  requestIdleCallback(workLoop);
}
function renderNode(fiber) {
  var _a;
  if (fiber.type === "FRAGMENT") {
    const isArray = !fiber.props.children[FRAGMENT_SYMBOL];
    let noKey = false;
    for (let i = fiber.props.children.length - 1; i >= 0; i--) {
      fiber.props.children[i].parent = fiber;
      if (isArray && fiber.props.children[i].props.key === void 0 && fiber.renderFunction) {
        noKey = true;
      }
      elements.push(fiber.props.children[i]);
    }
    if (noKey) {
      console.error("Array children must have a key attribute");
    }
  } else if (typeof fiber.type === "function") {
    setCurrentFC(fiber);
    const children = fiber.type(fiber.props);
    clearCurrentFC();
    if (Array.isArray(children)) {
      for (let i = children.length - 1; i >= 0; i--) {
        children[i].parent = fiber;
        elements.push(children[i]);
      }
      fiber.props.children = children;
    } else {
      children.parent = fiber;
      fiber.props.children.push(children);
      elements.push(children);
    }
    effectQueue.push(fiber);
  } else {
    if (!fiber.dom) fiber.dom = createNode(fiber);
    let fiberParent = fiber.parent;
    while (fiberParent && !fiberParent.dom) {
      fiberParent = fiberParent.parent;
    }
    if (fiberParent) {
      (_a = fiberParent.dom) == null ? void 0 : _a.appendChild(fiber.dom);
    }
    for (let i = fiber.props.children.length - 1; i >= 0; i--) {
      fiber.props.children[i].parent = fiber;
      elements.push(fiber.props.children[i]);
    }
  }
  setRenderFunction(fiber);
}
function createFiber(fiber) {
  if (fiber.type === "FRAGMENT") {
    const isFragment = fiber.props.children[FRAGMENT_SYMBOL];
    if (isFragment) {
      for (const child of fiber.props.children) {
        child.parent = fiber;
        createFiber(child);
      }
    } else {
      let noKey = false;
      for (const child of fiber.props.children) {
        child.parent = fiber;
        if (child.props.key === void 0) {
          noKey = true;
        }
        createFiber(child);
      }
      if (noKey) {
        console.error("Array children must have a key attribute");
      }
    }
  } else if (typeof fiber.type !== "function") {
    for (const child of fiber.props.children) {
      child.parent = fiber;
      createFiber(child);
    }
  }
  setRenderFunction(fiber);
}
function commitFiber(fiber, referenceNode, replace, needCreation, customParent) {
  var _a, _b;
  if (fiber.type === "FRAGMENT") {
    for (const child of fiber.props.children) {
      if (needCreation) child.parent = fiber;
      commitFiber(
        child,
        referenceNode,
        replace,
        needCreation,
        customParent
      );
    }
  } else if (typeof fiber.type === "function") {
    setCurrentFC(fiber);
    const children = fiber.type(fiber.props);
    clearCurrentFC();
    if (Array.isArray(children)) {
      for (const child of children) {
        child.parent = fiber;
        commitFiber(child, referenceNode, replace, true, customParent);
      }
      fiber.props.children = children;
    } else {
      children.parent = fiber;
      fiber.props.children.push(children);
      commitFiber(children, referenceNode, replace, true, customParent);
    }
    queueMicrotask(() => {
      runAllEffects(fiber);
    });
  } else {
    if (!fiber.dom) fiber.dom = createNode(fiber);
    if (referenceNode) {
      if (replace)
        (_a = referenceNode.parentElement) == null ? void 0 : _a.replaceChild(
          fiber.dom,
          referenceNode
        );
      else
        (_b = referenceNode.parentElement) == null ? void 0 : _b.insertBefore(
          fiber.dom,
          referenceNode
        );
    } else {
      let parentDom = void 0;
      if (customParent) {
        parentDom = customParent;
      } else {
        let fiberParent = fiber.parent;
        while (fiberParent && !fiberParent.dom) {
          fiberParent = fiberParent.parent;
        }
        parentDom = fiberParent == null ? void 0 : fiberParent.dom;
      }
      parentDom == null ? void 0 : parentDom.appendChild(fiber.dom);
    }
    for (const child of fiber.props.children) {
      if (needCreation) child.parent = fiber;
      commitFiber(child, void 0, void 0, needCreation, fiber.dom);
    }
  }
  if (needCreation) {
    setRenderFunction(fiber);
  }
}
let ToCommitDeletion = true;
function commitDeletion(fiber, toClearReactiveFunction) {
  if (!fiber || !ToCommitDeletion) return;
  if (fiber.renderFunction) {
    if (toClearReactiveFunction)
      clearReactiveFunction(fiber.renderFunction);
    delete fiber.renderFunction;
  }
  if (fiber.dom) {
    for (const prop in fiber.props) {
      if (isEvent(prop)) {
        let eventName = prop.toLowerCase().substring(2);
        const useCapture = eventName != (eventName = eventName.replace(CAPTURE_REGEX$1, "$1"));
        fiber.dom.removeEventListener(
          eventName,
          fiber.props[prop],
          useCapture
        );
        delete fiber.props[prop];
      } else if (typeof fiber.props[prop] === "function") {
        clearReactiveAttributes(fiber.props[prop]);
      } else if (prop === "ref" && fiber.props[prop] instanceof Ref) {
        fiber.props[prop].current = null;
      }
    }
    fiber.dom.remove();
  }
  if (typeof fiber.type === "function") {
    cleanUpFC(fiber, fiber.props);
    delete fiber.type;
  }
  fiber.props.children.forEach((child) => commitDeletion(child, true));
}
function setRenderFunction(fiber) {
  if (!fiber.renderFunction) return;
  setReactiveFunction(fiber.renderFunction, fiber);
}
function updateFiber(prevFiber, newValue) {
  if (isPrimitive(newValue)) {
    const newFragment = {
      ...createTextChildren(newValue),
      parent: prevFiber.parent
    };
    createFiber(newFragment);
    updateNode(prevFiber, newFragment);
  } else if (Array.isArray(newValue)) {
    const isFragment = newValue[FRAGMENT_SYMBOL];
    const newFragment = {
      type: "FRAGMENT",
      props: {
        children: isFragment ? newValue : createChildren(newValue)
      },
      parent: prevFiber.parent
    };
    createFiber(newFragment);
    updateNode(prevFiber, newFragment);
  } else {
    const newFragment = { ...newValue, parent: prevFiber.parent };
    createFiber(newFragment);
    updateNode(prevFiber, newFragment);
  }
}
function replaceRenderFunction(prev, next) {
  if (prev.renderFunction) {
    next.renderFunction = prev.renderFunction;
    setRenderFunction(next);
  }
}
function replaceChildFromParent(prev, next, index) {
  var _a;
  if (index !== void 0) {
    prev.parent.props.children[index] = next;
    return;
  }
  (_a = prev.parent) == null ? void 0 : _a.props.children.forEach((child, i) => {
    if (child === prev) {
      prev.parent.props.children[i] = next;
    }
  });
}
const isEvent = (key) => key.startsWith("on") || key == "onFocusOut" || key == "onFocusIn";
const isProperty = (key) => key !== "children" && !isEvent(key) && key !== "key" && key !== "ref";
const isNew = (prev, next, key) => prev[key] !== next[key];
const isGone = (prev, next, key) => !(key in next);
function deepCompareFibers(fiberA, fiberB) {
  var _a, _b;
  if (fiberA === fiberB) {
    return true;
  }
  if (fiberA.type !== fiberB.type) {
    return false;
  }
  if (((_a = fiberA.props) == null ? void 0 : _a.key) !== ((_b = fiberB.props) == null ? void 0 : _b.key)) {
    return false;
  }
  return deepEqual(fiberA.props, fiberB.props);
}
function deepEqual(objA, objB) {
  if (objA === objB) {
    if (objA instanceof BaseSignal && objB instanceof BaseSignal)
      return deepEqual(objA.value, objB.value);
    if (Array.isArray(objA) && Array.isArray(objB)) {
      if (objA.length !== objB.length) return false;
      for (let i = 0; i < objA.length; i++) {
        if (!deepEqual(objA[i], objB[i])) return false;
      }
    }
    return true;
  }
  if (isPrimitive(objA) && isPrimitive(objB)) {
    return objA === objB;
  }
  if (typeof objA !== typeof objB) return false;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (let key of keysA) {
    if (key === "children") continue;
    if (!objB.hasOwnProperty(key)) return false;
    if (!deepEqual(objA[key], objB[key])) return false;
  }
  return true;
}
function findFirstDom(fiber) {
  if (!fiber) return;
  if (fiber.dom) return fiber.dom;
  for (const child of fiber.props.children) {
    const dom = findFirstDom(child);
    if (dom) return dom;
  }
}
function findLastDom(fiber) {
  if (!fiber) return;
  if (fiber.dom) return fiber.dom;
  for (let i = fiber.props.children.length - 1; i >= 0; i--) {
    const child = fiber.props.children[i];
    const dom = findLastDom(child);
    if (dom) return dom;
  }
}
function findLastChildDom(fiber) {
  if (!fiber) return;
  for (let i = fiber.props.children.length - 1; i >= 0; i--) {
    const child = fiber.props.children[i];
    const dom = findLastDom(child);
    if (dom) return dom;
  }
}
function findParentFiberWithDom(fiber) {
  if (!fiber) return;
  let fiberParent = fiber.parent;
  while (fiberParent && !fiberParent.dom) {
    fiberParent = fiberParent.parent;
  }
  return fiberParent;
}
function findNearestParentWithDom(fiber) {
  if (!fiber) return;
  if (fiber.dom) return fiber;
  let fiberParent = fiber.parent;
  while (fiberParent && !fiberParent.dom) {
    fiberParent = fiberParent.parent;
  }
  return fiberParent;
}
function updateNode(prev, next, index) {
  if (!prev && !next) return;
  if (prev && !next) {
    commitDeletion(prev, true);
    prev.parent.props.children = prev.parent.props.children.filter(
      (child) => child !== prev
    );
  } else if (prev && next) {
    const prevProps = prev.props;
    const nextProps = next.props;
    if (prev.type === "FRAGMENT" || typeof prev.type === "function") {
      if (next.type === "FRAGMENT" || typeof next.type === "function") {
        if (typeof prev.type === typeof next.type && typeof prev.type === "function") {
          const areSame = deepCompareFibers(prev, next);
          if (!areSame) {
            commitFiber(next, findFirstDom(prev), void 0, true);
            replaceRenderFunction(prev, next);
            commitDeletion(prev);
            replaceChildFromParent(prev, next, index);
          }
        } else {
          updateChildren(prev, next);
        }
      } else {
        next.parent = prev.parent;
        let firstChild = prev.props.children[0];
        while (firstChild && !firstChild.dom)
          firstChild = firstChild.props.children[0];
        commitFiber(next, firstChild == null ? void 0 : firstChild.dom);
        replaceRenderFunction(prev, next);
        commitDeletion(prev);
        replaceChildFromParent(prev, next, index);
      }
    } else {
      const node = prev.dom;
      if (prev.type === "TEXT_CHILD" && next.type === "TEXT_CHILD" && !next.dom)
        next.dom = prev.dom;
      if (node === void 0) {
        return;
      }
      if (next.type === "FRAGMENT" || typeof next.type === "function") {
        next.parent = prev.parent;
        replaceRenderFunction(prev, next);
        commitFiber(next, node);
        commitDeletion(prev);
        replaceChildFromParent(prev, next, index);
      } else {
        for (const prop in prevProps) {
          if (isProperty(prop) && isGone(prevProps, nextProps, prop)) {
            node[prop] = "";
          } else if (isEvent(prop) && (!(prop in nextProps) || isNew(prevProps, nextProps, prop))) {
            let eventName = prop.toLowerCase().substring(2);
            const useCapture = eventName != (eventName = eventName.replace(
              CAPTURE_REGEX$1,
              "$1"
            ));
            node.removeEventListener(
              eventName,
              prevProps[prop],
              useCapture
            );
          }
        }
        if (prev.type !== next.type) {
          next.parent = prev.parent;
          replaceRenderFunction(prev, next);
          commitFiber(next, node, true);
          commitDeletion(prev);
          replaceChildFromParent(prev, next, index);
        } else {
          for (const prop in nextProps) {
            if (isProperty(prop) && isNew(prevProps, nextProps, prop)) {
              node[prop] = nextProps[prop];
              prevProps[prop] = nextProps[prop];
            } else if (isEvent(prop) && isNew(prevProps, nextProps, prop)) {
              let eventName = prop.toLowerCase().substring(2);
              const useCapture = eventName != (eventName = eventName.replace(
                CAPTURE_REGEX$1,
                "$1"
              ));
              node.addEventListener(
                eventName,
                nextProps[prop],
                useCapture
              );
              prevProps[prop] = nextProps[prop];
            }
          }
          updateChildren(prev, next);
        }
      }
    }
  }
}
function reconcileList(prev, next) {
  var _a;
  const oldFibers = prev.props.children;
  const newFibers = next.props.children;
  const oldMap = {};
  for (let i = 0; i < oldFibers.length; i++) {
    const key = oldFibers[i].props.key;
    if (key === null || key === void 0 || oldMap.hasOwnProperty(String(key))) {
      return false;
    }
    oldMap[String(key)] = oldFibers[i];
  }
  const referenceNode = (_a = findLastChildDom(prev)) == null ? void 0 : _a.nextSibling;
  const fiberParent = findParentFiberWithDom(prev);
  if (newFibers.length === 0) {
    prev.props.children.length = 0;
    if ((fiberParent == null ? void 0 : fiberParent.dom) instanceof HTMLElement)
      fiberParent.dom.innerHTML = "";
    return;
  }
  const prevLen = prev.props.children.length;
  for (let i = 0; i < newFibers.length; i++) {
    const newFiber = newFibers[i];
    const key = newFiber.props.key;
    const keyStr = String(key);
    if (oldMap.hasOwnProperty(keyStr)) {
      const oldFiber = oldMap[keyStr];
      if (prevLen > i) prev.props.children[i] = oldFiber;
      else prev.props.children.push(oldFiber);
      delete oldMap[keyStr];
      const newFiber2 = next.props.children[i];
      if (newFiber2) newFiber2.parent = prev;
      updateNode(oldFiber, newFiber2, i);
      applyFiber(
        prev.props.children[i],
        fiberParent == null ? void 0 : fiberParent.dom,
        referenceNode
      );
    } else {
      if (prevLen > i) prev.props.children[i] = newFiber;
      else prev.props.children.push(newFiber);
      newFiber.parent = prev;
      commitFiber(
        newFiber,
        referenceNode,
        false,
        false,
        fiberParent == null ? void 0 : fiberParent.dom
      );
    }
  }
  for (const key in oldMap) {
    if (oldMap.hasOwnProperty(key)) {
      const fiber = oldMap[key];
      commitDeletion(fiber, true);
    }
  }
  while (prev.props.children.length > next.props.children.length) {
    prev.props.children.pop();
  }
}
function applyFiber(fiber, parent, referenceNode) {
  if (fiber.dom) {
    if (fiber.dom === parent || fiber.dom === referenceNode) return;
    if (referenceNode) {
      parent.insertBefore(fiber.dom, referenceNode);
    } else parent.appendChild(fiber.dom);
  } else {
    for (const child of fiber.props.children) {
      applyFiber(child, parent, referenceNode);
    }
  }
}
function updateChildren(prev, next) {
  const isList = next.type === "FRAGMENT" && !next.props.children[FRAGMENT_SYMBOL];
  const wasList = prev.type === "FRAGMENT" && !prev.props.children[FRAGMENT_SYMBOL];
  if (isList && wasList) {
    const result = reconcileList(prev, next);
    if (result === false) {
      updateNonListChildrenWithKeys(prev, next);
    }
  } else {
    updateNonListChildrenWithKeys(prev, next);
  }
  if (next.type === "FRAGMENT" && next.props.children[FRAGMENT_SYMBOL]) {
    prev.props.children[FRAGMENT_SYMBOL] = true;
  } else {
    prev.props.children[FRAGMENT_SYMBOL] = false;
  }
  prev.type = next.type;
}
function updateNonListChildren(prev, next) {
  var _a;
  let len = Math.max(prev.props.children.length, next.props.children.length);
  for (let i = 0; i < len; i++) {
    let prevChild = prev.props.children[i];
    let nextChild = next.props.children[i];
    if (nextChild) nextChild.parent = prev;
    if (!prevChild && nextChild) {
      commitFiber(
        nextChild,
        // @ts-expect-error
        (_a = findLastDom(prev.props.children.at(-1))) == null ? void 0 : _a.nextSibling
      );
      prev.props.children.push(nextChild);
    } else if (!nextChild && prevChild) {
      commitDeletion(prevChild, true);
      prev.props.children.splice(i, 1);
      len = prev.props.children.length;
      i--;
    } else {
      updateNode(prevChild, nextChild, i);
      const newLen = Math.max(
        prev.props.children.length,
        next.props.children.length
      );
      if (newLen < len) {
        len = newLen;
        i--;
      }
    }
  }
}
function updateNonListChildrenWithKeys(prev, next) {
  let len = Math.max(prev.props.children.length, next.props.children.length);
  const oldMap = {};
  let count = 0;
  for (let i = 0; i < prev.props.children.length; i++) {
    const key = prev.props.children[i].props.key;
    if (key === null || key === void 0) {
      continue;
    }
    count++;
    if (oldMap.hasOwnProperty(String(key))) {
      console.warn("Found two children with the same key", key);
      console.warn(
        "When two fibers are found having same key the whole children will default to manual updates, which can be slower than with key based reconciliation"
      );
      updateNonListChildren(prev, next);
      return;
    }
    oldMap[String(key)] = { fiber: prev.props.children[i], index: i };
  }
  if (count == 0) {
    updateNonListChildren(prev, next);
    return;
  }
  const newMap = {};
  for (let i = 0; i < next.props.children.length; i++) {
    const key = next.props.children[i].props.key;
    if (key === null || key === void 0) {
      continue;
    }
    const oldFiber = oldMap[String(key)];
    if (oldFiber) {
      if (newMap.hasOwnProperty(String(key))) {
        console.warn("Found two children with the same key", key);
        console.warn(
          "When two fibers are found having same key the whole children will default to manual updates, which can be slower than with key based reconciliation"
        );
        updateNonListChildren(prev, next);
        return;
      }
      newMap[String(key)] = {
        fiber: oldFiber.fiber,
        newIndex: i,
        oldIndex: oldFiber.index
      };
    }
  }
  const parent = findNearestParentWithDom(prev);
  for (let i = 0; i < len; i++) {
    let prevChild = prev.props.children[i];
    let nextChild = next.props.children[i];
    const nextKey = (nextChild == null ? void 0 : nextChild.props.key) ? String(nextChild.props.key) : "";
    const isReused = newMap.hasOwnProperty(nextKey);
    let prevKey = (prevChild == null ? void 0 : prevChild.props.key) ? String(prevChild.props.key) : "";
    if (prevKey && nextKey && prevKey === nextKey) {
      updateNode(prevChild, nextChild, i);
      if (parent == null ? void 0 : parent.dom) applyFiber(prev.props.children[i], parent.dom);
      continue;
    }
    const isUsedLater = newMap.hasOwnProperty(prevKey) && newMap[prevKey].newIndex > i;
    const isUsedPreviously = newMap.hasOwnProperty(prevKey) && newMap[prevKey].newIndex < i;
    if (isUsedLater || isUsedPreviously) {
      ToCommitDeletion = false;
    }
    if (nextChild) nextChild.parent = prev;
    if (!prevChild && nextChild) {
      if (isReused) {
        const { fiber } = newMap[nextKey];
        prev.props.children.push(fiber);
        updateNode(fiber, nextChild, i);
        if (parent == null ? void 0 : parent.dom) applyFiber(prev.props.children[i], parent.dom);
      } else {
        if (parent == null ? void 0 : parent.dom)
          commitFiber(nextChild, void 0, false, false, parent.dom);
        prev.props.children.push(nextChild);
      }
    } else if (!nextChild && prevChild) {
      commitDeletion(prevChild, true);
      prev.props.children.splice(i, 1);
      len = prev.props.children.length;
      i--;
    } else {
      if (isReused) {
        const { fiber } = newMap[nextKey];
        commitDeletion(prevChild, true);
        ToCommitDeletion = true;
        prev.props.children[i] = fiber;
        updateNode(fiber, nextChild, i);
        if (parent == null ? void 0 : parent.dom) applyFiber(prev.props.children[i], parent.dom);
      } else {
        if (isUsedLater || isUsedPreviously) {
          if (parent == null ? void 0 : parent.dom)
            commitFiber(
              nextChild,
              void 0,
              false,
              false,
              parent.dom
            );
          prev.props.children[i] = nextChild;
        } else {
          updateNode(prevChild, nextChild, i);
          if (parent == null ? void 0 : parent.dom)
            applyFiber(prev.props.children[i], parent.dom);
          const newLen = Math.max(
            prev.props.children.length,
            next.props.children.length
          );
          if (newLen < len) {
            len = newLen;
            i--;
          }
        }
      }
    }
    ToCommitDeletion = true;
  }
}
if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
  module.exports = {
    createFiber,
    commitDeletion,
    commitFiber,
    updateFiber,
    deepCompareFibers,
    deepEqual
  };
}
let scheduled = false;
const batch = /* @__PURE__ */ new Set();
const depset = /* @__PURE__ */ new Set();
const reactiveFiberMap = /* @__PURE__ */ new WeakMap();
const domAttributeMap = /* @__PURE__ */ new WeakMap();
function batchUpdate(cb) {
  batch.add(cb);
  if (!scheduled) {
    scheduled = true;
    queueMicrotask(() => {
      batch.forEach((fn) => {
        const dep = fn();
        if (depset.has(dep)) {
          return;
        }
        depset.add(dep);
        if (dep.__cleanup && typeof dep.__cleanup === "function") {
          dep.__cleanup();
          dep.__cleanup = null;
        }
        const val = dep();
        if (typeof val === "function") {
          dep.__cleanup = val;
        }
        if (reactiveFiberMap.has(dep)) {
          const fiber = reactiveFiberMap.get(dep);
          if (fiber) {
            updateFiber(fiber, val);
          }
        }
        if (domAttributeMap.has(dep)) {
          const dom = domAttributeMap.get(dep);
          if (dom && dep.__propName) {
            updateDomProp(dep.__propName, dom, val);
          }
        }
      });
      depset.clear();
      batch.clear();
      scheduled = false;
    });
  }
}
function setReactiveFunction(fn, fiber) {
  reactiveFiberMap.set(fn, fiber);
}
function setReactiveAttributes(fn, dom) {
  domAttributeMap.set(fn, dom);
}
function clearReactiveAttributes(fn) {
  domAttributeMap.delete(fn);
  const signals = fn.__signals;
  if (signals) {
    for (const signal of signals) {
      signal.removeDep(fn);
    }
    fn.__signals = null;
  }
}
function clearReactiveFunction(fn) {
  reactiveFiberMap.delete(fn);
  const signals = fn.__signals;
  if (signals) {
    for (const signal of signals) {
      signal.removeDep(fn);
    }
    fn.__signals = null;
  }
}
let currentReactiveFunction = null;
let currentEffect = null;
function addSignalToReactiveFunction(signal) {
  if (!currentReactiveFunction.__signals) {
    currentReactiveFunction.__signals = /* @__PURE__ */ new Set();
  }
  currentReactiveFunction.__signals.add(signal);
}
function addSignalToEffect(signal) {
  if (!currentEffect.__signals) currentEffect.__signals = /* @__PURE__ */ new Set();
  currentEffect.__signals.add(signal);
}
function reactive(fn) {
  var _a;
  if (typeof fn !== "function")
    throw new Error("reactive takes a render function as the argument");
  currentReactiveFunction = fn;
  const retVal = fn();
  currentReactiveFunction = null;
  if (!isPrimitive(retVal) && isPlainObject(retVal) && !retVal.type && !retVal.props && !((_a = retVal.props) == null ? void 0 : _a.children))
    throw new Error(
      "Reactive value must be primitive or functional component, got: " + typeof retVal
    );
  return retVal;
}
function reactiveAttribute(fn) {
  if (typeof fn !== "function")
    throw new Error("reactive takes a render function as the argument");
  currentReactiveFunction = fn;
  const retVal = fn();
  currentReactiveFunction = null;
  return retVal;
}
function createEffect(fn) {
  if (typeof fn !== "function")
    throw new Error("createEffect takes a effect function as the argument");
  addEffect(fn);
  if (!getCurrentFC()) runEffect(fn);
}
function runEffect(effect, fiber) {
  if (typeof effect !== "function") return;
  currentEffect = effect;
  const effectCleanup = effect();
  if (currentEffect.__signals && typeof effectCleanup === "function") {
    currentEffect.__cleanup = effectCleanup;
  }
  if (!currentEffect.__signals && effectCleanup && typeof effectCleanup === "function") {
    if (!fiber) {
      cleanUp(effectCleanup);
    } else {
      cleanUpWFiber(effectCleanup, fiber);
    }
  }
  currentEffect = null;
}
function computed(fn) {
  if (typeof fn !== "function")
    throw new Error("computed takes a function as the argument");
  let firstRun = getCurrentFC() !== null;
  currentEffect = () => {
    if (firstRun) {
      firstRun = false;
      return;
    }
    signal.update(fn());
  };
  addEffect(currentEffect);
  const val = fn();
  const signal = createSignal(val);
  currentEffect = null;
  return {
    get value() {
      return signal.value;
    }
  };
}
function createPromise(fn) {
  if (typeof fn !== "function")
    throw new Error("createPromise takes a function as the argument");
  const promise = fn();
  if (!(promise instanceof Promise)) {
    throw new Error(
      "createPromise takes a function that returns a promise"
    );
  }
  const triggerSignal = createSignal({
    status: "pending",
    data: null,
    error: null
  });
  promise.then((val) => {
    triggerSignal.update((prev) => {
      prev.data = val;
      prev.status = "resolved";
    });
  }).catch((err) => {
    triggerSignal.update((prev) => {
      prev.error = err;
      prev.status = "rejected";
    });
  });
  return {
    get value() {
      return triggerSignal.value;
    }
  };
}
class Ref {
  constructor(val) {
    this.current = val;
  }
}
function createRef() {
  const ref = new Ref(null);
  return ref;
}
const MutatingMethods = [
  "push",
  "pop",
  "unshift",
  "shift",
  "splice",
  "fill",
  "copyWithin",
  "sort",
  "reverse"
];
class BaseSignal {
  constructor(val) {
    this.isNotified = false;
    this._val = val;
    this.deps = /* @__PURE__ */ new Set();
  }
  notify() {
    if (this.isNotified) return;
    if (this.deps.size !== 0) this.isNotified = true;
    this.deps.forEach((dep) => {
      batchUpdate(() => {
        this.isNotified = false;
        return dep;
      });
    });
  }
  removeDep(fn) {
    this.deps.delete(fn);
  }
  clearDeps() {
    this.deps.clear();
  }
}
class PrimitiveSignal extends BaseSignal {
  constructor(val) {
    if (!isPrimitive(val)) {
      throw new Error(
        "Invalid type for PrimitiveSignal. Valid types: [boolean, string, number, undefined, null]"
      );
    }
    super(val);
  }
  get value() {
    if (currentEffect) {
      this.deps.add(currentEffect);
      addSignalToEffect(this);
    }
    if (currentReactiveFunction) {
      this.deps.add(currentReactiveFunction);
      addSignalToReactiveFunction(this);
    }
    return this._val;
  }
  update(val) {
    if (typeof val === "function") {
      const newVal = val(this._val);
      if (!isPrimitive(newVal)) {
        throw new Error(
          "Invalid type for PrimitiveSignal. Valid types: [boolean, string, number, undefined, null]"
        );
      }
      if (newVal === this._val) return;
      this._val = newVal;
      this.notify();
    } else {
      if (!isPrimitive(val)) {
        throw new Error(
          "Invalid type for PrimitiveSignal. Valid types: [boolean, string, number, undefined, null]"
        );
      }
      if (val === this._val) return;
      this._val = val;
      this.notify();
    }
  }
}
class ArraySignal extends BaseSignal {
  constructor(val) {
    if (!Array.isArray(val)) {
      throw new Error(
        "Invalid type for ArraySignal; value must be an array"
      );
    }
    super(val);
    this.updateCalled = false;
    this._val = this.createProxy(val);
  }
  createProxy(val) {
    return new Proxy(val, {
      get: (target, prop) => {
        const value = target[prop];
        if (typeof value === "function") {
          if (MutatingMethods.includes(String(prop)) && !this.updateCalled) {
            throw new Error(
              "Cannot set a value on an array signal, use the update method for updating the array."
            );
          }
          return (...args) => {
            const result = value.apply(target, args);
            if (MutatingMethods.includes(String(prop))) {
              this.notify();
            }
            return result;
          };
        }
        return value;
      },
      set: (target, prop, newValue) => {
        if (!this.updateCalled) {
          throw new Error(
            "Cannot set a value on an array signal, use the update method for updating the array."
          );
        }
        target[prop] = newValue;
        this.notify();
        return true;
      }
    });
  }
  get value() {
    if (currentEffect) {
      this.deps.add(currentEffect);
      addSignalToEffect(this);
    }
    if (currentReactiveFunction) {
      this.deps.add(currentReactiveFunction);
      addSignalToReactiveFunction(this);
    }
    return this._val;
  }
  update(val) {
    this.updateCalled = true;
    if (typeof val === "function") {
      val(this._val);
    } else {
      if (!Array.isArray(val)) {
        throw new Error(
          "Invalid type for ArraySignal; value must be an array"
        );
      }
      if (val === this._val) return;
      this._val = this.createProxy(val);
      this.notify();
    }
    this.updateCalled = false;
  }
}
class ObjectSignal extends BaseSignal {
  constructor(val) {
    if (!isPlainObject(val)) {
      throw new Error(
        "Invalid type for ObjectSignal; value must be a plain object"
      );
    }
    super(val);
    this.updateCalled = false;
    this._val = this.createProxy(val);
  }
  createInternalArrayProxy(val) {
    return new Proxy(val, {
      get: (target, prop) => {
        const value = target[prop];
        if (typeof value === "function") {
          if (!this.updateCalled && MutatingMethods.includes(String(prop))) {
            throw new Error(
              "Cannot set a value on an object signal, use the update method for updating the object."
            );
          }
          return (...args) => {
            const result = value.apply(target, args);
            if (MutatingMethods.includes(String(prop))) {
              this.notify();
            }
            return result;
          };
        }
        return value;
      },
      set: (target, prop, newValue) => {
        if (!this.updateCalled) {
          throw new Error(
            "Cannot set a value on an object signal, use the update method for updating the object."
          );
        }
        target[prop] = newValue;
        this.notify();
        return true;
      }
    });
  }
  createProxy(val) {
    return new Proxy(val, {
      get: (target, prop) => {
        const value = target[prop];
        if (Array.isArray(value)) {
          target[prop] = this.createInternalArrayProxy(value);
          return target[prop];
        }
        return value;
      },
      set: (target, prop, newValue) => {
        if (!this.updateCalled) {
          throw new Error(
            "Cannot set a value on an object signal, use the update method for updating the object."
          );
        }
        if (typeof newValue === "function") return false;
        if (typeof newValue === "object" && newValue !== null) {
          newValue = this.createProxy(newValue);
        }
        if (newValue === target[prop]) return true;
        target[prop] = newValue;
        this.notify();
        return true;
      },
      deleteProperty: (target, prop) => {
        const result = delete target[prop];
        this.notify();
        return result;
      }
    });
  }
  get value() {
    if (currentEffect) {
      this.deps.add(currentEffect);
      addSignalToEffect(this);
    }
    if (currentReactiveFunction) {
      this.deps.add(currentReactiveFunction);
      addSignalToReactiveFunction(this);
    }
    return this._val;
  }
  update(val) {
    this.updateCalled = true;
    if (typeof val === "function") {
      val(this._val);
    } else {
      if (!isPlainObject(val)) {
        throw new Error(
          "Invalid type for ObjectSignal; value must be a plain object"
        );
      }
      if (val === this._val) return;
      this._val = this.createProxy(val);
      this.notify();
    }
    this.updateCalled = false;
  }
}
function createSignal(val) {
  if (typeof val === "function") {
    throw new Error("Functions cannot be used as signal value");
  }
  if (typeof val === "object" && val !== null) {
    if (Array.isArray(val)) {
      const signal = new ArraySignal(val);
      addSignal(signal);
      return {
        get value() {
          return signal.value;
        },
        update: signal.update.bind(signal)
      };
    } else if (isPlainObject(val)) {
      const signal = new ObjectSignal(val);
      addSignal(signal);
      return {
        get value() {
          return signal.value;
        },
        update: signal.update.bind(signal)
      };
    } else {
      throw new Error(
        "Invalid type for signal initialization: " + typeof val
      );
    }
  } else if (isPrimitive(val)) {
    const signal = new PrimitiveSignal(val);
    addSignal(signal);
    return {
      get value() {
        return signal.value;
      },
      update: signal.update.bind(signal)
    };
  } else {
    throw new Error(
      "Invalid type for signal initialization: " + typeof val
    );
  }
}
let currentFC = null;
let fcMap = /* @__PURE__ */ new WeakMap();
function setCurrentFC(fc) {
  currentFC = fc;
}
function clearCurrentFC() {
  currentFC = null;
}
function getCurrentFC() {
  return currentFC;
}
function runAllEffects(FC) {
  if (fcMap.has(FC)) {
    const fcData = fcMap.get(FC);
    for (const effect of fcData.effects) {
      runEffect(effect, FC);
    }
  }
}
function cleanUp(fn) {
  if (currentFC) {
    if (fcMap.has(currentFC)) {
      const fcData = fcMap.get(currentFC);
      fcData.cleanup.push(fn);
    } else {
      fcMap.set(currentFC, {
        signals: /* @__PURE__ */ new Set(),
        cleanup: [fn],
        effects: /* @__PURE__ */ new Set()
      });
    }
  }
}
function cleanUpWFiber(fn, fiber) {
  if (fiber) {
    if (fcMap.has(fiber)) {
      const fcData = fcMap.get(fiber);
      fcData.cleanup.push(fn);
    } else {
      fcMap.set(fiber, {
        signals: /* @__PURE__ */ new Set(),
        cleanup: [fn],
        effects: /* @__PURE__ */ new Set()
      });
    }
  }
}
function addEffect(fn) {
  if (currentFC) {
    if (fcMap.has(currentFC)) {
      const fcData = fcMap.get(currentFC);
      fcData.effects.add(fn);
    } else {
      const effects = /* @__PURE__ */ new Set();
      effects.add(fn);
      fcMap.set(currentFC, {
        signals: /* @__PURE__ */ new Set(),
        cleanup: [],
        effects
      });
    }
  }
}
function addSignal(signal) {
  if (currentFC) {
    if (fcMap.has(currentFC)) {
      const fcData = fcMap.get(currentFC);
      fcData.signals.add(signal);
    } else {
      const signals = /* @__PURE__ */ new Set();
      signals.add(signal);
      fcMap.set(currentFC, {
        signals,
        cleanup: [],
        effects: /* @__PURE__ */ new Set()
      });
    }
  }
}
function cleanUpFC(currentFC2, props) {
  const fcData = fcMap.get(currentFC2);
  if (fcData) {
    if (fcData.cleanup) {
      for (const fn of fcData.cleanup) {
        fn();
      }
    }
    fcData.cleanup = [];
    for (const effect of fcData.effects) {
      if (effect.__cleanup && typeof effect.__cleanup === "function") {
        effect.__cleanup();
      }
      if (effect.__signals) {
        for (const signal of effect.__signals) {
          signal.removeDep(effect);
        }
      }
      delete effect.__signals;
      delete effect.__cleanup;
    }
    fcData.signals.forEach((signal) => signal.clearDeps());
    fcData.signals.clear();
  }
  fcMap.delete(currentFC2);
}
function lazy(importFn) {
  let Component = null;
  const load = (loading, error) => {
    if (!Component) {
      importFn().then((mod) => {
        if (mod.default) {
          if (typeof mod.default !== "function") {
            throw new Error(
              "Lazy-loaded component must be a functional component"
            );
          }
          Component = mod.default;
          loading.update(false);
          error.update(null);
        } else {
          error.update(
            new Error(
              "No default export found from lazy-loaded module"
            )
          );
        }
      }).catch((err) => {
        error.update(err);
        loading.update(false);
      });
    } else {
      loading.update(false);
      error.update(null);
    }
  };
  return (props) => {
    const loading = createSignal(true);
    const error = createSignal(null);
    load(loading, error);
    const isValidNode = (val) => typeof val === "string" || val && typeof val === "object" && "props" in val && "type" in val;
    if (props.fallback !== void 0 && !isValidNode(props.fallback)) {
      throw new Error(
        "Invalid fallback: Expected a string or a valid JSX node."
      );
    }
    if (props.errorFallback !== void 0 && !(typeof props.errorFallback === "function" || isValidNode(props.errorFallback))) {
      throw new Error(
        "Invalid errorFallback: Expected a string, a valid JSX node, or a function returning a JSX node."
      );
    }
    return /* @__PURE__ */ createElement("FRAGMENT", null, () => loading.value ? props.fallback : error.value !== null ? props.errorFallback ? typeof props.errorFallback === "function" ? props.errorFallback(error.value) : props.errorFallback : "Unknown error occurred while lazy loading component, use errorFallback prop to override" : (
      // @ts-expect-error
      Component && /* @__PURE__ */ createElement(Component, { ...props })
    ));
  };
}
export {
  cleanUp,
  computed,
  createEffect,
  createElement,
  createPromise,
  createRef,
  createSignal,
  lazy,
  render
};
//# sourceMappingURL=refract.es.js.map
