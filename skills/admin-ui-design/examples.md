# Admin UI design: examples

All examples use one fictional gym chain's staff tool, "Northside Gym": members, classes, trainers and billing. Every name and number is synthetic.

## 1. One page, three variations

The structure is fixed: a list page with a header band, one primary action ("New member"), quick views, a filters dialog, a table panel and all data states. Only the look changes.

### Quiet ledger: Quiet direction, sidebar, stat row on

```
┌──────────────────────────────────────────────────────────────────────┐
│ Northside   Members ⌄                    [ Search ]          (RC)   │ brand bar
├────────────┬─────────────────────────────────────────────────────────┤
│ Members    │ Members                                  [New member]   │ header band
│ Memberships│ All members   Paused   Leaving this month               │ tabs
│ Passes     ├─────────────────────────────────────────────────────────┤
│ Freezes    │  Active 1,204 │ Trial 88 │ Lapsed 312 │ Joined 57       │ quiet stat row
│            │ ┌ Active members · 1,204 ─────────────── [Export] ┐     │
│            │ │ [Search…]  (Active|Trial|Lapsed)  [Filters][Cols]│     │
│            │ │ (JM) Jamie Moss   Monthly  Riverside  Active  14 │     │ 48px rows
│            │ └──────────────────────────────────── ‹ Prev Next ›┘     │
└────────────┴─────────────────────────────────────────────────────────┘
```

Tokens: canvas `#f7f6f2`, surface white, hairline 10% black, field border `#8a8f96` (3.3:1 on white), primary `#1d4a3b`, row 48, radius 10. **Pick it when** staff work in it all day and calm matters more than density.

### Dense console: Dense direction, top tabs, no stat row

```
┌──────────────────────────────────────────────────────────────────────┐
│ Northside  Members  Classes  Billing  Trainers         [Search] (RC)│ areas as top tabs
├──────────────────────────────────────────────────────────────────────┤
│ Members · 1,204   (Active|Trial|Lapsed)  Plan: Any ▾  Club: Any ▾   │ frequent filters visible
│                                          [Filters] [Cols] [New member]│
├──┬───────────────┬─────────┬───────────┬──────────┬────┬────────────┤
│☐ │ Member        │ Plan    │ Club      │ Status   │ Vis│ Last visit │ 36px rows, zebra
│☐ │ Jamie Moss    │ Monthly │ Riverside │ Active   │ 14 │ 2 days ago │
│☐ │ Ana Kovač     │ Annual  │ Riverside │ Frozen   │  0 │ 3 Oct      │
├──┴───────────────┴─────────┴───────────┴──────────┴────┴────────────┤
│ 3 selected   [Freeze]  [Message]  [Export]               1–50 of 1,204│ bulk bar
└──────────────────────────────────────────────────────────────────────┘
```

Tokens: canvas `#f1f2f4`, mono tabular figures, row 36, radius 4, primary on selection too. **Pick it when** a team processes hundreds of records a day and compares many columns at once.

### Bold club: Bold direction, dark sidebar, split list-detail

```
┌────────────┬───────────────────────────────┬───────────────────────┐
│▌NORTHSIDE  │ Members           [New member] │ Jamie Moss    Active  │
│            │ (Active|Trial|Lapsed)          │ Monthly · Riverside   │
│ Members  ● │ ┌───────────────────────────┐  │ Joined 12 Mar 2024    │
│ Classes    │ │ Jamie Moss   Active    ›  │  │ ───────────────────── │
│ Billing    │ │ Ana Kovač    Frozen    ›  │  │ Visits   14 this month│
│ Trainers   │ │ Tomás Ortega Active    ›  │  │ [Edit]  ⋯             │
│            │ └───────────────────────────┘  │                       │
└────────────┴───────────────────────────────┴───────────────────────┘
```

