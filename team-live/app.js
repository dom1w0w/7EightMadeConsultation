/* Team · Live — private, passphrase-locked agent team board.
 * Plain JS + Canvas 2D. No build step, no network calls except ./data.enc.json.
 * Decrypted data lives only in memory (never written to storage).
 * Crypto + lock code is shared verbatim with /dom-times-live/ (same envelope, same passphrase pipeline).
 * Everything about the team (agents, lanes, links, log, flags) comes from the decrypted JSON. */
(() => {
'use strict';

const $ = (id) => document.getElementById(id);
const MIN_ITERATIONS = 100000;
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* =================================================================== crypto */
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function decryptEdition(blob, passphrase) {
  if (!blob || blob.v !== 1 || blob.kdf !== 'PBKDF2' || blob.cipher !== 'AES-GCM') throw new Error('format');
  const iterations = Number(blob.iterations);
  if (!(iterations >= MIN_ITERATIONS)) throw new Error('format');
  const subtle = window.crypto && window.crypto.subtle;
  if (!subtle) throw new Error('nosubtle');
  const base = await subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  const key = await subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromB64(blob.salt), iterations },
    base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const pt = await subtle.decrypt({ name: 'AES-GCM', iv: fromB64(blob.iv) }, key, fromB64(blob.ciphertext));
  return JSON.parse(new TextDecoder().decode(pt));
}

/* ===================================================================== lock */
let encBlob = null;
const lockMsg = $('lock-msg');
const blobReady = fetch('data.enc.json', { cache: 'no-store', credentials: 'same-origin' })
  .then((r) => (r.ok ? r.json() : Promise.reject(new Error('http ' + r.status))))
  .then((j) => { encBlob = j; })
  .catch(() => { setLockMsg("couldn't load the team board (data.enc.json). Serve this folder over http(s).", true); });

function setLockMsg(text, err) { lockMsg.textContent = text; lockMsg.classList.toggle('err', !!err); }

$('lock-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const input = $('pass');
  const btn = $('unlock-btn');
  const pass = input.value;
  if (!pass) return;
  btn.disabled = true;
  setLockMsg('deriving key…', false);
  await blobReady;
  if (!encBlob) { btn.disabled = false; return; }
  try {
    const data = await decryptEdition(encBlob, pass);
    input.value = '';
    setLockMsg('', false);
    startDashboard(data);
  } catch (e) {
    btn.disabled = false;
    if (e && e.message === 'nosubtle') {
      setLockMsg('This browser blocks decryption here. Open the page over https.', true);
    } else if (e && e.message === 'format') {
      setLockMsg("The board file looks damaged. Re-run encrypt.mjs.", true);
    } else {
      setLockMsg("That passphrase didn't open the team board. Try again.", true);
      const card = document.querySelector('.lock-card');
      card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
      input.select();
    }
  }
});

/* ==================================================================== model */
const HEX = /^#[0-9a-f]{6}$/i;
const FALLBACK = ['#4D7CF6', '#EE7A3C', '#6FD3C1', '#D2452F', '#E9B949', '#B48CF2', '#E86A92', '#A69C90'];
const COBALT = '#4D7CF6', RED = '#D2452F', TEAL = '#6FD3C1', ORANGE = '#EE7A3C', INK = '#F2ECE2', MUTE = '#A69C90', BG = '#0E0D0C';
const str = (x) => (typeof x === 'string' ? x : x == null ? '' : String(x));
const arr = (x) => (Array.isArray(x) ? x : []);

