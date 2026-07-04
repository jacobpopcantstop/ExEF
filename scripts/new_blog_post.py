#!/usr/bin/env python3
"""Scaffold a new blog post from the site template.

Usage:
  python3 scripts/new_blog_post.py \
      --slug time-blindness-morning-routines \
      --title "Why Mornings Fall Apart (and How to Anchor Them)" \
      --description "A practical look at time blindness in morning routines." \
      --cta-href time-blindness-calibrator.html \
      --cta-label "Take the Free Time Blindness Test"

Creates blog-<slug>.html with Article JSON-LD, per-post UTM-tagged booking
links, and a contextual tool CTA, then adds a card to blog.html. The sitemap
picks the page up automatically on the next release-gate run. Write the post
body between the POST BODY START/END markers in the generated file.
"""
from __future__ import annotations

import argparse
import datetime
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "docs" / "templates" / "blog-post-template.html"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--slug", required=True, help="kebab-case slug; page becomes blog-<slug>.html")
    parser.add_argument("--title", required=True)
    parser.add_argument("--description", required=True, help="meta description / card excerpt")
    parser.add_argument("--cta-href", default="free-executive-functioning-tests.html",
                        help="tool page the post funnels to")
    parser.add_argument("--cta-label", default="Explore the Free EF Assessments")
    parser.add_argument("--date", default=None, help="ISO date (default: today)")
    args = parser.parse_args()

    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", args.slug):
        raise SystemExit("Slug must be kebab-case: lowercase letters, digits, hyphens.")

    out = ROOT / f"blog-{args.slug}.html"
    if out.exists():
        raise SystemExit(f"{out.name} already exists.")

    date = datetime.date.fromisoformat(args.date) if args.date else datetime.date.today()
    date_human = date.strftime("%B %-d, %Y") if sys.platform != "win32" else date.strftime("%B %d, %Y")

    html = TEMPLATE.read_text(encoding="utf-8")
    for placeholder, value in {
        "__TITLE__": args.title,
        "__SLUG__": args.slug,
        "__DESCRIPTION__": args.description,
        "__DATE_ISO__": date.isoformat(),
        "__DATE_HUMAN__": date_human,
        "__CTA_HREF__": args.cta_href,
        "__CTA_LABEL__": args.cta_label,
    }.items():
        html = html.replace(placeholder, value)
    out.write_text(html, encoding="utf-8")

    # Add a card to the top of the blog listing.
    blog = ROOT / "blog.html"
    listing = blog.read_text(encoding="utf-8")
    card = (
        '<article class="card blog-card">\n'
        f'          <p class="blog-card__date">{date_human}</p>\n'
        f'          <h2 class="blog-card__title">{args.title}</h2>\n'
        f'          <p class="blog-card__excerpt">{args.description}</p>\n'
        f'          <a class="blog-card__read-more" href="{out.name}">Read post &rarr;</a>\n'
        '        </article>\n        '
    )
    marker = '<article class="card blog-card">'
    if marker in listing:
        listing = listing.replace(marker, card + marker, 1)
        blog.write_text(listing, encoding="utf-8")
        listed = True
    else:
        listed = False

    print(f"Created {out.name}")
    print("Added card to blog.html" if listed else "WARNING: could not find blog card list in blog.html — add the card manually.")
    print("Next: write the post body between the POST BODY START/END markers, then run scripts/release_gate.py.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
