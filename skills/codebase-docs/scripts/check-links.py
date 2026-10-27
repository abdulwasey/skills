#!/usr/bin/env python3
"""Check that every relative Markdown link in the docs points at an existing file.

Usage: python3 scripts/check-links.py   (run from the docs root)
Anchors (#...) and external URLs are not checked. Exits 1 if any link is broken.
"""
import os
import re
import sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
broken = []
for dirpath, _, files in os.walk(root):
    if os.sep + "_" in dirpath or os.sep + "." in dirpath:
        continue
    for name in files:
        if not name.endswith(".md") or name.startswith("_"):
            continue
        path = os.path.join(dirpath, name)
        text = re.sub(r"```.*?```", "", open(path, encoding="utf-8").read(), flags=re.S)
        for match in re.finditer(r"\]\(([^)\s]+)\)", text):
            target = match.group(1)
            if re.match(r"^[a-z]+:", target) or target.startswith("#"):
                continue
            file_part = target.split("#")[0]
            if file_part and not os.path.exists(os.path.normpath(os.path.join(dirpath, file_part))):
                broken.append(f"{os.path.relpath(path, root)} -> {target}")

print("\n".join(broken))
print(f"{len(broken)} broken link(s)", file=sys.stderr)
sys.exit(1 if broken else 0)
