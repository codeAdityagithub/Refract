let p = null, w = /* @__PURE__ */ new WeakMap();
function fe(e) {
  p = e;
}
function ue() {
  p = null;
}
function Ke(e) {
  if (p)
    if (w.has(p)) {
      const t = w.get(p);
      if (t.cleanup)
        throw new Error(
          "A Functional Component can only have one cleanup function"
        );
      t.cleanup = e;
    } else
      w.set(p, {
        signals: /* @__PURE__ */ new Set(),
        cleanup: e,
        effects: /* @__PURE__ */ new Set()
      });
}
function pe(e) {
  if (p)
    if (w.has(p))
      w.get(p).effects.add(e);
    else {
      const t = /* @__PURE__ */ new Set();
      t.add(e), w.set(p, {
        signals: /* @__PURE__ */ new Set(),
        cleanup: null,
        effects: t
      });
    }
}
function $(e) {
  if (p)
    if (w.has(p))
      w.get(p).signals.add(e);
    else {
      const t = /* @__PURE__ */ new Set();
      t.add(e), w.set(p, {
        signals: t,
        cleanup: null,
        effects: /* @__PURE__ */ new Set()
      });
    }
}
function Ee(e, t) {
  const n = w.get(e);
  if (n) {
    n.cleanup && n.cleanup(), n.cleanup = null;
    for (const r of n.effects) {
      if (r.__signals && Array.isArray(r.__signals))
        for (const o of r.__signals)
          o.removeDep(r);
      delete r.__signals;
    }
    n.signals.forEach((r) => r.clearDeps()), n.signals.clear();
  }
  w.delete(e);
}
function N(e) {
  return typeof e == "object" && // Must be an object
  e !== null && // Cannot be null
  !Array.isArray(e) && // Cannot be an array
  Object.prototype.toString.call(e) === "[object Object]";
}
function _(e) {
  return ["boolean", "string", "number", "undefined"].includes(typeof e) || e === null || e instanceof Error;
}
function B(e) {
  return Object.entries(e).map(([t, n]) => `${t.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${n};`).join(" ");
}
function v(e) {
  const t = {};
  for (const [n, r] of Object.entries(e)) {
    if (typeof r == "object" && r !== null) {
      console.warn(`Nested styles not allowed for ${n}`);
      continue;
    }
    r == null || r === !1 || r === "" || (t[n] = r);
  }
  return t;
}
function x(e) {
  return N(e) || typeof e == "string";
}
let y = null, d = null;
function ne(e) {
  y.__signals ? y.__signals.push(e) : y.__signals = [e];
}
function re(e) {
  d.__signals ? d.__signals.push(e) : d.__signals = [e];
}
function Fe(e) {
  var n;
  if (typeof e != "function")
    throw new Error("reactive takes a render function as the argument");
  y = e;
  const t = e();
  if (y = null, !_(t) && N(t) && !t.type && !t.props && !((n = t.props) != null && n.children))
    throw new Error(
      "Reactive value must be primitive or functional component, got: " + typeof t
    );
  return t;
}
function Se(e) {
  if (typeof e != "function")
    throw new Error("reactive takes a render function as the argument");
  y = e;
  const t = e();
  return y = null, t;
}
function Ue(e) {
  if (typeof e != "function")
    throw new Error("createEffect takes a effect function as the argument");
  d = e, pe(e);
  const t = e();
  typeof t == "function" && Le(t), d = null;
}
function ze(e) {
  if (typeof e != "function")
    throw new Error("computed takes a function as the argument");
  d = () => {
    n.value = e();
  }, pe(d);
  const t = e(), n = W(t);
  return d = null, n;
}
function $e(e) {
  if (typeof e != "function")
    throw new Error("createPromise takes a function as the argument");
  const t = e();
  if (!(t instanceof Promise))
    throw new Error(
      "createPromise takes a function that returns a promise"
    );
  const n = W({
    status: "pending",
    data: null,
    error: null
  });
  return t.then((r) => {
    n.value.data = r, n.value.status = "resolved";
  }).catch((r) => {
    n.value.error = r, n.value.status = "rejected";
  }), n;
}
class oe {
  constructor(t) {
    this.current = t;
  }
}
function qe() {
  return new oe(null);
}
const de = [
  "concat",
  "every",
  "filter",
  "find",
  "findIndex",
  "flat",
  "flatMap",
  "forEach",
  "includes",
  "indexOf",
  "join",
  "map",
  "reduce",
  "reduceRight",
  "slice",
  "some",
  "toLocaleString",
  "toString"
];
class C {
  constructor(t) {
    this.isNotified = !1, this._val = t, this.deps = /* @__PURE__ */ new Set();
  }
  notify() {
    this.isNotified || (this.isNotified = !0, this.deps.forEach(
      (t) => Ne(() => (this.isNotified = !1, t))
    ));
  }
  removeDep(t) {
    this.deps.delete(t);
  }
  clearDeps() {
    this.deps.clear();
  }
}
class ke extends C {
  constructor(t) {
    if (!_(t))
      throw new Error(
        "Invalid type for PrimitiveSignal. Valid types: [boolean, string, number, undefined, null]"
      );
    super(t);
  }
  get value() {
    return d && (this.deps.add(d), re(this)), y && (this.deps.add(y), ne(this)), this._val;
  }
  set value(t) {
    if (!_(t))
      throw new Error(
        "Invalid type for PrimitiveSignal. Valid types: [boolean, string, number, undefined, null]"
      );
    t !== this._val && (this._val = t, this.notify());
  }
}
class _e extends C {
  constructor(t) {
    if (!Array.isArray(t))
      throw new Error(
        "Invalid type for ArraySignal; value must be an array"
      );
    super(t), this._val = this.createProxy(t);
  }
  createProxy(t) {
    return new Proxy(t, {
      get: (n, r) => {
        const o = n[r];
        return typeof o == "function" ? (...i) => {
          const s = o.apply(n, i);
          return de.includes(String(r)) || this.notify(), s;
        } : o;
      },
      set: (n, r, o) => (n[r] = o, this.notify(), !0)
    });
  }
  get value() {
    return d && (this.deps.add(d), re(this)), y && (this.deps.add(y), ne(this)), this._val;
  }
  set value(t) {
    if (!Array.isArray(t))
      throw new Error(
        "Invalid type for ArraySignal; value must be an array"
      );
    t !== this._val && (this._val = this.createProxy(t), this.notify());
  }
}
class Ae extends C {
  constructor(t) {
    if (!N(t))
      throw new Error(
        "Invalid type for ObjectSignal; value must be a plain object"
      );
    super(t), this._val = this.createProxy(t);
  }
  createInternalArrayProxy(t) {
    return new Proxy(t, {
      get: (n, r) => {
        const o = n[r];
        return typeof o == "function" ? (...i) => {
          const s = o.apply(n, i);
          return de.includes(String(r)) || this.notify(), s;
        } : o;
      },
      set: (n, r, o) => (n[r] = o, this.notify(), !0)
    });
  }
  createProxy(t) {
    return new Proxy(t, {
      get: (n, r) => {
        const o = n[r];
        return Array.isArray(o) ? (n[r] = this.createInternalArrayProxy(o), n[r]) : o;
      },
      set: (n, r, o) => typeof o == "function" ? !1 : (typeof o == "object" && o !== null && (o = this.createProxy(o)), o === n[r] || (n[r] = o, this.notify()), !0),
      deleteProperty: (n, r) => {
        const o = delete n[r];
        return this.notify(), o;
      }
    });
  }
  get value() {
    return d && (this.deps.add(d), re(this)), y && (this.deps.add(y), ne(this)), this._val;
  }
  set value(t) {
    if (!N(t))
      throw new Error(
        "Invalid type for ObjectSignal; value must be a plain object"
      );
    t !== this._val && (this._val = this.createProxy(t), this.notify());
  }
}
function W(e) {
  if (typeof e == "function")
    throw new Error("Functions cannot be used as signal value");
  if (typeof e == "object" && e !== null)
    if (Array.isArray(e)) {
      const t = new _e(e);
      return $(t), t;
    } else if (N(e)) {
      const t = new Ae(e);
      return $(t), t;
    } else
      throw new Error(
        "Invalid type for signal initialization: " + typeof e
      );
  else if (_(e)) {
    const t = new ke(e);
    return $(t), t;
  } else
    throw new Error(
      "Invalid type for signal initialization: " + typeof e
    );
}
const E = Symbol("FRAGMENT");
function ie(e, t, ...n) {
  if (e === "FRAGMENT") {
    const r = P(n);
    return r[E] = !0, r;
  }
  return {
    type: e,
    props: {
      ...t,
      children: P(n)
    }
  };
}
function P(e) {
  return e.map((t) => {
    if (typeof t == "object") {
      if (Array.isArray(t))
        return P(t);
      if (t === null)
        return b("");
      if (!t.type || !t.props)
        throw new Error(
          "Invalid type for a dom node, found " + t
        );
      return t;
    } else if (typeof t == "function") {
      const n = Fe(t);
      if (_(n))
        return q(
          "TEXT_CHILD",
          {
            nodeValue: n != null && n !== !1 ? String(n) : "",
            children: []
          },
          t
        );
      if (Array.isArray(n)) {
        const r = n[E];
        return q(
          "FRAGMENT",
          { children: r ? n : P(n) },
          t
        );
      } else if (!n.type || !n.props)
        throw new Error(
          "Invalid type for a dom node, found " + n
        );
      return q(n.type, n.props, t);
    } else
      return b(t);
  }).flat();
}
function b(e) {
  return {
    type: "TEXT_CHILD",
    props: {
      nodeValue: e != null && e !== !1 ? String(e) : "",
      children: []
    }
  };
}
function q(e, t, n) {
  return {
    type: e,
    renderFunction: n,
    props: t
  };
}
function Te(e) {
  return e !== "children" && e !== "key" && e !== "ref";
}
function he(e) {
  const t = e.type === "TEXT_CHILD" ? document.createTextNode("") : (
    // @ts-expect-error
    document.createElement(e.type)
  );
  return e.props && (e.props.ref && e.props.ref instanceof oe && t instanceof HTMLElement && (e.props.ref.current = t), Object.keys(e.props).filter(Te).forEach((n) => {
    if (n.startsWith("on") && typeof e.props[n] == "function")
      t.addEventListener(
        n.slice(2).toLowerCase(),
        e.props[n]
      );
    else if (typeof e.props[n] == "function" && !n.startsWith("on")) {
      const r = e.props[n];
      r.__propName = n;
      const o = Se(r);
      if (o == null || o === !1)
        return;
      if (n === "style" && typeof o != "string" && t instanceof HTMLElement) {
        if (!x(o))
          throw new Error(
            "Style attribute must be a plain object or a string"
          );
        const i = v(o);
        t.setAttribute(
          "style",
          B(i)
        );
      } else
        t instanceof HTMLElement && (n in t || n.startsWith("data-")) ? t.setAttribute(
          n === "className" ? "class" : n,
          String(o)
        ) : t[n] = String(o);
      r.__signals && Pe(r, t);
    } else {
      if (e.props[n] === null || e.props[n] === void 0 || e.props[n] === !1)
        return;
      if (n === "style" && typeof e.props[n] != "string" && t instanceof HTMLElement) {
        const r = e.props[n];
        if (!x(r))
          throw new Error(
            "Style attribute must be a plain object or a string"
          );
        const o = v(r);
        t.setAttribute(
          "style",
          B(o)
        );
      } else
        t instanceof HTMLElement && (n in t || n.startsWith("data-")) ? t.setAttribute(
          n === "className" ? "class" : n,
          String(e.props[n])
        ) : t[n] = String(e.props[n]);
    }
  })), t;
}
function Me(e, t, n) {
  if (!(n == null || n === !1 || e === "key"))
    if (e === "style" && typeof n != "string" && t instanceof HTMLElement) {
      if (!x(n))
        throw new Error(
          "Style attribute must be a plain object or a string"
        );
      const r = v(n);
      t.setAttribute("style", B(r));
    } else
      t instanceof HTMLElement && (e in t || e.startsWith("data-")) ? (e === "className" && (e = "class"), t.setAttribute(e, String(n))) : t[e] = String(n);
}
let J = !1;
const Y = /* @__PURE__ */ new Set(), Z = /* @__PURE__ */ new Set(), j = /* @__PURE__ */ new WeakMap(), X = /* @__PURE__ */ new WeakMap(), G = [];
function Le(e) {
  G.push(e);
}
function Ne(e) {
  Y.add(e), J || (J = !0, queueMicrotask(() => {
    G.forEach((t) => t()), G.length = 0, Y.forEach((t) => {
      const n = t();
      if (Z.has(n))
        return;
      Z.add(n);
      const r = n();
      if (typeof r == "function" && G.push(r), j.has(n)) {
        const o = j.get(n);
        o && ge(o, r);
      }
      if (X.has(n)) {
        const o = X.get(n);
        o && n.__propName && Me(n.__propName, o, r);
      }
    }), Z.clear(), Y.clear(), J = !1;
  }));
}
function Ce(e, t) {
  j.set(e, t);
}
function Pe(e, t) {
  X.set(e, t);
}
function Re(e) {
  X.delete(e);
  const t = e.__signals;
  if (t && Array.isArray(t)) {
    for (const n of t)
      n.removeDep(e);
    e.__signals = null;
  }
}
function Ie(e) {
  j.delete(e);
  const t = e.__signals;
  if (t && Array.isArray(t)) {
    for (const n of t)
      n.removeDep(e);
    e.__signals = null;
  }
}
function Je(e, t) {
  ee = t;
  const n = document.createDocumentFragment();
  te = n;
  const r = {
    type: "div",
    props: {
      children: [e]
    },
    // @ts-expect-error
    dom: n
  };
  e.parent = r, k.push(e), requestIdleCallback(ye);
}
function Oe() {
  if (te && ee) {
    ee.appendChild(te);
    const e = performance.now();
    console.log(`Render time: ${e - R}ms`);
  }
}
let k = [], ee = null, te = null, R = -1;
function ye(e) {
  R === -1 && (R = performance.now());
  let t = !1;
  for (; k.length > 0 && !t; ) {
    const n = k.pop();
    De(n), t = e.timeRemaining() < 1;
  }
  if (k.length == 0) {
    Oe();
    return;
  }
  requestIdleCallback(ye);
}
function De(e) {
  var t;
  if (e.type === "FRAGMENT") {
    const n = !e.props.children[E];
    let r = !1;
    for (let o = e.props.children.length - 1; o >= 0; o--)
      e.props.children[o].parent = e, n && e.props.children[o].props.key === void 0 && e.renderFunction && (r = !0), k.push(e.props.children[o]);
    r && console.error("Array children must have a key attribute");
  } else if (typeof e.type == "function") {
    fe(e);
    const n = e.type(e.props);
    if (ue(), Array.isArray(n)) {
      for (let r = n.length - 1; r >= 0; r--)
        n[r].parent = e, k.push(n[r]);
      e.props.children = n;
    } else
      n.parent = e, e.props.children.push(n), k.push(n);
  } else {
    e.dom || (e.dom = he(e));
    let n = e.parent;
    for (; n && !n.dom; )
      n = n.parent;
    n && ((t = n.dom) == null || t.appendChild(e.dom));
    for (let r = e.props.children.length - 1; r >= 0; r--)
      e.props.children[r].parent = e, k.push(e.props.children[r]);
  }
  U(e);
}
function A(e) {
  if (e.type === "FRAGMENT")
    if (e.props.children[E])
      for (const n of e.props.children)
        n.parent = e, A(n);
    else {
      let n = !1;
      for (const r of e.props.children)
        r.parent = e, r.props.key === void 0 && (n = !0), A(r);
      n && console.error("Array children must have a key attribute");
    }
  else if (typeof e.type != "function")
    for (const t of e.props.children)
      t.parent = e, A(t);
  U(e);
}
function h(e, t, n, r, o) {
  if (e.type === "FRAGMENT")
    for (const i of e.props.children)
      r && (i.parent = e), h(
        i,
        t,
        n,
        r,
        o
      );
  else if (typeof e.type == "function") {
    fe(e);
    const i = e.type(e.props);
    if (ue(), Array.isArray(i)) {
      for (const s of i)
        s.parent = e, h(s, t, n, !0, o);
      e.props.children = i;
    } else
      i.parent = e, e.props.children.push(i), h(i, t, n, !0, o);
  } else {
    e.dom || (e.dom = he(e));
    let i;
    if (o)
      i = o;
    else {
      let s = e.parent;
      for (; s && !s.dom; )
        s = s.parent;
      i = s == null ? void 0 : s.dom;
    }
    t ? n ? i == null || i.replaceChild(e.dom, t) : i == null || i.insertBefore(e.dom, t) : i == null || i.appendChild(e.dom);
    for (const s of e.props.children)
      r && (s.parent = e), h(s, void 0, void 0, r, e.dom);
  }
  r && U(e);
}
let H = !0;
function m(e, t) {
  if (!(!e || !H)) {
    if (e.renderFunction && (t && Ie(e.renderFunction), delete e.renderFunction), e.dom) {
      for (const n of Object.keys(e.props))
        if (K(n)) {
          const r = n.toLowerCase().substring(2);
          e.dom.removeEventListener(r, e.props[n]), delete e.props[n];
        } else typeof e.props[n] == "function" ? Re(e.props[n]) : n === "ref" && e.props[n] instanceof oe && (e.props[n].current = null);
      e.dom.remove();
    }
    typeof e.type == "function" && (Ee(e, e.props), delete e.type), e.props.children.forEach((n) => m(n, !0));
  }
}
function U(e) {
  e.renderFunction && Ce(e.renderFunction, e);
}
function ge(e, t) {
  if (R = performance.now(), _(t)) {
    const r = {
      ...b(t),
      parent: e.parent
    };
    A(r), F(e, r);
  } else if (Array.isArray(t)) {
    const o = {
      type: "FRAGMENT",
      props: {
        children: t[E] ? t : P(t)
      },
      parent: e.parent
    };
    A(o), F(e, o);
  } else {
    const r = { ...t, parent: e.parent };
    A(r), F(e, r);
  }
  const n = performance.now();
  console.log("Update Time:", (n - R).toFixed(2), "ms");
}
function O(e, t) {
  e.renderFunction && (t.renderFunction = e.renderFunction, U(t));
}
function D(e, t, n) {
  var r;
  if (n !== void 0) {
    e.parent.props.children[n] = t;
    return;
  }
  (r = e.parent) == null || r.props.children.forEach((o, i) => {
    o === e && (e.parent.props.children[i] = t);
  });
}
const K = (e) => e.startsWith("on"), le = (e) => e !== "children" && !K(e) && e !== "key" && e !== "ref", Q = (e, t, n) => e[n] !== t[n], Ge = (e, t, n) => !(n in t);
function me(e, t) {
  var n, r;
  return e === t ? !0 : e.type !== t.type || ((n = e.props) == null ? void 0 : n.key) !== ((r = t.props) == null ? void 0 : r.key) ? !1 : L(e.props, t.props);
}
function L(e, t) {
  if (e === t) {
    if (e instanceof C && t instanceof C)
      return L(e.value, t.value);
    if (Array.isArray(e) && Array.isArray(t)) {
      if (e.length !== t.length) return !1;
      for (let o = 0; o < e.length; o++)
        if (!L(e[o], t[o])) return !1;
    }
    return !0;
  }
  if (_(e) && _(t))
    return e === t;
  if (typeof e != typeof t) return !1;
  const n = Object.keys(e), r = Object.keys(t);
  if (n.length !== r.length) return !1;
  for (let o of n)
    if (o !== "children" && (!r.includes(o) || !L(e[o], t[o])))
      return !1;
  return !0;
}
function we(e) {
  if (e) {
    if (e.dom) return e.dom;
    for (const t of e.props.children) {
      const n = we(t);
      if (n) return n;
    }
  }
}
function se(e) {
  if (e) {
    if (e.dom) return e.dom;
    for (let t = e.props.children.length - 1; t >= 0; t--) {
      const n = e.props.children[t], r = se(n);
      if (r) return r;
    }
  }
}
function He(e) {
  if (e)
    for (let t = e.props.children.length - 1; t >= 0; t--) {
      const n = e.props.children[t], r = se(n);
      if (r) return r;
    }
}
function We(e) {
  if (!e) return;
  let t = e.parent;
  for (; t && !t.dom; )
    t = t.parent;
  return t;
}
function je(e) {
  if (!e) return;
  if (e.dom) return e;
  let t = e.parent;
  for (; t && !t.dom; )
    t = t.parent;
  return t;
}
function F(e, t, n) {
  if (!(!e && !t)) {
    if (e && !t)
      m(e, !0), e.parent.props.children = e.parent.props.children.filter(
        (r) => r !== e
      );
    else if (e && t) {
      const r = e.props, o = t.props;
      if (e.type === "FRAGMENT" || typeof e.type == "function")
        if (t.type === "FRAGMENT" || typeof t.type == "function")
          typeof e.type == typeof t.type && typeof e.type == "function" ? me(e, t) || (h(t, we(e), void 0, !0), O(e, t), m(e), D(e, t, n)) : ce(e, t);
        else {
          t.parent = e.parent;
          let i = e.props.children[0];
          for (; i && !i.dom; )
            i = i.props.children[0];
          h(t, i == null ? void 0 : i.dom), O(e, t), m(e), D(e, t, n);
        }
      else {
        const i = e.dom;
        if (e.type === "TEXT_CHILD" && t.type === "TEXT_CHILD" && !t.dom && (t.dom = e.dom), i === void 0) {
          console.error("no node found", e, t);
          return;
        }
        if (t.type === "FRAGMENT" || typeof t.type == "function")
          t.parent = e.parent, O(e, t), h(t, i), m(e), D(e, t, n);
        else {
          for (const s of Object.keys(r))
            if (le(s) && Ge(r, o, s))
              i[s] = "";
            else if (K(s) && (!(s in o) || Q(r, o, s))) {
              const l = s.toLowerCase().substring(2);
              i.removeEventListener(l, r[s]);
            }
          if (e.type !== t.type)
            t.parent = e.parent, O(e, t), h(t, i, !0), m(e), D(e, t, n);
          else {
            for (const s of Object.keys(o))
              if (le(s) && Q(r, o, s))
                i[s] = o[s], r[s] = o[s];
              else if (K(s) && Q(r, o, s)) {
                const l = s.toLowerCase().substring(2);
                i.addEventListener(l, o[s]), r[s] = o[s];
              }
            ce(e, t);
          }
        }
      }
    }
  }
}
function Xe(e, t) {
  var a, S;
  const n = e.props.children, r = t.props.children, o = {};
  for (let f = 0; f < n.length; f++) {
    const u = n[f].props.key;
    if (u == null || o.hasOwnProperty(String(u)))
      return !1;
    o[String(u)] = n[f];
  }
  const i = (a = He(e)) == null ? void 0 : a.nextSibling, s = We(e), l = document.createDocumentFragment();
  if (r.length === 0) {
    e.props.children.length = 0, (s == null ? void 0 : s.dom) instanceof HTMLElement && (s.dom.innerHTML = "");
    return;
  }
  const c = e.props.children.length;
  for (let f = 0; f < r.length; f++) {
    const u = r[f], I = u.props.key, T = String(I);
    if (o.hasOwnProperty(T)) {
      const g = o[T];
      c > f ? e.props.children[f] = g : e.props.children.push(g), delete o[T];
      const z = t.props.children[f];
      z && (z.parent = e), F(g, z, f), M(e.props.children[f], l, i);
    } else
      c > f ? e.props.children[f] = u : e.props.children.push(u), u.parent = e, h(u, i, !1, !1, l);
  }
  for (const f in o)
    if (o.hasOwnProperty(f)) {
      const u = o[f];
      m(u, !0);
    }
  for (; e.props.children.length > t.props.children.length; )
    e.props.children.pop();
  (S = s == null ? void 0 : s.dom) == null || S.appendChild(l);
}
function M(e, t, n) {
  if (e.dom) {
    if (e.dom === t || e.dom === n) return;
    n ? t.insertBefore(e.dom, n) : t.appendChild(e.dom);
  } else
    for (const r of e.props.children)
      M(r, t, n);
}
function ce(e, t) {
  const n = t.type === "FRAGMENT" && !t.props.children[E], r = e.type === "FRAGMENT" && !e.props.children[E];
  n && r ? Xe(e, t) === !1 && ae(e, t) : ae(e, t), t.type === "FRAGMENT" && t.props.children[E] ? e.props.children[E] = !0 : e.props.children[E] = !1, e.type = t.type;
}
function V(e, t) {
  var r;
  let n = Math.max(e.props.children.length, t.props.children.length);
  for (let o = 0; o < n; o++) {
    let i = e.props.children[o], s = t.props.children[o];
    if (s && (s.parent = e), !i && s)
      h(
        s,
        // @ts-expect-error
        (r = se(e.props.children.at(-1))) == null ? void 0 : r.nextSibling
      ), e.props.children.push(s);
    else if (!s && i)
      m(i, !0), e.props.children.splice(o, 1), n = e.props.children.length, o--;
    else {
      F(i, s, o);
      const l = Math.max(
        e.props.children.length,
        t.props.children.length
      );
      l < n && (n = l, o--);
    }
  }
}
function ae(e, t) {
  let n = Math.max(e.props.children.length, t.props.children.length);
  const r = {};
  let o = 0;
  for (let l = 0; l < e.props.children.length; l++) {
    const c = e.props.children[l].props.key;
    if (c != null) {
      if (o++, r.hasOwnProperty(String(c))) {
        console.warn("Found two children with the same key", c), console.warn(
          "When two fibers are found having same key the whole children will default to manual updates, which can be slower than with key based reconciliation"
        ), V(e, t);
        return;
      }
      r[String(c)] = { fiber: e.props.children[l], index: l };
    }
  }
  o == 0 && V(e, t);
  const i = {};
  for (let l = 0; l < t.props.children.length; l++) {
    const c = t.props.children[l].props.key;
    if (c == null)
      continue;
    const a = r[String(c)];
    if (a) {
      if (i.hasOwnProperty(String(c))) {
        console.warn("Found two children with the same key", c), console.warn(
          "When two fibers are found having same key the whole children will default to manual updates, which can be slower than with key based reconciliation"
        ), V(e, t);
        return;
      }
      i[String(c)] = {
        fiber: a.fiber,
        newIndex: l,
        oldIndex: a.index
      };
    }
  }
  const s = je(e);
  for (let l = 0; l < n; l++) {
    let c = e.props.children[l], a = t.props.children[l];
    const S = a != null && a.props.key ? String(a.props.key) : "", f = i.hasOwnProperty(S);
    let u = c != null && c.props.key ? String(c.props.key) : "";
    if (u && S && u === S) {
      F(c, a, l), s != null && s.dom && M(e.props.children[l], s.dom);
      continue;
    }
    const I = i.hasOwnProperty(u) && i[u].newIndex > l, T = i.hasOwnProperty(u) && i[u].newIndex < l;
    if ((I || T) && (H = !1), a && (a.parent = e), !c && a)
      if (f) {
        const { fiber: g } = i[S];
        e.props.children.push(g), F(g, a, l), s != null && s.dom && M(e.props.children[l], s.dom);
      } else
        s != null && s.dom && h(a, void 0, !1, !1, s.dom), e.props.children.push(a);
    else if (!a && c)
      m(c, !0), e.props.children.splice(l, 1), n = e.props.children.length, l--;
    else if (f) {
      const { fiber: g } = i[S];
      m(c, !0), H = !0, e.props.children[l] = g, F(g, a, l), s != null && s.dom && M(e.props.children[l], s.dom);
    } else if (I || T)
      s != null && s.dom && h(
        a,
        void 0,
        !1,
        !1,
        s.dom
      ), e.props.children[l] = a;
    else {
      F(c, a, l), s != null && s.dom && M(e.props.children[l], s.dom);
      const g = Math.max(
        e.props.children.length,
        t.props.children.length
      );
      g < n && (n = g, l--);
    }
    H = !0;
  }
}
typeof process < "u" && process.env.NODE_ENV === "test" && (module.exports = {
  createFiber: A,
  commitDeletion: m,
  commitFiber: h,
  updateFiber: ge,
  deepCompareFibers: me,
  deepEqual: L
});
function Ye(e) {
  let t = null;
  const n = (r, o) => {
    t ? (r.value = !1, o.value = null) : e().then((i) => {
      if (i.default) {
        if (typeof i.default != "function")
          throw new Error(
            "Lazy-loaded component must be a functional component"
          );
        t = i.default, r.value = !1, o.value = null;
      } else
        o.value = new Error(
          "No default export found from lazy-loaded module"
        );
    }).catch((i) => {
      o.value = i, r.value = !1;
    });
  };
  return (r) => {
    const o = W(!0), i = W(null);
    n(o, i);
    const s = (l) => typeof l == "string" || l && typeof l == "object" && "props" in l && "type" in l;
    if (r.fallback !== void 0 && !s(r.fallback))
      throw new Error(
        "Invalid fallback: Expected a string or a valid JSX node."
      );
    if (r.errorFallback !== void 0 && !(typeof r.errorFallback == "function" || s(r.errorFallback)))
      throw new Error(
        "Invalid errorFallback: Expected a string, a valid JSX node, or a function returning a JSX node."
      );
    return /* @__PURE__ */ ie("FRAGMENT", null, () => o.value ? r.fallback : i.value !== null ? r.errorFallback ? typeof r.errorFallback == "function" ? r.errorFallback(i.value) : r.errorFallback : "Unknown error occurred while lazy loading component, use errorFallback prop to override" : t && /* @__PURE__ */ ie(t, { ...r }));
  };
}
export {
  Ke as cleanUp,
  ze as computed,
  Ue as createEffect,
  ie as createElement,
  $e as createPromise,
  qe as createRef,
  W as createSignal,
  Ye as lazy,
  Je as render
};
