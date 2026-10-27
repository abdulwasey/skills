---
name: mobile-ui-design
description: Use when creating or restyling a mobile app's visual system - deriving it from the brand's website and sibling products, setting palette, type, radius, spacing and elevation, and specifying core components (buttons, cards, lists, inputs, tabs, sheets, empty and loading states) - or when porting a legacy app's look and deciding what to keep. Not for admin web tools (see admin-ui-design), landing pages (see landing-page-design) or auditing a running app (see design-audit).
---

# Mobile UI Design

## Overview

A mobile app should look like it belongs to the same family as the brand's website and its sibling products, while feeling native. Don't invent a look. **Derive it from the sources**, cite each value's origin, and write the result down as one rule book the app is restyled to.

**Core principle:** flat and quiet, the brand colour only for actions, and colour otherwise only for status. Every value in the rule book comes from a named source, or has a written reason.

## When to Use

- Starting a new app's visual design, or restyling an existing one.
- The app looks unlike the website or the other products.
- Replacing a legacy app that users already know.

## 1. Gather the Sources

| Source | What it gives |
|---|---|
| **The brand source** (usually the website's tokens and components) | Palette, type families, button and card recipes |
| **A sibling product** (an admin tool, another app) and its `DESIGN.md` | Rules: status tones, spacing scale, weights, what's forbidden |
| **The legacy app** users know | Familiar patterns worth keeping, and mistakes not to repeat |

Give each source a short tag (WEB, ADMIN, OLD) and cite file and line for every value (`WEB globals.css:65`). When sources disagree, pick one, and say which and why.

Write down the **shared ideas** first. Usually:
- **flat and quiet:** hairline borders, no shadows at rest;
- **the brand colour is for actions only**;
- **colour means status.**

## 2. Palette

- **Light tokens:**
  - background and surface;
  - canvas (behind grouped lists);
  - surface-hover (pressed rows, filled search, segmented track);
  - ink, ink-secondary, and ink-muted (the lightest allowed text, AA on white);
  - hairline (every edge, 1px), a softer inner hairline, and field-border (inputs and outline buttons only);
  - primary and pressed;
  - brand text (the high-contrast shade for brand-coloured text on white);
  - a subtle primary background (selected tint, info pill, avatar fill).
- **Dark tokens** are designed, not inverted. Fix each value, and check contrast for text and brand text.
- **Status tones** come from the brand's hues, in the sibling product's soft-pill structure. Each tone has a fill, a text and a dot, in light and dark:
  - success, warning, danger, info or brand;
  - ongoing, neutral.

  Replace any status colours that belong to no brand palette.
- **Reserved colours:** write down any colour the brand restricts (a gold used only in the logo and ratings; a colour that belongs to one programme or product line). Never use them for buttons, badges or text.

## 3. Type

- **Families:** follow the brand. A display serif for page titles, section headings, card titles and prices, plus a neo-grotesk sans for UI and body is a strong default. If the brand's sans isn't available on mobile, use the closest familiar one.
- **Scale:** one table, in px with line heights.

  | Role | Spec |
  |---|---|
  | display | 30 / 34, serif 400 |
  | title | 28 / 32, serif |
  | detail title | 26, serif 500 |
  | section | 22, serif |
  | card title | 18 / 23, serif 500 |
  | row title | 16 / 22, sans 600 |
  | body | 15 / 22 |
  | small | 13 / 18 |
  | caption | 12 / 16 |
  | label | 13 / 600, sentence case, no uppercase |
  | badge | 11 / 600 |
  | buttons | 16, 15 or 13, all 600 |

- **Weights per view:** at most one serif weight plus two sans weights (400 and 600). Drop the rest. Bold only in numeric badges.
- **Numbers:** times, prices and counts use `tabular-nums`.
- **Other scripts:** runs in another script (Arabic, Hebrew, CJK) get their own face, size (around 1.3×) and line height (around 1.9× for Arabic), with RTL direction and alignment, in their own text block. Check that the display face renders the special characters you need, and set a fallback if it doesn't.

## 4. Shape, Spacing, Elevation

| Element | Radius |
|---|---|
| Content card | 16 |
| Panel, grouped list, info box, standalone image | 12 |
| Buttons, chips, badges, status pills, search | Full pill |
| Inputs | 12 |
| Sheets (top corners) | 20 |
| Avatars | Circle |
| Icon tiles | About 31% of size (squircle) |
| Chat bubbles | 18, with a small tail corner on the first of a run |

**Spacing:** one scale (4, 6, 8, 12, 16, 20, 24, 32, 48, 56):
- page gutter 16;
- card padding 16;
- 6 inside a text group and 12 between groups;
- 12 between stacked cards and 32 between sections;
- 12 from a heading to its content, and 6 from an icon to its label.

**Elevation:**
- **Cards are flat:** a 1px hairline and no shadow at rest. The pressed state is an opacity change or surface-hover.
- **Borders:** one 1px primary border marks a single selected or live state. Never a coloured or 2px border otherwise.
- **Shadows** only on floating layers: a FAB, menus and popovers, a segmented thumb, the chat composer.
- **Glass and blur** only for platform chrome: the tab bar, headers, sheets, and floating buttons over a hero image.

## 5. Components

| Component | Rule |
|---|---|
| **Primary button** | Pill, brand fill, 600. Three sizes: `lg` 48 for the one sticky CTA per screen, `md` 40 as the default, `sm` 32 in rows. 16 icons with a 6 gap |
| **Secondary** | Pill, 1px field-border outline, ink text. A brand outline only beside a primary |
| **Ghost** | Brand text 600, no fill, a 44 hit area |
| **Danger** | Outline with danger text. Confirm buttons stay primary |
| **Card** | Surface, hairline, radius 16, padding 16, no shadow |
| **Media card** | 16:9 image; a status dot pill on the image; an eyebrow; a serif title (2 lines); one meta line; a hairline footer with timing on the left and price on the right. No tag chips, no summary line |
| **Chips** | Only for filters. Never for tags, metadata or page sections |
| **Role marks** | Caption text after the name, with a small check icon in brand text. No colour per role |
| **Status pill** | On images, a white dot pill. In lists, the soft pill, 20 tall. Use the brand's status words |
| **List row** | Min 64 tall, avatar 44, gap 12; row title, a secondary line, a trailing caption. A hairline inset to the text start. Rows sit in one full-bleed surface block, not a card per row |
| **Section header** | Serif section title, with "See all" on the right |
| **Header** | Avatar 36 plus a serif title. Borderless icon buttons (44 hit, 22 icon). No hairline at rest: a top fade, or a hairline once scrolled |
| **Input** | 48 tall, radius 12, field-border, 16px text (no iOS zoom), label above, 2px primary focus, error text below |
| **Search** | Pill, 44, filled surface-hover, no border |
| **Tabs** | Underline tabs for page-level views (active ink 600 with a 2px bar) |
| **Segmented control** | 2–3 equal views inside a screen |
| **Empty state** | A 36 icon, a 17/600 title, one line (max ~280 wide), and one `md` primary if the viewer can fix it |
| **Skeleton** | Shaped like the final layout; bars radius 6, media radius 12, in surface-hover |
| **Avatar** | Circle at 24, 32, 44 or 56; initials 600 at 0.38× on the subtle primary background |
| **Price** | Detail: serif 32/600 tabular, a muted strikethrough, an instalment line. Card: sans 15/600. "Free" in success text |
| **Images** | One fixed ratio per media type (16:9 for courses or products). Post photos: one at 4:3, two or more as a square grid |
| **Sheet** | Native or glass, top radius 20, a 4×36 grabber, a 17/600 title, actions on the right above a hairline |

## 6. Porting a Legacy App

List what users love in the old app, ranked by how recognisable it is. For each item, say what it is, the files it lives in, and where it goes in the new app. Typical keepers:
- a signature visual element (icon tiles);
- a navigation habit (a rail of joined spaces);
- polished motion (a sliding tab bar, a heart burst on double-tap);
- feel (a haptic tick on tap, pressed opacity around 0.72);
- well-tuned chat bubbles and composer.

Also write a **Do not bring over** list: custom chrome the platform now does better (a hand-rolled tab bar), gradient washes, the old palette, heavy title weights.

## Write It Down

A `Design Rules.md` with:
- source tags;
- the three shared ideas;
- palette (light, dark, status, reserved);
- type (families, scale, weights, numbers, other scripts);
- shape, spacing and elevation;
- the components table, with a column per source and the final app rule;
- the ranked keep list and the "do not bring" list.

Restyle screens to it, one module at a time.

## Red Flags

- A value with no source and no reason.
- Shadows on resting cards, or glass on content.
- Brand colour on non-actions.
- A colour per category or role.
- A reserved colour used for UI.
- More than one serif weight, or bold body text.
- Chips used as tags.
- A card per list row.
- Inputs under 16px on iOS.
- Dark mode made by inverting.
