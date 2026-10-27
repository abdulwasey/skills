# Polish brief: make every page easy for new developers and AI agents

Give this to each polish agent along with `_brief.md`. Fill in the paths.

The pages under `repos/` are accurate but plain. Your job is to make each page in your folder easy to read for someone on their first week, and easy for an AI agent to navigate. **Don't lose any facts** and don't invent any: if you add a diagram or a sentence, it must come from the page itself or from the source code (read-only). Keep the brief's safety rules (`_brief.md`): no secrets, no env values, no real names, emails, phone numbers or student IDs.

## 1. Front matter on every page

Start every page with YAML front matter (GitHub shows it as a small table):

```yaml
---
title: Attendance
summary: How Zoom meeting data becomes attendance records in the LMS.
repo: backend-api
audience: [developer, agent]
sources:
  - src/services/attendance/AttendanceService.ts
  - src/controllers/AttendanceController.ts
related:
  - ../web-app/attendance.md
  - zoom.md
last_verified: YYYY-MM-DD
---
```

`sources` are repo-relative paths of the main files the page explains (3–10). `related` are relative links to the closest other doc pages. `summary` is one plain sentence.

## 2. The same shape on every page

After the front matter:

1. `# Title`
2. A **TL;DR** box: `> [!NOTE]` with 2–4 short bullets: what it is, who uses it, the one thing to know.
3. **On this page** line with anchor links (pages over ~80 lines).
4. The existing sections, in this order where they apply: What it does · How it works · Key files · Data · API · Connections · Gotchas. Keep the content; tighten wording to short sentences.
5. A final **Related** list (same links as front matter, with a few words each).

## 3. Use GitHub Markdown features where they help

- **Mermaid**:
  - `sequenceDiagram` for any request or job flow with 3+ steps across components or services.
  - `stateDiagram-v2` for anything with statuses.
  - `flowchart` for decision logic (for example, how a status is chosen).
  - `erDiagram` for a feature's main models and their relations.
  - Aim for at least one diagram on every feature page where a flow or status exists. Quote node labels that contain punctuation (`A["POST /api/x"]`).
  - Validate every diagram with `node scripts/check-mermaid.mjs <your folder>`. It must report 0 invalid.
- **Alerts**:
  - `> [!WARNING]` / `> [!CAUTION]` for gotchas that can break things or leak data.
  - `> [!IMPORTANT]` for feature flags that must be on.
  - `> [!TIP]` for shortcuts.
- **Tables** with aligned columns. Put **endpoints**, **env var names**, **files** and **flags** in tables, never in prose.
- `<details><summary>…</summary>` to fold long reference tables (for example a full endpoint list) below the main explanation.
- **Code blocks** with language tags for commands and short examples.
- **Footnotes** (`[^1]`) for caveats such as "comment says X, code does Y".

## 4. For AI agents

- Always give exact identifiers in backticks: file paths, function and class names, endpoints with method, env var names, queue names, collection names. Never paraphrase an identifier.
- Link code with full GitHub URLs (`https://github.com/<org>/<repo>/blob/main/<path>`), only to files that exist.
- Make each page stand alone: define a term on first use, or link it to `../../glossary.md`.
- Shared pages to link to where relevant: `../../architecture/overview.md`, `connections.md`, `auth.md`, `data.md`, `environments.md`, `jobs-and-schedules.md`, `lifecycles.md`, `observability.md`, `external-services.md`, `../../how-we-work.md`, `../../known-issues.md`.

## 5. Finish

- Run `python3 scripts/check-links.py` (from the docs root) and fix every broken link in your folder.
- Run the Mermaid check on your folder.
- Keep the folder's `README.md` index in sync if you rename nothing (don't rename pages).
- Final reply: pages polished, diagrams added (count by type), link and Mermaid check results.