function buildModel(d) {
  const seen = new Set();
  const agents = [];
  arr(d.agents).forEach((a) => {
    if (!a || typeof a !== 'object') return;
    const id = str(a.id).trim(); if (!id || seen.has(id)) return; seen.add(id);
    agents.push({ id, name: str(a.name) || id, role: str(a.role), lane: str(a.lane), boundary: str(a.boundary), task: str(a.task),
      accent: HEX.test(str(a.accent)) ? str(a.accent) : FALLBACK[agents.length % FALLBACK.length],
      center: a.center === true, x: 0, y: 0, r: 40, pts: [], pulse: -9, delivered: 0 });
  });
  const centers = agents.filter((a) => a.center);
  centers.slice(1).forEach((a) => { a.center = false; });
  const byId = new Map(agents.map((a) => [a.id, a]));
  const links = [];
  arr(d.links).forEach((l) => {
    if (!l) return;
    const A = byId.get(str(l.from)), B = byId.get(str(l.to));
    if (!A || !B || A === B) return;
    links.push({ A, B, label: str(l.label), pk: [], cx: 0, cy: 0 });
  });
  const labelCount = new Map();
  links.forEach((l) => labelCount.set(l.label, (labelCount.get(l.label) || 0) + 1));
  links.forEach((l) => { l.unique = !!l.label && labelCount.get(l.label) === 1; });
  const who = (x) => { const k = str(x); return byId.get(k) || { id: k, name: k, accent: MUTE, ghost: true }; };
  const log = arr(d.log).filter((e) => e && str(e.text)).map((e) => ({ time: str(e.time), t: Date.parse(str(e.time)), agent: who(e.agent), text: str(e.text) }));
  log.sort((a, b) => (isNaN(b.t) ? -1 : isNaN(a.t) ? 1 : b.t - a.t));
  const flags = arr(d.flags).filter((f) => f && str(f.text)).map((f) => ({ text: str(f.text), owner: f.owner == null || f.owner === '' ? null : who(f.owner) }));
  return { title: str(d.title) || 'Team Live', updated: str(d.updated), agents, byId, links, log, flags };
}

