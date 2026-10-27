# Mobile UI design: examples

All examples use one fictional gym chain's member app, "Northside Gym". Every name and number is synthetic.

## 1. One screen, three variations

The structure is fixed: the Classes tab, with a segmented control (Upcoming · Live · Past), a list of sessions, a Book button per session, and all states. Only the look changes.

### Calm studio: Calm direction, grouped list

```
┌─────────────────────────┐
│ Classes            (RC) │ large title
│ (Upcoming│Live│Past)    │ segmented control
│                         │
│ Today                   │ section header
│ ┌─────────────────────┐ │
│ │ Spin 45       9:00  │ │ grouped list, hairline dividers
│ │ Riverside · Sam O.  │ │
│ │ 5 spots left [Book] │ │ pill button, 44pt hit area
│ ├─────────────────────┤ │
│ │ Yoga Flow    12:30  │ │
│ │ Canal St · Mei L.   │ │
│ │ Full · Waitlist     │ │
│ └─────────────────────┘ │
│ ─── Home Classes Me ─── │ native tab bar
└─────────────────────────┘
```

Tokens: canvas `#f6f6f3`, surface white, hairline 10% black, primary `#1d4a3b`, radius 14, one sans (SF Pro / Roboto). **Pick it when** members check the schedule daily and want calm over excitement.

### Editorial club: Editorial direction, full-bleed media

```
┌─────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ full-bleed class photo, 16:9
│ ▓ Spin 45  ·  9:00 ▓▓▓▓ │ serif title over a scrim (7:1)
│ Riverside · with Sam    │
│ 5 spots left    [Book]  │
│                         │
│ Yoga Flow               │ serif card title
│ 12:30 · Canal Street    │
│ Full — join waitlist    │
└─────────────────────────┘
```

Tokens: serif display for titles (New York / Noto Serif), sans for UI, radius 10, generous imagery. **Pick it when** the brand sells atmosphere and classes have real photography.

### Fast lane: Utility direction, compact list

```
┌─────────────────────────┐
│ Classes   Riverside ▾   │ club picker in the bar
│ (Upcoming│Live│Past)    │
│ 09:00 Spin 45   5 [Book]│ compact rows, tabular times
│ 10:15 HIIT      0  Wait │
│ 12:30 Yoga      2 [Book]│
│ 18:00 Box       9 [Book]│
└─────────────────────────┘
```

Tokens: tonal surfaces, no images, compact sans, radius 8, platform-standard buttons. **Pick it when** members book in seconds between other things.

The axes each one changes:

| | Calm studio | Editorial club | Fast lane |
|---|---|---|---|
| Direction | Calm | Editorial | Utility |
| Type | One sans | Serif titles + sans | Compact sans |
| Composition | Grouped list | Full-bleed media | Compact rows |
| Density | Standard | Spacious | Compact |

## 2. A sourced palette (excerpt)

| Token | Light | Dark | Source |
|---|---|---|---|
| primary | `#1d4a3b` | `#5fb38f` | WEB `tokens.css:12` (brand green); dark value set for 4.5:1 on dark surface |
| canvas | `#f6f6f3` | `#0f1110` | WEB `tokens.css:20` |
| ink-muted | `#5f646b` | `#a3a8ad` | ADMIN `DESIGN.md` muted ink; 5.6:1 on white |
| border | `#8a8f96` | `#5c6166` | Reason: inputs need 3:1 against the surface |
| status-warning | `#fdf1d8` / `#8a4b06` | `#2e2210` / `#f3c06b` | Reason: amber reads as "attention" on both platforms |
| reserved: gold | `#c39a4e` | — | WEB brand guide: logo only |

## 3. A component spec

```markdown
## BookButton

Books a member into a session from a list row or a detail screen.

| Variant | Use |
|---|---|
| sm | In list rows: 32pt visible, padded to a 44pt / 48dp hit area |
| lg | The sticky bottom button on the session detail screen |

States: default · pressed · loading ("Booking…") · booked ("Booked", becomes "Cancel booking") · full ("Join waitlist") · disabled (with the reason text below).
Screen reader: "Book Spin 45, 9 AM, button". After booking it announces "Booked".
Platforms: iOS uses a haptic tick on success; Android uses the standard ripple.
Don't: show a spinner with no label; disable it with no reason.
```

## 4. Every state on the Classes tab

| State | Show |
|---|---|
| First load | Four skeleton rows |
| Offline | Cached classes with "Updated 2 h ago · offline"; Book becomes "Book when online" |
| Error | "Couldn't load classes." `[Retry]` |
| Empty | "No classes at Riverside this week." `[Change club]` |
| Failed booking | "Couldn't book Spin 45. The class is now full." `[Join waitlist]` |
| Notifications denied | "Turn on notifications to get class reminders." `[Open Settings]` |

## 5. A legacy keep list

| Keep | Why (user value) | Where it goes |
|---|---|---|
| Swipe a row to cancel a booking | Members use it daily | Classes list; also an accessible "Cancel" action |
| The streak counter on Home | Most-viewed element | Home header, redrawn in the new tokens |
| A haptic tick on booking | Confirms without looking | BookButton success; respects system settings |

| Leave behind | Why |
|---|---|
| A custom tab bar | The native one handles accessibility and gestures |
| A gradient header | Fights the new surfaces; low contrast on titles |
| A 12pt grey caption text | Fails contrast and doesn't scale |
