#!/usr/bin/env python3
"""Minify all page-specific JavaScript files in js/ using rjsmin."""
from __future__ import annotations

from pathlib import Path
import sys

try:
    import rjsmin
    _HAS_RJSMIN = True
except ImportError:
    _HAS_RJSMIN = False

ROOT = Path(__file__).resolve().parents[1]
JS_DIR = ROOT / "js"

# Files to skip — already handled by build_main_bundle.py or are generated
SKIP = {
    "main.bundle.js",
    "main.bundle.min.js",
    "module-pages.bundle.js",
    "module-pages.bundle.min.js",
}


def minify() -> int:
    if not _HAS_RJSMIN:
        print("rjsmin not installed — cannot minify. Run: pip install rjsmin")
        return 1

    sources = sorted(
        p for p in JS_DIR.glob("*.js")
        if p.name not in SKIP and not p.name.endswith(".min.js")
    )

    if not sources:
        print("No JS source files found to minify.")
        return 0

    total_original = 0
    total_minified = 0

    for src in sources:
        original = src.read_text(encoding="utf-8")
        minified = rjsmin.jsmin(original)
        out = src.with_suffix("").with_suffix(".min.js")
        out.write_text(minified, encoding="utf-8")

        orig_size = len(original.encode("utf-8"))
        min_size = len(minified.encode("utf-8"))
        total_original += orig_size
        total_minified += min_size
        savings = round((1 - min_size / orig_size) * 100) if orig_size else 0
        print(f"  {src.name} → {out.name}  ({orig_size:,} → {min_size:,} bytes, {savings}% smaller)")

    overall = round((1 - total_minified / total_original) * 100) if total_original else 0
    print(f"\nMinified {len(sources)} file(s): {total_original:,} → {total_minified:,} bytes total ({overall}% smaller).")
    return 0


if __name__ == "__main__":
    sys.exit(minify())
