#!/usr/bin/env python3
"""Generate the hand-drawn-style SVG illustrations used in blog posts.

Writes images/blog/*.svg. Every drawing is original: stick figures, wobbly
lines and handwritten labels built from a few helpers so the set stays
visually consistent. Re-run after editing a drawing:

  python3 scripts/build_blog_illustrations.py
"""
from __future__ import annotations

import math
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "images" / "blog"

INK = "#243543"
ACCENT = "#7c5a2b"
PAPER = "#f5f1e8"
WASH = "#ebe4d7"
SOFT = "#c9bca5"
BLUE = "#274960"
HAND = "'Comic Sans MS','Chalkboard SE','Comic Neue','Segoe Print',sans-serif"


def wobble(points, seed=1, amp=1.2):
    """Polyline through points with a little hand-drawn jitter."""
    rnd = random.Random(seed)
    out = []
    for i in range(len(points) - 1):
        (x1, y1), (x2, y2) = points[i], points[i + 1]
        steps = max(2, int(math.hypot(x2 - x1, y2 - y1) // 18))
        for s in range(steps):
            t = s / steps
            jx = rnd.uniform(-amp, amp) if 0 < s else 0
            jy = rnd.uniform(-amp, amp) if 0 < s else 0
            out.append((x1 + (x2 - x1) * t + jx, y1 + (y2 - y1) * t + jy))
    out.append(points[-1])
    d = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in out)
    return d


def line(points, seed=1, width=3, color=INK, dash=None, amp=1.2):
    extra = f' stroke-dasharray="{dash}"' if dash else ""
    return (f'<path d="{wobble(points, seed, amp)}" fill="none" stroke="{color}" '
            f'stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"{extra}/>')


def text(x, y, s, size=18, color=INK, anchor="middle", weight="normal", italic=False):
    style = ' font-style="italic"' if italic else ""
    s = s.replace("&", "&amp;")
    return (f'<text x="{x}" y="{y}" font-family="{HAND}" font-size="{size}" fill="{color}" '
            f'text-anchor="{anchor}" font-weight="{weight}"{style}>{s}</text>')


def head(x, y, r=14, fill=PAPER):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{INK}" stroke-width="3"/>'


def stick(x, y, pose="stand", seed=3, face="plain"):
    """Stick figure whose feet sit at (x, y). Returns SVG fragment."""
    hy = y - 92
    parts = [head(x, hy)]
    neck, hip = (x, hy + 14), (x, y - 38)
    parts.append(line([neck, hip], seed))
    if pose == "stand":
        parts.append(line([(x - 26, hy + 48), (x, hy + 30), (x + 26, hy + 48)], seed + 1))
    elif pose == "cheer":
        parts.append(line([(x - 28, hy - 6), (x, hy + 30), (x + 28, hy - 6)], seed + 1))
    elif pose == "push":
        parts.append(line([(x + 34, hy + 26), (x, hy + 32)], seed + 1))
        parts.append(line([(x + 34, hy + 40), (x, hy + 32)], seed + 2))
    elif pose == "shrug":
        parts.append(line([(x - 30, hy + 22), (x - 16, hy + 38), (x, hy + 30), (x + 16, hy + 38), (x + 30, hy + 22)], seed + 1))
    elif pose == "point":
        parts.append(line([(x - 24, hy + 50), (x, hy + 30), (x + 38, hy + 18)], seed + 1))
    if pose == "push":
        parts.append(line([(x - 26, y), hip, (x + 6, y)], seed + 3))
    else:
        parts.append(line([(x - 18, y), hip, (x + 18, y)], seed + 3))
    # face
    if face == "plain":
        parts.append(f'<circle cx="{x-5}" cy="{hy-3}" r="1.8" fill="{INK}"/><circle cx="{x+5}" cy="{hy-3}" r="1.8" fill="{INK}"/>')
        parts.append(line([(x - 5, hy + 6), (x + 5, hy + 6)], seed + 4, 2))
    elif face == "happy":
        parts.append(f'<circle cx="{x-5}" cy="{hy-3}" r="1.8" fill="{INK}"/><circle cx="{x+5}" cy="{hy-3}" r="1.8" fill="{INK}"/>')
        parts.append(f'<path d="M{x-6} {hy+4} Q{x} {hy+10} {x+6} {hy+4}" fill="none" stroke="{INK}" stroke-width="2" stroke-linecap="round"/>')
    elif face == "worried":
        parts.append(f'<circle cx="{x-5}" cy="{hy-2}" r="1.8" fill="{INK}"/><circle cx="{x+5}" cy="{hy-2}" r="1.8" fill="{INK}"/>')
        parts.append(f'<path d="M{x-6} {hy+8} Q{x} {hy+3} {x+6} {hy+8}" fill="none" stroke="{INK}" stroke-width="2" stroke-linecap="round"/>')
        parts.append(line([(x - 9, hy - 10), (x - 2, hy - 8)], seed + 5, 2))
        parts.append(line([(x + 2, hy - 8), (x + 9, hy - 10)], seed + 6, 2))
    elif face == "blank":
        parts.append(f'<circle cx="{x-5}" cy="{hy-3}" r="2.4" fill="none" stroke="{INK}" stroke-width="1.6"/><circle cx="{x+5}" cy="{hy-3}" r="2.4" fill="none" stroke="{INK}" stroke-width="1.6"/>')
        parts.append(f'<circle cx="{x}" cy="{hy+7}" r="2.2" fill="none" stroke="{INK}" stroke-width="1.6"/>')
    return "\n".join(parts)


def bubble(x, y, w, h, label_lines, size=16, tail=None, seed=9):
    parts = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="18" fill="#fff" stroke="{INK}" stroke-width="2.5"/>']
    if tail:
        tx, ty = tail
        parts.append(f'<circle cx="{tx}" cy="{ty}" r="5" fill="#fff" stroke="{INK}" stroke-width="2"/>')
        parts.append(f'<circle cx="{(tx + x + w / 2) / 2:.0f}" cy="{(ty + y + h) / 2:.0f}" r="7" fill="#fff" stroke="{INK}" stroke-width="2"/>')
    lh = size * 1.25
    start = y + h / 2 - (len(label_lines) - 1) * lh / 2 + size * 0.35
    for i, s in enumerate(label_lines):
        parts.append(text(x + w / 2, start + i * lh, s, size))
    return "\n".join(parts)


def svg(w, h, title, desc, body):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-labelledby="t d">\n'
        f'<title id="t">{title}</title>\n<desc id="d">{desc}</desc>\n'
        f'<rect width="{w}" height="{h}" rx="16" fill="{PAPER}"/>\n{body}\n</svg>\n'
    )


