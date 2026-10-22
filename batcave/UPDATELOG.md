# BATCAVE UPDATE LOG

## 2026-10-22 — Core Burn moves renamed to stick versions
- Core Burn steps renamed to match the workout-log app (Dom's pick): Plank Hold → Stick Plank Crush (high plank, hands crushing the pills into the floor), Mountain Climbers → Stick Climbers (high plank on the pills as handles). Cues + mechanics updated (climbers now grip); sets/durations unchanged.

## 2026-10-21 — Core Burn session added + Inferno rebuilt
- New `core` session (6th picker button, ~4 min): Core Burn circuit ×3 rounds — Plank Hold 30s → Mountain Climbers 20s → Russian Twist (Stick Loaded) 20/side, 15s rests between rounds. Mirrors the Core Burn finisher added to the workout-log app the same night (adapted from an IG reel by @khodor_kataya — plank / climbers / twists, 3 rounds).
- Inferno rebuilt to match the app's new Inferno: 6 RipStick stations × 30s work / 15s rest = 4:15 (was a 2:00 tabata) — Push Pulls → Front Clips → Back Clips → Overhead Press → Squat to Press → Russian Twist. Button now reads "4:15 CIRCUIT".

## 2026-10-21 — Posture Reset session added to workout page
- New `posture` session (5th picker button, ~5 min): Wall Angels 3×10 slow (3s up / 3s down) + a 30s reset step.
- Mirrors the Posture Reset daily add-on added to the workout-log app the same night (adapted from an IG reel by @swolotips — wall angels daily for 30 days; cues: back flat, ribs down, wrists glued, wrist lifting off = broken rep; 4-week arc Wk1 contact → Wk2 chest opens → Wk3 scapula set → Wk4 full range).
- Daily habit positioning: stacks onto any day; other sessions untouched.

## 2026-10-21 — Forearm Flush session added to workout page
- New `flush` session (4th picker button, ~15 min): Pronated Stick Curl 3×15 → Stick Dead-Hold 3×40s → Towel-Grip Stick Hold 3×30s → Rice-Bucket Wrist Stir 3×30s → Fingertip Push-Ups 3×8–12, 30s rests between moves. 15 sets.
- Mirrors the Forearm Flush finisher added to the workout-log app the same night (adapted from an IG reel by @fitybox — pronated curls, dead hangs, towel hangs, rice-bucket drills, fingertip push-ups, rebuilt for the RipStick).
- Finisher positioning kept: stacks after any session; Full/Quick/Inferno untouched.

## 2026-10-19 — Batcave-native workout page (nothing locked)
- Built `workout.html`: static guided workout player in terminal aesthetic, so the BAT COMPUTER now links every page — zero [LOCKED] rows.
- Sessions: Full (~30 min — warm-up, 3×12 Push Pulls / 3×10 Front+Back Clips, 60s rests, 60s finisher, cooldown), Quick (~10 min compact version), Inferno (2:00 tabata — 4 rounds × 20s work / 10s rest).
- Coach-voice picker (Web Speech API), background sounds via Web Audio API — ticks at 60/80/100/120 BPM, monotone drone, off. No external files.
- Animated two-pills-and-band SVG diagram (Grip / Pull / Push mechanics), tap-to-advance sets (spacebar works too), timed-step skip, 1–10 effort logging, localStorage history + day streaks.
- `#_bcnav` strip included with all 5 links (Workout = current). Bat computer `workout-log` [LOCKED] row replaced with live [OPEN] → workout.html.
- Note: the private fullstack workout-log artifact was not touched; this page saves effort data on-device only.

## 2026-10-18 — Dom Times linked in bat computer
- Dom Times found: private GitHub repo `dom1w0w/dom-times-private` ("The Dom Times — full private edition", Vol XLV, 11 commits). The earlier API check missed it because the token couldn't see private repos; verified via signed-in browser session.
- Bat computer `dom-times` row switched from [PENDING] to a live [OPEN] link → https://github.com/dom1w0w/dom-times-private (opens in new tab; requires GitHub sign-in since the repo is private).

## 2026-10-18 — Bat computer added to hub
- Added a terminal-styled "BAT COMPUTER" command bar to `index.html`: one-line jumps to TIER 1, Broker Flashcards, and Hyperbolic Time Chamber.
- Workout Log listed as [LOCKED]: private fullstack artifact, not shared — no public or owner URL exists to link from static HTML.
- Dom Times listed as [PENDING]: no newspaper artifact exists in the artifact catalog.
- Terminal aesthetic kept (mono, dark + teal phosphor, blinking cursor); existing layout and app-page `_bcnav` strips untouched.

## 2026-10-18 — Hyperbolic Time Chamber wired in
- Exported v1.0 of the Hyperbolic Time Chamber (`hyperbolic-time-chamber.html`) into the batcave.
- Nav bars on all app pages refreshed: 4 links now (Batcave / TIER 1 / Flashcards / Time Chamber).
- Index unlocked: all three training apps live.

## 2026-10-18 — Batcave hub online
- Created the batcave hub: `index.html` with a table of contents linking to each training app.
- Added cross-page nav bar (`_batcave_nav`) to every app page — bounce between Index / TIER 1 / Flashcards / Hyperbolic Time Chamber from anywhere.
- Exported v1.0 snapshots of TIER 1 (`tier-1.html`) and Broker Flashcards (`broker-flashcards.html`) into the batcave folder.
- Hyperbolic Time Chamber: build in progress, wires into the hub on arrival.
- Note: these are v1.0 snapshots of the artifacts. If an artifact is edited later, re-export it here to keep the batcave current.

## 2026-10-19 — Workout first in table of contents
- Added WORKOUT as the first TABLE OF CONTENTS module in `index.html` (before TIER 1), with OPEN APP → workout.html. Per Dom: the workout is the first page to unlock.

## 2026-10-19 — Dom Times archive linked
- Bat computer: added `dom-times-archive` row → the repo's archive/ folder (11 JSON editions, Oct 8–19; no Oct 15). `dom-times` row still opens today's front page (README, Vol XLVI). Note: editions are raw JSON — the repo keeps Pages off by Dom's own rule, so there's no rendered site to link.

## 2026-10-19 — Dom Times bar points at the live unlock page
- `dom-times` bar row now opens the real private-edition front door: https://dom1w0w.github.io/7EightMadeConsultation/dom-times-live/ (passphrase unlock, "who's reading the paper?"). Replaces the GitHub repo link. `dom-times-archive` row still points at the repo's archive/ folder for the raw JSON editions.

## 2026-10-19 — Passphrase gate in the BAT COMPUTER
- The bar is now the terminal into the private pages: new `unlock dom-times` line (password input + [UNLOCK]) under the `open --all-pages` prompt, terminal-styled (amber prompt, teal input, square edges).
- Private rows are hidden by default (display:none): dom-times, dom-times-archive, plus new team (→ team-live/) and watch (→ dom-watch/) rows — the live page's own nav links.
- Unlock runs the live page's exact crypto: fetch data.enc.json (no-store), PBKDF2-SHA256 600k → AES-GCM-256, passphrase verbatim. Success → "access granted", rows revealed for the session, field cleared. Failure → "access denied — try again.", input shake, re-select. Button shows "deriving key…" while deriving.
- Security model matches his page: passphrase lives in a JS variable only (cleared after use), decrypted bytes discarded immediately (verify-only, nothing rendered/stored), reload re-locks, [lock] link re-hides manually. tier-1 / flashcards / time-chamber / workout stay always visible.

## 2026-10-19 — Batcave pushed live
- Published to GitHub Pages: https://dom1w0w.github.io/7EightMadeConsultation/batcave/ (all 5 pages + UPDATELOG.md). Verified live: title, BAT COMPUTER, and passphrase gate all present.
- The passphrase gate now runs in its proper environment: HTTPS (secure context for crypto.subtle) and same-origin fetch of data.enc.json.

## 2026-10-19 — Full-page entry gate + studio menu link
- Entry gate: the whole batcave now starts locked behind a full-page terminal overlay ("BAT COMPUTER // RESTRICTED ACCESS", "who's there?", passphrase + [UNLOCK]). Crypto refactored into one shared `BatcaveAuth.verify` (same PBKDF2-SHA256/AES-GCM-256 as dom-times-live, verify-only, nothing stored). Unlock fades the overlay and reveals the bat computer + table of contents; reload re-locks.
- The in-bar gate stays as the second layer: the 4 private rows (dom-times, dom-times-archive, team, watch) still need the in-bar passphrase after entry unlock.
- Studio nav: "Batcave" link added to the studio menu bar (studio/index.html → ../batcave/, studio/art/index.html → ../../batcave/).
