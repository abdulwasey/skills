---
name: backend-system-design
description: Use when designing a new backend or service, or deciding where a backend feature lives - who owns which data, whether to add a service, how services authenticate to each other, identity and tokens, API contracts, queues and schedules, webhooks, deletes and imports, environments, cost and scaling. Also use when reviewing a backend design doc or RFC, or when "which service should this go in" comes up.
---

# Backend System Design

## Overview

A small set of services, each the only owner of its data, talking through typed contracts and dedicated keys, running on free tiers until load says otherwise. The design is written down as an ownership table and a connections table before any code.

**Core principle:** every piece of data has exactly one owner, and everyone else reaches it only through that owner's API.

For web and mobile clients of these services, see `web-system-design` and `app-system-design` in this repo.

## When to Use

- Starting a new product, service or backend module.
- A feature could live in more than one service.
- Adding a service-to-service call, a webhook, a queue or a schedule.
- Writing or reviewing an RFC for backend work.

Not for: code-level structure inside one service (see `code-design`).

## The Decisions

| # | Decision | Default |
|---|---|---|
| 1 | Who owns the data | One system of record per domain; an ownership table decides where features go |
| 2 | How many services | As few as possible; a new one needs a written reason |
| 3 | Identity | One account service; short-lived asymmetric JWTs verified locally |
| 4 | Client backends | One backend per client surface that owns only that client's data |
| 5 | Service-to-service | A dedicated key per caller, per-consumer internal routes, timeouts |
| 6 | Contracts | OpenAPI generated from the code; consumers use generated clients |
| 7 | Data | A database per service; archive, don't erase; the owner's edits win |
| 8 | Background work | Queues for timed and bulk work; workers behind flags; webhooks ack fast |
| 9 | Access | Checked on the server per request; fields redacted by permission |
| 10 | Environments and cost | Branch per environment, free tiers, nothing paid without a decision |
| 11 | Scaling | Remove waste in code before buying anything |

## 1. One owner per piece of data

Write the ownership table first. It decides where every new feature lives.

| System | Owns | Others get it through |
|---|---|---|
| CMS / website | Catalogue, pricing, checkout, members | Its public listing API |
| System of record | Customers, staff, enrolments, operations | Its internal API |
| Account service | Accounts, sign-in, tokens, role grants | Its tokens and public keys; an admin API |
| App backend | App-only data: profiles, community, devices | Its API |
| Third parties | What they're best at (chat, video, payments) | Their SDKs and webhooks |

- A service may **cache** what another owns, never **own a copy**. Every cached record keeps a `fetchedAt`, and responses say when they're `stale`, so clients can show last-known data when the owner is slow or down.
- Only one service talks to each external system of record (an LMS, an ERP). Everyone else goes through that service.

## 2. Few services, one style

- Start with one service made of modules. Split only for a different owner, a different client, or different scaling, and write down the reason.
- Use one backend style across services: same framework, same ORM, same layout, same scripts. That way anyone can work in any repo.
- Name each service for its role, and finish renames: env vars, hostnames and routes. Keep a "leftover old names" table until they're gone.

## 3. Identity

- **One account per person** in an account service, not one per product.
- **Provision accounts when membership is already known** (a roster, an LMS, a CRM), and let people claim them by email. Self sign-up only when anyone may join.
- **Tokens:** a long session (around 30 days, refreshed) gives a **short access JWT** (around 15 minutes), signed asymmetrically (EdDSA or RS256). Services verify it locally against the JWKS and check `iss`, `aud` and `email_verified`. Roles go in claims; each service maps roles to its own permissions.
- **Account gates** are explicit errors (`403 ACCOUNT_NOT_READY`) that clients can route on, not silent empty data.
- **Acting as a user** ("login as") is allowlisted per person, capped (one hour), audited, and visible in the token (`act.sub`). Every write under it is logged.
- Staff and customer identities may stay separate at first. Write down that they aren't linked, and where.

## 4. A backend per client surface

When a client (a mobile app, a partner portal) needs data from several owners, give it one backend:
- It owns only that client's data: profiles, devices, feeds, moderation.
- It reads everything else live from the owners, with a read cache and fallback.
- It issues short-lived tickets for third-party SDKs the client uses directly (chat session tokens, video SDK signatures, signed upload URLs), so secrets never ship in the client.
- It sends push notifications. The client only registers devices.

## 5. Service-to-service calls

