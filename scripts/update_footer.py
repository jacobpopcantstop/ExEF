#!/usr/bin/env python3
"""Replace root-level site footers with the current ExEF footer."""

import glob
import re
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NEW_FOOTER = '''\
<footer class="footer">
    <div class="container">
      <div class="footer__grid footer__grid--institutional">
        <div class="footer__brand">
          <p class="footer__eyebrow">Executive Function Coaching + Credentialing</p>
          <a href="index.html" class="nav__logo" style="color:var(--color-white);">
            <div class="nav__logo-icon">ExEF</div>
            <span>Expert EF</span>
          </a>
          <p>Executive function and ADHD coaching, public curriculum, and transparent credentialing artifacts. Led by Jacob Rozansky, ICF-certified coach completing ADDCA ADHD coach training.</p>
          <ul class="footer__dossier">
            <li><span>Training Lens</span><strong>ADDCA ADHD coaching in progress, integrated with ExEF's EF curriculum and scope controls.</strong></li>
            <li><span>Credential Boundary</span><strong>ExEF credentials are internal standards workflows with public review criteria and verification.</strong></li>
          </ul>
        </div>
        <div>
          <h4>Coaching</h4>
          <ul class="footer__links">
            <li><a href="coaching-home.html">Support Paths</a></li>
            <li><a href="coaching-services.html">Services</a></li>
            <li><a href="meet-the-team.html">Team</a></li>
            <li><a href="free-executive-functioning-tests.html">Assessments</a></li>
          </ul>
        </div>
        <div>
          <h4><strong>Pathway</strong></h4>
          <ul class="footer__links">
            <li><a href="curriculum.html">Curriculum</a></li>
            <li><a href="certification.html">Certification Path</a></li>
            <li><a href="accreditation.html">Credential Status</a></li>
            <li><a href="ExEF-Competency-Crosswalk-Map.html">Competency Crosswalk</a></li>
            <li><a href="ExEF-Capstone-Transparency-Rubric.pdf">Capstone Rubric PDF</a></li>
          </ul>
        </div>
        <div>
          <h4>Resources</h4>
          <ul class="footer__links">
            <li><a href="resources.html">Resources</a></li>
            <li><a href="printables.html">Printables</a></li>
            <li><a href="open-ef-resources-directory.html">Open EF Directory</a></li>
            <li><a href="blog.html">Blog</a></li>
          </ul>
        </div>
        <div>
          <h4>Connect</h4>
          <ul class="footer__links">
            <li><a href="store.html">Services and Pricing</a></li>
            <li><a href="https://calendly.com/jacobansky/30min?month=2026-04">Book a Consultation</a></li>
            <li><a href="mailto:jacob@exef.org">jacob@exef.org</a></li>
            <li><a href="search.html">Search</a></li>
            <li><a href="verify.html">Verify Certificate</a></li>
          </ul>
        </div>
      </div>
      <div class="footer__bottom">
        <span class="footer__status">Built around Barkley, Brown, Dawson &amp; Guare, Ward, ICF ethics, NBEFC context, and ADDCA ADHD coaching training in progress.</span>
        <span><a href="privacy.html">Privacy</a> &middot; <a href="terms.html">Terms</a></span>
      </div>
    </div>
  </footer>'''

PATTERN = re.compile(
    r'<footer\s+class="footer"[^>]*>.*?</footer>',
    re.DOTALL,
)

html_files = sorted(glob.glob(os.path.join(ROOT, "*.html")))
updated = 0
skipped = 0

for path in html_files:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    if '<footer' not in content:
        skipped += 1
        continue

    new_content, n = PATTERN.subn(NEW_FOOTER, content, count=1)

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
