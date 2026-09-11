# Brand handoff — 7EightMade Signal mark

**For:** Web Architect (wire nav / favicon / OG, merge to Pages)  
**Do not push from this box** — parent ships.

## Assets

| File | Use |
|------|-----|
| `/workspace/7eight-redesign/brand/mark.svg` | Icon-only mark (100×100) |
| `/workspace/7eight-redesign/brand/logo-horizontal.svg` | Mark + Fraunces wordmark (420×100; text uses Google Fonts import — outline if needed for OG) |
| `/workspace/7eight-redesign/brand/favicon.svg` | Same geometry as mark |
| `/workspace/7eight-redesign/index.html` | Full live reference (sprite `#brand-mark` + mobile CSS) |

## Mark description

Geometric interlocking **7** + **8** monogram inside a **rounded square** (corner radius ≈ **22%** of size).

- **Fill:** cobalt `#2563FF`
- **Glyphs:** sand/surface `#FBF8F2`
- Flat / tech-editorial — **no cube, no gold, no gradients**
- Legible at **16px** and **140px**

## Wordmark

- Font: **Fraunces** 600
- Text: `7EightMade` with **7** in cobalt (`#2563FF`), rest ink (`#0B0B0F`)

## Sizes (CSS)

| Context | Class | Size |
|---------|-------|------|
| Nav | `.brand-mark--nav` | **32px** (28px ≤600px) |
| Footer | `.brand-mark--footer` | **22px** |
| Intro | `.brand-mark--intro` | **140px** → 112px @900 → 88px @600 |

Sprite in `index.html`: `<symbol id="brand-mark">` + `<use href="#brand-mark"/>`.  
Inline data-URI favicon already in reference HTML.

## Palette touchpoints

| Token | Hex |
|-------|-----|
| Cobalt | `#2563FF` |
| Ink | `#0B0B0F` |
| Sand surface (glyph) | `#FBF8F2` |
| Paper | `#F3EFE6` |

## Mobile pass (what changed)

- Hamburger → full-width drawer; Escape/link closes; CTA full-width ≥48px
- Hero title wrap + full-width stacked CTAs; chips wrap; card padding
- Proof: 3-col tablet → stacked left-align phone
- Side padding 24→16px; touch targets ≥44px (FAQ, buttons, footer links)
- OpenClaw compare rows stack; pricing/Team featured border kept
- Intro mark/wordmark scale; skip reachable + safe-area
- `scroll-margin-top: calc(var(--nav-h) + 12px)`; body `overflow-x: clip`
- Mentally validated for ~375 / 390 widths

## Note for OG

Prefer rasterizing `mark.svg` or outlined `logo-horizontal.svg` for `og:image` — live text in horizontal SVG depends on Fraunces loading.
