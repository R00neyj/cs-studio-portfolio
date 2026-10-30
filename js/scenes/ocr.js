/* js/scenes/ocr.js: photo reading (scan + numbered marks) and count / engine bars */
(function () {
  'use strict';

  var R = { marks: [], nums: [], tags: [] };

  // card footprint (world units): x = page width, y = page height
  var W = 400, D = 340, Z0 = 20, ZT = 32;
  var ROWS = [132, 198, 264];            // row tops (y)
  var MX1 = 10, MX2 = 322;               // mark left / right (x)
  var TAG_X = 372, TAG_Y = [180, 250, 320]; // tag text column (screen, local)
  var S0 = 40, S1 = 330;                 // scan sweep range (y)
  var ITEMS = ['메인 팝업 이미지 교체', '연혁 문구 2곳 수정', '하단 배너 링크 변경'];
  // hand-drawn wobble per mark
  var WOB = [
    [3, -2, 2, 3, -2, 1, 4],
    [-2, 3, -3, 1, 3, -2, 2],
    [2, 1, 3, -2, -1, 3, -3]
  ];

  function ink(K, parent, x, y, w, d) {
    return K.plane(parent, { x: x, y: y, z: ZT, w: w, d: d, cls: 'ocr-ink' });
  }

  function markPts(x1, y1, x2, y2, w) {
    var xm = (x1 + x2) / 2, ym = (y1 + y2) / 2;
    return [
      [x1 + 14, y1 - 2], [xm, y1 + w[0]], [x2 + w[1], y1 - 2], [x2 + w[2], ym],
      [x2 - 1, y2 + w[3]], [xm, y2 + w[4]], [x1 - 2 + w[5], y2 + 1], [x1 + w[6], ym],
      [x1, y1 + 3], [x1 + 30, y1 - 4]
    ].map(function (p) { return [p[0], p[1], ZT]; });
  }

  /* ---------- DRAW (final state) ---------- */
  IsoKit.build(function (K) {
    var g = K.stage('#ocr-svg', { origin: [327, 90] });
    if (!g) return;

    R.shadow = K.plane(g, { x: 12, y: 12, z: 0, w: W, d: D, cls: 'ocr-shadow' });

    // customer screenshot card
    var card = R.card = K.el('g', { cls: 'ocr-card' }, g);
    K.slab(card, { x: 0, y: 0, z: Z0, w: W, d: D, h: ZT - Z0, cls: 'ocr-card-slab' });
    K.plane(card, { x: 0, y: 0, z: ZT, w: W, d: 34, cls: 'ocr-header' });
    ink(K, card, 14, 11, 56, 12);
    [232, 280, 328].forEach(function (x) { ink(K, card, x, 14, 36, 6); });
    K.plane(card, { x: 16, y: 46, z: ZT, w: 368, d: 72, cls: 'ocr-adbanner-area', hatch: true });
    ROWS.forEach(function (yr) {
      K.plane(card, { x: 24, y: yr + 2, z: ZT, w: 38, d: 34, cls: 'ocr-thumb' });
      ink(K, card, 76, yr + 6, 224, 8);
      ink(K, card, 76, yr + 22, 160, 8);
    });
    R.banner = K.chip(card, { at: [200, 82, ZT], text: '128만원 패키지', cls: 'ocr-adbanner' });
    R.banner.setAttribute('data-state', 'dim');

    // customer's red marks
    var mg = K.el('g', { cls: 'ocr-marks' }, g);
    ROWS.forEach(function (yr, i) {
      R.marks.push(K.el('path', {
        cls: 'ocr-redmark', 'data-state': 'found',
        d: K.route(markPts(MX1, yr - 8, MX2, yr + 46, WOB[i]))
      }, mg));
    });

    // scan line (exists only mid-motion)
    var sg = R.scan = K.el('g', { cls: 'ocr-scan iso-transient', style: 'opacity:0;visibility:hidden' }, g);
    K.plane(sg, { x: -8, y: -14, z: ZT + 1, w: W + 16, d: 14, cls: 'ocr-scan-band' });
    K.wire(sg, { points: [[-14, 0, ZT + 1], [W + 14, 0, ZT + 1]], cls: 'is-accent' });
    K.tag(sg, { at: [200, 0, ZT + 1], dx: 0, dy: -52, text: '빨간 표시 찾는 중', cls: 'is-accent ocr-scan-tag' });

    // banner excluded from the count
    R.skip = K.tag(g, { at: [16, 60, ZT], dx: -60, dy: -40, text: '건수에서 제외', cls: 'is-muted ocr-skip' });

    // numbered chips at each mark's left corner
    ROWS.forEach(function (yr, i) {
      var p = K.iso(MX1, yr + 46, ZT);
      var wrap = K.el('g', { cls: 'ocr-num' }, g);
      K.chip(wrap, { x: p.x - 28, y: p.y, text: String(i + 1), cls: 'is-danger' });
      R.nums.push(wrap);
    });

    // read instruction per mark (desktop; legend below on smaller screens)
    ROWS.forEach(function (yr, i) {
      var at = [MX2, yr + 19, ZT], a = K.iso(at);
      R.tags.push(K.tag(g, { at: at, dx: TAG_X - a.x, dy: TAG_Y[i] - a.y, text: ITEMS[i], cls: 'ocr-tag' }));
    });
  });

  /* ---------- ANIMATE ---------- */
  IsoKit.ready(function (gsap, ST, K) {
    K.typeOnEnter('#ocr-title');
    if (R.card) partA(gsap, K);
    partB(gsap, K);
  });

  function partA(gsap, K) {
    // pre-scan states; the timeline switches them back reversibly
    gsap.set(R.banner, { attr: { 'data-state': 'plain' } });
    gsap.set(R.marks, { attr: { 'data-state': 'idle' } });

    var tl = gsap.timeline({ paused: true, defaults: { duration: 0.5, ease: 'power2.out' } });
    tl.from(R.shadow, { autoAlpha: 0, duration: 0.5 }, 0)
      .from(R.card, { autoAlpha: 0, y: '+=26', duration: 0.6 }, 0);

    R.marks.forEach(function (m, i) {
      var L = K.dash(m);
      tl.from(m, { strokeDashoffset: L, duration: 0.45, ease: 'power1.inOut' }, 0.55 + i * 0.22);
    });

    var T0 = 1.4, TD = 2.6;
    function at(v) { return T0 + (v - S0) / (S1 - S0) * TD; }

    tl.set(R.scan, { autoAlpha: 1 }, T0)
      .fromTo(R.scan, K.iso(0, S0, 0), Object.assign({ duration: TD, ease: 'none' }, K.iso(0, S1, 0)), T0)
      .set(R.banner, { attr: { 'data-state': 'dim' } }, at(82))
      .from(R.skip, { autoAlpha: 0, duration: 0.3 }, at(82));

    ROWS.forEach(function (yr, i) {
      var t = at(yr + 19);
      tl.set(R.marks[i], { attr: { 'data-state': 'found' } }, t)
        .from(R.nums[i], { autoAlpha: 0, y: '+=10', duration: 0.3, ease: 'back.out(2)' }, t)
        .from(R.tags[i], { autoAlpha: 0, x: '-=16', duration: 0.35 }, t + 0.05);
    });

    tl.to(R.scan, { autoAlpha: 0, duration: 0.3 }, T0 + TD).addLabel('final');

    K.scene({ root: '#ocr-part-a', timeline: tl, mode: 'play', trigger: '#ocr-svg' });
  }

  // getter/setter target so every render (incl. reverse and seek) writes the number
  function counter(el) {
    var cur = +el.getAttribute('data-ocr-to') || 0;
    return {
      v: function (val) {
        if (!arguments.length) return cur;
        cur = val;
        el.textContent = String(Math.round(val));
      }
    };
  }

  function partB(gsap, K) {
    var chart = document.getElementById('ocr-chart');
    if (!chart) return;
    function all(sel) { return Array.prototype.slice.call(chart.querySelectorAll(sel)); }

    var tb = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } });

    function bars(list, t0) {
      list.forEach(function (li, i) {
        var t = t0 + i * 0.16;
        var fill = li.querySelector('.ocr-meter-fill');
        var num = li.querySelector('[data-ocr-to]');
        if (fill) tb.from(fill, { scaleX: 0, transformOrigin: '0% 50%', duration: 0.8 }, t);
        if (num) tb.fromTo(counter(num), { v: 0 }, { v: +num.getAttribute('data-ocr-to') || 0, duration: 0.8 }, t);
      });
    }

    bars(all('[data-ocr-group="count"] .ocr-meter-list > .ocr-meter'), 0);
    tb.from(all('.ocr-truth-tick, .ocr-truth-label'), { autoAlpha: 0, duration: 0.3 }, 0.8);
    bars(all('[data-ocr-group="engine"] .ocr-meter-list > .ocr-meter'), 1.3);
    tb.addLabel('final');

    K.scene({ root: '#ocr-chart', timeline: tb, mode: 'play' });
  }
})();
