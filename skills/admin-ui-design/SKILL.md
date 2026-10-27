---
name: admin-ui-design
description: Use when designing or building a page, mockup or component for an internal staff or admin tool (CRM, back office, ops dashboard) - choosing the page type, layout, tables, filters, forms, editing, status, charts, empty/error/loading states and copy - or when writing the tool's design rule book (DESIGN.md). Not for public marketing pages (see landing-page-design), mobile apps (see mobile-ui-design) or auditing a running UI (see design-audit).
---

# Admin UI Design

## Overview

A rule book for staff tools that people use all day: quiet, dense where it helps, and the same everywhere. Every page is one of a few **page types**, built only from **shared components**, and handles **all four data states**. Colour means status, and nothing else shouts.

**Core principle:** start from the real page and the shared components. A new page copies what's there today and changes only the new parts.

These are opinionated defaults. Write your product's version into `DESIGN.md` (see the end), with its own tokens, timezone and words.

## When to Use

- Designing a new admin page, flow or component, or a mockup of one.
- A page "looks busy", inconsistent or unlike the rest of the tool.
- Writing or tightening the tool's `DESIGN.md`.

## Before You Design

1. **Start from the real page.** Open the current page (or the closest existing one) and work from it. Never redraw the app shell, nav or a page from memory.
2. **Name the page type.** Every page is exactly one (see Page types).
3. **List the shared components** you'll use. If a need isn't covered, say so before building a new one.
4. **Use the words staff use.** Keep a glossary of terms that sound alike but differ ("report" vs "report card", "dashboard" vs "report"), and never merge them in names, routes or screens.

## Principles

- **Quiet by default.** White panels on a warm off-white canvas, with hairline borders. No shadows (except menus and popovers), gradients, glass or blur.
- **Colour means status.** Only status gets colour, as a soft pill or a dot. Everything else is ink, grey, a sand neutral or the brand colour.
- **One primary action per area.** Everything else is secondary.
- **Say a thing once.** Never repeat the same warning, number or button in two places on a page.
- **Edit where you read.** Details edit in place inside their panel.
- **Reuse before you build.** A new component that duplicates an existing one is a bug.

## Never

- Raw hex, rgb or oklch values in components. Use tokens.
- Coloured stat cards, KPI tiles with coloured numbers, or a grid of bordered number boxes.
- Cards inside cards, or a bordered table box inside a panel.
- Modals or side sheets for create or edit.
- Red buttons, or saturated fills for status.
- Pills as page sections. Use tabs or sections.
- Rows of filter dropdowns above a table, or a second search box.
- Native date, time or select pickers.
- Emoji in the UI.
- An empty table or a zero when a query failed.
- Rainbow chart palettes, or donuts for status splits.
- Times in the viewer's own zone when the business runs on one zone.
- Copy that restates the title.

## Tokens, Spacing, Type

**Tokens** (CSS variables), each with one job:

| Token | Use |
|---|---|
| `--primary` (brand) | Primary buttons, selected states, the main chart series |
| `--canvas` | Page background behind panels; table header rows |
| `--hairline` | Every border and divider (1px, ~10% black) |
| `--field-border` | Inputs and secondary buttons (~20% black) |
| `--muted-ink` | Secondary text; the lightest text allowed (4.5:1) |
| `--link` | Links in text, and text buttons |
| `--sand` | Selected side-list row, filter chips, avatar circles |
| `--primary-tint` / `--primary-ink` | Soft selected backgrounds, active filter buttons |

A raw brand hex appears in exactly one place (the top bar), if anywhere. Light only unless dark mode is designed properly.

**Spacing:** one scale (4, 6, 8, 12, 16, 20, 24, 32, 56). Icon to label 6; form fields 16; toolbar to table 16; panels in a stack 24; section nav to content 32; page gutter 24 on mobile and 56 on desktop.

**Type:** one table of sizes and weights, and nothing outside it. For example:
- page title 26/600;
- section title 24/600;
- panel title 18/600;
- body, table cells and buttons 14 (buttons 600);
- secondary lines and axis labels 12, muted.

Numbers that line up use `tabular-nums`. Sentence case everywhere.

## Page Types

