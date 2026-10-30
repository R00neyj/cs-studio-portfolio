/* bundle.js: renewal notice bundle (#bundle). Mode 'play' + two replay buttons. */
(function () {
  'use strict';
  var R = {};
  var TXT = { idle: "버튼을 누르면 \'안내 완료\' 뒤 기록 순서를 보여 줍니다.", ok: "호스팅·SSL·문자 기록을 모두 남겼습니다.", fail: "문자 기록이 실패해 앞서 남긴 호스팅·SSL 기록을 되돌렸습니다.", run: '' };
  var ICON = { idle: '#iso-i-clock', run: '#iso-i-clock', ok: '#iso-i-check', fail: '#iso-i-x' };

  /* world layout */
  var P = 42, T = 36, BZ = 10, TH = 5;               // calendar pitch, tile, board top, tile height
  var ENV = { x: 360, y: 10, w: 160, d: 120, h: 14 }; // envelope (one notice)
  var DB = { x: 580, y: 16, w: 120, d: 108, h: 30 };  // D1 block
  var ROW_H = 14, ROW_GAP = 4;
  var SX_R = 690, SY_B = 90;                           // sheet right edge / bottom (root coords)
  var TAG_Y = [488, 444, 400];                         // row tag rows (hosting, ssl, sms)
  var ITEMS = [
    { day: 9, name: "호스팅", dd: 'D-9', table: 'hosting_notices', cdx: -20, stem: 70 },
    { day: 12, name: "SSL", dd: 'D-12', table: 'ssl_notices', cdx: -40, stem: 50 },
    { day: 5, name: "문자", dd: 'D-5', table: 'sms_renewals', cdx: 0, stem: 190 }
  ];
  function rowZ(i) { return DB.h + i * (ROW_H + ROW_GAP); }
  function dayC(i) { return [6 + (i % 7) * P + T / 2, 6 + ((i / 7) | 0) * P + T / 2, BZ + TH]; }

  /* sheet helpers */
  function rd(v) { return Math.round(v * 10) / 10; }
  function fsOf(t) { var f = 0; try { f = parseFloat(window.getComputedStyle(t).fontSize); } catch (e) { f = 0; } return f > 0 ? f : 20; }
  function tw(t) {
    var b = null;
    try { b = t.getBBox(); } catch (e) { b = null; }
    if (b && b.width > 0) return b.width;
    var s = t.textContent || '', n = 0;
    for (var i = 0; i < s.length; i++) n += /[\u1100-\u11ff\uac00-\ud7af]/.test(s.charAt(i)) ? 1 : 0.62;
    return n * fsOf(t);
  }
  function shown(n) { return window.getComputedStyle(n).display !== 'none'; }
  function put(n, x, y) { n.setAttribute('x', rd(x)); n.setAttribute('y', rd(y)); }
  function hline(n, x1, x2, y) { n.setAttribute('x1', rd(x1)); n.setAttribute('x2', rd(x2)); n.setAttribute('y1', rd(y)); n.setAttribute('y2', rd(y)); }
  function txt(K, p, s, c, anc) { return K.el('text', { cls: c, text: s, dy: '0.35em', 'text-anchor': anc || 'start' }, p); }

  function buildSheet(K, g) {
    var S = {};
    S.link = K.el('g', { cls: 'bundle-sheet-link' }, g);
    S.leader = K.el('line', { cls: 'bundle-sheet-leader', x1: R.envTop.x, y1: R.envTop.y, x2: R.envTop.x, y2: R.envTop.y }, S.link);
    K.el('circle', { cls: 'bundle-pin-dot', cx: R.envTop.x, cy: R.envTop.y, r: 4 }, S.link);
    S.card = K.el('g', { cls: 'bundle-sheet' }, g);
    S.box = K.el('rect', { cls: 'bundle-sheet-box' }, S.card);
    S.icon = K.el('use', { href: '#iso-i-chat', cls: 'iso-glyph bundle-sheet-icon' }, S.card);
    S.title = txt(K, S.card, "안내문 한 통", 'bundle-sheet-title');
    S.rule1 = K.el('line', { cls: 'bundle-sheet-sep iso-minor' }, S.card);
    S.rows = ITEMS.map(function (it) {
      var rg = K.el('g', { cls: 'bundle-sheet-row iso-minor' }, S.card);
      return { g: rg, a: txt(K, rg, it.name), b: txt(K, rg, it.dd, 'bundle-sheet-muted') };
    });
    S.rule2 = K.el('line', { cls: 'bundle-sheet-sep' }, S.card);
    S.total = K.el('g', { cls: 'bundle-sheet-total' }, S.card);
    S.totA = txt(K, S.total, "합계");
    S.totC = txt(K, S.total, ITEMS.length + '건', null, 'end');
    R.sheet = S;
  }

  function layoutSheet() {
    var S = R.sheet;
    if (!S) return;
    var fs = fsOf(S.title), pad = fs * 0.8, gap = fs, lh = fs * 1.6, ic = fs * 1.1, sp = fs * 0.3;
    var rows = S.rows.filter(function (o) { return shown(o.g); });
    var aw = tw(S.totA), bw = 0, cw = tw(S.totC);
    rows.forEach(function (o) { aw = Math.max(aw, tw(o.a)); bw = Math.max(bw, tw(o.b)); });
    var inner = Math.max(aw + gap + bw, aw + gap + cw, ic + fs * 0.5 + tw(S.title));
    var w = inner + pad * 2;
    var h = pad * 2 + lh * (2 + rows.length) + sp * (rows.length ? 4 : 2);
    var x0 = SX_R - w, y0 = SY_B - h, xl = x0 + pad, xr = SX_R - pad;
    S.box.setAttribute('x', rd(x0)); S.box.setAttribute('y', rd(y0));
    S.box.setAttribute('width', rd(w)); S.box.setAttribute('height', rd(h));
    S.box.setAttribute('rx', rd(fs * 0.3)); S.box.setAttribute('ry', rd(fs * 0.3));
    var cy = y0 + pad + lh / 2;
    put(S.icon, xl, cy - ic / 2);
    S.icon.setAttribute('width', rd(ic)); S.icon.setAttribute('height', rd(ic));
    put(S.title, xl + ic + fs * 0.5, cy);
    cy += lh / 2;
    if (rows.length) { cy += sp; hline(S.rule1, x0 + pad / 2, SX_R - pad / 2, cy); cy += sp; }
    rows.forEach(function (o) {
      cy += lh / 2;
      put(o.a, xl, cy); put(o.b, xl + aw + gap, cy);
      cy += lh / 2;
    });
    cy += sp; hline(S.rule2, x0 + pad / 2, SX_R - pad / 2, cy); cy += sp;
    cy += lh / 2; put(S.totA, xl, cy); put(S.totC, xr, cy); cy += lh / 2;
    S.leader.setAttribute('x2', rd(x0 + pad * 1.5));
    S.leader.setAttribute('y2', rd(SY_B));
  }

  /* ---------- DRAW (final state: notice assembled, three D1 rows written) ---------- */
  IsoKit.build(function (K) {
    var svg = document.getElementById('bundle-svg');
    if (!svg) return;
    var g = K.stage(svg, { origin: [285, 230] });
    R.svg = svg;

    // calendar: 21 days, first 14 = window from today
    R.cal = K.el('g', { cls: 'bundle-cal' }, g);
    K.slab(R.cal, { x: 0, y: 0, z: 0, w: 300, d: 132, h: BZ, cls: 'bundle-board' });
    R.win = [];
    for (var i = 0; i < 21; i++) {
      var t = K.slab(R.cal, { x: 6 + (i % 7) * P, y: 6 + ((i / 7) | 0) * P, z: BZ, w: T, d: T, h: TH, cls: 'bundle-tile' + (i > 13 ? ' is-muted' : '') });
      if (i < 14) { t.setAttribute('data-state', i ? 'accent-soft' : 'accent-soft active'); R.win.push(t); }
    }
    R.winTag = K.tag(g, { at: [6, 84, BZ + TH], dx: -50, dy: 90, text: "2주 안", cls: 'is-accent bundle-win-tag' });

    // due chips pinned to their days (back to front: D-5, D-9, D-12)
    R.chips = []; R.chipPts = [];
    var chipL = K.el('g', { cls: 'bundle-chips' }, g);
    [2, 0, 1].forEach(function (k) {
      var it = ITEMS[k], b = K.iso(dayC(it.day)), p = { x: b.x + it.cdx, y: b.y - it.stem };
      var wg = K.el('g', { cls: 'bundle-chip-g' }, chipL);
      K.el('line', { cls: 'bundle-stem', x1: b.x, y1: b.y, x2: p.x, y2: p.y }, wg);
      K.el('circle', { cls: 'bundle-pin-dot', cx: b.x, cy: b.y, r: 4 }, wg);
      K.chip(wg, { x: p.x, y: p.y, text: it.name + ' ' + it.dd, cls: 'bundle-chip' });
      R.chips[k] = wg; R.chipPts[k] = p;
    });

    // envelope = one notice
    R.env = K.el('g', { cls: 'bundle-env' }, g);
    K.slab(R.env, { x: ENV.x, y: ENV.y, z: 0, w: ENV.w, d: ENV.d, h: ENV.h, cls: 'is-accent-soft bundle-envelope' });
    K.wire(R.env, { points: [[ENV.x, ENV.y, ENV.h], [ENV.x + ENV.w / 2, ENV.y + ENV.d * 0.6, ENV.h], [ENV.x + ENV.w, ENV.y, ENV.h]], cls: 'bundle-flap' });
    R.envTop = K.iso(ENV.x + ENV.w / 2, ENV.y + ENV.d / 2, ENV.h);

    // D1 block with three ghost slots
    R.db = K.el('g', { cls: 'bundle-db' }, g);
    R.base = K.slab(R.db, { x: DB.x, y: DB.y, z: 0, w: DB.w, d: DB.d, h: DB.h, hatch: true, cls: 'bundle-db-base' });
    for (var s = 0; s < 3; s++) K.slab(R.db, { x: DB.x, y: DB.y, z: rowZ(s), w: DB.w, d: DB.d, h: ROW_H, cls: 'is-ghost bundle-slot' });
    R.dbTag = K.tag(R.db, { at: K.anchor(R.base, 'front'), dx: 6, dy: 64, text: "D1 기록", cls: 'bundle-db-tag' });

    // written rows (one per item)
    var rowsL = K.el('g', { cls: 'bundle-rows' }, g);
    R.rowSlabs = [];
    R.rows = ITEMS.map(function (it, k) {
      var rg = K.el('g', { cls: 'bundle-row-g' }, rowsL);
      var sl = K.slab(rg, { x: DB.x, y: DB.y, z: rowZ(k), w: DB.w, d: DB.d, h: ROW_H, cls: 'bundle-row' });
      sl.setAttribute('data-state', 'success');
      var a = K.anchor(sl, 'left');
      K.tag(rg, { at: a, dx: -70, dy: TAG_Y[k] - K.iso(a).y, text: it.table, cls: 'iso-minor bundle-row-tag' });
      R.rowSlabs.push(sl);
      return rg;
    });

    // transients: rollback arrow, packets, failure mark, flying chips
    R.rollback = K.wire(g, { points: [[600, 150, 60], [600, 150, 110], [470, 150, 110], [470, 150, 34]], arrow: 'danger', cls: 'is-danger bundle-rollback iso-transient' });
    var pl = K.el('g', { cls: 'bundle-pkts' }, g);
    R.pkts = ITEMS.map(function (it) {
      var p = K.packet(pl, { at: [0, 0, 0], size: 34, text: it.name, cls: 'bundle-pkt iso-transient' });
      p.setAttribute('data-state', 'go');
      return p;
    });
    var xp = K.iso(640, 70, rowZ(2)), cx = xp.x + 54, cy = xp.y - 34;
    R.xmark = K.el('g', { cls: 'bundle-xmark iso-transient' }, g);
    K.el('circle', { cls: 'bundle-xmark-ring', cx: cx, cy: cy, r: 17 }, R.xmark);
    K.el('use', { href: '#iso-i-x', cls: 'iso-glyph is-danger', x: cx - 11, y: cy - 11, width: 22, height: 22 }, R.xmark);
    var fl = K.el('g', { cls: 'bundle-flys' }, g);
    R.flys = ITEMS.map(function (it) { return K.chip(fl, { x: 0, y: 0, text: it.name + ' ' + it.dd, cls: 'bundle-fly iso-transient' }); });

    // notice sheet (screen-aligned card listing the bundle)
    buildSheet(K, g);
    layoutSheet();
    if (window.ResizeObserver) new window.ResizeObserver(layoutSheet).observe(svg);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutSheet);
  });

  /* ---------- ANIMATE ---------- */
  IsoKit.ready(function (gsap, ST, K) {
    K.typeOnEnter('#bundle-title');
    var sec = document.getElementById('bundle');
    if (!sec || !R.svg) return;
    var tl = gsap.timeline({ paused: true, defaults: { duration: 0.5, ease: 'power2.out' } });
    gsap.set(R.flys.concat(R.pkts, [R.rollback, R.xmark], R.rows), { autoAlpha: 0 });

    // 1. calendar, window sweep from today, chips drop onto their days
    tl.from(R.cal, { autoAlpha: 0, y: 24, duration: 0.6 }, 0)
      .from(R.db, { autoAlpha: 0, y: 24, duration: 0.6 }, 0.15);
    tl.set(R.win, { attr: { 'data-state': 'idle' } }, 0.01);
    R.win.forEach(function (t, i) {
      tl.set(t, { attr: { 'data-state': i ? 'accent-soft' : 'accent-soft active' } }, 0.65 + i * 0.035);
    });
    tl.from(R.winTag, { autoAlpha: 0, x: 12, duration: 0.35 }, 1.1);
    [2, 0, 1].forEach(function (k, n) {
      tl.from(R.chips[k], { autoAlpha: 0, y: -56, duration: 0.55, ease: 'back.out(1.7)' }, 1.3 + n * 0.22);
    });

    // 2. chips lift and merge into one notice
    tl.addLabel('merge', '+=0.25');
    tl.from(R.env, { autoAlpha: 0, y: -30, duration: 0.45 }, 'merge');
    var envIn = K.iso(ENV.x + ENV.w / 2, ENV.y + ENV.d / 2, ENV.h + 16);
    var m0 = tl.labels.merge;
    ITEMS.forEach(function (it, k) {
      var f = R.flys[k], p = R.chipPts[k], at = m0 + 0.3 + k * 0.4;
      K.travel(tl, f, [p, { x: p.x, y: p.y - 36 }, envIn], { position: at, speed: 640, ease: 'power1.inOut' });
      var end = tl.recent().endTime();
      tl.fromTo(f, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, immediateRender: false }, at);
      tl.to(f, { autoAlpha: 0, duration: 0.18 }, end - 0.12);
      if (!k) {
        tl.from(R.sheet.link, { autoAlpha: 0, duration: 0.3 }, end - 0.15);
        tl.from(R.sheet.card, { autoAlpha: 0, y: 14, duration: 0.35 }, end - 0.1);
      }
      tl.from(R.sheet.rows[k].g, { autoAlpha: 0, x: -10, duration: 0.3 }, end);
    });
    tl.from(R.sheet.total, { autoAlpha: 0, duration: 0.3 }, '>-0.05');

    // 3. one packet per item into its own D1 row
    function write(i, at, keep) {
      var p = R.pkts[i];
      K.travel(tl, p, [[440, 70, ENV.h + 6], [440, 92, 112], [640, 70, 112], [640, 70, rowZ(i)]], { position: at, speed: 520, ease: 'power1.inOut' });
      var end = tl.recent().endTime();
      tl.fromTo(p, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, immediateRender: false }, at);
      if (keep) return end;
      tl.to(p, { autoAlpha: 0, duration: 0.18 }, end);
      tl.fromTo(R.rows[i], { autoAlpha: 0, y: -22 }, { autoAlpha: 1, y: 0, duration: 0.32, immediateRender: false }, end - 0.04);
      return end;
    }
    tl.addLabel('records', '+=0.35');
    var r0 = tl.labels.records;
    tl.set(R.rowSlabs, { attr: { 'data-state': 'pending' } }, r0);
    write(0, r0); write(1, r0 + 0.95);
    var e3 = write(2, r0 + 1.9);
    tl.addLabel('done', e3 + 0.3);
    tl.set(R.rowSlabs, { attr: { 'data-state': 'success' } }, 'done');
    tl.to({}, { duration: 0.4 }, 'done');
    tl.addLabel('final');

    // 4. failure: sms write fails, earlier rows are rolled back
    tl.addLabel('fail', '+=0.02');
    var f0 = tl.labels.fail;
    tl.set(R.rows, { autoAlpha: 0, y: 0 }, f0);
    tl.set(R.rowSlabs, { attr: { 'data-state': 'pending' } }, f0);
    write(0, f0 + 0.1); write(1, f0 + 1.05);
    var hit = write(2, f0 + 2.0, true);
    var sms = R.pkts[2];
    tl.set(sms, { attr: { 'data-state': 'blocked' } }, hit);
    tl.fromTo(sms.body, { x: 0 }, { x: 5, duration: 0.06, repeat: 5, yoyo: true, ease: 'none', immediateRender: false }, hit);
    tl.fromTo(R.xmark, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.25, immediateRender: false }, hit + 0.1);
    var rb = hit + 0.7;
    tl.fromTo(R.rollback, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, immediateRender: false }, rb);
    tl.to([R.rows[1], R.rows[0]], { y: -72, autoAlpha: 0, duration: 0.6, ease: 'power2.in', stagger: 0.25 }, rb + 0.2);
    tl.to({}, { duration: 0.3 });
    tl.addLabel('failEnd');

    K.scene({ root: sec, timeline: tl, mode: 'play', trigger: sec, final: 'final' });

    // buttons + status
    var btns = Array.prototype.slice.call(sec.querySelectorAll('[data-bundle-run]'));
    var stEl = document.getElementById('bundle-status');
    var stTxt = stEl ? stEl.querySelector('.bundle-status-text') : null;
    var stUse = stEl ? stEl.querySelector('use') : null;
    var running = null;

    function status(s) {
      if (!stEl) return;
      stEl.setAttribute('data-state', s);
      if (stTxt) stTxt.textContent = TXT[s] || '';
      if (stUse) stUse.setAttribute('href', ICON[s] || ICON.idle);
    }
    function busy(b) { btns.forEach(function (x) { x.setAttribute('aria-disabled', b ? 'true' : 'false'); }); }
    function stop() { if (running) { running.kill(); running = null; } busy(false); }
    function run(kind) {
      if (running) return;
      gsap.killTweensOf(tl); // stop the intro driver if it is still playing
      var a = tl.labels[kind === 'ok' ? 'records' : 'fail'];
      var b = kind === 'ok' ? tl.labels.final : tl.duration();
      if (K.reducedMotion) { tl.time(b); status(kind); return; }
      status('run');
      busy(true);
      running = tl.tweenFromTo(a, b, { onComplete: function () { running = null; busy(false); status(kind); } });
    }
    btns.forEach(function (x) {
      x.addEventListener('click', function () {
        if (x.getAttribute('aria-disabled') === 'true') return;
        run(x.getAttribute('data-bundle-run') === 'fail' ? 'fail' : 'ok');
      });
    });

    // breakpoint / motion-preference change: K.scene re-seeks, keep status in sync
    ['(min-width: 950px)', '(prefers-reduced-motion: reduce)'].forEach(function (q) {
      if (!window.matchMedia) return;
      var mql = window.matchMedia(q);
      var fn = function () {
        stop();
        if (tl.time() > 0) tl.time(tl.labels.final);
        status('idle');
      };
      if (mql.addEventListener) mql.addEventListener('change', fn);
      else if (mql.addListener) mql.addListener(fn);
    });
  });
})();
