(function () {
  function tidy() {
    var rule = document.querySelector(".meta-rule");
    if (!rule) return false;
    var spans = [].slice.call(rule.children);
    spans.forEach(function (s) {
      var t = (s.textContent || "").trim();
      if (/^VOL\./i.test(t) || /^AS OF\b/i.test(t)) {
        s.remove();
        return;
      }
      var m = t.match(/^(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY),\s+([A-Z]+)\s+(\d+),\s+(\d+)$/i);
      if (m) {
        var months = {JANUARY:"Jan",FEBRUARY:"Feb",MARCH:"Mar",APRIL:"Apr",MAY:"May",JUNE:"Jun",JULY:"Jul",AUGUST:"Aug",SEPTEMBER:"Sep",OCTOBER:"Oct",NOVEMBER:"Nov",DECEMBER:"Dec"};
        var wd = m[1].slice(0, 3);
        wd = wd.charAt(0).toUpperCase() + wd.slice(1).toLowerCase();
        s.textContent = wd + " " + (months[m[2].toUpperCase()] || m[2]) + " " + m[3];
      }
    });
    document.querySelectorAll(".inbox-asof, .money-desk-asof").forEach(function (el) { el.remove(); });
    return true;
  }
  var app = document.getElementById("app");
  if (!app) return;
  var obs = new MutationObserver(function () { if (tidy()) obs.disconnect(); });
  obs.observe(app, { childList: true, subtree: true });
  tidy();
})();
