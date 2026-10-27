---
name: codebase-docs
description: Use when asked to create or substantially rebuild a docs repo of linked Markdown pages for one or more codebases, covering every feature, module and connection between services so new developers and AI agents can find their way, e.g. "document the codebase", "build a docs repo for our services", "onboarding docs for all our repos". Not for answering one architecture question, exploring a repo, a single README, or API reference generated from a spec.
---

# Codebase → Docs Repo

## Overview

Agents read the code. Each one owns a slice and writes one page per feature. Next, an integrator writes the cross-service pages from the facts files the slice agents leave behind. A polish pass then gives every page the same shape. Last come the checks: links, diagrams, and secrets and personal data.

**Core principle:** the code wins. Every page describes what the code does at a recorded commit. Where a comment, a README or a PRD disagrees, the page says so and the mismatch goes on a known-issues list. Nobody "fixes" the docs to match a stale comment.

## When to Use

- A team has several repos and nobody can say how they connect.
- New developers or agents keep asking the same "where is X / who calls Y" questions.
- An old wiki or knowledge base has drifted from the code.

Not for: a question you can answer by reading code ("how does X reach Y?" — just answer it), API reference generated from an OpenAPI spec (link to it instead), or one-off READMEs.

## The Pipeline

```
size → slice → brief → slice agents (pages + facts) → integrator (shared pages, indexes, links)
     → polish agents (front matter, shape, diagrams) → AGENTS.md → checks + llms.txt → publish
```

If the host can't run subagents, do the same slices one after another yourself. Keep the facts files and the integration step: they are what stop the shared pages from drifting. When it can, cap parallel agents at the host's limit and give each one files nobody else writes.

### 0. Scaffold the docs root

```bash
DOCS_ROOT=<new folder outside every code repo>
SKILL_DIR=<folder holding this SKILL.md>
mkdir -p "$DOCS_ROOT/scripts" && cp "$SKILL_DIR"/scripts/* "$DOCS_ROOT/scripts/"
cd "$DOCS_ROOT"
python3 -m pip install pyyaml                      # if `python3 -c 'import yaml'` fails
npm i --prefix scripts mermaid@11.4.1 jsdom@25.0.1 # Node 20+; lands in scripts/node_modules, which every check skips
```

Every script takes the docs root as an argument (default: the current folder), so run them from `$DOCS_ROOT`, never from the skill folder.

### 1. Size before you slice

Count source lines per repo, then per top-level folder. Adjust the extensions and exclusions to the languages the repo actually uses:

```bash
git ls-files -z -- '*.ts' '*.tsx' '*.js' '*.py' '*.go' '*.rb' '*.java' '*.kt' '*.rs' '*.cs' '*.php' '*.swift' '*.vue' \
  ':!:*generated*' ':!:*.test.*' ':!:*.spec.*' | xargs -0 cat -- | wc -l
git ls-files -z | python3 -c 'import sys,collections; c=collections.Counter(p.split("/")[0] for p in sys.stdin.read().split("\0") if p); [print(n, d) for d, n in c.most_common(20)]'   # file counts per folder
```

Rule of thumb: one agent per ~60k lines, cut along domain lines. A big backend splits into *platform* (app setup, auth, config, data model, queues, integrations, scripts), then one or two *feature* slices by domain. Give every slice an explicit list of folders and services it owns, so no two agents document the same thing and nothing is left out.

### 2. One shared brief

Write `_brief.md` at the docs root from [brief-template.md](brief-template.md) before you spawn anyone. It holds:
- the repo table, with each repo's **host URL, branch and commit SHA** (`git rev-parse HEAD`) and whether the checkout had local changes, so every agent documents the same revision;
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

Describe deploy wiring as you observe it in config. Call something planned only when a document or the user says so.

Then run `python3 scripts/check-links.py` and fix links that point at guessed page names. Agents guess sibling names constantly.

### 5. Polish for humans and agents

