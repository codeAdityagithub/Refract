function N(e) {
  return typeof e == "object" && // Must be an object
  e !== null && // Cannot be null
  !Array.isArray(e) && // Cannot be an array
  Object.prototype.toString.call(e) === "[object Object]";
}
function M(e) {
  return ["boolean", "string", "number", "undefined"].includes(typeof e) || e === null || e instanceof Error;
}
const ce = "http://www.w3.org/2000/svg", ke = /* @__PURE__ */ new Set([
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
]), Ae = /* @__PURE__ */ new Set([
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
]), Me = "http://www.w3.org/1998/Math/MathML", j = /(PointerCapture)$|Capture$/i, Te = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
function Ne(e) {
  const t = [];
  for (const n in e) {
    const r = e[n], o = n.replace(/([A-Z])/g, "-$1").toLowerCase();
    typeof r != "number" || Te.test(o) ? t.push(`${o}: ${r};`) : t.push(`${o}: ${r}px;`);
  }
  return t.join(" ");
}
function Pe(e) {
  const t = {};
  for (const n in e) {
    const r = e[n];
    if (typeof r == "object" && r !== null) {
      console.warn(`Nested styles not allowed for ${n}`);
      continue;
    }
    r == null || r === !1 || r === "" || (t[n] = r);
  }
  return t;
}
function Le(e) {
  return N(e) || typeof e == "string";
}
function Re(e, t) {
  if (!Le(e))
    throw new Error("Style attribute must be a plain object or a string");
  if (typeof e == "string")
    t.setAttribute("style", e);
  else {
    const n = Pe(e);
    t.setAttribute("style", Ne(n));
  }
}
function De(e, t, n, r) {
  e.__propName = t;
  const o = ve(e);
  o == null || o === !1 || (ee(t, o, n, r), e.__signals && Ye(e, n));
}
const Ge = /(PointerCapture)$|Capture$/i;
function ee(e, t, n, r) {
  if (e == "style") {
    Re(t, n);
    return;
  }
  if (e[0] === "o" && e[1] === "n" && typeof t == "function") {
    const o = e != (e = e.replace(Ge, "$1"));
    e.toLowerCase() in n || e == "onFocusOut" || e == "onFocusIn" || e === "onGotPointerCapture" || e === "onLostPointerCapture" ? e = e.toLowerCase().slice(2) : e = e.slice(2), n.addEventListener(e, t, o);
    return;
  }
  if (r === ce)
    e = e.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
  else if (e !== "width" && e !== "height" && e !== "href" && e !== "list" && e !== "form" && e !== "tabIndex" && e !== "download" && e !== "rowSpan" && e !== "colSpan" && e !== "role" && e !== "popover" && e in n)
    try {
      e === "value" && n.tagName === "SELECT" ? setTimeout(() => {
        n[e] = t ?? "";
      }) : n[e] = t ?? "";
      return;
    } catch {
    }
  t != null && (t !== !1 || e[4] === "-") && n.setAttribute(
    e,
    e === "popover" && t === !0 ? "" : t
  );
}
const h = Symbol("FRAGMENT");
function ne(e, t, ...n) {
  if (e === "FRAGMENT") {
    const r = P(n);
    return r[h] = !0, r;
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
        return B("");
      if (!t.type || !t.props)
        throw new Error(
          "Invalid type for a dom node, found " + t
        );
      return t;
    } else if (typeof t == "function") {
      const n = xe(t);
      if (M(n))
        return q(
          "TEXT_CHILD",
          {
            nodeValue: n != null && n !== !1 ? String(n) : "",
            children: []
          },
          t
        );
      if (Array.isArray(n)) {
        const r = n[h];
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
      return B(t);
  }).flat();
}
function B(e) {
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
function Ie(e) {
  return e !== "children" && e !== "key" && e !== "ref";
}
function ue(e) {
  let t = null;
  ke.has(e.type) ? t = ce : Ae.has(e.type) && (t = Me);
  const n = e.type === "TEXT_CHILD" ? document.createTextNode("") : t ? document.createElementNS(
    t,
    // @ts-expect-error
    e.type,
    e.props.is && e.props
  ) : (
    // @ts-expect-error
    document.createElement(e.type)
  );
  if (!e.props) return n;
  e.props.ref && e.props.ref instanceof te && n instanceof HTMLElement && (e.props.ref.current = n);
  for (const r in e.props) {
    if (!Ie(r))
      continue;
    const o = e.props[r];
    typeof o == "function" && r[0] !== "o" && r[1] !== "n" ? De(o, r, n, t) : ee(r, o, n, t);
  }
  return n;
}
function $e(e, t, n) {
  n == null || e === "key" || ee(e, n, t);
}
function ae(e, t) {
  return e === t ? !0 : e.type !== t.type || e.props?.key !== t.props?.key ? !1 : T(e.props, t.props);
}
function T(e, t) {
  if (e === t) {
    if (e instanceof L && t instanceof L)
      return T(e.value, t.value);
    if (Array.isArray(e) && Array.isArray(t)) {
      if (e.length !== t.length) return !1;
      for (let n = 0; n < e.length; n++)
        if (!T(e[n], t[n])) return !1;
    }
    return !0;
  }
  if (M(e) && M(t))
    return e === t;
  if (typeof e != typeof t) return !1;
  for (let n in e)
    if (n !== "children" && (!(n in t) || !T(e[n], t[n])))
      return !1;
  for (let n in t)
    if (n !== "children" && !(n in e))
      return !1;
  return !0;
}
function x(e) {
  if (e) {
    if (e.dom) return e.dom;
    for (const t of e.props.children) {
      const n = x(t);
      if (n) return n;
    }
  }
}
function W(e) {
  if (!e) return;
  let t = e.parent;
  for (; t && !t.dom; )
    t = t.parent;
  return t;
}
function Oe(e) {
  if (e)
    return e.dom ? e : W(e);
}
function it(e, t) {
  v = t;
  const n = document.createDocumentFragment();
  b = n;
  const r = {
    type: "div",
    props: {
      children: [e]
    },
    // @ts-expect-error
    dom: n
  };
  e.parent = r, w.push(e), requestIdleCallback(fe);
}
function He() {
  b && v && v.appendChild(b);
}
let w = [], v = null, b = null, D = [];
function re() {
  for (let e = 0; e < D.length; e++) {
    const t = D[e];
    Ce(t);
  }
  D.length = 0;
}
function fe(e) {
  re();
  let t = !1;
  for (; w.length > 0 && !t; ) {
    const n = w.pop();
    We(n), t = e.timeRemaining() < 1;
  }
  if (w.length == 0) {
    He(), re();
    return;
  }
  requestIdleCallback(fe);
}
function We(e) {
  if (e.type === "FRAGMENT") {
    const t = !e.props.children[h];
    let n = !1;
    for (let r = e.props.children.length - 1; r >= 0; r--)
      e.props.children[r].parent = e, t && e.props.children[r].props.key === void 0 && e.renderFunction && (n = !0), w.push(e.props.children[r]);
    n && console.error("Array children must have a key attribute");
  } else if (typeof e.type == "function") {
    _e(e);
    const t = e.type(e.props);
    if (Ee(), Array.isArray(t)) {
      for (let n = t.length - 1; n >= 0; n--)
        t[n].parent = e, w.push(t[n]);
      e.props.children = t;
    } else
      t.parent = e, e.props.children.push(t), w.push(t);
    D.push(e);
  } else {
    e.dom || (e.dom = ue(e));
    let t = W(e);
    t && t.dom?.appendChild(e.dom);
    for (let n = e.props.children.length - 1; n >= 0; n--)
      e.props.children[n].parent = e, w.push(e.props.children[n]);
  }
  U(e);
}
function F(e) {
  if (e.type === "FRAGMENT")
    if (e.props.children[h])
      for (const n of e.props.children)
        n.parent = e, F(n);
    else {
      let n = !1;
      for (const r of e.props.children)
        r.parent = e, r.props.key === void 0 && (n = !0), F(r);
      n && console.error("Array children must have a key attribute");
    }
  else if (typeof e.type != "function")
    for (const t of e.props.children)
      t.parent = e, F(t);
  U(e);
}
function p(e, t, n, r, o) {
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
    _e(e);
    const i = e.type(e.props);
    if (Ee(), Array.isArray(i)) {
      for (const s of i)
        s.parent = e, p(s, t, n, !0, o);
      e.props.children = i;
    } else
      i.parent = e, e.props.children.push(i), p(i, t, n, !0, o);
    queueMicrotask(() => {
      Ce(e);
    });
  } else {
    if (e.dom || (e.dom = ue(e)), t)
      n ? t.parentElement?.replaceChild(
        e.dom,
        t
      ) : t.parentElement?.insertBefore(
        e.dom,
        t
      );
    else {
      let i;
      o ? i = o : i = W(e)?.dom, i?.appendChild(e.dom);
    }
    for (const i of e.props.children)
      r && (i.parent = e), p(i, void 0, void 0, r, e.dom);
  }
  r && U(e);
}
let G = !0;
function _(e, t) {
  if (!(!e || !G)) {
    if (e.renderFunction && (t && Je(e.renderFunction), delete e.renderFunction), e.dom) {
      for (const n in e.props)
        if (I(n)) {
          let r = n.toLowerCase().substring(2);
          const o = r != (r = r.replace(j, "$1"));
          e.dom.removeEventListener(
            r,
            e.props[n],
            o
          ), delete e.props[n];
        } else typeof e.props[n] == "function" ? Ze(e.props[n]) : n === "ref" && e.props[n] instanceof te && (e.props[n].current = null);
      e.dom.remove();
    }
    typeof e.type == "function" && (ot(e, e.props), delete e.type), e.props.children.forEach((n) => _(n, !0));
  }
}
function U(e) {
  e.renderFunction && Qe(e.renderFunction, e);
}
function pe(e, t) {
  if (M(t)) {
    const n = {
      ...B(t),
      parent: e.parent
    };
    F(n), y(e, n);
  } else if (Array.isArray(t)) {
    const r = {
      type: "FRAGMENT",
      props: {
        children: t[h] ? t : P(t)
      },
      parent: e.parent
    };
    F(r), y(e, r);
  } else {
    const n = { ...t, parent: e.parent };
    F(n), y(e, n);
  }
}
function Ue(e, t) {
  e.renderFunction && (t.renderFunction = e.renderFunction, U(t));
}
function Xe(e, t, n) {
  if (n !== void 0) {
    e.parent.props.children[n] = t;
    return;
  }
  for (let r = 0; r < e.parent.props.children.length; r++)
    e.parent.props.children[r] === e && (e.parent.props.children[r] = t);
}
function R(e, t, n) {
  Ue(e, t), _(e), Xe(e, t, n);
}
const I = (e) => e.startsWith("on") || e == "onFocusOut" || e == "onFocusIn", oe = (e) => e !== "children" && !I(e) && e !== "key" && e !== "ref", z = (e, t, n) => e[n] !== t[n], qe = (e, t, n) => !(n in t);
function y(e, t, n) {
  if (!(!e && !t)) {
    if (e && !t)
      _(e, !0), e.parent.props.children = e.parent.props.children.filter(
        (r) => r !== e
      );
    else if (e && t) {
      const r = e.props, o = t.props;
      if (e.type === "FRAGMENT" || typeof e.type == "function")
        if (t.type === "FRAGMENT" || typeof t.type == "function")
          typeof e.type == typeof t.type && typeof e.type == "function" ? ae(e, t) || (p(t, x(e), void 0, !0), R(e, t, n)) : ie(e, t);
        else {
          t.parent = e.parent;
          let i = x(e.props.children[0]);
          p(t, i), R(e, t, n);
        }
      else {
        const i = e.dom;
        if (e.type === "TEXT_CHILD" && t.type === "TEXT_CHILD" && !t.dom && (t.dom = e.dom), i === void 0)
          return;
        if (t.type === "FRAGMENT" || typeof t.type == "function")
          t.parent = e.parent, p(t, i), R(e, t, n);
        else {
          for (const s in r)
            if (oe(s) && qe(r, o, s))
              i[s] = "";
            else if (I(s) && (!(s in o) || z(r, o, s))) {
              let c = s.toLowerCase().substring(2);
              const l = c != (c = c.replace(
                j,
                "$1"
              ));
              i.removeEventListener(
                c,
                r[s],
                l
              );
            }
          if (e.type !== t.type)
            t.parent = e.parent, p(t, i, !0), R(e, t, n);
          else {
            for (const s in o)
              if (oe(s) && z(r, o, s))
                i[s] = o[s], r[s] = o[s];
              else if (I(s) && z(r, o, s)) {
                let c = s.toLowerCase().substring(2);
                const l = c != (c = c.replace(
                  j,
                  "$1"
                ));
                i.addEventListener(
                  c,
                  o[s],
                  l
                ), r[s] = o[s];
              }
            ie(e, t);
          }
        }
      }
    }
  }
}
function ze(e, t) {
  const n = e.props.children, r = t.props.children, o = {};
  for (let l = 0; l < n.length; l++) {
    const u = n[l].props.key;
    if (u == null || String(u) in o)
      return !1;
    o[String(u)] = n[l];
  }
  const i = W(e);
  if (r.length === 0) {
    e.props.children.length = 0, i?.dom instanceof HTMLElement && (i.dom.innerHTML = "");
    return;
  }
  const s = document.createDocumentFragment(), c = e.props.children.length;
  for (let l = 0; l < r.length; l++) {
    const u = r[l], E = u.props.key, S = String(E);
    if (S in o) {
      const g = o[S];
      c > l ? e.props.children[l] = g : e.props.children.push(g), delete o[S];
      const k = t.props.children[l];
      k && (k.parent = e), y(g, k, l), A(e.props.children[l], s);
    } else
      c > l ? e.props.children[l] = u : e.props.children.push(u), u.parent = e, p(u, void 0, !1, !1, s);
  }
  for (const l in o) {
    const u = o[l];
    _(u, !0);
  }
  for (; e.props.children.length > t.props.children.length; )
    e.props.children.pop();
  i?.dom?.appendChild(s);
}
function A(e, t, n) {
  if (e.dom) {
    if (e.dom === t || e.dom === n) return;
    t.appendChild(e.dom);
  } else
    for (const r of e.props.children)
      A(r, t, n);
}
function ie(e, t) {
  const n = t.type === "FRAGMENT" && !t.props.children[h], r = e.type === "FRAGMENT" && !e.props.children[h];
  n && r ? ze(e, t) === !1 && se(e, t) : se(e, t), t.type === "FRAGMENT" && t.props.children[h] ? e.props.children[h] = !0 : e.props.children[h] = !1, e.type = t.type;
}
function K(e, t) {
  let n = Math.max(e.props.children.length, t.props.children.length);
  for (let r = 0; r < n; r++) {
    let o = e.props.children[r], i = t.props.children[r];
    if (i && (i.parent = e), !o && i)
      p(i), e.props.children.push(i);
    else if (!i && o)
      _(o, !0), e.props.children.splice(r, 1), n = e.props.children.length, r--;
    else {
      y(o, i, r);
      const s = Math.max(
        e.props.children.length,
        t.props.children.length
      );
      s < n && (n = s, r--);
    }
  }
}
function se(e, t) {
  let n = Math.max(e.props.children.length, t.props.children.length);
  const r = {};
  let o = 0;
  for (let c = 0; c < e.props.children.length; c++) {
    const l = e.props.children[c].props.key;
    if (l != null) {
      if (o++, String(l) in r) {
        console.warn("Found two children with the same key", l), console.warn(
          "When two fibers are found having same key the whole children will default to manual updates, which can be slower than with key based reconciliation"
        ), K(e, t);
        return;
      }
      r[String(l)] = { fiber: e.props.children[c], index: c };
    }
  }
  if (o == 0) {
    K(e, t);
    return;
  }
  const i = {};
  for (let c = 0; c < t.props.children.length; c++) {
    const l = t.props.children[c].props.key;
    if (l == null)
      continue;
    const u = r[String(l)];
    if (u) {
      if (String(l) in i) {
        console.warn("Found two children with the same key", l), console.warn(
          "When two fibers are found having same key the whole children will default to manual updates, which can be slower than with key based reconciliation"
        ), K(e, t);
        return;
      }
      i[String(l)] = {
        fiber: u.fiber,
        newIndex: c,
        oldIndex: u.index
      };
    }
  }
  const s = Oe(e);
  for (let c = 0; c < n; c++) {
    let l = e.props.children[c], u = t.props.children[c];
    const E = u?.props.key ? String(u.props.key) : "", S = E in i;
    let g = l?.props.key ? String(l.props.key) : "";
    if (g && E && g === E) {
      y(l, u, c), s?.dom && A(e.props.children[c], s.dom);
      continue;
    }
    const k = g in i && i[g].newIndex !== c;
    if (k && (G = !1), u && (u.parent = e), !l && u)
      if (S) {
        const { fiber: m } = i[E];
        e.props.children.push(m), y(m, u, c), s?.dom && A(e.props.children[c], s.dom);
      } else
        s?.dom && p(u, void 0, !1, !1, s.dom), e.props.children.push(u);
    else if (!u && l)
      _(l, !0), e.props.children.splice(c, 1), n = e.props.children.length, c--;
    else if (S) {
      const { fiber: m } = i[E];
      _(l, !0), G = !0, e.props.children[c] = m, y(m, u, c), s?.dom && A(e.props.children[c], s.dom);
    } else if (k)
      s?.dom && p(
        u,
        void 0,
        !1,
        !1,
        s.dom
      ), e.props.children[c] = u;
    else {
      y(l, u, c), s?.dom && A(e.props.children[c], s.dom);
      const m = Math.max(
        e.props.children.length,
        t.props.children.length
      );
      m < n && (n = m, c--);
    }
    G = !0;
  }
}
typeof process < "u" && process.env.NODE_ENV === "test" && (module.exports = {
  createFiber: F,
  commitDeletion: _,
  commitFiber: p,
  updateFiber: pe,
  deepCompareFibers: ae,
  deepEqual: T
});
let Q = !1;
const Y = /* @__PURE__ */ new Set(), Z = /* @__PURE__ */ new Set(), $ = /* @__PURE__ */ new WeakMap(), O = /* @__PURE__ */ new WeakMap();
function Ke(e) {
  Y.add(e), Q || (Q = !0, queueMicrotask(() => {
    Y.forEach((t) => {
      const n = t();
      if (Z.has(n))
        return;
      Z.add(n), n.__cleanup && typeof n.__cleanup == "function" && (n.__cleanup(), n.__cleanup = null);
      const r = n();
      if (typeof r == "function" && (n.__cleanup = r), $.has(n)) {
        const o = $.get(n);
        o && pe(o, r);
      }
      if (O.has(n)) {
        const o = O.get(n);
        o && n.__propName && $e(n.__propName, o, r);
      }
    }), Z.clear(), Y.clear(), Q = !1;
  }));
}
function Qe(e, t) {
  $.set(e, t);
}
function Ye(e, t) {
  O.set(e, t);
}
function Ze(e) {
  O.delete(e);
  const t = e.__signals;
  if (t) {
    for (const n of t)
      n.removeDep(e);
    e.__signals = null;
  }
}
function Je(e) {
  $.delete(e);
  const t = e.__signals;
  if (t) {
    for (const n of t)
      n.removeDep(e);
    e.__signals = null;
  }
}
const Ve = [
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
function le(e) {
  return Ve.includes(String(e));
}
// @ts-expect-error
process.env.NODE_ENV;
function J(e) {
  return {
    get value() {
      return e.value;
    },
    update: e.update.bind(e)
  };
}
const de = (e, t) => new Proxy(e, {
  get: (n, r) => {
    const o = n[r];
    if (typeof o == "function") {
      if (le(r) && !t.updateCalled)
        throw new Error(
          "Cannot set a value on an array signal, use the update method for updating the array."
        );
      return (...i) => {
        const s = o.apply(n, i);
        return le(r) && t.notify(), s;
      };
    }
    return o;
  },
  set: (n, r, o) => {
    if (!t.updateCalled)
      throw new Error(
        "Cannot set a value on an array signal, use the update method for updating the array."
      );
    return n[r] = o, t.notify(), !0;
  }
});
let C = null, d = null;
function he(e) {
  d = e;
}
function ye() {
  d = null;
}
function ge(e) {
  C = e;
}
function me() {
  C = null;
}
function je(e) {
  C.__signals || (C.__signals = /* @__PURE__ */ new Set()), C.__signals.add(e);
}
function Be(e) {
  d.__signals || (d.__signals = /* @__PURE__ */ new Set()), d.__signals.add(e);
}
function xe(e) {
  if (typeof e != "function")
    throw new Error("reactive takes a render function as the argument");
  ge(e);
  const t = e();
  if (me(), !M(t) && N(t) && !t.type && !t.props && !t.props?.children)
    throw new Error(
      "Reactive value must be primitive or functional component, got: " + typeof t
    );
  return t;
}
function ve(e) {
  if (typeof e != "function")
    throw new Error("reactive takes a render function as the argument");
  ge(e);
  const t = e();
  return me(), t;
}
function st(e) {
  if (typeof e != "function")
    throw new Error("createEffect takes a effect function as the argument");
  Se(e), Fe() || we(e);
}
function we(e, t) {
  if (typeof e != "function") return;
  he(e);
  const n = e();
  d.__signals && typeof n == "function" && (d.__cleanup = n), !d.__signals && n && typeof n == "function" && (t ? rt(n, t) : nt(n)), ye();
}
function lt(e) {
  if (typeof e != "function")
    throw new Error("computed takes a function as the argument");
  let t = Fe() !== null;
  he(() => {
    if (t) {
      t = !1;
      return;
    }
    r.update(e());
  }), Se(d);
  const n = e(), r = H(n);
  return ye(), {
    get value() {
      return r.value;
    }
  };
}
function ct(e) {
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
class te {
  constructor(t) {
    this.current = t;
  }
}
function ut() {
  return new te(null);
}
class L {
  constructor(t) {
    this.isNotified = !1, this._val = t, this.deps = /* @__PURE__ */ new Set();
  }
  notify() {
    this.isNotified || (this.deps.size !== 0 && (this.isNotified = !0), this.deps.forEach((t) => {
      Ke(() => (this.isNotified = !1, t));
    }));
  }
  removeDep(t) {
    this.deps.delete(t);
  }
  clearDeps() {
    this.deps.clear();
  }
  get value() {
    return d && (this.deps.add(d), Be(this)), C && (this.deps.add(C), je(this)), this._val;
  }
}
class be extends L {
  constructor(t) {
    super(t);
  }
  update(t) {
    if (typeof t == "function") {
      const n = t(this._val);
      if (n === this._val) return;
      this._val = n, this.notify();
    } else {
      if (t === this._val) return;
      this._val = t, this.notify();
    }
  }
}
class et extends L {
  constructor(t) {
    super(t), this.updateCalled = !1, this._val = this.createProxy(t);
  }
  createProxy(t) {
    return de(t, this);
  }
  update(t) {
    if (this.updateCalled = !0, typeof t == "function")
      t(this._val);
    else {
      if (t === this._val) return;
      this._val = this.createProxy(t), this.notify();
    }
    this.updateCalled = !1;
  }
}
class tt extends L {
  constructor(t) {
    N(t), super(t), this.updateCalled = !1, this._val = this.createProxy(t);
  }
  createInternalArrayProxy(t) {
    return de(t, this);
  }
  createProxy(t) {
    return new Proxy(t, {
      get: (n, r) => {
        const o = n[r];
        return Array.isArray(o) ? (n[r] = this.createInternalArrayProxy(o), n[r]) : o;
      },
      set: (n, r, o) => (this.updateCalled, typeof o == "function" ? !1 : (typeof o == "object" && o !== null && (o = this.createProxy(o)), o === n[r] || (n[r] = o, this.notify()), !0)),
      deleteProperty: (n, r) => {
        const o = delete n[r];
        return this.notify(), o;
      }
    });
  }
  update(t) {
    if (this.updateCalled = !0, typeof t == "function")
      t(this._val);
    else {
      if (N(t), t === this._val) return;
      this._val = this.createProxy(t), this.notify();
    }
    this.updateCalled = !1;
  }
}
function H(e) {
  if (typeof e == "object" && e !== null) {
    if (Array.isArray(e)) {
      const t = new et(e);
      return V(t), J(t);
    } else if (N(e)) {
      const t = new tt(e);
      return V(t), J(t);
    }
  } else if (M(e)) {
    const t = new be(e);
    return V(t), J(t);
  }
}
let f = null, a = /* @__PURE__ */ new WeakMap();
function _e(e) {
  f = e;
}
function Ee() {
  f = null;
}
function Fe() {
  return f;
}
function X() {
  return {
    signals: /* @__PURE__ */ new Set(),
    cleanup: [],
    effects: /* @__PURE__ */ new Set()
  };
}
function Ce(e) {
  if (a.has(e)) {
    const t = a.get(e);
    for (const n of t.effects)
      we(n, e);
  }
}
function nt(e) {
  if (f)
    if (a.has(f))
      a.get(f).cleanup.push(e);
    else {
      let t = X();
      t.cleanup.push(e), a.set(f, t);
    }
}
function rt(e, t) {
  if (t)
    if (a.has(t))
      a.get(t).cleanup.push(e);
    else {
      let n = X();
      n.cleanup.push(e), a.set(t, n);
    }
}
function Se(e) {
  if (f)
    if (a.has(f))
      a.get(f).effects.add(e);
    else {
      let t = X();
      t.effects.add(e), a.set(f, t);
    }
}
function V(e) {
  if (f)
    if (a.has(f))
      a.get(f).signals.add(e);
    else {
      let t = X();
      t.signals.add(e), a.set(f, t);
    }
}
function ot(e, t) {
  const n = a.get(e);
  if (n) {
    if (n.cleanup)
      for (const r of n.cleanup)
        r();
    n.cleanup = [];
    for (const r of n.effects) {
      if (r.__cleanup && r.__cleanup(), r.__signals)
        for (const o of r.__signals)
          o.removeDep(r);
      delete r.__signals, delete r.__cleanup;
    }
    n.signals.forEach((r) => r.clearDeps()), n.signals.clear();
  }
  a.delete(e);
}
function at(e) {
  let t = null;
  const n = (r, o) => {
    t ? (r.update(!1), o.update(null)) : e().then((i) => {
      if (i.default) {
        if (typeof i.default != "function")
          throw new Error(
            "Lazy-loaded component must be a functional component"
          );
        t = i.default, r.update(!1), o.update(null);
      } else
        o.update(
          new Error(
            "No default export found from lazy-loaded module"
          )
        );
    }).catch((i) => {
      o.update(i), r.update(!1);
    });
  };
  return (r) => {
    const o = H(!0), i = H(null);
    return n(o, i), /* @__PURE__ */ ne("FRAGMENT", null, () => o.value ? r.fallback : i.value !== null ? r.errorFallback ? typeof r.errorFallback == "function" ? r.errorFallback(i.value) : r.errorFallback : "Unknown error occurred while lazy loading component, use errorFallback prop to override" : (
      // @ts-expect-error
      t && /* @__PURE__ */ ne(t, { ...r })
    ));
  };
}
export {
  nt as cleanUp,
  lt as computed,
  st as createEffect,
  ne as createElement,
  ct as createPromise,
  ut as createRef,
  H as createSignal,
  at as lazy,
  it as render
};
