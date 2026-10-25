# Lucento logo — Rising Crest

Vector rebuild of the Rising Crest reference (`reference/rising-crest-reference.png`):
three leaf-cut bars in Lucento Blue, Sky Blue and Gold, an Orange dot, and a Manrope
Bold wordmark. The symbol and wordmark are separate assets; lockups combine them.

## Files

| Folder | Contents |
|--------|----------|
| `symbol/` | `light`, `dark` (same artwork; use on light or dark grounds), `mono` and `outline` (`currentColor`), `small` and `small-mono` (16–24 px cut with wider gaps and a larger dot) |
| `wordmark/` | `lucento` lowercase and `LUCENTO` caps, each in navy, white and `currentColor`, converted to outlines |
| `lockup/` | Horizontal (light, dark), horizontal caps (light), stacked (light, dark) |
| `android/` | Adaptive-icon foreground and monochrome layers, legacy launcher PNGs, Play Store 512 px |

## Colours (logo artwork only)

| Part | Hex |
|------|-----|
| Bar 1 | `#154DFD` |
| Bar 2 | `#61AEFD` |
| Bar 3 | `#FECA45` |
| Dot | `#FDA81B` |
| Wordmark | `#17233F` (Midnight Navy) on light, `#FFFFFF` on dark |

These are sampled from the reference and are the logo's own colours. Don't recolour
them to match UI tokens, and don't add gradients or effects.

## Usage

- Below 32 px, use `symbol/lucento-symbol-small*.svg`; the standard cut's gaps close up.
- Clear space: at least the height of the dot on every side.
- Minimum sizes: symbol 16 px (small cut); horizontal lockup 24 px tall.
- The wordmark has letter-spacing applied but no hand kerning yet; review before print.
