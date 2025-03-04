let d = null, g = /* @__PURE__ */ new WeakMap();
function ce(e) {
  d = e;
}
function ue() {
  d = null;
}
function me(e) {
  d && (g.has(d) ? g.get(d).cleanup.push(e) : g.set(d, {
    signals: /* @__PURE__ */ new Set(),
    cleanup: [e],
    effects: /* @__PURE__ */ new Set()
  }));
}
function fe(e) {
  if (d)
    if (g.has(d))
      g.get(d).effects.add(e);
    else {
      const t = /* @__PURE__ */ new Set();
      t.add(e), g.set(d, {
        signals: /* @__PURE__ */ new Set(),
        cleanup: [],
        effects: t
      });
    }
}
function $(e) {
  if (d)
    if (g.has(d))
      g.get(d).signals.add(e);
    else {
      const t = /* @__PURE__ */ new Set();
      t.add(e), g.set(d, {
        signals: t,
        cleanup: [],
        effects: /* @__PURE__ */ new Set()
      });
    }
}
function we(e, t) {
  const n = g.get(e);
  if (n) {
    if (n.cleanup)
      for (const r of n.cleanup)
        r();
    n.cleanup = [];
    for (const r of n.effects) {
      if (r.__signals)
        for (const o of r.__signals)
          o.removeDep(r);
      delete r.__signals;
    }
    n.signals.forEach((r) => r.clearDeps()), n.signals.clear();
  }
  g.delete(e);
}
function L(e) {
  return typeof e == "object" && // Must be an object
  e !== null && // Cannot be null
  !Array.isArray(e) && // Cannot be an array
  Object.prototype.toString.call(e) === "[object Object]";
}
function S(e) {
  return ["boolean", "string", "number", "undefined"].includes(typeof e) || e === null || e instanceof Error;
}
function B(e) {
  return Object.entries(e).map(([t, n]) => `${t.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${n};`).join(" ");
}
function b(e) {
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
function v(e) {
  return L(e) || typeof e == "string";
}
let h = null, f = null;
function ne(e) {
  h.__signals || (h.__signals = /* @__PURE__ */ new Set()), h.__signals.add(e);
}
function re(e) {
  f.__signals || (f.__signals = /* @__PURE__ */ new Set()), f.__signals.add(e);
}
function Ee(e) {
  var n;
  if (typeof e != "function")
    throw new Error("reactive takes a render function as the argument");
  h = e;
  const t = e();
  if (h = null, !S(t) && L(t) && !t.type && !t.props && !((n = t.props) != null && n.children))
    throw new Error(
      "Reactive value must be primitive or functional component, got: " + typeof t
    );
  return t;
}
function Se(e) {
  if (typeof e != "function")
    throw new Error("reactive takes a render function as the argument");
  h = e;
  const t = e();
  return h = null, t;
}
function Xe(e) {
  if (typeof e != "function")
    throw new Error("createEffect takes a effect function as the argument");
  f = e, fe(e);
  const t = e();
  f.__signals && typeof t == "function" && Te(t), f.__signals || me(t), f = null;
}
function ze(e) {
  if (typeof e != "function")
    throw new Error("computed takes a function as the argument");
  f = () => {
    let r = e();
    r !== n.value && n.update(r);
  }, fe(f);
  const t = e(), n = H(t);
  return f = null, {
    get value() {
      return n.value;
    }
  };
}
function Ke(e) {
  if (typeof e != "function")
    throw new Error("createPromise takes a function as the argument");
  const t = e();
  if (!(t instanceof Promise))
    throw new Error(
      "createPromise takes a function that returns a promise"
    );
  const n = H({
    status: "pending",
    data: null,
    error: null
  });
  return t.then((r) => {
    n.update((o) => {
      o.data = r, o.status = "resolved";
    });
  }).catch((r) => {
    n.update((o) => {
      o.error = r, o.status = "rejected";
    });
  }), {
    get value() {
      return n.value;
    }
  };
}
class oe {
  constructor(t) {
    this.current = t;
  }
}
function Ue() {
  return new oe(null);
}
const j = [
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
class P {
  constructor(t) {
    this.isNotified = !1, this._val = t, this.deps = /* @__PURE__ */ new Set();
  }
  notify() {
    this.isNotified || (this.deps.size !== 0 && (this.isNotified = !0), this.deps.forEach((t) => {
      Me(() => (this.isNotified = !1, t));
    }));
  }
  removeDep(t) {
    this.deps.delete(t);
  }
  clearDeps() {
    this.deps.clear();
  }
}
class Fe extends P {
  constructor(t) {
    if (!S(t))
      throw new Error(
        "Invalid type for PrimitiveSignal. Valid types: [boolean, string, number, undefined, null]"
      );
    super(t);
  }
  get value() {
    return f && (this.deps.add(f), re(this)), h && (this.deps.add(h), ne(this)), this._val;
  }
  update(t) {
    if (typeof t == "function") {
      const n = t(this._val);
      if (!S(n))
        throw new Error(
          "Invalid type for PrimitiveSignal. Valid types: [boolean, string, number, undefined, null]"
        );
      if (n === this._val) return;
      this._val = n, this.notify();
    } else {
      if (!S(t))
        throw new Error(
          "Invalid type for PrimitiveSignal. Valid types: [boolean, string, number, undefined, null]"
        );
      if (t === this._val) return;
      this._val = t, this.notify();
    }
  }
}
class _e extends P {
  constructor(t) {
    if (!Array.isArray(t))
      throw new Error(
        "Invalid type for ArraySignal; value must be an array"
      );
    super(t), this.updateCalled = !1, this._val = this.createProxy(t);
  }
  createProxy(t) {
    return new Proxy(t, {
      get: (n, r) => {
        const o = n[r];
        if (typeof o == "function") {
          if (j.includes(String(r)) && !this.updateCalled)
            throw new Error(
              "Cannot set a value on an array signal, use the update method for updating the array."
            );
          return (...l) => {
            const s = o.apply(n, l);
            return j.includes(String(r)) && this.notify(), s;
          };
        }
        return o;
      },
      set: (n, r, o) => {
        if (!this.updateCalled)
          throw new Error(
            "Cannot set a value on an array signal, use the update method for updating the array."
          );
        return n[r] = o, this.notify(), !0;
      }
    });
  }
  get value() {
    return f && (this.deps.add(f), re(this)), h && (this.deps.add(h), ne(this)), this._val;
  }
  update(t) {
    if (this.updateCalled = !0, typeof t == "function")
      t(this._val);
    else {
      if (!Array.isArray(t))
        throw new Error(
          "Invalid type for ArraySignal; value must be an array"
        );
      if (t === this._val) return;
      this._val = this.createProxy(t), this.notify();
    }
    this.updateCalled = !1;
  }
}
class ke extends P {
  constructor(t) {
    if (!L(t))
      throw new Error(
        "Invalid type for ObjectSignal; value must be a plain object"
      );
    super(t), this.updateCalled = !1, this._val = this.createProxy(t);
  }
  createInternalArrayProxy(t) {
    return new Proxy(t, {
      get: (n, r) => {
        const o = n[r];
        if (typeof o == "function") {
          if (!this.updateCalled && j.includes(String(r)))
            throw new Error(
              "Cannot set a value on an object signal, use the update method for updating the object."
            );
          return (...l) => {
            const s = o.apply(n, l);
            return j.includes(String(r)) && this.notify(), s;
          };
        }
        return o;
      },
      set: (n, r, o) => {
        if (!this.updateCalled)
          throw new Error(
            "Cannot set a value on an object signal, use the update method for updating the object."
          );
        return n[r] = o, this.notify(), !0;
      }
    });
  }
  createProxy(t) {
    return new Proxy(t, {
      get: (n, r) => {
        const o = n[r];
        return Array.isArray(o) ? (n[r] = this.createInternalArrayProxy(o), n[r]) : o;
      },
      set: (n, r, o) => {
        if (!this.updateCalled)
          throw new Error(
            "Cannot set a value on an object signal, use the update method for updating the object."
          );
        return typeof o == "function" ? !1 : (typeof o == "object" && o !== null && (o = this.createProxy(o)), o === n[r] || (n[r] = o, this.notify()), !0);
      },
      deleteProperty: (n, r) => {
        const o = delete n[r];
        return this.notify(), o;
      }
    });
  }
  get value() {
    return f && (this.deps.add(f), re(this)), h && (this.deps.add(h), ne(this)), this._val;
  }
  update(t) {
    if (this.updateCalled = !0, typeof t == "function")
      t(this._val);
    else {
      if (!L(t))
        throw new Error(
          "Invalid type for ObjectSignal; value must be a plain object"
        );
      if (t === this._val) return;
      this._val = this.createProxy(t), this.notify();
    }
    this.updateCalled = !1;
  }
}
function H(e) {
  if (typeof e == "function")
    throw new Error("Functions cannot be used as signal value");
  if (typeof e == "object" && e !== null)
    if (Array.isArray(e)) {
      const t = new _e(e);
      return $(t), {
        get value() {
          return t.value;
        },
        update: t.update.bind(t)
      };
    } else if (L(e)) {
      const t = new ke(e);
      return $(t), {
        get value() {
          return t.value;
        },
        update: t.update.bind(t)
      };
    } else
      throw new Error(
        "Invalid type for signal initialization: " + typeof e
      );
  else if (S(e)) {
    const t = new Fe(e);
    return $(t), {
      get value() {
        return t.value;
      },
      update: t.update.bind(t)
    };
  } else
    throw new Error(
      "Invalid type for signal initialization: " + typeof e
    );
}
const w = Symbol("FRAGMENT");
function $e(e, t, ...n) {
  if (e === "FRAGMENT") {
    const r = N(n);
    return r[w] = !0, r;
  }
  return {
    type: e,
    props: {
      ...t,
      children: N(n)
    }
  };
}
function N(e) {
  return e.map((t) => {
    if (typeof t == "object") {
      if (Array.isArray(t))
        return N(t);
      if (t === null)
        return x("");
      if (!t.type || !t.props)
        throw new Error(
          "Invalid type for a dom node, found " + t
        );
      return t;
    } else if (typeof t == "function") {
      const n = Ee(t);
      if (S(n))
        return q(
          "TEXT_CHILD",
          {
            nodeValue: n != null && n !== !1 ? String(n) : "",
            children: []
          },
          t
        );
      if (Array.isArray(n)) {
        const r = n[w];
        return q(
          "FRAGMENT",
          { children: r ? n : N(n) },
          t
        );
      } else if (!n.type || !n.props)
        throw new Error(
          "Invalid type for a dom node, found " + n
        );
      return q(n.type, n.props, t);
    } else
      return x(t);
  }).flat();
}
function x(e) {
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
function Ce(e) {
  return e !== "children" && e !== "key" && e !== "ref";
}
function de(e) {
  const t = e.type === "TEXT_CHILD" ? document.createTextNode("") : (
    // @ts-expect-error
    document.createElement(e.type)
  );
  return e.props && (e.props.ref && e.props.ref instanceof oe && t instanceof HTMLElement && (e.props.ref.current = t), Object.keys(e.props).filter(Ce).forEach((n) => {
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
        if (!v(o))
          throw new Error(
            "Style attribute must be a plain object or a string"
          );
        const l = b(o);
        t.setAttribute(
          "style",
          B(l)
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
        if (!v(r))
          throw new Error(
            "Style attribute must be a plain object or a string"
          );
        const o = b(r);
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
function Ae(e, t, n) {
  if (!(n == null || n === !1 || e === "key"))
    if (e === "style" && typeof n != "string" && t instanceof HTMLElement) {
      if (!v(n))
        throw new Error(
          "Style attribute must be a plain object or a string"
        );
      const r = b(n);
      t.setAttribute("style", B(r));
    } else
      t instanceof HTMLElement && (e in t || e.startsWith("data-")) ? (e === "className" && (e = "class"), t.setAttribute(e, String(n))) : t[e] = String(n);
}
let J = !1;
const Y = /* @__PURE__ */ new Set(), Z = /* @__PURE__ */ new Set(), X = /* @__PURE__ */ new WeakMap(), z = /* @__PURE__ */ new WeakMap(), G = [];
function Te(e) {
  G.push(e);
}
function Me(e) {
  Y.add(e), J || (J = !0, queueMicrotask(() => {
    G.forEach((t) => t()), G.length = 0, Y.forEach((t) => {
      const n = t();
      if (Z.has(n))
        return;
      Z.add(n);
      const r = n();
      if (typeof r == "function" && G.push(r), X.has(n)) {
        const o = X.get(n);
        o && he(o, r);
      }
      if (z.has(n)) {
        const o = z.get(n);
        o && n.__propName && Ae(n.__propName, o, r);
      }
    }), Z.clear(), Y.clear(), J = !1;
  }));
}
function Le(e, t) {
  X.set(e, t);
}
function Pe(e, t) {
  z.set(e, t);
}
function Ne(e) {
  z.delete(e);
  const t = e.__signals;
  if (t) {
    for (const n of t)
      n.removeDep(e);
    e.__signals = null;
  }
}
function Re(e) {
  X.delete(e);
  const t = e.__signals;
  if (t) {
    for (const n of t)
      n.removeDep(e);
    e.__signals = null;
  }
}
function qe(e, t) {
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
  e.parent = r, _.push(e), requestIdleCallback(pe);
}
function De() {
  if (te && ee) {
    ee.appendChild(te);
    const e = performance.now();
    console.log(`Render time: ${e - R}ms`);
  }
}
let _ = [], ee = null, te = null, R = -1;
function pe(e) {
  R === -1 && (R = performance.now());
  let t = !1;
  for (; _.length > 0 && !t; ) {
    const n = _.pop();
    Ie(n), t = e.timeRemaining() < 1;
  }
  if (_.length == 0) {
    De();
    return;
  }
  requestIdleCallback(pe);
}
function Ie(e) {
  var t;
  if (e.type === "FRAGMENT") {
    const n = !e.props.children[w];
    let r = !1;
    for (let o = e.props.children.length - 1; o >= 0; o--)
      e.props.children[o].parent = e, n && e.props.children[o].props.key === void 0 && e.renderFunction && (r = !0), _.push(e.props.children[o]);
    r && console.error("Array children must have a key attribute");
  } else if (typeof e.type == "function") {
    ce(e);
    const n = e.type(e.props);
    if (ue(), Array.isArray(n)) {
      for (let r = n.length - 1; r >= 0; r--)
        n[r].parent = e, _.push(n[r]);
      e.props.children = n;
    } else
      n.parent = e, e.props.children.push(n), _.push(n);
  } else {
    e.dom || (e.dom = de(e));
    let n = e.parent;
    for (; n && !n.dom; )
      n = n.parent;
    n && ((t = n.dom) == null || t.appendChild(e.dom));
    for (let r = e.props.children.length - 1; r >= 0; r--)
      e.props.children[r].parent = e, _.push(e.props.children[r]);
  }
  U(e);
}
function k(e) {
  if (e.type === "FRAGMENT")
    if (e.props.children[w])
      for (const n of e.props.children)
        n.parent = e, k(n);
    else {
      let n = !1;
      for (const r of e.props.children)
        r.parent = e, r.props.key === void 0 && (n = !0), k(r);
      n && console.error("Array children must have a key attribute");
    }
  else if (typeof e.type != "function")
    for (const t of e.props.children)
      t.parent = e, k(t);
  U(e);
}
function p(e, t, n, r, o) {
  var l, s;
  if (e.type === "FRAGMENT")
    for (const i of e.props.children)
      r && (i.parent = e), p(
        i,
        t,
        n,
        r,
        o
      );
  else if (typeof e.type == "function") {
    ce(e);
    const i = e.type(e.props);
    if (ue(), Array.isArray(i)) {
      for (const c of i)
        c.parent = e, p(c, t, n, !0, o);
      e.props.children = i;
    } else
      i.parent = e, e.props.children.push(i), p(i, t, n, !0, o);
  } else {
    if (e.dom || (e.dom = de(e)), t)
      n ? (l = t.parentElement) == null || l.replaceChild(
        e.dom,
        t
      ) : (s = t.parentElement) == null || s.insertBefore(
        e.dom,
        t
      );
    else {
      let i;
      if (o)
        i = o;
      else {
        let c = e.parent;
        for (; c && !c.dom; )
          c = c.parent;
        i = c == null ? void 0 : c.dom;
      }
      i == null || i.appendChild(e.dom);
    }
    for (const i of e.props.children)
      r && (i.parent = e), p(i, void 0, void 0, r, e.dom);
  }
  r && U(e);
}
let W = !0;
function y(e, t) {
  if (!(!e || !W)) {
    if (e.renderFunction && (t && Re(e.renderFunction), delete e.renderFunction), e.dom) {
      for (const n of Object.keys(e.props))
        if (K(n)) {
          const r = n.toLowerCase().substring(2);
          e.dom.removeEventListener(r, e.props[n]), delete e.props[n];
        } else typeof e.props[n] == "function" ? Ne(e.props[n]) : n === "ref" && e.props[n] instanceof oe && (e.props[n].current = null);
      e.dom.remove();
    }
    typeof e.type == "function" && (we(e, e.props), delete e.type), e.props.children.forEach((n) => y(n, !0));
  }
}
function U(e) {
  e.renderFunction && Le(e.renderFunction, e);
}
function he(e, t) {
  if (R = performance.now(), S(t)) {
    const r = {
      ...x(t),
      parent: e.parent
    };
    k(r), E(e, r);
  } else if (Array.isArray(t)) {
    const o = {
      type: "FRAGMENT",
      props: {
        children: t[w] ? t : N(t)
      },
      parent: e.parent
    };
    k(o), E(e, o);
  } else {
    const r = { ...t, parent: e.parent };
    k(r), E(e, r);
  }
  const n = performance.now();
  console.log("Update Time:", (n - R).toFixed(2), "ms");
}
function I(e, t) {
  e.renderFunction && (t.renderFunction = e.renderFunction, U(t));
}
function O(e, t, n) {
  var r;
  if (n !== void 0) {
    e.parent.props.children[n] = t;
    return;
  }
  (r = e.parent) == null || r.props.children.forEach((o, l) => {
    o === e && (e.parent.props.children[l] = t);
  });
}
const K = (e) => e.startsWith("on"), ie = (e) => e !== "children" && !K(e) && e !== "key" && e !== "ref", Q = (e, t, n) => e[n] !== t[n], Oe = (e, t, n) => !(n in t);
function ye(e, t) {
  var n, r;
  return e === t ? !0 : e.type !== t.type || ((n = e.props) == null ? void 0 : n.key) !== ((r = t.props) == null ? void 0 : r.key) ? !1 : M(e.props, t.props);
}
function M(e, t) {
  if (e === t) {
    if (e instanceof P && t instanceof P)
      return M(e.value, t.value);
    if (Array.isArray(e) && Array.isArray(t)) {
      if (e.length !== t.length) return !1;
      for (let o = 0; o < e.length; o++)
        if (!M(e[o], t[o])) return !1;
    }
    return !0;
  }
  if (S(e) && S(t))
    return e === t;
  if (typeof e != typeof t) return !1;
  const n = Object.keys(e), r = Object.keys(t);
  if (n.length !== r.length) return !1;
  for (let o of n)
    if (o !== "children" && (!r.includes(o) || !M(e[o], t[o])))
      return !1;
  return !0;
}
function ge(e) {
  if (e) {
    if (e.dom) return e.dom;
    for (const t of e.props.children) {
      const n = ge(t);
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
function Ge(e) {
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
function E(e, t, n) {
  if (!(!e && !t)) {
    if (e && !t)
      y(e, !0), e.parent.props.children = e.parent.props.children.filter(
        (r) => r !== e
      );
    else if (e && t) {
      const r = e.props, o = t.props;
      if (e.type === "FRAGMENT" || typeof e.type == "function")
        if (t.type === "FRAGMENT" || typeof t.type == "function")
          typeof e.type == typeof t.type && typeof e.type == "function" ? ye(e, t) || (p(t, ge(e), void 0, !0), I(e, t), y(e), O(e, t, n)) : le(e, t);
        else {
          t.parent = e.parent;
          let l = e.props.children[0];
          for (; l && !l.dom; )
            l = l.props.children[0];
          p(t, l == null ? void 0 : l.dom), I(e, t), y(e), O(e, t, n);
        }
      else {
        const l = e.dom;
        if (e.type === "TEXT_CHILD" && t.type === "TEXT_CHILD" && !t.dom && (t.dom = e.dom), l === void 0) {
          console.error("no node found", e, t);
          return;
        }
        if (t.type === "FRAGMENT" || typeof t.type == "function")
          t.parent = e.parent, I(e, t), p(t, l), y(e), O(e, t, n);
        else {
          for (const s of Object.keys(r))
            if (ie(s) && Oe(r, o, s))
              l[s] = "";
            else if (K(s) && (!(s in o) || Q(r, o, s))) {
              const i = s.toLowerCase().substring(2);
              l.removeEventListener(i, r[s]);
            }
          if (e.type !== t.type)
            t.parent = e.parent, I(e, t), p(t, l, !0), y(e), O(e, t, n);
          else {
            for (const s of Object.keys(o))
              if (ie(s) && Q(r, o, s))
                l[s] = o[s], r[s] = o[s];
              else if (K(s) && Q(r, o, s)) {
                const i = s.toLowerCase().substring(2);
                l.addEventListener(i, o[s]), r[s] = o[s];
              }
            le(e, t);
          }
        }
      }
    }
  }
}
function He(e, t) {
  var c;
  const n = e.props.children, r = t.props.children, o = {};
  for (let a = 0; a < n.length; a++) {
    const u = n[a].props.key;
    if (u == null || o.hasOwnProperty(String(u)))
      return !1;
    o[String(u)] = n[a];
  }
  const l = (c = Ge(e)) == null ? void 0 : c.nextSibling, s = We(e);
  if (r.length === 0) {
    e.props.children.length = 0, (s == null ? void 0 : s.dom) instanceof HTMLElement && (s.dom.innerHTML = "");
    return;
  }
  const i = e.props.children.length;
  for (let a = 0; a < r.length; a++) {
    const u = r[a], D = u.props.key, m = String(D);
    if (o.hasOwnProperty(m)) {
      const C = o[m];
      i > a ? e.props.children[a] = C : e.props.children.push(C), delete o[m];
      const A = t.props.children[a];
      A && (A.parent = e), E(C, A, a), T(
        e.props.children[a],
        s == null ? void 0 : s.dom,
        l
      );
    } else
      i > a ? e.props.children[a] = u : e.props.children.push(u), u.parent = e, p(
        u,
        l,
        !1,
        !1,
        s == null ? void 0 : s.dom
      );
  }
  for (const a in o)
    if (o.hasOwnProperty(a)) {
      const u = o[a];
      y(u, !0);
    }
  for (; e.props.children.length > t.props.children.length; )
    e.props.children.pop();
}
function T(e, t, n) {
  if (e.dom) {
    if (e.dom === t || e.dom === n) return;
    n ? t.insertBefore(e.dom, n) : t.appendChild(e.dom);
  } else
    for (const r of e.props.children)
      T(r, t, n);
}
function le(e, t) {
  const n = t.type === "FRAGMENT" && !t.props.children[w], r = e.type === "FRAGMENT" && !e.props.children[w];
  n && r ? He(e, t) === !1 && ae(e, t) : ae(e, t), t.type === "FRAGMENT" && t.props.children[w] ? e.props.children[w] = !0 : e.props.children[w] = !1, e.type = t.type;
}
function V(e, t) {
  var r;
  let n = Math.max(e.props.children.length, t.props.children.length);
  for (let o = 0; o < n; o++) {
    let l = e.props.children[o], s = t.props.children[o];
    if (s && (s.parent = e), !l && s)
      p(
        s,
        // @ts-expect-error
        (r = se(e.props.children.at(-1))) == null ? void 0 : r.nextSibling
      ), e.props.children.push(s);
    else if (!s && l)
      y(l, !0), e.props.children.splice(o, 1), n = e.props.children.length, o--;
    else {
      E(l, s, o);
      const i = Math.max(
        e.props.children.length,
        t.props.children.length
      );
      i < n && (n = i, o--);
    }
  }
}
function ae(e, t) {
  let n = Math.max(e.props.children.length, t.props.children.length);
  const r = {};
  let o = 0;
  for (let i = 0; i < e.props.children.length; i++) {
    const c = e.props.children[i].props.key;
    if (c != null) {
      if (o++, r.hasOwnProperty(String(c))) {
        console.warn("Found two children with the same key", c), console.warn(
          "When two fibers are found having same key the whole children will default to manual updates, which can be slower than with key based reconciliation"
        ), V(e, t);
        return;
      }
      r[String(c)] = { fiber: e.props.children[i], index: i };
    }
  }
  if (o == 0) {
    V(e, t);
    return;
  }
  const l = {};
  for (let i = 0; i < t.props.children.length; i++) {
    const c = t.props.children[i].props.key;
    if (c == null)
      continue;
    const a = r[String(c)];
    if (a) {
      if (l.hasOwnProperty(String(c))) {
        console.warn("Found two children with the same key", c), console.warn(
          "When two fibers are found having same key the whole children will default to manual updates, which can be slower than with key based reconciliation"
        ), V(e, t);
        return;
      }
      l[String(c)] = {
        fiber: a.fiber,
        newIndex: i,
        oldIndex: a.index
      };
    }
  }
  const s = je(e);
  for (let i = 0; i < n; i++) {
    let c = e.props.children[i], a = t.props.children[i];
    const u = a != null && a.props.key ? String(a.props.key) : "", D = l.hasOwnProperty(u);
    let m = c != null && c.props.key ? String(c.props.key) : "";
    if (m && u && m === u) {
      E(c, a, i), s != null && s.dom && T(e.props.children[i], s.dom);
      continue;
    }
    const C = l.hasOwnProperty(m) && l[m].newIndex > i, A = l.hasOwnProperty(m) && l[m].newIndex < i;
    if ((C || A) && (W = !1), a && (a.parent = e), !c && a)
      if (D) {
        const { fiber: F } = l[u];
        e.props.children.push(F), E(F, a, i), s != null && s.dom && T(e.props.children[i], s.dom);
      } else
        s != null && s.dom && p(a, void 0, !1, !1, s.dom), e.props.children.push(a);
    else if (!a && c)
      y(c, !0), e.props.children.splice(i, 1), n = e.props.children.length, i--;
    else if (D) {
      const { fiber: F } = l[u];
      y(c, !0), W = !0, e.props.children[i] = F, E(F, a, i), s != null && s.dom && T(e.props.children[i], s.dom);
    } else if (C || A)
      s != null && s.dom && p(
        a,
        void 0,
        !1,
        !1,
        s.dom
      ), e.props.children[i] = a;
    else {
      E(c, a, i), s != null && s.dom && T(e.props.children[i], s.dom);
      const F = Math.max(
        e.props.children.length,
        t.props.children.length
      );
      F < n && (n = F, i--);
    }
    W = !0;
  }
}
typeof process < "u" && process.env.NODE_ENV === "test" && (module.exports = {
  createFiber: k,
  commitDeletion: y,
  commitFiber: p,
  updateFiber: he,
  deepCompareFibers: ye,
  deepEqual: M
});
function Je(e) {
  let t = null;
  const n = (r, o) => {
    t ? (r.update(!1), o.update(null)) : e().then((l) => {
      if (l.default) {
        if (typeof l.default != "function")
          throw new Error(
            "Lazy-loaded component must be a functional component"
          );
        t = l.default, r.update(!1), o.update(null);
      } else
        o.update(
          new Error(
            "No default export found from lazy-loaded module"
          )
        );
    }).catch((l) => {
      o.update(l), r.update(!1);
    });
  };
  return (r) => {
    const o = H(!0), l = H(null);
    n(o, l);
    const s = (i) => typeof i == "string" || i && typeof i == "object" && "props" in i && "type" in i;
    if (r.fallback !== void 0 && !s(r.fallback))
      throw new Error(
        "Invalid fallback: Expected a string or a valid JSX node."
      );
    if (r.errorFallback !== void 0 && !(typeof r.errorFallback == "function" || s(r.errorFallback)))
      throw new Error(
        "Invalid errorFallback: Expected a string, a valid JSX node, or a function returning a JSX node."
      );
    return /* @__PURE__ */ createElement(FRAGMENT, null, () => o.value ? r.fallback : l.value !== null ? r.errorFallback ? typeof r.errorFallback == "function" ? r.errorFallback(l.value) : r.errorFallback : "Unknown error occurred while lazy loading component, use errorFallback prop to override" : t && /* @__PURE__ */ createElement(t, { ...r }));
  };
}
export {
  me as cleanUp,
  ze as computed,
  Xe as createEffect,
  $e as createElement,
  Ke as createPromise,
  Ue as createRef,
  H as createSignal,
  Je as lazy,
  qe as render
};
