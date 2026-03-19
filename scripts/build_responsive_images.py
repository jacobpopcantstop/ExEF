#!/usr/bin/env python3
"""Generate smaller PNG variants for responsive image delivery."""
from __future__ import annotations

from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
IMAGES_DIR = ROOT / "images"

TARGETS = {
    "2tiered.png": [640, 960],
    "BarkleyTrajectory.png": [640, 960],
    "airtraffic2.png": [640, 960],
    "analogvdigital.png": [640, 960],
    "certificate-blue.png": [640, 1200],
    "certificate-white-gold.png": [640, 1200],
    "coachingvstherapy.png": [640, 960],
    "coachsupport.png": [640, 960],
    "curriculumpipeline.png": [640, 960],
    "discrepancyasdata.png": [640, 960],
    "getreadydodone.png": [640, 960],
    "goodnessoffit.png": [640, 960],
    "leakybucket.png": [640, 960],
    "limbicGap.png": [640, 960],
    "referralredflags.png": [640, 960],
    "specialpopulations.png": [640, 960],
    "timeblindness.png": [640, 960],
    "timecorrection.png": [640, 960],
    "wallofawful.png": [640, 960],
}


def require_sips() -> str:
    path = shutil.which("sips")
    if not path:
      raise SystemExit("sips not found; cannot build responsive PNG variants on this host")
    return path


def read_width(path: Path) -> int:
    result = subprocess.run(
        ["sips", "-g", "pixelWidth", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    for line in result.stdout.splitlines():
        if "pixelWidth:" in line:
            return int(line.split(":", 1)[1].strip())
    raise SystemExit(f"Could not read width for {path}")


def build_variant(source: Path, width: int) -> Path:
    output = source.with_name(f"{source.stem}-{width}{source.suffix}")
    subprocess.run(
        ["sips", "-Z", str(width), str(source), "--out", str(output)],
        check=True,
        capture_output=True,
        text=True,
    )
    return output


def main() -> int:
    require_sips()
    built = 0
    for filename, widths in TARGETS.items():
        source = IMAGES_DIR / filename
        if not source.exists():
            raise SystemExit(f"Missing source image: {source}")
        source_width = read_width(source)
        for width in widths:
            if width >= source_width:
                continue
            build_variant(source, width)
            built += 1
    print(f"Built {built} responsive image variant(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
