# Whale Café design guide

The look is a **cartoon sticker** style built around the café's mascot, a small beluga (白鲸). It should feel
hand-made and playful, like stickers on a café counter, not like a generic app template.

## Do

- **Outlines and hard shadows.** Interactive surfaces are "stickers": `border-toon border-ink` (2.5px) and an offset
  shadow (`shadow-toon`, `shadow-toon-sm`). Pressing a button moves it into its shadow (`toon-press`, `toon-btn`).
- **Flat colours from the palette** (defined as CSS variables in `src/app/globals.css`, so dark mode swaps them):

  | Token    | Use                                    |
  |----------|----------------------------------------|
  | `ink`    | outlines and text (dark coffee)        |
  | `cream`  | page background, with the `dots` pattern |
  | `paper`  | stickers and cards                     |
  | `butter` | primary buttons, price tags, markers   |
  | `whale`  | the beluga's water, secondary chips    |
  | `mint`   | open / done                            |
  | `blush`  | cheeks, soft highlights                |
  | `tomato` | sale tags, warnings, destructive       |
  | `latte`  | photo backdrops, cups                  |

- **Two typefaces.** `font-toon` (ZCOOL KuaiLe, self-hosted via `@fontsource/zcool-kuaile`) for headings, item
  names, prices and buttons. The system font for body text, so long text stays easy to read.
- **The mascot** (`core-components/Beluga.tsx`) appears where the app talks to the user: the home page greeting,
  empty carts (`mood="sleepy"`) and finished orders (`mood="cheer"`). Use it for a reason, not as decoration on
  every screen.
- **Hand-drawn details:** `marker` highlights a heading word, `Squiggle` draws water or a divider, dashed rules
  separate sections inside a sticker. Slight rotations (±1–2°) on a few stickers are fine; most stay straight.
- **Round product photos** with an ink outline, and price tags (`price-tag`) that look like stickers.
- **Write like the café talks.** Short, warm, specific copy ("托盘空空的，挑一杯喜欢的吧～"), never filler.

## Don't

- No gradients, glassmorphism, glows, blurred blobs or soft drop shadows.
- No emoji as icons or bullets; use `react-icons` inside an outlined circle.
- No generic "hero + three feature cards" layouts, and no identical card grids everywhere.
- Don't introduce new colours outside the palette, or new fonts.
- Don't rely on hover-only information (popovers); the app is mostly used on phones.

## Accessibility

- Text on `butter` is always dark ink (`text-[#4a2511]`), which keeps contrast in both themes.
- Every decorative SVG is `aria-hidden`; animations stop under `prefers-reduced-motion`.
