/* The Dom Times · Live — private crawler dashboard (prototype)
 * Plain JS + Canvas 2D. No build step, no network calls except ./data.enc.json.
 * Decrypted data lives only in memory (never written to storage). */
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
  .catch(() => { setLockMsg("couldn't load today's edition (data.enc.json). Serve this folder over http(s).", true); });

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
      setLockMsg("The edition file looks damaged. Re-run encrypt.mjs.", true);
    } else {
      setLockMsg("That passphrase didn't open today's edition. Try again.", true);
      const card = document.querySelector('.lock-card');
      card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
      input.select();
    }
  }
});

/* ==================================================================== model */
const DEFS = [
  { id: 'calendar', name: 'calendar', title: 'CALENDAR',     abbr: 'CAL', q: 'where does the day go?',          color: '#a78bfa' },
  { id: 'money',    name: 'money',    title: 'MONEY DESK',   abbr: 'MON', q: 'what moves money today?',         color: '#5eead4' },
  { id: 'inbox',    name: 'inbox',    title: 'INBOX',        abbr: 'INB', q: 'who actually needs Dom?',         color: '#7dd3fc' },
  { id: 'flags',    name: 'needs a look', title: 'NEEDS A LOOK', abbr: 'FLG', q: "what can't wait?",            color: '#f472b6' },
  { id: 'todo',     name: 'to-do',    title: 'TO-DO',        abbr: 'TDO', q: 'what has to get done?',           color: '#fbbf24' },
  { id: 'drops',    name: 'drops',    title: 'DROPS · 7EIGHTMADE', abbr: 'DRP', q: 'what ships for the brand?', color: '#fb7185' },
  { id: 'news',     name: 'news',     title: 'NEWS',         abbr: 'NEW', q: 'what changed overnight?',         color: '#2dd4bf' },
  { id: 'brain',    name: 'x · brain food', title: 'X · BRAIN FOOD', abbr: 'BRN', q: "what's worth thinking about?", color: '#c084fc' },
  { id: 'weather',  name: 'weather',  title: 'WEATHER',      abbr: 'WTH', q: "what's it like outside?",         color: '#93c5fd' },
];
const PINK = '#f472b6';
const DROP_RE = /\b(drops?|7\s?eight\s?made|launch|restock|merch|mockups?|front page)\b/i;
const LINK_RULES = [
  { to: 'drops', re: DROP_RE },
  { to: 'money', re: /\$\s?\d|\b(payment|payout|invoice|bill|renews?|refund)\b/i },
  { to: 'weather', re: /\b(rain|snow|storm|drizzle|forecast)\b|\d+°/i },
  { to: 'inbox', re: /\b(reply|email|inbox|dm)\b/i },
];
const STOP = new Set(('the and for with from that this then into onto your you are was were have has will just about after before over under than them they their what when where which while would could should example its it\'s not but all any can our out get got off one two via per more most only also each some today tonight morning edition dom mon tue wed thu fri sat sun jan feb mar apr may jun jul aug sep sept oct nov dec').split(' '));

const str = (x) => (typeof x === 'string' ? x : x == null ? '' : String(x));
const arr = (x) => (Array.isArray(x) ? x : []);
const safeUrl = (u) => { u = str(u); return /^https?:\/\//i.test(u) ? u : ''; };
const keyOf = (t) => str(t).toLowerCase().replace(/^example\s*[—-]\s*/, '').replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 48);