Tokens: a sidebar in the brand green with white text (7.9:1), surface white, elevation instead of hairlines, display face for titles, radius 14, row 56. **Pick it when** the tool is part of the brand (front-desk screens, owners' app) and people open one member at a time.

The axes each one changes:

| | Quiet ledger | Dense console | Bold club |
|---|---|---|---|
| Direction | Quiet | Dense | Bold |
| Density | 48px | 36px | 56px |
| Composition | Sidebar + stat row | Top tabs, no stats | Split list-detail |
| Colour role | Actions only | Actions + selection | Chrome |
| Edges | Hairlines | Hairlines + zebra | Elevation |

## 2. Bad → good

| Bad | Why | Good |
|---|---|---|
| Four coloured KPI cards: green "1,204 Active", red "312 Lapsed" | Colour on non-status; boxes compete | One stat row with muted labels and plain numbers, or none |
| A 9-field "New member" form in a modal | Too long and risky for a dialog: no review, no draft, no link | A flow at `/members/new?step=details` with a review step |
| A one-field "Rename tag" flow | Too much ceremony | Inline edit, or a small dialog |
| A table showing "0 members" when the API fails | Lies about the data | An error state: "Couldn't load members. Retry" |
| `?search=jamie.moss@…` in the URL | A personal search ends up in history and logs | The search stays in memory; tab, sort and plan filters go in the URL |
| A custom date picker with no keyboard support | Inaccessible, and worse than native | A native `<input type="date">`, or a custom one with full keyboard and ARIA |
| Status shown as green text only | Colour alone | A pill with the word "Active" |
| A chart whose values show only on hover | Can't be read by keyboard, touch or screen reader | A "Show data" table toggle |
| A `#ddd` input border on white | 1.4:1; the field is invisible to low-vision users | A border at 3:1 or more |
| "Submit" | Doesn't say what happens | "Save plan" |

## 3. Every state, written out

| State | Members table |
|---|---|
| Loading | Six skeleton rows shaped like the table, with the real header |
| Refreshing | Rows stay; "Updating…" next to the count |
| Error | "Couldn't load members. Check your connection and try again." `[Retry]` |
| Partial | "Visits couldn't load. Other columns are up to date." The visits column shows "—" |
| Empty (fixable) | "No members yet. Add the first one or import a list." `[New member]` |
| Empty (someone else) | "No trainers are assigned to this club. An area manager can assign them." |
| No results | "No members match 'Annual · Hilltop'." `[Clear filters]` |
| Failed save | The fields keep their values. "Couldn't save: the email is already used by another member." |
| Conflict | "Riley changed this plan 2 minutes ago." `[See their version]` `[Keep mine]` |
| No access | A No access page: "Ask a club manager for access." |
| Disabled action | "Delete member" is in ⋯, disabled, with the text "Only club managers can delete members." |

## 4. A component spec

```markdown
## StatusPill

Shows a record's status as a word with a tone. Used in table cells, list rows, record headers and legends.

| Variant | Use when |
|---|---|
| pill (default) | Tables and lists: pale fill, dark text of the same hue |
| dot | Beside numbers and in chart legends |

| Tone | Northside statuses |
|---|---|
| success | Active, Paid |
| warning | Frozen, Payment due |
| danger | Lapsed, Failed |
| info | Trial |
| neutral | Left, Cancelled |

States: static. Not focusable unless it's a filter, in which case it's a toggle button with `aria-pressed`.
Screen reader: reads the word ("Frozen"); the tone isn't announced.
Contrast: text 4.5:1 on its fill in every direction's tokens.
Do: one tone per status, used everywhere. Don't: colour categories (plan, club); invent tones per screen.
```

## 5. Proposing a new component

```markdown
## New component: CapacityBar

Problem: class pages need to show booked against capacity at a glance.
Closest existing: StatusPill (no quantity), StatRow (no ratio).
Why they aren't enough: staff need to see "19 of 24" and how full it is, in a table cell.
Proposal: a 4px bar plus the text "19 / 24". The bar's tone turns warning at 90% and danger at 100%. The text is always visible.
Accessibility: `role="meter"`, `aria-valuenow`/`aria-valuemax`, and the label "Booked".
Open question: show the waitlist count in the same cell?
```

## 6. A `DESIGN.md` opening

```markdown
# Design rules

How the staff tool looks and behaves.

- Accessibility, data-safety and structure rules are **must** and **never**: a PR that breaks one isn't done.
- Visual rules are defaults. An exception needs a one-line reason in the PR.
- When you touch an old page, bring the part you touched up to these rules.

Direction: Quiet (tokens in `src/index.css`).

## Glossary

| Term | What it is | Where |
|---|---|---|
| Membership | A member's plan and billing | `/members/:id?tab=membership` |
| Booking | One member in one class session | `/classes/:id?tab=bookings` |
| Pass | A one-off entry, not a membership | `/passes` |

Never call a pass a membership.
```
