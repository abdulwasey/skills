---
name: marketing-video
description: Use when the user wants a short, punchy promo clip of their product rather than a narrated tutorial - "marketing video", "promo clip", "launch video", "README GIF", "hero GIF", "demo loop for social", "Product Hunt video", "teaser for X/LinkedIn". Produces 10-20 s seamless loops (MP4 + GIF + poster) in landscape, square and vertical, plus an optional 30-45 s launch cut, by rendering the app's REAL React components in Remotion with stubbed APIs and scripted fake data (or screenshots for non-React apps), then checking frames and the loop seam.
---

# Marketing video

Short promo loops that show the product doing its one best thing: the README hero GIF, the X or
LinkedIn post, the Product Hunt gallery. The core trick is to **render the app's real UI**, not a
mock-up or a screen recording. Remotion imports the app's own components, every module that
talks to a backend or the OS is aliased to a stub, and the stub answers from **scripted data per
frame**. The output is pixel-perfect, deterministic, re-renderable on any machine, and free of
real data.

This skill is the method and the craft. For Remotion API details (compositions, `spring`,
`interpolate`, fonts, rendering flags), use Remotion's official skills
(`npx skills add remotion-dev/skills`, starting with `/remotion-best-practices`) or remotion.dev.
For a narrated tutorial, use the walkthrough-video skill instead.

Reference files:
- `stubbing.md`: alias tables for Tauri, Electron, fetch and API clients; determinism rules; fake
  data; non-React apps.
- `loops.md`: the story-beat template, seamless loops, pacing, shapes, the launch cut.
- `export.md`: MP4, GIF, poster, size levers, the per-platform table.
- `templates/`: generic, tested building blocks to copy.
- `sources.md`: where the craft rules come from.

## Templates

| File | What it is |
|---|---|
| `templates/src/clock.ts` | Pins `Date.now()` and `new Date()` to `BASE_TIME + frame/fps`. |
| `templates/src/mock.ts` | One switchboard (`mockCall(name, args)`) that every stub routes through. |
| `templates/src/stubs/tauri-core.ts`, `stubs/fetch.ts` | Ready stubs. Electron and API-client stubs are in `stubbing.md`. |
| `templates/src/LiveApp.tsx` | Hosts the real app per frame: clock, mock swap, remount + `delayRender`, CSS animations off, fake hover/press. |
| `templates/src/Motion.tsx` | `Wallpaper`, `BrowserFrame`, `Cursor`/`pointerAt` (eased keys, press, ripple), `Caption`, `Notification`, and `Shot` (a screenshot camera for non-React apps). |
| `templates/src/Hero.example.tsx`, `Root.example.tsx` | A complete, verified loop: a fetch-based app, click → change → new item → back to start. Three shapes. |
| `templates/remotion.config.ts` | Webpack aliases, `?raw` CSS import, PNG frames. |
| `templates/export.sh` | MP4 + poster + budgeted GIF + loop-seam SSIM + stills and a contact sheet. |

## Steps

### 1. Pin the message before any code

Ask, or propose and confirm:
- **who it's for and where it runs:** README, X, LinkedIn, Product Hunt or a website hero (this
  sets the shapes and budgets; see `export.md`);
- **the one moment that sells the product:** a CI check going green, an approval landing, an
  inbox clearing;
- **the caption:** the value in 7 words or fewer.

Then fill in the beat table from `loops.md` (rest → hook by 1.5 s → action → payoff → return to
rest) with frame numbers. Get a yes on the beats.

### 2. Decide live components or screenshots

- **React app (web, Tauri, Electron, React Native Web):** use live components. Read the app's
  entry and data layer first. List every import that leaves the browser (`grep -rn
  "@tauri-apps\|electron\|fetch(\|axios\|/api/" src`), the UI kit and providers it needs at the
  root, and its CSS entry.
- **Anything else** (native, Flutter, Vue/Svelte, a server-rendered site): use screenshots of
  each state, captured clean, then the same motion layer with `<Shot>` camera keys. See the end
  of `stubbing.md`.

### 3. Scaffold the video project, next to the app (never inside it)

```bash
mkdir my-app-video && cd my-app-video && npm init -y
npm i remotion @remotion/cli react@<app's version> react-dom@<app's version> <app's UI kit + icon deps at the app's versions>
npm i -D typescript @types/react
cp -R <skill>/templates/src <skill>/templates/remotion.config.ts <skill>/templates/export.sh .
```

Then make three edits:
- **`remotion.config.ts`:** set `APP` to the app's path, add every alias from step 2, and alias
  React and the UI kit to this project's copies;
