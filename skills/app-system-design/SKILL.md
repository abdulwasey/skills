---
name: app-system-design
description: Use when designing or reviewing a mobile app architecture or a substantial app area - backend integration, native sign-in and token refresh, local and offline data, live updates and push, deep links, installed-client compatibility, environments and native release strategy. Applies to native and cross-platform apps; stack names are examples. Not for React Native implementation diffs (see react-review) or service internals (see backend-system-design).
---

# App System Design

## Overview

Opinionated defaults for mobile apps:
- The server holds the secrets and the rules.
- The phone holds a session, an approved offline cache, pending user work and the UI.
- The app talks to an account service, a backend suited to it, and public content where it lives.
- It uses third-party SDKs only with credentials scoped to the user.
- It plans for installed versions that won't update for months.

**Core principle:** every piece of data has a named owner (the server, or the device for drafts and local settings). No server secret or authorisation decision lives in the app.

`backend-system-design` owns service boundaries and server trust. This skill owns device behaviour and installed-client constraints. Library names (Expo, expo-router, TanStack Query, MMKV, zustand, NativeWind) are one React Native stack; keep the boundaries in any other.

## When to Use

- Starting a new mobile app, or rebuilding an old one.
- An app feature needs data from several services.
- Choosing an auth, data, offline, notification or release approach.
- Reviewing a mobile design doc.

## The Decisions

| # | Decision | Default |
|---|---|---|
| 1 | Who the app talks to | Existing domain APIs, or a BFF when justified; SDKs only with user-scoped credentials |
| 2 | Sign-in | The system browser with PKCE for OAuth; session in secure storage, access token in memory |
| 3 | Refresh | One shared refresh; retry only safe requests; sign out only on a definitive rejection |
| 4 | Account gates | Explicit server errors that the app routes to a gate screen |
| 5 | Local data | An approved offline allowlist, scoped by account, wiped on logout |
| 6 | Offline writes | Read-only offline, or an outbox with idempotency; chosen per feature |
| 7 | Live updates and push | Foreground live channel with recovery; push bound to the account; best effort |
| 8 | Links | One typed destination parser for deep links and push; verified HTTPS links |
| 9 | Compatibility | A supported-version window, additive APIs, OTA updates tied to the runtime |
| 10 | Environments | Explicit per build; dev scripts choose staging; release builds fail without config |
| 11 | Native workflow | Follow the project's; for Expo CNG, generated folders and config plugins |

## 1. Who the app talks to

| Talks to | For | Auth |
|---|---|---|
| Account service | Sign-in, recovery, tokens, delegated support sessions | Its session |
| **The app's API** (shared domain APIs, or a BFF when aggregation, session handling or release timing justify one) | The app's features, with data from other owners passed through | `Bearer <access token>` |
| Public content API (CMS) | Catalogue and marketing content | None (anonymous GETs) |
| Third-party SDKs (chat, video, uploads) | Real-time or heavy features | Short-lived, user-scoped tickets from the backend (chat session token, video SDK signature, signed upload URL), or the SDK's own client auth when it's built for untrusted clients |

- **No privileged server credential ships in the app.** Anything public in the bundle (`EXPO_PUBLIC_*`, API base URLs, publishable keys) is public, so treat it that way.
- The app doesn't call a system of record that only trusts servers. The backend does that, with its own credentials.
- **Reuse hosted content** (course material, documents) when that beats rebuilding it, through an in-app browser or a web view:
  - allowlist HTTPS origins, restrict the native bridge and file access, and open outside links externally;
  - never put a long-lived token in a URL;
  - never sign in inside a web view.

## 2. Sign-in

- **Use a supported auth SDK.** For OAuth/OIDC, use Authorization Code with PKCE in the system browser, exact registered redirects, and state and nonce checks.
- A native app is a public client. It can't prove its identity with an embedded secret or a header. Origin headers some libraries need (for example `expo-origin`) are plumbing, not security.
- Store the **refresh or session credential in OS secure storage** (Keychain, Keystore). Keep the **access token in memory** where practical. Know what survives a reinstall (iOS Keychain can), and clear it on first launch if it shouldn't.
- **Support impersonation**, only if the backend offers it:
  - the server issues a scoped, short-lived **delegated** session (actor and subject), never the user's own credentials;
  - the app shows a persistent "acting as" banner, keeps the operator's own session aside, and isolates caches, queued work and notifications for the delegated session;
  - it returns cleanly when the delegated session ends.