# ---------------------------------------------------------------- drawings

def activation_hill():
    body = [
        text(360, 42, "Starting a task vs. continuing it", 24, INK, weight="bold"),
        line([(40, 330), (170, 330), (330, 110), (390, 150), (500, 250), (680, 300)], 11, 4, BLUE, amp=1.6),
        f'<circle cx="262" cy="178" r="26" fill="{WASH}" stroke="{INK}" stroke-width="3"/>',
        text(262, 184, "task", 14),
        stick(214, 272, "push", 21, "worried"),
        text(120, 150, "the hard part", 18, ACCENT, italic=True),
        text(560, 222, "wheee (the easy part)", 18, ACCENT, italic=True),
        text(360, 372, "Most of the effort is spent before anything visibly happens.", 16, INK),
    ]
    return svg(720, 400, "The activation hill",
               "A stick figure strains to push a ball labeled task up a steep hill; past the peak it rolls downhill easily.",
               "\n".join(body))


def outside_inside():
    body = [
        f'<line x1="360" y1="30" x2="360" y2="370" stroke="{SOFT}" stroke-width="3" stroke-dasharray="8 8"/>',
        text(180, 50, "What it looks like", 22, INK, weight="bold"),
        text(540, 50, "What it feels like", 22, INK, weight="bold"),
        f'<rect x="80" y="250" width="200" height="16" fill="{WASH}" stroke="{INK}" stroke-width="2.5"/>',
        stick(180, 250, "stand", 31, "plain"),
        text(180, 300, "“Not even trying.”", 18, INK, italic=True),
        text(180, 326, "(Looks like: lazy.)", 16, ACCENT),
        stick(590, 340, "stand", 41, "worried"),
        bubble(390, 76, 240, 140, ["Do the email!", "No wait, first the", "attachment. Where is it?", "Also I'm hungry.", "WHY CAN'T I START"], 15, (560, 236)),
        text(540, 372, "(Feels like: a traffic jam.)", 16, ACCENT),
    ]
    return svg(720, 400, "Outside versus inside",
               "Left: a calm stick figure sitting still, captioned looks lazy. Right: the same figure with a thought bubble full of competing thoughts, captioned feels like a traffic jam.",
               "\n".join(body))


