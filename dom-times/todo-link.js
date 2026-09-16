(function () {
  var NOTES = "https://autumn-dove-lagoon-forge.grok.me/";

  function wire() {
    var box = document.querySelector('input[data-todo-id="journal-gratitude"]');
    if (!box) return false;
    var li = box.closest(".todo-item");
    if (!li) return false;
    if (!li.querySelector("a.todo-open-notes")) {
      var a = document.createElement("a");
      a.className = "todo-open-notes";
      a.href = NOTES;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "Open notes →";
      a.style.cssText = "margin-left:0.75rem;font-size:0.72rem;letter-spacing:0.08em;text-transform:uppercase;text-decoration:underline;text-underline-offset:2px;white-space:nowrap;";
      li.appendChild(a);
    }
    var nested = li.querySelector(".todo-text a");
    if (nested) {
      var span = nested.parentElement;
      span.textContent = nested.textContent;
    }
    return true;
  }

  document.addEventListener("click", function (e) {
    var open = e.target.closest && e.target.closest("a.todo-open-notes");
    if (open) return;
    var box = e.target.closest && e.target.closest(".todo-item") && e.target.closest(".todo-item").querySelector('input[data-todo-id="journal-gratitude"]');
    if (!box) return;
    if (e.target === box) return;
    e.preventDefault();
    e.stopPropagation();
    window.open(NOTES, "_blank", "noopener");
  }, true);

  var app = document.getElementById("app");
  if (app) {
    var obs = new MutationObserver(function () { wire(); });
    obs.observe(app, { childList: true, subtree: true });
  }
  setTimeout(wire, 0);
  setTimeout(wire, 400);
  setTimeout(wire, 1200);
})();
