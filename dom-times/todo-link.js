(function () {
  var NOTES = "https://notes.grok.me/";
  function wire() {
    var box = document.querySelector('input[data-todo-id="journal-gratitude"]');
    if (!box) return false;
    var span = box.parentElement && box.parentElement.querySelector(".todo-text");
    if (!span || span.querySelector("a")) return !!span;
    var a = document.createElement("a");
    a.href = NOTES;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = span.textContent;
    a.style.color = "inherit";
    a.style.textUnderlineOffset = "2px";
    span.textContent = "";
    span.appendChild(a);
    return true;
  }
  var app = document.getElementById("app");
  if (!app) return;
  var obs = new MutationObserver(function () { if (wire()) obs.disconnect(); });
  obs.observe(app, { childList: true, subtree: true });
  wire();
})();