function keyWords(text, n) {
  const clean = str(text).replace(/^\s*EXAMPLE\s*[—-]\s*/i, '');
  const words = (clean.match(/[A-Za-z0-9$#][A-Za-z0-9$#.:'’,-]*/g) || [])
    .map((w) => w.replace(/[.,:'’-]+$/, ''))
    .filter((w) => w.length >= 3 && !/^\d+$/.test(w) && !STOP.has(w.toLowerCase()));
  const seen = new Set(); const out = [];
  for (const w of words) { const k = w.toLowerCase(); if (!seen.has(k)) { seen.add(k); out.push(w.toLowerCase()); } if (out.length >= n) break; }
  return out.length ? out : [clean.slice(0, 12).toLowerCase()];
}

function mk(o) {
  const title = str(o.title);
  return { title, body: str(o.body), meta: arr(o.meta).filter(Boolean).map(str), flag: !!o.flag, url: safeUrl(o.url),
    todo: o.todo || null, words: keyWords(title, 2), key: keyOf(title), read: false, link: null, x: 0, y: 0, readAt: 0 };
}

function buildSections(d) {
  const S = {}; DEFS.forEach((def) => { S[def.id] = []; });
  // calendar
  arr(d.timeline).forEach((t) => S.calendar.push(mk({ title: t.event, meta: [t.time, t.category],
    flag: /^(focus|drop|deadline)$/i.test(str(t.category)) })));
  arr(d.thisWeek).forEach((t) => S.calendar.push(mk({ title: t, meta: ['this week'] })));
  // money
  const md = d.moneyDesk || {};
  arr(md.items).forEach((m) => {
    const text = typeof m === 'string' ? m : str(m.text);
    S.money.push(mk({ title: text, body: str(m.note || m.why), meta: [str(md.title) || 'money'],
      flag: /\b(due|overdue|past due|payment|pay|renews?|declined|owe)\b/i.test(text) && !/\bpayout\b/i.test(text) }));
  });
  // inbox
  const ib = d.inboxSummary || {};
  [['urgent', true], ['needsLook', true], ['fyi', false]].forEach(([bucket, flag]) => {
    arr(ib[bucket]).forEach((m) => S.inbox.push(mk({ title: m.text, body: m.why,
      meta: [bucket === 'needsLook' ? 'needs a look' : bucket, m.account], flag })));
  });
  // needs a look
  arr(d.needsALook).forEach((n) => S.flags.push(mk({ title: n.text, meta: [n.type], flag: /action|urgent/i.test(str(n.type)) })));
  // to-do
  arr(d.todo && d.todo.items).forEach((t) => S.todo.push(mk({ title: t.text, meta: [t.priority, t.done ? 'done' : 'open'],
    flag: !t.done && /high|urgent/i.test(str(t.priority)), todo: t })));
  // news
  const desks = (d.news && d.news.desks) || {};
  Object.keys(desks).forEach((k) => arr(desks[k].items).forEach((n) => S.news.push(mk({ title: n.hed, body: n.body,
    meta: [str(desks[k].title) || k, n.source], url: n.url }))));
  // brain food / X
  const td = d.techDemo;
  if (td && td.pick) S.brain.push(mk({ title: td.pick, body: td.lesson && td.lesson.oneLiner,
    meta: ['tech demo · X bookmark', td.author], url: td.bookmarkUrl || td.url }));
  arr(d.brainFood && d.brainFood.items).forEach((b) => S.brain.push(mk({ title: b.hed, body: b.body, meta: ['brain food'] })));
  if (d.grimoire && d.grimoire.hed) S.brain.push(mk({ title: d.grimoire.hed,
    body: [str(d.grimoire.body), str(d.grimoire.practice)].filter(Boolean).join(' — '), meta: ['grimoire', d.grimoire.source] }));
  if (d.openingBell && d.openingBell.mindset && d.openingBell.mindset.hed) S.brain.push(mk({ title: d.openingBell.mindset.hed,
    body: d.openingBell.mindset.body, meta: ['mindset'] }));
  // weather
  const w = d.weather || {};
  if (w.summary || w.high != null) S.weather.push(mk({ title: `${str(w.location) || 'Weather'} · ${w.high}°/${w.low}°${str(w.unit)}`, body: w.summary, meta: ['today'] }));
  arr(w.days).forEach((x) => S.weather.push(mk({ title: `${str(x.label)} ${x.high}° / ${x.low}° · ${str(x.icon)}`, meta: ['forecast'] })));
  // drops: derived cross-section view of brand items (same schema, no extra keys needed)
  const seen = new Set();
  ['flags', 'todo', 'calendar', 'inbox'].forEach((sid) => S[sid].forEach((it) => {
    if (DROP_RE.test(it.title + ' ' + it.body) && !seen.has(it.key)) {
      seen.add(it.key);
      S.drops.push(mk({ title: it.title, body: it.body, meta: [`from ${DEFS.find((x) => x.id === sid).name}`].concat(it.meta), flag: it.flag, url: it.url, todo: it.todo }));
    }
  }));
  // cross links
  DEFS.forEach((def) => S[def.id].forEach((it) => {
    const text = it.title + ' ' + it.body;
    const rule = LINK_RULES.find((r) => r.to !== def.id && def.id !== 'drops' && r.re.test(text));
    if (rule) it.link = rule.to;
  }));
  return DEFS.map((def, i) => Object.assign({}, def, { idx: i, items: S[def.id], x: 0, y: 0, r: 50, pts: [] }));
}

/* ==================================================================== state */
let secs = [];
let data = null;
const st = {
  cur: 0, prev: -1, phase: 'travel', itemIdx: -1, wait: 0, marked: false, focus: null,
  paused: false, simT: 0, frame: 0, readCount: 0, links: 0, flagKeys: new Set(),
  readTimes: [], ipmHist: [], codeLine: 1, codeChanges: [], completeAt: 0, pass: 1,
};
const crawler = { x: 0, y: 0, mv: null, tent: [], legs: 9 };
const chips = [];
const linkLines = [];

/* ================================================================== helpers */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
const pad2 = (n) => String(n).padStart(2, '0');
const clock = () => { const d = new Date(); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const totalItems = () => secs.reduce((a, s) => a + s.items.length, 0);
const todoDone = () => { const seen = new Set(); let n = 0; secs.forEach((s) => s.items.forEach((it) => { if (it.todo && !seen.has(it.todo)) { seen.add(it.todo); if (it.todo.done) n++; } })); return n; };
function openFlagKeys() { const s = new Set(); st.flagKeys.forEach((k) => s.add(k)); secs.forEach((x) => x.items.forEach((it) => { if (it.todo && it.todo.done) s.delete(it.key); })); return s; }
const dayScore = () => clamp(Math.round(100 - 4 * openFlagKeys().size + 3 * todoDone()), 5, 100);

/* =================================================================== canvas */
const cv = $('cv'); const ctx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1, staticLayer = null, twinkles = [], small = false;

function layout() {
  const rect = cv.getBoundingClientRect();
  W = Math.max(200, rect.width); H = Math.max(200, rect.height);
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  small = W < 700;
  const top = small ? 74 : 112, bottom = H - (small ? 16 : 22);
  const x0 = W * (small ? 0.04 : 0.08), x1 = W * (small ? 0.96 : 0.92);
  const cw = (x1 - x0) / 3, ch = (bottom - top) / 3;
  const R = rng(7);
  secs.forEach((s, i) => {
    const row = Math.floor(i / 3), col = row % 2 === 0 ? i % 3 : 2 - (i % 3);
    s.x = x0 + (col + 0.5) * cw + (R() - 0.5) * cw * 0.28;
    s.y = top + (row + 0.5) * ch + (R() - 0.5) * ch * 0.22;
    s.r = Math.min(cw, ch) * (0.40 + 0.06 * Math.min(1, s.items.length / 10));
    const IR = rng(100 + i);
    s.items.forEach((it) => { const a = IR() * Math.PI * 2, d = s.r * (0.12 + 0.62 * Math.sqrt(IR())); it.x = s.x + Math.cos(a) * d; it.y = s.y + Math.sin(a) * d * 0.85; });
  });
  buildStatic();
  if (!crawler.mv) { crawler.x = secs[0].x - secs[0].r * 1.4; crawler.y = secs[0].y + secs[0].r; }
}

function buildStatic() {
  const cap = small ? 1100 : 2600;
  const want = secs.map((s) => clamp(120 + s.items.length * 22, 120, 360));
  const scale = Math.min(1, cap / want.reduce((a, b) => a + b, 0));
  staticLayer = document.createElement('canvas');
  staticLayer.width = cv.width; staticLayer.height = cv.height;
  const g = staticLayer.getContext('2d');
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.globalCompositeOperation = 'lighter';
  twinkles = [];
  secs.forEach((s, i) => {
    const R = rng(1000 + i * 31);
    const n = Math.round(want[i] * scale);
    const pts = [];
    // soft nebula glow
    const grd = g.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 1.25);
    grd.addColorStop(0, hexA(s.color, 0.10)); grd.addColorStop(1, hexA(s.color, 0));
    g.fillStyle = grd; g.beginPath(); g.arc(s.x, s.y, s.r * 1.25, 0, 7); g.fill();
    // gaussian core + filament arcs
    for (let k = 0; k < n; k++) {
      let x, y;
      if (R() < 0.68) {
        const u = Math.max(1e-6, R()), v = R();
        const m = Math.sqrt(-2 * Math.log(u)) * 0.42 * s.r;
        x = s.x + m * Math.cos(2 * Math.PI * v); y = s.y + m * Math.sin(2 * Math.PI * v) * 0.85;
      } else {
        const a0 = R() * 7, rr = s.r * (0.5 + R() * 0.7), da = (R() - 0.5) * 1.6;
        x = s.x + Math.cos(a0 + da) * rr + (R() - 0.5) * 8; y = s.y + Math.sin(a0 + da) * rr * 0.8 + (R() - 0.5) * 8;
      }
      pts.push([x, y]);
    }
    g.lineWidth = 0.5;
    g.strokeStyle = hexA(s.color, 0.09);
    g.beginPath();
    const lim = (s.r * 0.22) ** 2;
    for (let a = 0; a < pts.length; a++) {
      let links = 0;
      for (let b = a + 1; b < pts.length && links < 2; b++) {
        const dx = pts[a][0] - pts[b][0], dy = pts[a][1] - pts[b][1];
        if (dx * dx + dy * dy < lim && R() < 0.5) { g.moveTo(pts[a][0], pts[a][1]); g.lineTo(pts[b][0], pts[b][1]); links++; }
      }
    }
    g.stroke();
    pts.forEach(([x, y]) => {
      const sz = R() < 0.08 ? 1.8 : 1;
      g.fillStyle = hexA(R() < 0.12 ? '#ffffff' : s.color, 0.35 + R() * 0.55);
      g.fillRect(x, y, sz, sz);
    });
    s.pts = pts;
    const tw = small ? 9 : 18;
    for (let k = 0; k < tw; k++) twinkles.push({ s, a: R() * 7, d: s.r * (0.1 + R() * 0.85), sp: (R() - 0.5) * 0.25, ph: R() * 7, sz: 1 + R() * 1.4 });
  });
}

/* ================================================================== crawler */
function moveTo(tx, ty, dur) {
  const sx = crawler.x, sy = crawler.y;
  const mx = (sx + tx) / 2, my = (sy + ty) / 2, dx = tx - sx, dy = ty - sy;
  const bend = (Math.random() - 0.5) * 0.5;
  crawler.mv = { sx, sy, tx, ty, cx: mx - dy * bend, cy: my + dx * bend, t0: st.simT, dur };
}
const moveDone = () => !crawler.mv || st.simT - crawler.mv.t0 >= crawler.mv.dur;
function stepMove() {
  const m = crawler.mv; if (!m) return;
  const p = ease(clamp((st.simT - m.t0) / m.dur, 0, 1)), q = 1 - p;
  crawler.x = q * q * m.sx + 2 * q * p * m.cx + p * p * m.tx;
  crawler.y = q * q * m.sy + 2 * q * p * m.cy + p * p * m.ty;
}

function beginTravel(to) {
  const from = st.cur;
  st.prev = st.started ? from : -1; st.started = true;
  st.cur = to; st.phase = 'travel'; st.itemIdx = -1;
  const s = secs[to];
  moveTo(s.x + (Math.random() - 0.5) * s.r * 0.3, s.y + (Math.random() - 0.5) * s.r * 0.3, st.prev < 0 ? 1.2 : 1.6);
  if (st.prev >= 0 && st.prev !== to) addChip((secs[st.prev].x + s.x) / 2, (secs[st.prev].y + s.y) / 2, `${secs[st.prev].name} · ${s.name}`, 'walk', null);
  log('walk', `→ ${s.name}`, 'walk');
  setCode(5);
  onSectionChange();
}

function nextUnread(s, from) { for (let i = from; i < s.items.length; i++) if (!s.items[i].read) return i; return -1; }

function markRead(s, it) {
  it.read = true; it.readAt = st.simT;
  st.readCount++; st.readTimes.push(st.simT);
  const w = it.words.join(' · ');
  if (it.flag) {
    st.flagKeys.add(it.key);
    addChip(it.x, it.y, w, 'flag', s);
    log('flag', w, 'flag'); setCode(9);
  } else {
    addChip(it.x, it.y, w, 'read', s);
    log('read', w, 'read'); setCode(7);
  }
  if (it.link) {
    const t = secs.find((x) => x.id === it.link);
    st.links++;
    linkLines.push({ x0: it.x, y0: it.y, x1: t.x, y1: t.y, born: st.simT, c: t.color });
    addChip((it.x + t.x) / 2, (it.y + t.y) / 2, `${it.words[0]} → ${t.name}`, 'link', null);
    log('link', `${it.words[0]} → ${t.name}`, 'link'); setCode(10);
    if (linkLines.length > 10) linkLines.shift();
  }
  panelsDirty = true;
}

function resetPass() {
  secs.forEach((s) => s.items.forEach((it) => { it.read = false; }));
  st.readCount = 0; st.flagKeys.clear(); st.links = 0; st.pass++;
  linkLines.length = 0;
  log('done', `pass ${st.pass} · re-reading`, 'done');
}

function sim(dt) {
  st.simT += dt;
  stepMove();
  const s = secs[st.cur];
  if (st.phase === 'travel') {
    if (moveDone()) { st.phase = 'read'; st.itemIdx = -1; st.marked = true; st.wait = st.simT + 0.15; }
  } else if (st.phase === 'read') {
    if (st.marked) {
      if (st.simT >= st.wait) {
        const nx = nextUnread(s, st.itemIdx + 1);
        if (nx < 0) {
          st.phase = 'post'; st.wait = st.simT + 0.5;
          const f = s.items.filter((x) => x.flag).length;
          log('done', `${s.name} ${s.items.length}/${s.items.length}${f ? ' · ' + f + ' flag' + (f > 1 ? 's' : '') : ''}`, 'done');
          panelsDirty = true;
        } else {
          st.itemIdx = nx; st.marked = false;
          const it = s.items[nx];
          moveTo(it.x + (Math.random() - 0.5) * 6, it.y + 12, 0.32);
        }
      }
    } else if (moveDone()) {
      const it = s.items[st.itemIdx];
      markRead(s, it); st.marked = true; st.wait = st.simT + (it.flag ? 0.75 : 0.42);
    }
  } else if (st.phase === 'post') {
    if (st.simT >= st.wait) {
      if (st.focus === st.cur) { st.phase = 'hold'; setCode(6); }
      else if (st.focus != null) beginTravel(st.focus);
      else if (st.cur < secs.length - 1) beginTravel(st.cur + 1);
      else { st.phase = 'complete'; st.completeAt = st.simT; setCode(13);
        log('done', `edition crawled · flags for Dom: ${openFlagKeys().size}`, 'done'); }
    }
  } else if (st.phase === 'hold') {
    const a = st.simT * 0.6;
    crawler.mv = null;
    crawler.x += ((s.x + Math.cos(a) * s.r * 0.25) - crawler.x) * Math.min(1, dt * 2);
    crawler.y += ((s.y + Math.sin(a) * s.r * 0.18) - crawler.y) * Math.min(1, dt * 2);
    if (st.focus !== st.cur) {
      if (st.focus != null) beginTravel(st.focus);
      else if (st.cur < secs.length - 1) beginTravel(st.cur + 1);
      else { st.phase = 'complete'; st.completeAt = st.simT; }
    }
  } else if (st.phase === 'complete') {
    if (st.focus != null) { beginTravel(st.focus); }
    else if (st.simT - st.completeAt > 4) { resetPass(); beginTravel(0); }
  }
}

/* ===================================================================== chips */
function addChip(ax, ay, text, kind, s) {
  let x = ax, y = ay;
  if (s) { const a = Math.atan2(ay - s.y, ax - s.x) + (Math.random() - 0.5) * 0.8; const d = 26 + Math.random() * 30; x = ax + Math.cos(a) * d; y = ay + Math.sin(a) * d; }
  chips.push({ ax, ay, x, y, text: text.length > 26 ? text.slice(0, 25) + '…' : text, kind, born: st.simT, life: kind === 'flag' ? 9 : kind === 'link' ? 6 : 5, anchor: !!s });
  while (chips.length > (small ? 8 : 14)) chips.shift();
}

/* ====================================================================== draw */
let realT = 0;
function draw() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#060609'; ctx.fillRect(0, 0, W, H);
  const breathe = 0.85 + 0.15 * Math.sin(realT * 0.8);
  ctx.globalAlpha = breathe;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(staticLayer, 0, 0);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'lighter';

  // active cloud highlight
  const cs = secs[st.cur];
  const g = ctx.createRadialGradient(cs.x, cs.y, 0, cs.x, cs.y, cs.r * 1.1);
  g.addColorStop(0, hexA(cs.color, 0.12)); g.addColorStop(1, hexA(cs.color, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cs.x, cs.y, cs.r * 1.1, 0, 7); ctx.fill();

  // twinkles
  for (const p of twinkles) {
    const a = p.a + realT * p.sp, x = p.s.x + Math.cos(a) * p.d, y = p.s.y + Math.sin(a) * p.d * 0.85;
    ctx.fillStyle = hexA(p.s.color, 0.35 + 0.35 * Math.sin(realT * 2 + p.ph));
    ctx.fillRect(x, y, p.sz, p.sz);
  }

  // link lines
  ctx.lineWidth = 0.8;
  for (const L of linkLines) {
    const age = st.simT - L.born, a = clamp(1 - age / 8, 0.12, 1);
    ctx.strokeStyle = hexA('#fbbf24', 0.45 * a);
    ctx.beginPath(); ctx.moveTo(L.x0, L.y0);
    ctx.quadraticCurveTo((L.x0 + L.x1) / 2, Math.min(L.y0, L.y1) - 40, L.x1, L.y1); ctx.stroke();
  }

  // walk trail
  if (st.phase === 'travel' && st.prev >= 0) {
    const p = secs[st.prev];
    ctx.strokeStyle = 'rgba(220,220,255,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo(crawler.mv ? crawler.mv.cx : p.x, crawler.mv ? crawler.mv.cy : p.y, crawler.x, crawler.y); ctx.stroke();
  }

  // item nodes
  for (const s of secs) {
    for (const it of s.items) {
      if (it.read) {
        const c = it.flag ? PINK : s.color, sz = it.flag ? 4 : 3;
        ctx.fillStyle = hexA(c, 0.25); ctx.fillRect(it.x - sz, it.y - sz, sz * 2, sz * 2);
        ctx.fillStyle = c; ctx.fillRect(it.x - sz / 2, it.y - sz / 2, sz, sz);
      } else {
        ctx.fillStyle = hexA(it.flag ? PINK : s.color, 0.35); ctx.fillRect(it.x - 1.2, it.y - 1.2, 2.4, 2.4);
      }
    }
  }

  // dotted lines from crawler to read items in current cloud
  ctx.globalCompositeOperation = 'source-over';
  ctx.setLineDash([1.5, 3]); ctx.lineWidth = 1;
  for (const it of cs.items) {
    if (!it.read) continue;
    ctx.strokeStyle = it.flag ? 'rgba(244,114,182,0.6)' : 'rgba(235,235,255,0.45)';
    ctx.beginPath(); ctx.moveTo(crawler.x, crawler.y); ctx.lineTo(it.x, it.y); ctx.stroke();
  }
  ctx.setLineDash([]);

  // tentacles
  const N = small ? 12 : 16;
  while (crawler.tent.length < N) crawler.tent.push({ x: crawler.x, y: crawler.y, tx: 0, ty: 0, next: 0, ph: Math.random() * 7 });
  ctx.lineWidth = 0.7;
  for (let i = 0; i < N; i++) {
    const t = crawler.tent[i];
    if (realT > t.next) {
      const pts = cs.pts; const p = pts.length ? pts[(Math.random() * pts.length) | 0] : [cs.x, cs.y];
      const dx = p[0] - crawler.x, dy = p[1] - crawler.y, d = Math.hypot(dx, dy), maxL = cs.r * 0.9;
      const k = d > maxL ? maxL / d : 1;
      t.tx = crawler.x + dx * k; t.ty = crawler.y + dy * k; t.next = realT + 0.3 + Math.random() * 0.7;
    }
    t.x += (t.tx - t.x) * 0.12; t.y += (t.ty - t.y) * 0.12;
    const mx = (crawler.x + t.x) / 2 + Math.sin(realT * 3 + t.ph) * 8, my = (crawler.y + t.y) / 2 + Math.cos(realT * 2.6 + t.ph) * 8;
    ctx.strokeStyle = 'rgba(225,230,255,0.35)';
    ctx.beginPath(); ctx.moveTo(crawler.x, crawler.y); ctx.quadraticCurveTo(mx, my, t.x, t.y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(t.x - 1, t.y - 1, 2, 2);
  }

  // crawler body
  ctx.globalCompositeOperation = 'lighter';
  const bg = ctx.createRadialGradient(crawler.x, crawler.y, 0, crawler.x, crawler.y, 30);
  bg.addColorStop(0, 'rgba(94,234,212,0.45)'); bg.addColorStop(0.5, 'rgba(94,234,212,0.10)'); bg.addColorStop(1, 'rgba(94,234,212,0)');
  ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(crawler.x, crawler.y, 30, 0, 7); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = 'rgba(94,234,212,0.9)'; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.ellipse(crawler.x, crawler.y, 15, 11, realT * 0.7, 0, 7); ctx.stroke();
  ctx.strokeStyle = 'rgba(94,234,212,0.55)'; ctx.lineWidth = 1;
  for (let i = 0; i < crawler.legs; i++) {
    const a = (i / crawler.legs) * Math.PI * 2 + Math.sin(realT * 4 + i) * 0.15;
    const r0 = 15, r1 = 23 + Math.sin(realT * 5 + i * 1.7) * 3;
    ctx.beginPath(); ctx.moveTo(crawler.x + Math.cos(a) * r0, crawler.y + Math.sin(a) * r0 * 0.75);
    ctx.quadraticCurveTo(crawler.x + Math.cos(a + 0.3) * r1, crawler.y + Math.sin(a + 0.3) * r1 * 0.75, crawler.x + Math.cos(a + 0.15) * (r1 + 4), crawler.y + Math.sin(a + 0.15) * (r1 + 4) * 0.75);
    ctx.stroke();
  }
  ctx.fillStyle = PINK; ctx.fillRect(crawler.x - 3, crawler.y - 3, 6, 6);
  ctx.font = '10px ui-monospace, Menlo, Consolas, monospace';
  ctx.fillStyle = 'rgba(94,234,212,0.85)';
  ctx.fillText(`crawler · ${cs.name}`, crawler.x + 22, crawler.y + 30);

  // cloud labels
  for (const s of secs) {
    const active = s.idx === st.cur;
    const read = s.items.filter((x) => x.read).length;
    const status = active && st.phase !== 'hold' && st.phase !== 'post' && read < s.items.length ? 'reading' : read >= s.items.length && s.items.length ? 'done' : read ? 'partial' : 'queued';
    const sub = `${read}/${s.items.length} items · ${status}`;
    ctx.font = '9.5px ui-monospace, Menlo, Consolas, monospace';
    const subW = ctx.measureText(sub).width;
    ctx.font = `${active ? 15 : 12}px ui-monospace, Menlo, Consolas, monospace`;
    const lw = Math.max(subW, ctx.measureText(s.name).width);
    const lx = clamp(s.x - s.r * 0.15, 4, W - lw - 4), ly = s.y - s.r * 0.95;
    ctx.fillStyle = active ? '#f2efff' : hexA(s.color, 0.85);
    ctx.fillText(s.name, lx, ly);
    ctx.font = '9.5px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillStyle = 'rgba(160,160,185,0.8)';
    ctx.fillText(sub, lx, ly + 13);
  }

  // chips
  ctx.font = '10px ui-monospace, Menlo, Consolas, monospace';
  for (let i = chips.length - 1; i >= 0; i--) {
    const c = chips[i], age = st.simT - c.born;
    if (age > c.life) { chips.splice(i, 1); continue; }
    const a = Math.min(1, age * 4) * Math.min(1, (c.life - age) * 1.2);
    const tw = ctx.measureText(c.text).width, pw = tw + 10, ph = 15;
    const x = clamp(c.x - pw / 2, 2, W - pw - 2), y = clamp(c.y - ph / 2, 2, H - ph - 2);
    if (c.anchor) {
      ctx.globalAlpha = a * 0.6; ctx.setLineDash([1.5, 2.5]); ctx.strokeStyle = c.kind === 'flag' ? PINK : '#ddd';
      ctx.beginPath(); ctx.moveTo(c.ax, c.ay); ctx.lineTo(x + pw / 2, y + ph / 2); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.globalAlpha = a;
    if (c.kind === 'flag') { ctx.fillStyle = 'rgba(236,72,153,0.88)'; ctx.fillRect(x, y, pw, ph); ctx.fillStyle = '#fff'; }
    else {
      ctx.fillStyle = 'rgba(8,8,14,0.88)'; ctx.fillRect(x, y, pw, ph);
      ctx.strokeStyle = c.kind === 'link' ? 'rgba(251,191,36,0.8)' : c.kind === 'walk' ? 'rgba(167,139,250,0.8)' : 'rgba(200,200,225,0.55)';
      ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, pw - 1, ph - 1);
      ctx.fillStyle = c.kind === 'link' ? '#fde68a' : '#e5e5f0';
    }
    ctx.fillText(c.text, x + 5, y + 11);
    ctx.globalAlpha = 1;
  }
}

/* ==================================================================== panels */
let panelsDirty = true;
const logEl = $('log');
function log(verb, text, cls) {
  const li = document.createElement('li'); li.className = cls;
  const t = document.createElement('span'); t.className = 't'; t.textContent = clock();
  const v = document.createElement('span'); v.className = 'v'; v.textContent = verb;
  const w = document.createElement('span'); w.className = 'w'; w.textContent = text;
  li.append(t, v, w); logEl.appendChild(li);
  while (logEl.children.length > 30) logEl.removeChild(logEl.firstChild);
}

const CODE = [
  ['cm', '// crawler.js — reads Dom\'s morning'],
  ['', 'const paper = await unlock("data.enc.json")'],
  ['', 'const spider = new Crawler({ legs: 9, tentacles: 16 })'],
  ['', ''],
  ['', 'for (const section of paper.sections) {'],
  ['', '  spider.walkTo(section)'],
  ['', '  spider.hold(section)        // Dom tapped it'],
  ['', '  for (const item of section.items) {'],
  ['', '    const kind = classify(item)'],
  ['', '    if (kind === "action") flag(item)  // → Dom'],
  ['', '    if (item.ref) link(item, item.ref)'],
  ['', '  }'],
  ['', '}'],
  ['', 'score = dayScore(paper)     // flags for Dom'],
];
function codeHtml(src) {
  const esc = src.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  if (src.trim().startsWith('//')) return `<span class="cm">${esc}</span>`;
  return esc.replace(/(\/\/.*)$/, '<span class="cm">$1</span>')
    .replace(/("[^"]*")/g, '<span class="st">$1</span>')
    .replace(/\b(const|for|of|if|await|new)\b/g, '<span class="kw">$1</span>')
    .replace(/\b(unlock|walkTo|hold|classify|flag|link|dayScore)\(/g, '<span class="fn">$1</span>(');
}
const codeEl = $('code');
const codeLines = CODE.map(([, src], i) => { const s = document.createElement('span'); s.dataset.i = i; s.innerHTML = codeHtml(src) || ' '; return s; });
codeLines.forEach((s, i) => { codeEl.appendChild(s); if (i < codeLines.length - 1) codeEl.appendChild(document.createTextNode('\n')); });
const caret = document.createElement('span'); caret.className = 'caret';
function setCode(i) { if (st.codeLine !== i) { st.codeLine = i; st.codeChanges.push(st.simT); } }
function renderCode() {
  codeLines.forEach((s, i) => s.classList.toggle('cur', i === st.codeLine));
  codeLines[st.codeLine].appendChild(caret);
  const lh = 15, target = Math.max(0, st.codeLine * lh - codeEl.clientHeight / 2);
  codeEl.scrollTop = target;
  const now = st.simT; st.codeChanges = st.codeChanges.filter((t) => now - t < 5);
  $('code-rate').textContent = `${(st.codeChanges.length / 5).toFixed(1)} l/s`;
}

function buildTabs() {
  const nav = $('tabs'); nav.textContent = '';
  secs.forEach((s, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'tab'; b.setAttribute('role', 'tab');
    const n = document.createElement('span'); n.className = 'n'; n.textContent = pad2(i + 1);
    const t = document.createElement('span'); t.textContent = s.name;
    const f = document.createElement('span'); f.className = 'fl';
    b.append(n, t, f); b.addEventListener('click', () => focusSection(i));
    s.tabEl = b; s.tabFl = f; nav.appendChild(b);
  });
  const box = $('secs'); box.textContent = '';
  const heat = $('heat'); heat.textContent = '';
  secs.forEach((s, i) => {
    const row = document.createElement('div'); row.className = 'sec-row'; row.style.setProperty('--c', s.color);
    const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = s.name;
    const ct = document.createElement('span'); ct.className = 'ct';
    const pb = document.createElement('div'); pb.className = 'pb'; const fill = document.createElement('i'); pb.appendChild(fill);
    row.append(nm, ct, pb); row.addEventListener('click', () => focusSection(i));
    s.rowCt = ct; s.rowFill = fill; box.appendChild(row);
    const hl = document.createElement('span'); hl.className = 'hl'; hl.textContent = s.abbr;
    const hr = document.createElement('span'); hr.className = 'hr';
    s.sq = s.items.slice(0, 16).map(() => { const q = document.createElement('i'); q.className = 'sq'; hr.appendChild(q); return q; });
    heat.append(hl, hr);
  });
  $('sec-count').textContent = String(secs.length);
  $('heat-total').textContent = String(totalItems());
}

function onSectionChange() {
  const s = secs[st.cur];
  $('hud-num').textContent = pad2(st.cur + 1);
  $('hud-name').textContent = s.title;
  $('hud-q').textContent = s.q;
  secs.forEach((x, i) => x.tabEl && x.tabEl.classList.toggle('active', i === st.cur));
  if (s.tabEl && s.tabEl.scrollIntoView && small) s.tabEl.scrollIntoView({ block: 'nearest', inline: 'center' });
}

function sizeCanvas(c) {
  const r = c.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
  if (c.width !== Math.round(r.width * d) || c.height !== Math.round(r.height * d)) { c.width = Math.round(r.width * d); c.height = Math.round(r.height * d); }
  const g = c.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); return [g, r.width, r.height];
}

function drawRadar() {
  const [g, w, h] = sizeCanvas($('radar'));
  g.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2 + 4, R = Math.max(10, Math.min(w, h) / 2 - 22), n = secs.length;
  const ang = (i) => -Math.PI / 2 + (i / n) * Math.PI * 2;
  g.strokeStyle = '#23233a'; g.lineWidth = 1;
  for (const f of [0.33, 0.66, 1]) { g.beginPath(); for (let i = 0; i <= n; i++) { const a = ang(i % n); g[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * R * f, cy + Math.sin(a) * R * f); } g.stroke(); }
  g.font = '9px ui-monospace, Menlo, monospace'; g.fillStyle = '#7a7a92'; g.textAlign = 'center';
  secs.forEach((s, i) => { const a = ang(i); g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke();
    g.fillText(s.abbr, cx + Math.cos(a) * (R + 11), cy + Math.sin(a) * (R + 11) + 3); });
  g.beginPath();
  secs.forEach((s, i) => { const v = s.items.length ? s.items.filter((x) => x.read).length / s.items.length : 1; const a = ang(i), r = R * (0.06 + 0.94 * v);
    g[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r); });
  g.closePath(); g.fillStyle = 'rgba(94,234,212,0.28)'; g.fill(); g.strokeStyle = '#5eead4'; g.lineWidth = 1.2; g.stroke();
  g.textAlign = 'start';
}

function drawSpark() {
  const [g, w, h] = sizeCanvas($('spark'));
  g.clearRect(0, 0, w, h);
  const hist = st.ipmHist; if (hist.length < 2) return;
  const max = Math.max(60, ...hist);
  g.strokeStyle = '#fbbf24'; g.lineWidth = 1.4; g.beginPath();
  hist.forEach((v, i) => { const x = (i / (hist.length - 1)) * w, y = h - 4 - (v / max) * (h - 8); g[i ? 'lineTo' : 'moveTo'](x, y); });
  g.stroke();
}

function drawGauge(score) {
  const [g, w, h] = sizeCanvas($('gauge'));
  g.clearRect(0, 0, w, h);
  const R = Math.max(14, Math.min(w / 2 - 10, (h - 6) / 1.62)), cx = w / 2, cy = R + 5;
  const a0 = Math.PI * 0.8, a1 = Math.PI * 2.2;
  g.lineCap = 'round'; g.lineWidth = 8;
  g.strokeStyle = '#1d1d29'; g.beginPath(); g.arc(cx, cy, R, a0, a1); g.stroke();
  const col = score >= 70 ? '#5eead4' : score >= 40 ? '#fbbf24' : '#f472b6';
  g.strokeStyle = col; g.beginPath(); g.arc(cx, cy, R, a0, a0 + (a1 - a0) * (score / 100)); g.stroke();
  g.fillStyle = '#f4f4fb'; g.textAlign = 'center'; g.font = `600 ${Math.round(R * 0.55)}px ui-monospace, Menlo, monospace`;
  g.fillText(String(score), cx, cy + R * 0.18);
  g.font = '9px ui-monospace, Menlo, monospace'; g.fillStyle = '#7a7a92'; g.fillText('day score', cx, cy + R * 0.18 + 13);
  g.textAlign = 'start';
}

function renderPanels() {
  const tot = totalItems();
  const flags = openFlagKeys().size;
  $('st-read').textContent = `${st.readCount}/${tot}`;
  $('st-links').textContent = String(st.links);
  $('st-flags').textContent = String(flags);
  $('flag-n').textContent = String(flags);
  // rates
  st.readTimes = st.readTimes.filter((t) => st.simT - t < 20);
  const ipm = Math.round(st.readTimes.length * 3);
  $('ipm').textContent = `${ipm}/m`; $('log-rate').textContent = `${ipm} i/m`;
  $('kv-read').textContent = String(st.readCount); $('kv-linked').textContent = String(st.links);
  $('kv-flagged').textContent = String(flags); $('kv-done').textContent = String(todoDone());
  secs.forEach((s, i) => {
    const read = s.items.filter((x) => x.read).length, n = s.items.length;
    s.rowCt.textContent = `${read}/${n}`;
    s.rowFill.style.width = `${n ? (read / n) * 100 : 100}%`;
    s.sq.forEach((q, k) => { const it = s.items[k];
      q.style.background = (i === st.cur && k === st.itemIdx && st.phase === 'read') ? '#ffffff' : it.read ? (it.flag ? PINK : s.color) : '#1d1d29';
      q.style.opacity = it.read ? '0.9' : '1'; });
    const fl = s.items.filter((x) => x.read && x.flag && !(x.todo && x.todo.done)).length;
    s.tabFl.textContent = fl ? `•${fl}` : '';
    s.tabEl.classList.toggle('done', n > 0 && read === n);
  });
  drawRadar(); drawSpark(); drawGauge(dayScore()); renderCode();
}

/* ==================================================================== focus */
function focusSection(i) {
  st.focus = i;
  if (st.cur !== i || st.phase === 'complete') beginTravel(i);
  else if (st.phase === 'hold') { /* stay */ }
  renderDrawer(i);
}
function closeDrawer() {
  $('drawer').hidden = true;
  st.focus = null;
}
function renderDrawer(i) {
  const s = secs[i];
  const dr = $('drawer'); dr.hidden = false; dr.style.setProperty('--sec', s.color);
  $('dr-title').textContent = `${pad2(i + 1)} ${s.title}`;
  const nf = s.items.filter((x) => x.flag && !(x.todo && x.todo.done)).length;
  $('dr-sub').textContent = `${s.items.length} item${s.items.length === 1 ? '' : 's'} · ${nf} flag${nf === 1 ? '' : 's'} for Dom · ${s.q}`;
  const box = $('dr-cards'); box.textContent = ''; box.scrollTop = 0;
  if (!s.items.length) { const e = document.createElement('p'); e.className = 'empty'; e.textContent = 'Nothing here today.'; box.appendChild(e); }
  const ordered = s.items.slice().sort((a, b) => (b.flag - a.flag));
  ordered.forEach((it) => {
    const c = document.createElement('article'); c.className = 'card' + (it.flag ? ' flag' : '') + (it.todo && it.todo.done ? ' isdone' : '');
    c.style.setProperty('--sec', s.color);
    const meta = document.createElement('div'); meta.className = 'card-meta';
    if (it.flag) { const f = document.createElement('span'); f.className = 'chip-flag'; f.textContent = 'FLAG · FOR DOM'; meta.appendChild(f); }
    it.meta.forEach((m) => { const k = document.createElement('span'); k.className = 'chip-kind'; k.textContent = m; meta.appendChild(k); });
    if (it.link) { const k = document.createElement('span'); k.className = 'chip-kind c-amber'; k.textContent = `→ ${secs.find((x) => x.id === it.link).name}`; meta.appendChild(k); }
    c.appendChild(meta);
    const title = document.createElement('div'); title.className = 'card-title'; title.textContent = it.title;
    if (it.todo) {
      const lab = document.createElement('label'); lab.className = 'todo';
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!it.todo.done;
      cb.addEventListener('change', () => { it.todo.done = cb.checked; panelsDirty = true; renderDrawer(i); });
      lab.append(cb, title); c.appendChild(lab);
    } else c.appendChild(title);
    if (it.body) { const b = document.createElement('div'); b.className = 'card-body'; b.textContent = it.body; c.appendChild(b); }
    if (it.url) { const a = document.createElement('a'); a.href = it.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'open ↗'; c.appendChild(a); }
    box.appendChild(c);
  });
  panelsDirty = true;
}

/* ===================================================================== loop */
let last = 0, panelT = 0, histT = 0;
function loop(ts) {
  const now = ts / 1000;
  const dt = last ? Math.min(0.05, now - last) : 0.016;
  last = now;
  if (st.paused) { st.frame++; if (st.frame % 3) { requestAnimationFrame(loop); return; } realT += dt * 3; }
  else { realT += dt; sim(dt); st.frame++; }
  draw();
  if (now - histT > 0.5) { histT = now; st.ipmHist.push(Math.round(st.readTimes.filter((t) => st.simT - t < 20).length * 3)); if (st.ipmHist.length > 60) st.ipmHist.shift(); }
  if (panelsDirty || now - panelT > 0.25) {
    panelT = now; panelsDirty = false; renderPanels();
    $('st-t').textContent = st.simT.toFixed(2); $('st-frame').textContent = String(st.frame);
  }
  requestAnimationFrame(loop);
}

function setPaused(p) {
  st.paused = p;
  const b = $('btn-pause'); b.setAttribute('aria-pressed', String(p)); b.textContent = p ? '▶ play' : '❚❚ pause';
}

/* ==================================================================== start */
function startDashboard(d) {
  data = d;
  secs = buildSections(d);
  $('lock').remove();
  $('app').hidden = false;
  const m = d.masthead || {};
  $('st-mast').textContent = [str(m.title) || 'The Dom Times', m.volume ? `Vol ${str(m.volume)}` : '', m.asOf ? `as of ${str(m.asOf)}` : ''].filter(Boolean).join(' · ');
  $('example-badge').hidden = !(d._meta && /example/i.test(str(d._meta.source)));
  $('hud-lead').textContent = d.lead && d.lead.headline ? `“${str(d.lead.headline)}”` : '';
  buildTabs();
  layout();
  if ('ResizeObserver' in window) { let rt; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { const r0 = cv.getBoundingClientRect(); if (Math.abs(r0.width - W) < 1 && Math.abs(r0.height - H) < 1) return; layout(); chips.length = 0; linkLines.length = 0; crawler.tent.length = 0; if (st.phase !== 'travel' && st.phase !== 'read') { const s = secs[st.cur]; crawler.x = s.x; crawler.y = s.y; crawler.mv = null; } else beginTravel(st.cur); }, 150); }).observe($('stage')); }
  cv.addEventListener('click', (e) => {
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    let best = -1, bd = Infinity;
    secs.forEach((s, i) => { const d2 = Math.hypot(s.x - x, s.y - y); if (d2 < s.r * 1.1 && d2 < bd) { bd = d2; best = i; } });
    if (best >= 0) focusSection(best);
  });
  $('dr-close').addEventListener('click', closeDrawer);
  $('btn-pause').addEventListener('click', () => setPaused(!st.paused));
  $('btn-lock').addEventListener('click', () => { data = null; secs = []; location.replace(location.pathname); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
    else if (e.key === ' ' && !/INPUT|BUTTON|TEXTAREA|A/.test(e.target.tagName)) { e.preventDefault(); setPaused(!st.paused); }
  });
  log('walk', 'unlocked · crawler online', 'walk');
  if (reduceMotion) setPaused(true);
  beginTravel(0);
  requestAnimationFrame(loop);
}

// test hook for the headless check only (exposes counters, never data)
window.__domTimesProbe = () => ({ read: st.readCount, total: totalItems(), cur: st.cur, phase: st.phase, focus: st.focus });
})();
