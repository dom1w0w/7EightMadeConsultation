(function () {
  var firstEnd = Date.parse('2026-11-20T01:15:00Z');
  var end = Date.parse('2026-11-21T01:15:00Z');
  if (Date.now() >= end) return;
  if (document.getElementById('loopdrop-banner')) return;

  var style = document.createElement('style');
  style.textContent =
    '#loopdrop-banner{background:#0c0e12;border-bottom:1px solid rgba(0,245,230,.35);color:#e8ecf1;position:relative;z-index:60}' +
    '#loopdrop-banner .ldb-inner{max-width:1120px;margin:0 auto;padding:10px 16px}' +
    '#loopdrop-banner a{display:flex;align-items:center;gap:12px;flex-wrap:wrap;color:inherit;text-decoration:none}' +
    '#loopdrop-banner .ldb-live{background:#00f5e6;color:#04211d;font-weight:700;font-size:12px;letter-spacing:.06em;text-transform:uppercase;padding:3px 8px;border-radius:999px;white-space:nowrap}' +
    '#loopdrop-banner .ldb-copy{font-size:15px}' +
    '#loopdrop-banner .ldb-copy span{opacity:.75}' +
    '#loopdrop-banner .ldb-clock{margin-left:auto;font-variant-numeric:tabular-nums;font-weight:700;color:#00f5e6}';
  document.head.appendChild(style);

  var bar = document.createElement('aside');
  bar.id = 'loopdrop-banner';
  bar.setAttribute('aria-label', 'The Loop Drop');
  bar.innerHTML =
    '<div class="ldb-inner">' +
      '<a href="the-loop/">' +
        '<span class="ldb-live">Live · 8h</span>' +
        '<span class="ldb-copy">The Loop Drop · $47 · <span>two models, one team — the operator manual</span></span>' +
        '<span class="ldb-clock" id="loopdrop-clock">--:--:--</span>' +
      '</a>' +
    '</div>';
  document.body.insertBefore(bar, document.body.firstChild);

  function pad(n) { return String(Math.max(0, n)).padStart(2, '0'); }
  function tick() {
    var target = Date.now() < firstEnd ? firstEnd : end;
    var ms = target - Date.now();
    var clock = document.getElementById('loopdrop-clock');
    if (ms <= 0) {
      bar.hidden = true;
      return;
    }
    var h = Math.floor(ms / 3600000);
    var m = Math.floor((ms % 3600000) / 60000);
    var s = Math.floor((ms % 60000) / 1000);
    if (clock) clock.textContent = pad(h) + ':' + pad(m) + ':' + pad(s);
  }
  tick();
  setInterval(tick, 1000);
})();
