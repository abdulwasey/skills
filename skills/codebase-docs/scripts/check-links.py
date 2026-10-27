#!/usr/bin/env python3
"""Check every relative link in the docs: inline, reference-style, images, front matter `related`,
and #heading anchors (GitHub slug rules). External URLs are not checked.

Usage: python3 scripts/check-links.py [docs-root]   (default: current directory; needs PyYAML)
Exits 1 if any link is broken or no pages were found.
"""
import re
import sys
import urllib.parse

from docs_files import docs_root, front_matter, pages

FENCE = re.compile(r"^ {0,3}(`{3,}|~{3,}).*?^ {0,3}\1[`~]*[ \t]*$", re.M | re.S)
INLINE_CODE = re.compile(r"(`+)(?!`).*?(?<!`)\1(?!`)", re.S)
INLINE = re.compile(r"!?\[(?:[^\[\]]|\[[^\]]*\])*\]\(\s*(<[^>]*>|[^\s)]+)(?:\s+[\"'(][^)]*)?\)")
REFDEF = re.compile(r"^ {0,3}\[(?!\^)[^\]]+\]:\s*(<[^>]*>|\S+)", re.M)
HEADING = re.compile(r"^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$", re.M)
HTML_ID = re.compile(r"""\b(?:id|name)=["']([^"']+)["']""")


def slug(heading):
    text = re.sub(r"`|\*\*|__|\[([^\]]*)\]\([^)]*\)", r"\1", heading).strip().lower()
    return re.sub(r"\s", "-", re.sub(r"[^\w\- ]", "", text))


cache = {}


def anchors(path):
    if path not in cache:
        _, body = front_matter(path.read_text(encoding="utf-8"))
        body = FENCE.sub("", body)
        seen, found = {}, set(HTML_ID.findall(body))
        for h in HEADING.findall(body):
            s = slug(h)
            n = seen.get(s, 0)
            seen[s] = n + 1
            found.add(s if n == 0 else f"{s}-{n}")
        cache[path] = found
    return cache[path]


root = docs_root(sys.argv)
files = pages(root)
broken = []
for rel in files:
    path = root / rel
    meta, body = front_matter(path.read_text(encoding="utf-8"))
    body = INLINE_CODE.sub("", FENCE.sub("", body))
    targets = [m.strip("<>") for m in INLINE.findall(body) + REFDEF.findall(body)]
    related = meta.get("related") or []
    targets += [r for r in related if isinstance(r, str)]
    for target in targets:
        if re.match(r"^[a-z][a-z0-9+.-]*:", target, re.I) or target.startswith("//"):
            continue
        file_part, _, frag = target.partition("#")
        dest = (path.parent / urllib.parse.unquote(file_part)).resolve() if file_part else path
        if not dest.exists():
            broken.append(f"{rel} -> {target}")
        elif frag and dest.suffix == ".md" and urllib.parse.unquote(frag).lower() not in anchors(dest):
            broken.append(f"{rel} -> {target} (no such heading)")

print("\n".join(broken))
print(f"{len(files)} page(s) checked, {len(broken)} broken link(s)", file=sys.stderr)
sys.exit(1 if broken or not files else 0)