def now_vs_not_now():
    body = [
        text(360, 44, "How time looks from inside some brains", 24, INK, weight="bold"),
        f'<rect x="60" y="80" width="170" height="150" rx="14" fill="{BLUE}"/>',
        text(145, 168, "NOW", 42, "#fff", weight="bold"),
        f'<rect x="250" y="115" width="410" height="80" rx="14" fill="{WASH}" stroke="{SOFT}" stroke-width="2" stroke-dasharray="6 6"/>',
        text(455, 151, "not now", 24, "#8a7d68", italic=True),
        text(455, 179, "(tomorrow, Friday, the deadline, 2031… all the same fog)", 14, "#8a7d68"),
        stick(145, 352, "cheer", 51, "happy"),
        text(360, 385, "If it isn't NOW, it barely registers — until it becomes NOW.", 16),
    ]
    return svg(720, 400, "Now versus not now",
               "A big solid block labeled NOW next to a long faded fog labeled not now, containing tomorrow, Friday, the deadline and the distant future.",
               "\n".join(body))


def planning_fallacy_chart():
    # Buehler, Griffin & Ross (1994): predicted 33.9 days, actual 55.5 days.
    base, scale = 320, 3.6
    pred_h, act_h = 33.9 * scale, 55.5 * scale
    body = [
        text(360, 40, "How long will your thesis take?", 24, INK, weight="bold"),
        line([(90, base), (630, base)], 61, 3),
        f'<rect x="170" y="{base - pred_h:.0f}" width="120" height="{pred_h:.0f}" fill="{WASH}" stroke="{INK}" stroke-width="3"/>',
        f'<rect x="430" y="{base - act_h:.0f}" width="120" height="{act_h:.0f}" fill="{BLUE}" stroke="{INK}" stroke-width="3"/>',
        text(230, base - pred_h - 12, "33.9 days", 20, INK, weight="bold"),
        text(490, base - act_h - 12, "55.5 days", 20, BLUE, weight="bold"),
        text(230, base + 30, "What students predicted", 17),
        text(490, base + 30, "What it actually took", 17),
        text(360, 385, "Data: Buehler, Griffin & Ross (1994). This is ordinary human bias, before ADHD enters the picture.", 14, ACCENT),
    ]
    return svg(720, 400, "Predicted versus actual thesis completion time",
               "Bar chart: students predicted their honors thesis would take 33.9 days; it actually took 55.5 days on average.",
               "\n".join(body))


def front_office():
    def desk(x, y, title, sub, seed, face):
        return "\n".join([
            f'<rect x="{x-70}" y="{y}" width="140" height="14" fill="{WASH}" stroke="{INK}" stroke-width="2.5"/>',
            stick(x, y, "stand", seed, face),
            text(x, y + 42, title, 17, INK, weight="bold"),
            text(x, y + 64, sub, 14, ACCENT),
        ])
    body = [
        text(360, 40, "Your brain's front office", 24, INK, weight="bold"),
        f'<rect x="300" y="62" width="120" height="40" rx="8" fill="{BLUE}"/>',
        text(360, 88, "THE GOAL", 18, "#fff", weight="bold"),
        line([(360, 102), (360, 130)], 71, 2.5),
        line([(130, 130), (590, 130)], 72, 2.5),
        line([(130, 130), (130, 150)], 73, 2.5),
        line([(360, 130), (360, 150)], 74, 2.5),
        line([(590, 130), (590, 150)], 75, 2.5),
        desk(130, 262, "The Brakes", "inhibition", 81, "plain"),
        desk(360, 262, "The Whiteboard", "working memory", 91, "worried"),
        desk(590, 262, "The Plan B Desk", "cognitive flexibility", 101, "happy"),
        text(360, 380, "Executive dysfunction = the office is understaffed, not the boss being lazy.", 15),
    ]
    return svg(720, 400, "The brain's front office",
               "An org chart: the goal at the top, with three stick-figure departments below labeled The Brakes (inhibition), The Whiteboard (working memory) and The Plan B Desk (cognitive flexibility).",
               "\n".join(body))


