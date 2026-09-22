#!/usr/bin/env python3
"""Scaffold a new blog post from the site template.

Usage:
  python3 scripts/new_blog_post.py \
      --slug time-blindness-morning-routines \
      --title "Why Mornings Fall Apart (and How to Anchor Them)" \
      --description "A practical look at time blindness in morning routines." \
      --cta-href /time-blindness-calibrator \
      --cta-label "Take the Free Time Blindness Test" \
      --image hourglass --image-alt "An hourglass running out"

Creates blog-<slug>.html with Article JSON-LD, per-post UTM-tagged booking
links, and a contextual tool CTA, then adds a card to blog.html. --image takes
the base name of a photo in images/ (e.g. "hourglass" for hourglass.jpg); the
-640/-960 and .webp variants are picked up when they exist. The sitemap
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
IMAGES = ROOT / "images"


def picture(base: str, alt: str, sizes: str, img_class: str, loading: str) -> str:
    """Responsive <picture> for images/<base>.jpg and whichever variants exist."""
    if not (IMAGES / f"{base}.jpg").exists():
        raise SystemExit(f"images/{base}.jpg not found.")

    def srcset(ext: str) -> str:
        parts = [f"images/{base}-{w}.{ext} {w}w" for w in (640, 960) if (IMAGES / f"{base}-{w}.{ext}").exists()]
        if (IMAGES / f"{base}.{ext}").exists():
            parts.append(f"images/{base}.{ext} 2048w")
        return ", ".join(parts)

    webp = srcset("webp")
    source = f'<source type="image/webp" srcset="{webp}" sizes="{sizes}">' if webp else ""
    return (
        f'<picture>{source}<img class="{img_class}" src="images/{base}.jpg" srcset="{srcset("jpg")}" '
        f'sizes="{sizes}" alt="{alt}" loading="{loading}" decoding="async"></picture>'
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--slug", required=True, help="kebab-case slug; page becomes blog-<slug>.html")
    parser.add_argument("--title", required=True)
    parser.add_argument("--description", required=True, help="meta description / card excerpt")
    parser.add_argument("--cta-href", default="/free-executive-functioning-tests",
                        help="tool page the post funnels to")
    parser.add_argument("--cta-label", default="Explore the Free EF Assessments")
    parser.add_argument("--date", default=None, help="ISO date (default: today)")
    parser.add_argument("--image", default=None, help="base name of a photo in images/, e.g. hourglass")
    parser.add_argument("--image-alt", default="", help="alt text for --image")
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
        "__OG_IMAGE__": f"https://exef.org/images/{args.image}.jpg" if args.image else "https://exef.org/images/og-image.svg",
        "__HERO__": (
            '<figure class="post-hero">'
            + picture(args.image, args.image_alt, "(max-width: 768px) 92vw, 720px", "post-hero__img", "eager")
            + "</figure>"
        ) if args.image else "",
    }.items():
        html = html.replace(placeholder, value)
    out.write_text(html, encoding="utf-8")

    # Add a card to the top of the blog listing.
    blog = ROOT / "blog.html"
    listing = blog.read_text(encoding="utf-8")
    media = (
        f'<a class="blog-card__media" href="/blog-{args.slug}" tabindex="-1" aria-hidden="true">'
        + picture(args.image, "", "(max-width: 768px) 92vw, 400px", "blog-card__img", "lazy")
        + "</a>\n          "
    ) if args.image else ""
    card = (
        '<article class="card blog-card">\n'
        f'          {media}'
        f'          <p class="blog-card__date">{date_human}</p>\n'
        f'          <h2 class="blog-card__title">{args.title}</h2>\n'
        f'          <p class="blog-card__excerpt">{args.description}</p>\n'
        f'          <a class="blog-card__read-more" href="/blog-{args.slug}">Read post &rarr;</a>\n'
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