## 3. Refresh and retries

- **One shared in-flight refresh.** Concurrent 401s wait on it instead of racing a rotating refresh token. Store the new credentials atomically.
- Refresh tokens for public clients rotate with reuse detection, or are sender-constrained. That's the backend's job; the app follows it.
- After a successful refresh, retry a request **once**, and only if it's safe: a read, or a write carrying its idempotency key.
- **Sign out only when the refresh credential is definitively rejected or revoked.** Network, timeout and server errors keep the session and the user's work.

## 4. Account gates

The backend says *why* an account can't use something yet: `403 ACCOUNT_NOT_READY` with a reason (email not verified, a required profile field missing), or `403` for no app role. The app holds those areas behind a gate screen that explains the next step. It never shows empty lists that look like missing data. Visibility rules (separate spaces, sensitive topics) come from the backend; the app only reflects them.

## 5. Local data

- **Use a generated client** from the backend's pinned OpenAPI contract (`api:gen`), never edited. Screens use data hooks, never the client.
- **Per domain,** keep the calls (`<domain>-api.ts`) and hooks (`use-<thing>.ts`) apart. Add `mappers.ts` only when wire and app shapes really differ.
- **Persist only an approved offline allowlist.** For each data class, decide whether it may sit on the device, for how long, whether it's excluded from backups, and whether it may still show after the session ends. A persisted query cache (TanStack Query on MMKV, kept for about a day) is a good tool *for the allowlisted queries*, not for everything.
- **Scope persisted data by environment, account, tenant and schema version.** On logout, account switch or the end of a delegated session:
  - cancel requests;
  - remove that context's queries, drafts, files, thumbnails and reminders;
  - drop late responses.
- Encrypt sensitive persisted data with platform-managed keys, or don't persist it.
- **Stale data, honestly:** the backend sends `fetchedAt` and `stale` on data it passes through. The app shows "updated 2 h ago" *and* that the refresh failed. Stale data never stands in for an authorisation denial, and consequential actions revalidate.
- Small client stores (zustand) hold UI state. Persist one only when it must survive a restart.

## 6. Offline writes

Choose per feature:
- **Read-only offline:** writes need a connection, and the UI says so.
- **Offline writes:**
  - a durable outbox scoped to the account, with client-generated IDs and an idempotency key per operation;
  - ordering and dependencies, and a conflict policy;
  - visible pending and failed states, and cancel.

  Correctness must not depend on background execution: sync on launch and on reconnect. An outbox entry never replays under a different account.

## 7. Live updates and push

- **Live channel:** choose SSE, WebSockets, an SDK subscription or bounded polling, from freshness and battery needs. SSE from the app's backend is a good default for foreground updates.
  - Scope it to the installation and session, and renew credentials.
  - Reconnect with backoff and jitter. Resume from the last event ID, or refetch a snapshot after a gap or on returning to the foreground.
  - Coalesce invalidations instead of refetching on every frame. Close it in the background.
- **Push is a best-effort signal, not the source of truth:**
  - The backend sends it. The app registers its installation through an authenticated, idempotent API, bound to the account and environment.
  - Update rotated tokens, and detach the installation on logout or account switch. The backend removes tokens the provider reports invalid.
  - Keep payloads minimal, with nothing sensitive on the lock screen: `data.open = <destination>`, then fetch the details after opening.
  - Set up push credentials and the build's project ID from the first build, and show registration errors instead of failing silently.
- **Permission:** ask during a relevant flow ("remind me before it starts"). Show the status and a toggle in settings, with a link to OS settings once a prompt is no longer possible.
- **Local reminders:** stable IDs, rescheduled when the source changes, on logout, on permission changes and across timezone and DST changes.

## 8. Links and navigation

