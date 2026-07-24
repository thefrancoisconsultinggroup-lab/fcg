# Colour Audit

## Source Signals

The production site is built with Divi and uses a mixture of theme defaults, brand colours and page-specific styling. CSS was inspected from the rendered home page and linked public stylesheets.

Meaningful repeated colours:

| Colour | Where observed | Approx. frequency | Likely role | Recommendation |
| --- | --- | ---: | --- | --- |
| `#1c1c62` | Divi/page styles | 21 | Brand navy / primary dark colour | Retain and refine as the core brand anchor |
| `#ffd265` | Page styles | 6 | Gold accent | Retain, deepen slightly for better light/dark contrast |
| `#ffffff`, `#fff` | Theme and sections | 44 | Light text/surfaces | Retain as light text/surface family |
| `#333`, `#666`, `#eee`, `#ddd` | Divi defaults/body styles | frequent | Theme neutrals | Replace with semantic neutrals in the new system |
| `#2ea3f2`, `#13badb`, `#326bff` | Divi/link/plugin defaults and accents | moderate | Theme/plugin blue accents | Mostly discard; not core to the premium leadership/wellness identity |
| `rgba(0,0,0,...)` | Overlays and Divi defaults | frequent | Overlay/shadow treatment | Retain as semantic overlays only |

## Proposed Refined Palette

| Role | Token/value | Notes |
| --- | --- | --- |
| Brand primary | `#1c1c62` | Directly connected to production site navy |
| Brand secondary / dark background | `#0d0e18` | Darkened navy-black for cinematic depth |
| Dark surface | `#15162a` | Navy-charcoal surface |
| Light background | `#f2efe7` | Warm cream from existing foundation |
| Light surface | `#f7f4ed` | Primary foreground on dark and soft surface |
| Primary text on dark | `#f7f4ed` | High contrast on navy-black |
| Secondary text on dark | `#b7b6ae` | Approx. accessible for large/supporting text |
| Primary text on light | `#17172b` | Navy ink, connected to brand primary |
| Secondary text on light | `#62645e` | Neutral body/supporting copy |
| Brand accent | `#d8b85f` | Refined from production `#ffd265`; less glaring, stronger premium gold |
| Supporting sage | `#8d9a87` | Retained from foundation for wellness tone |
| Supporting clay | `#a97862` | Retained for warmth and editorial accents |
| Borders | translucent foreground/ink | Use context-specific alpha borders |
| Focus ring | `#d8b85f` | Clear and brand-connected |

## Token Updates

Updated `src/app/globals.css`:

- `--background`: `#0d0e18`
- `--surface-dark`: `#15162a`
- `--ink`: `#17172b`
- `--muted-dark`: `#62645e`
- `--accent-gold`: `#d8b85f`

## Contrast Notes

Approximate key combinations:

- `#f7f4ed` on `#0d0e18`: strong contrast, suitable for body and headings.
- `#b7b6ae` on `#0d0e18`: suitable for secondary text.
- `#17172b` on `#f2efe7`: strong contrast for body text.
- `#62645e` on `#f2efe7`: acceptable for supporting copy at normal text sizes.
- `#17172b` on `#d8b85f`: strong CTA contrast.
- `#d8b85f` focus ring on dark surfaces: highly visible.

## Discarded Or Limited Colours

The production blues `#2ea3f2`, `#13badb` and `#326bff` appear more like Divi/theme defaults or isolated accents than core brand colours. They should not drive the new visual system.
