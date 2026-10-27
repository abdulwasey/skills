# Brief for documentation agents (template)

Copy this to `_brief.md` at the docs root and fill in the bracketed parts. Every slice agent reads it first.

We are building `[org]/docs`: a private repo of plain Markdown files that lets a newcomer understand **almost everything** in [org]'s codebases: every feature, every module and every connection between services. You own one slice of one repo (given in your prompt). Cover it thoroughly, and stay inside it; other agents cover the rest.

Docs root: `[absolute path]`

## The repos

| Repo | What | Guide folder | Host URL | Branch @ commit | Local changes |
| --- | --- | --- | --- | --- | --- |
| [repo-a] | [one line] | `repos/[repo-a]/` | [https://github.com/org/repo-a] | [main @ 1a2b3c4] | [none] |
| [repo-b] | [one line] | `repos/[repo-b]/` | [https://github.com/org/repo-b] | [main @ 5d6e7f8] | [none] |

Document the code at that commit. If your checkout is somewhere else, say so in your final reply instead of documenting it.

Shared pages that will exist (link to them where relevant): `architecture/overview.md`, `architecture/connections.md`, `architecture/auth.md`, `architecture/data.md`, `architecture/environments.md`, `architecture/jobs-and-schedules.md`, `architecture/observability.md`, `architecture/external-services.md`, `architecture/lifecycles.md`, `how-we-work.md`, `glossary.md`, `known-issues.md`. From `repos/<repo>/` they are `../../architecture/<page>.md` and `../../<page>.md`.

[Deploy facts every agent must describe the same way, as observed in config, e.g. "`staging` deploys to the staging host; nothing deploys from `main`". Mark anything planned as planned only if a document says so.]

## What to write

One Markdown page per feature, module or topic you own, in your repo's guide folder, named in kebab-case. Each page:

```
# <Feature name>

<one or two sentences: what it is and who uses it>

## What it does          the user-visible behaviour, in plain words
## How it works          the flow step by step: entry points → logic → storage → side effects
## Key files             table: file (code link) | what it holds
## Data                  models, collections or tables it reads and writes; key fields
## API                   endpoints it exposes or calls (method, path, purpose); for frontends, the hooks or queries used
## Connections           other services, queues, webhooks and external APIs, linked to their pages
## Gotchas               edge cases, limits, surprises, doc-vs-code mismatches
```

Drop a section only when it truly doesn't apply. Prefer tables and numbered steps. 60–250 lines per page is normal.

Also write `_facts/<repo>-<slice>.md`, as bullets with file references:
- **Outbound calls**: target, base-URL env var name, endpoints, auth method (header, token type, key name).
- **Inbound**: endpoints and webhooks that others call here, and who calls them.
- **Data**: databases, collections or models, cache keys, queues, buckets.
- **Auth**: how users and services are authenticated.
- **Analytics and logs**: analytics events, error tracking, where logs go.
- **Env var names**, a few words each.
- **Hosting and deploy** facts.
- **Unsure**: anything you couldn't confirm.

And `_facts/<repo>-<slice>-pages.md`: one line per page, `path | one-line description`.

## Rules

- **Read the code, not just the docs.** If they disagree, follow the code and say so in Gotchas.
- **Plain English** for a newcomer: short sentences, explain jargon on first use, no marketing tone.
- **Links**: relative links between docs pages; code as permalinks to the commit in the table (`[host URL]/blob/<sha>/<path>`), only for files that exist. No `[[wikilinks]]`.
- **Accuracy over completeness.** Never guess. If unsure, write "check `<file>`" or list it under Unsure.
- **Never write** secrets, tokens, keys, passwords, connection strings, env var *values*, internal IPs, or any real person's name, email, phone number or ID. Use "a staff member" or "a customer" instead.
- **Read-only on code**: no edits, installs, servers, network or pushes. If a hook or policy blocks something, report it; never work around it. Write only inside the docs root.
- **Final reply**: the pages you wrote and the 5–10 most important cross-service facts.
