#!/usr/bin/env python3
"""Regenerate llms.txt: every docs page with its one-line summary, grouped by area.

Usage: python3 scripts/build-llms.py [docs-root] [--title "Acme engineering docs"]   (needs PyYAML)
Exits 1 if a page has no title or summary, so fix the front matter and rerun.
"""
import re
import sys
import urllib.parse

from docs_files import docs_root, front_matter, pages

args = sys.argv[1:]
title = "Engineering docs"
if "--title" in args:
    i = args.index("--title")
    title = args[i + 1]
    del args[i:i + 2]
INTRO = ("Every page has front matter with `sources` (code files) and `related` pages. "
         "The code wins over these docs.")
FIRST = ["README.md", "AGENTS.md", "getting-started.md", "how-we-work.md", "glossary.md", "known-issues.md"]
SECTIONS = [
    ("Start here", lambda p: len(p.parts) == 1),
    ("Architecture", lambda p: p.parts[0] == "architecture"),
    ("Decisions and RFCs", lambda p: p.parts[0] == "decisions"),
]

root = docs_root([sys.argv[0]] + args)
all_pages = sorted(pages(root), key=lambda p: (len(p.parts) > 1, FIRST.index(p.name) if p.name in FIRST else 99, str(p)))
errors = []


def entry(p):
    meta, body = front_matter((root / p).read_text(encoding="utf-8"))
    name, summary = meta.get("title"), meta.get("summary")
    if not isinstance(name, str):
        h = re.search(r"^# (.+)$", body, re.M)
        name = h.group(1).strip() if h else None
    if not isinstance(name, str) or not isinstance(summary, str) or not summary.strip():
        errors.append(f"{p}: needs a string title and summary in front matter")
        return None
    label = re.sub(r"([\[\]])", r"\\\1", name)
    return f"- [{label}]({urllib.parse.quote(p.as_posix())}): {' '.join(summary.split())}"


groups = [(name, [p for p in all_pages if test(p)]) for name, test in SECTIONS]
for repo in sorted({p.parts[1] for p in all_pages if len(p.parts) > 2 and p.parts[0] == "repos"}):
    groups.append((repo, [p for p in all_pages if p.parts[:2] == ("repos", repo)]))
placed = {p for _, rows in groups for p in rows}
groups.append(("Other", [p for p in all_pages if p not in placed]))

out, emitted = [f"# {title}", "", f"> {INTRO}", ""], 0
for name, rows in groups:
    lines = [line for line in map(entry, rows) if line]
    if lines:
        out += [f"## {name}", ""] + lines + [""]
        emitted += len(lines)

if errors:
    print("\n".join(errors), file=sys.stderr)
    sys.exit(1)
(root / "llms.txt").write_text("\n".join(out), encoding="utf-8")
print(f"llms.txt: {emitted} of {len(all_pages)} pages")
