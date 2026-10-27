#!/usr/bin/env python3
"""Regenerate llms.txt: every docs page with its one-line summary, grouped by area."""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIP = {"_brief.md", "_polish.md"}
SECTIONS = [
    ("Start here", lambda p: len(p.parts) == 1),
    ("Architecture", lambda p: p.parts[0] == "architecture"),
    ("Decisions and RFCs", lambda p: p.parts[0] == "decisions"),
]
TITLE = "Engineering docs"
INTRO = "Docs for every codebase in this organisation. Every page has front matter with `sources` (code files) and `related` pages. The code on the default branch wins over these docs."
FIRST = ["README.md", "AGENTS.md", "getting-started.md", "how-we-work.md", "glossary.md", "known-issues.md"]


def meta(path):
    text = path.read_text(encoding="utf-8")
    title = summary = None
    fm = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if fm:
        for line in fm.group(1).splitlines():
            key, _, value = line.partition(":")
            value = value.strip().strip("\"'")
            if key == "title":
                title = value
            elif key == "summary":
                summary = value
        text = text[fm.end():]
    if not title:
        h = re.search(r"^# (.+)$", text, re.M)
        title = h.group(1).strip() if h else path.stem
    if not summary:
        body = re.sub(r"^#.*$", "", text, flags=re.M)
        para = next((b.strip() for b in body.split("\n\n")
                     if b.strip() and not b.strip().startswith(("```", ">", "|", "<", "-", "*", "!"))), "")
        summary = re.sub(r"\s+", " ", re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", para))[:200]
    return title, summary


def order(p):
    name = p.name
    return (0 if name == "README.md" else 1, FIRST.index(name) if name in FIRST else 99, str(p))


pages = sorted((p.relative_to(ROOT) for p in ROOT.rglob("*.md")
                if not any(part.startswith("_") for part in p.relative_to(ROOT).parts) and p.name not in SKIP),
               key=order)

out = [f"# {TITLE}", "", f"> {INTRO}", ""]
for name, test in SECTIONS:
    rows = [p for p in pages if test(p)]
    out += [f"## {name}", ""] + [f"- [{meta(ROOT / p)[0]}]({p.as_posix()}): {meta(ROOT / p)[1]}" for p in rows] + [""]
REPOS = sorted({p.parts[1] for p in pages if len(p.parts) > 2 and p.parts[0] == "repos"})
for repo in REPOS:
    rows = [p for p in pages if p.parts[:2] == ("repos", repo)]
    out += [f"## {repo}", ""] + [f"- [{meta(ROOT / p)[0]}]({p.as_posix()}): {meta(ROOT / p)[1]}" for p in rows] + [""]

(ROOT / "llms.txt").write_text("\n".join(out), encoding="utf-8")
print(f"llms.txt: {len(pages)} pages")
