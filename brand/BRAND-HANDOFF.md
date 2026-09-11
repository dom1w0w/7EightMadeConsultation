# Brand handoff — 7EightMade Option A

**For:** Web Architect (wire nav / favicon / OG, merge to Pages)  
**Do not push from this box** — parent ships.

## Proverb

**Fall 7 rise 8** (七転び八起き) — fall down seven times, get up eight.  
Resilience is the brand: the oversized **7** is the fall; **Eight** + **MADE** is the rise and the craft.

## Locked design — Option A (horizontal)

Horizontal lockup on transparent (or sand preview):

1. Oversized cobalt `#2563FF` numeral **7** — Fraunces display (outlined paths), ball-terminal editorial serif  
2. Word **Eight** — ink `#0B0B0F` Fraunces serif, capital E + lowercase ight, optically centered to the right of the 7  
3. Small rounded **MADE** badge — cobalt fill, white uppercase Inter-style sans with tracking, thin white inset stroke, vertically centered to Eight  

**No** cube, **no** gold, **no** interlocking 78 monogram.

## Assets

| File | Use |
|------|-----|
| `brand/logo-horizontal.svg` | Full lockup (transparent). **Nav / headers.** |
| `brand/logo-horizontal-sand.svg` | Same lockup on sand `#F3EFE6` rect — previews / decks |
| `brand/mark.svg` | App / intro icon: cobalt rounded square + sand **7** only |
| `brand/favicon.svg` | Same as mark |
| `brand/logo-A-final-preview.png` | Raster preview of sand lockup |
| `brand/logo-A-horizontal.png` | Locked design reference (mock) |
| `index.html` | Live reference: nav = horizontal lockup; intro/footer = mark |

## Colors

| Token | Hex | Role |
|-------|-----|------|
| Cobalt | `#2563FF` | 7, MADE badge, mark field |
| Ink | `#0B0B0F` | Eight wordmark |
| Sand / paper | `#F3EFE6` | Surfaces, mark glyph, sand preview |
| White | `#FFFFFF` | MADE type + badge inset stroke |

## Usage

| Context | Asset |
|---------|--------|
| **Nav** | `logo-horizontal.svg` (7 + Eight + MADE). On viewports ≤400px hide MADE / use compact 7+Eight. |
| **Intro icon / favicon / app** | `mark.svg` / `favicon.svg` |
| **Footer** | Small mark + text wordmark (reference HTML) |
| **OG / social** | Prefer rasterizing sand lockup or mark — paths are already outlined (no live font dependency) |

## Technical notes

- Production SVGs use **outlined Fraunces / Inter paths** (no `@import` fonts required).  
- Mark corner radius **22** on a **100×100** viewBox (~22%).  
- Glyph in mark: sand `#F3EFE6` (not the older `#FBF8F2` surface token).  
- Reference HTML sprites: `#brand-mark`, `#brand-lockup` (see `index.html`).

## Mobile pass (site)

- Nav lockup scales down; ≤400px swaps to compact (no MADE badge)  
- Intro mark scales 140 → 112 → 88px  
- Existing drawer / touch-target / safe-area rules unchanged  

## Note for OG

Rasterize `logo-horizontal-sand.svg` or `mark.svg` for `og:image`. Outlined paths are OG-safe.
