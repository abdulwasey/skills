---
name: codebase-docs
description: Use when turning one or more codebases into a docs repo of linked Markdown pages that new developers and AI agents can navigate, covering every feature, module and connection between services. Triggers - "document the codebase", "docs repo for our services", "onboarding docs", "architecture docs", "how do our services connect", "make the code understandable for new devs / agents".
---

# Codebase → Docs Repo

## Overview

Parallel agents read the code. Each one owns a slice and writes one page per feature. Next, an integrator writes the cross-service pages from the facts files the slice agents leave behind. A polish pass then gives every page the same shape. Last come the checks: links, diagrams, and secrets and personal data.

**Core principle:** the code wins. Every page describes what the code does today. Where a comment, a README or a PRD disagrees, the page says so and the mismatch goes on a known-issues list. Nobody "fixes" the docs to match a stale comment.

## When to Use

- A team has several repos and nobody can say how they connect.
- New developers or agents keep asking the same "where is X / who calls Y" questions.
- An old wiki or knowledge base has drifted from the code.

Not for: API reference generated from an OpenAPI spec (link to it instead), or one-off READMEs.

## The Pipeline

```
size → slice → brief → slice agents (pages + facts) → integrator (shared pages, indexes, links)
     → polish agents (front matter, shape, diagrams) → checks → AGENTS.md + llms.txt → publish
```

### 1. Size before you slice

Count non-generated source lines per repo, then per top-level folder:

```bash
git ls-files | grep -E '\.(ts|tsx|js|py|go|rb)$' | grep -vE 'generated|openapi|\.test\.|\.spec\.' | xargs cat | wc -l
git ls-files | awk -F/ '{print $1"/"$2"/"$3}' | sort | uniq -c | sort -rn | head -20
```

Rule of thumb: one agent per ~60k lines, cut along domain lines. A big backend splits into *platform* (app setup, auth, config, data model, queues, integrations, scripts), then one or two *feature* slices by domain. Give every slice an explicit list of folders and services it owns, so no two agents document the same thing and nothing is left out.

### 2. One shared brief

Write `_brief.md` at the docs root from [brief-template.md](brief-template.md) before you spawn anyone. It holds:
- the repo table and guide folder names;
- the shared pages that will exist, so agents can link to them before they're written;
- the page format;
- the facts-file format;
- the safety rules.

Each agent prompt is then short: "read the brief, your slice is X, here are the source paths".

### 3. Slice agents write pages and a facts file

Each slice agent writes:
- **One page per feature** in `repos/<repo>/`, in kebab-case, in the fixed section order.
- **`_facts/<repo>-<slice>.md`**: outbound calls, with target, base-URL env var, endpoints and auth header. Also inbound callers and webhooks; data stores, collections and queues; auth; analytics and logs; env var *names*; hosting; and an **Unsure** list.
- **`_facts/<repo>-<slice>-pages.md`**: one line per page, `path | description`.

The facts files are what make the architecture pages possible without anyone re-reading every repo.

### 4. Integrator writes the shared pages

From the facts files, checking doubtful points in code, write:

| Page | Holds |
| --- | --- |
| `README.md` | What the platform is, a five-link start path, the repo table, the shared pages list, how to contribute |
| `getting-started.md` | Access needed (named systems, no credentials), tools, run each service locally, a first-week checklist |
| `architecture/overview.md` | People → products → services → partners, plus a sequence diagram for each key journey |
| `architecture/connections.md` | **The reference.** One row per connection: from, to, mechanism, endpoints, auth header, env var names on *both* sides, what breaks if it fails. Include a key-name mapping table (service A's `X_KEY` = service B's `Y_KEY`) and leftover old names. |
| `architecture/auth.md`, `data.md`, `environments.md`, `jobs-and-schedules.md`, `lifecycles.md`, `observability.md`, `external-services.md` | One concern each, across all repos |
| `how-we-work.md`, `glossary.md`, `known-issues.md` | Process; every term linked to its page; probable bugs and doc-vs-code mismatches gathered from every Unsure list |
| `repos/<repo>/README.md` | Index of every page in that folder, grouped by area |

Then run the link checker across everything and fix links that point at guessed page names. Agents guess sibling names constantly.

### 5. Polish for humans and agents

A second pass with [polish.md](polish.md) gives every page the same shape:
- YAML front matter (`title`, `summary`, `sources`, `related`, `last_verified`)
- a TL;DR box and the fixed section order
- a Related list at the end
- at least one Mermaid diagram wherever there's a flow or a status
- GitHub alerts on gotchas
- identifiers, endpoints, env vars and files in tables, never in prose

Run it only after the integrator's link fixes, so the two passes never edit the same file at once.

### 6. Checks (all must pass before publishing)

```bash
python3 scripts/check-links.py                 # every relative link resolves
node scripts/check-mermaid.mjs .               # every diagram parses (npm i mermaid@11 jsdom@25 once)
scripts/scan-sensitive.sh . yourcompany.com    # emails, credential URLs, keys, phones, ID-shaped numbers
python3 scripts/build-llms.py                  # regenerate llms.txt from front matter
```

Read every scan hit by hand. Example IDs copied from test fixtures are often real people's IDs, so replace them with obvious placeholders (`123456`).

### 7. Entry points for agents

- **`AGENTS.md`**: the layout table, the page shape, "the code wins", "quote identifiers exactly", and a "question → start at" table.
- **`llms.txt`**: every page with its one-line summary, grouped by area. Rebuild it with `build-llms.py` whenever pages change.

### 8. Publish privately

These docs name internal hosts, env vars and data flows, so they belong in a **private** repo. Plain Markdown on GitHub costs nothing: no site, hosting or CI needed. Exclude `_brief.md`, `_polish.md` and `_facts/`, or keep them as provenance in a folder the link checker skips.

## Rules for Every Agent

- **Read the code, not just the docs.** Describe current behaviour; record disagreements in Gotchas or footnotes and in `known-issues.md`.
- **Never write** secrets, env var *values*, connection strings, internal IPs, or any real person's name, email, phone or ID. Env var *names* and code identifiers are fine.
- **Read-only on source.** No edits, installs, servers or pushes in the code repos. Write only under the docs root.
- **Links:** use relative links between pages, and full `https://github.com/<org>/<repo>/blob/<branch>/<path>` links for code, only to files that exist.
- **Never guess.** Put it under "Unsure" instead.

## Traps

| Trap | Fix |
| --- | --- |
| Agents link to sibling pages by guessed names (`auth.md` vs `auth-and-permissions.md`) | The integrator runs the link checker and fixes links last, against real file names |
| Mermaid breaks on `<br/>` or `<` in labels, `;` in sequence messages, `:x` in state transition labels, or a participant called `link` | Quote labels (`A["POST /api/x"]`), keep labels plain, and run `check-mermaid.mjs` |
| YAML front matter breaks when a `summary` contains `: ` | Quote the value or reword it |
| A tool hook blocks some file names or commands | Rename the page and update the index; don't fight the hook |
| Code, CLAUDE.md and PRDs disagree on thresholds or flags | Document the code, footnote the claim in the doc, add it to known-issues |
| Docs reveal a committed secret or a real bug | Report it to the owner straight away; don't just write it down |
| Old names survive in env vars and paths after a rename | Add a "leftover old names" table to `connections.md` and the glossary |