/* ================================================================== helpers */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
const pad2 = (n) => String(n).padStart(2, '0');
function fmtTime(s, long) {
  const d = new Date(str(s)); if (isNaN(d)) return str(s);
  const o = long ? { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' } : { hour: 'numeric', minute: '2-digit' };
  try { return new Intl.DateTimeFormat('en-US', Object.assign({ timeZone: 'America/Chicago' }, o)).format(d) + (long ? ' CT' : ''); }
  catch (e) { return long ? d.toLocaleString() : d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
}
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function agentChip(a, onClick) {
  const c = el(a.ghost || !onClick ? 'span' : 'button', 'achip', a.name);
  c.style.setProperty('--c', a.accent);
  if (c.tagName === 'BUTTON') { c.type = 'button'; c.addEventListener('click', (e) => { e.stopPropagation(); onClick(a); }); }
  return c;
}

/* ==================================================================== state */
let M = null;
const st = { t: 0, paused: false, running: false, hover: null, pinned: null, delivered: 0, frame: 0 };
const stage = $('stage'), cv = $('cv'), ctx = cv.getContext('2d'), nodesEl = $('nodes');
let W = 0, H = 0, DPR = 1, small = false, staticLayer = null, twinkles = [];
const active = () => st.pinned || st.hover;

/* =================================================================== layout */
function buildNodes() {
  nodesEl.textContent = '';
  M.agents.forEach((a) => {
    const b = el('button', 'node' + (a.center ? ' center' : ''));
    b.type = 'button'; b.setAttribute('role', 'listitem');
    b.setAttribute('aria-label', `${a.name}${a.role && a.role !== a.name ? ', ' + a.role : ''}. Now: ${a.task || 'no task listed'}`);
    b.style.setProperty('--c', a.accent);
    const dot = el('span', 'node-dot');
    const lab = el('span', 'node-label');
    lab.appendChild(el('span', 'node-name', a.name));
    if (a.role && a.role !== a.name) lab.appendChild(el('span', 'node-role', a.role));
    if (a.lane) lab.appendChild(el('span', 'node-lane', a.lane));
    if (a.boundary) { const bd = el('span', 'node-bound'); bd.append(el('i', 'bk', 'boundary'), document.createTextNode(' ' + a.boundary)); lab.appendChild(bd); }
    b.append(dot, lab);
    b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') setHover(a); });
    b.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') setHover(null); });
    b.addEventListener('focus', () => { if (!st.pinned) setHover(a); });
    b.addEventListener('blur', () => { if (st.hover === a) setHover(null); });
    b.addEventListener('click', (e) => { e.stopPropagation(); pin(st.pinned === a ? null : a); });
    a.node = b; a.lab = lab;
    nodesEl.appendChild(b);
  });
}

function layout() {
  small = stage.clientWidth < 700;
  W = Math.max(280, stage.clientWidth);
  const center = M.agents.find((a) => a.center) || null;
  const ring = M.agents.filter((a) => a !== center);
  const N = ring.length;
  let LW = 0, LH = 0;
  M.agents.forEach((a) => { LW = Math.max(LW, a.lab.offsetWidth); LH = Math.max(LH, a.lab.offsetHeight); });
  const gap = small ? 13 : 15, top = small ? 66 : 74;
  const start = small || N % 2 ? -Math.PI / 2 : -Math.PI / 2 + Math.PI / Math.max(1, N);
  const angs = ring.map((_, i) => start + (i / Math.max(1, N)) * Math.PI * 2);
  let RW = 0; ring.forEach((a) => { RW = Math.max(RW, a.lab.offsetWidth); });
  const maxCos = Math.max(0.3, ...angs.map((t) => Math.abs(Math.cos(t))));
  const rx = small ? Math.max(60, (W / 2 - RW / 2 - 6) / maxCos) : Math.max(60, Math.min(W / 2 - LW / 2 - 18, W * 0.40));
  let ry, cy;
  if (small) {
    // keep each ring dot clear of the label stacked next to it (center label sits below the center dot)
    ry = N > 4 ? 2 * (LH + gap + 34) : LH + gap + 60;
    cy = top + LH + gap + ry;
    H = Math.round(cy + ry + gap + LH + 18);
    stage.style.height = H + 'px';
  } else {
    stage.style.height = '';
    H = Math.max(300, stage.clientHeight);
    const sTop = Math.max(0, ...angs.map((t) => -Math.sin(t)));
    const sBot = Math.max(0, ...angs.map((t) => Math.sin(t)));
    const A = top + LH + gap, B = H - 10 - gap - LH;
    ry = Math.max(LH * 0.9, (B - A) / Math.max(0.5, sTop + sBot));
    cy = A + ry * sTop;
  }
  const cx = W / 2;
  const rect = stage.getBoundingClientRect();
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(rect.width * DPR); cv.height = Math.round(H * DPR);
  if (center) { center.x = cx; center.y = cy; }
  ring.forEach((a, i) => { a.x = cx + Math.cos(angs[i]) * rx; a.y = cy + Math.sin(angs[i]) * ry; });
  const baseR = small ? 26 : 34;
  M.agents.forEach((a) => {
    a.r = a.center ? baseR * 1.45 : baseR;
    a.above = !a.center && a.y < cy - 2;
    a.node.classList.toggle('above', a.above);
    a.node.style.left = a.x + 'px'; a.node.style.top = a.y + 'px';
  });
  const sr = stage.getBoundingClientRect();
  M.agents.forEach((a) => { const r = a.lab.getBoundingClientRect(); a.box = [r.left - sr.left - 4, r.top - sr.top - 4, r.right - sr.left + 4, r.bottom - sr.top + 4]; });
  // curve control points: bend each link sideways so A→B and B→A don't overlap
  M.links.forEach((l) => {
    const mx = (l.A.x + l.B.x) / 2, my = (l.A.y + l.B.y) / 2, dx = l.B.x - l.A.x, dy = l.B.y - l.A.y;
    const bend = l.A.center || l.B.center ? 0.10 : 0.22;
    l.cx = mx - dy * bend; l.cy = my + dx * bend;
  });
  buildStatic();
}

function buildStatic() {
  staticLayer = document.createElement('canvas');
  staticLayer.width = cv.width; staticLayer.height = cv.height;
  const g = staticLayer.getContext('2d');
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  // warm dust field
  const R0 = rng(3);
  for (let k = 0; k < (small ? 260 : 520); k++) { g.fillStyle = `rgba(242,236,226,${0.03 + R0() * 0.08})`; g.fillRect(R0() * W, R0() * H, 1, 1); }
  g.globalCompositeOperation = 'lighter';
  twinkles = [];
  M.agents.forEach((a, i) => {
    const R = rng(1000 + i * 31);
    const n = Math.round((a.center ? 260 : 170) * (small ? 0.6 : 1));
    const grd = g.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.r * 1.6);
    grd.addColorStop(0, hexA(a.accent, 0.13)); grd.addColorStop(1, hexA(a.accent, 0));
    g.fillStyle = grd; g.beginPath(); g.arc(a.x, a.y, a.r * 1.6, 0, 7); g.fill();
    const pts = [];
    for (let k = 0; k < n; k++) {
      let x, y;
      if (R() < 0.66) { const u = Math.max(1e-6, R()), v = R(), m = Math.sqrt(-2 * Math.log(u)) * 0.42 * a.r; x = a.x + m * Math.cos(2 * Math.PI * v); y = a.y + m * Math.sin(2 * Math.PI * v) * 0.85; }
      else { const a0 = R() * 7, rr = a.r * (0.5 + R() * 0.75), da = (R() - 0.5) * 1.6; x = a.x + Math.cos(a0 + da) * rr + (R() - 0.5) * 6; y = a.y + Math.sin(a0 + da) * rr * 0.8 + (R() - 0.5) * 6; }
      pts.push([x, y]);
    }
    g.lineWidth = 0.5; g.strokeStyle = hexA(a.accent, 0.10); g.beginPath();
    const lim = (a.r * 0.24) ** 2;
    for (let p = 0; p < pts.length; p++) { let c = 0; for (let q = p + 1; q < pts.length && c < 2; q++) { const dx = pts[p][0] - pts[q][0], dy = pts[p][1] - pts[q][1]; if (dx * dx + dy * dy < lim && R() < 0.5) { g.moveTo(pts[p][0], pts[p][1]); g.lineTo(pts[q][0], pts[q][1]); c++; } } }
    g.stroke();
    pts.forEach(([x, y]) => { const sz = R() < 0.08 ? 1.8 : 1; g.fillStyle = hexA(R() < 0.1 ? '#F2ECE2' : a.accent, 0.3 + R() * 0.5); g.fillRect(x, y, sz, sz); });
    a.pts = pts;
    for (let k = 0; k < (small ? 6 : 12); k++) twinkles.push({ a, ang: R() * 7, d: a.r * (0.2 + R() * 0.9), sp: (R() - 0.5) * 0.35, ph: R() * 7, sz: 1 + R() * 1.3 });
  });
}

/* ================================================================ animation */
function seedPackets() {
  M.links.forEach((l, i) => {
    const R = rng(77 + i); const n = l.A.center || l.B.center ? 1 : 2;
    l.pk = []; for (let k = 0; k < n; k++) l.pk.push({ t: reduceMotion ? (k + 0.5) / n : R(), sp: 0.11 + R() * 0.08 });
  });
}
function sim(dt) {
  st.t += dt;
  M.links.forEach((l) => l.pk.forEach((p) => {
    p.t += dt * p.sp;
    if (p.t >= 1) { p.t -= 1; l.B.pulse = st.t; l.B.delivered++; st.delivered++; }
  }));
}
const LABEL_TS = [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74];
const bez = (l, t) => { const q = 1 - t; return [q * q * l.A.x + 2 * q * t * l.cx + t * t * l.B.x, q * q * l.A.y + 2 * q * t * l.cy + t * t * l.B.y]; };

function draw() {
  const T = st.t, act = active();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.88 + 0.12 * Math.sin(T * 0.8);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(staticLayer, 0, 0);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.globalAlpha = 1;

  // links
  for (const l of M.links) {
    const on = act && (l.A === act || l.B === act), dim = act && !on;
    ctx.setLineDash(on ? [] : [2, 4]); ctx.lineWidth = on ? 1.4 : 1;
    const gr = ctx.createLinearGradient(l.A.x, l.A.y, l.B.x, l.B.y);
    gr.addColorStop(0, hexA(l.A.accent, dim ? 0.08 : on ? 0.75 : 0.32)); gr.addColorStop(1, hexA(l.B.accent, dim ? 0.08 : on ? 0.75 : 0.32));
    ctx.strokeStyle = gr; ctx.beginPath(); ctx.moveTo(l.A.x, l.A.y); ctx.quadraticCurveTo(l.cx, l.cy, l.B.x, l.B.y); ctx.stroke();
  }
  ctx.setLineDash([]);

  // packets (handoffs in flight)
  ctx.globalCompositeOperation = 'lighter';
  for (const l of M.links) {
    const dim = act && l.A !== act && l.B !== act;
    for (const p of l.pk) {
      for (let k = 5; k >= 0; k--) {
        const t = p.t - k * 0.014; if (t < 0) continue;
        const [x, y] = bez(l, t), s = k ? 1.6 : 3;
        ctx.fillStyle = hexA(t < 0.5 ? l.A.accent : l.B.accent, (dim ? 0.18 : 0.9) * (1 - k / 6));
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      }
      const [x, y] = bez(l, p.t);
      const gl = ctx.createRadialGradient(x, y, 0, x, y, 9); gl.addColorStop(0, hexA(l.B.accent, dim ? 0.08 : 0.35)); gl.addColorStop(1, hexA(l.B.accent, 0));
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill();
    }
  }

  // twinkles
  for (const p of twinkles) {
    const an = p.ang + T * p.sp, x = p.a.x + Math.cos(an) * p.d, y = p.a.y + Math.sin(an) * p.d * 0.85;
    ctx.fillStyle = hexA(p.a.accent, 0.3 + 0.35 * Math.sin(T * 2 + p.ph)); ctx.fillRect(x, y, p.sz, p.sz);
  }

  // node bodies: little crawlers
  ctx.globalCompositeOperation = 'source-over';
  for (const a of M.agents) {
    const on = act === a, rb = a.center ? 15 : 10, legs = a.center ? 9 : 6;
    const age = T - a.pulse;
    if (age >= 0 && age < 1.1) { ctx.strokeStyle = hexA(a.accent, 0.55 * (1 - age / 1.1)); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(a.x, a.y, rb + 4 + age * 26, 0, 7); ctx.stroke(); }
    ctx.strokeStyle = hexA(a.accent, on ? 1 : 0.85); ctx.lineWidth = on ? 1.8 : 1.3;
    ctx.beginPath(); ctx.ellipse(a.x, a.y, rb, rb * 0.74, T * 0.6 + a.x, 0, 7); ctx.stroke();
    ctx.strokeStyle = hexA(a.accent, 0.5); ctx.lineWidth = 1;
    for (let i = 0; i < legs; i++) {
      const an = (i / legs) * Math.PI * 2 + Math.sin(T * 3 + i) * 0.14, r0 = rb, r1 = rb + 7 + Math.sin(T * 4 + i * 1.7) * 2.5;
      ctx.beginPath(); ctx.moveTo(a.x + Math.cos(an) * r0, a.y + Math.sin(an) * r0 * 0.74);
      ctx.quadraticCurveTo(a.x + Math.cos(an + 0.3) * r1, a.y + Math.sin(an + 0.3) * r1 * 0.74, a.x + Math.cos(an + 0.15) * (r1 + 3), a.y + Math.sin(an + 0.15) * (r1 + 3) * 0.74);
      ctx.stroke();
    }
    ctx.fillStyle = a.accent; const c = a.center ? 6 : 4; ctx.fillRect(a.x - c / 2, a.y - c / 2, c, c);
  }

  // link labels: unique labels always, repeated ones only for the active agent
  ctx.font = '10px ui-monospace, Menlo, Consolas, monospace';
  for (const l of M.links) {
    const on = act && (l.A === act || l.B === act);
    if (!l.label || (!l.unique && !on) || (act && !on)) continue;
    const tw = ctx.measureText(l.label).width, pw = tw + 10, ph = 15;
    let x = 0, y = 0;
    for (const t of LABEL_TS) { // first spot along the curve that doesn't sit under an agent label
      const [x0, y0] = bez(l, t);
      x = clamp(x0 - pw / 2, 2, W - pw - 2); y = clamp(y0 - ph / 2, 2, H - ph - 2);
      if (!M.agents.some((a) => a.box && x < a.box[2] && x + pw > a.box[0] && y < a.box[3] && y + ph > a.box[1])) break;
      if (t === LABEL_TS[LABEL_TS.length - 1]) x = -1; // nowhere clear: skip (the agent card still lists it)
    }
    if (x < 0) continue;
    ctx.fillStyle = 'rgba(14,13,12,0.9)'; ctx.fillRect(x, y, pw, ph);
    ctx.strokeStyle = hexA(l.B.accent, on ? 0.9 : 0.55); ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, pw - 1, ph - 1);
    ctx.fillStyle = on ? INK : '#D9CFC2'; ctx.fillText(l.label, x + 5, y + 11);
  }
}

