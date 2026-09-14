/* The Dom Times — render briefing from data/today.json */
(function () {
  "use strict";

  const WEATHER_ICONS = {
    sun: "☀",
    cloud: "☁",
    fog: "〰",
    rain: "☂",
    storm: "⚡",
    snow: "❄"
  };

  function esc(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatMetaDate(isoHint) {
    // Dom's local edition: America/Chicago (Carpentersville / Chicago area)
    const opts = { timeZone: "America/Chicago" };
    const d = new Date();
    const weekday = d.toLocaleDateString("en-US", { ...opts, weekday: "long" }).toUpperCase();
    const month = d.toLocaleDateString("en-US", { ...opts, month: "long" }).toUpperCase();
    const day = d.toLocaleDateString("en-US", { ...opts, day: "numeric" });
    const year = d.toLocaleDateString("en-US", { ...opts, year: "numeric" });
    return `${weekday}, ${month} ${day}, ${year}`;
  }

  function renderMasthead(m, meta) {
    const dateStr = formatMetaDate(meta && meta.generated);
    return `
      <header class="masthead">
        <p class="tagline">${esc(m.tagline)}</p>
        <h1 class="masthead-title">${esc(m.title)}</h1>
        <div class="meta-rule" aria-label="Edition metadata">
          <span>VOL. ${esc(m.volume)}</span>
          <span>${esc(dateStr)}</span>
          <span>${esc(m.city)}</span>
          <span>AS OF ${esc(m.asOf)}</span>
        </div>
      </header>
    `;
  }

  function renderLead(lead) {
    const photo = lead.photo && lead.photo.show
      ? `<figure class="lead-photo" role="img" aria-label="${esc(lead.photo.alt || "Lead photo")}">
           <div class="lead-photo-inner">Photo placeholder</div>
         </figure>
         <p class="photo-caption">${esc(lead.photo.caption || "")}</p>`
      : "";
    return `
      <section class="lead">
        <h2 class="lead-headline">${esc(lead.headline)}</h2>
        <p class="lead-subhead">${esc(lead.subhead)}</p>
        <p class="byline">${esc(lead.byline || "By The Briefing Desk")}</p>
        ${photo}
      </section>
    `;
  }

  function renderArticles(articles) {
    const html = (articles || [])
      .map(
        (a) => `
      <article class="article">
        <h3 class="article-hed">${esc(a.hed)}</h3>
        <p class="article-deck">${esc(a.deck)}</p>
        <p class="article-body">${esc(a.body)}</p>
      </article>`
      )
      .join("");
    return `<div class="articles">${html}</div>`;
  }

  function renderWeather(w) {
    if (!w) return "";
    const unit = w.unit === "C" ? "°C" : "°F";
    const days = (w.days || [])
      .map(
        (d) => `
      <div class="weather-day">
        <span class="d-label">${esc(d.label)}</span>
        <span class="d-icon" aria-hidden="true">${WEATHER_ICONS[d.icon] || "·"}</span>
        <span class="d-temps">${esc(d.high)}° / ${esc(d.low)}°</span>
      </div>`
      )
      .join("");
    return `
      <div class="sidebar-block weather">
        <h2 class="section-label">Weather</h2>
        <p class="weather-loc">${esc(w.location)}</p>
        <p class="weather-temps">${esc(w.high)}${unit} <span class="low">/ ${esc(w.low)}°</span></p>
        <p class="weather-summary">${esc(w.summary)}</p>
        <div class="weather-days">${days}</div>
      </div>
    `;
  }

  function renderNeedsALook(items) {
    if (!items || !items.length) return "";
    const list = items
      .map((item) => {
        const isAction = String(item.type).toUpperCase() === "ACTION";
        return `<li>
          <span class="badge ${isAction ? "" : "fyi"}">${esc(item.type)}</span>
          <span>${esc(item.text)}</span>
        </li>`;
      })
      .join("");
    return `
      <div class="sidebar-block">
        <h2 class="section-label">Needs a Look</h2>
        <ul class="look-list">${list}</ul>
      </div>
    `;
  }

  function renderTimeline(rows) {
    if (!rows || !rows.length) return "";
    const body = rows
      .map(
        (r) => `
      <tr>
        <td class="col-time">${esc(r.time)}</td>
        <td>${esc(r.event)}</td>
        <td class="col-cat"><span class="cat-badge ${esc(r.category)}">${esc(r.category)}</span></td>
      </tr>`
      )
      .join("");
    return `
      <section class="today-section">
        <h2 class="section-label">Today</h2>
        <table class="timeline-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Event</th>
              <th class="col-cat">Category</th>
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </section>
    `;
  }

  function renderThisWeek(items) {
    if (!items || !items.length) return "";
    const list = items.map((i) => `<li>${esc(i)}</li>`).join("");
    return `
      <section class="week-section">
        <h2 class="section-label">This Week</h2>
        <ul class="week-list">${list}</ul>
      </section>
    `;
  }



  function renderOpeningBell(ob) {
    if (!ob) return "";
    const breath = ob.breathing || {};
    const phases = breath.phases || [];
    const phaseLegend = phases
      .map(
        (p, i) =>
          `<li class="breath-legend-item" data-phase-index="${i}">
            <span class="breath-legend-label">${esc(p.label)}</span>
            <span class="breath-legend-cue">${esc(p.cue || "")}</span>
          </li>`
      )
      .join("");

    const seconds = Number(breath.secondsPerPhase) || 4;
    const cycles = Number(breath.cycles) || 4;
    const phaseLabels = phases.map((p) => p.label || "").join("|");

    const breathingBlock = breath.title
      ? `
      <div class="bell-breathing">
        <h3 class="bell-subhed">${esc(breath.title)}</h3>
        <p class="bell-cycles">${esc(cycles)} rounds · ${esc(seconds)}s per side · pattern ${esc(breath.pattern || "4-4-4-4")}</p>
        <div class="breath-guide"
             id="breath-guide"
             data-seconds="${esc(seconds)}"
             data-cycles="${esc(cycles)}"
             data-start-label="${esc(breath.startLabel || "Start")}"
             data-pause-label="${esc(breath.pauseLabel || "Pause")}"
             data-idle-label="${esc(breath.idleLabel || "Ready")}"
             data-phase-labels="${esc(phaseLabels)}"
             aria-live="polite">
          <div class="breath-stage">
            <div class="breath-box" id="breath-box" data-state="idle" aria-hidden="true">
              <div class="breath-box-ring"></div>
              <div class="breath-box-fill"></div>
            </div>
            <div class="breath-hud">
              <p class="breath-phase" id="breath-phase">${esc(breath.idleLabel || "Ready")}</p>
              <p class="breath-count" id="breath-count">${esc(seconds)}</p>
              <p class="breath-meta" id="breath-meta">Round — / ${esc(cycles)}</p>
            </div>
          </div>
          <div class="breath-controls">
            <button type="button" class="breath-btn" id="breath-toggle">${esc(breath.startLabel || "Start")}</button>
            <button type="button" class="breath-btn breath-btn-ghost" id="breath-reset">Reset</button>
          </div>
          <ol class="breath-legend">${phaseLegend}</ol>
        </div>
        ${breath.close ? `<p class="bell-close">${esc(breath.close)}</p>` : ""}
      </div>`
      : "";
    const mindset = ob.mindset
      ? `
      <div class="bell-mindset">
        <h3 class="bell-subhed">${esc(ob.mindset.hed)}</h3>
        <p class="bell-mindset-body">${esc(ob.mindset.body)}</p>
      </div>`
      : "";
    if (!breathingBlock && !mindset) return "";
    const kicker = ob.kicker
      ? `<p class="bell-kicker">${esc(ob.kicker)}</p>`
      : "";
    const intro = ob.intro
      ? `<p class="bell-intro">${esc(ob.intro)}</p>`
      : "";
    return `
      <section class="bell-section" aria-label="${esc(ob.title || "The Opening Bell")}">
        <h2 class="section-label">${esc(ob.title || "The Opening Bell")}</h2>
        ${kicker}
        ${intro}
        <div class="bell-grid">
          ${breathingBlock}
          ${mindset}
        </div>
      </section>
    `;
  }

  /* Interactive 4-4-4-4 box-breath guide (newspaper aesthetic) */
  let breathController = null;

  function initBreathGuide() {
    const root = document.getElementById("breath-guide");
    if (!root) return;
    if (breathController && breathController.destroy) breathController.destroy();

    const seconds = Math.max(1, parseInt(root.dataset.seconds, 10) || 4);
    const maxCycles = Math.max(1, parseInt(root.dataset.cycles, 10) || 4);
    const startLabel = root.dataset.startLabel || "Start";
    const pauseLabel = root.dataset.pauseLabel || "Pause";
    const idleLabel = root.dataset.idleLabel || "Ready";
    const phaseLabels = (root.dataset.phaseLabels || "INHALE|HOLD|EXHALE|HOLD").split("|");
    const phaseStates = ["inhale", "hold-in", "exhale", "hold-out"];

    const box = document.getElementById("breath-box");
    const phaseEl = document.getElementById("breath-phase");
    const countEl = document.getElementById("breath-count");
    const metaEl = document.getElementById("breath-meta");
    const toggleBtn = document.getElementById("breath-toggle");
    const resetBtn = document.getElementById("breath-reset");
    const legendItems = root.querySelectorAll(".breath-legend-item");

    let running = false;
    let phaseIndex = 0;
    let cycle = 1;
    let remaining = seconds;
    let timerId = null;

    function setLegendActive(idx) {
      legendItems.forEach((el, i) => {
        el.classList.toggle("is-active", i === idx);
      });
    }

    function paint() {
      const label = phaseLabels[phaseIndex] || idleLabel;
      const state = phaseStates[phaseIndex] || "idle";
      if (phaseEl) phaseEl.textContent = running ? label : idleLabel;
      if (countEl) countEl.textContent = String(remaining);
      if (metaEl) metaEl.textContent = running
        ? `Round ${cycle} / ${maxCycles}`
        : `Round — / ${maxCycles}`;
      if (box) {
        box.dataset.state = running ? state : "idle";
        box.style.setProperty("--breath-seconds", seconds + "s");
      }
      setLegendActive(running ? phaseIndex : -1);
      if (toggleBtn) toggleBtn.textContent = running ? pauseLabel : startLabel;
    }

    function stopTimer() {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    }

    function advance() {
      remaining -= 1;
      if (remaining > 0) {
        paint();
        return;
      }
      // next phase
      phaseIndex += 1;
      if (phaseIndex >= phaseStates.length) {
        phaseIndex = 0;
        cycle += 1;
        if (cycle > maxCycles) {
          // finished
          running = false;
          stopTimer();
          phaseIndex = 0;
          cycle = 1;
          remaining = seconds;
          paint();
          if (phaseEl) phaseEl.textContent = "Complete";
          return;
        }
      }
      remaining = seconds;
      paint();
    }

    function start() {
      if (running) return;
      running = true;
      // if sitting at idle complete state, restart cleanly
      if (phaseEl && phaseEl.textContent === "Complete") {
        phaseIndex = 0;
        cycle = 1;
        remaining = seconds;
      }
      paint();
      stopTimer();
      timerId = setInterval(advance, 1000);
    }

    function pause() {
      running = false;
      stopTimer();
      paint();
    }

    function reset() {
      running = false;
      stopTimer();
      phaseIndex = 0;
      cycle = 1;
      remaining = seconds;
      paint();
    }

    function onToggle() {
      if (running) pause();
      else start();
    }

    toggleBtn && toggleBtn.addEventListener("click", onToggle);
    resetBtn && resetBtn.addEventListener("click", reset);

    paint();

    breathController = {
      destroy() {
        stopTimer();
        toggleBtn && toggleBtn.removeEventListener("click", onToggle);
        resetBtn && resetBtn.removeEventListener("click", reset);
      }
    };
  }


  function renderBodyOpener(bo) {
    if (!bo || !bo.moves || !bo.moves.length) return "";
    const moves = bo.moves
      .map(
        (m, i) => `
        <article class="body-move">
          <div class="body-move-num" aria-hidden="true">${i + 1}</div>
          <div class="body-move-copy">
            <h3 class="body-move-name">${esc(m.name)} <span class="body-move-reps">${esc(m.reps || "")}</span></h3>
            <p class="body-move-time">${esc(m.time || "")}</p>
            <p class="body-move-body">${esc(m.body || "")}</p>
          </div>
        </article>`
      )
      .join("");
    const kicker = bo.kicker
      ? `<p class="body-kicker">${esc(bo.kicker)}</p>`
      : "";
    const note = bo.note
      ? `<p class="body-note">${esc(bo.note)}</p>`
      : "";
    const dur = bo.duration
      ? `<span class="body-duration">${esc(bo.duration)}</span>`
      : "";
    const ref = bo.reference && bo.reference.url
      ? `<p class="body-ref"><a href="${esc(bo.reference.url)}" target="_blank" rel="noopener noreferrer">${esc(bo.reference.label || bo.reference.url)}</a></p>`
      : "";
    return `
      <section class="body-section" aria-label="${esc(bo.title || "3-Minute Opener")}">
        <h2 class="section-label">${esc(bo.title || "3-Minute Opener")} ${dur}</h2>
        ${kicker}
        ${note}
        <div class="body-circuit">${moves}</div>
        ${ref}
      </section>
    `;
  }

  function renderNews(news) {
    if (!news || !news.desks) return "";
    const deskOrder = ["ai", "nba", "nfl", "combat"];
    const desks = deskOrder
      .filter((k) => news.desks[k] && news.desks[k].items && news.desks[k].items.length)
      .map((k) => {
        const desk = news.desks[k];
        const items = desk.items
          .map((item) => {
            const source = item.source
              ? `<span class="news-source">${esc(item.source)}</span>`
              : "";
            const linkOpen = item.url
              ? `<a class="news-link" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">`
              : `<div class="news-link">`;
            const linkClose = item.url ? "</a>" : "</div>";
            return `
          <article class="news-item">
            ${linkOpen}
              ${source}
              <h4 class="news-hed">${esc(item.hed)}</h4>
              <p class="news-body">${esc(item.body)}</p>
            ${linkClose}
          </article>`;
          })
          .join("");
        return `
        <div class="news-desk">
          <h3 class="news-desk-title">${esc(desk.title)}</h3>
          <div class="news-items">${items}</div>
        </div>`;
      })
      .join("");
    if (!desks) return "";
    const kicker = news.kicker
      ? `<p class="news-kicker">${esc(news.kicker)}</p>`
      : "";
    return `
      <section class="news-section" aria-label="${esc(news.title || "News")}">
        <h2 class="section-label">${esc(news.title || "News")}</h2>
        ${kicker}
        <div class="news-desks">${desks}</div>
      </section>
    `;
  }

  function renderBrainFood(bf) {
    if (!bf || !bf.items || !bf.items.length) return "";
    const kicker = bf.kicker
      ? `<p class="brain-kicker">${esc(bf.kicker)}</p>`
      : "";
    const cards = bf.items
      .map(
        (item) => `
      <article class="brain-item">
        <h3 class="brain-hed">${esc(item.hed)}</h3>
        <p class="brain-body">${esc(item.body)}</p>
      </article>`
      )
      .join("");
    return `
      <section class="brain-section" aria-label="${esc(bf.title || "Brain Food")}">
        <h2 class="section-label">${esc(bf.title || "Brain Food")}</h2>
        ${kicker}
        <div class="brain-grid">${cards}</div>
      </section>
    `;
  }


  function shortAccount(account) {
    if (!account) return "";
    const a = String(account);
    if (a.includes("@")) {
      const local = a.split("@")[0];
      if (local.length > 14) return local.slice(0, 12) + "…";
      return local;
    }
    return a;
  }

  function renderInboxItems(items, badgeClass, badgeLabel) {
    if (!items || !items.length) return "";
    const lis = items
      .map((item) => {
        const acct = item.account
          ? `<span class="inbox-acct" title="${esc(item.account)}">${esc(shortAccount(item.account))}</span>`
          : "";
        const why = item.why
          ? `<span class="inbox-why">${esc(item.why)}</span>`
          : "";
        return `<li>
          <span class="badge ${esc(badgeClass)}">${esc(badgeLabel)}</span>
          <div class="inbox-copy">
            <span class="inbox-text">${esc(item.text)}</span>
            ${acct}${why}
          </div>
        </li>`;
      })
      .join("");
    return `<ul class="inbox-list">${lis}</ul>`;
  }

  function renderInboxSummary(summary) {
    if (!summary) return "";
    const hasAny =
      (summary.urgent && summary.urgent.length) ||
      (summary.needsLook && summary.needsLook.length) ||
      (summary.fyi && summary.fyi.length);
    if (!hasAny && !summary.cleanupNote) return "";

    const asOf = summary.asOf
      ? `<p class="inbox-asof">As of ${esc(summary.asOf)}</p>`
      : "";
    const urgentBlock = summary.urgent && summary.urgent.length
      ? `<div class="inbox-tier">
          <h3 class="inbox-tier-label">Urgent</h3>
          ${renderInboxItems(summary.urgent, "urgent", "URGENT")}
        </div>`
      : "";
    const lookBlock = summary.needsLook && summary.needsLook.length
      ? `<div class="inbox-tier">
          <h3 class="inbox-tier-label">Needs Look</h3>
          ${renderInboxItems(summary.needsLook, "", "LOOK")}
        </div>`
      : "";
    const fyiBlock = summary.fyi && summary.fyi.length
      ? `<div class="inbox-tier">
          <h3 class="inbox-tier-label">FYI · Receipts &amp; Money</h3>
          ${renderInboxItems(summary.fyi, "fyi", "FYI")}
        </div>`
      : "";
    const note = summary.cleanupNote
      ? `<p class="inbox-cleanup">${esc(summary.cleanupNote)}</p>`
      : "";

    return `
      <section class="inbox-section" aria-label="${esc(summary.title || "Quick Inbox Summary")}">
        <h2 class="section-label">${esc(summary.title || "Quick Inbox Summary")}</h2>
        ${asOf}
        <div class="inbox-grid">
          ${urgentBlock}
          ${lookBlock}
          ${fyiBlock}
        </div>
        ${note}
      </section>
    `;
  }

  function todoStorageKey(id) {
    return "domTimes.todo." + id;
  }

  function renderTodo(todo) {
    if (!todo || !todo.items || !todo.items.length) return "";
    const kicker = todo.kicker
      ? `<p class="todo-kicker">${esc(todo.kicker)}</p>`
      : "";
    const items = todo.items
      .map((item) => {
        const id = item.id || item.text;
        let checked = !!item.done;
        try {
          const stored = localStorage.getItem(todoStorageKey(id));
          if (stored === "1") checked = true;
          if (stored === "0") checked = false;
        } catch (_) { /* private mode */ }
        const pri = item.priority
          ? `<span class="todo-pri ${esc(item.priority)}">${esc(item.priority)}</span>`
          : "";
        return `
        <li class="todo-item${checked ? " is-done" : ""}">
          <label>
            <input type="checkbox" data-todo-id="${esc(id)}" ${checked ? "checked" : ""} />
            <span class="todo-text">${esc(item.text)}</span>
          </label>
          ${pri}
        </li>`;
      })
      .join("");
    return `
      <section class="todo-section" aria-label="${esc(todo.title || "To-Do")}">
        <h2 class="section-label">${esc(todo.title || "To-Do")}</h2>
        ${kicker}
        <ul class="todo-list">${items}</ul>
      </section>
    `;
  }

  function initTodoCheckboxes() {
    document.querySelectorAll(".todo-list input[type=checkbox][data-todo-id]").forEach((box) => {
      box.addEventListener("change", () => {
        const id = box.getAttribute("data-todo-id");
        const li = box.closest(".todo-item");
        try {
          localStorage.setItem(todoStorageKey(id), box.checked ? "1" : "0");
        } catch (_) { /* ignore */ }
        if (li) li.classList.toggle("is-done", box.checked);
      });
    });
  }

  function renderGrimoire(g) {
    if (!g || (!g.body && !g.hed)) return "";
    const kicker = g.kicker
      ? `<p class="grimoire-kicker">${esc(g.kicker)}</p>`
      : "";
    const source = g.source
      ? `<p class="grimoire-source">${esc(g.source)}</p>`
      : "";
    const hed = g.hed ? `<h3 class="grimoire-hed">${esc(g.hed)}</h3>` : "";
    const body = g.body ? `<p class="grimoire-body">${esc(g.body)}</p>` : "";
    const practice = g.practice
      ? `<p class="grimoire-practice"><span class="grimoire-practice-label">Practice</span> ${esc(g.practice)}</p>`
      : "";
    return `
      <section class="grimoire-section" aria-label="${esc(g.title || "Grimoire")}">
        <h2 class="section-label">${esc(g.title || "Grimoire")}</h2>
        ${kicker}
        ${source}
        <article class="grimoire-card">
          ${hed}
          ${body}
          ${practice}
        </article>
      </section>
    `;
  }


  function renderTechDemo(td) {
    if (!td) return "";
    const title = td.title || "Tech Demo";
    const kicker = td.kicker
      ? `<p class="tech-demo-kicker">${esc(td.kicker)}</p>`
      : "";
    const pick = td.pick ? `<p class="tech-demo-pick">${esc(td.pick)}</p>` : "";
    const author = td.author
      ? `<p class="tech-demo-author">${esc(td.author)}</p>`
      : "";
    const primaryLabel = td.linkLabel || "Open demo / source";
    const primary =
      td.url
        ? `<a class="tech-demo-cta" href="${esc(td.url)}" target="_blank" rel="noopener noreferrer">${esc(primaryLabel)}</a>`
        : "";
    const secondary =
      td.bookmarkUrl
        ? `<a class="tech-demo-secondary" href="${esc(td.bookmarkUrl)}" target="_blank" rel="noopener noreferrer">From your X bookmark</a>`
        : "";
    const links =
      primary || secondary
        ? `<p class="tech-demo-links">${primary}${secondary}</p>`
        : "";
    const note = td.note ? `<p class="tech-demo-note">${esc(td.note)}</p>` : "";
    const skipped = td.skipped
      ? `<p class="tech-demo-skipped">${esc(td.skipped)}</p>`
      : "";
    return `
      <section class="tech-demo-section" aria-label="${esc(title)}">
        <h2 class="section-label">${esc(title)}</h2>
        ${kicker}
        <article class="tech-demo-card">
          ${pick}
          ${author}
          ${links}
          ${note}
          ${skipped}
        </article>
      </section>
    `;
  }

  function renderMoneyDesk(md) {
    if (!md || !md.items || !md.items.length) return "";
    const list = md.items.map((i) => `<li>${esc(i)}</li>`).join("");
    const kicker = md.kicker
      ? `<p class="money-desk-kicker">${esc(md.kicker)}</p>`
      : "";
    return `
      <section class="money-desk-section" aria-label="${esc(md.title || "Later / Admin")}">
        <h2 class="section-label">${esc(md.title || "Later / Admin")}</h2>
        ${kicker}
        <ul class="money-desk-list">${list}</ul>
      </section>
    `;
  }

  function renderFooter(online) {
    const cls = online ? "" : " offline";
    const label = online ? "Online · cached for offline" : "Offline · showing cached edition";
    return `
      <footer class="footer-note">
        <span class="offline-dot${cls}" aria-hidden="true"></span>
        ${label} · The Dom Times · All the news that fits your morning
      </footer>
    `;
  }

  function render(data) {
    const app = document.getElementById("app");
    const isExample = data._meta && (data._meta.source === "example" || /EXAMPLE/i.test(data._meta.note || ""));
    const banner = isExample
      ? `<div class="example-banner" role="status">Example edition — replace data/today.json with live briefing</div>`
      : "";

    app.innerHTML = `
      ${banner}
      ${renderMasthead(data.masthead || {}, data._meta)}
      ${renderLead(data.lead || {})}
      <div class="main-grid">
        ${renderArticles(data.articles)}
        <aside class="sidebar">
          ${renderWeather(data.weather)}
          ${renderNeedsALook(data.needsALook)}
        </aside>
      </div>
      ${renderOpeningBell(data.openingBell)}
      ${renderBodyOpener(data.bodyOpener)}
      ${renderNews(data.news)}
      ${renderBrainFood(data.brainFood)}
      ${renderGrimoire(data.grimoire)}
      ${renderTimeline(data.timeline)}
      ${renderThisWeek(data.thisWeek)}
      ${renderInboxSummary(data.inboxSummary)}
      ${renderTodo(data.todo)}
      ${renderMoneyDesk(data.moneyDesk)}
      ${renderTechDemo(data.techDemo)}
      ${renderFooter(navigator.onLine)}
    `;
    initBreathGuide();
    initTodoCheckboxes();
  }

  function showError(msg) {
    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="error-state">
        <h2>Edition Unavailable</h2>
        <p>${esc(msg)}</p>
        <p style="font-size:0.8rem;color:#666;">Check that <code>data/today.json</code> is present, then reload.</p>
      </div>
    `;
  }

  async function load() {
    try {
      const res = await fetch("data/today.json", { cache: "no-cache" });
      if (!res.ok) throw new Error(`Could not load today.json (${res.status})`);
      const data = await res.json();
      render(data);
    } catch (err) {
      showError(err.message || "Failed to load briefing data.");
    }
  }

  function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    // Only register when served over http(s) — file:// cannot use SW
    if (location.protocol === "file:") return;
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* silent — preview still works without SW */
    });
  }

  window.addEventListener("online", () => {
    const dot = document.querySelector(".offline-dot");
    const foot = document.querySelector(".footer-note");
    if (dot) dot.classList.remove("offline");
    if (foot) {
      foot.innerHTML = `<span class="offline-dot" aria-hidden="true"></span> Online · cached for offline · The Dom Times · All the news that fits your morning`;
    }
  });

  window.addEventListener("offline", () => {
    const dot = document.querySelector(".offline-dot");
    const foot = document.querySelector(".footer-note");
    if (dot) dot.classList.add("offline");
    if (foot) {
      foot.innerHTML = `<span class="offline-dot offline" aria-hidden="true"></span> Offline · showing cached edition · The Dom Times · All the news that fits your morning`;
    }
  });

  load();
  registerSW();
})();
