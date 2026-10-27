---
name: app-system-design
description: Use when designing a new mobile app (React Native / Expo or similar) or a major part of one - which backends it talks to, how sign-in and token refresh work, where server data and offline cache live, live updates and push, third-party SDKs, deep links, a demo mode, environments and native builds. Also use when reviewing a mobile app design doc, or when an app feature needs data from several services.
---

# App System Design

## Overview

The app owns no data. It signs in with an account service, talks to **one backend built for it**, reads public content from where it lives, and uses third-party SDKs only with short-lived tickets that backend issues. Everything it shows is cached on the device so it opens fast and still works on a bad connection.

**Core principle:** one backend per app, and every secret and rule lives on the server. The phone holds a session, a cache and the UI.

For the services behind it, see `backend-system-design` in this repo. For a web client, see `web-system-design`.

## When to Use

- Starting a new mobile app, or rebuilding an old one.
- An app feature needs data from several services.
- Choosing an auth, data, offline or notification approach.
- Reviewing a mobile design doc.

Not for: line-level React Native review (see `react-review`) or visual audits (see `design-audit`).

## The Decisions

| # | Decision | Default |
|---|---|---|
| 1 | Who the app talks to | Account service, its own backend, public content API; SDKs only with backend-issued tickets |
| 2 | Sign-in | Session bearer in secure storage → short access JWT; refresh once, then sign out |
| 3 | Account gates | Explicit server errors that the app routes to a gate screen |
| 4 | Data layer | Generated client; per-domain api / mappers / hooks; query cache persisted on device |
| 5 | Live updates | SSE from the app backend; push sent by the backend |
| 6 | Navigation | File routes, thin screens, one URL scheme for deep links and push |
| 7 | Demo mode | Fixtures for every API call, behind one switch |
| 8 | Environments | No env set means staging; production only by explicit config |
| 9 | Native builds | Dev builds, generated native folders, config plugins and patches |
| 10 | Look | The brand's tokens, native components, dark mode from the brand |

## 1. Who the app talks to

| Talks to | For | Auth |
|---|---|---|
| Account service | Sign-in, password reset, access tokens, acting as another user | Session bearer |
| **The app's backend** | Everything else: profile, the app's features, data from other owners passed through | `Bearer <access JWT>` |
| Public content API (CMS) | Catalogue and marketing content | None (anonymous GETs) |
| Third-party SDKs (chat, video, uploads) | Real-time or heavy features | A short-lived ticket from the app's backend: chat session token, video SDK signature, signed upload URL |

- The app **never** calls a system of record directly. Its backend does, with a service key.
- Content another system already renders well (course material, documents) opens in a web view instead of being rebuilt.
- No secret ships in the app bundle. Anything `EXPO_PUBLIC_*` is public.

## 2. Sign-in and tokens

1. Sign-in returns a **session bearer** (about 30 days), stored in **secure storage**, never in the plain key-value store.
2. The app swaps it for an **access JWT** (about 15 minutes) and refreshes it shortly before it expires.
3. On a `401`, refresh **once** and replay the request. A second `401` signs out.
4. **Acting as another user** keeps the staff member's own bearer next to the borrowed one, and switches back on stop or when the borrowed session expires.
5. Sign-in sends the app's origin (`expo-origin: <scheme>://`), and the account service trusts only listed origins.

## 3. Account gates

The backend says *why* an account can't use something yet: `403 ACCOUNT_NOT_READY` (email not verified, required profile field missing), or `403` for no app role. The app holds those tabs behind a gate screen that explains the next step. It never shows empty lists that look like missing data. Visibility rules (separate spaces, sensitive topics) are enforced by the backend from the authoritative record; the app only reflects them.

## 4. Data layer

- **A generated client** from the app backend's OpenAPI spec (`api:gen`), never edited.
- **Per domain:** `<domain>-api.ts` makes the calls, `mappers.ts` turns wire shapes into app shapes, `use-<thing>.ts` holds the query hooks. Screens use hooks, never the client.
- **The query cache is persisted** to fast on-device storage (MMKV) for about a day, so the app opens on last-known data. Pick a default stale time deliberately (for example 30 minutes), and set shorter ones on hooks that need fresher data.
- The backend sends `fetchedAt` and `stale` on data it passes through. The app shows "updated 2 h ago" instead of an error when the owner is down.
- Client-only state (session, appearance, banners, drafts) goes in small stores (zustand), persisted only where it must survive a restart.

## 5. Live updates and push

- **Live updates over SSE** from the app backend (one stream per signed-in user, typed frames like `ticket.replied`). Clients refetch on the frame. No polling loops on screens.
- **The backend sends push.** The app only registers device tokens and routes taps. Every push carries `data.open = <in-app route>`.
- Ask for notification permission at a moment of value ("remind me before class"), and offer the same switch in settings. If permission is asked from only one screen, people who never visit it never get push.
- Push needs the build's project id and credentials on day one. Without them, tokens silently never register.
- Local reminders (a class starting) are scheduled on the device from cached data.

## 6. Navigation

- **File-based routes** (expo-router) with typed routes. Route files stay thin and render a component from `components/<feature>/`.
- **One URL scheme** (`<scheme>://feed/post/<id>`) is shared by deep links, push taps and in-app links.
- A tab bar for the main areas. Profile and activity sit off the headers, not in the tab bar.

## 7. Demo mode

- Behind one switch (`isDemo()`), every API call returns **fixtures**: "Try the demo" on sign-in, and a dev-only deep link (`<scheme>://dev/demo?as=<persona>`).
- Use it for store review, screenshots, design audits and simulators without accounts.
- **Rule:** every new API call ships with its demo answer, or that screen breaks in the demo.

## 8. Environments

- **With no env set, the app points at staging.** Production needs explicit config. A developer build must never hit production by accident.
- One script per environment (`start:staging`, `ios:staging`) that loads its env file.
- `http://` backends for local work need cleartext allowed in the Android build. Use `10.0.2.2` instead of `localhost` on the emulator.

## 9. Native builds

- Use **dev builds**, not Expo Go, once any native module is in (video SDK, fast storage, chat).
- **Native folders are generated** (continuous native generation) and git-ignored. Native changes go through **config plugins**, and SDK fixes through `patch-package`. Never hand-edit `ios/` or `android/`.
- Keep `*.web.ts` twins for native-only services if there's a web build.
- Build profiles per environment, and bundle ids and the project id set from the first build.

## 10. Look

- Native and fast, in the brand's colours and type. Tokens are CSS variables (NativeWind), mirrored in a `theme.ts` for native props.
- Dark mode is derived from the brand's dark colour, not invented separately.

## Write the design as

1. **Summary**, and the **Problem** it solves (what the old app got wrong).
2. **Who owns what:** the app owns nothing; list each piece of data and its owner.
3. **Talks to:** the table from step 1, with auth for each.
4. **Tabs and routes:** with the deep-link scheme.
5. **Key decisions:** area → decision (sign-in, data, offline, live, push, demo, stack, look).
6. **Phases:** for example account service → backend skeleton → app shell → sign-in → first feature → the rest → invite-only beta.
7. **Open questions**, each with a recommended answer.

## Red Flags

- The app calling a system of record, or a third-party API with a secret.
- A token in plain storage.
- An infinite refresh loop on `401`.
- Empty screens where a gate or a stale banner belongs.
- A screen calling the client directly.
- A new endpoint with no demo fixture.
- Polling where a live frame exists.
- Push that depends on a permission asked from one screen.
- Dev builds that default to production.
- Edits inside generated `ios/` or `android/`.
