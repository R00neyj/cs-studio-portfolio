/*! js/scenes/flow.js: #flow inquiry -> answer in 5 steps (IsoKit 'steps' scene) */
(function () {
  'use strict';
  var R = {};
  var OX = 500, OY = 210;                 // stage origin in viewBox units
  var HIDE = 'opacity:0;visibility:hidden';
  var GY = 390;                           // screen y of the masking gate centre (step 3)

  // viewBox screen point -> root-relative point
  function S(X, Y) { return { x: X - OX, y: Y - OY }; }

  function grp(K, parent, cls, hidden) {
    return K.el('g', { 'class': cls || null, style: hidden ? HIDE : null }, parent);
  }
  function glyph(K, parent, id, p, size, cls, hidden) {
    var w = grp(K, parent, 'flow-glyph', hidden);
    K.el('use', {
      href: '#iso-i-' + id, x: p.x - size / 2, y: p.y - size / 2, width: size, height: size,
      'class': 'iso-glyph' + (cls ? ' ' + cls : '')
    }, w);
    return w;
  }
  // chip inside a plain wrapper <g> so GSAP can move/fade the wrapper
  function cw(K, parent, p, text, cls, hidden) {
    var w = grp(K, parent, null, hidden);
    K.chip(w, { x: p.x, y: p.y, text: text, cls: cls || null });
    return w;
  }
  function note(K, parent, X, Y, text, cls, anchor) {
    var p = S(X, Y);
    return K.tag(parent, { x: p.x, y: p.y, dx: 0, dy: 0, anchor: anchor || 'middle', text: text, cls: cls || null });
  }

  /* ---------- step 1: read without opening the room ---------- */
  function s1(K, G) {
    var A = R.s1 = {};
    K.slab(G, { x: 0, y: 340, w: 140, d: 180, h: 14, cls: 'flow-cust' });
    K.slab(G, { x: 20, y: 372, z: 14, w: 96, d: 30, h: 5, cls: 'flow-msg' });
    K.slab(G, { x: 360, y: 10, w: 160, d: 140, h: 120, cls: 'is-ghost flow-window' });
    K.slab(G, { x: 180, y: 180, w: 180, d: 180, h: 14, cls: 'flow-channel' });
    [196, 252, 308].forEach(function (y, i) {
      K.slab(G, { x: 196, y: y, z: 14, w: 148, d: 36, h: 5, cls: i ? 'flow-row' : 'flow-row is-accent-soft' });
    });
    A.eye = glyph(K, G, 'eye-off', S(820, 322), 40);
    A.wire = K.wire(G, { points: [[344, 214, 19], [440, 214, 19], [440, 112, 4]], cls: 'is-dashed', arrow: true });
    A.unread = grp(K, G);
    K.chip(A.unread, { at: [110, 470, 14], text: '안 읽음 1', cls: 'flow-unread' });
    A.pkt = K.packet(G, { at: [440, 70, 0], text: '새 문의', cls: 'flow-pkt' });
    A.tags = [
      K.tag(G, { at: [70, 340, 14], dy: -80, text: '고객 쪽 화면' }),
      K.tag(G, { at: [360, 360, 14], dy: 60, text: '비즈니스 채널' }),
      K.tag(G, { at: [344, 214, 19], dx: 20, dy: -100, text: '스튜디오 아크', cls: 'iso-minor' }),
      K.tag(G, { at: [440, 214, 19], dy: 80, text: '방을 열지 않는 조회', cls: 'iso-minor' }),
      K.tag(G, { at: [360, 10, 120], dx: -20, dy: -50, text: '숨김 창 · 분리 세션\npersist:monitor', cls: 'iso-minor' })
    ];
  }

  /* ---------- step 2: keyword score bars ---------- */
  function sil(K, o) {
    var x = o.x - 2, y = o.y - 2, w = o.w + 4, d = o.d + 4, z = o.z, t = o.z + o.h + 3;
    return K.points([[x, y, t], [x + w, y, t], [x + w, y, z], [x + w, y + d, z], [x, y + d, z], [x, y + d, t]]);
  }
  var clipN = 0;
  // bar segment that rises out of its own silhouette (transform-only growth, no scaling)
  function riser(K, G, o, list) {
    var id = 'flow-clip-' + (++clipN);
    K.el('polygon', { points: sil(K, o) }, K.el('clipPath', { id: id }, R.defs));
    var inner = grp(K, K.el('g', { 'clip-path': 'url(#' + id + ')' }, G), 'flow-rise');
    K.slab(inner, o);
    inner._h = o.h;
    list.push(inner);
  }
  function s2(K, G) {
    var A = R.s2 = { rise: [], up: [], score: [], tags: [] };
    var TH = 90, Y = 230, W = 70;
    var bars = [
      { x: 90, v: 94, c: 'is-accent-soft', t: '수정 일정 안내' },
      { x: 215, v: 68, c: 'is-accent-soft', t: '입금 계좌 안내' },
      { x: 340, v: 32, c: 'is-muted', t: '기준 미달 후보' }
    ];
    bars.forEach(function (b) {
      b.h = Math.round(b.v * 1.8);
      riser(K, G, { x: b.x, y: Y, z: 0, w: W, d: W, h: Math.min(b.h, TH), cls: b.c }, A.rise);
    });
    A.plane = K.plane(G, { x: 50, y: 190, z: TH, w: 400, d: 150, cls: 'is-dashed flow-threshold' });
    bars.forEach(function (b) {
      if (b.h > TH) riser(K, G, { x: b.x, y: Y, z: TH, w: W, d: W, h: b.h - TH, cls: b.c }, A.up);
    });
    var capZ = bars[0].h + 16;
    A.cap = grp(K, G);
    K.slab(A.cap, { x: 90, y: Y, z: capZ, w: W, d: W, h: 8, cls: 'is-accent' });
    bars.forEach(function (b, i) {
      var p = K.iso(b.x + W / 2, Y + W / 2, i ? b.h : capZ + 8);
      A.score.push(cw(K, G, { x: p.x, y: p.y - 38 }, String(b.v), i < 2 ? 'is-accent-soft' : 'is-muted'));
      A.tags.push(K.tag(G, { at: [b.x + W / 2, Y + W, Math.min(40, b.h / 2)], dx: -50, dy: 40, text: b.t, cls: 'iso-minor' }));
    });
    A.tags.push(K.tag(G, { at: [450, 190, TH], dx: 10, dy: -40, text: '기준 50점' }));
    A.pick = K.tag(G, { at: [125, 265, capZ + 8], dx: -90, dy: -50, text: '사람이 고름', cls: 'is-accent' });
    A.cur = glyph(K, G, 'cursor', S(405, 235), 40);
  }

  /* ---------- step 3: mask inside the PC ---------- */
  function s3(K, G) {
    var A = R.s3 = { items: [] };
    K.slab(G, { x: 140, y: 140, z: 106, w: 300, d: 300, h: 6, hatch: 'top', pattern: 'iso-hatch-accent', cls: 'is-accent-soft flow-gate' });
    A.fx = [glyph(K, G, 'lock', S(500, 330), 40), cw(K, G, S(500, 395), 'PC 안에서 가림', 'is-accent')];
    A.labels = [
      note(K, G, 40, 110, '원문', 'is-muted iso-minor', 'start'),
      note(K, G, 30, 600, '서버로 가는 글', 'is-muted iso-minor', 'start')
    ];
    var cols = [300, 700], top = [70, 150, 230], bot = [560, 640, 720];
    [
      ['studio-ark.co.kr', '[도메인1]'], ['박민수', '[고객1]'],
      ['스튜디오 아크', '[고객사1]'], ['010-4821-9034', '[연락처1]'],
      ['자료 접수'], ['수정 일정 문의']
    ].forEach(function (it, i) {
      var c = cols[i % 2], r = i >> 1, minor = r > 1 ? 'iso-minor' : null;
      var b = S(c, top[r]), q = S(c, bot[r]);
      K.chip(G, { x: b.x, y: b.y, text: it[0], cls: minor });
      var item = { g: grp(K, G, 'flow-drop'), by: top[r], ay: bot[r] };
      if (it[1]) {
        item.mask = cw(K, item.g, q, it[1], 'is-accent-soft');
        item.real = cw(K, item.g, q, it[0], 'iso-transient', true);
      } else cw(K, item.g, q, it[0], minor);
      A.items.push(item);
    });
  }

  /* ---------- step 4: server AI and result check ---------- */
  function s4(K, G) {
    var A = R.s4 = { rows: [] };
    K.slab(G, { x: 70, y: -60, z: 92, w: 160, d: 120, h: 40, hatch: 'sides', cls: 'flow-cloud' });
    glyph(K, G, 'cloud', S(613, 150), 44);
    [120, 250, 380].forEach(function (y) { K.slab(G, { x: 90, y: y, w: 90, d: 90, h: 12, cls: 'flow-hop' }); });
    K.slab(G, { x: 300, y: 200, w: 180, d: 180, h: 10, cls: 'flow-check' });
    A.wires = [
      K.wire(G, { points: [[135, 425, 12], [135, 295, 12], [135, 165, 12], [150, 0, 92]], cls: 'is-dashed', arrow: true }),
      K.wire(G, { points: [[180, 300, 12], [300, 350, 10]], cls: 'is-dashed', arrow: true })
    ];
    A.tags = [
      K.tag(G, { at: [70, 60, 132], dx: -50, dy: -40, text: '서버 AI\nClaude Haiku' }),
      K.tag(G, { at: [90, 120, 12], dx: -80, dy: -50, text: 'Worker' }),
      K.tag(G, { at: [90, 250, 12], dx: -70, dy: -50, text: 'Electron 메인' }),
      K.tag(G, { at: [90, 470, 12], dx: -30, dy: 50, text: 'IPC' }),
      K.tag(G, { at: [300, 200, 10], dy: -50, text: '빠진 값 검사' })
    ];
    ['번호', '연락처', '도메인'].forEach(function (t, i) {
      var y = 480 + i * 65;
      A.rows.push({
        p: cw(K, G, S(660, y), t, 'is-muted', true),
        d: cw(K, G, S(660, y), t, 'is-success'),
        k: glyph(K, G, 'check', S(550, y), 30, 'is-success')
      });
    });
    A.pass = cw(K, G, S(660, 690), '통과', 'is-success');
    A.fb = cw(K, G, S(660, 750), '빠지면 원래 초안 유지', 'is-muted iso-minor');
    A.out = K.packet(G, { at: [150, 0, 92], text: '가린 문의', cls: 'is-masked iso-transient' });
    A.out.setAttribute('style', HIDE);
    A.back = K.packet(G, { at: [330, 350, 10], text: '답변 초안', cls: 'is-masked', labelCls: 'iso-minor' });
  }

  /* ---------- step 5: restore, copy, a person sends ---------- */
  function s5(K, G) {
    var A = R.s5 = { rows: [] };
    K.slab(G, { x: 40, y: 40, w: 400, d: 280, h: 14, cls: 'flow-card' });
    A.tags = [
      K.tag(G, { at: [40, 40, 14], dx: -40, dy: -60, text: '원래 값으로 되돌림' }),
      K.tag(G, { at: [440, 40, 14], dy: 60, text: '답변 초안', cls: 'is-muted iso-minor' })
    ];
    [['스튜디오 아크', '[고객사1]'], ['박민수', '[고객1]'], ['studio-ark.co.kr', '[도메인1]'], ['010-4821-9034', '[연락처1]']].forEach(function (it, i) {
      var q = S(552, 300 + i * 75);
      A.rows.push({ m: cw(K, G, q, it[1], 'is-accent-soft', true), r: cw(K, G, q, it[0]) });
    });
    A.copyG = glyph(K, G, 'copy', S(330, 650), 36);
    A.btn = grp(K, G);
    A.copy = cw(K, A.btn, S(470, 650), '답변 복사', 'is-accent', true);
    A.copied = cw(K, A.btn, S(470, 650), '복사함', 'is-success');
    A.cur = glyph(K, G, 'cursor', S(507, 677), 40, null, true);
    A.cur.setAttribute('class', 'flow-glyph iso-transient');
    A.chain = [
      K.wire(G, { points: [S(590, 650), S(680, 650)], arrow: true }),
      glyph(K, G, 'person', S(720, 645), 52),
      note(K, G, 720, 728, '사람이 직접 보냄'),
      K.wire(G, { points: [S(762, 648), S(845, 648)], arrow: true }),
      glyph(K, G, 'send', S(885, 648), 40)
    ];
    A.nosend = cw(K, G, S(780, 190), '앱 자동 전송 없음', 'is-muted');
  }

  /* ---------- DRAW: final frame = step 5, steps 1-4 drawn but hidden ---------- */
  IsoKit.build(function (K) {
    var svg = document.getElementById('flow-svg');
    if (!svg) return;
    var root = K.stage(svg, { origin: [OX, OY] });
    R.defs = K.el('defs', null, root);
    K.plane(root, { x: 0, y: 0, w: 540, d: 540, cls: 'is-ground' });
    K.grid(root, { x: 0, y: 0, w: 540, d: 540, step: 60 });
    R.G = [];
    for (var i = 0; i < 5; i++) {
      R.G.push(K.el('g', { 'class': 'flow-st', id: 'flow-st-' + (i + 1), style: i < 4 ? HIDE : null }, root));
    }
    s1(K, R.G[0]); s2(K, R.G[1]); s3(K, R.G[2]); s4(K, R.G[3]); s5(K, R.G[4]);
  });

  /* ---------- ANIMATE ----------
   * Every tween is a fromTo whose "from" equals the element's prior state.
   * The first tween per element renders immediately (sets the time-0 state);
   * later ones use immediateRender:false, so scrubbing both ways is exact. */
  IsoKit.ready(function (gsap, ST, K) {
    if (!R.G || !R.s5) return;
    var tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } });
    var seen = [], T = 0;

    function cp(a, b) { var r = {}, k; for (k in a) r[k] = a[k]; if (b) for (k in b) r[k] = b[k]; return r; }
    function ft(e, from, to, off) {
      if (!e) return;
      var fresh = seen.indexOf(e) < 0;
      if (fresh) seen.push(e);
      tl.fromTo(e, cp(from), cp(to, { immediateRender: fresh, duration: to.duration || 0.4 }), T + off);
    }
    function fade(list, a, b, off, stag, dur) {
      [].concat(list).forEach(function (e, i) {
        ft(e, { autoAlpha: a }, { autoAlpha: b, duration: dur || 0.4 }, off + i * (stag || 0));
      });
    }
    function fin(l, off, stag, dur) { fade(l, 0, 1, off, stag, dur); }
    function fout(l, off, stag, dur) { fade(l, 1, 0, off, stag, dur); }
    function at(p, extra) { return cp(K.iso(p), extra); }
    function hops(e, pts, off) {
      for (var i = 1; i < pts.length; i++) {
        var a = K.iso(pts[i - 1]), b = K.iso(pts[i]);
        var d = Math.max(0.25, Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2)) / 380);
        ft(e, a, cp(b, { duration: d, ease: 'power1.inOut' }), off);
        off += d;
      }
      return off;
    }
    function seg(i, fn) {
      T = tl.duration();
      tl.addLabel('step-' + i, T);
      if (i) { fout(R.G[i - 1], 0, 0, 0.35); fin(R.G[i], 0, 0, 0.35); }
      tl.to({}, { duration: 0.35 }, T + fn()); // hold on the still frame
    }

    // 1 detect: inquiry pulled into the hidden window, unread badge never changes
    seg(0, function () {
      var A = R.s1, row = [270, 214, 19];
      fin(A.tags, 0, 0.08);
      fin(A.unread, 0.1);
      ft(A.pkt, at(row, { autoAlpha: 0 }), at(row, { autoAlpha: 1, duration: 0.3 }), 0.25);
      fin([A.wire, A.eye], 0.45, 0.1);
      var e = hops(A.pkt, [row, [440, 214, 19], [440, 70, 0]], 0.7);
      ft(A.unread, { y: 0 }, { y: -8, duration: 0.15 }, e);
      ft(A.unread, { y: -8 }, { y: 0, duration: 0.3, ease: 'back.out(3)' }, e + 0.15);
      return e + 0.5;
    });

    // 2 match: bars rise through the 50 plane, a person picks the 94 template
    seg(1, function () {
      var A = R.s2;
      fin(A.plane, 0.3);
      A.rise.forEach(function (e, i) { ft(e, { y: e._h }, { y: 0, duration: 0.55 }, 0.35 + i * 0.12); });
      A.up.forEach(function (e, i) { ft(e, { y: e._h }, { y: 0, duration: 0.4 }, 0.95 + i * 0.12); });
      fin(A.tags, 0.6, 0.1);
      A.score.forEach(function (e, i) {
        ft(e, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 1.3 + i * 0.1);
      });
      ft(A.cap, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 16, duration: 0.2 }, 1.3);
      ft(A.cur, { autoAlpha: 0, x: 90, y: 70 }, { autoAlpha: 1, x: 0, y: 0, duration: 0.5 }, 1.6);
      ft(A.cur, { y: 0 }, { y: 5, duration: 0.1 }, 2.15);
      ft(A.cur, { y: 5 }, { y: 0, duration: 0.15 }, 2.25);
      ft(A.cap, { y: 16 }, { y: 0, duration: 0.4, ease: 'back.out(2)' }, 2.25);
      fin(A.pick, 2.4);
      return 2.8;
    });

    // 3 mask: values fall through the gate and come out as placeholders
    seg(2, function () {
      var A = R.s3, e = 0;
      fin(A.fx, 0.2, 0.1);
      fin(A.labels, 0.3, 0.1);
      A.items.forEach(function (it, i) {
        var o = 0.7 + i * 0.18;
        ft(it.g, { y: it.by - it.ay }, { y: GY - it.ay, duration: 0.42, ease: 'power1.in' }, o);
        ft(it.g, { y: GY - it.ay }, { y: 0, duration: 0.42, ease: 'power1.out' }, o + 0.42);
        if (it.real) { fout(it.real, o + 0.36, 0, 0.12); fin(it.mask, o + 0.36, 0, 0.12); }
        e = o + 0.84;
      });
      return e + 0.2;
    });

    // 4 refine: IPC -> main -> Worker -> server AI and back, then the keepFrom check
    seg(3, function () {
      var A = R.s4, ipc = [135, 425, 12], cloud = [150, 0, 92];
      fin(A.tags, 0.2, 0.08);
      fin(A.wires, 0.3, 0.15);
      ft(A.out, at(ipc, { autoAlpha: 0 }), at(ipc, { autoAlpha: 1, duration: 0.3 }), 0.5);
      var e = hops(A.out, [ipc, [135, 295, 12], [135, 165, 12], cloud], 0.8);
      fout(A.out, e, 0, 0.2);
      ft(A.back, at(cloud, { autoAlpha: 0 }), at(cloud, { autoAlpha: 1, duration: 0.2 }), e + 0.15);
      e = hops(A.back, [cloud, [135, 165, 12], [135, 295, 12], [330, 350, 10]], e + 0.4);
      A.rows.forEach(function (r, i) {
        var o = e + 0.1 + i * 0.3;
        fout(r.p, o, 0, 0.2);
        fin([r.d, r.k], o, 0, 0.25);
      });
      fin(A.pass, e + 1.1);
      fin(A.fb, e + 1.3);
      return e + 1.7;
    });

    // 5 copy: placeholders back to real values, copy pressed, a person sends
    seg(4, function () {
      var A = R.s5;
      fin(A.tags, 0.2, 0.1);
      A.rows.forEach(function (r, i) {
        var o = 0.5 + i * 0.22;
        fout(r.m, o, 0, 0.25);
        fin(r.r, o, 0, 0.25);
      });
      fin([A.copyG, A.btn], 1.3, 0.05);
      ft(A.cur, { autoAlpha: 0, x: 110, y: 70 }, { autoAlpha: 1, x: 0, y: 0, duration: 0.5 }, 1.5);
      ft(A.btn, { y: 0 }, { y: 4, duration: 0.08 }, 2.05);
      ft(A.btn, { y: 4 }, { y: 0, duration: 0.15 }, 2.13);
      fout(A.copy, 2.12, 0, 0.15);
      fin(A.copied, 2.12, 0, 0.15);
      fout(A.cur, 2.4, 0, 0.3);
      fin(A.chain, 2.4, 0.15);
      fin(A.nosend, 3.1);
      return 3.5;
    });

    K.scene({ root: '#flow', timeline: tl });
  });
})();
