#!/usr/bin/env python3
"""Workspace inventory scanner for hikaru-agent / HIKARU-AI.

Walks a directory tree, categorizes files by type and size, records
modification timestamps (git history when available, filesystem mtime otherwise),
and writes inventory.json + inventory.csv.

Usage: python scan_inventory.py <repo_path> [out_dir]
"""
import csv, json, os, subprocess, sys
from datetime import datetime, timezone

CATEGORIES = {
    "Source (TS/React)": {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"},
    "Source (Python)": {".py"},
    "Scripts": {".ps1", ".sh", ".bat", ".cmd"},
    "Styles/Markup": {".css", ".scss", ".html", ".htm"},
    "Config": {".json", ".yaml", ".yml", ".toml", ".ini", ".env", ".gitignore", ".lock"},
    "Docs": {".md", ".txt", ".rst", ".pdf"},
    "Media": {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".mp3", ".wav", ".mp4"},
}
SKIP_DIRS = {".git", "node_modules", "dist", "build", "__pycache__", ".venv", ".next",
             ".vercel", ".turbo", "out", "coverage", ".supabase", "venv"}
FIELDNAMES = ["path", "dir", "name", "ext", "category", "size", "size_bucket", "lines",
              "modified", "created", "last_author", "last_message", "commits", "source"]


def category(name):
    ext = os.path.splitext(name)[1].lower() or (name.lower() if name.startswith(".") else "")
    for cat, exts in CATEGORIES.items():
        if ext in exts:
            return cat, ext or "(none)"
    return "Other", ext or "(none)"


def size_bucket(n):
    if n < 1024: return "Tiny (<1 KB)"
    if n < 10 * 1024: return "Small (1-10 KB)"
    if n < 100 * 1024: return "Medium (10-100 KB)"
    if n < 1024 * 1024: return "Large (100 KB-1 MB)"
    return "Huge (>1 MB)"


def git(repo, *args):
    try:
        return subprocess.run(["git", "-C", repo, *args], capture_output=True,
                              text=True, encoding="utf-8", errors="replace", check=True).stdout
    except Exception:
        return ""


def git_history(repo):
    """Map path -> list of (iso_date, author, subject), newest first."""
    hist = {}
    out = git(repo, "log", "--name-only", "--format=@@%aI|%an|%s")
    cur = None
    for line in out.splitlines():
        if line.startswith("@@"):
            cur = line[2:].split("|", 2)
        elif line.strip() and cur:
            hist.setdefault(line.strip(), []).append(cur)
    return hist


def scan(repo):
    hist = git_history(repo)
    rows = []
    for root, dirs, files in os.walk(repo):
        dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS)
        for f in sorted(files):
            full = os.path.join(root, f)
            rel = os.path.relpath(full, repo).replace(os.sep, "/")
            st = os.stat(full)
            cat, ext = category(f)
            try:
                with open(full, "rb") as fh:
                    data = fh.read()
                lines = data.count(b"\n") + (1 if data and not data.endswith(b"\n") else 0)
            except Exception:
                lines = None
            h = hist.get(rel, [])
            mtime = datetime.fromtimestamp(st.st_mtime, timezone.utc).isoformat()
            rows.append({
                "path": rel,
                "dir": os.path.dirname(rel) or ".",
                "name": f,
                "ext": ext,
                "category": cat,
                "size": st.st_size,
                "size_bucket": size_bucket(st.st_size),
                "lines": lines,
                "modified": h[0][0] if h else mtime,
                "created": h[-1][0] if h else None,
                "last_author": h[0][1] if h else None,
                "last_message": h[0][2] if h else None,
                "commits": len(h),
                "source": "git" if h else "mtime",
            })
    return rows


if __name__ == "__main__":
    repo = sys.argv[1] if len(sys.argv) > 1 else "."
    out = sys.argv[2] if len(sys.argv) > 2 else "."
    os.makedirs(out, exist_ok=True)
    rows = scan(repo)
    remote = git(repo, "remote", "get-url", "origin").strip()
    meta = {
        "repo": (remote.rstrip("/").split("/")[-1].removesuffix(".git") if remote else os.path.basename(os.path.abspath(repo))),
        "remote": git(repo, "remote", "get-url", "origin").strip(),
        "branch": git(repo, "rev-parse", "--abbrev-ref", "HEAD").strip(),
        "head": git(repo, "rev-parse", "--short", "HEAD").strip(),
        "scanned_at": datetime.now(timezone.utc).isoformat(),
        "total_files": len(rows),
        "total_bytes": sum(r["size"] for r in rows),
    }
    with open(os.path.join(out, "inventory.json"), "w") as fh:
        json.dump({"meta": meta, "files": rows}, fh, indent=2)
    with open(os.path.join(out, "inventory.csv"), "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=FIELDNAMES)
        w.writeheader(); w.writerows(rows)
    print(json.dumps(meta, indent=2))
