/* hero: three floating plates (화면 / 데스크톱 메인 / 서버), looping inquiry -> masked packet -> answer card */
(function () {
  'use strict';

  var R = {};
  var PORT = 385;                       // packet shaft runs through ports near the front corner
  var SURF = { bot: 22, mid: 164, top: 314 };
  var LBL = 18 + 28.8 + 24;             // packet chip height above ground point (lift + cube + gap)

  // one packet, painted in its own layer above all three tiers so it never vanishes under a plate
  function mkPkt(K, parent, texts) {
    var p = K.packet(parent, {
      text: texts[0], at: [PORT, PORT, SURF.top], labelGap: 24, cls: 'hero-pkt iso-transient'
    });
    p.chips = [p.label];
    for (var i = 1; i < texts.length; i++) {
      p.chips.push(K.chip(p.body, { at: [0, 0, LBL], text: texts[i], cls: 'iso-packet-label' }));
    }
    return p;
  }

  // dashed port square + an accent overlay that lights up (opacity only) while the packet crosses it
  function port(K, parent, z) {
    K.plane(parent, { x: 363, y: 363, z: z, w: 44, d: 44, cls: 'is-dashed hero-port' });
    return K.plane(parent, { x: 363, y: 363, z: z, w: 44, d: 44, cls: 'hero-port-glow iso-transient' });
  }

  function glyph(K, parent, id, at, size) {
    var p = K.iso(at);
    return K.el('use', {
      href: '#' + id, x: p.x - size / 2, y: p.y - size / 2, width: size, height: size,
      cls: 'iso-glyph hero-glyph', 'aria-hidden': 'true'
    }, parent);
  }

  function heroTag(K, parent, o) {
    var full = o.name + '\n' + o.desc;
    var t = K.tag(parent, { at: o.at, dx: o.dx, dy: o.dy, anchor: 'middle', text: full, cls: 'hero-tag' });
    t._heroName = o.name;
    t._heroFull = full;
    return t;
  }

  IsoKit.build(function (K) {
    var root = K.stage('#hero-svg', { origin: [500, 360], cls: 'hero-svg-root' });
    if (!root) return;

    var g0 = K.el('g', { cls: 'hero-tier hero-tier-bot' }, root);
    var g1 = K.el('g', { cls: 'hero-tier hero-tier-mid' }, root);
    var g2 = K.el('g', { cls: 'hero-tier hero-tier-top' }, root);
    var pl = K.el('g', { cls: 'hero-pkt-layer' }, root);
    var fx = K.el('g', { cls: 'hero-fx' }, root);
    R.tiers = [g0, g1, g2];
    R.pl = pl;
    R.glow = [];

    /* ---------- bottom plate: 서버 ---------- */
    K.slab(g0, { x: 0, y: 0, z: 0, w: 420, d: 420, h: 22, hatch: true, cls: 'hero-plate hero-plate-bot' });
    R.glow[0] = port(K, g0, SURF.bot);
    R.ring = K.plane(g0, { x: 226, y: 331, z: SURF.bot, w: 108, d: 88, cls: 'hero-ring iso-transient' });
    K.wire(g0, { points: [[363, 380, SURF.bot], [322, 380, SURF.bot]], cls: 'is-dashed' });
    K.slab(g0, { x: 340, y: 60, z: SURF.bot, w: 60, d: 60, h: 30, cls: 'hero-blk hero-blk-kv' });
    K.slab(g0, { x: 340, y: 170, z: SURF.bot, w: 60, d: 60, h: 30, cls: 'hero-blk hero-blk-d1' });
    R.ai = K.slab(g0, { x: 240, y: 345, z: SURF.bot, w: 80, d: 60, h: 34, cls: 'hero-blk hero-blk-ai' });
    K.chip(g0, { at: [370, 90, 78], text: 'KV', cls: 'hero-blk-chip' });
    K.chip(g0, { at: [370, 200, 78], text: 'D1', cls: 'hero-blk-chip' });
    K.chip(g0, { at: [280, 375, 82], text: 'AI', cls: 'hero-blk-chip' });
    K.wire(g0, { points: [[378, 392, 150], [378, 392, 28]], arrow: true });
    K.wire(g0, { points: [[392, 378, 28], [392, 378, 118]], arrow: true });

    /* ---------- middle plate: 데스크톱 메인 ---------- */
    K.slab(g1, { x: 0, y: 0, z: 150, w: 420, d: 420, h: 14, cls: 'hero-plate hero-plate-mid' });
    R.glow[1] = port(K, g1, SURF.mid);
    K.slab(g1, { x: 340, y: 80, z: SURF.mid, w: 60, d: 60, h: 30, cls: 'hero-blk hero-blk-watch' });
    K.slab(g1, { x: 150, y: 340, z: SURF.mid, w: 70, d: 60, h: 30, cls: 'hero-blk hero-blk-vault' });
    K.slab(g1, { x: 340, y: 210, z: SURF.mid, w: 60, d: 70, h: 30, cls: 'hero-blk hero-blk-ocr' });
    glyph(K, g1, 'iso-i-eye', [370, 110, 224], 34);
    glyph(K, g1, 'iso-i-key', [185, 370, 222], 32);
    K.chip(g1, { at: [370, 245, 222], text: 'OCR', cls: 'hero-blk-chip' });
    K.wire(g1, { points: [[378, 392, 300], [378, 392, 168]], arrow: true });
    K.wire(g1, { points: [[392, 378, 168], [392, 378, 268]], arrow: true });

    /* ---------- top plate: 화면 ---------- */
    K.slab(g2, { x: 0, y: 0, z: 300, w: 420, d: 420, h: 14, cls: 'hero-plate hero-plate-top is-active' });
    K.plane(g2, { x: 220, y: 40, z: SURF.top, w: 170, d: 210, cls: 'is-dashed hero-panel' });
    R.rows = [];
    for (var i = 0; i < 4; i++) {
      R.rows.push(K.plane(g2, { x: 30, y: 200 + i * 46, z: SURF.top, w: 150, d: 30, cls: 'hero-ui-row' }));
    }
    R.row = R.rows[0];
    R.glow[2] = port(K, g2, SURF.top);
    R.cardShadow = K.plane(g2, { x: 236, y: 72, z: SURF.top, w: 140, d: 156, cls: 'hero-card-shadow' });

    R.card = K.el('g', { cls: 'hero-card' }, g2);
    K.slab(R.card, { x: 236, y: 72, z: 376, w: 140, d: 156, h: 8, cls: 'is-success hero-card-slab' });
    K.chip(R.card, { at: [306, 150, 384], text: '답변 초안', cls: 'is-success' });

    /* ---------- the packet (single copy, top-most layer, follows the drift of the plate it is on) ---------- */
    R.pk = mkPkt(K, pl, ['새 문의', '가린 문의', '답변 초안']);

    /* ---------- tags (inside each tier so they drift with their plate) ---------- */
    R.tags = [
      heroTag(K, g2, { at: [400, 40, 314], dx: -11.8, dy: -194, name: '화면', desc: 'React 19 · 웹·앱 공용' }),
      heroTag(K, g1, { at: [140, 420, 157], dx: -47.5, dy: 277, name: '데스크톱 메인', desc: 'Electron · 감시·OCR' }),
      heroTag(K, g0, { at: [420, 260, 11], dx: 161.4, dy: 81, name: '서버', desc: 'Worker · AI 중계' })
    ];
    // keep bottom/mid tags above the blocks and chips of their own tier
    g0.appendChild(R.tags[2]);
    g1.appendChild(R.tags[1]);

    /* narrow screens: names only in tags, descriptions live in .hero-legend */
    var mqS = window.matchMedia ? window.matchMedia('(max-width: 599.98px)') : null;
    function applyTagText() {
      var small = !!(mqS && mqS.matches);
      R.tags.forEach(function (t) { t.setText(small ? t._heroName : t._heroFull); });
    }
    applyTagText();
    if (mqS) {
      if (mqS.addEventListener) mqS.addEventListener('change', applyTagText);
      else if (mqS.addListener) mqS.addListener(applyTagText);
    }
  });

  IsoKit.ready(function (gsap, ST, K) {
    if (!R.pk) return;
    var pk = R.pk, ch = pk.chips, sh = pk.shadow, gl = R.glow, pl = R.pl;
    var P = {
      top: K.iso(PORT, PORT, SURF.top),
      mid: K.iso(PORT, PORT, SURF.mid),
      bot: K.iso(PORT, PORT, SURF.bot)
    };
    function at(p) { return { x: p.x, y: p.y }; }
    var Z0 = K.iso(PORT, PORT, 0).y;     // screen y of the shaft at z = 0 (shaft is vertical: x stays 0)
    var B0 = { x: -250, y: -210 };
    var shA = parseFloat(gsap.getProperty(sh, 'opacity'));
    if (!(shA > 0)) shA = 1;

    // packet layer drift = drift of the plate(s) the packet is between, interpolated by height
    function tierY(i) { return parseFloat(gsap.getProperty(R.tiers[i], 'y')) || 0; }
    function follow() {
      var z = Z0 - (parseFloat(gsap.getProperty(pk, 'y')) || 0);
      var lo = 0, hi = 1, f;
      if (z >= SURF.mid) { lo = 1; hi = 2; f = (z - SURF.mid) / (SURF.top - SURF.mid); }
      else f = (z - SURF.bot) / (SURF.mid - SURF.bot);
      f = Math.max(0, Math.min(1, f));
      var a = tierY(lo);
      gsap.set(pl, { y: a + (tierY(hi) - a) * f });
    }

    gsap.set([pk, R.ring].concat(gl), { autoAlpha: 0 });
    gsap.set([ch[1], ch[2]], { autoAlpha: 0 });
    gsap.set(pk, at(P.top));
    follow();

    var tl = gsap.timeline({
      paused: true, repeat: -1, onUpdate: follow,
      defaults: { duration: 0.3, ease: 'power2.out' }
    });

    // every loop starts from a clean state; repeat wrap-around does not reliably revert attr sets
    tl.set(R.ai, { attr: { 'data-state': '' } }, 0)
      .set(R.row, { attr: { 'data-state': '' } }, 0);

    // 0: previous answer card leaves, stack drifts slowly
    tl.to([R.card, R.cardShadow], { autoAlpha: 0, duration: 0.35 }, 0)
      .to(R.card, { y: 30, duration: 0.35, ease: 'power2.in' }, 0)
      .to(R.tiers, { y: function (i) { return [-3, -5, -7][i]; }, duration: 3.1, ease: 'sine.inOut' }, 0)
      .to(R.tiers, { y: 0, duration: 3.1, ease: 'sine.inOut' }, 3.1);

    // 1: the inquiry arrives as the packet itself and lands on the 화면 plate
    tl.set(sh, { opacity: 0 }, 0)
      .set(pk, { x: P.top.x + B0.x, y: P.top.y + B0.y, autoAlpha: 0 }, 0.3)
      .to(pk, { autoAlpha: 1, duration: 0.2 }, 0.3)
      .to(pk, { x: P.top.x, y: P.top.y, duration: 0.95, ease: 'power2.inOut' }, 0.3)
      .to(sh, { opacity: shA, duration: 0.2 }, 1.1)
      .set(R.row, { attr: { 'data-state': 'new' } }, 1.0)
      .fromTo(pk.body, { y: -16 }, { y: 0, duration: 0.3, ease: 'power2.in', immediateRender: false }, 1.25);

    // 2: masked inside the renderer before anything leaves the screen layer
    tl.set(pk, { attr: { 'data-state': 'masked' } }, 1.8)
      .to(ch[0], { autoAlpha: 0, duration: 0.25 }, 1.8)
      .to(ch[1], { autoAlpha: 1, duration: 0.25 }, 1.8);

    // 3: drop through the 화면 port onto 데스크톱 메인 (ports light up as the packet crosses them)
    tl.to(gl[2], { autoAlpha: 1, duration: 0.15 }, 2.15)
      .to(sh, { opacity: 0, duration: 0.15 }, 2.25)
      .to(pk, { x: P.mid.x, y: P.mid.y, duration: 0.6, ease: 'power1.in' }, 2.25)
      .to(gl[2], { autoAlpha: 0, duration: 0.3 }, 2.6)
      .to(gl[1], { autoAlpha: 1, duration: 0.15 }, 2.7)
      .to(sh, { opacity: shA, duration: 0.1 }, 2.8);

    // 4: drop through the main port onto 서버
    tl.to(sh, { opacity: 0, duration: 0.1 }, 3.0)
      .to(pk, { x: P.bot.x, y: P.bot.y, duration: 0.55, ease: 'power1.in' }, 3.0)
      .to(gl[1], { autoAlpha: 0, duration: 0.3 }, 3.2)
      .to(gl[0], { autoAlpha: 1, duration: 0.15 }, 3.4)
      .to(sh, { opacity: shA, duration: 0.1 }, 3.5)
      .to(gl[0], { autoAlpha: 0, duration: 0.3 }, 3.7);

    // 5: AI block pulse, packet now carries the (still masked) draft
    tl.set(R.ai, { attr: { 'data-state': 'accent' } }, 3.6)
      .fromTo(R.ring, { autoAlpha: 1, scale: 0.7, transformOrigin: '50% 50%' },
        { autoAlpha: 0, scale: 1.3, duration: 0.7, ease: 'power1.out', immediateRender: false }, 3.6)
      .to(ch[1], { autoAlpha: 0 }, 3.95)
      .to(ch[2], { autoAlpha: 1 }, 3.95)
      .set(R.ai, { attr: { 'data-state': '' } }, 4.3);

    // 6: rise back up through both ports
    tl.to(gl[0], { autoAlpha: 1, duration: 0.15 }, 4.2)
      .to(sh, { opacity: 0, duration: 0.1 }, 4.3)
      .to(pk, { x: P.mid.x, y: P.mid.y, duration: 0.5, ease: 'sine.inOut' }, 4.3)
      .to(gl[0], { autoAlpha: 0, duration: 0.3 }, 4.5)
      .to(gl[1], { autoAlpha: 1, duration: 0.15 }, 4.6)
      .to(pk, { x: P.top.x, y: P.top.y, duration: 0.5, ease: 'sine.inOut' }, 4.8)
      .to(gl[1], { autoAlpha: 0, duration: 0.3 }, 5.0)
      .to(gl[2], { autoAlpha: 1, duration: 0.15 }, 5.1)
      .to(sh, { opacity: shA, duration: 0.1 }, 5.2)
      .to(gl[2], { autoAlpha: 0, duration: 0.3 }, 5.45);

    // 7: restored on the PC (mask off), answer card pops up
    tl.set(pk, { attr: { 'data-state': '' } }, 5.55)
      .to(pk, { autoAlpha: 0, duration: 0.25 }, 5.75)
      .set(R.row, { attr: { 'data-state': '' } }, 5.75)
      .fromTo(R.card, { y: 30 }, { y: 0, duration: 0.45, ease: 'back.out(1.7)', immediateRender: false }, 5.75)
      .to([R.card, R.cardShadow], { autoAlpha: 1, duration: 0.3 }, 5.75);

    // reset hidden packet labels so every loop starts identically
    tl.set(ch[0], { autoAlpha: 1 }, 6.05)
      .set([ch[1], ch[2]], { autoAlpha: 0 }, 6.05)
      .addLabel('final', 6.2)
      .to({}, { duration: 1.0 }, 6.2);

    K.scene({ root: '#top', timeline: tl, mode: 'loop' });
  });
})();
