# Rendering the real app: stubbing and determinism

The video imports the app's own React components and renders them in Remotion. Everything the
components talk to (platform APIs, HTTP, IPC, timers, the clock) is replaced with something that
answers from **scripted per-frame data**. The UI is real, the data is fake, and the render is
identical every time.

## Layout

```
CODE/
  my-app/            # the product repo; only its source is read, its node_modules are not used
  my-app-video/      # this project: Remotion + the templates
    remotion.config.ts
    src/clock.ts  src/mock.ts  src/LiveApp.tsx  src/Motion.tsx  src/stubs/*
    src/Root.tsx  src/Hero.tsx  src/hero-data.ts
```

Install the app's **UI runtime deps** in the video project at the same versions (React, its
component kit, icon set, i18n). Then alias them in `remotion.config.ts` so the app and the video
share one copy. Two Reacts give "Invalid hook call". Two copies of a UI kit lose their theme
context.

Use a separate repo or folder rather than a branch of the app: the video's dependencies (Remotion,
fake data) never ship with the product.

## The alias table (`remotion.config.ts`)

Point every module that leaves the browser at a stub. The template config already handles the
`?raw` CSS import and the React aliases.

### Tauri

```ts
'@tauri-apps/api/core': here('src/stubs/tauri-core.ts'),     // invoke -> mockCall(cmd, args)
'@tauri-apps/api/event': here('src/stubs/tauri-event.ts'),   // listen/emit kept in memory
'@tauri-apps/api/app': here('src/stubs/tauri-app.ts'),       // getVersion -> '1.0.0'
'@tauri-apps/plugin-opener': here('src/stubs/noop.ts'),      // openUrl etc. resolve to undefined
```

```ts
// src/stubs/tauri-event.ts
const listeners = new Map<string, Set<(e: { event: string; id: number; payload: unknown }) => void>>();
export const listen = (event: string, cb: (e: { event: string; id: number; payload: unknown }) => void) => {
  const set = listeners.get(event) ?? new Set();
  set.add(cb);
  listeners.set(event, set);
  return Promise.resolve(() => set.delete(cb));
};
export const emit = (event: string, payload?: unknown) => {
  listeners.get(event)?.forEach((cb) => cb({ event, id: 0, payload }));
  return Promise.resolve();
};
```

For plugins, export exactly the names the app imports, each returning a resolved promise
(`check = () => Promise.resolve(null)` for an updater, `isEnabled = () => Promise.resolve(true)`
for autostart). Grep the app for `from '@tauri-apps/` to get the list.

### Electron

If the renderer uses a preload bridge (`window.api.getItems()`), install a fake bridge before the
app mounts:

```ts
import { mockCall } from '../mock';
(window as any).api = new Proxy({}, {
  get: (_t, name) => (...args: unknown[]) => Promise.resolve(mockCall(String(name), args)),
});
```

If it imports `electron` directly, alias `electron` to a stub:

```ts
// src/stubs/electron.ts
import { mockCall } from '../mock';
export const ipcRenderer = {
  invoke: (channel: string, ...args: unknown[]) => Promise.resolve(mockCall(channel, args)),
  on: () => ipcRenderer,
  off: () => ipcRenderer,
  removeAllListeners: () => ipcRenderer,
  send: () => undefined,
};
export const shell = { openExternal: () => Promise.resolve() };
```

### fetch

Call `installFetchMock()` (`src/stubs/fetch.ts`) once at module scope in the scene file. Handlers
then key on `"GET /api/items"`, `"POST /api/items"` and so on, and receive `{ query, body }`.
Unhandled same-origin requests pass through (bundled assets), and unhandled external ones fail
with status 599 and a console error. **A render must never reach a real API.**

### axios, a generated client, tRPC, React Query hooks

Don't fight the transport. Alias the app's **own API module** to a stub with the same exports:

```ts
[path.join(APP, 'src/api/client.ts')]: here('src/stubs/api-client.ts'),
```

```ts
// src/stubs/api-client.ts: same names and signatures as the real module
import { mockCall } from '../mock';
export const listItems = (q: { status?: string }) => Promise.resolve(mockCall('listItems', q));
export const getUser = (id: string) => Promise.resolve(mockCall('getUser', id));
```

React Query and SWR work unchanged on top of this, but give them a fresh client per frame (wrap
the app in a provider created inside the scene) with `retry: false`, so no cache leaks between
remounts.

### Auth, feature flags, analytics

Render the signed-in tree directly (skip the router guard), or stub the auth hook to return a
fake user. Stub analytics and error reporting (Sentry, PostHog) to no-ops so renders don't send
events. Flags: force the variant you're showing.

## Determinism rules

What `LiveApp` does, and why:

| Problem | Fix in the template |
|---|---|
| `Date.now()` and `new Date()` move with the wall clock | `clock.ts` pins both to `BASE_TIME + frame/fps`. |
| Data loads asynchronously, so a frame is captured half-loaded | `key={frame}` remounts per frame, and `delayRender` holds the frame until effects settle (60 ms + 2 rAF; raise `settleMs` if needed). |
| CSS animations and transitions run on wall time | All are disabled. Drive what matters from `--t` (seconds) or `--frame`: `.spinner { transform: rotate(calc(var(--t) * 360deg)) }`. |
| `setInterval` polling, debounces, toasts with timeouts | They never fire within the settle window. Put the post-poll state in that frame's data. |
| `:hover` under a fake cursor | `hoverize()` copies the app's `:hover`/`:active` rules to `.fake-hover`/`.fake-active`. The pointer sets them via `elementFromPoint` in composition pixels. |
| OS dark/light mode differs per machine | `forceMedia(css, 'prefers-color-scheme: dark')`, plus force the UI kit's colour scheme prop. |
| Random IDs, shuffles, `Math.random` | Seed them, or put fixed IDs in the fake data. |
| Web fonts load late | Import them in the video project and wait (`@remotion/google-fonts` or `delayRender` + `document.fonts.ready`). |
| Scroll position | Set it in `settle(root, frame)`. |

## Fake data

- Build it with small factories (`base({...overrides})`) and a timeline object of event frames
  (`T = { click: 62, arrive: 120, end: 180 }`). `dataAt(frame)` derives the whole state from
  which events have happened.
- **Plausible, never real.** Use invented people (first name + surname), `acme/*` repos,
  `example.com` domains, round but not suspicious numbers. Never copy production rows, customer
  names, emails, avatars or real tokens, even "just for the video".
- Time-relative fields come from `BASE_TIME` (`ago(14)` = 14 minutes before the pinned now), so
  "14m ago" never drifts.
- Keep counts and badges consistent with the visible list. Viewers notice "3" next to two rows.

## Apps that aren't React

Use screenshots with the same motion layer. Capture stills of each state (see the
walkthrough-video skill's `capture.mjs` for clean Playwright captures, or the simulator/emulator
commands). Then compose with `<Shot>` from `Motion.tsx`, which provides camera keyframes:
centre point and zoom, eased between stops. Add `Cursor`, `Caption` and `Notification` on top,
exactly as for a live app. Cross-fade between stills at state changes (two `<Shot>`s,
interpolating opacity over 6–8 frames). For a Vue or Svelte app, the same approach works with
stills. Mounting the real component is only practical for React.
