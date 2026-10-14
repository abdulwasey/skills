# Audit checklist

The lens every auditor applies. Scope per flow: design inconsistencies,
alignment, font, spacing, readability/contrast, touch targets, and network
behaviour. One flow at a time.

## Check known recurring findings first

Before the general pass, check the findings that earlier flows already turned
up. Typical members of this list once an audit has run a while:

- A "danger"/"error" text token that fails AA on the app background, where a
  darker foreground variant exists and should be used.
- A "muted" grey on small copy that sits just under 4.5:1.
- Inputs, menus or native controls dropping the brand font for the system font.
- The current user's profile (or another app-wide resource) re-fetched on every
  screen instead of shared from the cache.
- A hook that walks an entire paginated collection serially, or polls a large
  page on a timer.

Report each as PRESENT or ABSENT with the screen that shows it.

## Readability

- No text clipped, truncated mid-word, or overlapping, at any viewport or
  dynamic-type size you test.
- Truncation, where intended, uses an ellipsis and keeps the meaningful part.
- Line length on wide screens stays readable (roughly 45-90 characters).
- Visual hierarchy: one clear primary action per screen; headings distinguishable.

## Contrast (WCAG 2.x AA)

| Content | Minimum |
|---|---|
| Body and small text | 4.5:1 |
| Large text (≥24px regular, ≥18.66px bold) | 3:1 |
| UI components, icons that carry meaning, focus indicators | 3:1 |

Compute it; never eyeball it. Use the **actual background** the text sits on
(a card, a chip, a tinted row), not the page background.

```
channel c (0-255) → s = c/255
lin = s <= 0.04045 ? s/12.92 : ((s+0.055)/1.055)^2.4
L = 0.2126 R + 0.7152 G + 0.0722 B          (using lin values)
ratio = (L_lighter + 0.05) / (L_darker + 0.05)
```

Report: `#RRGGBB on #RRGGBB = N.NN:1 (needs 4.5:1)`, and suggest the nearest
existing token that passes.

## Font

- One family (or the documented pair) everywhere, including inputs,
  placeholders, menus, tooltips, and native controls.
- Weights come from the type scale. In React Native, a raw `fontWeight` on a
  custom font can silently fall back to regular (notably on Android, where each
  weight is usually a separate font file); use the per-weight font family.
- Sizes come from the type scale; flag one-offs.

## Alignment

- Repeated rows line up: avatars, titles, timestamps, badges, trailing actions.
- Text baselines align across adjacent columns.
- Icons are optically centred in their buttons.

## Spacing and radii

- Every margin, padding, gap and radius comes from the design tokens. Flag each
  one-off value with its `file:line`.
- Equal things get equal spacing: list gaps, card padding, section gaps.
- Measure, don't eyeball: read computed styles / bounding boxes (web) or the
  source values (native) and report `element | expected token | actual | match`.

## Touch targets

- iOS ≥44×44 pt, Android ≥48×48 dp, web ≥24×24 CSS px (WCAG 2.2 minimum;
  44×44 is the comfortable target).
- Small icons can keep their visual size with a larger hit area (`hitSlop`,
  padding).

## Mobile specifics

- Text inputs on iOS web need a font size of at least 16px, or Safari zooms on focus.
- Fixed headers, tab bars and bottom buttons respect safe-area insets.
- Check the narrowest supported width (375 px) first; most overflow bugs show
  up there.

## Screen states

- Every async screen has loading, empty, error and populated states.
- Loading uses skeletons shaped like the content, or copy that names what is
  loading, rather than a bare spinner.

## Responsive (web)

- Check 375, 834 and 1440 px. Nothing overflows horizontally; no dead
  half-screen layouts on desktop; modals fit on phone widths.

## Network and performance

- Duplicate or repeated identical requests on one screen.
- Serial request chains that could run in parallel or be batched.
- Requests firing before they're needed, or on every keystroke (missing debounce).
- Polling a large page on a timer; walking a whole paginated collection.
- App-wide data (current user, settings) re-fetched per screen instead of cached.
- Polling that keeps running under screens that don't show the polled data.
- Aim for one request (or one parallel batch) per screen; no N+1 per row.
- Time to first meaningful paint; visible stalls; layout shift when data lands.
- Console errors and warnings on load.

## Rules of engagement

- Plain screenshots, no annotation.
- Never type credentials. The operator signs in.
- Do not persist edits, sign out, or confirm any dialog.
- Do not run git or switch branches.