| Rule | Why |
|---|---|
| **One key per caller pair**, named on both sides (`CALLER_API_KEY` here = `TARGET_KEY` there), with a key-mapping table in the docs | Rotate one caller without breaking the rest; know who called |
| **Internal routes per consumer** (`/api/internal/<consumer>/*`) | Each consumer's contract is visible and can change alone |
| **An audit actor per caller** (`WEBSITE`, `CRON`, `APP_BACKEND`) | Logs and history say which machine did it |
| **Least privilege** for the synthetic user behind each key | A key that acts as admin turns any leak into full access |
| **A timeout on every outbound call** (5–15 s) | One slow partner can't hang the whole API |
| **Fire-and-forget is a decision**, written down with what's lost on failure | Otherwise "reply saved but the user was never told" goes unnoticed. Prefer a queue with retries |
| **Missing optional config answers `503 "<X> is not set up"`**, not a crash | A service boots in every environment without every partner |

## 6. Contracts

- Generate the OpenAPI spec from the code (decorators or schemas), never by hand.
- Consumers use a **generated client**, regenerated by a script (`api:gen`) and never edited. Hand-written clients drift.
- Serve the spec from each environment (`/swagger.json`) so clients can generate against staging.
- Change contracts additively: add the field or route, move consumers over, then remove the old one.

## 7. Data

- **A database per service**, each with its own database user. They can share one free cluster until load says otherwise.
- **Archive, don't erase,** once a record has history. A real delete is allowed only when the record was never used, checked in the same transaction as the delete.
- **The owner's edits win over imports.** If staff correct a record, the next sync must not undo it. Track which field groups are owned locally, and give the user a "use the imported value" action.
- **Past reports still count archived records** for the period they were active.
- **Retention:** TTL indexes for sessions, raw webhook payloads and tokens. Write the retention table before launch.
- **Scripts that write refuse hosted databases** unless they're given `--confirm=<database name>`.
- **No production data on laptops.** Use staging data and a refresh script.

## 8. Background work, schedules and webhooks

- Use queues (BullMQ on Redis, or the platform's equivalent) for anything timed, bulk or slow. Jobs are idempotent and keyed so a retry is safe.
- **Workers behind flags** (`ENABLE_<WORKER>`), so a web instance can run without them. Move workers to their own process before running two web instances, and find any in-process state that breaks with two.
- **List every schedule in one place** (in-repo repeatables, CLI jobs, external schedulers), with the owner and time. A scheduler outside any repo must still be in the docs.
- **Webhooks:** verify the signature, store the payload, answer 2xx at once, process later. Never do slow work before acknowledging.
- **A nightly catch-up job** re-runs anything a missed event or failed day left behind.

## 9. Access

- Every route checks the caller on the server and returns only what they may see. Hiding a button is not access control.
- Compute effective permissions per request from roles, scoped grants (per product or team) and owners. Gate routes declaratively (`gate(permission, scope)`).
- Redact field groups (contact, address, notes, fees) unless the caller holds them. No endpoint bypasses the redaction.
- Changes to who can see what are reviewed in a PR before release.
- Visibility rules that come from the record (separate spaces, sensitive topics) are enforced in the backend, never only in a client.

## 10. Environments and cost

- **A branch per environment.** `staging` deploys staging. The default branch deploys production once that's wired up. Describe what's actually wired, not what's planned.
- Configure each environment only through env vars. A missing required variable stops boot; it never falls back to production.
- **Free tiers by default:** one shared database cluster, free staging instances, plain Markdown docs, PostHog for errors and analytics, no log drains. Anything that starts a bill needs a decision.
- CI runs on a label, not on every push, so the free minutes last.
- Health checks show the process is up. A version endpoint that returns the deployed SHA shows the release is live.

## 11. Scaling

Plan scaling in phases, cheapest first:
1. **Stop the waste (code only):** one DB client, session cookie cache, timeouts, no polling, cached stats, per-user rate limits.
2. **Split processes:** workers separate, several web instances, shared state moved to Redis.
3. **Heavy queries:** filter before joins, chunked runners, streamed exports.
4. **Indexes and retention** on the live database, with sign-off.

Say what breaks first, at what number, before proposing a paid service.

## Write the design as

1. **Summary:** what's being built, in two sentences.
2. **Problem:** what's wrong today.
3. **Who owns what:** the ownership table.
4. **Connections:** from → to, mechanism, endpoints, auth and key names on both sides, what breaks if it fails.
5. **Key decisions:** a table of area → decision.
6. **Guardrails:** the rules that stop drift (one style, cache-not-copy, a reason for any new service).
7. **Phases:** a shippable order.
8. **Open questions:** each with a recommended answer, for the owner to decide.

Then track it with **Status** and **What's built today** checklists as the code lands.

## Red Flags

- Two services both writing the same entity.
- A client calling a system of record directly "just this once".
- One key shared by several callers, or a key that acts as admin.
- An outbound call with no timeout.
- A delete button on data with history.
- A sync that overwrites staff edits.
- A schedule nobody can find in a repo or the docs.
- An env var whose empty value means production.
- "We'll add a paid tool for that" before the code-only fixes.
