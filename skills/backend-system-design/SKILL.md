---
name: backend-system-design
description: Use when designing or reviewing a backend architecture or RFC - data ownership, service boundaries, identity and trust, API and event contracts, data lifecycle, background work, reliability, environments or capacity - or when a feature needs choosing which service owns it. Not for code structure inside an established service (see code-design) or routine endpoint work. For client architecture use web-system-design or app-system-design.
---

# Backend System Design

## Overview

Opinionated defaults for a small set of services: each piece of data has one owner, services talk through typed contracts and scoped credentials, and they run on the cheapest hosting that meets the requirements. The design is written down (requirements, ownership, connections, decisions) before any code.

**Core principle:** every entity, and every field of it, has exactly one writer. Everyone else reads through that owner's API, or keeps a copy whose source and lifetime are written down.

The defaults below are starting points. Each one says when it applies. Replace any that the requirements contradict, and record why.

## When to Use

- Starting a new product, service or backend module.
- A feature could live in more than one service.
- Adding a service-to-service call, a webhook, a queue, a schedule or an import.
- Writing or reviewing an RFC for backend work.

## The Decisions

| # | Decision | Default |
|---|---|---|
| 0 | Requirements | Load, data sensitivity, availability and recovery targets, budget: written first |
| 1 | Ownership | One writer per entity or field; an ownership table decides where features go |
| 2 | Services | A modular backend; a new service or BFF needs a written reason |
| 3 | Identity | An established auth library or provider; short-lived access tokens with full validation |
| 4 | Service-to-service | A scoped identity per caller, authorised per operation, with deadlines |
| 5 | Contracts | One reviewed, versioned contract; generated clients; additive changes with a support window |
| 6 | Data lifecycle | Retention per data class; archive for business state, erase or anonymise when retention ends |
| 7 | Imports | Authority defined per field; explicit conflict rules |
| 8 | Background work | Durable, at-least-once, idempotent at the side effect |
| 9 | Access | Enforced on the server, per object and tenant, for reads and writes |
| 10 | Environments and cost | Isolated environments, the cheapest hosting that meets the requirements, backups always |
| 11 | Reliability and scaling | Limits and indexes from day one; measure before buying |

## 0. Requirements first

Before choosing anything, write down:
- expected users and requests, and the busiest hour;
- what data is personal or sensitive;
- availability and latency targets;
- recovery targets: how much data can be lost, and how long the service can be down;
- the monthly budget.

Every default below is checked against this list.

## 1. One owner per piece of data

Write the ownership table first. It decides where every new feature lives. An example for a membership product (replace it with your domains):

| System | Owns | Others get it through |
|---|---|---|
| CMS / website | Editorial content, catalogue | Its public listing API |
| System of record | Members, staff, enrolments, operations | Its internal API |
| Account service | Identities, credentials, sessions, role grants | Its tokens and public keys; an admin API |
| App backend | App-only state: devices, feeds, moderation | Its API |
| Third parties | What they're best at (chat, video, payments) | Their SDKs and webhooks |

