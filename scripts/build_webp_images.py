#!/usr/bin/env python3
"""Generate WebP siblings for raster images referenced by production pages.

Only rasters actually referenced from HTML/JS are converted, so the repo
does not pay for WebP copies of unused assets. Originals are kept as the
<picture> fallback for legacy browsers; a WebP file is only written when
it is meaningfully smaller than its source.

Requires: pip install Pillow
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    raise SystemExit("Pillow is required: pip install Pillow")

ROOT = Path(__file__).resolve().parents[1]
IMAGES_DIR = ROOT / "images"

RASTER_REF = re.compile(r"images/[A-Za-z0-9._-]+\.(?:png|jpe?g)", re.IGNORECASE)
JPEG_QUALITY = 80
PNG_QUALITY = 85
MIN_SAVINGS = 0.05  # keep the WebP only if it is at least 5% smaller


def referenced_rasters() -> set[Path]:
    refs: set[Path] = set()
    for pattern in ("*.html", "tools/*.html", "js/*.js"):
        for page in ROOT.glob(pattern):
            text = page.read_text(encoding="utf-8", errors="ignore")
            for match in RASTER_REF.finditer(text):
                candidate = ROOT / match.group(0)
                if candidate.exists():
                    refs.add(candidate)
    return refs


def convert(source: Path) -> tuple[Path | None, int]:
    output = source.with_suffix(".webp")
    quality = JPEG_QUALITY if source.suffix.lower() in (".jpg", ".jpeg") else PNG_QUALITY
    with Image.open(source) as img:
        if img.mode in ("P", "CMYK"):
            img = img.convert("RGBA" if "transparency" in img.info else "RGB")
        img.save(output, "WEBP", quality=quality, method=6)
    src_size = source.stat().st_size
    out_size = output.stat().st_size
    if out_size > src_size * (1 - MIN_SAVINGS):
        output.unlink()
        return None, 0
    return output, src_size - out_size


def main() -> int:
    sources = sorted(referenced_rasters())
    if not sources:
        raise SystemExit("No referenced raster images found — check the repo layout.")
    built = skipped = 0
    saved = 0
    for source in sources:
        webp = source.with_suffix(".webp")
        if webp.exists() and webp.stat().st_mtime >= source.stat().st_mtime:
            skipped += 1
            continue
        output, delta = convert(source)
        if output is None:
            skipped += 1
        else:
            built += 1
            saved += delta
    print(
        f"WebP build: {built} written, {skipped} skipped, "
        f"{saved / (1024 * 1024):.1f} MB lighter than originals."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