let last = 0, statT = 0;
function loop(ts) {
  if (st.paused) { st.running = false; return; }
  const now = ts / 1000, dt = last ? Math.min(0.05, now - last) : 0.016; last = now;
  sim(dt); draw(); st.frame++;
  if (now - statT > 0.3) { statT = now; $('st-pk').textContent = String(st.delivered); }
  requestAnimationFrame(loop);
}
function start() { if (st.running || st.paused) return; st.running = true; last = 0; requestAnimationFrame(loop); }
let pendingDraw = false;
function requestDraw() { if (st.running || pendingDraw) return; pendingDraw = true; requestAnimationFrame(() => { pendingDraw = false; draw(); }); }
function setPaused(p) {
  st.paused = p;
  const b = $('btn-pause'); b.setAttribute('aria-pressed', String(p)); b.textContent = p ? '▶ play' : '❚❚ pause';
  if (p) requestDraw(); else start();
}

/* ============================================================ detail card */
function setHover(a) { st.hover = a; refreshActive(); if (!st.pinned) { if (a) renderCard(a, false); else closeCard(); } }
function pin(a) { st.pinned = a; refreshActive(); if (a) renderCard(a, true); else if (st.hover) renderCard(st.hover, false); else closeCard(); }
function refreshActive() {
  const act = active();
  M.agents.forEach((a) => { a.node.classList.toggle('on', a === act); a.node.classList.toggle('dim', !!act && a !== act && !linked(a, act)); });
  $('hud-name').textContent = act ? act.name.toUpperCase() : 'THE TEAM';
  $('hud-q').textContent = act ? (act.task ? 'now · ' + act.task : 'no current task listed') : 'tap or hover an agent for its current task';
  requestDraw();
}
const linked = (a, b) => M.links.some((l) => (l.A === a && l.B === b) || (l.A === b && l.B === a));
function closeCard() { $('drawer').hidden = true; }