- **Copies are allowed; second writers are not.** Caches, search indexes, read models and point-in-time snapshots (an order's price) are fine. Record their source, how they're refreshed, how stale they may get, and how they're deleted.
- **Stale data never authorises.** A fallback to cached data can show a timetable when the owner is down. It must never grant access, confirm a price or approve an action.
- Prefer **one integration boundary per external system** (an LMS, an ERP), and document any exception.

## 2. Few services, one style

- Start with **one modular backend**. Split out a service for a different owner, a different trust boundary, or different scaling or release needs. Write the reason down.
- Add a **backend-for-frontend** only when a client needs different aggregation, session handling or release timing. A new client alone is not a reason for a new service. A BFF may own presentation state (devices, feed ordering). Shared domain data stays with its owner.
- Prefer the team's supported stack and conventions for similar workloads, and document justified differences. Name services for their role.

## 3. Identity

- **Use an established auth library or identity provider.** Never hand-roll password storage, tokens or OAuth.
- **Model identity explicitly:** principals (people and machines), organisation or tenant memberships, and entitlements. Use stable subject IDs; an email address is a changeable attribute, never a key.
- Reuse one identity across products when their trust rules match. Keep workforce and customer identities separate when they don't, and write down where they aren't linked.
- **Provisioning from a trusted roster** (a CRM, an LMS) is a good default when membership is already known. Use expiring invites or claim flows that verify control. Never link accounts just because their emails match.
- **Tokens, when you use them:** a refreshable session issues a short-lived access token. A JWT is signed asymmetrically and verified locally against JWKS. Validate:
  - the signature, against an algorithm allowlist;
  - `iss`, `aud`, `exp`, `nbf`, the subject and the token's purpose.

  Define key rotation and how long JWKS is cached. Opaque server sessions are equally valid, especially for browsers.
- **Revocation has a budget.** State how long logout, suspension or a role change can take to apply (for example, at most one access-token lifetime). Sensitive operations check current grants, not token claims.
- **Account gates** are explicit errors that clients can route on (`403 ACCOUNT_NOT_READY` with a reason), not silent empty data. Require a verified email only for features that depend on owning the email.
- **Support impersonation**, only when there's a documented need:
  - the server issues a scoped, short-lived **delegated** session that carries both the actor and the subject (`act.sub`), never the user's own credentials;
  - it's limited to approved operators;
  - every sensitive read and write is audited.

## 4. Service-to-service calls

| Rule | Why |
|---|---|
| **A scoped identity per caller.** Prefer the platform's workload identity or short-lived credentials. Static API keys are fine for simpler setups if each caller has its own, stored as a secret, rotatable with overlap and revocable | Rotate or cut off one caller without breaking the rest; know who called |
| **Name each credential on both sides** in the docs (`CALLER_KEY` here = `INBOUND_CALLER_KEY` there), never its value | Mismatched names are the most common integration bug |
| **Authorise every operation.** `/internal` in a path is not protection, and a service credential is never blanket user authority | Prevents a confused deputy |
| **Delegated calls carry verifiable user and tenant context**, and the callee checks the caller may act for that user | The audit shows both the machine and the person |
| **An audit actor per caller** (`WEBSITE`, `SCHEDULER`, `APP_BACKEND`) | History says which system did it |
| **Least privilege** for whatever a key acts as | A key that acts as admin turns any leak into full access |
| **Deadlines from the caller's budget** on every outbound call; retry only safe or idempotent calls, with backoff and jitter | One slow partner can't hang the API, and retries can't duplicate effects |
| **Fire-and-forget is a written decision**, with what's lost on failure. Prefer a durable job with retries | Otherwise "saved, but the user was never told" goes unnoticed |
| **Missing required config stops boot. An optional integration that's switched off answers `503 "<X> is not set up"`** | Fails fast in the right place |

Separate routes per consumer (`/api/internal/<consumer>/*`) are a good option when consumers' contracts really differ. Otherwise share the domain contract.

## 5. Contracts

- Keep **one reviewed contract source**, code-first (generated from schemas or decorators) or design-first. CI checks that the implementation matches it.
- Consumers use **generated clients built from a pinned contract artifact** in CI, regenerated by a script and never hand-edited. Don't generate from a live environment during a build.
- **Compatibility:** changes are additive (expand → migrate consumers → contract). Define how long old clients stay supported, especially mobile apps that can't be forced to update. New enum values and changed meanings are breaking changes until consumers handle them.
- **Retryable creates and external effects take an idempotency key**, scoped to the caller and operation. A key reused with a different payload is rejected.
- Concurrent updates use transactions, conditional writes or version checks.
- Events and webhook payloads you emit are contracts too: versioned and documented.

## 6. Data lifecycle

- **A logical database per service, with its own credentials.** Services can share one physical cluster until load or isolation says otherwise. Modules inside one service can share a database with clear ownership.
- Choose storage for its transactions, consistency, queries and volume, not by habit.
- **Schema changes use expand → migrate → contract**, so they work while old and new versions run side by side. Backfills are resumable and rate-limited.
- **Retention per data class:** why each class is kept, for how long, any legal holds, and what happens at the end (erase or anonymise).
  - **Archiving is for business state.** A class with history is archived, not deleted, so past reports stay right. Allow a real delete only for a record that was never used, checked in the same transaction.
  - **Personal data still has an end date.** When retention ends or erasure applies, erase or anonymise it, and keep only the facts reports need. Deletes reach caches, indexes, exports and processors.
- **TTL cleanup is housekeeping, not security.** Expired sessions and tokens are rejected at validation time, before the TTL job removes them.
- **Backups are not optional, even on a free tier.** Define what's backed up, the recovery targets, backup expiry (so erased data doesn't come back), and test a restore.
- **Write scripts default to dry-run** and need an explicit target, plus `--confirm=<database name>` for any hosted database.
- **Non-production data is synthetic or sanitised.** Document the sanitising before turning on any refresh from production. Never copy production data to a laptop.

## 7. Imports and syncs

- Define **authority per field**. Some fields belong to the importing system (staff corrections to a name or contact details). Others always follow the source (payment status, eligibility, revoked access).
- Track local overrides explicitly, offer a "use the source value" action, and surface conflicts instead of silently picking a winner.
- Reports use snapshots or effective dates, so archived records still count for the period they were active.

## 8. Background work, schedules and webhooks