def knowing_doing_gap():
    body = [
        text(360, 40, "The knowing–doing gap", 24, INK, weight="bold"),
        line([(80, 330), (660, 330)], 111, 3),
        line([(80, 330), (80, 70)], 112, 3),
        text(78, 200, "how", 14, INK, "end"),
        text(78, 218, "much", 14, INK, "end"),
        line([(90, 110), (640, 104)], 113, 4, BLUE, amp=1.5),
        text(650, 100, "what you know you should do", 15, BLUE, "end"),
        line([(90, 290), (200, 270), (300, 285), (420, 262), (520, 280), (640, 268)], 114, 4, ACCENT, amp=1.5),
        text(640, 305, "what actually gets done", 15, ACCENT, "end"),
        f'<path d="M360 116 L360 262" stroke="{INK}" stroke-width="2" stroke-dasharray="5 6"/>',
        bubble(380, 160, 250, 58, ["executive function lives here"], 15),
        text(360, 370, "More information rarely closes the gap. Better systems do.", 16),
    ]
    return svg(720, 400, "The knowing-doing gap",
               "Two lines on a chart: a high steady line for what you know you should do and a lower wobbly line for what gets done; the gap between them is labeled executive function lives here.",
               "\n".join(body))


def stress_curves():
    # Schematic of Tice & Baumeister (1997): procrastinators report less stress
    # early in the term and more late in the term.
    body = [
        text(360, 40, "The procrastination deal, plotted", 24, INK, weight="bold"),
        line([(90, 320), (650, 320)], 121, 3),
        line([(90, 320), (90, 70)], 122, 3),
        text(120, 345, "start of term", 14, INK, "start"),
        text(640, 345, "deadline week", 14, INK, "end"),
        text(74, 200, "stress", 15, INK, "end"),
        line([(100, 150), (240, 175), (380, 185), (520, 190), (640, 200)], 123, 4, BLUE, amp=1.2),
        line([(100, 280), (240, 290), (380, 275), (500, 220), (580, 140), (640, 90)], 124, 4, ACCENT, amp=1.2),
        text(250, 162, "starts early", 15, BLUE),
        text(250, 312, "procrastinates", 15, ACCENT),
        text(560, 104, "uh oh", 16, ACCENT, italic=True),
        text(360, 385, "Schematic of Tice & Baumeister (1997): calmer now, sicker and more stressed later.", 14, ACCENT),
    ]
    return svg(720, 400, "Stress over a semester",
               "Two lines: the procrastinator's stress starts lower than the early starter's but shoots above it near the deadline.",
               "\n".join(body))


def mood_trade():
    body = [
        text(360, 40, "Every procrastination is a trade", 24, INK, weight="bold"),
        stick(170, 320, "point", 131, "happy"),
        text(170, 350, "Present You", 18, INK, weight="bold"),
        stick(560, 320, "shrug", 141, "worried"),
        text(560, 350, "Future You", 18, INK, weight="bold"),
        f'<circle cx="250" cy="200" r="20" fill="{WASH}" stroke="{INK}" stroke-width="2.5"/>',
        text(250, 206, "☺", 20),
        text(250, 170, "feel better now", 14, ACCENT),
        f'<rect x="440" y="150" width="90" height="90" rx="10" fill="{SOFT}" stroke="{INK}" stroke-width="3"/>',
        text(485, 200, "STRESS", 16, INK, weight="bold"),
        text(485, 140, "the whole task + panic", 14, ACCENT),
        line([(290, 210), (420, 210)], 151, 3, INK),
        f'<path d="M410 200 L424 210 L410 220" fill="none" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>',
        text(360, 385, "Procrastination is mostly mood repair: a short-term feeling fix, billed to later.", 15),
    ]
    return svg(720, 400, "The procrastination trade",
               "Present You holds a small token labeled feel better now and passes a large box labeled stress to a worried Future You.",
               "\n".join(body))


DRAWINGS = {
    "adhd-paralysis-activation-hill.svg": activation_hill,
    "adhd-paralysis-outside-inside.svg": outside_inside,
    "time-blindness-now-vs-not-now.svg": now_vs_not_now,
    "time-blindness-planning-fallacy.svg": planning_fallacy_chart,
    "executive-dysfunction-front-office.svg": front_office,
    "executive-dysfunction-knowing-doing-gap.svg": knowing_doing_gap,
    "procrastination-stress-curves.svg": stress_curves,
    "procrastination-mood-trade.svg": mood_trade,
}


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in DRAWINGS.items():
        (OUT / name).write_text(fn(), encoding="utf-8")
        print(f"wrote images/blog/{name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
