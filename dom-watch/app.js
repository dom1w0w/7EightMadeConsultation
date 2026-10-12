/* Dom Watch — passphrase-locked personal ops page. Contains NO personal data;
 * everything personal is decrypted in memory from ./data.enc.json (AES-GCM-256 / PBKDF2-SHA256). */
(() => {
'use strict';
const $ = (id) => document.getElementById(id);
const TZ = 'America/Chicago';
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = (n) => '$' + Number(n).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

function tick() { $('clock').textContent = new Intl.DateTimeFormat('en-GB', {timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false}).format(new Date()); }
tick(); setInterval(tick, 1000);
// today's date (YYYY-MM-DD) in CT
const ctISO = (d) => new Intl.DateTimeFormat('en-CA', {timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'}).format(d);
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const dow = (iso) => new Date(iso + 'T12:00:00Z').getUTCDay();
const DN = ['SUN','MON','TUE','WED','THU','FRI','SAT'], MN = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

async function decrypt(blob, pass) {
  if (!blob || blob.v !== 1 || blob.cipher !== 'AES-GCM' || !(blob.iterations >= 100000)) throw new Error('format');
  const s = crypto.subtle; if (!s) throw new Error('nosubtle');
  const base = await s.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  const key = await s.deriveKey({name: 'PBKDF2', hash: 'SHA-256', salt: fromB64(blob.salt), iterations: blob.iterations}, base, {name: 'AES-GCM', length: 256}, false, ['decrypt']);
  return JSON.parse(new TextDecoder().decode(await s.decrypt({name: 'AES-GCM', iv: fromB64(blob.iv)}, key, fromB64(blob.ciphertext))));
}
let blob = null;
const ready = fetch('data.enc.json', {cache: 'no-store'}).then((r) => r.ok ? r.json() : Promise.reject()).then((j) => { blob = j; }).catch(() => msg("Couldn't load data.enc.json.", true));
function msg(t, err) { $('lock-msg').textContent = t; $('lock-msg').classList.toggle('err', !!err); }
$('lock-form').addEventListener('submit', async (e) => {
  e.preventDefault(); const p = $('pass').value; if (!p) return;
  $('unlock-btn').disabled = true; msg('deriving key…'); await ready;
  try { const d = await decrypt(blob, p); $('pass').value = ''; render(d); }
  catch (er) { $('unlock-btn').disabled = false; msg(er.message === 'nosubtle' ? 'Open over https to decrypt.' : er.message === 'format' ? 'Data file looks damaged.' : "That passphrase didn't open it. Try again.", true); }
});

function render(d) {
  $('lock').hidden = true; $('app').hidden = false;
  const today = ctISO(new Date());
  const mon = addDays(today, -((dow(today) + 6) % 7));
  const sun = addDays(mon, 6);
  const md = (iso) => MN[+iso.slice(5, 7) - 1] + ' ' + +iso.slice(8);
  $('week-lbl').textContent = `WEEK OF ${md(mon)} – ${+sun.slice(8)} · 7 DAY WINDOW`;
  let h = '';
  for (let i = 0; i < 7; i++) {
    const day = addDays(mon, i), evs = (d.events || []).filter((e) => e.date === day);
    h += `<div class="day${day === today ? ' today' : ''}"><div class="dh">${DN[dow(day)]} ${+day.slice(8)}</div>` +
      evs.map((e) => `<span class="dot"></span><div class="ev${e.flag ? ' flag' : ''}${e.tag === 'in' ? ' in' : ''}">${esc(e.text)}</div>`).join('') + '</div>';
  }
  $('days').innerHTML = h;
  const ti = [...$('days').children].findIndex((n) => n.classList.contains('today'));
  if (ti > 0) $('days').scrollLeft = $('days').children[ti].offsetLeft - $('days').offsetLeft;

  const accts = d.accounts || [], debt = accts.filter((a) => a.kind !== 'cash');
  const totDebt = debt.reduce((s, a) => s + a.balance, 0) || 1, totCash = accts.filter((a) => a.kind === 'cash').reduce((s, a) => s + a.balance, 0) || 1;
  $('accts').innerHTML = accts.map((a) => {
    let pct, cap, hot = false;
    if (a.kind === 'card' && a.limit) { pct = a.balance / a.limit * 100; hot = pct >= 80; cap = `${Math.round(pct)}% of ${money(a.limit)} limit`; }
    else if (a.kind === 'cash') { pct = a.fill != null ? Math.max(3, a.fill) : a.balance / totCash * 100; cap = a.available != null ? `${money(a.available)} available` : 'cash on hand'; }
    else { pct = a.balance / totDebt * 100; hot = a.kind === 'card'; cap = `${Math.round(pct)}% of total owed` + (a.kind === 'card' ? ' · limit not reported' : ''); }
    return `<div class="acct${hot ? ' hot' : ''}"><div class="top2"><span>${esc(a.label.toUpperCase())}</span><span class="v">${money(a.balance)}</span></div>` +
      `<div class="bar"><i class="${a.kind === 'cash' ? 'good' : ''}" data-w="${Math.min(100, pct).toFixed(1)}"></i></div><div class="cap">${esc(cap)}</div></div>`;
  }).join('');
  $('acct-note').textContent = d.updated ? 'LIVE · PLAID · ' + new Date(d.updated).toLocaleString('en-US', {timeZone: TZ, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'}) + ' CT' : '';

  const bills = d.bills || [];
  $('bill-n').textContent = bills.filter((b) => b.due).length + ' DUE';
  $('bills').innerHTML = bills.map((b) => `<div class="bill${b.income ? ' in' : ''}"><span class="sw"></span><span class="w">${esc(b.when.toUpperCase())}</span><span class="t">${esc(b.what)}${b.note ? `<small>${esc(b.note)}</small>` : ''}</span><span class="a">${esc(b.amt)}</span></div>`).join('');

  const out = d.outflow || [], max = Math.max(...out.map((o) => o.amt), 1), avg = out.reduce((s, o) => s + o.amt, 0) / (out.length || 1);
  $('out-total').textContent = money(out.reduce((s, o) => s + o.amt, 0));
  $('chart').innerHTML = out.map((o) => `<i class="${o.d === today ? 'today' : o.amt > avg * 1.5 ? 'hot' : ''}" data-h="${(o.amt / max * 100).toFixed(1)}" title="${o.d}"></i>`).join('');
  $('axis').innerHTML = out.map((o) => `<span>${+o.d.slice(8)}</span>`).join('');

  requestAnimationFrame(() => requestAnimationFrame(() => document.querySelectorAll('[data-w]').forEach((n) => { n.style.width = n.dataset.w + '%'; })));
  document.querySelectorAll('[data-h]').forEach((n) => { n.style.height = n.dataset.h + '%'; });
  const al = (d.alerts || []).filter((a) => !a.until || new Date(a.until) > new Date());
  $('alert-n').textContent = al.length;
  $('alerts').innerHTML = al.map((a) => `<div class="al"><span class="tm">${esc(a.t)}</span><div class="bd"><b>${esc(a.title)}</b><div class="s">${esc(a.sub)}</div></div></div>`).join('') || '<div class="al"><span class="tm">—</span><div class="bd"><div class="s">All clear.</div></div></div>';
}
})();
