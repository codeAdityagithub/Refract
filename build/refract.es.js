function L(e) {
  return typeof e == "object" && // Must be an object
  e !== null && // Cannot be null
  !Array.isArray(e) && // Cannot be an array
  Object.prototype.toString.call(e) === "[object Object]";
}
function _(e) {
  return ["boolean", "string", "number", "undefined"].includes(typeof e) || e === null || e instanceof Error;
}
function V(e) {
  return Object.entries(e).map(([t, n]) => `${t.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${n};`).join(" ");
}
function B(e) {
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
function b(e) {
  return L(e) || typeof e == "string";
}
const m = Symbol("FRAGMENT");
function se(e, t, ...n) {
  if (e === "FRAGMENT") {
    const r = P(n);
    return r[m] = !0, r;
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
        return v("");
      if (!t.type || !t.props)
        throw new Error(
          "Invalid type for a dom node, found " + t
        );
      return t;
    } else if (typeof t == "function") {
      const n = Ge(t);
      if (_(n))
        return U(
          "TEXT_CHILD",
          {
            nodeValue: n != null && n !== !1 ? String(n) : "",
            children: []
          },
          t
        );
      if (Array.isArray(n)) {
        const r = n[m];
        return U(
          "FRAGMENT",
          { children: r ? n : P(n) },
          t
        );
      } else if (!n.type || !n.props)
        throw new Error(
          "Invalid type for a dom node, found " + n
        );
      return U(n.type, n.props, t);
    } else
      return v(t);
  }).flat();
}
function v(e) {
  return {
    type: "TEXT_CHILD",
    props: {
      nodeValue: e != null && e !== !1 ? String(e) : "",
      children: []
    }
  };
}
function U(e, t, n) {
  return {
    type: e,
    renderFunction: n,
    props: t
  };
}
function Se(e) {
  return e !== "children" && e !== "key" && e !== "ref";
}
function ue(e) {
  const t = e.type === "TEXT_CHILD" ? document.createTextNode("") : (
    // @ts-expect-error
    document.createElement(e.type)
  );
  return e.props && (e.props.ref && e.props.ref instanceof oe && t instanceof HTMLElement && (e.props.ref.current = t), Object.keys(e.props).filter(Se).forEach((n) => {
    if (n.startsWith("on") && typeof e.props[n] == "function")
      t.addEventListener(
        n.slice(2).toLowerCase(),
        e.props[n]
      );
    else if (typeof e.props[n] == "function" && !n.startsWith("on")) {
      const r = e.props[n];
      r.__propName = n;
      const o = We(r);
      if (o == null || o === !1)
        return;
      if (n === "style" && typeof o != "string" && t instanceof HTMLElement) {
        if (!b(o))
          throw new Error(
            "Style attribute must be a plain object or a string"
          );
        const l = B(o);
        t.setAttribute(
          "style",
          V(l)
        );
      } else
        t instanceof HTMLElement && (n in t || n.startsWith("data-")) ? t.setAttribute(
          n === "className" ? "class" : n,
          String(o)
        ) : t[n] = String(o);
      r.__signals && Re(r, t);
    } else {
      if (e.props[n] === null || e.props[n] === void 0 || e.props[n] === !1)
        return;
      if (n === "style" && typeof e.props[n] != "string" && t instanceof HTMLElement) {
        const r = e.props[n];
        if (!b(r))
          throw new Error(
            "Style attribute must be a plain object or a string"
          );
        const o = B(r);
        t.setAttribute(
          "style",
          V(o)
        );
      } else
        t instanceof HTMLElement && (n in t || n.startsWith("data-")) ? t.setAttribute(
          n === "className" ? "class" : n,
          String(e.props[n])
        ) : t[n] = String(e.props[n]);
    }
  })), t;
}
function Fe(e, t, n) {
  if (!(n == null || n === !1 || e === "key"))
    if (e === "style" && typeof n != "string" && t instanceof HTMLElement) {
      if (!b(n))
        throw new Error(
          "Style attribute must be a plain object or a string"
        );
      const r = B(n);
      t.setAttribute("style", V(r));
    } else
      t instanceof HTMLElement && (e in t || e.startsWith("data-")) ? (e === "className" && (e = "class"), t.setAttribute(e, String(n))) : t[e] = String(n);
}
function qe(e, t) {
  x = t;
  const n = document.createDocumentFragment();
  ee = n;
  const r = {
    type: "div",
    props: {
      children: [e]
    },
    // @ts-expect-error
    dom: n
  };
  e.parent = r, F.push(e), requestIdleCallback(fe);
}
function ke() {
  ee && x && x.appendChild(ee);
}
let F = [], x = null, ee = null, O = [];
function ie() {
  for (let e = 0; e < O.length; e++) {
    const t = O[e];
    Ee(t);
  }
  O.length = 0;
}
function fe(e) {
  ie();
  let t = !1;
  for (; F.length > 0 && !t; ) {
    const n = F.pop();
    Ae(n), t = e.timeRemaining() < 1;
  }
  if (F.length == 0) {
    ke(), ie();
    return;
  }
  requestIdleCallback(fe);
}
function Ae(e) {
  var t;
  if (e.type === "FRAGMENT") {
    const n = !e.props.children[m];
    let r = !1;
    for (let o = e.props.children.length - 1; o >= 0; o--)
      e.props.children[o].parent = e, n && e.props.children[o].props.key === void 0 && e.renderFunction && (r = !0), F.push(e.props.children[o]);
    r && console.error("Array children must have a key attribute");
  } else if (typeof e.type == "function") {
    ge(e);
    const n = e.type(e.props);
    if (we(), Array.isArray(n)) {
      for (let r = n.length - 1; r >= 0; r--)
        n[r].parent = e, F.push(n[r]);
      e.props.children = n;
    } else
      n.parent = e, e.props.children.push(n), F.push(n);
    O.push(e);
  } else {
    e.dom || (e.dom = ue(e));
    let n = e.parent;
    for (; n && !n.dom; )
      n = n.parent;
    n && ((t = n.dom) == null || t.appendChild(e.dom));
    for (let r = e.props.children.length - 1; r >= 0; r--)
      e.props.children[r].parent = e, F.push(e.props.children[r]);
  }
  K(e);
}
function k(e) {
  if (e.type === "FRAGMENT")
    if (e.props.children[m])
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
  K(e);
}
function h(e, t, n, r, o) {
  var l, s;
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
    ge(e);
    const i = e.type(e.props);
    if (we(), Array.isArray(i)) {
      for (const c of i)
        c.parent = e, h(c, t, n, !0, o);
      e.props.children = i;
    } else
      i.parent = e, e.props.children.push(i), h(i, t, n, !0, o);
    queueMicrotask(() => {
      Ee(e);
    });
  } else {
    if (e.dom || (e.dom = ue(e)), t)
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
      r && (i.parent = e), h(i, void 0, void 0, r, e.dom);
  }
  r && K(e);
}
let G = !0;
function g(e, t) {
  if (!(!e || !G)) {
    if (e.renderFunction && (t && Oe(e.renderFunction), delete e.renderFunction), e.dom) {
      for (const n of Object.keys(e.props))
        if (W(n)) {
          const r = n.toLowerCase().substring(2);
          e.dom.removeEventListener(r, e.props[n]), delete e.props[n];
        } else typeof e.props[n] == "function" ? Ie(e.props[n]) : n === "ref" && e.props[n] instanceof oe && (e.props[n].current = null);
      e.dom.remove();
    }
    typeof e.type == "function" && (Ue(e, e.props), delete e.type), e.props.children.forEach((n) => g(n, !0));
  }
}
function K(e) {
  e.renderFunction && De(e.renderFunction, e);
}
function pe(e, t) {
  if (_(t)) {
    const n = {
      ...v(t),
      parent: e.parent
    };
    k(n), E(e, n);
  } else if (Array.isArray(t)) {
    const r = {
      type: "FRAGMENT",
      props: {
        children: t[m] ? t : P(t)
      },
      parent: e.parent
    };
    k(r), E(e, r);
  } else {
    const n = { ...t, parent: e.parent };
    k(n), E(e, n);
  }
}
function R(e, t) {
  e.renderFunction && (t.renderFunction = e.renderFunction, K(t));
}
function I(e, t, n) {
  var r;
  if (n !== void 0) {
    e.parent.props.children[n] = t;
    return;
  }
  (r = e.parent) == null || r.props.children.forEach((o, l) => {
    o === e && (e.parent.props.children[l] = t);
  });
}
const W = (e) => e.startsWith("on"), le = (e) => e !== "children" && !W(e) && e !== "key" && e !== "ref", q = (e, t, n) => e[n] !== t[n], Ce = (e, t, n) => !(n in t);
function de(e, t) {
  var n, r;
  return e === t ? !0 : e.type !== t.type || ((n = e.props) == null ? void 0 : n.key) !== ((r = t.props) == null ? void 0 : r.key) ? !1 : T(e.props, t.props);
}
function T(e, t) {
  if (e === t) {
    if (e instanceof N && t instanceof N)
      return T(e.value, t.value);
    if (Array.isArray(e) && Array.isArray(t)) {
      if (e.length !== t.length) return !1;
      for (let o = 0; o < e.length; o++)
        if (!T(e[o], t[o])) return !1;
    }
    return !0;
  }
  if (_(e) && _(t))
    return e === t;
  if (typeof e != typeof t) return !1;
  const n = Object.keys(e), r = Object.keys(t);
  if (n.length !== r.length) return !1;
  for (let o of n)
    if (o !== "children" && (!r.includes(o) || !T(e[o], t[o])))
      return !1;
  return !0;
}
function he(e) {
  if (e) {
    if (e.dom) return e.dom;
    for (const t of e.props.children) {
      const n = he(t);
      if (n) return n;
    }
  }
}
function te(e) {
  if (e) {
    if (e.dom) return e.dom;
    for (let t = e.props.children.length - 1; t >= 0; t--) {
      const n = e.props.children[t], r = te(n);
      if (r) return r;
    }
  }
}
function Me(e) {
  if (e)
    for (let t = e.props.children.length - 1; t >= 0; t--) {
      const n = e.props.children[t], r = te(n);
      if (r) return r;
    }
}
function Te(e) {
  if (!e) return;
  let t = e.parent;
  for (; t && !t.dom; )
    t = t.parent;
  return t;
}
function Le(e) {
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
      g(e, !0), e.parent.props.children = e.parent.props.children.filter(
        (r) => r !== e
      );
    else if (e && t) {
      const r = e.props, o = t.props;
      if (e.type === "FRAGMENT" || typeof e.type == "function")
        if (t.type === "FRAGMENT" || typeof t.type == "function")
          typeof e.type == typeof t.type && typeof e.type == "function" ? de(e, t) || (h(t, he(e), void 0, !0), R(e, t), g(e), I(e, t, n)) : ae(e, t);
        else {
          t.parent = e.parent;
          let l = e.props.children[0];
          for (; l && !l.dom; )
            l = l.props.children[0];
          h(t, l == null ? void 0 : l.dom), R(e, t), g(e), I(e, t, n);
        }
      else {
        const l = e.dom;
        if (e.type === "TEXT_CHILD" && t.type === "TEXT_CHILD" && !t.dom && (t.dom = e.dom), l === void 0)
          return;
        if (t.type === "FRAGMENT" || typeof t.type == "function")
          t.parent = e.parent, R(e, t), h(t, l), g(e), I(e, t, n);
        else {
          for (const s of Object.keys(r))
            if (le(s) && Ce(r, o, s))
              l[s] = "";
            else if (W(s) && (!(s in o) || q(r, o, s))) {
              const i = s.toLowerCase().substring(2);
              l.removeEventListener(i, r[s]);
            }
          if (e.type !== t.type)
            t.parent = e.parent, R(e, t), h(t, l, !0), g(e), I(e, t, n);
          else {
            for (const s of Object.keys(o))
              if (le(s) && q(r, o, s))
                l[s] = o[s], r[s] = o[s];
              else if (W(s) && q(r, o, s)) {
                const i = s.toLowerCase().substring(2);
                l.addEventListener(i, o[s]), r[s] = o[s];
              }
            ae(e, t);
          }
        }
      }
    }
  }
}
function Pe(e, t) {
  var c;
  const n = e.props.children, r = t.props.children, o = {};
  for (let a = 0; a < n.length; a++) {
    const u = n[a].props.key;
    if (u == null || o.hasOwnProperty(String(u)))
      return !1;
    o[String(u)] = n[a];
  }
  const l = (c = Me(e)) == null ? void 0 : c.nextSibling, s = Te(e);
  if (r.length === 0) {
    e.props.children.length = 0, (s == null ? void 0 : s.dom) instanceof HTMLElement && (s.dom.innerHTML = "");
    return;
  }
  const i = e.props.children.length;
  for (let a = 0; a < r.length; a++) {
    const u = r[a], D = u.props.key, w = String(D);
    if (o.hasOwnProperty(w)) {
      const A = o[w];
      i > a ? e.props.children[a] = A : e.props.children.push(A), delete o[w];
      const C = t.props.children[a];
      C && (C.parent = e), E(A, C, a), M(
        e.props.children[a],
        s == null ? void 0 : s.dom,
        l
      );
    } else
      i > a ? e.props.children[a] = u : e.props.children.push(u), u.parent = e, h(
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
      g(u, !0);
    }
  for (; e.props.children.length > t.props.children.length; )
    e.props.children.pop();
}
function M(e, t, n) {
  if (e.dom) {
    if (e.dom === t || e.dom === n) return;
    n ? t.insertBefore(e.dom, n) : t.appendChild(e.dom);
  } else
    for (const r of e.props.children)
      M(r, t, n);
}
function ae(e, t) {
  const n = t.type === "FRAGMENT" && !t.props.children[m], r = e.type === "FRAGMENT" && !e.props.children[m];
  n && r ? Pe(e, t) === !1 && ce(e, t) : ce(e, t), t.type === "FRAGMENT" && t.props.children[m] ? e.props.children[m] = !0 : e.props.children[m] = !1, e.type = t.type;
}
function $(e, t) {
  var r;
  let n = Math.max(e.props.children.length, t.props.children.length);
  for (let o = 0; o < n; o++) {
    let l = e.props.children[o], s = t.props.children[o];
    if (s && (s.parent = e), !l && s)
      h(
        s,
        // @ts-expect-error
        (r = te(e.props.children.at(-1))) == null ? void 0 : r.nextSibling
      ), e.props.children.push(s);
    else if (!s && l)
      g(l, !0), e.props.children.splice(o, 1), n = e.props.children.length, o--;
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
function ce(e, t) {
  let n = Math.max(e.props.children.length, t.props.children.length);
  const r = {};
  let o = 0;
  for (let i = 0; i < e.props.children.length; i++) {
    const c = e.props.children[i].props.key;
    if (c != null) {
      if (o++, r.hasOwnProperty(String(c))) {
        console.warn("Found two children with the same key", c), console.warn(
          "When two fibers are found having same key the whole children will default to manual updates, which can be slower than with key based reconciliation"
        ), $(e, t);
        return;
      }
      r[String(c)] = { fiber: e.props.children[i], index: i };
    }
  }
  if (o == 0) {
    $(e, t);
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
        ), $(e, t);
        return;
      }
      l[String(c)] = {
        fiber: a.fiber,
        newIndex: i,
        oldIndex: a.index
      };
    }
  }
  const s = Le(e);
  for (let i = 0; i < n; i++) {
    let c = e.props.children[i], a = t.props.children[i];
    const u = a != null && a.props.key ? String(a.props.key) : "", D = l.hasOwnProperty(u);
    let w = c != null && c.props.key ? String(c.props.key) : "";
    if (w && u && w === u) {
      E(c, a, i), s != null && s.dom && M(e.props.children[i], s.dom);
      continue;
    }
    const A = l.hasOwnProperty(w) && l[w].newIndex > i, C = l.hasOwnProperty(w) && l[w].newIndex < i;
    if ((A || C) && (G = !1), a && (a.parent = e), !c && a)
      if (D) {
        const { fiber: S } = l[u];
        e.props.children.push(S), E(S, a, i), s != null && s.dom && M(e.props.children[i], s.dom);
      } else
        s != null && s.dom && h(a, void 0, !1, !1, s.dom), e.props.children.push(a);
    else if (!a && c)
      g(c, !0), e.props.children.splice(i, 1), n = e.props.children.length, i--;
    else if (D) {
      const { fiber: S } = l[u];
      g(c, !0), G = !0, e.props.children[i] = S, E(S, a, i), s != null && s.dom && M(e.props.children[i], s.dom);
    } else if (A || C)
      s != null && s.dom && h(
        a,
        void 0,
        !1,
        !1,
        s.dom
      ), e.props.children[i] = a;
    else {
      E(c, a, i), s != null && s.dom && M(e.props.children[i], s.dom);
      const S = Math.max(
        e.props.children.length,
        t.props.children.length
      );
      S < n && (n = S, i--);
    }
    G = !0;
  }
}
typeof process < "u" && process.env.NODE_ENV === "test" && (module.exports = {
  createFiber: k,
  commitDeletion: g,
  commitFiber: h,
  updateFiber: pe,
  deepCompareFibers: de,
  deepEqual: T
});
let J = !1;
const Q = /* @__PURE__ */ new Set(), Y = /* @__PURE__ */ new Set(), j = /* @__PURE__ */ new WeakMap(), H = /* @__PURE__ */ new WeakMap();
function Ne(e) {
  Q.add(e), J || (J = !0, queueMicrotask(() => {
    Q.forEach((t) => {
      const n = t();
      if (Y.has(n))
        return;
      Y.add(n), n.__cleanup && typeof n.__cleanup == "function" && (n.__cleanup(), n.__cleanup = null);
      const r = n();
      if (typeof r == "function" && (n.__cleanup = r), j.has(n)) {
        const o = j.get(n);
        o && pe(o, r);
      }
      if (H.has(n)) {
        const o = H.get(n);
        o && n.__propName && Fe(n.__propName, o, r);
      }
    }), Y.clear(), Q.clear(), J = !1;
  }));
}
function De(e, t) {
  j.set(e, t);
}
function Re(e, t) {
  H.set(e, t);
}
function Ie(e) {
  H.delete(e);
  const t = e.__signals;
  if (t) {
    for (const n of t)
      n.removeDep(e);
    e.__signals = null;
  }
}
function Oe(e) {
  j.delete(e);
  const t = e.__signals;
  if (t) {
    for (const n of t)
      n.removeDep(e);
    e.__signals = null;
  }
}
let y = null, f = null;
function ne(e) {
  y.__signals || (y.__signals = /* @__PURE__ */ new Set()), y.__signals.add(e);
}
function re(e) {
  f.__signals || (f.__signals = /* @__PURE__ */ new Set()), f.__signals.add(e);
}
function Ge(e) {
  var n;
  if (typeof e != "function")
    throw new Error("reactive takes a render function as the argument");
  y = e;
  const t = e();
  if (y = null, !_(t) && L(t) && !t.type && !t.props && !((n = t.props) != null && n.children))
    throw new Error(
      "Reactive value must be primitive or functional component, got: " + typeof t
    );
  return t;
}
function We(e) {
  if (typeof e != "function")
    throw new Error("reactive takes a render function as the argument");
  y = e;
  const t = e();
  return y = null, t;
}
function $e(e) {
  if (typeof e != "function")
    throw new Error("createEffect takes a effect function as the argument");
  _e(e), me() || ye(e);
}
function ye(e, t) {
  if (typeof e != "function") return;
  f = e;
  const n = e();
  f.__signals && typeof n == "function" && (f.__cleanup = n), !f.__signals && n && typeof n == "function" && (t ? Ke(n, t) : ze(n)), f = null;
}
function Je(e) {
  if (typeof e != "function")
    throw new Error("computed takes a function as the argument");
  let t = me() !== null;
  f = () => {
    if (t) {
      t = !1;
      return;
    }
    r.update(e());
  }, _e(f);
  const n = e(), r = z(n);
  return f = null, {
    get value() {
      return r.value;
    }
  };
}
function Qe(e) {
  if (typeof e != "function")
    throw new Error("createPromise takes a function as the argument");
  const t = e();
  if (!(t instanceof Promise))
    throw new Error(
      "createPromise takes a function that returns a promise"
    );
  const n = z({
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
function Ye() {
  return new oe(null);
}
const X = [
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
class N {
  constructor(t) {
    this.isNotified = !1, this._val = t, this.deps = /* @__PURE__ */ new Set();
  }
  notify() {
    this.isNotified || (this.deps.size !== 0 && (this.isNotified = !0), this.deps.forEach((t) => {
      Ne(() => (this.isNotified = !1, t));
    }));
  }
  removeDep(t) {
    this.deps.delete(t);
  }
  clearDeps() {
    this.deps.clear();
  }
}
class je extends N {
  constructor(t) {
    if (!_(t))
      throw new Error(
        "Invalid type for PrimitiveSignal. Valid types: [boolean, string, number, undefined, null]"
      );
    super(t);
  }
  get value() {
    return f && (this.deps.add(f), re(this)), y && (this.deps.add(y), ne(this)), this._val;
  }
  update(t) {
    if (typeof t == "function") {
      const n = t(this._val);
      if (!_(n))
        throw new Error(
          "Invalid type for PrimitiveSignal. Valid types: [boolean, string, number, undefined, null]"
        );
      if (n === this._val) return;
      this._val = n, this.notify();
    } else {
      if (!_(t))
        throw new Error(
          "Invalid type for PrimitiveSignal. Valid types: [boolean, string, number, undefined, null]"
        );
      if (t === this._val) return;
      this._val = t, this.notify();
    }
  }
}
class He extends N {
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
          if (X.includes(String(r)) && !this.updateCalled)
            throw new Error(
              "Cannot set a value on an array signal, use the update method for updating the array."
            );
          return (...l) => {
            const s = o.apply(n, l);
            return X.includes(String(r)) && this.notify(), s;
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
    return f && (this.deps.add(f), re(this)), y && (this.deps.add(y), ne(this)), this._val;
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
class Xe extends N {
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
          if (!this.updateCalled && X.includes(String(r)))
            throw new Error(
              "Cannot set a value on an object signal, use the update method for updating the object."
            );
          return (...l) => {
            const s = o.apply(n, l);
            return X.includes(String(r)) && this.notify(), s;
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
    return f && (this.deps.add(f), re(this)), y && (this.deps.add(y), ne(this)), this._val;
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
function z(e) {
  if (typeof e == "function")
    throw new Error("Functions cannot be used as signal value");
  if (typeof e == "object" && e !== null)
    if (Array.isArray(e)) {
      const t = new He(e);
      return Z(t), {
        get value() {
          return t.value;
        },
        update: t.update.bind(t)
      };
    } else if (L(e)) {
      const t = new Xe(e);
      return Z(t), {
        get value() {
          return t.value;
        },
        update: t.update.bind(t)
      };
    } else
      throw new Error(
        "Invalid type for signal initialization: " + typeof e
      );
  else if (_(e)) {
    const t = new je(e);
    return Z(t), {
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
let d = null, p = /* @__PURE__ */ new WeakMap();
function ge(e) {
  d = e;
}
function we() {
  d = null;
}
function me() {
  return d;
}
function Ee(e) {
  if (p.has(e)) {
    const t = p.get(e);
    for (const n of t.effects)
      ye(n, e);
  }
}
function ze(e) {
  d && (p.has(d) ? p.get(d).cleanup.push(e) : p.set(d, {
    signals: /* @__PURE__ */ new Set(),
    cleanup: [e],
    effects: /* @__PURE__ */ new Set()
  }));
}
function Ke(e, t) {
  t && (p.has(t) ? p.get(t).cleanup.push(e) : p.set(t, {
    signals: /* @__PURE__ */ new Set(),
    cleanup: [e],
    effects: /* @__PURE__ */ new Set()
  }));
}
function _e(e) {
  if (d)
    if (p.has(d))
      p.get(d).effects.add(e);
    else {
      const t = /* @__PURE__ */ new Set();
      t.add(e), p.set(d, {
        signals: /* @__PURE__ */ new Set(),
        cleanup: [],
        effects: t
      });
    }
}
function Z(e) {
  if (d)
    if (p.has(d))
      p.get(d).signals.add(e);
    else {
      const t = /* @__PURE__ */ new Set();
      t.add(e), p.set(d, {
        signals: t,
        cleanup: [],
        effects: /* @__PURE__ */ new Set()
      });
    }
}
function Ue(e, t) {
  const n = p.get(e);
  if (n) {
    if (n.cleanup)
      for (const r of n.cleanup)
        r();
    n.cleanup = [];
    for (const r of n.effects) {
      if (r.__cleanup && typeof r.__cleanup == "function" && r.__cleanup(), r.__signals)
        for (const o of r.__signals)
          o.removeDep(r);
      delete r.__signals, delete r.__cleanup;
    }
    n.signals.forEach((r) => r.clearDeps()), n.signals.clear();
  }
  p.delete(e);
}
function Ze(e) {
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
    const o = z(!0), l = z(null);
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
    return /* @__PURE__ */ se("FRAGMENT", null, () => o.value ? r.fallback : l.value !== null ? r.errorFallback ? typeof r.errorFallback == "function" ? r.errorFallback(l.value) : r.errorFallback : "Unknown error occurred while lazy loading component, use errorFallback prop to override" : t && /* @__PURE__ */ se(t, { ...r }));
  };
}
export {
  ze as cleanUp,
  Je as computed,
  $e as createEffect,
  se as createElement,
  Qe as createPromise,
  Ye as createRef,
  z as createSignal,
  Ze as lazy,
  qe as render
};
