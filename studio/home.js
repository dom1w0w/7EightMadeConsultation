/* 7EightMade Studio home: scroll choreography.
   position: sticky does the pinning; one requestAnimationFrame per scroll frame writes
   transform/opacity only. Reduced motion (or no JS) leaves a static, readable page. */
(function () {
  "use strict";
  var root = document.documentElement;
  var mq = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
  var easeIO = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var secs = {}; $$("[data-pin]").forEach(function (el) { secs[el.dataset.pin] = { el: el, top: 0, len: 1 }; });
  var fx = {}; $$("[data-fx]").forEach(function (el) { fx[el.dataset.fx] = el; });
  var frags = $$(".frag").map(function (el) {
    if (el.dataset.blur) el.classList.add("is-blur");
    return { el: el, x: +el.dataset.x, y: +el.dataset.y, s: +el.dataset.s, r: +el.dataset.r, w: +el.dataset.w, front: !!el.closest(".frags--front") };
  });
  var tiles = $$(".tile");
  var lines = $$(".scrub__text .ln");
  var rFalls = $("#rFalls"), rRises = $("#rRises"), rBar = $("#rBar"), readout = $(".readout"), indexEl = $("#apps");

  var vw = 0, vh = 0, docH = 0, motion = false, ticking = false, last = {};

  function measure() {
    vw = window.innerWidth; vh = window.innerHeight;
    docH = document.documentElement.scrollHeight;
    for (var k in secs) {
      var s = secs[k], r = s.el.getBoundingClientRect();
      s.top = r.top + window.scrollY;
      s.len = Math.max(1, s.el.offsetHeight - s.el.querySelector(".pin").offsetHeight);
    }
    frags.forEach(function (f) { var w = Math.max(f.front ? 54 : 40, f.w / 100 * Math.min(vw, 1500)); f.el.style.width = w + "px"; f.px = w; });
  }
  function prog(k, y) { var s = secs[k]; return s ? clamp((y - s.top) / s.len, 0, 1) : 0; }
  function set(el, t, o) {
    if (!el) return;
    el.style.transform = t;
    if (o !== undefined) el.style.opacity = o;
  }

  function hero(p) {
    // fragments rise; back layer slower and hidden by the figure, front layer faster and over it
    frags.forEach(function (f) {
      var y = (f.y - p * f.s * 100) / 100 * vh;
      var x = f.x / 100 * vw - f.px / 2;
      set(f.el, "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0) rotate(" + (f.r * (0.3 + p)).toFixed(1) + "deg)");
    });
    set(fx.bigFall, "translate3d(-50%," + (-50 - p * 14) + "%,0) scale(" + (1 + p * .06).toFixed(4) + ")", (1 - seg(p, .7, 1) * .65).toFixed(3));
    set(fx.serif, "translate3d(-50%," + (-50 - ease(seg(p, 0, .6)) * 30).toFixed(2) + "%,0)");
    set(fx.fig, "translate3d(-50%," + ((1 - ease(seg(p, 0, .6))) * 6).toFixed(2) + "%,0)");
    set(fx.story, "translate3d(0," + ((1 - ease(seg(p, .45, .75))) * 30).toFixed(1) + "px,0)", ease(seg(p, .45, .75)).toFixed(3));
    set(fx.cue, "translate3d(-50%,0,0)", (1 - seg(p, 0, .12)).toFixed(3));
  }

  // tile entry offsets (in tile sizes) and drift directions/speeds
  var TILE = {
    top:    { lx: 0,     ly: -.75, ex: -1.6, ey: -1.4, er: -70, dx: -.25, dy: -1.0, sp: 1.0 },
    left:   { lx: -.75,  ly: 0,    ex: -2.2, ey: .8,   er: 50,  dx: -1.0, dy: -.35, sp: 1.25 },
    right:  { lx: .75,   ly: 0,    ex: 2.0,  ey: -1.1, er: -40, dx: 1.0,  dy: -.6,  sp: .85 },
    bottom: { lx: 0,     ly: .75,  ex: 1.3,  ey: 1.9,  er: 80,  dx: .3,   dy: .9,   sp: 1.12 }
  };
  function works(p) {
    var a = easeIO(seg(p, .02, .38));   // lock in
    var d = seg(p, .6, 1);              // drift apart
    tiles.forEach(function (t, i) {
      var c = TILE[t.dataset.pos];
      var x = c.lx + (1 - a) * c.ex + d * d * c.dx * c.sp * 1.1;
      var y = c.ly + (1 - a) * c.ey + d * d * c.dy * c.sp * 1.1 - d * (0.4 + i * .18);
      var r = 45 + (1 - a) * c.er + d * (i % 2 ? 8 : -8) * c.sp;
      var o = (0.15 + a * .85) * (1 - seg(p, .9, 1) * .6);
      set(t, "translate3d(" + (-50 + x * 100).toFixed(2) + "%," + (-50 + y * 100).toFixed(2) + "%,0) rotate(" + r.toFixed(2) + "deg)", o.toFixed(3));
    });
  }
  function scrub(p) {
    var n = lines.length, q = seg(p, .05, .85) * n;
    lines.forEach(function (ln, i) { ln.style.opacity = (0.18 + 0.82 * clamp(q - i, 0, 1)).toFixed(3); });
  }
  function finale(p) {
    var a = ease(seg(p, 0, .7));
    set(fx.bigRise, "translate3d(-50%," + (-50 + (1 - a) * 90).toFixed(2) + "%,0)", (0.1 + a * .9).toFixed(3));
    set(fx.glow, "translate3d(-50%," + ((1 - a) * 18).toFixed(2) + "%,0) scale(" + (0.55 + a * .5).toFixed(3) + ")", (0.25 + a * .75).toFixed(3));
    set(fx.finRow, "translate3d(-50%," + ((1 - ease(seg(p, .55, .85))) * 24).toFixed(1) + "px,0)", ease(seg(p, .55, .85)).toFixed(3));
  }
  function chrome(y) {
    var total = Math.max(1, (indexEl ? indexEl.offsetTop - vh * .4 : docH - vh));
    var g = clamp(y / total, 0, 1);
    var falls = Math.round(clamp(g / .5, 0, 1) * 7), rises = Math.round(clamp((g - .5) / .5, 0, 1) * 8);
    if (last.f !== falls) { rFalls.textContent = falls; last.f = falls; }
    if (last.r !== rises) { rRises.textContent = rises; last.r = rises; }
    rBar.style.transform = (vw <= 760 ? "scaleX(" : "scaleY(") + g.toFixed(4) + ")";
    readout.classList.toggle("is-off", indexEl && indexEl.getBoundingClientRect().top < vh * .6);
  }

  function frame() {
    ticking = false;
    var y = window.scrollY;
    // only work on sections near the viewport
    for (var k in secs) {
      var s = secs[k];
      if (y + vh < s.top - vh * .2 || y > s.top + s.len + vh * 1.2) continue;
      var p = prog(k, y);
      if (k === "hero") hero(p); else if (k === "works") works(p); else if (k === "scrub") scrub(p); else if (k === "finale") finale(p);
    }
    chrome(y);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  function staticState() {
    // reduced motion: a readable still of each scene
    frags.forEach(function (f) { f.el.style.transform = ""; f.el.style.opacity = ""; });
    measure();
    hero(.3); works(.5); scrub(1); finale(1);
    // keep the still readable: front-layer fragments would sit over the words
    frags.forEach(function (f) { if (f.front) f.el.style.opacity = 0; });
    fx.story.style.opacity = 1; fx.story.style.transform = "none";
    fx.cue.style.opacity = 0;
  }
  function clearInline() {
    $$("[data-fx], .frag, .tile, .ln").forEach(function (el) { el.style.transform = ""; el.style.opacity = ""; });
  }

  function enable() {
    motion = !mq.matches;
    root.classList.toggle("motion", motion);
    clearInline();
    if (motion) {
      measure(); frame();
      window.addEventListener("scroll", onScroll, { passive: true });
    } else {
      window.removeEventListener("scroll", onScroll);
      staticState();
    }
  }
  var rT = 0;
  window.addEventListener("resize", function () { clearTimeout(rT); rT = setTimeout(function () { measure(); if (motion) frame(); else staticState(); }, 120); });
  if (mq.addEventListener) mq.addEventListener("change", enable);
  window.addEventListener("load", function () { measure(); if (motion) frame(); });
  enable();

  // Contact form: opens a pre-written email (same behavior as the previous Studio page)
  var form = $("#letter");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = new FormData(form);
    var who = String(data.get("name") || "").trim() || "A visitor";
    var about = String(data.get("about") || "Studio");
    var note = String(data.get("note") || "").trim();
    var body = who + " wrote from 7EightMade Studio about " + about + ".\n\n" + note + "\n";
    window.location.href = "mailto:nuguidd@icloud.com?cc=nuguiddom@gmail.com&subject=" + encodeURIComponent("Studio: " + about) + "&body=" + encodeURIComponent(body);
  });
})();