- **`src/index.ts`:** call `registerRoot(Root)`;
- **`tsconfig.json`:** add `paths` for `@app/*` so editors resolve the app's files.

### 4. Script the data and the scene

- **`src/<scene>-data.ts`:**
  - a timeline object of event frames (`T = { open: 24, fail: 75, pass: 165, close: 420, end: 480 }`);
  - `dataAt(frame)`, which derives the full app state from which events have passed;
  - fake but plausible records built by small factories, with times relative to `BASE_TIME`.

  Never paste production data (see `stubbing.md` § Fake data).
- **`src/<Scene>.tsx`** (start from `Hero.example.tsx`):
  - `Wallpaper` and a frame (browser, desktop menu bar, popover or phone);
  - `<LiveApp handler={(f) => (name, args) => ...} css={appCss}>` wrapping the app's root and
    providers;
  - cursor keys and clicks timed to the beats;
  - `Notification` toasts for events;
  - one `Caption`.
- **Drive motion only from the frame:** `interpolate`, `spring`, `--t` CSS vars. Spinners and
  pulses go in `overrides`.
- **Register one `Composition` per shape** (`Root.example.tsx`). Lay out from
  `useVideoConfig()`.

Preview with `npx remotion studio`. Note that fake hover is computed in composition pixels, so
it can look off in Studio's scaled preview but is exact in renders.

### 5. Render and export

```bash
bash export.sh Hero hero --poster 110          # MP4, poster, GIF <= 5 MB, seam check, stills
bash export.sh HeroSquare hero-square --poster 110
SKIP_RENDER=1 bash export.sh Hero hero --gif-width 800 --budget-mb 3   # re-squeeze the GIF only
```

### 6. Verify. Look before you call it done.

Open `out/frames/<name>-sheet.png`, then the full-size stills and the poster. Check:
- **the app is fully loaded in every frame:** no spinner of the initial load, no empty list, no
  "undefined";
- **the data is consistent:** badge counts match the rows, and times read naturally ("4s ago",
  not "-3s ago");
- **the cursor tip lands on the control it clicks,** and the app shows its hover or pressed
  state there;
- **the caption is legible at GIF size,** and nothing is clipped in the square or vertical
  variants;
- **the loop seam is invisible:** SSIM ≥ 0.98 *and* first and last look the same by eye;
- **sizes are within budget:** GIF ≤ 5 MB for the README, < 3 MB for a Product Hunt thumbnail.

Fix the data, timing or layout, re-render, and look again. Report:
- the MP4, GIF and poster paths with their durations and sizes;
- the seam SSIM;
- 3–4 still paths the user can open.

### 7. Optional: the launch cut

Stitch 2–4 clips with title and end cards in HyperFrames (local GSAP, telemetry off), or with a
Remotion `<Series>`. Structure and commands are in `loops.md` § The launch cut.

## Common mistakes

| Mistake | Fix |
|---|---|
| Screen-recording the app or rebuilding its UI by hand | Import the real components. Only fall back to screenshots for non-React apps. |
| "Invalid hook call", or an unthemed UI kit | Two copies of React or the kit. Alias both to the video project's `node_modules`. |
| A frame shows the loading state | The handler returned `undefined` for a call. Log unhandled names in the handler. Raise `settleMs` for slow chains. |
| Spinners frozen or jittering | CSS animations are disabled on purpose. Drive them from `--t` in `overrides`. |
| "Updated 3s ago" changing randomly between renders | Use time only from `clock.ts`. Derive "last updated" from the last event, not the frame. |
| The loop jumps at the end | The end state ≠ the start state. Fix the data story (see `loops.md`), not with a crossfade. |
| A 9 MB README GIF | Shorten, then fps, then width, then colours. Simplify the blurred background. |
| A GIF made from a JPEG-frame render | Keep `setVideoImageFormat('png')`. JPEG artefacts on UI text survive into the GIF. |
| The CDN GSAP or telemetry on in the HyperFrames cut | Vendor `gsap.min.js` and export the opt-out variables (see `loops.md`). |
| Tiny UI in the vertical variant | Scale the app up or crop to the moving part. Don't letterbox a desktop window. |

## Red flags. Stop and fix before going on.

- Any real customer, colleague or user data on screen: names, emails, avatars, repo names,
  amounts, tokens. Everything is invented (`acme/*`, `example.com`).
- A render making real network requests: the fetch stub logged `[mock] unhandled` for an
  external URL, or an API key is needed to render.
- `Math.random`, `Date.now` or CSS animation driving anything visible.
- Video-only code or dependencies added to the app repo.
- No one has looked at the stills, or the seam SSIM is below 0.98.
- The caption claims something the clip doesn't show.