- **One typed destination model.** Deep links, push taps and in-app links all go through one allowlisted parser. It validates parameters and waits for sign-in and account context, including on cold start. Then it opens the screen, where the backend rechecks access.
- Opening a link never performs an action by itself.
- **Prefer verified HTTPS links** (Universal Links, App Links) for anything shared publicly, with a web fallback. A custom scheme (`<scheme>://`) is fine for internal routing and redirects. Never accept an arbitrary URL as a navigation command.
- File-based routes (expo-router) with typed routes keep this tidy: route files stay thin and render a feature component. Base the tab layout on the main tasks and platform conventions.

## 9. Compatibility and releases

- **Define a supported-version window** (for example, the last N releases or 6 months). The backend keeps responses, error codes and events backward compatible across it. New enum values need a fallback in the app.
- Show a usable "update required" state for versions outside the window. Don't assume everyone updates.
- **Version local data** (persisted caches, outbox, settings) and migrate it.
- **OTA updates** only reach binaries with a matching native runtime version. Roll out in stages, and keep a rollback or kill switch.
- **Demo mode**, when review, onboarding or demos need it:
  - a separate synthetic identity and state;
  - a policy for every boundary: API, streams, uploads, push, analytics, SDKs;
  - no production writes;
  - developer entry points (`<scheme>://dev/demo`) compiled out of release builds.

  Every new API call ships with its demo answer.

## 10. Environments

- **Every distributed build names its environment explicitly.** A release build with a missing or mismatched API host, auth issuer, app ID, update channel or push environment fails validation.
- **Developer scripts choose staging explicitly** (`start:staging`, `ios:staging`), so a dev build never hits production by accident and never reaches it by default.
- Keep app IDs, credentials, push configuration and update channels separate per environment.
- Local `http://` is allowed in debug builds only, for the dev hosts that need it. Release builds use HTTPS. On the Android emulator the host is `10.0.2.2`.

## 11. Native workflow and look

- **Follow the project's native workflow.** With Expo continuous native generation, `ios/` and `android/` are generated and git-ignored, and changes go through config plugins. In bare or native projects, edit native code normally.
- Use a development build once you need native code that Expo Go doesn't include.
- Prefer upstream fixes. Keep any `patch-package` patch explicit and verified in CI.
- Keep `*.web.ts` twins for native-only services if there's a web build.
- **Look:**
  - one source of semantic tokens (CSS variables via NativeWind, generated into a `theme.ts` for native props);
  - the brand's colours and type;
  - light and dark themes, each checked for contrast.
- **Accessibility and language:**
  - screen-reader labels and order, dynamic text size, touch targets, reduced motion and safe areas;
  - translation, RTL, and locale date, time and timezone handling.
- **Crash and error reporting:** privacy-filtered, tagged with build and runtime IDs, with symbols and source maps uploaded.

## Write the design as

1. **Summary**, and the **Problem** it solves.
2. **Who owns what:** each data class, its owner, and whether it may be stored offline.
3. **Talks to:** the table from step 1, with auth for each.
4. **Screens and links:** the destination model and its link formats.
5. **Key decisions:** area → decision (sign-in, refresh, offline, live, push, compatibility, environments, stack).
6. **Validation:**
   - tests for refresh races, safe retries, account and cache isolation, offline restart and sync, old local schemas;
   - deep links and push from foreground, background and cold start;
   - denied permissions, accessibility;
   - a release build on real devices.
7. **Rollout and operations:** staged rollout, crash and error reporting, release identity, and recovery from a bad binary or OTA update.
8. **Phases:** an end-to-end journey first, verified, then the rest.
9. **Open questions**, each with a recommended answer.

## Red Flags

- A privileged secret in the bundle, or a header treated as app identity.
- Sign-in inside a web view.
- A refresh token in plain storage.
- Parallel refreshes racing.
- A write replayed without an idempotency key.
- Sign-out on a network error.
- The whole query cache persisted, or data from the previous account still visible after a switch.
- Push still bound to the previous account after logout.
- Sensitive text on the lock screen.
- A deep link that skips sign-in, or opens any URL it's given.
- An API change that breaks last month's app.
- A release build that runs without an explicit environment.
- An empty env var that means production.
