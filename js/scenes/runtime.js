(function () {
  'use strict';
  var R = {};
  var KEEP = [0, 2, 4, 5, 7], CUT = [1, 3, 6, 8];
  function cellX(i) { return -28 + 14 * i; }

  /* ================= DRAW (final state = end of step 3) ================= */
  IsoKit.build(function (K) {
    var g = K.stage('#runtime-svg', { origin: [500, 210] });
    if (!g) return;

    function layer(n) { return K.el('g', { cls: 'runtime-l-' + n }, g); }
    var LB = layer('back'), LC = layer('clients'), LE = layer('ext'), LW = layer('worker'),
      LBar = layer('bar'), LF = layer('front'), LL = layer('labels'), LP = layer('packets');

    function glyph(p, id, x, y, s, c) {
      return K.el('use', { href: '#iso-i-' + id, x: x, y: y, width: s, height: s, cls: 'iso-glyph runtime-glyph ' + (c || '') }, p);
    }
    function attachGlyph(chip, id, side, c) {
      if (!chip) return null;
      var bg = K.el('circle', { cls: 'runtime-glyph-bg', cx: 0, cy: 0, r: 17 }, chip);
      var u = glyph(chip, id, 0, -12, 24, c);
      var o = chip._isoLayout;
      chip._isoLayout = function () {
        if (o) o();
        var box = chip.querySelector('.iso-chip-box');
        var w = +(box && box.getAttribute('width')) || 0;
        var x = side === 'left' ? -w / 2 - 32 : w / 2 + 8;
        u.setAttribute('x', x);
        bg.setAttribute('cx', x + 12);
      };
      chip._isoLayout();
      return u;
    }
    function row(parent, vals, make, out) {
      vals.forEach(function (v) { var s = K.slab(parent, make(v)); if (out) out.push(s); });
    }

    /* 1. bundle + split wires */
    R.bundle = K.slab(LB, { x: 30, y: 30, z: 0, w: 70, d: 70, h: 60, cls: 'runtime-bundle is-accent' });
    R.wD = K.wire(LB, { points: [[100, 65, 30], [170, 65, 16]], arrow: 'strong', cls: 'is-strong runtime-wire-d' });
    R.wW = K.wire(LB, { points: [[65, 100, 30], [65, 170, 16]], arrow: 'strong', cls: 'is-strong runtime-wire-w' });

    /* 2. desktop app frame */
    R.desk = K.el('g', { cls: 'runtime-desk' }, LC);
    K.slab(R.desk, { x: 170, y: 20, z: 0, w: 190, d: 150, h: 16, cls: 'runtime-desk-plate' });
    K.plane(R.desk, { x: 170, y: 20, z: 16, w: 190, d: 22, cls: 'runtime-header' });
    R.deskLit = [];
    row(R.desk, [184, 228, 272], function (x) {
      return { x: x, y: 50, z: 16, w: 38, d: 26, h: 5, cls: 'is-accent-soft runtime-tab' };
    }, R.deskLit);
    row(R.desk, [184, 228, 272], function (x) {
      return { x: x, y: 92, z: 16, w: 38, d: 40, h: 12, cls: 'is-accent-soft runtime-module' };
    }, R.deskLit);
    R.bridge = K.slab(R.desk, { x: 318, y: 24, z: 16, w: 32, d: 24, h: 22, cls: 'is-accent-soft runtime-bridge' });
    R.deskLit.push(R.bridge);

    /* 3. web browser frame (mirror) */
    R.web = K.el('g', { cls: 'runtime-web' }, LC);
    K.slab(R.web, { x: 20, y: 170, z: 0, w: 150, d: 190, h: 16, cls: 'runtime-web-plate' });
    K.plane(R.web, { x: 20, y: 170, z: 16, w: 22, d: 190, cls: 'runtime-header' });
    K.plane(R.web, { x: 25, y: 200, z: 16, w: 12, d: 110, cls: 'runtime-addr' });
    row(R.web, [184, 228], function (y) {
      return { x: 50, y: y, z: 16, w: 26, d: 38, h: 5, cls: 'is-ghost runtime-tab' };
    });
    R.webLit = K.slab(R.web, { x: 50, y: 272, z: 16, w: 26, d: 38, h: 5, cls: 'is-accent-soft runtime-tab' });
    [184, 228, 272].forEach(function (y) {
      K.plane(R.web, { x: 92, y: y, z: 16, w: 40, d: 38, cls: 'is-dashed is-outline' });
    });
    K.slab(R.web, { x: 24, y: 318, z: 16, w: 24, d: 32, h: 22, cls: 'is-ghost runtime-bridge-slot' });

    /* 4. external blocks */
    R.gh = K.el('g', { cls: 'runtime-gh-grp' }, LE);
    K.slab(R.gh, { x: 580, y: 110, z: 0, w: 70, d: 70, h: 40, cls: 'runtime-ext runtime-gh' });

    R.notion = K.el('g', { cls: 'runtime-notion-grp' }, LE);
    R.notionSlab = K.slab(R.notion, { x: -30, y: 400, z: 0, w: 130, d: 60, h: 24, cls: 'runtime-ext runtime-notion' });
    R.cut = [];
    CUT.forEach(function (i) {
      R.cut.push(K.slab(R.notion, {
        x: cellX(i), y: 410, z: 24, w: 14, d: 40, h: 14, hatch: 'top', pattern: 'iso-crosshatch',
        cls: 'is-muted runtime-cell runtime-cell-cut iso-transient'
      }));
    });
    R.ghostBar = K.plane(R.notion, { x: -28, y: 410, z: 38, w: 126, d: 40, cls: 'is-dashed is-outline runtime-ghostbar' });

    /* 5. Worker */
    R.workerGrp = K.el('g', { cls: 'runtime-worker' }, LW);
    R.worker = K.slab(R.workerGrp, { x: 220, y: 240, z: 0, w: 300, d: 300, h: 26, hatch: true, cls: 'runtime-worker-slab' });
    R.gate = K.slab(R.workerGrp, { x: 450, y: 260, z: 26, w: 60, d: 60, h: 10, cls: 'runtime-gate' });
    R.gate.setAttribute('data-state', 'active');

    /* 6. kept payload cells, at their final place on the Worker */
    R.keep = []; R.keepOff = [];
    KEEP.forEach(function (i, j) {
      var xf = 240 + 14 * j;
      R.keep.push(K.slab(LBar, { x: xf, y: 410, z: 26, w: 14, d: 40, h: 14, cls: 'is-accent-soft runtime-cell' }));
      R.keepOff.push(K.iso(cellX(i) - xf, 0, -2));
    });

    /* 7. KV / D1 / Cron blocks + clock */
    R.blocksGrp = K.el('g', { cls: 'runtime-blocks' }, LF);
    [['runtime-kv', 250], ['runtime-d1', 330], ['runtime-cron', 410]].forEach(function (b) {
      K.slab(R.blocksGrp, { x: b[1], y: 470, z: 26, w: 60, d: 50, h: 36, cls: b[0] });
    });

    R.clock = K.el('g', { cls: 'runtime-clock', transform: 'translate(14 367)' }, LF);
    K.el('line', { cls: 'runtime-clock-leader', x1: 0, y1: 24, x2: -61.6, y2: 38.5 }, R.clock);
    K.el('circle', { cls: 'runtime-clock-face', cx: 0, cy: 0, r: 24 }, R.clock);
    [[0, -24, 0, -18], [24, 0, 18, 0], [0, 24, 0, 18], [-24, 0, -18, 0]].forEach(function (t) {
      K.el('line', { cls: 'runtime-clock-tick', x1: t[0], y1: t[1], x2: t[2], y2: t[3] }, R.clock);
    });
    R.hand = K.el('line', { cls: 'runtime-clock-hand', x1: 0, y1: 0, x2: 0, y2: 16 }, R.clock);
    K.el('circle', { cls: 'runtime-clock-pin', cx: 0, cy: 0, r: 3 }, R.clock);

    /* 8. wires, tags, chips */
    R.nWl = K.wire(LL, { points: [[63, 291, 21], { x: -197, y: 77 }], cls: 'is-dashed iso-minor' });
    R.nDl = K.wire(LL, { points: [[247, 112, 28], { x: 105, y: 77 }], cls: 'is-dashed iso-minor' });
    R.w302 = K.wire(LL, { points: [[510, 290, 30], [600, 290, 30], [600, 182, 30]], arrow: 'strong', cls: 'is-strong runtime-w302' });

    [
      ['tBundle', [65, 65, 60], 0, -70, null, 'React 번들', 'is-accent'],
      ['tWeb', [36, 334, 38], 0, -150, null, '웹', 'is-muted'],
      ['tDesk', [334, 36, 38], 0, -150, null, '데스크톱\nwindow.electronAPI', 'is-accent'],
      ['tWorker', K.anchor(R.worker, 'right'), 70, 50, null, 'Cloudflare Worker', ''],
      ['tKV', [280, 520, 44], -60, 60, null, 'KV\n템플릿·프로젝트', 'iso-minor'],
      ['tD1', [360, 520, 44], -60, 90, null, 'D1\n안내 기록', 'iso-minor'],
      ['tCron', [440, 520, 44], -60, 120, null, 'Cron\n9·12·15·18시', 'iso-minor'],
      ['tBefore', [35, 430, 38], -20, 110, null, 'Notion\n전체 칸\n3.8MB · 4.3초', 'is-muted'],
      ['tCut', [-7, 430, 38], 0, -70, null, '받지 않는 칸', 'is-muted iso-minor iso-transient'],
      ['tAfter', [275, 430, 40], 30, -40, null, '필요한 칸만\n2.1MB · 2.5초', 'is-accent'],
      ['tGate', [480, 290, 36], 20, -50, null, '/api/update\n세션 확인·302', 'iso-minor'],
      ['tGh', [615, 145, 40], 50, -110, 'end', 'GitHub Releases', '']
    ].forEach(function (t) {
      R[t[0]] = K.tag(LL, { at: t[1], dx: t[2], dy: t[3], anchor: t[4], text: t[5], cls: t[6] });
    });

    R.cWeb = K.chip(LL, { x: -197, y: 60, text: '문자 탭만', cls: 'is-accent-soft iso-minor' });
    R.cDesk = K.chip(LL, { x: 105, y: 60, text: '감시·OCR·로컬 AI·호스팅', cls: 'is-accent-soft iso-minor' });
    R.c302 = K.chip(LL, { x: 277, y: 445, text: '302', cls: 'iso-minor' });
    R.cRestart = K.chip(LL, { x: 120, y: 218, text: '재시작해서 업데이트', cls: 'is-muted' });
    attachGlyph(R.cRestart, 'person', 'left');

    /* 9. packets */
    R.cpW = K.packet(LP, { at: [65, 65, 60], size: 28, cls: 'runtime-copy iso-transient' });
    R.cpD = K.packet(LP, { at: [65, 65, 60], size: 28, cls: 'runtime-copy iso-transient' });
    R.token = K.packet(LP, { at: [340, 140, 16], size: 26, text: '세션 토큰', cls: 'runtime-token iso-transient' });
    attachGlyph(R.token.label, 'key', 'right', 'is-accent');
    R.inst = K.packet(LP, { at: [345, 72, 16], size: 26, cls: 'runtime-inst' });
    R.inst.setAttribute('data-state', 'neutral');
  });

  /* ================= ANIMATE ================= */
  IsoKit.ready(function (gsap, ST, K) {
    if (!R.bundle) return;
    var A = Object.assign;
    var SVGO = '0 0';

    gsap.set([R.cpW, R.cpD], { autoAlpha: 0 });
    gsap.set(R.cut, { autoAlpha: 0 });
    gsap.set(R.tCut, { autoAlpha: 0 });

    var tl = gsap.timeline({ paused: true, defaults: { duration: 0.5, ease: 'power2.out' } });
    var LD = K.dash(R.wD), LW2 = K.dash(R.wW), L302 = K.dash(R.w302);

    tl.set(R.gate, { attr: { 'data-state': 'idle' }, immediateRender: true }, 0);

    /* ---- step 0: one bundle, two screens ---- */
    tl.addLabel('step-0');
    tl.from(R.bundle, { autoAlpha: 0, y: '-=30' })
      .from(R.tBundle, { autoAlpha: 0 }, '<0.2')
      .from([R.desk, R.web], { autoAlpha: 0, y: '+=24', stagger: 0.12 })
      .from(R.wD, { strokeDashoffset: LD, duration: 0.4 })
      .from(R.wW, { strokeDashoffset: LW2, duration: 0.4 }, '<');

    tl.addLabel('copy');
    tl.fromTo([R.cpW, R.cpD], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, 'copy');
    tl.to(R.cpW, A({ duration: 0.7, ease: 'power1.inOut' }, K.iso(65, 291, 21)), 'copy+=0.1');
    tl.to(R.cpD, A({ duration: 0.7, ease: 'power1.inOut' }, K.iso(247, 63, 21)), 'copy+=0.1');
    tl.to([R.cpW, R.cpD], { autoAlpha: 0, duration: 0.2 }, '>');
    tl.from(R.webLit, { autoAlpha: 0 }, '<');
    tl.from(R.deskLit, { autoAlpha: 0, stagger: 0.05 }, '<');
    tl.from([R.nWl, R.nDl, R.cWeb, R.cDesk, R.tWeb, R.tDesk], { autoAlpha: 0, stagger: 0.06 });

    /* ---- step 1: Worker, KV / D1 / Cron, Notion payload shrinks ---- */
    tl.addLabel('step-1');
    tl.from(R.workerGrp, { autoAlpha: 0, y: '+=30', duration: 0.6 })
      .from([R.blocksGrp, R.clock], { autoAlpha: 0, y: '+=20' }, '<0.2')
      .from([R.tWorker, R.tKV, R.tD1, R.tCron], { autoAlpha: 0, stagger: 0.05 })
      .fromTo(R.hand, { rotation: 90, svgOrigin: SVGO }, { rotation: 180, svgOrigin: SVGO, duration: 0.35, ease: 'back.out(2)' })
      .from([R.notionSlab, R.ghostBar], { autoAlpha: 0, y: '-=20' })
      .from(R.tBefore, { autoAlpha: 0 }, '<')
      .to(R.hand, { rotation: 270, svgOrigin: SVGO, duration: 0.35, ease: 'back.out(2)' });

    var c = tl.duration();
    tl.addLabel('cells', c);
    tl.addLabel('drop', c + 0.7);
    tl.addLabel('move', c + 1.2);

    tl.from(R.keep, { autoAlpha: 0, duration: 0.25, stagger: 0.03 }, 'cells');
    R.keep.forEach(function (cell, j) {
      tl.from(cell, { x: R.keepOff[j].x, y: R.keepOff[j].y, duration: 0.75, ease: 'power2.inOut' }, 'move+=' + (j * 0.05));
    });
    tl.fromTo(R.cut, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, stagger: 0.03 }, 'cells');
    tl.fromTo(R.tCut, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 'cells+=0.3');
    tl.to(R.cut, { autoAlpha: 0, y: '+=36', duration: 0.45, stagger: 0.05 }, 'drop');
    tl.to(R.tCut, { autoAlpha: 0, duration: 0.2 }, 'drop+=0.4');
    tl.to(R.hand, { rotation: 360, svgOrigin: SVGO, duration: 0.35 }, 'move');
    tl.from(R.tAfter, { autoAlpha: 0 }, 'move+=0.6');

    /* ---- step 2: token-checked update via 302, install waits for a person ---- */
    tl.addLabel('step-2');
    tl.from([R.gh, R.tGh], { autoAlpha: 0, y: '-=20' });
    tl.fromTo(R.token, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 });
    K.travel(tl, R.token, [[340, 140, 16], [480, 140, 16], [480, 290, 36]], { speed: 380, ease: 'power1.inOut' });
    tl.set(R.gate, { attr: { 'data-state': 'active' } });
    tl.from(R.tGate, { autoAlpha: 0 }, '<');
    tl.to(R.token, { autoAlpha: 0, duration: 0.2 }, '+=0.15');
    tl.from(R.w302, { strokeDashoffset: L302, duration: 0.5 });
    tl.from(R.c302, { autoAlpha: 0 }, '<0.3');

    tl.addLabel('inst');
    K.travel(tl, R.inst, [[615, 192, 0], [420, 72, 0], [345, 72, 16]], { speed: 400, ease: 'power1.inOut', position: 'inst' });
    tl.from(R.inst, { autoAlpha: 0, duration: 0.2 }, 'inst');
    tl.from(R.cRestart, { autoAlpha: 0, y: '+=10' });

    K.scene({ root: '#runtime', timeline: tl });
  });
})();