| Type | For | Shape |
|---|---|---|
| **List page** | Browsing many records | A header band under the top bar: title, at most one primary action, underline tabs on its bottom rule, the toolbar in the band. Then the data in a table panel. No description line, no breadcrumbs |
| **Detail page** | One record that isn't a person | A record header: name, status, a row of key facts, outline actions, a ⋯ menu last. Breadcrumbs in the band. Tabs in `?tab=`. Back keeps the list's filters and "n of N". An Activity tab for anything with history |
| **Profile page** | A person | A summary (avatar, name, status, subtitle, actions, key facts), then a section nav beside the section content, 32 apart. The content is a stack of detail panels, 24 apart |
| **Flow** | Creating something, or a bulk action with a preview | A full-screen layer over the page you came from: ✕ and title at the top, steps on the side, Cancel / Back / Continue in the footer. The last step is a review, and the final button names the action ("Create invoice"). Steps in `?step=`, draft saved, leave guard on unsaved changes |
| **Home and dashboards** | Starting points | A greeting, then panels. Dashboards are saved report tiles, never hand-built pages |
| **Print** | Printable records | Its own print styling. The screen leading to it follows the screen rules |

## Components

Keep one inventory, and use only what's in it. A typical set:
- a **page header** band, a **table panel** with a **toolbar**, and **column controls** (show, hide, pin, sort, saved per viewer);
- a list **panel**, a **segmented control** for 2–5 views, and a quiet **stat row**;
- a **record header** or **profile summary**, and **section layouts**;
- **inline edit** sections, a **page flow**, and a **more menu** (⋯);
- a **menu picker** for "+ New" with several kinds;
- a **danger zone** and a **confirm dialog**;
- a **status dot**, a **query error state** and **skeletons**.

## The Four States

Every data view handles all four. Showing only the happy path means the page isn't done.

| State | Do |
|---|---|
| **Loading** | Skeletons in the shape of what's coming. Never a full-page spinner after the first load; a spinner inside a working button is fine |
| **Error** | An error state with Retry in place of the data. Never an empty table or a zero |
| **Empty** | One short line. If the viewer can fix it, one button ("New report"). If someone else must, say who |
| **No access** | A page they can't open goes to a No access page. An action they can't use stays visible but disabled, with one line saying why. Never hide it silently |

## Layout, Tabs, Navigation

- **App shell:** a brand top bar (logo, area switcher, search, user), a white sidebar, and a canvas for content.
- **Every page works at 375px:** the sidebar collapses, toolbars wrap, and wide tables scroll inside their panel. Nothing scrolls the page sideways.
- **Tabs** are underline tabs: active is ink 600 with an underline, inactive is muted. A bar that doesn't fit scrolls; it never wraps. At most one row per page; a second level is a segmented control. The open tab is in the URL.
- **Sidebar:** pages grouped into areas, with platform items pinned at the bottom. Inside an area it lists only that area's pages. No new top-level areas without agreement; a new feature goes in an existing area.
- **Breadcrumbs** only on detail, profile and create pages. They replace Back buttons.

## Panels and Tables

- **Panels:** white, 1px hairline, radius 12, no shadow. A list panel has "Title · count" on the left and actions on the right, then the toolbar, the table edge to edge, and pagination in a footer.
- **Headline numbers** go in one quiet row: a muted label above a semibold number, with thin vertical rules between. No coloured numbers.
- **Tables:**
  - **Toolbar:** a fixed-width search on the left, then quick views. On the right, actions, a divider, then icon buttons for Filters (with a count), Columns and Expand.
  - **Header and rows:** header cells on `--canvas`, 14/600 muted. Rows are 48 tall with hairline dividers, a faint hover and a tinted selected state. Clickable rows also open on Enter.
  - **Columns:** the primary column is the person or thing (avatar, name in 600, a muted line under it) and is pinned by default. The actions column is sticky. Column layout is saved per viewer; hiding or pinning never refetches.
  - **Values:** status uses the status dot. Categories are plain text. Numbers are right-aligned and tabular. Money shows its currency.

## Buttons, Forms, Editing

