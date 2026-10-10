# Studio assets: what's where, and how to swap them

Everything here is plain files. No build step: replace a file, keep its name (or update the one
`src` noted below), commit, done.

## Hero figure, finale figure and stone fragments

Real stone cutouts by the Studio's graphic designer: transparent WebP, marble with an ember rim
light on the right edge. Full-size PNG masters are in `assets/masters/`.

| File | Used by | Size | Notes |
|---|---|---|---|
| `assets/figure.webp` | `studio/index.html` hero (`.hero__fig`) | 1200 × 2000 (3:5) | Marble statue rising from one knee on a rough stone base, one arm reaching up. Fills ~95% of the canvas height. |
| `assets/figure-finale.webp` | `studio/index.html` finale (`.finale__fig`, decorative) | 1200 × 2000 (3:5) | Standing figure, arms open in a V. The open arms made it fit by width, so it fills only ~76% of the canvas height; `home.css` scales it by `--fin-scale: 1.3` (height `calc(80% * 1.3)` desktop, `calc(54% * 1.3)` at ≤760 px) so it reads at hero scale. |
| `assets/shard-1.webp` | hero fragments | 371 × 408 | Stone chunk |
| `assets/shard-2.webp` | hero fragments | 260 × 328 | Stone chunk |
| `assets/shard-3.webp` | hero fragments | 468 × 154 | Long flat slab (`data-w="12"`) |
| `assets/shard-4.webp` | hero fragments | 186 × 428 | Tall sliver (`data-w="5"` back, `"4"` front) |
| `assets/shard-5.webp` | hero fragments | 296 × 348 | Stone chunk (`data-w="8"` back, `"14"` front) |

Not used: `assets/figure-alt.webp` (a cracked abstract alternate figure, kept for later).

The old placeholders (`assets/figure.svg`, `assets/shard-1.svg` … `shard-5.svg`) are still on disk
but nothing references them; they can be deleted later.

The hero headline ("Fall down 7", `.hero__big`) is `#DDCBB2`, a touch darker and warmer than the
`--ink` cream, so the figure's raised arm separates from "DOWN" where it crosses it.

### Swapping a figure or fragment

1. Export a **transparent WebP** (or PNG), about **1200 × 2000 px** for figures (3:5; anything
   from 3:5 to 1:2 works, the figure is sized by height). Keep the feet on the bottom edge and the
   head about 5% below the top. Aim for under 300 KB. If the pose is wide and the figure ends up
   filling less of the canvas height, compensate with `--fin-scale` (finale) or the `height` of
   `.hero__fig` in `home.css`.
2. Replace the file (same name), or change the `src` on `.hero__fig` / `.finale__fig` in
   `studio/index.html`, and update `width`/`height` to the new pixel size. Keep the hero `alt`
   text describing the real piece.
3. Fragments: transparent PNG/WebP, 150–500 px on the long side, under 40 KB each. Replace the
   `src` (and `width`/`height`) on the `<img class="frag">` tags. Each fragment's placement is set
   by data attributes:
   - `data-x` horizontal center, % of screen width
   - `data-y` starting height, % of screen height (100 = bottom edge)
   - `data-s` rise speed (screen heights travelled over the hero; back layer ~1–1.6, front ~2–2.7)
   - `data-r` rotation in degrees
   - `data-w` width, % of screen width (minimum 40 px back, 54 px front). Width sets the size, so
     tall pieces need a smaller `data-w` than chunky ones to look the same size.
   - `data-blur="1"` softens it (front layer only)
   Fragments inside `.frags--back` pass **behind** the figure; `.frags--front` pass **over** it.

## Featured tiles and index thumbnails

| File | Used by | Size |
|---|---|---|
| `img/feat-till.webp` | diamond tile + index card | 960 × 600 (16:10) |
| `img/feat-vortex-breath.webp` | diamond tile + index card | 960 × 600 |
| `img/feat-atlas.webp` | diamond tile + index card | 960 × 600 |
| `img/feat-dichotomy-zeno.webp` | index card | 960 × 600 |
| `img/feat-ship-of-theseus.webp` | index card | 960 × 600 |
| `art/drawing-03.webp`, `art/drawing-04.webp` | Art diamond tile / Art index card | from the art folder |

These are real headless-Chrome screenshots of each working app (taken Oct 10, 2026). Tiles are
rotated 45° and cropped to a diamond, so keep the important part near the center.

## App intro previews

Each intro page shows `preview.webp` from its own folder, 1280 × 800, a real screenshot of the app:
`till/preview.webp`, `vortex-breath/preview.webp`, `archipelago/preview.webp`,
`dichotomy-zeno/preview.webp`, `ship-of-theseus/preview.webp`. "More from the Studio" cards reuse them.
(Vortex Breath's intro shows the live quiet demo instead; its preview.webp is used on the cards.)

## Fonts

- `fonts/anton-regular.woff2`: Anton (condensed display), subset to Latin, self-hosted.
  SIL Open Font License 1.1, see `fonts/OFL-Anton.txt`.
- Fraunces and Inter come from `../brand/fonts.css`.

## Older files kept

`img/card-*.webp` and `og.png` are from the previous Studio page. `og.png` is still the share image;
the `card-*` files are no longer referenced and can be deleted later.
