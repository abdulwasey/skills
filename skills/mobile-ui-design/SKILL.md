---
name: mobile-ui-design
description: Use when designing mobile app screens, mockups, a visual system or design variations for an iOS / Android / cross-platform app - palette, type, spacing, elevation, core components, navigation, states and accessibility - including deriving the look from a brand's website or sibling products, or deciding what to keep when replacing a legacy app. Not for admin web tools (admin-ui-design), landing pages (landing-page-design), app architecture (app-system-design) or auditing a running app (design-audit).
---

# Mobile UI Design

## Overview

A mobile app should feel native on each platform and belong to its brand. Design it in two layers:
- **Structure:** platform navigation, core components, states, touch, accessibility.
- **Look:** a token set derived from the brand's sources, or from a direction. Swapping it gives variations.

**Core principle:** every visual value comes from a named source or has a written reason, and every screen passes the accessibility gate.

[examples.md](examples.md) has one class-booking screen in three variations, a sourced palette, a component spec and a keep list for a legacy app.

## Process

1. **Gather the sources** that exist:
   - the brand (usually the website's tokens and components);
   - any sibling product and its rule book;
   - a legacy app that users know.

   Tag each source (WEB, ADMIN, OLD). Say which wins when they disagree, and why.
2. **Write the shared ideas first:** three or four lines on what the brand's products have in common, for example "flat surfaces, brand colour for actions, colour for status".
3. **Set the tokens** (palette, type, shape, spacing, elevation), citing a source or a reason for each. The rule book cites the source per token. File and line references go in an appendix.
4. **Specify the components and states,** then the screens.
5. **Make variations** where the direction is still open.
6. **Hand off,** then audit the built app with `design-audit`.

## Structure

### Platform navigation

- **iOS:** a tab bar for the top-level areas, navigation bars with large titles where they help, swipe-back, and sheets with detents.
- **Android:** a navigation bar or rail, top app bars, predictive back, and bottom sheets.
- **Cross-platform apps** keep the platform's navigation and back behaviour, and share content components.
- **Tablets and landscape:** a navigation rail or sidebar, split views, and content at a readable maximum width.

### Touch and sizing

- **Targets:** at least 44 × 44 pt on iOS and 48 × 48 dp on Android. A smaller visible control gets padding up to that size.
- **Units:** pt on iOS, dp and sp on Android.
- **Text scales** with the system setting (Dynamic Type, font scale). Layouts reflow at the largest sizes: rows grow, labels wrap, and horizontal groups stack.
- **Safe areas** are respected, and nothing important sits under the home indicator or the notch.

### Core components

| Component | Rule |
|---|---|
| Primary button | One per screen region. A full-width sticky bottom button for the screen's main action, or a standard button in content |
| Secondary / text button | Lower emphasis. Text buttons keep a full-size hit area |
| Destructive action | The platform's destructive style (iOS destructive role, Android error colour) and a confirmation that names the consequence |
| Card | A surface with a defined edge (border or elevation) |
| List row | A leading avatar or image, title, secondary line, trailing meta. Rows sit in a grouped or full-bleed list |
| Section header | A title, with an optional "See all" |
| Text field | A visible label, hint, error text below, the right keyboard type and autofill |
| Search | A platform search field |
| Tabs / segmented control | Tabs switch page-level views; a segmented control switches 2–4 equal views inside a screen |
| Chips | Filters and choices |
| Status | A word with a tone; tones are reserved for status |
| Sheet | A platform sheet with a grabber where the platform uses one, a title, and actions |
| Avatar | A circle, with an image or initials |
| Media card | The image at one fixed ratio per content type, title, one meta line |

Product components (prices, schedules, chat bubbles) get their own specs in the rule book.

### States

Every screen designs:
- first load (skeletons) and refresh (pull-to-refresh, with content kept);
- an error with Retry;
- offline, with cached content marked by age;
- empty, with the action that fixes it;
- saving, failed save (input kept), and pending sync;
- a permission request, and a permission-denied state with a route to Settings.

### Accessibility gate

Every screen passes before it's done:
- **Contrast:**
  - text 4.5:1 (3:1 for large text);
  - control boundaries, focus indicators and meaningful icons 3:1 against the surface they sit on.
- **Screen readers:** VoiceOver and TalkBack read every element with a name, role and state, in a sensible order. Grouped rows read as one item.
- **Large text:** the screen works at the largest text size.
- **Reduce Motion** replaces movement with fades. Haptics follow the system setting and always pair with a visible change.
- **Status and errors** use words as well as colour.

## Look

Set these tokens from the sources, or start from a direction:
- **Palette:**
  - light: background, surface, canvas, surface-pressed, ink, ink-secondary, ink-muted, border, primary, primary-pressed, brand-text, primary-subtle;
  - dark: its own set, designed and contrast-checked;
  - status tones (success, warning, danger, info, neutral): each a fill, a text and a dot, in light and dark, chosen for clear meaning first and brand harmony second;
  - reserved colours: any colour the brand limits to one use (a logo gold, a colour owned by one product line).
- **Type:**
  - one or two families, in a scale of named roles (display, title, section, card title, row title, body, small, caption, label);
  - each role mapped to the platform's text styles so it scales;
  - tabular figures for times, prices and counts.
- **Shape:** radius per element type (card, panel, button, input, sheet, avatar).
- **Spacing:** one scale, the page gutter, card padding, and the gaps between groups and sections.
- **Elevation:** which layers float (menus, sheets, a FAB, a composer) and what separates resting surfaces (borders, tone or elevation).

**Directions** to start from:

| | Calm | Editorial | Utility |
|---|---|---|---|
| Suits | Everyday apps, long reading | Content and brand-led apps | Fast, task-driven apps |
| Surfaces | Flat, hairline borders | Flat, generous imagery | Tonal surfaces, little decoration |
| Type | One sans | A display serif for titles, sans for UI | One sans, compact scale |
| Radius | 12–16 | 8–12 | 8 |
| Buttons | Pills | Pills or soft rectangles | Platform-standard |
| Colour | Brand on actions | Brand on actions and accents | Brand on actions and selection |

### Other scripts

- **Arabic and Hebrew** run right to left: mirror the layout, set text direction and alignment, use a face with good support, and allow extra line height (about 1.6–1.9× for Arabic).
- **CJK** stays left to right: use a face with full glyph coverage, allow around 1.5–1.7× line height, and turn off letter-spacing.
- **Check every display face** for the special characters the content uses, and set fallbacks.

## Variations

Keep the structure fixed and vary the look along named axes:

| Axis | Range |
|---|---|
| Direction | Calm · Editorial · Utility · the brand's own |
| Type | One sans · serif titles + sans · compact sans |
| Surfaces | Hairlines · tonal · elevation |
| Colour role | Actions only · accents · selection |
| Composition | Cards · grouped lists · full-bleed media |
| Density | Spacious · standard · compact |

- **Distinct:** each variation differs on at least two axes.
- **Named for its idea.**
- **Checked:** each one passes the accessibility gate.
- **Compared fairly:** shown side by side on the same device size and data, in light and dark, with one line each on when to pick it.

## Replacing a Legacy App

- **List what to keep, ranked by user value:** habits people rely on, recognisable signature elements, motion that helps orientation, and good feel (haptics, pressed states). For each item, note what it is, where it lives, where it goes in the new app, and how it adapts to the accessibility gate.
- **List what to leave behind:** custom chrome the platform now provides, decoration that fights the new look, and patterns that fail accessibility.

## Rule Book

A `DESIGN.md`, matching the format of the brand's other products, holds:
- the sources and the shared ideas;
- the tokens with their sources;
- platform navigation;
- a spec per component: variants, sizes, states, platform differences, screen-reader behaviour, do and don't;
- the states and the accessibility gate;
- the legacy keep and leave lists.

## Handoff

For each screen:
- behaviour at the smallest phone, the largest phone, tablet and landscape, and at the largest text size;
- light and dark;
- every state;
- edge cases: long names, long translations, missing images, slow networks;
- motion: trigger, duration, easing, and the Reduce Motion version;
- screen-reader order.

## Review Checklist

- [ ] Every token has a source or a reason.
- [ ] Platform navigation and back behaviour on each platform.
- [ ] Targets 44pt / 48dp; platform units; text scales and reflows.
- [ ] All states, including offline, failed save and permission denied.
- [ ] Contrast for text and controls; screen-reader order; Reduce Motion.
- [ ] Status tones reserved for status, always with words.
- [ ] Light and dark designed.
