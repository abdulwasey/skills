---
name: design-audit
description: Use when auditing an app's UI for design inconsistencies, readability, font, alignment, spacing, color contrast (WCAG), touch targets, or network/performance problems, one user flow at a time, on web and optionally an iOS simulator or Android emulator. Triggers - "design audit", "audit the <flow> flow", "start the <flow> audit", "readability / contrast / network audit", "UI polish pass".
---

# Flow-by-Flow Design Audit

## Overview

A read-only audit of a running app, **one flow at a time** (auth, profile,
feed, settings, checkout...). Each flow gets a separate auditor per platform,
running in parallel in the background. The integrator merges their findings,
presents one table, and **pauses** so the user can triage (file tickets, fix,
or skip) before the next flow starts.

**Core principle:** evidence or it didn't happen. Every finding cites a real
screenshot and a `source:line`; every contrast finding cites both hex values
and the computed ratio.

## When to Use

- A UI needs a polish pass before release, or a redesign landed and needs checking.
- Someone asks for a design / readability / contrast / network audit of a flow.
- Extending an earlier audit to a flow that has not been covered yet.

Not for: reviewing UI *code* in a diff (use `react-review`), or designing new
screens.

## Run One Flow

### 1. Verify infra. Never rebuild what is already up.
- Is the dev server running? Is the simulator/emulator booted with the app
  installed? Check (`curl -sI localhost:<port>`, `xcrun simctl list devices booted`,
  `adb devices`) before starting anything. A restart costs minutes and can
  disturb another session using the same bundler.
- Serve web on a **different port** from the native bundler so the web run never
  disturbs the native one (e.g. Expo: `npx expo start --web --port 8082`).
- Web-only app? Skip every simulator/emulator step and run just the web auditor.
- **Signed in?** Screenshot the device to confirm. For web, save an
  authenticated browser session once (Playwright `context.storageState()` after
  the user signs in by hand in a headed window), then probe it headlessly
  before each run: load a protected route and check the body for login text.
  If it is logged out, **pause** and ask the user to sign in again.
  `storageState` saves cookies and localStorage but not sessionStorage; an app
  that keeps its token there needs the token re-injected with an init script.
- **The user types credentials. The agent never does.** Not in a prompt, a
  script, or an `idb`/`adb` text command.

### 2. Map the flow's screens and states
Read the routes and components for the flow before writing any prompt. List
every screen and state the auditors must reach: empty, loading, error,
populated, long-content, keyboard-open, menus/pickers open, modals, each tab.
An auditor told "audit chat" finds a third of it; one given a list finds all of it.

### 3. Build one prompt per platform
Start from `auditor-prompt.md` in this directory. Fill in the flow, platform,
device, date, the screen/state list from step 2, and the output paths. Inline
or reference `audit-checklist.md` as the lens. Give **full output paths**; a
relative path lets an auditor scatter screenshots into the repo root.

Separate auditors per platform:

| Platform | Driver | Viewports |
|---|---|---|
| Web | Headless Playwright with the saved storage state | 375 (phone), 834 (tablet), 1440 (desktop) |
| iOS simulator | `xcrun simctl` (screenshots, `openurl` deep links) + `idb` (tap/swipe/text; `brew install idb-companion` + `pip install fb-idb`) | The booted device |
| Android emulator | `adb` (`exec-out screencap`, `shell input`, `am start -d` deep links) | The booted device |

Each auditor writes to its **own** findings file (`design-audit-<flow>.md` for
the first platform, `design-audit-<flow>-<platform>.md` for each other); the
integrator merges them. Two agents writing one file race. Evidence paths are
relative to the doc (`<flow>/ios/feed-empty.png`), so shots from different
platforms never collide.

Deep links: use the app's URL scheme; an Expo dev build answers on
`exp+<slug>://`.

### 4. Launch in parallel, in the background
Dispatch one background agent per platform: a subagent, or a separate
headless agent CLI process (e.g. `claude -p` or `codex exec`), each with its
output redirected to its own files. If you pick a specific model, pass it
explicitly. Driving a simulator usually needs a sandbox that can reach local
devices; get the user's explicit OK for that, and don't grant it to yourself.

### 5. Monitor on completion only
Subagents: wait for the harness's completion notification. CLI processes: wait
on the PID you started.

```bash
agent-cli "$(cat ios-prompt.txt)" > ios.out 2> ios.err & IOS_PID=$!
while kill -0 "$IOS_PID" 2>/dev/null; do sleep 30; done
```