function renderCard(a, pinned) {
  const dr = $('drawer'); dr.hidden = false; dr.classList.toggle('pinned', pinned); dr.style.setProperty('--c', a.accent);
  $('dr-title').textContent = a.name;
  $('dr-sub').textContent = a.role && a.role !== a.name ? a.role : (a.center ? 'center of the swarm' : '');
  $('dr-close').hidden = !pinned;
  const box = $('dr-cards'); box.textContent = ''; box.scrollTop = 0;
  const sec = (k, v, cls) => { if (!v) return; const s = el('section', 'csec' + (cls ? ' ' + cls : '')); s.append(el('div', 'ck', k), el('div', 'cv', v)); box.appendChild(s); };
  sec('now', a.task || 'No current task listed.', 'now');
  sec('lane', a.lane);
  sec('boundary', a.boundary, 'bound');
  const outs = M.links.filter((l) => l.A === a), ins = M.links.filter((l) => l.B === a);
  if (outs.length || ins.length) {
    const s = el('section', 'csec'); s.appendChild(el('div', 'ck', 'handoffs'));
    const ul = el('ul', 'hand');
    outs.forEach((l) => { const li = el('li'); li.append(el('span', 'dir', '→'), agentChip(l.B, (b) => pin(b)), el('span', 'hl', l.label)); ul.appendChild(li); });
    ins.forEach((l) => { const li = el('li'); li.append(el('span', 'dir', '←'), agentChip(l.A, (b) => pin(b)), el('span', 'hl', l.label)); ul.appendChild(li); });
    s.appendChild(ul); box.appendChild(s);
  }
  const fl = M.flags.filter((f) => f.owner === a);
  if (fl.length) { const s = el('section', 'csec flagsec'); s.appendChild(el('div', 'ck', 'waiting on Dom')); fl.forEach((f) => s.appendChild(el('div', 'cv', f.text))); box.appendChild(s); }
  const lg = M.log.filter((e) => e.agent === a).slice(0, 4);
  if (lg.length) { const s = el('section', 'csec'); s.appendChild(el('div', 'ck', 'recent')); lg.forEach((e) => { const r = el('div', 'cl'); r.append(el('span', 't', fmtTime(e.time)), document.createTextNode(e.text)); s.appendChild(r); }); box.appendChild(s); }
  placeCard(a);
}
function placeCard(a) {
  const dr = $('drawer');
  if (small) { dr.style.left = ''; dr.style.top = ''; return; }
  const cw = dr.offsetWidth, chh = dr.offsetHeight;
  const right = a.x < W / 2;
  let x = right ? a.x + (a.lab.offsetWidth / 2) + 18 : a.x - (a.lab.offsetWidth / 2) - 18 - cw;
  if (x < 8 || x + cw > W - 8) x = right ? W - cw - 12 : 12;
  const y = clamp(a.y - 60, 64, Math.max(64, H - chh - 8));
  dr.style.left = Math.round(x) + 'px'; dr.style.top = Math.round(y) + 'px';
}

