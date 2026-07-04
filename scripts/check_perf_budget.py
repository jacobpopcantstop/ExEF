#!/usr/bin/env python3
"""Performance budget gate.

Fails the release gate when shipped assets exceed agreed budgets, so
regressions (a giant image, an unminified bundle) are caught in CI
rather than in production Lighthouse scores.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

MAX_SINGLE_IMAGE = 1 * 1024 * 1024          # 1 MB per image
# Repo-side total includes WebP siblings kept alongside PNG/JPG fallbacks;
# browsers download one format, so shipped page weight went down, not up.
MAX_IMAGES_TOTAL = 60 * 1024 * 1024         # 60 MB for images/ overall
MAX_CSS_BUNDLE = 300 * 1024                 # css/styles.css
MAX_PAGE_SCRIPT = 120 * 1024                # any non-vendor js/*.min.js or bundle


def main() -> int:
    failures: list[str] = []

    images = [p for p in (ROOT / "images").iterdir() if p.is_file()]
    for img in images:
        size = img.stat().st_size
        if size > MAX_SINGLE_IMAGE:
            failures.append(f"images/{img.name} is {size / 1024:.0f} KB (budget {MAX_SINGLE_IMAGE // 1024} KB) — run scripts/optimize_images.py")
    total = sum(p.stat().st_size for p in images)
    if total > MAX_IMAGES_TOTAL:
        failures.append(f"images/ totals {total / (1024 * 1024):.1f} MB (budget {MAX_IMAGES_TOTAL // (1024 * 1024)} MB)")

    css = ROOT / "css" / "styles.css"
    if css.exists() and css.stat().st_size > MAX_CSS_BUNDLE:
        failures.append(f"css/styles.css is {css.stat().st_size / 1024:.0f} KB (budget {MAX_CSS_BUNDLE // 1024} KB)")

    for script in (ROOT / "js").glob("*.min.js"):
        size = script.stat().st_size
        if size > MAX_PAGE_SCRIPT:
            failures.append(f"js/{script.name} is {size / 1024:.0f} KB (budget {MAX_PAGE_SCRIPT // 1024} KB)")

    if failures:
        print("Performance budget violations:")
        for failure in failures:
            print(f" - {failure}")
        return 1

    print(f"Performance budget OK: {len(images)} images ({total / (1024 * 1024):.1f} MB), CSS and JS within budget.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
