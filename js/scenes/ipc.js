(function () {
  'use strict';
  var R = {};
  var CH = [['start-monitor', 50], ['call-llm', 130], ['read-photo', 210], ['hosting-list', 290], ['local-ai', 370]];
  var CELLS = [['persist:monitor', 55, 15], ['persist:hosting', 140, 100], ['persist:invoice', 225, 185]];
  var LZ = 76;

  IsoKit.build(function (K) {
    var root = K.stage('#ipc-svg', { origin: [550, 570] });
    if (!root) return;

    function G(c, p) { return K.el('g', { 'class': c }, p || root); }
    function tr(at) { var p = K.iso(at); return 'translate(' + p.x + ' ' + p.y + ')'; }
    function badge(parent, at, icon, c, s) {
      var g = K.el('g', { 'class': 'ipc-badge' + (c ? ' ' + c : ''), transform: tr(at) }, parent);
      K.el('circle', { 'class': 'ipc-badge-bg', cx: 0, cy: 0, r: s * 0.72 }, g);
      K.el('use', { href: '#iso-i-' + icon, x: -s / 2, y: -s / 2, width: s, height: s, 'class': 'iso-glyph' + (c ? ' ' + c : '') }, g);
      return g;
    }
    function follower(rest, text, state) {
      var g = K.el('g', { 'class': 'ipc-follow', transform: tr(rest) }, R.gFollow);
      g.chip = K.chip(g, { at: [0, 0, LZ], text: text, cls: 'ipc-follow-chip' });
      g.chip.setAttribute('data-state', state);
      return g;
    }
    function pk(layer, at, c) {
      return K.packet(layer, { text: '', at: at, size: 34, height: 27, lift: 17, cls: 'ipc-pkt' + (c ? ' ' + c : '') });
    }
    function layerTag(parent, at, dy, name, desc) {
      K.tag(parent, { at: at, dx: -40, dy: dy, text: name + '\n' + desc, cls: 'ipc-tag-full' });
      K.tag(parent, { at: at, dx: -40, dy: dy, text: name, cls: 'ipc-tag-short' });
    }

    /* painter order: bottom plate first */
    R.gL4 = G('ipc-layer-g ipc-g4');
    R.gP4 = G('ipc-pass ipc-p4');
    R.gL3 = G('ipc-layer-g ipc-g3');
    R.gP3 = G('ipc-pass ipc-p3');
    R.gL2 = G('ipc-layer-g ipc-g2');
    R.gP2 = G('ipc-pass ipc-p2');
    R.gL1 = G('ipc-layer-g ipc-g1');
    R.gP1 = G('ipc-pass ipc-p1');
    R.gOver = G('ipc-over');
    R.gWires = G('ipc-wires', R.gOver);
    R.gPk = G('ipc-packets', R.gOver); // one packet per route, drawn above the plates so it never vanishes mid-way
    R.gLab4 = G('ipc-lab ipc-lab4', R.gOver);
    R.gLab3 = G('ipc-lab ipc-lab3', R.gOver);
    R.gLab2 = G('ipc-lab ipc-lab2', R.gOver);
    R.gLab1 = G('ipc-lab ipc-lab1', R.gOver);
    R.gFx = G('ipc-fx', R.gOver);
    R.gFollow = G('ipc-followers', R.gOver);

    /* L4: isolated processes and sessions */
    K.slab(R.gL4, { x: 0, y: 0, z: 0, w: 480, d: 130, h: 20, hatch: true, pattern: 'iso-hatch-wide', cls: 'ipc-layer ipc-l4' });
    R.gL4c = G('ipc-layer-c', R.gL4);
    R.cells = CELLS.map(function (c) {
      return K.plane(R.gL4c, { x: c[2], y: 55, z: 20, w: 80, d: 70, cls: 'is-outline ipc-cell' });
    });
    [95, 180, 265].forEach(function (x) {
      K.slab(R.gL4c, { x: x, y: 55, z: 20, w: 5, d: 70, h: 26, cls: 'is-ghost ipc-wall' });
    });
    R.util = K.slab(R.gL4c, { x: 325, y: 62, z: 20, w: 90, d: 64, h: 24, cls: 'ipc-util' });
    R.util.setAttribute('data-state', 'accent-soft');

    /* L3: Electron main */
    K.slab(R.gL3, { x: 0, y: 0, z: 170, w: 480, d: 130, h: 16, cls: 'ipc-layer ipc-l3' });
    R.gL3c = G('ipc-layer-c', R.gL3);
    K.plane(R.gL3c, { x: 342, y: 75, z: 186, w: 56, d: 54, cls: 'is-outline is-dashed ipc-passage' });
    K.slab(R.gL3c, { x: 20, y: 64, z: 186, w: 140, d: 60, h: 16, cls: 'ipc-handlers' });
    R.ocr = K.slab(R.gL3c, { x: 175, y: 64, z: 186, w: 70, d: 60, h: 24, cls: 'ipc-ocr' });
    R.vault = K.slab(R.gL3c, { x: 255, y: 64, z: 186, w: 70, d: 60, h: 24, cls: 'ipc-vault' });
    K.slab(R.gL3c, { x: 410, y: 10, z: 186, w: 60, d: 50, h: 18, cls: 'ipc-agent' });
    badge(R.gL3c, [290, 124, 198], 'lock', '', 26);

    /* L2: preload bridge */
    K.slab(R.gL2, { x: 0, y: 0, z: 330, w: 480, d: 130, h: 12, hatch: 'sides', cls: 'ipc-layer ipc-l2' });
    R.gL2c = G('ipc-layer-c', R.gL2);
    CH.forEach(function (c) {
      var s = K.plane(R.gL2c, { x: c[1] - 27, y: 77, z: 342, w: 54, d: 50, cls: 'ipc-slot' });
      if (c[0] === 'read-photo') { R.slotRP = s; s.setAttribute('data-state', 'on'); }
    });
    K.plane(R.gL2c, { x: 403, y: 5, z: 342, w: 54, d: 50, cls: 'is-outline is-dashed ipc-noslot' });

    /* L1: renderer screen */
    K.slab(R.gL1, { x: 0, y: 0, z: 480, w: 480, d: 130, h: 16, cls: 'ipc-layer ipc-l1' });
    R.gL1c = G('ipc-layer-c', R.gL1);
    K.plane(R.gL1c, { x: 14, y: 12, z: 496, w: 452, d: 106, cls: 'is-outline ipc-frame' });
    K.slab(R.gL1c, { x: 28, y: 22, z: 496, w: 162, d: 36, h: 6, cls: 'ipc-widget' });
    K.slab(R.gL1c, { x: 28, y: 70, z: 496, w: 102, d: 38, h: 6, cls: 'ipc-widget' });

    /* path wires (final state) */
    R.wPh2 = K.wire(R.gP2, { points: [[210, 102, 470], [210, 102, 352]], cls: 'is-accent' });
    R.wPh3 = K.wire(R.gP3, { points: [[210, 102, 322], [210, 102, 216]], cls: 'is-accent', arrow: 'accent' });
    R.wPw2 = K.wire(R.gP2, { points: [[290, 102, 470], [290, 102, 352]], cls: 'is-strong' });
    R.wPw3 = K.wire(R.gP3, { points: [[290, 102, 322], [290, 102, 216]], cls: 'is-strong', arrow: 'strong' });
    R.wAi2 = K.wire(R.gP2, { points: [[370, 102, 470], [370, 102, 352]] });
    R.wAi3 = K.wire(R.gP3, { points: [[370, 102, 322], [370, 102, 196]] });
    R.wAi4 = K.wire(R.gP4, { points: [[370, 102, 160], [370, 102, 50]], arrow: true });
    R.upWire = K.wire(R.gWires, { points: [[320, 100, 214], [320, 100, 488]], cls: 'is-danger is-dashed', arrow: 'danger' });

    /* packets at rest pose */
    R.ph = pk(R.gPk, [210, 102, 210], '');
    R.fsA = pk(R.gP2, [430, 30, 375], '');
    R.fsA.setAttribute('data-state', 'blocked');
    R.pw = pk(R.gPk, [290, 102, 210], '');
    R.ai = pk(R.gPk, [370, 102, 44], '');

    /* followers */
    R.fPh = follower([210, 102, 210], '사진 읽기', 'accent-soft');
    R.fFs = follower([430, 30, 375], '파일 직접 열기', 'danger');
    R.fPw = follower([290, 102, 210], '비밀번호', 'accent-soft');
    R.fAi = follower([370, 102, 44], '로컬 AI', 'accent-soft');

    /* labels */
    layerTag(R.gLab4, [0, 130, 10], -20, '분리된 프로세스·세션', '로컬 AI · 외부 사이트 파티션');
    R.cellChips = CELLS.map(function (c) {
      return K.chip(R.gLab4, { at: [c[1], 170, 20], text: c[0], cls: 'iso-minor ipc-cell-chip' });
    });
    K.chip(R.gLab4, { at: [370, 126, 32], text: 'utilityProcess · Gemma 4', cls: 'iso-minor' });

    layerTag(R.gLab3, [0, 130, 178], 0, 'Electron 메인', 'IPC 처리 · OCR · 비밀번호 보관');
    K.chip(R.gLab3, { at: [80, 124, 194], text: 'ipc/*.js', cls: 'iso-minor' });
    K.chip(R.gLab3, { at: [210, 124, 198], text: 'PaddleOCR' });
    K.chip(R.gLab3, { at: [440, 60, 195], text: '127.0.0.1', cls: 'iso-minor' });

    layerTag(R.gLab2, [0, 130, 336], 0, 'preload 다리', '허용 목록만 electronAPI로');
    CH.forEach(function (c) {
      var rp = c[0] === 'read-photo';
      var ch = K.chip(R.gLab2, { at: [c[1], 102, 382], text: c[0], cls: rp ? 'ipc-slot-chip' : 'iso-minor ipc-slot-chip' });
      if (rp) { R.rpChip = ch; ch.setAttribute('data-state', 'accent'); }
    });

    layerTag(R.gLab1, [0, 130, 488], 0, '화면 (렌더러)', 'React 19 · Node API 없음');

    /* effects */
    R.tagAllowed = K.tag(R.gFx, { at: [210, 102, 342], dx: -100, dy: 36, text: '허용 칸', cls: 'is-accent' });
    R.tagResult = K.tag(R.gFx, { at: [210, 102, 496], dx: 0, dy: -40, text: '읽은 글자', cls: 'is-success' });
    R.ban = badge(R.gFx, [430, 30, 342], 'ban', 'is-danger', 26);
    R.blocked = K.chip(R.gFx, { at: [470, 30, 300], text: '막힘', cls: 'is-danger' });
    R.xMark = badge(R.gFx, [320, 100, 435], 'x', 'is-danger', 24);
    R.tagNoRet = K.tag(R.gFx, { at: [320, 100, 490], dx: 24, dy: -48, anchor: 'middle', text: '화면으로 돌려주지 않음', cls: 'is-danger' });
    R.cookies = CELLS.map(function (c) { return badge(R.gFx, [c[1], 90, 22], 'cookie', 'is-accent', 24); });
  });

  IsoKit.ready(function (gsap, ST, K) {
    if (!R.gL1) return;
    var tl = gsap.timeline({ paused: true, defaults: { duration: 0.4, ease: 'power2.out' } });
    var cur = 'step-0';

    function L(n) { cur = 'step-' + n; tl.addLabel(cur); }
    function P(t) { return cur + '+=' + t; }
    function flip(el, a, b, pos) {
      tl.fromTo(el, { attr: { 'data-state': a } }, { attr: { 'data-state': b }, duration: 0.01, immediateRender: true }, pos);
    }
    function setS(el, s, pos) { tl.to(el, { attr: { 'data-state': s }, duration: 0.01 }, pos); }
    function show(x, pos) { tl.fromTo(x, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, pos); }
    function dash(wr, pos) {
      var len = K.dash(wr);
      tl.fromTo(wr, { strokeDashoffset: len, autoAlpha: 0 }, { strokeDashoffset: 0, autoAlpha: 1, duration: 0.5, ease: 'none' }, pos);
    }
    function hold() { tl.to({}, { duration: 0.4 }); }
    function pop(x, pos, s) {
      tl.fromTo(x, { autoAlpha: 0, scale: s || 0.4, transformOrigin: '50% 50%' },
        { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, pos);
    }
    function go(targets, pts, o) { K.travel(tl, targets, pts, o); }

    /* step-0: explode */
    tl.addLabel('step-0', 0);
    tl.from(R.gL1, { y: 432, duration: 1.2, ease: 'power3.inOut' }, 0);
    tl.from(R.gL2, { y: 294, duration: 1.2, ease: 'power3.inOut' }, 0);
    tl.from(R.gL3, { y: 150, duration: 1.2, ease: 'power3.inOut' }, 0);
    show([R.gL1c, R.gL2c, R.gL3c, R.gL4c], 0.7);
    [[R.gLab4, 1.1], [R.gLab3, 1.3], [R.gLab2, 1.5], [R.gLab1, 1.7]].forEach(function (l) {
      tl.fromTo(l[0], { autoAlpha: 0, x: -14 }, { autoAlpha: 1, x: 0, duration: 0.35 }, l[1]);
    });
    hold();

    /* step-1: allowed request reaches PaddleOCR */
    L(1);
    flip(R.slotRP, '', 'on', P(0));
    flip(R.rpChip, '', 'accent', P(0));
    show(R.tagAllowed, P(0));
    show([R.ph, R.fPh], P(0.2));
    dash(R.wPh2, '<');
    dash(R.wPh3, '<+=0.3');
    go([R.ph, R.fPh], [[210, 102, 430], [210, 102, 210]], { speed: 260, ease: 'power1.inOut', position: P(0.2) });
    flip(R.ocr, '', 'accent-soft', '>');
    setS(R.ocr, '', '+=.6');
    tl.fromTo(R.tagResult, { autoAlpha: 0, y: 286 }, { autoAlpha: 1, y: 0, duration: 0.8 }, '<-.45');
    hold();

    /* step-2: request outside the list bounces off */
    L(2);
    show([R.fsA, R.fFs], P(0.1));
    go([R.fsA, R.fFs], [[430, 30, 430], [430, 30, 325]], { speed: 300, ease: 'power2.in', position: P(0.1) });
    flip(R.fsA, '', 'blocked', '>');
    flip(R.fFs.chip, 'accent-soft', 'danger', '<');
    pop(R.ban, '<');
    show(R.blocked, '<');
    tl.to([R.fsA, R.fFs], Object.assign({ duration: 0.55, ease: 'power2.out' }, K.iso(430, 30, 375)), '<');
    hold();

    /* step-3: password goes down only */
    L(3);
    show([R.pw, R.fPw], P(0.1));
    dash(R.wPw2, '<');
    dash(R.wPw3, '<+=0.3');
    go([R.pw, R.fPw], [[290, 102, 430], [290, 102, 210]], { speed: 260, ease: 'power1.inOut', position: P(0.1) });
    flip(R.vault, '', 'accent-soft', '>');
    setS(R.vault, '', '+=.6');
    tl.fromTo(R.upWire, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.45 }, '<-.4');
    pop(R.xMark, '>');
    show(R.tagNoRet, '<');
    hold();

    /* step-4: local AI in its own process, partitions stay apart */
    L(4);
    show([R.ai, R.fAi], P(0.1));
    dash(R.wAi2, '<');
    dash(R.wAi3, '<+=0.3');
    dash(R.wAi4, '<+=0.6');
    go([R.ai, R.fAi], [[370, 102, 430], [370, 102, 44]], { speed: 300, ease: 'power1.inOut', position: P(0.1) });
    flip(R.util, '', 'accent', '>');
    setS(R.util, 'accent-soft', '+=.25');
    setS(R.util, 'accent', '+=.25');
    setS(R.util, 'accent-soft', '+=.25');
    tl.fromTo(R.ai.body, { y: 0 }, { y: -8, duration: 0.25, yoyo: true, repeat: 1 }, '<-.75');
    tl.addLabel('ipc-cells');
    R.cells.forEach(function (cell, i) {
      var a = 'ipc-cells+=' + (i * 0.5), b = 'ipc-cells+=' + (i * 0.5 + 0.45);
      flip(cell, '', 'on', a);
      flip(R.cellChips[i], '', 'accent-soft', a);
      pop(R.cookies[i], a, 0.5);
      setS(cell, '', b);
      setS(R.cellChips[i], '', b);
    });
    hold();

    K.scene({ root: '#ipc', timeline: tl });
  });
})();
