"""The one file-selection rule shared by check-links.py and build-llms.py."""
import os
import pathlib

SKIP_DIRS = {"node_modules", "scripts"}
SKIP_FILES = {"_brief.md", "_polish.md"}


def docs_root(argv):
    root = pathlib.Path(argv[1] if len(argv) > 1 else ".").resolve()
    if not root.is_dir():
        raise SystemExit(f"not a directory: {root}")
    return root


def pages(root):
    """Every published .md page, relative to root. Skips dot and underscore folders below root."""
    found = []
    for dirpath, dirs, files in os.walk(root):
        dirs[:] = sorted(d for d in dirs if not d.startswith((".", "_")) and d not in SKIP_DIRS)
        for name in sorted(files):
            if name.endswith(".md") and name not in SKIP_FILES and not name.startswith("_"):
                found.append(pathlib.Path(dirpath, name).relative_to(root))
    return found


def front_matter(text):
    """Split YAML front matter from the body. Returns (dict, body)."""
    text = text.replace("\r\n", "\n")
    if not text.startswith("---\n"):
        return {}, text
    end = text.find("\n---\n", 4)
    if end == -1:
        return {}, text
    import yaml

    data = yaml.safe_load(text[4:end]) or {}
    return (data if isinstance(data, dict) else {}), text[end + 5:]
