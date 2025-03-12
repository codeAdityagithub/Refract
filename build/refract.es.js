function T(e) {
  return typeof e == "object" && // Must be an object
  e !== null && // Cannot be null
  !Array.isArray(e) && // Cannot be an array
  Object.prototype.toString.call(e) === "[object Object]";
}
function _(e) {
  return ["boolean", "string", "number", "undefined"].includes(typeof e) || e === null || e instanceof Error;
}
const ce = "http://www.w3.org/2000/svg", Se = /* @__PURE__ */ new Set([
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
]), Fe = /* @__PURE__ */ new Set([
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
]), Ce = "http://www.w3.org/1998/Math/MathML", Z = /(PointerCapture)$|Capture$/i, ke = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
function Ae(e) {
  const t = [];
  for (const n in e) {
    const r = e[n], o = n.replace(/([A-Z])/g, "-$1").toLowerCase();
    typeof r != "number" || ke.test(o) ? t.push(`${o}: ${r};`) : t.push(`${o}: ${r}px;`);
  }
  return t.join(" ");
}
function Me(e) {
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
function Pe(e) {
  return T(e) || typeof e == "string";
}
function Te(e, t) {
  if (!Pe(e))
    throw new Error("Style attribute must be a plain object or a string");
  if (typeof e == "string")
    t.setAttribute("style", e);
  else {
    const n = Me(e);
    t.setAttribute("style", Ae(n));
  }
}
function Le(e, t, n, r) {
  e.__propName = t;
  const o = Qe(e);
  o == null || o === !1 || (b(t, o, n, r), e.__signals && je(e, n));
}
const Ne = /(PointerCapture)$|Capture$/i;
function b(e, t, n, r) {
  if (e == "style") {
    Te(t, n);
    return;
  }
  if (e[0] === "o" && e[1] === "n" && typeof t == "function") {
    const o = e != (e = e.replace(Ne, "$1"));
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
const w = Symbol("FRAGMENT");
function oe(e, t, ...n) {
  if (e === "FRAGMENT") {
    const r = L(n);
    return r[w] = !0, r;
  }
  return {
    type: e,
    props: {
      ...t,
      children: L(n)
    }
  };
}
function L(e) {
  return e.map((t) => {
    if (typeof t == "object") {
      if (Array.isArray(t))
        return L(t);
      if (t === null)
        return B("");
      if (!t.type || !t.props)
        throw new Error(
          "Invalid type for a dom node, found " + t
        );
      return t;
    } else if (typeof t == "function") {
      const n = Je(t);
      if (_(n))
        return j(
          "TEXT_CHILD",
          {
            nodeValue: n != null && n !== !1 ? String(n) : "",
            children: []
          },
          t
        );
      if (Array.isArray(n)) {
        const r = n[w];
        return j(
          "FRAGMENT",
          { children: r ? n : L(n) },
          t
        );
      } else if (!n.type || !n.props)
        throw new Error(
          "Invalid type for a dom node, found " + n
        );
      return j(n.type, n.props, t);
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
function j(e, t, n) {
  return {
    type: e,
    renderFunction: n,
    props: t
  };
}
function Re(e) {
  return e !== "children" && e !== "key" && e !== "ref";
}
function ue(e) {
  let t = null;
  Se.has(e.type) ? t = ce : Fe.has(e.type) && (t = Ce);
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
  e.props.ref && e.props.ref instanceof re && n instanceof HTMLElement && (e.props.ref.current = n);
  for (const r in e.props) {
    if (!Re(r))
      continue;
    const o = e.props[r];
    typeof o == "function" && r[0] !== "o" && r[1] !== "n" ? Le(o, r, n, t) : b(r, o, n, t);
  }
  return n;
}
function De(e, t, n) {
  n == null || e === "key" || b(e, n, t);
}
function be(e, t) {
  x = t;
  const n = document.createDocumentFragment();
  v = n;
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
function Ie() {
  v && x && x.appendChild(v);
}
let F = [], x = null, v = null, G = [];
function ie() {
  for (let e = 0; e < G.length; e++) {
    const t = G[e];
    Ee(t);
  }
  G.length = 0;
}
function fe(e) {
  ie();
  let t = !1;
  for (; F.length > 0 && !t; ) {
    const n = F.pop();
    Ge(n), t = e.timeRemaining() < 1;
  }
  if (F.length == 0) {
    Ie(), ie();
    return;
  }
  requestIdleCallback(fe);
}
function Ge(e) {
  var t;
  if (e.type === "FRAGMENT") {
    const n = !e.props.children[w];
    let r = !1;
    for (let o = e.props.children.length - 1; o >= 0; o--)
      e.props.children[o].parent = e, n && e.props.children[o].props.key === void 0 && e.renderFunction && (r = !0), F.push(e.props.children[o]);
    r && console.error("Array children must have a key attribute");
  } else if (typeof e.type == "function") {
    ge(e);
    const n = e.type(e.props);
    if (me(), Array.isArray(n)) {
      for (let r = n.length - 1; r >= 0; r--)
        n[r].parent = e, F.push(n[r]);
      e.props.children = n;
    } else
      n.parent = e, e.props.children.push(n), F.push(n);
    G.push(e);
  } else {
    e.dom || (e.dom = ue(e));
    let n = e.parent;
    for (; n && !n.dom; )
      n = n.parent;
    n && ((t = n.dom) == null || t.appendChild(e.dom));
    for (let r = e.props.children.length - 1; r >= 0; r--)
      e.props.children[r].parent = e, F.push(e.props.children[r]);
  }
  z(e);
}
function C(e) {
  if (e.type === "FRAGMENT")
    if (e.props.children[w])
      for (const n of e.props.children)
        n.parent = e, C(n);
    else {
      let n = !1;
      for (const r of e.props.children)
        r.parent = e, r.props.key === void 0 && (n = !0), C(r);
      n && console.error("Array children must have a key attribute");
    }
  else if (typeof e.type != "function")
    for (const t of e.props.children)
      t.parent = e, C(t);
  z(e);
}
function h(e, t, n, r, o) {
  var l, i;
  if (e.type === "FRAGMENT")
    for (const s of e.props.children)
      r && (s.parent = e), h(
        s,
        t,
        n,
        r,
        o
      );
  else if (typeof e.type == "function") {
    ge(e);
    const s = e.type(e.props);
    if (me(), Array.isArray(s)) {
      for (const a of s)
        a.parent = e, h(a, t, n, !0, o);
      e.props.children = s;
    } else
      s.parent = e, e.props.children.push(s), h(s, t, n, !0, o);
    queueMicrotask(() => {
      Ee(e);
    });
  } else {
    if (e.dom || (e.dom = ue(e)), t)
      n ? (l = t.parentElement) == null || l.replaceChild(
        e.dom,
        t
      ) : (i = t.parentElement) == null || i.insertBefore(
        e.dom,
        t
      );
    else {
      let s;
      if (o)
        s = o;
      else {
        let a = e.parent;
        for (; a && !a.dom; )
          a = a.parent;
        s = a == null ? void 0 : a.dom;
      }
      s == null || s.appendChild(e.dom);
    }
    for (const s of e.props.children)
      r && (s.parent = e), h(s, void 0, void 0, r, e.dom);
  }
  r && z(e);
}
let O = !0;
function g(e, t) {
  if (!(!e || !O)) {
    if (e.renderFunction && (t && Ke(e.renderFunction), delete e.renderFunction), e.dom) {
      for (const n in e.props)
        if ($(n)) {
          let r = n.toLowerCase().substring(2);
          const o = r != (r = r.replace(Z, "$1"));
          e.dom.removeEventListener(
            r,
            e.props[n],
            o
          ), delete e.props[n];
        } else typeof e.props[n] == "function" ? qe(e.props[n]) : n === "ref" && e.props[n] instanceof re && (e.props[n].current = null);
      e.dom.remove();
    }
    typeof e.type == "function" && (ve(e, e.props), delete e.type), e.props.children.forEach((n) => g(n, !0));
  }
}
function z(e) {
  e.renderFunction && ze(e.renderFunction, e);
}
function pe(e, t) {
  if (_(t)) {
    const n = {
      ...B(t),
      parent: e.parent
    };
    C(n), E(e, n);
  } else if (Array.isArray(t)) {
    const r = {
      type: "FRAGMENT",
      props: {
        children: t[w] ? t : L(t)
      },
      parent: e.parent
    };
    C(r), E(e, r);
  } else {
    const n = { ...t, parent: e.parent };
    C(n), E(e, n);
  }
}
function D(e, t) {
  e.renderFunction && (t.renderFunction = e.renderFunction, z(t));
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
const $ = (e) => e.startsWith("on") || e == "onFocusOut" || e == "onFocusIn", se = (e) => e !== "children" && !$(e) && e !== "key" && e !== "ref", q = (e, t, n) => e[n] !== t[n], Oe = (e, t, n) => !(n in t);
function de(e, t) {
  var n, r;
  return e === t ? !0 : e.type !== t.type || ((n = e.props) == null ? void 0 : n.key) !== ((r = t.props) == null ? void 0 : r.key) ? !1 : P(e.props, t.props);
}
function P(e, t) {
  if (e === t) {
    if (e instanceof N && t instanceof N)
      return P(e.value, t.value);
    if (Array.isArray(e) && Array.isArray(t)) {
      if (e.length !== t.length) return !1;
      for (let o = 0; o < e.length; o++)
        if (!P(e[o], t[o])) return !1;
    }
    return !0;
  }
  if (_(e) && _(t))
    return e === t;
  if (typeof e != typeof t) return !1;
  const n = Object.keys(e), r = Object.keys(t);
  if (n.length !== r.length) return !1;
  for (let o of n)
    if (o !== "children" && (!t.hasOwnProperty(o) || !P(e[o], t[o])))
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
function ee(e) {
  if (e) {
    if (e.dom) return e.dom;
    for (let t = e.props.children.length - 1; t >= 0; t--) {
      const n = e.props.children[t], r = ee(n);
      if (r) return r;
    }
  }
}
function $e(e) {
  if (e)
    for (let t = e.props.children.length - 1; t >= 0; t--) {
      const n = e.props.children[t], r = ee(n);
      if (r) return r;
    }
}
function He(e) {
  if (!e) return;
  let t = e.parent;
  for (; t && !t.dom; )
    t = t.parent;
  return t;
}
function We(e) {
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
          typeof e.type == typeof t.type && typeof e.type == "function" ? de(e, t) || (h(t, he(e), void 0, !0), D(e, t), g(e), I(e, t, n)) : le(e, t);
        else {
          t.parent = e.parent;
          let l = e.props.children[0];
          for (; l && !l.dom; )
            l = l.props.children[0];
          h(t, l == null ? void 0 : l.dom), D(e, t), g(e), I(e, t, n);
        }
      else {
        const l = e.dom;
        if (e.type === "TEXT_CHILD" && t.type === "TEXT_CHILD" && !t.dom && (t.dom = e.dom), l === void 0)
          return;
        if (t.type === "FRAGMENT" || typeof t.type == "function")
          t.parent = e.parent, D(e, t), h(t, l), g(e), I(e, t, n);
        else {
          for (const i in r)
            if (se(i) && Oe(r, o, i))
              l[i] = "";
            else if ($(i) && (!(i in o) || q(r, o, i))) {
              let s = i.toLowerCase().substring(2);
              const a = s != (s = s.replace(
                Z,
                "$1"
              ));
              l.removeEventListener(
                s,
                r[i],
                a
              );
            }
          if (e.type !== t.type)
            t.parent = e.parent, D(e, t), h(t, l, !0), g(e), I(e, t, n);
          else {
            for (const i in o)
              if (se(i) && q(r, o, i))
                l[i] = o[i], r[i] = o[i];
              else if ($(i) && q(r, o, i)) {
                let s = i.toLowerCase().substring(2);
                const a = s != (s = s.replace(
                  Z,
                  "$1"
                ));
                l.addEventListener(
                  s,
                  o[i],
                  a
                ), r[i] = o[i];
              }
            le(e, t);
          }
        }
      }
    }
  }
}
function Xe(e, t) {
  var a;
  const n = e.props.children, r = t.props.children, o = {};
  for (let c = 0; c < n.length; c++) {
    const u = n[c].props.key;
    if (u == null || o.hasOwnProperty(String(u)))
      return !1;
    o[String(u)] = n[c];
  }
  const l = (a = $e(e)) == null ? void 0 : a.nextSibling, i = He(e);
  if (r.length === 0) {
    e.props.children.length = 0, (i == null ? void 0 : i.dom) instanceof HTMLElement && (i.dom.innerHTML = "");
    return;
  }
  const s = e.props.children.length;
  for (let c = 0; c < r.length; c++) {
    const u = r[c], R = u.props.key, m = String(R);
    if (o.hasOwnProperty(m)) {
      const k = o[m];
      s > c ? e.props.children[c] = k : e.props.children.push(k), delete o[m];
      const A = t.props.children[c];
      A && (A.parent = e), E(k, A, c), M(
        e.props.children[c],
        i == null ? void 0 : i.dom,
        l
      );
    } else
      s > c ? e.props.children[c] = u : e.props.children.push(u), u.parent = e, h(
        u,
        l,
        !1,
        !1,
        i == null ? void 0 : i.dom
      );
  }
  for (const c in o)
    if (o.hasOwnProperty(c)) {
      const u = o[c];
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
function le(e, t) {
  const n = t.type === "FRAGMENT" && !t.props.children[w], r = e.type === "FRAGMENT" && !e.props.children[w];
  n && r ? Xe(e, t) === !1 && ae(e, t) : ae(e, t), t.type === "FRAGMENT" && t.props.children[w] ? e.props.children[w] = !0 : e.props.children[w] = !1, e.type = t.type;
}
function K(e, t) {
  var r;
  let n = Math.max(e.props.children.length, t.props.children.length);
  for (let o = 0; o < n; o++) {
    let l = e.props.children[o], i = t.props.children[o];
    if (i && (i.parent = e), !l && i)
      h(
        i,
        // @ts-expect-error
        (r = ee(e.props.children.at(-1))) == null ? void 0 : r.nextSibling
      ), e.props.children.push(i);
    else if (!i && l)
      g(l, !0), e.props.children.splice(o, 1), n = e.props.children.length, o--;
    else {
      E(l, i, o);
      const s = Math.max(
        e.props.children.length,
        t.props.children.length
      );
      s < n && (n = s, o--);
    }
  }
}
function ae(e, t) {
  let n = Math.max(e.props.children.length, t.props.children.length);
  const r = {};
  let o = 0;
  for (let s = 0; s < e.props.children.length; s++) {
    const a = e.props.children[s].props.key;
    if (a != null) {
      if (o++, r.hasOwnProperty(String(a))) {
        console.warn("Found two children with the same key", a), console.warn(
          "When two fibers are found having same key the whole children will default to manual updates, which can be slower than with key based reconciliation"
        ), K(e, t);
        return;
      }
      r[String(a)] = { fiber: e.props.children[s], index: s };
    }
  }
  if (o == 0) {
    K(e, t);
    return;
  }
  const l = {};
  for (let s = 0; s < t.props.children.length; s++) {
    const a = t.props.children[s].props.key;
    if (a == null)
      continue;
    const c = r[String(a)];
    if (c) {
      if (l.hasOwnProperty(String(a))) {
        console.warn("Found two children with the same key", a), console.warn(
          "When two fibers are found having same key the whole children will default to manual updates, which can be slower than with key based reconciliation"
        ), K(e, t);
        return;
      }
      l[String(a)] = {
        fiber: c.fiber,
        newIndex: s,
        oldIndex: c.index
      };
    }
  }
  const i = We(e);
  for (let s = 0; s < n; s++) {
    let a = e.props.children[s], c = t.props.children[s];
    const u = c != null && c.props.key ? String(c.props.key) : "", R = l.hasOwnProperty(u);
    let m = a != null && a.props.key ? String(a.props.key) : "";
    if (m && u && m === u) {
      E(a, c, s), i != null && i.dom && M(e.props.children[s], i.dom);
      continue;
    }
    const k = l.hasOwnProperty(m) && l[m].newIndex > s, A = l.hasOwnProperty(m) && l[m].newIndex < s;
    if ((k || A) && (O = !1), c && (c.parent = e), !a && c)
      if (R) {
        const { fiber: S } = l[u];
        e.props.children.push(S), E(S, c, s), i != null && i.dom && M(e.props.children[s], i.dom);
      } else
        i != null && i.dom && h(c, void 0, !1, !1, i.dom), e.props.children.push(c);
    else if (!c && a)
      g(a, !0), e.props.children.splice(s, 1), n = e.props.children.length, s--;
    else if (R) {
      const { fiber: S } = l[u];
      g(a, !0), O = !0, e.props.children[s] = S, E(S, c, s), i != null && i.dom && M(e.props.children[s], i.dom);
    } else if (k || A)
      i != null && i.dom && h(
        c,
        void 0,
        !1,
        !1,
        i.dom
      ), e.props.children[s] = c;
    else {
      E(a, c, s), i != null && i.dom && M(e.props.children[s], i.dom);
      const S = Math.max(
        e.props.children.length,
        t.props.children.length
      );
      S < n && (n = S, s--);
    }
    O = !0;
  }
}
typeof process < "u" && process.env.NODE_ENV === "test" && (module.exports = {
  createFiber: C,
  commitDeletion: g,
  commitFiber: h,
  updateFiber: pe,
  deepCompareFibers: de,
  deepEqual: P
});
let J = !1;
const Q = /* @__PURE__ */ new Set(), Y = /* @__PURE__ */ new Set(), H = /* @__PURE__ */ new WeakMap(), W = /* @__PURE__ */ new WeakMap();
function Ue(e) {
  Q.add(e), J || (J = !0, queueMicrotask(() => {
    Q.forEach((t) => {
      const n = t();
      if (Y.has(n))
        return;
      Y.add(n), n.__cleanup && typeof n.__cleanup == "function" && (n.__cleanup(), n.__cleanup = null);
      const r = n();
      if (typeof r == "function" && (n.__cleanup = r), H.has(n)) {
        const o = H.get(n);
        o && pe(o, r);
      }
      if (W.has(n)) {
        const o = W.get(n);
        o && n.__propName && De(n.__propName, o, r);
      }
    }), Y.clear(), Q.clear(), J = !1;
  }));
}
function ze(e, t) {
  H.set(e, t);
}
function je(e, t) {
  W.set(e, t);
}
function qe(e) {
  W.delete(e);
  const t = e.__signals;
  if (t) {
    for (const n of t)
      n.removeDep(e);
    e.__signals = null;
  }
}
function Ke(e) {
  H.delete(e);
  const t = e.__signals;
  if (t) {
    for (const n of t)
      n.removeDep(e);
    e.__signals = null;
  }
}
let y = null, f = null;
function te(e) {
  y.__signals || (y.__signals = /* @__PURE__ */ new Set()), y.__signals.add(e);
}
function ne(e) {
  f.__signals || (f.__signals = /* @__PURE__ */ new Set()), f.__signals.add(e);
}
function Je(e) {
  var n;
  if (typeof e != "function")
    throw new Error("reactive takes a render function as the argument");
  y = e;
  const t = e();
  if (y = null, !_(t) && T(t) && !t.type && !t.props && !((n = t.props) != null && n.children))
    throw new Error(
      "Reactive value must be primitive or functional component, got: " + typeof t
    );
  return t;
}
function Qe(e) {
  if (typeof e != "function")
    throw new Error("reactive takes a render function as the argument");
  y = e;
  const t = e();
  return y = null, t;
}
function et(e) {
  if (typeof e != "function")
    throw new Error("createEffect takes a effect function as the argument");
  _e(e), we() || ye(e);
}
function ye(e, t) {
  if (typeof e != "function") return;
  f = e;
  const n = e();
  f.__signals && typeof n == "function" && (f.__cleanup = n), !f.__signals && n && typeof n == "function" && (t ? xe(n, t) : Be(n)), f = null;
}
function tt(e) {
  if (typeof e != "function")
    throw new Error("computed takes a function as the argument");
  let t = we() !== null;
  f = () => {
    if (t) {
      t = !1;
      return;
    }
    r.update(e());
  }, _e(f);
  const n = e(), r = U(n);
  return f = null, {
    get value() {
      return r.value;
    }
  };
}
function nt(e) {
  if (typeof e != "function")
    throw new Error("createPromise takes a function as the argument");
  const t = e();
  if (!(t instanceof Promise))
    throw new Error(
      "createPromise takes a function that returns a promise"
    );
  const n = U({
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
class re {
  constructor(t) {
    this.current = t;
  }
}
function rt() {
  return new re(null);
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
      Ue(() => (this.isNotified = !1, t));
    }));
  }
  removeDep(t) {
    this.deps.delete(t);
  }
  clearDeps() {
    this.deps.clear();
  }
}
class Ye extends N {
  constructor(t) {
    if (!_(t))
      throw new Error(
        "Invalid type for PrimitiveSignal. Valid types: [boolean, string, number, undefined, null]"
      );
    super(t);
  }
  get value() {
    return f && (this.deps.add(f), ne(this)), y && (this.deps.add(y), te(this)), this._val;
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
class Ve extends N {
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
            const i = o.apply(n, l);
            return X.includes(String(r)) && this.notify(), i;
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
    return f && (this.deps.add(f), ne(this)), y && (this.deps.add(y), te(this)), this._val;
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
class Ze extends N {
  constructor(t) {
    if (!T(t))
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
            const i = o.apply(n, l);
            return X.includes(String(r)) && this.notify(), i;
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
    return f && (this.deps.add(f), ne(this)), y && (this.deps.add(y), te(this)), this._val;
  }
  update(t) {
    if (this.updateCalled = !0, typeof t == "function")
      t(this._val);
    else {
      if (!T(t))
        throw new Error(
          "Invalid type for ObjectSignal; value must be a plain object"
        );
      if (t === this._val) return;
      this._val = this.createProxy(t), this.notify();
    }
    this.updateCalled = !1;
  }
}
function U(e) {
  if (typeof e == "function")
    throw new Error("Functions cannot be used as signal value");
  if (typeof e == "object" && e !== null)
    if (Array.isArray(e)) {
      const t = new Ve(e);
      return V(t), {
        get value() {
          return t.value;
        },
        update: t.update.bind(t)
      };
    } else if (T(e)) {
      const t = new Ze(e);
      return V(t), {
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
    const t = new Ye(e);
    return V(t), {
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
function me() {
  d = null;
}
function we() {
  return d;
}
function Ee(e) {
  if (p.has(e)) {
    const t = p.get(e);
    for (const n of t.effects)
      ye(n, e);
  }
}
function Be(e) {
  d && (p.has(d) ? p.get(d).cleanup.push(e) : p.set(d, {
    signals: /* @__PURE__ */ new Set(),
    cleanup: [e],
    effects: /* @__PURE__ */ new Set()
  }));
}
function xe(e, t) {
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
function V(e) {
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
function ve(e, t) {
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
function ot(e) {
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
    const o = U(!0), l = U(null);
    n(o, l);
    const i = (s) => typeof s == "string" || s && typeof s == "object" && "props" in s && "type" in s;
    if (r.fallback !== void 0 && !i(r.fallback))
      throw new Error(
        "Invalid fallback: Expected a string or a valid JSX node."
      );
    if (r.errorFallback !== void 0 && !(typeof r.errorFallback == "function" || i(r.errorFallback)))
      throw new Error(
        "Invalid errorFallback: Expected a string, a valid JSX node, or a function returning a JSX node."
      );
    return /* @__PURE__ */ oe("FRAGMENT", null, () => o.value ? r.fallback : l.value !== null ? r.errorFallback ? typeof r.errorFallback == "function" ? r.errorFallback(l.value) : r.errorFallback : "Unknown error occurred while lazy loading component, use errorFallback prop to override" : (
      // @ts-expect-error
      t && /* @__PURE__ */ oe(t, { ...r })
    ));
  };
}
export {
  Be as cleanUp,
  tt as computed,
  et as createEffect,
  oe as createElement,
  nt as createPromise,
  rt as createRef,
  U as createSignal,
  ot as lazy,
  be as render
};