- **Buttons:** 32 tall, radius 6, 14/600, 16px icons with a 6 gap.
  - **Primary:** brand fill, one per area. **Secondary:** outline. Ghost only for low-emphasis inline actions.
  - **Labels are verbs naming the result** ("Save report"), never "OK", "Submit" or "Click here".
  - **No red buttons.** Delete triggers are outline, and their confirm is the primary colour. Red is for status and error text.
- **Actions:** row and record actions go in a ⋯ menu. Risky ones (delete, grant access) sit in a **danger zone** at the bottom of the record, behind their own permission, with a reason and the record's name typed back.
- **Fields:** 32 tall, radius 6, with labels above. Use custom pickers. Required fields get an asterisk. Errors sit under the field and say how to fix it.
- **No modals for create or edit.** Create is a flow and edit is inline:
  - Edit swaps a panel's values for inputs in the same layout, with Cancel and Save in a footer.
  - Only one panel edits at a time.
- **Confirm dialogs** are only for confirming one action, picking one thing, or entering one field. They say what will happen in one sentence, the button names the verb, and Cancel has focus.
- **Fix in place:** a small fix belongs where the problem shows, in the row with the mismatch.

## Filters, Status, Charts, Alerts

- **Quick views:** the 2–5 slices people switch between most, as a segmented control with counts. The open view names the panel ("All customers · 35,289").
- **Every other filter** lives in one filters dialog:
  - sections with counts;
  - options as radios, checkboxes or a search for long lists;
  - a "Selected filters" list with × on each.

  Filters apply as they're picked and live in the URL. An active Filters button gets the tint, a count and a "Clear filters" link.
- **Status:** a soft pill (pale fill, dark text of the same hue) in tables, or a dot beside numbers and in legends. Tones are success, warning, danger, info and neutral. Every status has a word, not just a colour. Never colour a category.
- **Charts:** the brand colour for the main series and grey for comparison, plus status tones for status splits. Status splits are a thin stacked bar with a dot legend. Faint grid lines, muted axis labels, no axis lines. Every value can be read from a table or on hover.
- **Alerts:** soft panels with a hairline border, only for something the user must act on, and one per problem.

## Dates, History, Copy, Accessibility

- **Dates:** the business's timezone, passed explicitly. One date format ("4 Oct 2026") and one time format ("9:14 AM"). Relative times only for recent activity, with the full date on hover. Thousands separators on counts.
- **History:** sentences about what happened, newest first. Repeated adds by one person within minutes collapse into one row ("Added 44 sessions") with "Show each one".
- **Copy:** plain, short and specific. Name things the way staff talk. Errors say what happened and what to do next.
- **Accessibility:**
  - real buttons and links, every control reachable by Tab with a visible focus ring;
  - `aria-label` on icon-only buttons, and a label on every input;
  - text contrast of at least 4.5:1;
  - status never shown by colour alone.

## Mockups

- **Copy first:** start from the current page (a screenshot or the real markup), then change only the new parts. Name the real component used for each part.
- **Real shapes, not made-up numbers:** use real data shapes. Unknown values are placeholders like `[Customer name]`, never invented figures presented as real.
- **Same rules:** a mockup that breaks a rule isn't ready for review.

## Writing the Rule Book

Put the product's version in `DESIGN.md` at the repo root:
- **Must** and **never** are hard rules; a PR that breaks one isn't done.
- An exception needs a one-line reason in the PR. "It looked better" is not a reason.
- When you touch an old page, bring the touched part up to the rules.
- When the rule book and the code disagree, settle which is intended and fix one of them in the same PR.

It holds the sections above with the product's real tokens, component names, glossary and timezone, and ends with the review checklist.

## Review Checklist

- [ ] Page type named, with its required parts.
- [ ] Only inventory components, or a new one agreed first.
- [ ] Tokens only; no raw colours.
- [ ] One primary action per area; no red buttons.
- [ ] No modal for create or edit.
- [ ] Loading, error, empty and no-access states handled.
- [ ] Tabs and filters in the URL.
- [ ] Works at 375px with no sideways page scroll.
- [ ] Keyboard and screen-reader basics.
- [ ] Dates in the business timezone and format.
- [ ] Sentence case, in staff's words.
