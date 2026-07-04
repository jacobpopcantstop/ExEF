#!/usr/bin/env python3
"""Wrap raster <img> tags in <picture> elements with WebP sources.

For every <img> whose src (and srcset entries) have WebP siblings built by
scripts/build_webp_images.py, emit:

    <picture><source type="image/webp" srcset="..." sizes="..."><img ...></picture>

Original PNG/JPG markup is preserved as the universal fallback. The script
is idempotent: images already wrapped in a <picture> with a WebP source are
left untouched, so it can rerun safely after adding new images.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

IMG_TAG = re.compile(r"<img\b[^>]*>", re.IGNORECASE)
ATTR = re.compile(r'([a-zA-Z-]+)\s*=\s*"([^"]*)"')
RASTER = re.compile(r"\.(?:png|jpe?g)$", re.IGNORECASE)


def webp_path(url: str) -> str | None:
    """Return the WebP URL for a raster URL when the file exists on disk."""
    if not RASTER.search(url):
        return None
    candidate = re.sub(r"\.(?:png|jpe?g)$", ".webp", url, flags=re.IGNORECASE)
    if (ROOT / candidate).exists():
        return candidate
    return None


def build_webp_srcset(attrs: dict[str, str]) -> str | None:
    """Translate the img's srcset (or src) into a WebP srcset, or None."""
    if attrs.get("srcset"):
        entries = []
        for entry in attrs["srcset"].split(","):
            parts = entry.strip().split()
            if not parts:
                continue
            converted = webp_path(parts[0])
            if not converted:
                return None  # keep the fallback consistent: all or nothing
            entries.append(" ".join([converted] + parts[1:]))
        return ", ".join(entries) if entries else None
    src = attrs.get("src", "")
    return webp_path(src)


def inside_webp_picture(text: str, img_start: int) -> bool:
    open_pos = text.rfind("<picture", 0, img_start)
    if open_pos == -1:
        return False
    close_pos = text.rfind("</picture>", 0, img_start)
    if close_pos > open_pos:
        return False
    return "image/webp" in text[open_pos:img_start]


def transform(path: Path) -> int:
    text = path.read_text(encoding="utf-8")
    out: list[str] = []
    cursor = 0
    wrapped = 0
    for match in IMG_TAG.finditer(text):
        tag = match.group(0)
        attrs = dict(ATTR.findall(tag))
        webp_srcset = build_webp_srcset(attrs)
        if not webp_srcset or inside_webp_picture(text, match.start()):
            continue
        source_attrs = f'type="image/webp" srcset="{webp_srcset}"'
        if attrs.get("sizes"):
            source_attrs += f' sizes="{attrs["sizes"]}"'
        out.append(text[cursor:match.start()])
        out.append(f"<picture><source {source_attrs}>{tag}</picture>")
        cursor = match.end()
        wrapped += 1
    if wrapped:
        out.append(text[cursor:])
        path.write_text("".join(out), encoding="utf-8")
    return wrapped


def main() -> int:
    total = 0
    touched = 0
    for pattern in ("*.html", "tools/*.html"):
        for page in sorted(ROOT.glob(pattern)):
            wrapped = transform(page)
            if wrapped:
                touched += 1
                total += wrapped
    print(f"Wrapped {total} <img> tag(s) across {touched} page(s) in <picture> with WebP sources.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