/* ================================================================== panels */
function renderPanels() {
  const flagsEl = $('flags'); flagsEl.textContent = '';
  if (!M.flags.length) flagsEl.appendChild(el('li', 'empty', 'Nothing waiting on Dom.'));
  M.flags.forEach((f, i) => {
    const li = el('li', 'flag'); li.append(el('span', 'fn', pad2(i + 1)));
    const body = el('span', 'fb'); body.appendChild(el('span', 'ft', f.text));
    if (f.owner) { const o = el('span', 'fo'); o.append(document.createTextNode('via '), agentChip(f.owner, (b) => pin(b))); body.appendChild(o); }
    li.appendChild(body); flagsEl.appendChild(li);
  });
  $('flag-n').textContent = String(M.flags.length);
  const logEl = $('log'); logEl.textContent = '';
  M.log.slice(0, 12).forEach((e) => {
    const li = el('li'); li.append(el('span', 't', fmtTime(e.time)), agentChip(e.agent, (b) => pin(b)), el('span', 'w', e.text));
    if (!e.agent.ghost) { li.addEventListener('pointerenter', (ev) => { if (ev.pointerType === 'mouse' && !st.pinned) setHover(e.agent); }); li.addEventListener('pointerleave', (ev) => { if (ev.pointerType === 'mouse' && !st.pinned) setHover(null); }); }
    logEl.appendChild(li);
  });
  if (!M.log.length) logEl.appendChild(el('li', 'empty', 'No activity yet.'));
  $('log-n').textContent = String(M.log.length);
  const ro = $('roster'); ro.textContent = '';
  M.agents.forEach((a) => {
    const li = el('li'); const b = el('button', 'rrow'); b.type = 'button'; b.style.setProperty('--c', a.accent);
    b.append(el('span', 'rn', a.name), el('span', 'rt', a.task || '—'));
    b.addEventListener('click', () => pin(a)); li.appendChild(b); ro.appendChild(li);
  });
  $('st-agents').textContent = String(M.agents.length);
  $('st-links').textContent = String(M.links.length);
  $('st-flags').textContent = String(M.flags.length);
  $('st-mast').textContent = [M.title, M.updated ? 'updated ' + fmtTime(M.updated, true) : ''].filter(Boolean).join(' · ');
}

