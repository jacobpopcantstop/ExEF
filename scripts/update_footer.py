#!/usr/bin/env python3
"""Replace the footer__grid block in all root-level HTML files with the new
coaching-first footer structure."""

import glob
import re
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NEW_FOOTER_GRID = '''\
<div class="footer__grid">
        <div class="footer__brand">
          <a href="index.html" class="nav__logo" style="color:var(--color-white);">
            <div class="nav__logo-icon">EFI</div>
            <span>Executive Functioning Institute</span>
          </a>
          <p>Executive function and ADHD coaching grounded in neuroscience. Assessments, tools, and support.</p>
        </div>
        <div>
          <h4>Site</h4>
          <ul class="footer__links">
            <li><a href="coaching-home.html">Coaching</a></li>
            <li><a href="free-executive-functioning-tests.html">Assessments</a></li>
            <li><a href="blog.html">Blog</a></li>
            <li><a href="about.html">About</a></li>
          </ul>
        </div>
        <div>
          <h4>Learn</h4>
          <ul class="footer__links">
            <li><a href="curriculum.html">Curriculum</a></li>
            <li><a href="certification.html">Certification</a></li>
            <li><a href="resources.html">Resources</a></li>
            <li><a href="store.html">Store</a></li>
          </ul>
        </div>
        <div>
          <h4>Connect</h4>
          <ul class="footer__links">
            <li><a href="#" onclick="Calendly.initPopupWidget({url: 'https://calendly.com/jacobansky/30min'});return false;">Book a Consultation</a></li>
            <li><a href="mailto:jacob@exef.org">jacob@exef.org</a></li>
            <li><a href="search.html">Search</a></li>
          </ul>
        </div>
      </div>'''

# Pattern: match from <div class="footer__grid"> through all content up to
# (but not including) <div class="footer__bottom">
PATTERN = re.compile(
    r'<div class="footer__grid">.*?(?=\s*<div class="footer__bottom">)',
    re.DOTALL,
)

html_files = sorted(glob.glob(os.path.join(ROOT, "*.html")))
updated = 0
skipped = 0

for path in html_files:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    if 'class="footer__grid"' not in content:
        skipped += 1
        continue

    new_content, n = PATTERN.subn(NEW_FOOTER_GRID, content, count=1)

    if n == 0:
        print(f"  WARNING: no match in {os.path.basename(path)}")
        skipped += 1
        continue

    if new_content == content:
        print(f"  SKIP (already current): {os.path.basename(path)}")
        skipped += 1
        continue

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)

    updated += 1
    print(f"  UPDATED: {os.path.basename(path)}")

print(f"\nDone. Updated {updated} files, skipped {skipped}.")
