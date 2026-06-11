#!/usr/bin/env python3
"""Compress oversized images in images/ in place.

JPEGs above the size threshold are re-encoded as progressive JPEG at
quality 82 and capped at MAX_DIMENSION on the long edge. PNGs are
losslessly re-deflated (optimize=True) and capped the same way.
Filenames and formats are preserved so no HTML references change.
A re-encoded file only replaces the original when it is smaller.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "images"
SIZE_THRESHOLD = 300 * 1024
MAX_DIMENSION = 2048
JPEG_QUALITY = 82


def optimize(path: Path) -> int:
    original_size = path.stat().st_size
    if original_size < SIZE_THRESHOLD:
        return 0

    img = Image.open(path)
    img.load()

    if max(img.size) > MAX_DIMENSION:
        img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

    tmp = path.with_suffix(path.suffix + ".tmp")
    suffix = path.suffix.lower()
    if suffix in (".jpg", ".jpeg"):
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        img.save(tmp, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
    elif suffix == ".png":
        img.save(tmp, "PNG", optimize=True)
    else:
        return 0

    new_size = tmp.stat().st_size
    if new_size < original_size:
        tmp.replace(path)
        return original_size - new_size
    tmp.unlink()
    return 0


def main() -> int:
    total_saved = 0
    for path in sorted(IMAGES.iterdir()):
        if path.suffix.lower() not in (".jpg", ".jpeg", ".png"):
            continue
        saved = optimize(path)
        if saved:
            total_saved += saved
            print(f"{path.name}: saved {saved / 1024:.0f} KB")
    print(f"Total saved: {total_saved / (1024 * 1024):.1f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