A second pass with [polish.md](polish.md) gives every page the same shape:
- YAML front matter (`title`, `summary`, `sources`, `related`, `last_verified`)
- a TL;DR box and the fixed section order
- a Related list at the end
- at least one Mermaid diagram wherever there's a flow or a status
- GitHub alerts on gotchas
- reference lists (endpoints, env vars, files, flags) in tables

Give each polish agent one folder; give the root and `architecture/` pages to one more. Run polish only after the integrator's link fixes, so the two passes never edit the same file at once.

### 6. Entry points for agents

Write **`AGENTS.md`**: the layout table, the page shape, "the code wins", "quote identifiers exactly", and a "question → start at" table. `llms.txt` comes from the checks below.

### 7. Checks (all must pass before publishing)

Run them after the last page is written, from the docs root:

```bash
python3 scripts/check-links.py         # inline, reference and image links, `related`, and #anchors
node scripts/check-mermaid.mjs .       # every mermaid block parses with the real parser
scripts/scan-sensitive.sh .            # path:line:rule for emails, credential URLs, keys, secret assignments, phones, long numbers
python3 scripts/build-llms.py . --title "<Org> engineering docs"   # llms.txt; fails on a page without title or summary
```

`scan-sensitive.sh` never prints the matched text; open each hit and judge it. It exits 0 when clean, 1 with findings, 2 on a scan error. A clean scan is not proof: regexes can't find names. Example IDs copied from test fixtures are often real people's IDs, so replace them with obvious placeholders (`123456`).

### 8. Publish

These docs name internal hosts, env vars and data flows. Prepare everything locally first.

- Push only to a destination the user named. Before the first push, check its owner, host and **private** visibility. If no destination was given, show the user the proposed one and the file list, and wait.
- Review the exact files and history you are about to push. What the checkers skip is still published: drop `_brief.md`, `_polish.md`, `_facts/` and `scripts/node_modules/` unless the user wants them kept.
- Plain Markdown on GitHub costs nothing: no site, hosting or CI needed.

## Rules for Every Agent

- **Read the code, not just the docs.** Describe current behaviour; record disagreements in Gotchas or footnotes and in `known-issues.md`.
- **Never write** secrets, env var *values*, connection strings, internal IPs, or any real person's name, email, phone or ID. Env var *names* and code identifiers are fine.
- **Read-only on source.** No edits, installs, servers or pushes in the code repos. Write only under the docs root.
- **Links:** use relative links between pages, and permalinks to the commit in the brief for code (`https://github.com/<org>/<repo>/blob/<sha>/<path>`, or the host's equivalent), only to files that exist.
- **Never guess.** Put it under "Unsure" instead.

## Traps

| Trap | Fix |
| --- | --- |
| Agents link to sibling pages by guessed names (`auth.md` vs `auth-and-permissions.md`) | The integrator runs the link checker and fixes links last, against real file names |
| A page under `repos/<repo>/` links `connections.md` and means the shared page | Spell shared pages in full: `../../architecture/connections.md` |
| Mermaid breaks on `<br/>` or `<` in labels, `;` in sequence messages, `:x` in state transition labels, or a participant called `link` | Quote labels (`A["POST /api/x"]`), keep labels plain, and run `check-mermaid.mjs` |
| YAML front matter breaks when a `summary` contains `: ` | Quote the value or reword it |
| A hook or policy blocks a file name or command | Read and report the reason. Never rename or rephrase the operation to get past it; go on only with an alternative that is explicitly allowed |
| Code, CLAUDE.md and PRDs disagree on thresholds or flags | Document the code, footnote the claim in the doc, add it to known-issues |
| Docs reveal a committed secret or a real bug | Report it to the owner straight away; don't just write it down |
| Old names survive in env vars and paths after a rename | Add a "leftover old names" table to `connections.md` and the glossary |
| Agents document different revisions of a moving branch | Pin each repo's SHA in the brief and link code to it |
