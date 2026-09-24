(function () {
  var end = Date.parse('2026-09-24T10:00:00Z');
  if (Date.now() >= end) return;
  if (document.getElementById('skillmd-banner')) return;

  var bar = document.createElement('aside');
  bar.id = 'skillmd-banner';
  bar.setAttribute('aria-label', 'Skill.md Drop');
  bar.innerHTML =
    '<div class="smb-inner">' +
      '<a href="skill-md-drop/">' +
        '<span class="smb-live">Live \u00b7 8h</span>' +
        '<span class="smb-copy">Skill.md Drop \u00b7 $47 \u00b7 <span>one file, one job</span></span>' +
        '<span class="smb-clock" id="skillmd-clock">--:--:--</span>' +
      '</a>' +
    '</div>';
  document.body.insertBefore(bar, document.body.firstChild);

  function pad(n) { return String(Math.max(0, n)).padStart(2, '0'); }
  function tick() {
    var ms = end - Date.now();
    var clock = document.getElementById('skillmd-clock');
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
