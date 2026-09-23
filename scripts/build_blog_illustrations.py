#!/usr/bin/env python3
"""Generate the hand-drawn-style SVG illustrations used in blog posts.

Writes images/blog/*.svg. Every drawing is original: stick figures, wobbly
lines and handwritten labels built from a few helpers so the set stays
visually consistent. Re-run after editing a drawing:

  python3 scripts/build_blog_illustrations.py

Then check label layout (overlaps, clipped text, lines through labels):

  npm run check:illustrations
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
        text(360, 385, "If it isn't NOW, it barely registers, until suddenly it is.", 16),
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
        text(360, 380, "Executive dysfunction usually means the office is understaffed.", 15),
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
        text(360, 370, "Closing this gap is mostly a matter of better systems.", 16),
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


def coach_therapist_tutor():
    def col(x, title, q, sub, seed, face):
        return "\n".join([
            stick(x, 330, "stand", seed, face),
            bubble(x - 105, 92, 210, 70, q, 15, (x - 10, 205)),
            text(x, 362, title, 19, INK, weight="bold"),
            text(x, 386, sub, 14, ACCENT),
        ])
    body = [
        text(360, 42, "Three helpers, three different questions", 24, INK, weight="bold"),
        col(125, "Therapist", ["“Why does this", "feel so hard?”"], "feelings, history, health", 161, "plain"),
        col(360, "Coach", ["“What will you", "do on Tuesday?”"], "systems, habits, follow-through", 171, "happy"),
        col(595, "Tutor", ["“How do you", "solve #4?”"], "subject content", 181, "plain"),
    ]
    return svg(720, 400, "Therapist, coach, tutor",
               "Three stick figures. The therapist asks why this feels so hard, the coach asks what you will do on Tuesday, and the tutor asks how to solve problem 4.",
               "\n".join(body))


def coaching_loop():
    cx, cy, r = 330, 215, 90
    pts = [(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)]
    labels = [("1. Pick one", "friction point"), ("2. Build one", "small system"), ("3. Run it in your", "real week"), ("4. Review and", "adjust")]
    offs = [(145, 4), (125, 4), (160, 14), (-125, 4)]
    body = [text(360, 40, "How coaching works, one lap at a time", 22, INK, weight="bold"),
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{SOFT}" stroke-width="4" stroke-dasharray="10 8"/>']
    for (px, py), (a, b2), (ox, oy) in zip(pts, labels, offs):
        body.append(f'<circle cx="{px}" cy="{py}" r="12" fill="{BLUE}"/>')
        body.append(text(px + ox, py + oy - 8, a, 16, INK, weight="bold"))
        body.append(text(px + ox, py + oy + 12, b2, 15, ACCENT))
    body.append(stick(cx, cy + 45, "cheer", 191, "happy"))
    body.append(text(360, 388, "Each lap makes the system fit your actual life a little better.", 15))
    return svg(720, 400, "The coaching loop",
               "A circular loop with four steps: pick one friction point, build one small system, run it in your real week, review and adjust, then repeat.",
               "\n".join(body))


def burnout_battery():
    body = [
        text(360, 40, "Where the energy goes", 24, INK, weight="bold"),
        f'<rect x="250" y="90" width="220" height="250" rx="18" fill="#fff" stroke="{INK}" stroke-width="4"/>',
        f'<rect x="320" y="72" width="80" height="20" rx="5" fill="{INK}"/>',
        f'<rect x="262" y="300" width="196" height="28" rx="6" fill="{ACCENT}"/>',
        text(360, 320, "4%", 16, "#fff", weight="bold"),
        text(120, 120, "masking", 16, ACCENT, italic=True),
        text(110, 175, "catch-up sprints", 16, ACCENT, italic=True),
        text(120, 230, "missed reminders", 16, ACCENT, italic=True),
        text(120, 285, "shame spirals", 16, ACCENT, italic=True),
        line([(180, 125), (248, 150)], 201, 2.5, ACCENT),
        line([(190, 180), (248, 190)], 202, 2.5, ACCENT),
        line([(190, 235), (248, 235)], 203, 2.5, ACCENT),
        line([(180, 290), (248, 280)], 204, 2.5, ACCENT),
        stick(590, 340, "shrug", 211, "worried"),
        bubble(510, 90, 170, 70, ["“But I rested", "all weekend?”"], 15, (566, 196)),
        text(360, 385, "Rest refills the battery slower than the drains empty it.", 15),
    ]
    return svg(720, 400, "Where the energy goes",
               "A nearly empty battery at 4 percent, with drains labeled masking, catch-up sprints, missed reminders and shame spirals. A tired stick figure wonders why a weekend of rest did not fix it.",
               "\n".join(body))


def boom_bust():
    body = [
        text(360, 40, "The push-crash cycle (schematic)", 24, INK, weight="bold"),
        line([(90, 320), (650, 320)], 221, 3),
        line([(90, 320), (90, 70)], 222, 3),
        text(76, 200, "output", 15, INK, "end"),
        text(640, 345, "weeks →", 14, INK, "end"),
        line([(100, 220), (160, 110), (200, 280), (260, 300), (300, 120), (340, 270), (400, 305), (440, 150), (480, 290), (560, 312), (640, 300)], 223, 4, ACCENT, amp=1.4),
        line([(100, 200), (640, 196)], 224, 4, BLUE, amp=1.2),
        text(160, 96, "hyperfocus sprint", 14, ACCENT),
        text(205, 300, "crash", 14, ACCENT),
        text(600, 186, "steady pace", 15, BLUE),
        text(360, 385, "Each crash tends to land a little lower than the last one.", 14, ACCENT),
    ]
    return svg(720, 400, "The push-crash cycle",
               "A spiky line of hyperfocus sprints followed by crashes that sink lower over time, next to a flat steady line labeled steady pace.",
               "\n".join(body))


def body_double_continuum():
    body = [
        text(360, 36, "Body doubling comes in more than one flavor", 22, INK, weight="bold"),
        line([(110, 330), (660, 330)], 231, 3),
        line([(110, 330), (110, 70)], 232, 3),
        text(385, 360, "same room, same time  →  different place  →  different time", 14),
        text(96, 110, "check-ins,", 13, INK, "end"),
        text(96, 128, "accountability", 13, INK, "end"),
        text(96, 300, "quiet", 13, INK, "end"),
        text(96, 318, "company", 13, INK, "end"),
        f'<circle cx="200" cy="280" r="10" fill="{BLUE}"/>', text(200, 262, "co-working café", 14, BLUE),
        f'<circle cx="220" cy="120" r="10" fill="{BLUE}"/>', text(220, 102, "working next to a friend", 14, BLUE),
        f'<circle cx="400" cy="200" r="10" fill="{BLUE}"/>', text(400, 182, "video call, cameras on", 14, BLUE),
        f'<circle cx="590" cy="290" r="10" fill="{BLUE}"/>', text(590, 272, "“study with me” video", 14, BLUE),
        f'<circle cx="590" cy="115" r="10" fill="{BLUE}"/>', text(590, 97, "text a buddy: start + done", 14, BLUE),
        text(385, 388, "Model adapted from Eagle, Baltaxe-Admony & Ringland (2023).", 13, ACCENT),
    ]
    return svg(720, 400, "Types of body doubling",
               "A two-axis chart. Left to right runs same room and time to different place and time. Bottom to top runs quiet company to active accountability. Examples: co-working cafe, working next to a friend, video call with cameras on, study-with-me videos, and texting a buddy at start and finish.",
               "\n".join(body))


def simple_vs_complex():
    body = [
        text(360, 40, "What an audience does to your work", 24, INK, weight="bold"),
        f'<line x1="360" y1="70" x2="360" y2="340" stroke="{SOFT}" stroke-width="3" stroke-dasharray="8 8"/>',
        text(185, 90, "Simple, familiar tasks", 19, INK, weight="bold"),
        text(185, 112, "(email, dishes, filing)", 14, ACCENT),
        stick(150, 290, "cheer", 241, "happy"), stick(230, 290, "stand", 242, "plain"),
        text(185, 330, "↑ faster with company", 18, BLUE, weight="bold"),
        text(540, 90, "Brand-new, tricky tasks", 19, INK, weight="bold"),
        text(540, 112, "(learning, hard problem-solving)", 14, ACCENT),
        stick(505, 290, "shrug", 243, "worried"), stick(585, 290, "stand", 244, "plain"),
        text(540, 330, "↓ a bit slower when watched", 18, ACCENT, weight="bold"),
        text(360, 385, "Bond & Titus (1983): 241 studies, small but consistent effects.", 14, ACCENT),
    ]
    return svg(720, 400, "Simple versus complex tasks with company",
               "Left: two stick figures working on simple familiar tasks, labeled faster with company. Right: two figures on brand-new tricky tasks, labeled a bit slower when watched.",
               "\n".join(body))


def brain_training_transfer():
    body = [
        text(360, 40, "Brain games: great at making you good at brain games", 21, INK, weight="bold"),
        line([(90, 320), (650, 320)], 251, 3),
        line([(90, 320), (90, 70)], 252, 3),
        text(640, 345, "weeks of training →", 14, INK, "end"),
        line([(100, 290), (250, 220), (400, 150), (550, 105), (640, 92)], 253, 4, BLUE, amp=1.2),
        text(560, 85, "score on the trained game", 15, BLUE),
        line([(100, 280), (250, 279), (400, 276), (550, 280), (640, 277)], 254, 4, ACCENT, amp=1.4),
        text(560, 262, "real-life planning, reading, math", 15, ACCENT),
        stick(250, 200, "shrug", 261, "worried"),
        text(360, 385, "Schematic of Melby-Lervåg & Hulme (2013): gains stay inside the game.", 14, ACCENT),
    ]
    return svg(720, 400, "Brain training transfer",
               "A rising line for the score on the trained game and a flat line for real-life planning, reading and math, showing gains that do not transfer.",
               "\n".join(body))


def external_scaffolding():
    body = [
        text(360, 40, "Build the scaffolding outside your head", 24, INK, weight="bold"),
        line([(200, 330), (200, 110), (520, 110), (520, 330)], 271, 4, ACCENT),
        line([(200, 190), (520, 190)], 272, 3, ACCENT),
        line([(200, 260), (520, 260)], 273, 3, ACCENT),
        line([(290, 110), (360, 186), (430, 110)], 274, 2, SOFT),
        stick(360, 330, "cheer", 281, "happy"),
        f'<rect x="215" y="126" width="58" height="48" rx="4" fill="#fff" stroke="{INK}" stroke-width="2.5"/>', text(244, 156, "cal", 14),
        f'<circle cx="480" cy="150" r="22" fill="#fff" stroke="{INK}" stroke-width="2.5"/>', text(480, 156, "⏱", 16),
        f'<rect x="215" y="206" width="58" height="42" rx="4" fill="#fff" stroke="{INK}" stroke-width="2.5"/>', text(244, 232, "✓✓", 14),
        f'<rect x="450" y="206" width="58" height="42" rx="4" fill="#fff" stroke="{INK}" stroke-width="2.5"/>', text(479, 232, "☺☺", 14),
        text(110, 150, "calendar", 14, ACCENT), text(610, 150, "timer", 14, ACCENT),
        text(110, 230, "checklist", 14, ACCENT), text(610, 230, "people", 14, ACCENT),
        text(360, 385, "You don’t have to hold it all up by yourself.", 15),
    ]
    return svg(720, 400, "External scaffolding",
               "A stick figure standing inside a scaffold hung with a calendar, a timer, a checklist and a pair of friendly faces, captioned you do not have to hold it all up by yourself.",
               "\n".join(body))


def overbooked_day():
    body = [
        text(360, 40, "The day you planned vs. the day you have", 22, INK, weight="bold"),
        f'<rect x="80" y="110" width="400" height="70" rx="8" fill="#fff" stroke="{INK}" stroke-width="3"/>',
        text(280, 100, "hours you actually have (about 8 free)", 14, INK),
        f'<rect x="80" y="220" width="560" height="70" rx="8" fill="{WASH}" stroke="{ACCENT}" stroke-width="3"/>',
        line([(480, 208), (480, 296)], 301, 3, ACCENT, dash="7 6"),
        text(360, 316, "what you planned (about 11 hours of tasks)", 14, ACCENT),
        text(560, 262, "overflow", 16, ACCENT, italic=True),
        text(170, 262, "email", 14), text(260, 262, "report", 14), text(350, 262, "errands", 14), text(430, 262, "calls", 14),
        stick(640, 205, "shrug", 311, "worried"),
        text(360, 360, "Most \u201cbad days\u201d start as a plan that never fit in the first place.", 15),
    ]
    return svg(720, 400, "An overbooked day",
               "A box for the hours you actually have next to a longer bar of planned tasks that runs past it, labeled overflow, with a worried stick figure.",
               "\n".join(body))


def three_lists():
    def card(x, title, items, color, seed):
        parts = [f'<rect x="{x - 95}" y="90" width="190" height="220" rx="12" fill="#fff" stroke="{color}" stroke-width="3"/>',
                 text(x, 122, title, 18, color, weight="bold")]
        for i, it in enumerate(items):
            parts.append(text(x, 162 + i * 34, it, 15))
        return "\n".join(parts)
    body = [
        text(360, 42, "Three lists instead of one endless one", 22, INK, weight="bold"),
        card(135, "Today (max 3)", ["1. pay rent", "2. draft intro", "3. call dentist"], BLUE, 321),
        card(360, "This week", ["grocery run", "reply to Sam", "fix bike", "plan Friday"], INK, 322),
        card(585, "Parking lot", ["learn Spanish", "reorganize garage", "that app idea"], ACCENT, 323),
        text(360, 360, "Today stays short on purpose. Ideas go to the parking lot so they stop nagging you.", 14),
    ]
    return svg(720, 400, "Three lists",
               "Three cards: Today with at most three items, This week with a handful, and a Parking lot for ideas that are not scheduled yet.",
               "\n".join(body))


def nag_cycle():
    pts = [(360, 95), (560, 215), (360, 320), (160, 215)]
    labels = ["A task gets forgotten", "Partner reminds", "Reminder feels like nagging", "Tension, then more forgetting"]
    body = [text(360, 40, "The reminder loop many couples fall into", 22, INK, weight="bold"),
            f'<ellipse cx="360" cy="210" rx="200" ry="112" fill="none" stroke="{SOFT}" stroke-width="3" stroke-dasharray="9 8"/>']
    for (x, y), lab in zip(pts, labels):
        w = len(lab) * 8.2 + 26
        body.append(f'<rect x="{x - w / 2:.0f}" y="{y - 18}" width="{w:.0f}" height="36" rx="18" fill="#fff" stroke="{INK}" stroke-width="2.5"/>')
        body.append(text(x, y + 6, lab, 15))
    body.append(stick(325, 262, "stand", 331, "worried"))
    body.append(stick(400, 262, "shrug", 332, "worried"))
    body.append(text(360, 380, "Nobody in this picture is the villain. The loop is the problem to solve.", 15))
    return svg(720, 400, "The reminder loop",
               "A loop of four steps: a task gets forgotten, the partner reminds, the reminder feels like nagging, tension leads to more forgetting. Two worried stick figures stand in the middle.",
               "\n".join(body))


def shared_system():
    body = [
        text(360, 40, "Move the reminders into a shared system", 22, INK, weight="bold"),
        f'<rect x="250" y="80" width="220" height="170" rx="10" fill="#fff" stroke="{INK}" stroke-width="3"/>',
        text(360, 108, "Shared board", 17, BLUE, weight="bold"),
        text(360, 140, "Tue: trash out \u2713", 14), text(360, 166, "Wed: vet at 4pm", 14),
        text(360, 192, "Fri: pay electric", 14), text(360, 218, "Sun: 15-min check-in", 14),
        stick(140, 330, "point", 341, "happy"),
        stick(580, 330, "stand", 342, "happy"),
        line([(178, 250), (248, 200)], 343, 2.5, SOFT, dash="6 6"),
        line([(542, 250), (472, 200)], 344, 2.5, SOFT, dash="6 6"),
        text(360, 380, "The board does the remembering, so neither of you has to play manager.", 15),
    ]
    return svg(720, 400, "A shared system",
               "Two relaxed stick figures on either side of a shared board listing the week: trash on Tuesday, vet on Wednesday, the electric bill on Friday, and a 15-minute check-in on Sunday.",
               "\n".join(body))


def help_decision_tree():
    def node(x, y, w, lines_, fill="#fff", color=INK):
        h = 22 * len(lines_) + 16
        parts = [f'<rect x="{x - w / 2}" y="{y - h / 2}" width="{w}" height="{h}" rx="10" fill="{fill}" stroke="{color}" stroke-width="2.5"/>']
        for i, l in enumerate(lines_):
            parts.append(text(x, y - h / 2 + 26 + i * 22, l, 14, "#fff" if fill == BLUE else INK))
        return "\n".join(parts)
    body = [
        text(360, 34, "Which kind of help first?", 22, INK, weight="bold"),
        node(360, 82, 330, ["In crisis, unsafe, or mood is really low?"]),
        line([(360, 102), (360, 128)], 351, 2.5),
        text(376, 120, "no", 13, ACCENT, "start"),
        line([(530, 82), (600, 82)], 352, 2.5), text(565, 74, "yes", 13, ACCENT),
        node(640, 82, 120, ["Doctor or", "therapist now"], BLUE),
        node(360, 158, 330, ["Need a diagnosis or medication?"]),
        line([(530, 158), (600, 158)], 353, 2.5), text(565, 150, "yes", 13, ACCENT),
        node(640, 158, 120, ["Doctor or", "psychiatrist"], BLUE),
        line([(360, 178), (360, 204)], 354, 2.5), text(376, 196, "no", 13, ACCENT, "start"),
        node(360, 238, 330, ["Mostly feelings, history,", "or anxiety driving it?"]),
        line([(530, 238), (600, 238)], 355, 2.5), text(565, 230, "yes", 13, ACCENT),
        node(640, 238, 120, ["Therapist"], BLUE),
        line([(360, 268), (360, 294)], 356, 2.5), text(376, 286, "no", 13, ACCENT, "start"),
        node(360, 324, 330, ["Know what to do, but it", "doesn\u2019t happen?"]),
        line([(530, 324), (600, 324)], 357, 2.5), text(565, 316, "yes", 13, ACCENT),
        node(640, 324, 120, ["Coach"], BLUE),
        text(110, 380, "Plenty of people end up with more than one.", 13, ACCENT, "start"),
    ]
    return svg(720, 400, "Which kind of help first",
               "A decision chart. If you are in crisis or your mood is very low, see a doctor or therapist now. If you need a diagnosis or medication, see a doctor or psychiatrist. If feelings, history or anxiety are driving things, see a therapist. If you know what to do but it does not happen, see a coach.",
               "\n".join(body))


def help_venn():
    body = [
        text(360, 40, "Where coaching and therapy overlap", 22, INK, weight="bold"),
        f'<circle cx="275" cy="220" r="140" fill="{BLUE}" fill-opacity="0.10" stroke="{BLUE}" stroke-width="3"/>',
        f'<circle cx="445" cy="220" r="140" fill="{ACCENT}" fill-opacity="0.10" stroke="{ACCENT}" stroke-width="3"/>',
        text(190, 76, "Therapy", 18, BLUE, weight="bold"),
        text(530, 76, "Coaching", 18, ACCENT, weight="bold"),
        text(205, 180, "anxiety,", 14), text(205, 202, "depression", 14), text(205, 236, "trauma and", 14), text(205, 258, "history", 14),
        text(360, 190, "planning", 14), text(360, 214, "skills", 14), text(360, 238, "CBT-style", 14), text(360, 262, "strategies", 14),
        text(515, 180, "weekly", 14), text(515, 202, "follow-through", 14), text(515, 236, "systems for", 14), text(515, 258, "real life", 14),
        text(360, 385, "CBT for adult ADHD teaches many of the same planning skills a coach works on.", 14, ACCENT),
    ]
    return svg(720, 400, "Coaching and therapy overlap",
               "Two overlapping circles. Therapy covers anxiety, depression, trauma and history. Coaching covers weekly follow-through and systems for real life. The overlap holds planning skills and CBT-style strategies.",
               "\n".join(body))


def structure_drop():
    body = [
        text(360, 40, "What changes on move-in day", 22, INK, weight="bold"),
        text(190, 82, "High school", 18, BLUE, weight="bold"),
        text(530, 82, "College", 18, ACCENT, weight="bold"),
        f'<line x1="360" y1="66" x2="360" y2="340" stroke="{SOFT}" stroke-width="3" stroke-dasharray="8 8"/>',
        text(190, 120, "bells tell you where to be", 14), text(190, 146, "teachers chase missing work", 14),
        text(190, 172, "parents see the grades", 14), text(190, 198, "school runs IEP / 504 meetings", 14),
        text(530, 120, "a syllabus, once, in week one", 14), text(530, 146, "nobody chases you", 14),
        text(530, 172, "privacy rules limit what parents see", 14), text(530, 198, "you request accommodations yourself", 14),
        stick(190, 330, "cheer", 361, "happy"),
        stick(530, 330, "shrug", 362, "worried"),
        text(360, 385, "The scaffolding goes away all at once, so plan to rebuild it.", 15),
    ]
    return svg(720, 400, "High school versus college structure",
               "Two columns. High school: bells tell you where to be, teachers chase missing work, parents see grades, the school runs IEP and 504 meetings. College: one syllabus in week one, nobody chases you, privacy rules limit what parents see, and you request accommodations yourself.",
               "\n".join(body))


def accommodation_steps():
    steps = [("1", "Get documentation", "that meets the college\u2019s rules"),
             ("2", "Register with the", "disability services office"),
             ("3", "Request accommodations", "(many schools: every term)"),
             ("4", "Share the letter", "with each professor"),
             ("5", "Actually use them", "(the hardest step)")]
    body = [text(360, 40, "Getting college accommodations, step by step", 22, INK, weight="bold")]
    for i, (n, a, b2) in enumerate(steps):
        y = 90 + i * 58
        body.append(f'<circle cx="120" cy="{y + 8}" r="18" fill="{BLUE}"/>')
        body.append(text(120, y + 14, n, 16, "#fff", weight="bold"))
        body.append(text(155, y + 6, a, 16, INK, "start", weight="bold"))
        body.append(text(155, y + 26, b2, 14, ACCENT, "start"))
    body.append(stick(590, 340, "cheer", 371, "happy"))
    body.append(text(590, 372, "The student starts this, not the parent.", 13, ACCENT))
    return svg(720, 400, "Getting college accommodations",
               "Five numbered steps: get documentation that meets the college's rules, register with the disability services office, request accommodations (many schools require this every term), share the letter with each professor, and actually use them.",
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
    "adhd-coaching-coach-therapist-tutor.svg": coach_therapist_tutor,
    "adhd-coaching-loop.svg": coaching_loop,
    "adhd-burnout-battery.svg": burnout_battery,
    "adhd-burnout-push-crash.svg": boom_bust,
    "body-doubling-continuum.svg": body_double_continuum,
    "body-doubling-simple-vs-complex.svg": simple_vs_complex,
    "improve-ef-brain-training.svg": brain_training_transfer,
    "improve-ef-scaffolding.svg": external_scaffolding,
    "time-management-overbooked-day.svg": overbooked_day,
    "time-management-three-lists.svg": three_lists,
    "relationships-reminder-loop.svg": nag_cycle,
    "relationships-shared-system.svg": shared_system,
    "coach-vs-therapist-decision.svg": help_decision_tree,
    "coach-vs-therapist-overlap.svg": help_venn,
    "college-structure-drop.svg": structure_drop,
    "college-accommodation-steps.svg": accommodation_steps,
}


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in DRAWINGS.items():
        (OUT / name).write_text(fn(), encoding="utf-8")
        print(f"wrote images/blog/{name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