- Use **durable jobs** (a queue such as BullMQ on Redis, or the platform's equivalent) for anything that must survive a crash: timed, bulk or slow work.
- **Design for at-least-once:**
  - give each business effect an idempotency key (and use the provider's own idempotency, e.g. for payments);
  - use transactional state transitions;
  - retry with backoff, send repeated failures to a dead-letter list, and have a replay procedure for operators.
- **Use an outbox** when a database change must reliably produce a job or event.
- **Workers behind flags** (`ENABLE_<WORKER>`), so a web instance can run without them. Before running two instances, move workers to their own process and find in-process state that breaks (timers, in-memory dedupe). Coordinate schedules so replicas don't double-fire.
- **List every schedule in one place:** in-repo repeatables, CLI jobs and external schedulers, with owner, timezone and overlap policy. A scheduler outside any repo still goes in the docs.
- **Webhooks:**
  - verify the provider's signature over the raw bytes, plus its timestamp and replay rules;
  - enforce payload limits;
  - durably record a deduplicated inbox entry *before* answering 2xx, and return a retryable error if you can't;
  - process from the inbox;
  - expect duplicates and out-of-order delivery.
- **Reconcile against the source** (a catch-up job) as often as the recovery target needs, e.g. nightly.

## 9. Access

- Every route checks the caller on the server. Hiding a button is not access control.
- **Object and tenant level:** resolve tenant membership from the authenticated identity. Check access to every object, including in lists, bulk actions, exports, jobs and subscriptions. Treat IDs supplied by the client as requests to validate, never as authority.
- Compute effective permissions from roles, scoped grants (per product or team) and owners. Gate routes declaratively (`gate(permission, scope)`).
- **Reads:** redact field groups (contact, address, notes, fees) unless the caller holds them, with no bypassing endpoints. **Writes:** allowlist writable fields, and reject changes to ownership or privilege fields.
- Visibility rules that come from the record (separate spaces, sensitive topics) are enforced here, never only in a client.
- Changes to who can see what are reviewed in a PR.

## 10. Environments and cost

- **Isolate environments:** separate credentials, databases, queues, storage and third-party test or live accounts.
- Load secrets from the platform's secret store. Validate required config at boot. An empty value never means production.
- **Release flow:** environment branches (`staging` deploys staging; the default branch deploys production once wired) are one good option; promoting one tested artifact is another. Either way, know which commit is where and how to roll back. Describe what's actually wired, not what's planned.
- **Cheapest hosting that meets the requirements.** Free tiers are a great default for staging and early production when their limits, sleep behaviour, backups and isolation fit. Paid capacity is fine when it meets a requirement more cheaply than engineering time. Nothing that starts a bill gets added without a decision.
- **CI:** to save minutes, CI can run when a PR is labelled ready (`run-ci`) instead of on every push, but make the check **required before merge**, so nothing merges untested. Cache dependencies and cancel superseded runs.
- **Observability before launch:**
  - structured, redacted logs, with request and job IDs that tie them together;
  - error tracking;
  - latency, errors, saturation and queue age;
  - alerts that go to an owner.

  Free options (the host's logs, a free tier of PostHog or similar) are fine. Product analytics is not the operational plan.
- **Liveness, readiness and release identity:** liveness says the process is up. Readiness says it can take traffic. A version endpoint (deployed SHA) says which release is running; it doesn't prove the release is healthy. Drain gracefully on shutdown.

## 11. Reliability and scaling

- **From day one:**
  - indexes for the queries you know about;
  - request, upload and page-size limits;
  - bounded concurrency and queue depth;
  - abuse limits on anonymous endpoints, sign-in and password reset, as well as per user and tenant;
  - connection-pool limits.
- **Uploads:**
  - authorise who may upload what, through short-lived grants scoped to one object (signed URLs);
  - enforce size and type, and verify completion on the server;
  - keep files private or quarantined until checked;
  - authorise downloads and clean up abandoned uploads.
- **When load grows, measure first, then fix the cheapest thing:**
  1. Remove waste in code: one DB client, session caching within the revocation budget, no needless polling, cached aggregates.
  2. Split processes: workers out, several web instances, shared state in Redis.
  3. Rework heavy queries: filter before joins, chunked runners, streamed exports.
  4. Add indexes and retention on the live database, with sign-off.

  Say what breaks first, at what number, before proposing a paid service.

## Write the design as

1. **Summary:** what's being built, in two sentences.
2. **Problem:** what's wrong today.
3. **Requirements:** from section 0.
4. **Who owns what:** the ownership table.
5. **Connections:** from → to, mechanism, endpoints, credential names on both sides, what breaks if it fails.
6. **Key decisions:** area → decision, with the alternatives considered.
7. **Failure and recovery:** dependency failures, retries and duplicates, backups and restores, rollback.
8. **Validation:** authorisation and tenant-isolation tests, contract compatibility, duplicate-delivery tests, migration rehearsal, a load test where it matters.
9. **Guardrails:** the rules that stop drift (one writer per field, a reason for any new service).
10. **Phases:** a shippable order.
11. **Open questions:** each with a recommended answer, for the owner to decide.

As code lands, track it with **Status** and **What's built today** checklists.

## Red Flags

- Two services writing the same field.
- A client calling a system of record directly "just this once".
- One credential shared by several callers, or a key that acts as admin.
- An `/internal` route with no authorisation.
- An outbound call with no deadline, or a retried non-idempotent call.
- A webhook acknowledged before it's durably recorded.
- A retried create with no idempotency key.
- Stale cached data used to grant access.
- Personal data with no retention end, or a delete that skips caches and backups.
- No tested restore.
- A sync with no per-field authority.
- A schedule nobody can find.
- An empty env var that means production.
- Code that can merge without its checks running.
- A paid tool before the code-only fixes.
