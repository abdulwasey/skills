---
name: admin-ui-design
description: Use when designing a page, flow, mockup, component or design variations for an internal staff or admin tool (CRM, back office, ops console) - page structure, tables, filters, forms, editing, permissions, data states, copy and visual direction - or when writing that tool's DESIGN.md. Not for public marketing pages (landing-page-design), mobile apps (mobile-ui-design), frontend architecture (web-system-design), code review (react-review) or auditing a running UI (design-audit).
---

# Admin UI Design

## Overview

Staff tools are used all day by people who know them well. Design them in two layers:
- **Structure:** page types, shared components, data states, forms, keyboard use. It stays the same from one look to the next.
- **Look:** a token set, derived from the brand or from a direction. It can be swapped freely, so one page can be explored in many variations.

**Core principle:** start from the real page and the shared components, and change only what's new.

[examples.md](examples.md) has one members page in three variations, bad → good fixes, state copy, a component spec and a rule-book opening.

## Process

1. **Start from the real page,** or the closest existing one. On a new tool, pick a direction and write its tokens first.
2. **Name the page type** and list the shared components you'll use. For a need no component covers, write a proposal: the problem, the closest components, and the gap.
3. **Use the words staff use,** from a glossary that keeps similar terms apart (membership vs pass).
4. **Write a short plan:** page type, components, states, and the one primary action. Check that it answers this task specifically.
5. **Design the structure, then the look, then any variations.**
6. **Hand it off** with the details in [Handoff](#handoff), then audit the built page with `design-audit`.

## Structure

### Page types

| Type | For | Shape |
|---|---|---|
| List | Browsing and comparing records | A header band (title, one primary action, tabs, toolbar), then a table panel |
| Detail | One record | A record header (name, status, key facts, actions, ⋯ menu), tabs, and an activity log. Back keeps the list's filters and position |
| Profile | A person | A summary, a section nav, panels per section |
| Flow | Long or risky work | A full-screen step layer with its own URL, a review step, a saved draft, a guard for unsaved changes, and a final button that names the action |
| Dashboard | Monitoring | Saved report tiles |
| Print | Printable records | Its own print styling |

Queues, calendars, maps and settings pages are types too. Write down a type's shape before building it.

### Sizing an interaction

| Task | Use |
|---|---|
| One or two fields, reversible | Inline edit, or a small dialog |
| A section of the record on screen | Inline section edit with Save and Cancel, one section at a time |
| Long, multi-step, or touching money or messages | A flow |
| Recoverable | Act, then offer Undo |
| Irreversible or high-impact | A confirmation that names the thing and the consequence. Add a typed name or a reason when an audit needs one |

### Data states

Design each of these for every data view:

| State | Show |
|---|---|
| First load | Skeletons shaped like the content |
| Refreshing | The current data, with a quiet updating cue |
| Error | A message in place of the data, with Retry |
| Partial or stale | What loaded, with the missing parts or the data's age marked |
| Empty | One line, and the action that fixes it, or who can |
| No results | What was searched, and Clear filters |
| Saving / failed save | Progress on the control. On failure, the input kept, the reason, and Retry |
| Conflict | Both versions, and a choice |

**Access:**
- Unreachable pages go to a No access page that says who to ask.
- Actions the viewer would expect but can't use show as disabled, with the reason in text.
- Actions outside their role are left out.

### Tables

- **Toolbar:** search and quick views on the left; actions, Filters and Columns on the right.
- **Columns:**
  - the primary column (the person or thing) is pinned;
  - numbers are right-aligned with tabular figures, and money shows its currency;
  - viewers can show, hide, pin and sort columns, saved per viewer.
- **Rows:**
  - each row has one primary target (the name link, or Enter on the row);
  - multi-select uses a checkbox column and a bulk-action bar with the count;
  - long text truncates, with the full value available.
- **Large lists:** pagination for work people return to, with a stable default sort.
- **Narrow screens:** the table scrolls inside its panel, and lower-priority columns hide first.
- **Export** states what it includes, and respects the current filters.

### Filters

- **Quick views:** the 2–5 most-used slices, as a segmented control with counts. The open view names the panel ("Active members · 1,204").
- **Placement:** two or three frequent filters sit in the toolbar; the rest go in a filters dialog.
- **Active filters** are removable chips, plus Clear filters. People can save views they rebuild often.
- **The URL** holds tabs, sort and non-sensitive filters, so views can be shared. Personal searches and sensitive values (names, IDs, health or money details) stay in memory.

### Forms

- **Labels and hints:** a visible label above each field. Format hints come before input.
- **Required fields** are marked in text, and use the right input type and `autocomplete`.
- **Validation:** on blur and on submit. On submit, an error summary links to each field and takes focus; inline errors say how to fix them.
- **Keep input** through errors, failed saves and timeouts.
- **Submitting:** the button shows progress, and the server's idempotency guards against double submits.
- **Pickers:** native date, time and select controls by default. Use a custom picker when it adds real value (ranges, a business calendar), with full keyboard support, correct roles and names, and screen-reader and touch support.

### Keyboard and focus

- **Basics:** real buttons and links; tab order follows reading order; focus is always visible.
- **Dialogs:** focus moves in and stays inside; Esc closes and returns focus to the trigger; the title names the dialog; destructive confirmations start focus on the safe choice.
- **Menus and segmented controls** use arrow keys.
- **After an action,** focus lands somewhere useful (the new row, the next field), and status messages are announced.

### Layout

- **Shell:** brand bar, sidebar, content.
- **Breadcrumbs** on detail, profile and create pages.
- **Tabs:** one row per page, with the open tab in the URL.
- **Text can grow:** rows, buttons and bands grow with enlarged or wrapped text.
- **Reflow:** the page works at 320 CSS px and 400% zoom with no sideways page scroll. Tables and wide plates scroll inside their own box.
- **New areas:** new features join an existing area as a page, tab or section. New top-level areas need agreement.

### Status, charts, time, copy

- **Status** is a word with a tone (success, warning, danger, info, neutral). The tones are reserved for status.
- **Charts:**
  - one main series in the primary colour and one comparison in neutral;
  - direct labels or a legend, and pattern where series need telling apart;
  - every value readable without hovering, through a data table, a toggle or labels.
- **Time:** when operations run on one timezone, show times in it with a label ("9:00 AM London"). Show the viewer's own time where they need it. Dates and numbers follow the locale the record needs.
- **History** reads as sentences, newest first. Repeated small changes by one person group into one row, with "Show each one".
- **Copy:**
  - errors say what happened, why, and how to fix it;
  - empty states say what this is, why it's empty, and how to start;
  - confirmations name the thing and the consequence, with verb buttons ("Keep class" / "Cancel class");
  - an action keeps one word throughout ("Publish" → "Published");
  - sentence case.

### Mockups

- **Start from the current page** and change only the new parts. Name the component used for each part.
- **Synthetic data:** realistic shapes and obvious placeholders (`[Member name]`). Blur or replace personal data in screenshots of real tools.

## Look

Derive the look from the brand when there is one, or start from a direction:

| Token group | Quiet | Dense | Bold |
|---|---|---|---|
| Suits | Long, calm sessions | High-volume data work | Tools that are part of the brand |
| Canvas / surface | Warm off-white, white panels | Neutral grey, white panels | Brand-tinted canvas or dark sidebar |
| Edges | Hairlines | Hairlines, optional zebra rows | Elevation or colour blocks |
| Row height | 48px | 36–40px | 52–56px |
| Radius | 10–12 | 4–6 | 12–16 |
| Type | One sans, calm scale | Sans with tabular figures, tight scale | Display face for titles, sans for data |
| Primary colour | Actions | Actions and selection | Actions and chrome |

Every direction:
- **Tokens:** components use tokens only, and each colour has one job: primary, canvas, surface, ink, muted ink, border, focus, and status tones.
- **Contrast:**
  - text 4.5:1 (3:1 at 24px+, or 18.66px+ bold);
  - input and control borders, focus rings and meaningful icons 3:1 against their background.
- **One spacing scale and one type table.**
- **A focus style** that stays visible on every surface.
- **Dark mode,** when offered, is designed as its own token set.

## Variations

Keep the structure fixed and vary the look along named axes:

| Axis | Range |
|---|---|
| Direction | Quiet · Dense · Bold · the brand's own |
| Density | Row height, padding, content above the fold |
| Type | One sans · sans + display · mono for data |
| Colour role | Brand on actions · on selection · on chrome |
| Composition | Sidebar · top tabs · split list-detail · stat row on or off |
| Edges | Hairlines · elevation · colour blocks |

- **Distinct:** each variation differs on at least two axes.
- **Named for its idea** ("Quiet ledger", "Dense console").
- **Checked** against Structure and the contrast rules.
- **A real choice:** give each one a deliberate point of view. The generic template look is a giveaway: identical cards, one radius everywhere, the same soft shadow under every box, decorative gradients.
- **Compared fairly:** show them side by side at the same width, with the same data and one line each on when to pick it.

## Rule Book

The product's `DESIGN.md` holds:
- the glossary;
- the chosen direction and its tokens;
- the Structure rules, using the product's component names;
- a spec for each shared component: variants, sizes, states, keyboard behaviour, screen-reader announcement, do and don't.

Accessibility, data safety and structure are **must** and **never**. Visual choices are defaults; an exception gets a one-line reason. When the rule book and the code disagree, settle which is intended and fix one of them in the same PR.

## Handoff

For each page:
- what reflows, hides or scrolls at each width;
- edge cases: shortest and longest content, longer translations, slow networks, missing data;
- every data state;
- each transition's trigger, duration and easing, and its reduced-motion version;
- focus order and announcements.

## Review Checklist

- [ ] Page type named; inventory components, or a proposal for a new one.
- [ ] Interactions sized by risk; one primary action per area.
- [ ] Every data state designed; access handled.
- [ ] Forms have labels, hints, an error summary, and keep input.
- [ ] Keyboard and focus work end to end.
- [ ] Works at 320px and 400% zoom; text can grow.
- [ ] Contrast: text 4.5:1, controls and focus 3:1, status in words, charts readable without hover.
- [ ] Only non-sensitive state in the URL; synthetic data in mockups.
- [ ] Tokens only, from the chosen direction.
