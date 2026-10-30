/*!
 * iso-kit.js: technical isometric scene kit (CS Automation Studio portfolio)
 * No modules, no build step. Exposes window.IsoKit.
 *
 * Projection: true isometric, ground axes at +-30 deg, parallel (no foreshortening).
 *   screen.x = (x - y) * cos30
 *   screen.y = (x + y) * sin30 - z
 * World units == viewBox px of a 1000-wide viewBox. +x runs down-right,
 * +y runs down-left, +z is up. Lift with z, never with scale.
 */
(function (w, d) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var C30 = Math.sqrt(3) / 2;
  var S30 = 0.5;
  var BP = 950;
  var docEl = d.documentElement;
  var HAS = Object.prototype.hasOwnProperty;
  var CJK = /[\u1100-\u11ff\u2e80-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/;

  function mq(q) { return (w.matchMedia && w.matchMedia(q)) || { matches: false }; }
  function onMq(m, fn) {
    if (m.addEventListener) m.addEventListener('change', fn);
    else if (m.addListener) m.addListener(fn);
  }
  var mqReduce = mq('(prefers-reduced-motion: reduce)');
  var mqDesk = mq('(min-width: ' + BP + 'px)');

  /* ---------- small utils ---------- */
  function r2(n) { return Math.round(n * 100) / 100; }
  function list(nl) { return Array.prototype.slice.call(nl || []); }
  function cls() { return list(arguments).filter(Boolean).join(' '); }
  function pick(sel, ctx) { return typeof sel === 'string' ? (ctx || d).querySelector(sel) : (sel || null); }
  function num(v, dflt) { v = +v; return isFinite(v) ? v : dflt; }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ext(a, b) { var o = {}, k; for (k in a || {}) if (HAS.call(a, k)) o[k] = a[k]; for (k in b || {}) if (HAS.call(b, k)) o[k] = b[k]; return o; }
  function isDesktop() { return !!mqDesk.matches; }

  /* ---------- projection ---------- */
  function iso(x, y, z) {
    if (Array.isArray(x)) { z = x[2]; y = x[1]; x = x[0]; }
    x = num(x, 0); y = num(y, 0); z = num(z, 0);
    return { x: r2((x - y) * C30), y: r2((x + y) * S30 - z) };
  }
  // arrays are world points, {x, y} objects are already-projected screen points
  function screen(p) { return Array.isArray(p) ? iso(p) : { x: num(p && p.x, 0), y: num(p && p.y, 0) }; }
  function points(pts) {
    return pts.map(function (p) { var q = screen(p); return q.x + ',' + q.y; }).join(' ');
  }
  function route(pts, closed) {
    if (!pts || !pts.length) return '';
    return pts.map(function (p, i) { var q = screen(p); return (i ? 'L' : 'M') + q.x + ' ' + q.y; }).join(' ') + (closed ? ' Z' : '');
  }

  /* ---------- SVG factory ---------- */
  function el(tag, attrs, parent) {
    var n = d.createElementNS(NS, tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'text') n.textContent = String(v);
        else if (k === 'cls' || k === 'class') { if (v) n.setAttribute('class', v); }
        else n.setAttribute(k, v === true ? '' : String(v));
      });
    }
    if (parent) parent.appendChild(n);
    return n;
  }

  /* ---------- geometry ---------- */
  function boxFaces(x, y, z, wd, dp, h) {
    var t = z + h;
    return {
      top: [[x, y, t], [x + wd, y, t], [x + wd, y + dp, t], [x, y + dp, t]],
      left: [[x, y + dp, t], [x + wd, y + dp, t], [x + wd, y + dp, z], [x, y + dp, z]],
      right: [[x + wd, y, t], [x + wd, y + dp, t], [x + wd, y + dp, z], [x + wd, y, z]]
    };
  }

  // slab(parent, {x,y,z,w,d,h,cls,id,hatch:true|'top'|'sides', pattern})
  function slab(parent, o) {
    o = o || {};
    var x = num(o.x, 0), y = num(o.y, 0), z = num(o.z, 0);
    var wd = num(o.w, 100), dp = num(o.d, 100), h = num(o.h, 16);
    var f = boxFaces(x, y, z, wd, dp, h);
    var g = el('g', { 'class': cls('iso-slab', o.hatch && 'is-hatched', o.cls), id: o.id }, parent);
    var faces = h > 0 ? ['left', 'right', 'top'] : ['top'];
    var hatchFaces = !o.hatch ? [] : o.hatch === 'top' ? ['top'] : o.hatch === 'sides' ? ['left', 'right'] : faces;
    var fill = 'url(#' + (o.pattern || 'iso-hatch') + ')';
    faces.forEach(function (k) {
      el('polygon', { 'class': 'iso-face iso-' + k, points: points(f[k]) }, g);
      if (hatchFaces.indexOf(k) > -1) el('polygon', { 'class': 'iso-hatch-fill', points: points(f[k]), fill: fill }, g);
    });
    el('path', { 'class': 'iso-edge', d: faces.map(function (k) { return route(f[k], true); }).join(' ') }, g);
    g.iso = { x: x, y: y, z: z, w: wd, d: dp, h: h };
    return g;
  }

  // plane(parent, {x,y,z,w,d,cls,id,hatch,pattern})
  function plane(parent, o) {
    o = o || {};
    var x = num(o.x, 0), y = num(o.y, 0), z = num(o.z, 0);
    var wd = num(o.w, 100), dp = num(o.d, 100);
    var pts = points([[x, y, z], [x + wd, y, z], [x + wd, y + dp, z], [x, y + dp, z]]);
    var g = el('g', { 'class': cls('iso-plane', o.cls), id: o.id }, parent);
    el('polygon', { 'class': 'iso-plane-fill', points: pts }, g);
    if (o.hatch) el('polygon', { 'class': 'iso-hatch-fill', points: pts, fill: 'url(#' + (o.pattern || 'iso-hatch') + ')' }, g);
    el('polygon', { 'class': 'iso-plane-edge', points: pts, fill: 'none' }, g);
    g.iso = { x: x, y: y, z: z, w: wd, d: dp, h: 0 };
    return g;
  }

  // grid(parent, {x,y,z,w,d,step,cls})
  function grid(parent, o) {
    o = o || {};
    var x = num(o.x, 0), y = num(o.y, 0), z = num(o.z, 0);
    var wd = num(o.w, 400), dp = num(o.d, 400), s = num(o.step, 40), parts = [];
    for (var i = 0; i <= wd + 0.001; i += s) parts.push(route([[x + i, y, z], [x + i, y + dp, z]]));
    for (var j = 0; j <= dp + 0.001; j += s) parts.push(route([[x, y + j, z], [x + wd, y + j, z]]));
    return el('path', { 'class': cls('iso-grid-line', o.cls), id: o.id, d: parts.join(' ') }, parent);
  }

  // wire(parent, {points, closed, cls, id, arrow: true|'strong'|'accent'|'danger'})
  function wire(parent, o) {
    o = o || {};
    var a = o.arrow;
    var mk = a ? 'url(#iso-arrow' + (a === 'accent' ? '-accent' : a === 'danger' ? '-danger' : a === 'strong' ? '-strong' : '') + ')' : null;
    return el('path', { 'class': cls('iso-wire', o.cls), id: o.id, d: route(o.points || [], o.closed), 'marker-end': mk }, parent);
  }

  // anchor(group, 'top'|'left'|'right'|'front'|'bottom') -> world point
  function anchor(g, face) {
    var b = g && g.iso;
    if (!b) return [0, 0, 0];
    switch (face) {
      case 'left': return [b.x + b.w / 2, b.y + b.d, b.z + b.h / 2];
      case 'right': return [b.x + b.w, b.y + b.d / 2, b.z + b.h / 2];
      case 'front': return [b.x + b.w, b.y + b.d, b.z + b.h];
      case 'bottom': return [b.x + b.w / 2, b.y + b.d / 2, b.z];
      default: return [b.x + b.w / 2, b.y + b.d / 2, b.z + b.h];
    }
  }

  /* ---------- SVG text ---------- */
  function fontSizeOf(t) {
    var fs = 0;
    try { fs = parseFloat(w.getComputedStyle(t).fontSize); } catch (e) { fs = 0; }
    return fs > 0 ? fs : 20;
  }
  function setText(t, text, x) {
    var lines = String(text == null ? '' : text).split('\n');
    while (t.firstChild) t.removeChild(t.firstChild);
    var first = r2(0.35 - (lines.length - 1) * 0.625);
    lines.forEach(function (s, i) { el('tspan', { x: x, dy: (i ? 1.25 : first) + 'em', text: s }, t); });
    t._isoLines = lines;
    return lines;
  }
  function measure(t) {
    var b = null;
    try { b = t.getBBox(); } catch (e) { b = null; }
    if (b && b.width > 0 && b.height > 0) return { x: b.x, y: b.y, width: b.width, height: b.height };
    var fs = fontSizeOf(t), lines = t._isoLines || [t.textContent || ''], wmax = 0;
    lines.forEach(function (s) {
      var n = 0;
      for (var i = 0; i < s.length; i++) n += CJK.test(s.charAt(i)) ? 1 : 0.62;
      wmax = Math.max(wmax, n * fs);
    });
    return { x: null, y: null, width: wmax, height: fs * (1.25 * (lines.length - 1) + 1.2) };
  }
  function setRect(r, x, y, wd, h, rx) {
    r.setAttribute('x', r2(x)); r.setAttribute('y', r2(y));
    r.setAttribute('width', r2(Math.max(0, wd))); r.setAttribute('height', r2(Math.max(0, h)));
    if (rx != null) { r.setAttribute('rx', r2(rx)); r.setAttribute('ry', r2(rx)); }
  }

  // tag(parent, {x,y | at, text, anchor, dx, dy, cls, id})
  function tag(parent, o) {
    o = o || {};
    var a = o.at ? iso(o.at) : { x: num(o.x, 0), y: num(o.y, 0) };
    var dx = num(o.dx, 0), dy = o.dy == null ? -64 : num(o.dy, -64);
    var anc = o.anchor || (dx > 0 ? 'start' : dx < 0 ? 'end' : 'middle');
    var lx = r2(a.x + dx), ly = r2(a.y + dy);
    var g = el('g', { 'class': cls('iso-tag', o.cls), id: o.id }, parent);
    if (dx || dy) {
      el('line', { 'class': 'iso-leader', x1: a.x, y1: a.y, x2: lx, y2: ly }, g);
      el('circle', { 'class': 'iso-tag-dot', cx: a.x, cy: a.y, r: 4 }, g);
    }
    var box = el('rect', { 'class': 'iso-tag-box' }, g);
    var t = el('text', { 'class': 'iso-tag-text', 'text-anchor': anc, x: lx, y: ly }, g);
    setText(t, o.text, lx);
    g._isoLayout = function () {
      var fs = fontSizeOf(t), px = fs * 0.6, py = fs * 0.38, b = measure(t);
      var bx = b.x != null ? b.x : (anc === 'start' ? lx : anc === 'end' ? lx - b.width : lx - b.width / 2);
      var by = b.y != null ? b.y : ly - b.height / 2;
      setRect(box, bx - px, by - py, b.width + px * 2, b.height + py * 2, Math.max(3, fs * 0.22));
    };
    g.setText = function (s) { setText(t, s, lx); g._isoLayout(); };
    g.textEl = t;
    g._isoLayout();
    return g;
  }

  // chip(parent, {x,y | at, text, cls, id, radius})
  function chip(parent, o) {
    o = o || {};
    var p = o.at ? iso(o.at) : { x: num(o.x, 0), y: num(o.y, 0) };
    var g = el('g', { 'class': cls('iso-chip', o.cls), id: o.id, transform: 'translate(' + p.x + ' ' + p.y + ')' }, parent);
    var box = el('rect', { 'class': 'iso-chip-box' }, g);
    var t = el('text', { 'class': 'iso-chip-text', 'text-anchor': 'middle', x: 0, y: 0 }, g);
    setText(t, o.text, 0);
    g._isoLayout = function () {
      var fs = fontSizeOf(t), b = measure(t);
      var h = Math.max(fs * 1.7, b.height + fs * 0.7), wd = b.width + fs * 1.4;
      setRect(box, -wd / 2, -h / 2, wd, h, o.radius != null ? o.radius : h / 2);
    };
    g.setText = function (s) { setText(t, s, 0); g._isoLayout(); };
    g.textEl = t;
    g._isoLayout();
    return g;
  }

  // faceText(parent, {at, text, face:'top'|'left'|'right', anchor, cls, id})
  var FACE_M = { top: [C30, S30, -C30, S30], left: [C30, S30, 0, 1], right: [C30, -S30, 0, 1] };
  function faceText(parent, o) {
    o = o || {};
    var p = iso(o.at || [0, 0, 0]), m = FACE_M[o.face] || FACE_M.top;
    var t = el('text', {
      'class': cls('iso-face-label', o.cls), id: o.id, 'text-anchor': o.anchor || 'middle', x: 0, y: 0,
      transform: 'matrix(' + m.map(function (v) { return r2(v * 10000) / 10000; }).join(' ') + ' ' + p.x + ' ' + p.y + ')'
    }, parent);
    setText(t, o.text, 0);
    return t;
  }

  // packet(parent, {text, cls, id, at, size, height, lift, labelGap, labelCls})
  // Origin = ground point under the cube. Move with gsap x/y = IsoKit.iso(...).
  function packet(parent, o) {
    o = o || {};
    var s = num(o.size, 36), hgt = num(o.height, s * 0.8), lift = num(o.lift, Math.round(s * 0.5));
    var p = o.at ? iso(o.at) : { x: num(o.x, 0), y: num(o.y, 0) };
    var g = el('g', { 'class': cls('iso-packet', o.cls), id: o.id, transform: 'translate(' + p.x + ' ' + p.y + ')' }, parent);
    var shadow = plane(g, { x: -s / 2, y: -s / 2, z: 0, w: s, d: s, cls: 'iso-packet-shadow' });
    var body = el('g', { 'class': 'iso-packet-body' }, g);
    var cube = slab(body, { x: -s / 2, y: -s / 2, z: lift, w: s, d: s, h: hgt, cls: 'iso-packet-cube' });
    var label = null;
    if (o.text != null && o.text !== '') {
      label = chip(body, { at: [0, 0, lift + hgt + num(o.labelGap, 30)], text: o.text, cls: cls('iso-packet-label', o.labelCls) });
    }
    g.body = body; g.cube = cube; g.shadow = shadow; g.label = label;
    return g;
  }

  /* ---------- stage, fitting, layout ---------- */
  function stage(svg, o) {
    svg = pick(svg);
    if (!svg) return null;
    o = o || {};
    var org = o.origin || [500, 210];
    list(svg.childNodes).forEach(function (c) {
      if (c.nodeType === 1 && c.classList && c.classList.contains('iso-root')) svg.removeChild(c);
    });
    svg.classList.add('iso-svg');
    var g = el('g', { 'class': cls('iso-root', o.cls), transform: 'translate(' + org[0] + ' ' + org[1] + ')' }, svg);
    observe(svg);
    return g;
  }

  function layout(scope) {
    list((scope || d).querySelectorAll('.iso-tag, .iso-chip')).forEach(function (n) {
      if (typeof n._isoLayout === 'function') n._isoLayout();
    });
  }

  function fit(svg) {
    var mob = svg.getAttribute('data-viewbox-mobile');
    if (mob) {
      if (!svg._isoVB) svg._isoVB = svg.getAttribute('viewBox');
      var want = isDesktop() ? svg._isoVB : mob;
      if (want && svg.getAttribute('viewBox') !== want) svg.setAttribute('viewBox', want);
    }
    var vb = svg.viewBox && svg.viewBox.baseVal, r = svg.getBoundingClientRect();
    if (!vb || !vb.width || !vb.height || !r.width || !r.height) return;
    var u = Math.max(vb.width / r.width, vb.height / r.height);
    if (Math.abs((svg._isoU || 0) - u) < 0.01) return;
    svg._isoU = u;
    svg.style.setProperty('--iso-u', u.toFixed(3));
    layout(svg);
  }

  var ro = w.ResizeObserver ? new w.ResizeObserver(function (entries) {
    entries.forEach(function (e) { fit(e.target); });
  }) : null;
  var observed = [];
  function observe(svg) {
    svg = pick(svg);
    if (!svg || svg._isoObserved) return;
    svg._isoObserved = true;
    observed.push(svg);
    if (ro) ro.observe(svg);
    fit(svg);
  }
  if (!ro) w.addEventListener('resize', function () { observed.forEach(fit); });
  onMq(mqDesk, function () { observed.forEach(fit); });

  /* ---------- animation helpers ---------- */
  function travel(tl, target, pts, o) {
    o = o || {};
    var speed = o.speed || 420, prev = null;
    (pts || []).forEach(function (p, i) {
      var q = screen(p);
      if (i === 0) tl.set(target, { x: q.x, y: q.y }, o.position);
      else {
        var dist = Math.sqrt(Math.pow(q.x - prev.x, 2) + Math.pow(q.y - prev.y, 2));
        tl.to(target, { x: q.x, y: q.y, duration: Math.max(0.12, dist / speed), ease: o.ease || 'none' }, '>');
      }
      prev = q;
    });
    return tl;
  }

  function dash(path) {
    var L = 0;
    try { L = path.getTotalLength(); } catch (e) { L = 0; }
    L = Math.ceil(L) + 1;
    path.style.strokeDasharray = L + ' ' + L;
    path.style.strokeDashoffset = '0';
    return L;
  }

  function navH() {
    var v = parseFloat(w.getComputedStyle(docEl).getPropertyValue('--iso-nav-h'));
    return v > 0 ? v : 64;
  }
  var refreshT = 0;
  function refreshSoon() {
    if (!w.ScrollTrigger) return;
    clearTimeout(refreshT);
    refreshT = setTimeout(function () { w.ScrollTrigger.refresh(); }, 80);
  }

  /* ---------- text effects ----------
   * typeHangul(el, {speed, delay, caretHold, maxMs, paused, onDone})
   * revealWords(el, {stagger, duration, delay, y, blur, paused, onDone})
   * stepText(stepEl, {delay, speed, stagger, paused}) composes both for a .story-step
   * typeOnEnter(el, opts) types once when scrolled into view
   * Handles: {el, play(), cancel(), duration}; null = reduced motion / no GSAP (text stays).
   */
  var LEAD_JAMO = [0x3131, 0x3132, 0x3134, 0x3137, 0x3138, 0x3139, 0x3141, 0x3142, 0x3143, 0x3145,
    0x3146, 0x3147, 0x3148, 0x3149, 0x314a, 0x314b, 0x314c, 0x314d, 0x314e];
  var V_SPLIT = { 9: 8, 10: 8, 11: 8, 14: 13, 15: 13, 16: 13, 19: 18 };
  var T_SPLIT = { 3: 1, 5: 4, 6: 4, 9: 8, 10: 8, 11: 8, 12: 8, 13: 8, 14: 8, 15: 8, 18: 17 };

  var perf = w.performance;
  function now() { return perf && perf.now ? perf.now() : Date.now(); }
  var rAF = w.requestAnimationFrame ? function (f) { return w.requestAnimationFrame(f); } : function (f) { return setTimeout(f, 16); };
  var cAF = w.cancelAnimationFrame ? function (id) { w.cancelAnimationFrame(id); } : function (id) { clearTimeout(id); };
  function motionOK() { return !!w.gsap && !mqReduce.matches; }
  function viewH() { return w.innerHeight || docEl.clientHeight || 800; }
  function belowFold(node, f) {
    if (!node || !node.getBoundingClientRect) return false;
    return node.getBoundingClientRect().top > viewH() * (f == null ? 0.88 : f);
  }

  function chars(s) { return Array.from ? Array.from(s) : s.split(''); }
  // '감' -> ['ㄱ', '가', '감'], '읽' -> ['ㅇ', '이', '일', '읽']
  function syllableStages(ch) {
    var c = ch.charCodeAt(0);
    if (ch.length !== 1 || c < 0xac00 || c > 0xd7a3) return [ch];
    var S = c - 0xac00, L = Math.floor(S / 588), V = Math.floor((S % 588) / 28), T = S % 28;
    function syl(v, t) { return String.fromCharCode(0xac00 + L * 588 + v * 28 + t); }
    var out = [String.fromCharCode(LEAD_JAMO[L])];
    if (HAS.call(V_SPLIT, V)) out.push(syl(V_SPLIT[V], 0));
    out.push(syl(V, 0));
    if (T) {
      if (HAS.call(T_SPLIT, T)) out.push(syl(V, T_SPLIT[T]));
      out.push(ch);
    }
    return out;
  }
  function hangulFrames(text) {
    var frames = [], done = '';
    chars(String(text == null ? '' : text)).forEach(function (ch) {
      syllableStages(ch).forEach(function (s) { frames.push(done + s); });
      done += ch;
    });
    return frames;
  }

  var fxLive = [];
  function fxAdd(h) { fxLive.push(h); return h; }
  function fxDrop(h) { var k = fxLive.indexOf(h); if (k > -1) fxLive.splice(k, 1); }
  function cancelText(scope) {
    scope = scope === undefined ? d : pick(scope);
    if (!scope) return;
    fxLive.slice().forEach(function (h) {
      if (scope === d || scope === h.el || (scope.contains && scope.contains(h.el))) h.cancel();
    });
  }

  function typeRig(node) {
    if (node._isoTypeRig) return node._isoTypeRig;
    if (node.children && node.children.length) return null;
    var raw = node.textContent || '';
    var text = raw.replace(/\s+/g, ' ').trim();
    if (!text) return null;
    var src = d.createElement('span');
    src.className = 'iso-type-src';
    src.textContent = raw;
    var vis = d.createElement('span');
    vis.className = 'iso-type-vis';
    vis.setAttribute('aria-hidden', 'true');
    var tn = d.createTextNode('');
    var caret = d.createElement('span');
    caret.className = 'iso-caret';
    vis.appendChild(tn);
    vis.appendChild(caret);
    node.textContent = '';
    node.appendChild(src);
    node.appendChild(vis);
    node.classList.add('iso-type');
    node._isoTypeRig = { src: src, vis: vis, node: tn, text: text };
    return node._isoTypeRig;
  }

  function typeHangul(target, o) {
    var node = pick(target);
    o = o || {};
    if (!node || !motionOK()) return null;
    cancelText(node);
    var rig = typeRig(node);
    if (!rig) return null;
    var frames = hangulFrames(rig.text), F = frames.length;
    if (!F) return null;
    var speed = Math.max(8, num(o.speed, 26));
    if (o.maxMs) speed = Math.max(12, Math.min(speed, num(o.maxMs, 2000) / F));
    var delay = Math.max(0, num(o.delay, 0)), hold = Math.max(0, num(o.caretHold, 600));
    var live = true, started = false, t0 = 0, last = -1, raf = 0, timer = 0;
    var h = { el: node, frames: F, typeMs: F * speed, duration: delay + F * speed };

    var cs = w.getComputedStyle(node);
    rig.vis.style.padding = cs.paddingTop + ' ' + cs.paddingRight + ' ' + cs.paddingBottom + ' ' + cs.paddingLeft;
    rig.node.data = '';
    rig.vis.classList.remove('is-idle');
    node.classList.add('is-typing');

    function cleanup() {
      live = false;
      cAF(raf);
      clearTimeout(timer);
      rig.node.data = '';
      rig.vis.classList.remove('is-idle');
      node.classList.remove('is-typing');
      fxDrop(h);
    }
    function tick() {
      if (!live) return;
      var k = Math.floor((now() - t0) / speed);
      if (k > last && k >= 0) { last = k; rig.node.data = frames[Math.min(k, F - 1)]; }
      if (k >= F - 1) {
        rig.vis.classList.add('is-idle');
        timer = setTimeout(function () {
          if (!live) return;
          cleanup();
          if (typeof o.onDone === 'function') o.onDone(node);
        }, hold);
        return;
      }
      raf = rAF(tick);
    }
    h.play = function () {
      if (!live || started) return h;
      started = true;
      t0 = now() + delay;
      raf = rAF(tick);
      return h;
    };
    h.cancel = function () { if (live) cleanup(); };
    fxAdd(h);
    if (!o.paused) h.play();
    return h;
  }

  function wrapWords(node) {
    var recs = [], spans = [], nodes = [];
    var walker = d.createTreeWalker(node, 4, null, false);
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (tn) {
      var parent = tn.parentNode;
      if (!parent || !/\S/.test(tn.data)) return;
      var frag = d.createDocumentFragment(), pieces = [];
      tn.data.split(/(\s+)/).forEach(function (p) {
        if (!p) return;
        var nd;
        if (/^\s+$/.test(p)) nd = d.createTextNode(p);
        else {
          nd = d.createElement('span');
          nd.className = 'iso-word';
          nd.textContent = p;
          spans.push(nd);
        }
        pieces.push(nd);
        frag.appendChild(nd);
      });
      parent.replaceChild(frag, tn);
      recs.push({ node: tn, parent: parent, pieces: pieces });
    });
    var restored = false;
    return {
      spans: spans,
      restore: function () {
        if (restored) return;
        restored = true;
        recs.forEach(function (r) {
          var first = r.pieces[0];
          if (first && first.parentNode === r.parent) r.parent.insertBefore(r.node, first);
          r.pieces.forEach(function (p) { if (p.parentNode) p.parentNode.removeChild(p); });
        });
      }
    };
  }

  function revealWords(target, o) {
    var node = pick(target), g = w.gsap;
    o = o || {};
    if (!node || !motionOK()) return null;
    cancelText(node);
    var rec = wrapWords(node);
    if (!rec.spans.length) { rec.restore(); return null; }
    var stagger = Math.max(0, num(o.stagger, 18)), dur = Math.max(40, num(o.duration, 320));
    var delay = Math.max(0, num(o.delay, 0)), blur = Math.max(0, num(o.blur, 4));
    var live = true, tw = null, h = { el: node, words: rec.spans.length };
    h.duration = delay + stagger * (h.words - 1) + dur;
    function done(fin) {
      if (!live) return;
      live = false;
      if (tw) tw.kill();
      rec.restore();
      fxDrop(h);
      if (fin && typeof o.onDone === 'function') o.onDone(node);
    }
    var from = { opacity: 0, y: num(o.y, 6) };
    var to = {
      opacity: 1, y: 0, duration: dur / 1000, delay: delay / 1000, stagger: stagger / 1000,
      ease: 'power2.out', paused: !!o.paused, onComplete: function () { done(true); }
    };
    if (blur) { from.filter = 'blur(' + blur + 'px)'; to.filter = 'blur(0px)'; }
    tw = g.fromTo(rec.spans, from, to);
    h.play = function () { if (live) tw.play(); return h; };
    h.cancel = function () { done(false); };
    return fxAdd(h);
  }

  function fadeIn(els, delayMs, paused, scope) {
    if (!els.length) return null;
    var g = w.gsap, live = true, h = { el: scope };
    function end() {
      if (!live) return;
      live = false;
      tw.kill();
      g.set(els, { clearProps: 'opacity,transform' });
      fxDrop(h);
    }
    var tw = g.fromTo(els, { opacity: 0, y: 4 }, {
      opacity: 1, y: 0, duration: 0.28, stagger: 0.05, delay: delayMs / 1000,
      ease: 'power2.out', paused: paused, onComplete: end
    });
    h.play = function () { if (live) tw.play(); return h; };
    h.cancel = end;
    return fxAdd(h);
  }

  function stepText(step, o) {
    step = pick(step);
    o = o || {};
    if (!step || !motionOK()) return null;
    cancelText(step);
    var base = Math.max(0, num(o.delay, 60)), paused = !!o.paused, stg = num(o.stagger, 18), subs = [];
    var title = step.querySelector('.story-step-title');
    var th = title ? typeHangul(title, { delay: base, paused: paused, speed: o.speed }) : null;
    var at = base + (th ? th.typeMs * 0.6 : 0);
    if (th) subs.push(th);
    var kick = fadeIn(list(step.querySelectorAll('.story-step-kicker')), base, paused, step);
    if (kick) subs.push(kick);
    list(step.querySelectorAll('.story-step-body')).forEach(function (b) {
      var h = revealWords(b, { delay: at, paused: paused, stagger: stg });
      if (h) { subs.push(h); at += h.words * stg * 0.5; }
    });
    var facts = fadeIn(list(step.querySelectorAll('.story-step-facts > *')), at, paused, step);
    if (facts) subs.push(facts);
    if (!subs.length) return null;
    return {
      el: step,
      duration: at + 320,
      play: function () { subs.forEach(function (h) { h.play(); }); return this; },
      cancel: function () { subs.forEach(function (h) { h.cancel(); }); }
    };
  }

  function typeOnEnter(target, o) {
    var node = pick(target), ST = w.ScrollTrigger;
    if (!node || node._isoOnEnter || !motionOK() || !belowFold(node)) return null;
    node._isoOnEnter = true;
    var h = typeHangul(node, ext(o, { paused: true }));
    if (!h) return null;
    if (ST) ST.create({ trigger: node, start: 'top 88%', once: true, onEnter: function () { h.play(); } });
    else if (w.IntersectionObserver) {
      var io = new w.IntersectionObserver(function (es) {
        if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); h.play(); }
      }, { rootMargin: '0px 0px -12% 0px' });
      io.observe(node);
    } else h.play();
    return h;
  }

  /* ---------- scene controller ----------
   * scene({ root, timeline, mode, final, start, end, trigger, pin, pinLength, scrub, smooth,
   *         stepLength, build, onStep })
   *   'steps' : labels step-0..N. Desktop + ScrollTrigger: section pinned (.is-pinned),
   *             scroll length = steps * stepLength (0.9) viewports; each step's graphic
   *             segment plays over the first `build` (0.7) of its scroll share.
   *             Otherwise .is-stepper: tabs / prev / next play one segment at a time.
   *   'scrub' : scrubbed on desktop, played once on mobile
   *   'play'  : played once on enter
   *   'loop'  : repeats while visible, pause button, label 'final' for reduced motion
   */
  function scene(o) {
    o = o || {};
    var g = w.gsap, ST = w.ScrollTrigger;
    var sec = pick(o.root), tl = o.timeline;
    if (!sec || !g || !tl) return null;
    tl.pause();

    var steps = list(sec.querySelectorAll('.story-step'));
    var n = steps.length;
    var mode = o.mode || (n ? 'steps' : 'scrub');
    var stageEl = sec.querySelector('.story-stage, .hero-iso-visual') || sec;
    var statusEl = sec.querySelector('[data-scene-status]');
    var share = clamp01(num(o.build, 0.7)) || 0.7;
    var st = { step: -1, desk: false, reduce: false, pinned: false, live: false, played: false, intro: false, visible: false, userPaused: false };
    var tw = null, pinST = null;

    if (mode === 'steps' && n) sec.classList.add('story-wide');
    steps.forEach(function (s) { if (!s.hasAttribute('tabindex')) s.setAttribute('tabindex', '-1'); });

    function label(name) { return tl.labels && HAS.call(tl.labels, name) ? tl.labels[name] : null; }
    function finalTime() {
      if (typeof o.final === 'number') return o.final;
      var f = label(o.final || 'final');
      return f == null ? tl.duration() : f;
    }
    function seg(i) {
      var D = tl.duration();
      var a = label('step-' + i), b = i + 1 < n ? label('step-' + (i + 1)) : null;
      if (a == null) a = D * i / n;
      if (b == null) b = i + 1 < n ? D * (i + 1) / n : D;
      return [a, b];
    }
    function kill() { if (tw) { tw.kill(); tw = null; } }
    function seek(t, smooth) {
      kill();
      if (smooth) tw = g.to(tl, { time: t, duration: o.smooth == null ? 0.5 : o.smooth, ease: 'power2.out', overwrite: true });
      else tl.time(t);
    }
    function playSeg(i) { var s = seg(i); kill(); tw = tl.tweenFromTo(s[0], s[1]); }
    function cancelSteps() { steps.forEach(function (s) { cancelText(s); }); }

    function setStep(i, force, anim) {
      if (!n) return;
      i = Math.max(0, Math.min(n - 1, i | 0));
      if (i === st.step && !force) return;
      var changed = i !== st.step;
      st.step = i;
      steps.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      list(sec.querySelectorAll('[data-step-tab]')).forEach(function (t) {
        if ((+t.getAttribute('data-step-tab') || 0) === i) t.setAttribute('aria-current', 'step');
        else t.removeAttribute('aria-current');
      });
      list(sec.querySelectorAll('[data-scene-prev]')).forEach(function (b) { b.disabled = i === 0; });
      list(sec.querySelectorAll('[data-scene-next]')).forEach(function (b) { b.disabled = i === n - 1; });
      if (!st.pinned) sec.style.setProperty('--story-progress', String(r2((i + 1) / n)));
      if (statusEl) statusEl.textContent = steps[i].getAttribute('data-status') || '';
      anim = anim && st.live;
      if (changed || anim) cancelSteps();
      if (anim) stepText(steps[i]);
      if (typeof o.onStep === 'function') o.onStep(i, { desktop: st.desk, reduced: st.reduce, pinned: st.pinned });
    }

    // pinned driver: progress -> step index + position inside that step's segment
    function apply(p, instant) {
      p = clamp01(p);
      var x = p * n, i = Math.min(n - 1, Math.floor(x)), s = seg(i);
      setStep(i, false, !instant);
      sec.style.setProperty('--story-progress', String(Math.round(p * 1000) / 1000));
      seek(st.reduce ? s[1] : s[0] + (s[1] - s[0]) * clamp01((x - i) / share), !instant && !st.reduce);
    }

    function go(i) {
      if (!n) return;
      i = Math.max(0, Math.min(n - 1, i));
      if (st.pinned && pinST) {
        var a = pinST.start, b = pinST.end;
        var y = a + (b - a) * Math.min(1, (i + Math.min(0.98, share + 0.04)) / n);
        w.scrollTo({ top: Math.round(y), behavior: st.reduce ? 'auto' : 'smooth' });
        return;
      }
      st.played = true;
      setStep(i, false, true);
      if (st.reduce) seek(seg(i)[1]); else playSeg(i);
    }

    function applyLoop() {
      if (mode !== 'loop' || st.reduce) return;
      if (st.visible && !st.userPaused) tl.play(); else tl.pause();
    }
    function setPaused(p) {
      st.userPaused = !!p;
      list(sec.querySelectorAll('[data-scene-pause]')).forEach(function (b) {
        var lbl = b.getAttribute(p ? 'data-label-play' : 'data-label-pause');
        var txt = b.querySelector('.scene-btn-label');
        if (lbl) { if (txt) txt.textContent = lbl; else b.setAttribute('aria-label', lbl); }
        var use = b.querySelector('use');
        if (use) use.setAttribute('href', p ? '#iso-i-play' : '#iso-i-pause');
      });
      applyLoop();
    }
    function replay() {
      if (st.reduce) return;
      if (mode === 'loop') { tl.restart(); setPaused(false); return; }
      if (mode === 'steps' && n) {
        var i = Math.max(0, st.step);
        playSeg(i);
        cancelSteps();
        stepText(steps[i]);
        return;
      }
      kill();
      tw = tl.tweenFromTo(0, finalTime());
    }

    sec.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-step-tab],[data-scene-prev],[data-scene-next],[data-scene-replay],[data-scene-pause]') : null;
      if (!t || !sec.contains(t)) return;
      if (t.hasAttribute('data-step-tab')) go(+t.getAttribute('data-step-tab') || 0);
      else if (t.hasAttribute('data-scene-prev')) go(st.step - 1);
      else if (t.hasAttribute('data-scene-next')) go(st.step + 1);
      else if (t.hasAttribute('data-scene-replay')) replay();
      else if (t.hasAttribute('data-scene-pause')) setPaused(!st.userPaused);
    });

    function runPinned() {
      pinST = ST.create({
        trigger: sec,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        start: 'top top+=' + navH(),
        end: function () { return '+=' + Math.round(n * viewH() * num(o.stepLength, 0.9)); },
        onUpdate: function (self) { apply(self.progress); },
        onRefresh: function (self) { apply(self.progress, true); }
      });
      apply(pinST.progress, true);
      refreshSoon();
    }

    function runStepper(cur) {
      setStep(cur, true);
      if (st.reduce || st.played || !ST) { seek(seg(cur)[1]); return; }
      seek(seg(cur)[0]);
      ST.create({
        trigger: stageEl, start: 'top 80%', once: true,
        onEnter: function () { if (st.played) return; st.played = true; playSeg(st.step); }
      });
    }

    // first entry: type the visible step once (only if it starts below the fold)
    function intro() {
      if (st.intro || !ST || !motionOK()) return;
      st.intro = true;
      var s = steps[Math.max(0, st.step)];
      if (!s || !belowFold(s)) return;
      var h = stepText(s, { paused: true });
      if (h) ST.create({ trigger: s, start: 'top 88%', once: true, onEnter: function () { h.play(); } });
    }

    function runLinear() {
      if (st.reduce) { seek(finalTime()); return; }
      var trig = pick(o.trigger) || stageEl;
      if (mode === 'scrub' && st.desk) {
        var cfg = { trigger: trig, start: o.start || 'top 75%', end: o.end || 'bottom 55%', scrub: o.scrub == null ? 0.6 : o.scrub, animation: tl };
        if (o.pin) {
          cfg.pin = o.pin === true ? stageEl : pick(o.pin);
          cfg.start = o.start || 'top top+=' + navH();
          cfg.end = o.end || '+=' + (o.pinLength || 1200);
          cfg.anticipatePin = 1;
        }
        ST.create(cfg);
        return;
      }
      if (st.played) { seek(finalTime()); return; }
      seek(0);
      ST.create({ trigger: trig, start: 'top 75%', once: true, onEnter: function () { st.played = true; kill(); tw = tl.tweenFromTo(0, finalTime()); } });
    }

    function runLoop() {
      if (st.reduce) { tl.pause(); tl.time(finalTime()); return; }
      var t = ST.create({ trigger: stageEl, start: 'top bottom', end: 'bottom top', onToggle: function (self) { st.visible = self.isActive; applyLoop(); } });
      st.visible = !!t.isActive;
      applyLoop();
    }

    var mm = g.matchMedia();
    mm.add({
      desk: '(min-width: ' + BP + 'px)',
      mob: '(max-width: ' + (BP - 0.02) + 'px)',
      reduce: '(prefers-reduced-motion: reduce)',
      motion: '(prefers-reduced-motion: no-preference)'
    }, function (ctx) {
      var c = ctx.conditions || {};
      st.desk = !!c.desk;
      st.reduce = !!c.reduce || !ST;
      st.live = false;
      kill();
      st.pinned = !!(mode === 'steps' && n && st.desk && ST);
      var stepper = n > 0 && (!st.desk || !ST);
      sec.classList.toggle('is-stepper', stepper);
      sec.classList.toggle('is-pinned', st.pinned);
      sec.classList.toggle('is-scrubbed', st.desk && !st.reduce && mode !== 'loop' && mode !== 'play');
      if (mode === 'loop') runLoop();
      else if (st.pinned) runPinned();
      else if (mode === 'steps' && n) runStepper(Math.max(0, st.step));
      else runLinear();
      if (n && mode === 'steps') intro();
      st.live = true;
      return function () {
        kill();
        cancelSteps();
        pinST = null;
        st.pinned = false;
        st.live = false;
        if (mode === 'loop') tl.pause();
        sec.classList.remove('is-stepper', 'is-pinned', 'is-scrubbed');
      };
    });

    return {
      timeline: tl,
      go: go,
      replay: replay,
      setStep: setStep,
      pause: function (p) { setPaused(p !== false); },
      get step() { return st.step; },
      get pinned() { return st.pinned; },
      revert: function () { mm.revert(); }
    };
  }

  /* ---------- lifecycle ---------- */
  var buildQ = [], readyQ = [], booted = false;
  var TYPE_ON_ENTER = '[data-type-on-enter], #bundle .section-title, #ocr .section-title';
  function safe(fn, args) {
    try { fn.apply(null, args); } catch (e) { if (w.console) w.console.error('[IsoKit]', e); }
  }
  function syncReduced() { docEl.classList.toggle('iso-reduced', !!mqReduce.matches); }

  // build(fn): draw SVG. Always runs (even without GSAP) so the final state is visible.
  function build(fn) { if (booted) safe(fn, [api]); else buildQ.push(fn); }
  // ready(fn): animate. Runs after all builds, only when window.gsap exists.
  function ready(fn) {
    if (!booted) { readyQ.push(fn); return; }
    if (w.gsap) safe(fn, [w.gsap, w.ScrollTrigger, api]);
  }

  function boot() {
    if (booted) return;
    booted = true;
    var g = w.gsap;
    docEl.classList.add(g ? 'has-gsap' : 'no-gsap');
    syncReduced();
    buildQ.splice(0).forEach(function (fn) { safe(fn, [api]); });
    list(d.querySelectorAll('svg.iso-svg')).forEach(observe);
    if (g) {
      if (w.ScrollTrigger && g.registerPlugin) g.registerPlugin(w.ScrollTrigger);
      readyQ.splice(0).forEach(function (fn) { safe(fn, [g, w.ScrollTrigger, api]); });
      list(d.querySelectorAll(TYPE_ON_ENTER)).forEach(function (n) { safe(typeOnEnter, [n]); });
    } else {
      readyQ.length = 0;
    }
    if (d.fonts && d.fonts.ready) {
      d.fonts.ready.then(function () {
        observed.forEach(function (s) { s._isoU = 0; fit(s); });
        layout(d);
        if (w.ScrollTrigger) w.ScrollTrigger.refresh();
      });
    }
  }

  docEl.classList.add('iso-js');
  syncReduced();
  onMq(mqReduce, function () { syncReduced(); if (mqReduce.matches) cancelText(); });
  if (d.readyState === 'complete') setTimeout(boot, 0);
  else {
    d.addEventListener('DOMContentLoaded', boot);
    w.addEventListener('load', boot);
  }

  var api = {
    version: '2.0.0',
    COS30: C30,
    SIN30: S30,
    BREAKPOINT: BP,
    iso: iso,
    points: points,
    route: route,
    el: el,
    slab: slab,
    plane: plane,
    grid: grid,
    wire: wire,
    anchor: anchor,
    tag: tag,
    chip: chip,
    faceText: faceText,
    packet: packet,
    stage: stage,
    observe: observe,
    layout: layout,
    travel: travel,
    dash: dash,
    scene: scene,
    typeHangul: typeHangul,
    revealWords: revealWords,
    stepText: stepText,
    typeOnEnter: typeOnEnter,
    cancelText: cancelText,
    hangulFrames: hangulFrames,
    build: build,
    ready: ready,
    isDesktop: isDesktop
  };
  Object.defineProperty(api, 'reducedMotion', {
    enumerable: true,
    get: function () { return !!mqReduce.matches; }
  });

  w.IsoKit = api;
})(window, document);