/* =================================================================== start */
function startDashboard(d) {
  M = buildModel(d);
  $('lock').remove();
  $('app').hidden = false;
  renderPanels();
  buildNodes();
  layout();
  seedPackets();
  let rt;
  const relayout = () => { clearTimeout(rt); rt = setTimeout(() => { layout(); const a = st.pinned || st.hover; if (a) placeCard(a); requestDraw(); }, 120); };
  if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(stage); else window.addEventListener('resize', relayout);
  stage.addEventListener('click', () => { if (st.pinned) pin(null); });
  $('drawer').addEventListener('click', (e) => e.stopPropagation());
  $('dr-close').addEventListener('click', () => pin(null));
  $('btn-pause').addEventListener('click', () => setPaused(!st.paused));
  $('btn-lock').addEventListener('click', () => { M = null; location.replace(location.pathname); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { pin(null); setHover(null); }
    else if (e.key === ' ' && !/INPUT|BUTTON|TEXTAREA|A/.test(e.target.tagName)) { e.preventDefault(); setPaused(!st.paused); }
  });
  draw();
  if (reduceMotion) setPaused(true); else start();
}

// test hook for the headless check only (exposes counters, never data)
window.__teamLiveProbe = () => ({ agents: M ? M.agents.length : 0, links: M ? M.links.length : 0, flags: M ? M.flags.length : 0, log: M ? M.log.length : 0, delivered: st.delivered, frame: st.frame });
})();