**Never grep the agent's logs or transcript for "error", "done", "expired" or
a tool name.** Agents echo their prompt, tool definitions and grepped source
into their logs, so those words appear long before the run ends and you will
declare a false finish. (`pgrep -f "<prompt text>"` is fragile too: the
watching shell can match itself.)

### 6. Integrate, then pause
- Confirm deliverables landed where the prompt said; move strays (findings docs
  reference bare filenames, so a move is safe).
- Append each `design-audit-<flow>-<platform>.md` under a `---` separator in
  `design-audit-<flow>.md`; delete the appended file.
- Auditor output is a lead, not a finding. Re-open the screenshot behind every
  HIGH and confirm the pixels match the claim; drop or downgrade what does not
  hold up. Mark anything you could not check as unverified.
- If you chose a model, confirm the run actually used it (launch command or
  transcript), not a silent fallback.
- Check the git branch and working tree: an agent with a wide sandbox can
  switch branches or edit files. Flag it; don't silently fix it.
- Optionally zip the doc + screenshots for sharing.
- Present one combined findings table and **stop**. Do not roll into the next
  flow until the user says so.
- Record what was found: patterns that recur across flows go into the
  known recurring findings list (`<output dir>/recurring-findings.md`) that
  the next flow's prompt inlines. Report a
  cross-cutting issue once, listing every screen, rather than once per flow.

## Categories

| Category | What to check |
|---|---|
| Readability | No text clipped, truncated mid-word, or overlapping at any viewport; sensible line length; hierarchy is clear |
| Font | One family everywhere; inputs, menus and native controls don't fall back to the system font; weights come from the type scale (in React Native, never a raw `fontWeight` on a custom font) |
| Alignment | Repeated rows line up: avatars, timestamps, trailing actions, baselines |
| Spacing / radii | Values come from the design tokens; flag every one-off. Measure with computed styles and bounding boxes, don't eyeball |
| Contrast | WCAG AA: 4.5:1 for body and small text, 3:1 for large text (≥24px, or ≥18.66px bold) and for UI components and focus rings. Compute from the real token hex values |
| Touch targets | ≥44×44 pt (iOS) / 48×48 dp (Android); ≥24×24 CSS px on web (WCAG 2.2) |
| Design consistency | One canonical component per control, same look across screens; interaction states (hover, pressed, disabled, focus) present; status colors used consistently (success / error / warning / info) |
| Screen states | Every async screen has loading, empty, error and populated states; skeletons over bare spinners |
| Responsive | Every screen holds up on phone, tablet and desktop widths |
| Network / performance | Duplicate identical requests, serial chains that could be parallel, fetches before they're needed or per keystroke, polling large pages, time to first meaningful paint, stalls, layout shift |

Detail and the contrast formula: `audit-checklist.md`.

## Severity

| Level | Meaning |
|---|---|
| HIGH | Blocks or misleads the user, fails AA on primary content, or wastes the network on every screen |
| MEDIUM | Visible inconsistency or AA failure on secondary content |
| LOW | Polish: a one-off spacing value, a slightly off alignment |

Report the severity you believe, not the worst you can construct.

## Common Mistakes

- **Monitoring by grepping logs** → false "done". Key on process exit.
- **Relative output paths** → screenshots scattered in the repo root.
- **Rebuilding infra that was already up** → lost minutes, disturbed bundler.
- **Skipping the pause** and rolling into the next flow before triage.
- **Contrast by eye.** Compute it from hex values, and use the background the
  text actually sits on, not the page background.
- **Findings without evidence.** No screenshot + `source:line`, no finding.
- **"Looks close" spacing.** Measure computed values against the token and
  report element / expected / actual; a near-miss is a miss.
- **Re-auditing a fix against a stale bundle.** Before deciding a fix "didn't
  take", restart the dev server with its cache cleared and prove the running
  build is current (a temporary visible marker works).
- **Trusting unit tests for paging or layout.** Scroll real lists against the
  real backend; tests can't see page-size limits or rendering.
- **Auditors that mutate state:** sending, creating, joining, reacting,
  deleting, signing out, confirming dialogs, committing a picker selection.
  The audit is read-only; on web, abort non-GET/HEAD/OPTIONS requests with
  Playwright's `page.route('**/*', ...)` as a safety net, allow-listing
  read-only POSTs (GraphQL queries, search) the screens need.
- **Agents driving the host's mouse/keyboard** (AppleScript, `cliclick`). Use
  `idb` / `adb` / Playwright only.
- **Typing credentials.** Never. The user signs in.
