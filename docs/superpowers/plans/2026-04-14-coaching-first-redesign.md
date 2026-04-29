# Coaching-First Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Streamline exef.org to prioritize coaching client acquisition — new nav, lean homepage, Calendly integration, blog page, team about page, resource simplification, email updates, dark mode fix.

**Architecture:** In-place edits to existing static HTML/CSS/JS site. Nav and footer changes touch ~45 HTML files. New files: `blog.html` and blog post template. Calendly widget loaded globally. CSS additions in existing partials.

**Tech Stack:** Vanilla HTML/CSS/JS, CSS built from `css/src/` partials via `python3 scripts/build_css.py`

---

### Task 1: Update Navigation Across All Pages

**Files:**
- Modify: Every `.html` file in project root containing `nav__link--cta` (~45 files)
- Modify: `css/src/20-navigation.css` (add dropdown styles)
- Modify: `js/main.js` (add dropdown toggle logic)

The nav appears in ~45 HTML files. We'll use `sed` for the bulk replacement since the nav markup is identical across all files.

- [ ] **Step 1: Create a script to update all nav blocks**

Create a Python script that finds and replaces the nav `<div class="nav__links">...</div>` block in all HTML files. The new nav content:

```html
<div class="nav__links" id="nav-links">
  <a href="index.html" class="nav__link">Home</a>
  <a href="free-executive-functioning-tests.html" class="nav__link">Assessments</a>
  <a href="coaching-home.html" class="nav__link">Coaching</a>
  <a href="blog.html" class="nav__link">Blog</a>
  <a href="about.html" class="nav__link">About</a>
  <div class="nav__dropdown">
    <button class="nav__link nav__dropdown-trigger" aria-expanded="false" aria-haspopup="true">Learn <svg aria-hidden="true" viewBox="0 0 12 8" width="12" height="8" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 1 6 6 11 1"/></svg></button>
    <div class="nav__dropdown-menu">
      <a href="curriculum.html" class="nav__dropdown-item">Curriculum</a>
      <a href="certification.html" class="nav__dropdown-item">Certification</a>
    </div>
  </div>
  <span class="nav__auth"></span>
  <a href="#" class="nav__link nav__link--cta" onclick="Calendly.initPopupWidget({url: 'https://calendly.com/jacobansky/30min'});return false;">Book a Consultation</a>
</div>
```

```bash
cd /Users/jacobrozansky/exef
python3 scripts/update_nav.py
```

Write `scripts/update_nav.py`:

```python
#!/usr/bin/env python3
"""Replace nav links block across all HTML files."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

NEW_NAV = '''<div class="nav__links" id="nav-links">
        <a href="index.html" class="nav__link">Home</a>
        <a href="free-executive-functioning-tests.html" class="nav__link">Assessments</a>
        <a href="coaching-home.html" class="nav__link">Coaching</a>
        <a href="blog.html" class="nav__link">Blog</a>
        <a href="about.html" class="nav__link">About</a>
        <div class="nav__dropdown">
          <button class="nav__link nav__dropdown-trigger" aria-expanded="false" aria-haspopup="true">Learn <svg aria-hidden="true" viewBox="0 0 12 8" width="12" height="8" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 1 6 6 11 1"/></svg></button>
          <div class="nav__dropdown-menu">
            <a href="curriculum.html" class="nav__dropdown-item">Curriculum</a>
            <a href="certification.html" class="nav__dropdown-item">Certification</a>
          </div>
        </div>
        <span class="nav__auth"></span>
        <a href="#" class="nav__link nav__link--cta" onclick="Calendly.initPopupWidget({url: 'https://calendly.com/jacobansky/30min'});return false;">Book a Consultation</a>
      </div>'''

pattern = re.compile(
    r'<div class="nav__links" id="nav-links">.*?</div>\s*</div>\s*(?=<button class="nav__toggle")',
    re.DOTALL
)

count = 0
for html_file in sorted(ROOT.glob('*.html')):
    text = html_file.read_text()
    if 'nav__links' not in text:
        continue
    new_text, n = pattern.subn(NEW_NAV + '\n      ', text)
    if n > 0:
        html_file.write_text(new_text)
        count += 1
        print(f"  Updated: {html_file.name}")

print(f"\nUpdated {count} files.")
```

- [ ] **Step 2: Run the nav update script**

```bash
cd /Users/jacobrozansky/exef
python3 scripts/update_nav.py
```

Expected: ~45 files updated. Manually verify `index.html` and `about.html` have the new nav.

- [ ] **Step 3: Set active nav link per page**

After the bulk update, each page needs its own `nav__link--active` class. The script removed all active classes. Add them back by running a second pass. Key mappings:
- `index.html` → Home link
- `free-executive-functioning-tests.html`, `esqr.html`, `ef-profile-story.html`, `conative-action-profile.html`, `environment-quiz.html`, `full-ef-profile.html`, `brown-clusters-tool.html`, `time-blindness-calibrator.html`, `task-start-friction.html` → Assessments link
- `coaching-home.html`, `coaching-contact.html`, `coaching-creative.html`, `coaching-about.html`, `coaching-methodology.html`, `coaching-services.html` → Coaching link
- `blog.html` → Blog link
- `about.html` → About link
- `curriculum.html`, `module-*.html` → Learn dropdown trigger
- `certification.html`, `accreditation.html` → Learn dropdown trigger

Manually add `nav__link--active` to the correct link in each page, or write a small script to do so.

- [ ] **Step 4: Add dropdown CSS to `css/src/20-navigation.css`**

Append to end of file:

```css
/* --- Nav Dropdown --- */
.nav__dropdown {
  position: relative;
}

.nav__dropdown-trigger {
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.nav__dropdown-trigger svg {
  transition: transform 0.2s ease;
}

.nav__dropdown-trigger[aria-expanded="true"] svg {
  transform: rotate(180deg);
}

.nav__dropdown-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  min-width: 180px;
  padding: var(--space-xs) 0;
  z-index: 1001;
}

.nav__dropdown-trigger[aria-expanded="true"] + .nav__dropdown-menu {
  display: block;
}

.nav__dropdown-item {
  display: block;
  padding: var(--space-sm) var(--space-lg);
  color: var(--color-text);
  text-decoration: none;
  font-size: 0.9rem;
  transition: background-color var(--transition);
}

.nav__dropdown-item:hover {
  background: var(--color-bg-alt);
}
```

- [ ] **Step 5: Add dropdown JS to `js/main.js`**

Add dropdown toggle logic. Insert before the closing of the DOMContentLoaded handler or as a standalone block:

```js
// Nav dropdown toggle
document.querySelectorAll('.nav__dropdown-trigger').forEach(function(trigger) {
  trigger.addEventListener('click', function(e) {
    e.preventDefault();
    var expanded = this.getAttribute('aria-expanded') === 'true';
    // Close all dropdowns first
    document.querySelectorAll('.nav__dropdown-trigger').forEach(function(t) {
      t.setAttribute('aria-expanded', 'false');
    });
    if (!expanded) {
      this.setAttribute('aria-expanded', 'true');
    }
  });
});

// Close dropdown on outside click
document.addEventListener('click', function(e) {
  if (!e.target.closest('.nav__dropdown')) {
    document.querySelectorAll('.nav__dropdown-trigger').forEach(function(t) {
      t.setAttribute('aria-expanded', 'false');
    });
  }
});
```

- [ ] **Step 6: Add dark mode overrides for dropdown in `css/src/90-dark-theme.css`**

```css
[data-theme="dark"] .nav__dropdown-menu {
  background: #1a2332;
  border-color: rgba(159, 178, 203, 0.2);
}

[data-theme="dark"] .nav__dropdown-item:hover {
  background: rgba(255, 255, 255, 0.06);
}
```

- [ ] **Step 7: Build CSS and test**

```bash
cd /Users/jacobrozansky/exef
python3 scripts/build_css.py
```

Open `index.html` in browser. Verify:
- Nav shows: Home, Assessments, Coaching, Blog, About, Learn, [Book a Consultation]
- Learn dropdown opens on click, shows Curriculum + Certification
- Book a Consultation button is styled as CTA
- Dropdown closes on outside click
- Dark mode works for dropdown

- [ ] **Step 8: Commit**

```bash
git add scripts/update_nav.py css/src/20-navigation.css css/src/90-dark-theme.css js/main.js *.html
git commit -m "feat: streamline nav to coaching-first structure with Learn dropdown and Calendly CTA"
```

---

### Task 2: Add Calendly Widget Script to All Pages

**Files:**
- Modify: Every `.html` file (add Calendly CSS/JS to `<head>` and before `</body>`)

- [ ] **Step 1: Write a script to inject Calendly assets**

Create `scripts/add_calendly.py`:

```python
#!/usr/bin/env python3
"""Add Calendly widget CSS and JS to all HTML files."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

CALENDLY_CSS = '  <link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">'
CALENDLY_JS = '  <script src="https://assets.calendly.com/assets/external/widget.js" async></script>'

count = 0
for html_file in sorted(ROOT.glob('*.html')):
    text = html_file.read_text()
    changed = False

    # Add CSS before </head> if not already present
    if 'calendly.com' not in text:
        if '</head>' in text:
            text = text.replace('</head>', CALENDLY_CSS + '\n' + CALENDLY_JS + '\n</head>')
            changed = True

    if changed:
        html_file.write_text(text)
        count += 1
        print(f"  Updated: {html_file.name}")

print(f"\nUpdated {count} files with Calendly assets.")
```

- [ ] **Step 2: Run the script**

```bash
cd /Users/jacobrozansky/exef
python3 scripts/add_calendly.py
```

- [ ] **Step 3: Verify**

Open any page in browser. Click "Book a Consultation" in nav. Calendly popup should appear with the 30-minute booking form.

- [ ] **Step 4: Commit**

```bash
git add scripts/add_calendly.py *.html
git commit -m "feat: add Calendly popup widget to all pages via nav CTA"
```

---

### Task 3: Redesign Homepage (index.html)

**Files:**
- Modify: `index.html` (replace main content)

- [ ] **Step 1: Replace the entire `<main>` content**

Keep the `<head>`, `<nav>`, and `<footer>` (already updated in Tasks 1-2). Replace everything inside `<main id="main-content">` with:

```html
<main id="main-content">

  <!-- Hero -->
  <section class="hero">
    <div class="container">
      <div class="hero__content" style="text-align:center; max-width:var(--max-width-narrow); margin:0 auto;">
        <h1 class="hero__title">
          You know what you need to do.<br>
          <span>You just can't seem to start.</span>
        </h1>
        <p class="hero__subtitle">
          Executive function coaching that meets you where you are — not where you think you should be. EF challenges are neurobiological, not character flaws.
        </p>
        <div class="hero__actions">
          <a href="#" class="btn btn--primary btn--lg" onclick="Calendly.initPopupWidget({url: 'https://calendly.com/jacobansky/30min'});return false;">Book a Consultation</a>
          <a href="free-executive-functioning-tests.html" class="btn btn--outline-white btn--lg">Take an Assessment</a>
        </div>
      </div>
    </div>
  </section>

  <!-- What is EF Coaching? -->
  <section class="section">
    <div class="container">
      <div class="section-header fade-in">
        <h2>What is Executive Function Coaching?</h2>
        <p>Executive function coaching helps you build practical systems for planning, time management, task initiation, and follow-through. It's grounded in neuroscience — not productivity hacks or willpower.</p>
        <p><a href="coaching-home.html">Learn more about our approach &rarr;</a></p>
      </div>
    </div>
  </section>

  <!-- How Coaching Helps -->
  <section class="section section--alt">
    <div class="container">
      <div class="grid grid--3 stagger fade-in">
        <div class="card" style="text-align:center;">
          <div class="card__icon" style="background:var(--color-primary); margin:0 auto var(--space-lg);">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>
          </div>
          <h3>Get Started</h3>
          <p>Break through the wall between knowing and doing. We work on the task initiation barriers that keep you stuck.</p>
        </div>
        <div class="card" style="text-align:center;">
          <div class="card__icon" style="background:var(--color-accent); margin:0 auto var(--space-lg);">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><path d="M12 2a10 10 0 1 0 10 10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <h3>Stay on Track</h3>
          <p>Build systems that work with your brain instead of against it. Structure that fits how you actually think.</p>
        </div>
        <div class="card" style="text-align:center;">
          <div class="card__icon" style="background:var(--color-warm); margin:0 auto var(--space-lg);">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <h3>Build Momentum</h3>
          <p>Sustainable strategies replace the boom-bust cycle. Progress that compounds instead of collapsing.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Assessment Preview -->
  <section class="section">
    <div class="container">
      <div class="section-header fade-in">
        <h2>Understand Your EF Profile</h2>
        <p>Start with a self-assessment to identify where executive function challenges show up in your daily life.</p>
      </div>
      <div class="grid grid--3 stagger fade-in">
        <a href="esqr.html" class="card" style="text-decoration:none; color:inherit;">
          <h3>ESQ-R Assessment</h3>
          <p>Map your experience across Brown's six executive function clusters. Comprehensive and research-grounded.</p>
        </a>
        <a href="ef-profile-story.html" class="card" style="text-decoration:none; color:inherit;">
          <h3>EF Profile Story</h3>
          <p>A quick narrative quiz that builds a picture of your executive function strengths and challenges.</p>
        </a>
        <a href="environment-quiz.html" class="card" style="text-decoration:none; color:inherit;">
          <h3>Environment Quiz</h3>
          <p>Analyze how your physical and digital environments support or undermine your executive function.</p>
        </a>
      </div>
      <div class="text-center mt-2xl">
        <a href="free-executive-functioning-tests.html" class="btn btn--secondary">Explore All Assessments</a>
      </div>
    </div>
  </section>

  <!-- Bottom CTA -->
  <section class="cta-section">
    <div class="container">
      <h2>Ready to get started?</h2>
      <p>Book a consultation to talk about what's getting in the way — and what coaching can look like for you.</p>
      <div class="cta-section__actions">
        <a href="#" class="btn btn--primary btn--lg" onclick="Calendly.initPopupWidget({url: 'https://calendly.com/jacobansky/30min'});return false;">Book a Consultation</a>
      </div>
    </div>
  </section>

</main>
```

- [ ] **Step 2: Update page title and meta description**

Change the `<title>` and meta description to reflect coaching focus:

```html
<title>Executive Functioning Institute | EF & ADHD Coaching</title>
<meta name="description" content="Executive function and ADHD coaching grounded in neuroscience. Assessments, coaching, and support for people who know what they need to do but can't seem to start.">
```

- [ ] **Step 3: Verify in browser**

Open `index.html`. Verify:
- Hero loads immediately with headline, two CTAs visible above the fold
- "Book a Consultation" opens Calendly popup
- Three value cards render cleanly
- Assessment preview cards link correctly
- Bottom CTA works
- Dark mode works (existing styles should cover these standard components)
- No leftover content from the old homepage

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: redesign homepage for coaching-first experience"
```

---

### Task 4: Update Footer Across All Pages

**Files:**
- Modify: Every `.html` file with the footer

- [ ] **Step 1: Write a script to update all footer blocks**

Create `scripts/update_footer.py`:

```python
#!/usr/bin/env python3
"""Update footer nav across all HTML files."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

NEW_FOOTER_GRID = '''<div class="footer__grid">
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

pattern = re.compile(
    r'<div class="footer__grid">.*?</div>\s*</div>\s*</div>\s*</div>(?=\s*<div class="footer__bottom">)',
    re.DOTALL
)

count = 0
for html_file in sorted(ROOT.glob('*.html')):
    text = html_file.read_text()
    if 'footer__grid' not in text:
        continue
    new_text, n = pattern.subn(NEW_FOOTER_GRID, text)
    if n > 0:
        html_file.write_text(new_text)
        count += 1
        print(f"  Updated: {html_file.name}")

print(f"\nUpdated {count} footers.")
```

- [ ] **Step 2: Run the footer update script**

```bash
cd /Users/jacobrozansky/exef
python3 scripts/update_footer.py
```

- [ ] **Step 3: Verify**

Check `index.html` and `about.html` footers. Confirm the four columns: Site, Learn, Connect. Confirm "Book a Consultation" link and jacob@exef.org email.

- [ ] **Step 4: Commit**

```bash
git add scripts/update_footer.py *.html
git commit -m "feat: update footer nav with coaching-first structure and new email"
```

---

### Task 5: Update All Email Addresses

**Files:**
- Modify: `coaching-contact.html` (lines 179, 202, 239)
- Modify: `about.html` (line 175)
- Modify: `coach-directory.html` (line 127)
- Modify: `coach-directory-policy.html` (line 41)
- Modify: `terms.html` (lines 52, 55)
- Modify: `EFI-Capstone-Transparency-Rubric.html` (line 342)
- Modify: `EFI-Competency-Crosswalk-Map.html` (line 356)
- Modify: `privacy.html` (line 68)

- [ ] **Step 1: Replace all email addresses**

```bash
cd /Users/jacobrozansky/exef
# Replace jacob@jacobef.com
grep -rl 'jacob@jacobef.com' *.html | xargs sed -i '' 's/jacob@jacobef\.com/jacob@exef.org/g'
# Replace info@theexecutivefunctioninginstitute.com
grep -rl 'info@theexecutivefunctioninginstitute.com' *.html | xargs sed -i '' 's/info@theexecutivefunctioninginstitute\.com/jacob@exef.org/g'
```

- [ ] **Step 2: Verify replacements**

```bash
grep -r 'jacob@jacobef.com\|info@theexecutivefunctioninginstitute.com' *.html
```

Expected: No results (all replaced).

```bash
grep -r 'jacob@exef.org' *.html
```

Expected: All instances show the new email.

- [ ] **Step 3: Commit**

```bash
git add *.html
git commit -m "fix: update all email addresses to jacob@exef.org"
```

---

### Task 6: Update Calendly Link on Coaching Contact Page

**Files:**
- Modify: `coaching-contact.html`

- [ ] **Step 1: Read coaching-contact.html to find existing Calendly references**

```bash
grep -n 'calendly\|jacobef' coaching-contact.html
```

- [ ] **Step 2: Replace old Calendly link**

Replace `https://calendly.com/jacobef/efi-consultation` with `https://calendly.com/jacobansky/30min` throughout the file.

```bash
cd /Users/jacobrozansky/exef
sed -i '' 's|https://calendly.com/jacobef/efi-consultation|https://calendly.com/jacobansky/30min|g' coaching-contact.html
```

- [ ] **Step 3: Add inline Calendly widget to coaching-contact page**

Find the booking/calendar section of `coaching-contact.html` and add an inline Calendly widget container:

```html
<div class="calendly-inline-widget" data-url="https://calendly.com/jacobansky/30min" style="min-width:320px;height:700px;"></div>
```

This will embed the full calendar inline on the coaching contact page (in addition to the popup widget available from nav).

- [ ] **Step 4: Verify**

Open `coaching-contact.html` in browser. Verify:
- Inline calendar renders
- No references to old Calendly URL remain
- Email shows jacob@exef.org (from Task 5)

- [ ] **Step 5: Commit**

```bash
git add coaching-contact.html
git commit -m "feat: update coaching contact with new Calendly link and inline widget"
```

---

### Task 7: Create Blog Page

**Files:**
- Create: `blog.html`
- Create: `blog/` directory (for future posts)

- [ ] **Step 1: Create the blog directory**

```bash
mkdir -p /Users/jacobrozansky/exef/blog
```

- [ ] **Step 2: Create `blog.html`**

Use the site's standard page structure (head, nav, footer from existing pages). Content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog | Executive Functioning Institute</title>
  <meta name="description" content="Thoughts on executive function, ADHD, coaching, and building systems that work with your brain.">
  <link rel="preload" href="css/styles.css" as="style">
  <link rel="stylesheet" href="css/styles.css">
  <link rel="icon" href="favicon.svg">
  <link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">
  <script src="https://assets.calendly.com/assets/external/widget.js" async></script>
  <script src="js/theme-init.min.js"></script>
</head>
<body class="page-blog">

  <a href="#main-content" class="skip-link">Skip to main content</a>

  <!-- Navigation (same as all pages — will be inserted by Task 1) -->
  <nav class="nav" role="navigation" aria-label="Main navigation">
    <div class="nav__inner">
      <a href="index.html" class="nav__logo">
        <div class="nav__logo-icon">EFI</div>
        <span>Executive Functioning Institute</span>
      </a>
      <div class="nav__links" id="nav-links">
        <a href="index.html" class="nav__link">Home</a>
        <a href="free-executive-functioning-tests.html" class="nav__link">Assessments</a>
        <a href="coaching-home.html" class="nav__link">Coaching</a>
        <a href="blog.html" class="nav__link nav__link--active">Blog</a>
        <a href="about.html" class="nav__link">About</a>
        <div class="nav__dropdown">
          <button class="nav__link nav__dropdown-trigger" aria-expanded="false" aria-haspopup="true">Learn <svg aria-hidden="true" viewBox="0 0 12 8" width="12" height="8" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 1 6 6 11 1"/></svg></button>
          <div class="nav__dropdown-menu">
            <a href="curriculum.html" class="nav__dropdown-item">Curriculum</a>
            <a href="certification.html" class="nav__dropdown-item">Certification</a>
          </div>
        </div>
        <span class="nav__auth"></span>
        <a href="#" class="nav__link nav__link--cta" onclick="Calendly.initPopupWidget({url: 'https://calendly.com/jacobansky/30min'});return false;">Book a Consultation</a>
      </div>
      <button class="nav__toggle" aria-label="Toggle navigation" aria-expanded="false">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
    </div>
  </nav>

  <main id="main-content">

    <section class="section" style="padding-top:var(--space-4xl);">
      <div class="container">
        <div class="section-header">
          <h1>Blog</h1>
        </div>

        <div class="blog-grid" id="blog-posts">
          <p class="blog-empty">Posts coming soon. Check back for thoughts on executive function, ADHD, coaching, and how to build systems that actually work.</p>
        </div>

        <!-- When posts exist, replace .blog-empty with cards like:
        <a href="blog/post-slug.html" class="card blog-card" style="text-decoration:none; color:inherit;">
          <time class="blog-card__date">April 14, 2026</time>
          <h3 class="blog-card__title">Post Title Here</h3>
          <p class="blog-card__excerpt">A short excerpt of the post content goes here...</p>
          <span class="blog-card__read-more">Read more &rarr;</span>
        </a>
        -->
      </div>
    </section>

  </main>

  <footer class="footer">
    <div class="container">
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
      </div>
      <div class="footer__bottom">
        <span>The Executive Functioning Institute</span>
      </div>
    </div>
  </footer>

  <button type="button" class="back-to-top" aria-label="Back to top">&#8593;</button>

  <script src="js/nav-auth.min.js" defer></script>
  <script src="js/main.min.js" defer></script>
</body>
</html>
```

- [ ] **Step 3: Add blog CSS to `css/src/40-components.css`**

Append blog-specific styles:

```css
/* --- Blog --- */
.blog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-xl);
}

.blog-card {
  display: block;
}

.blog-card__date {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.blog-card__title {
  margin: var(--space-sm) 0;
}

.blog-card__excerpt {
  color: var(--color-text-light);
  font-size: 0.95rem;
  line-height: 1.6;
}

.blog-card__read-more {
  display: inline-block;
  margin-top: var(--space-md);
  color: var(--color-primary);
  font-weight: 600;
  font-size: 0.9rem;
}

.blog-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--space-3xl) var(--space-xl);
  color: var(--color-text-muted);
  font-size: 1.1rem;
}
```

- [ ] **Step 4: Build CSS**

```bash
cd /Users/jacobrozansky/exef
python3 scripts/build_css.py
```

- [ ] **Step 5: Verify**

Open `blog.html` in browser. Verify:
- Page loads with correct nav (Blog link active)
- "Posts coming soon" message displays centered
- Footer renders correctly
- Dark mode works

- [ ] **Step 6: Commit**

```bash
git add blog.html blog/ css/src/40-components.css css/styles.css
git commit -m "feat: add blog page with card grid layout"
```

---

### Task 8: Rewrite About Page as Team Page

**Files:**
- Modify: `about.html` (full rewrite of main content)

- [ ] **Step 1: Replace the `<main>` content of `about.html`**

Keep head, nav, footer. Replace everything inside `<main>`:

```html
<main id="main-content">

  <section class="section" style="padding-top:var(--space-4xl);">
    <div class="container">
      <div class="section-header">
        <h1>Our Team</h1>
        <p>The Executive Functioning Institute is built on the belief that EF challenges deserve science-grounded support, not shame.</p>
      </div>

      <!-- Jacob's Profile -->
      <div class="team-profile" style="max-width:var(--max-width-narrow); margin:0 auto;">
        <div class="card" style="display:grid; grid-template-columns:200px 1fr; gap:var(--space-2xl); align-items:start;">
          <div class="team-profile__photo" style="width:200px; height:200px; border-radius:var(--border-radius-lg); background:var(--color-bg-alt); display:flex; align-items:center; justify-content:center; font-size:3rem; color:var(--color-primary); font-family:var(--font-heading); font-weight:700;">
            JR
          </div>
          <div>
            <h2 style="margin-top:0;">Jacob Rozansky</h2>
            <p style="color:var(--color-text-muted); font-size:0.9rem; margin-bottom:var(--space-md);">
              Completing ADDCA ADHD coach training (ICF &amp; PAAC accredited program) &bull; PhD, Occupational Therapy &bull; M.Ed. &bull; Ed.S.
            </p>
            <p>
              I started the Executive Functioning Institute because I saw a gap between what the research says about executive function and the support most people actually get. Too often, EF challenges get reduced to "try harder" or "just use a planner." That's not how the brain works.
            </p>
            <p>
              My background in occupational therapy and education taught me that real support meets people in context — at the point of performance, not in the abstract. That's what coaching does when it's grounded in the right frameworks.
            </p>
            <p style="margin-top:var(--space-lg);">
              <a href="mailto:jacob@exef.org">jacob@exef.org</a>
            </p>
          </div>
        </div>
      </div>

      <!-- Team Expansion -->
      <div style="max-width:var(--max-width-narrow); margin:var(--space-3xl) auto 0; text-align:center;">
        <p style="color:var(--color-text-muted);">EFI is growing. More team members coming soon.</p>
      </div>

    </div>
  </section>

  <!-- CTA -->
  <section class="cta-section">
    <div class="container">
      <h2>Want to work together?</h2>
      <div class="cta-section__actions">
        <a href="#" class="btn btn--primary btn--lg" onclick="Calendly.initPopupWidget({url: 'https://calendly.com/jacobansky/30min'});return false;">Book a Consultation</a>
      </div>
    </div>
  </section>

</main>
```

- [ ] **Step 2: Update page title and meta**

```html
<title>Our Team | Executive Functioning Institute</title>
<meta name="description" content="Meet the team behind the Executive Functioning Institute. EF and ADHD coaching grounded in neuroscience and occupational therapy.">
```

- [ ] **Step 3: Add responsive override for team profile card**

Add to `css/src/50-accessibility-responsive.css` in the mobile media query section:

```css
@media (max-width: 640px) {
  .team-profile .card {
    grid-template-columns: 1fr !important;
    justify-items: center;
    text-align: center;
  }
}
```

- [ ] **Step 4: Build CSS and verify**

```bash
cd /Users/jacobrozansky/exef
python3 scripts/build_css.py
```

Open `about.html` in browser. Verify:
- Jacob's profile renders with initials placeholder, credentials, bio
- CTA button opens Calendly
- Mobile responsive (card stacks vertically)
- Dark mode works
- "About" link is active in nav

- [ ] **Step 5: Commit**

```bash
git add about.html css/src/50-accessibility-responsive.css css/styles.css
git commit -m "feat: rewrite about page as team page with Jacob's profile"
```

---

### Task 9: Simplify Resources Page

**Files:**
- Modify: `resources.html`

- [ ] **Step 1: Read the current resources page**

```bash
head -100 /Users/jacobrozansky/exef/resources.html
```

Identify the sections to remove (role selection, "about this page" explainer, artifact grid, "use this desk in order" sidebar).

- [ ] **Step 2: Replace the `<main>` content**

Keep head, nav, footer. Replace main content with a simplified three-section layout:

```html
<main id="main-content">

  <section class="section" style="padding-top:var(--space-4xl);">
    <div class="container">
      <div class="section-header">
        <h1>Resources</h1>
        <p>Tools and materials to support your executive functioning journey.</p>
      </div>

      <!-- Assessments -->
      <div id="assessments" style="margin-bottom:var(--space-3xl);">
        <h2>Assessments</h2>
        <div class="grid grid--3 stagger">
          <a href="esqr.html" class="card" style="text-decoration:none; color:inherit;">
            <h3>ESQ-R Assessment</h3>
            <p>Map your experience across Brown's six executive function clusters.</p>
          </a>
          <a href="ef-profile-story.html" class="card" style="text-decoration:none; color:inherit;">
            <h3>EF Profile Story</h3>
            <p>A narrative quiz that builds a picture of your EF strengths and challenges.</p>
          </a>
          <a href="environment-quiz.html" class="card" style="text-decoration:none; color:inherit;">
            <h3>Environment Quiz</h3>
            <p>Analyze how your surroundings support or undermine executive function.</p>
          </a>
          <a href="conative-action-profile.html" class="card" style="text-decoration:none; color:inherit;">
            <h3>Conative Action Profile</h3>
            <p>Identify your natural action style and strengths-based EF patterns.</p>
          </a>
          <a href="brown-clusters-tool.html" class="card" style="text-decoration:none; color:inherit;">
            <h3>Brown Clusters Tool</h3>
            <p>Explore Brown's six-cluster diagnostic framework interactively.</p>
          </a>
          <a href="time-blindness-calibrator.html" class="card" style="text-decoration:none; color:inherit;">
            <h3>Time Blindness Calibrator</h3>
            <p>Assess your time perception patterns and calibration strategies.</p>
          </a>
          <a href="task-start-friction.html" class="card" style="text-decoration:none; color:inherit;">
            <h3>Task Start Friction</h3>
            <p>Identify what's blocking task initiation and find targeted strategies.</p>
          </a>
          <a href="full-ef-profile.html" class="card" style="text-decoration:none; color:inherit;">
            <h3>Full EF Profile</h3>
            <p>Combine results from multiple assessments into a comprehensive EF profile.</p>
          </a>
        </div>
      </div>

      <!-- Printables -->
      <div id="printables" style="margin-bottom:var(--space-3xl);">
        <h2>Printables</h2>
        <p style="margin-bottom:var(--space-lg);">Downloadable PDFs for coaching sessions, self-reflection, and daily use.</p>
        <div class="grid grid--3 stagger" id="printables-grid">
          <!-- Printable cards will be populated based on available PDFs -->
          <p style="color:var(--color-text-muted);">Printable resources are available through the assessment tools and coaching materials above.</p>
        </div>
      </div>

      <!-- Outgoing Links -->
      <div id="links">
        <h2>External Resources</h2>
        <p style="margin-bottom:var(--space-lg);">Curated links to research, organizations, and tools we recommend.</p>
        <div class="grid grid--2 stagger">
          <a href="open-ef-resources-directory.html" class="card" style="text-decoration:none; color:inherit;">
            <h3>Open EF Resources Directory</h3>
            <p>A curated collection of executive functioning resources, tools, and research.</p>
          </a>
          <a href="further-sources.html" class="card" style="text-decoration:none; color:inherit;">
            <h3>Research & Citations</h3>
            <p>Source materials from Barkley, Brown, Dawson & Guare, Ward, and Harvard Center.</p>
          </a>
          <a href="coach-directory.html" class="card" style="text-decoration:none; color:inherit;">
            <h3>Coach Directory</h3>
            <p>Find certified executive function coaches.</p>
          </a>
          <a href="barkley-model-guide.html" class="card" style="text-decoration:none; color:inherit;">
            <h3>Barkley Model Guide</h3>
            <p>Comprehensive guide to Barkley's inhibition model of executive function.</p>
          </a>
        </div>
      </div>

    </div>
  </section>

</main>
```

- [ ] **Step 3: Update page title**

```html
<title>Resources | Executive Functioning Institute</title>
```

- [ ] **Step 4: Verify**

Open `resources.html`. Verify:
- Three clear sections: Assessments, Printables, External Resources
- No preamble, role selection, or "about this page" section
- All assessment links work
- Cards render in grid
- Dark mode works

- [ ] **Step 5: Commit**

```bash
git add resources.html
git commit -m "feat: simplify resources page to three clear sections"
```

---

### Task 10: Fix Dark Mode for Diagnostic Progress Component

**Files:**
- Modify: `css/src/90-dark-theme.css`

- [ ] **Step 1: Add dark mode overrides for `.full-profile-progress`**

Append to `css/src/90-dark-theme.css`:

```css
/* --- Full EF Profile Progress (dark mode) --- */
[data-theme="dark"] .full-profile-progress {
  background: rgba(26, 35, 50, 0.88);
  border-color: rgba(159, 178, 203, 0.2);
  color: var(--color-text);
}

[data-theme="dark"] .full-profile-progress h2,
[data-theme="dark"] .full-profile-progress h3,
[data-theme="dark"] .full-profile-progress p,
[data-theme="dark"] .full-profile-progress span {
  color: var(--color-text);
}

[data-theme="dark"] .full-profile-progress__meter {
  background: rgba(159, 178, 203, 0.2);
}
```

- [ ] **Step 2: Build CSS**

```bash
cd /Users/jacobrozansky/exef
python3 scripts/build_css.py
```

- [ ] **Step 3: Verify**

Open `full-ef-profile.html` in browser. Toggle dark mode. Verify:
- Progress box has dark background, light text
- Progress bar track is visible
- Progress fill gradient is visible and contrasts well
- "0 of 5 diagnostics complete" text is readable

- [ ] **Step 4: Commit**

```bash
git add css/src/90-dark-theme.css css/styles.css
git commit -m "fix: add dark mode overrides for diagnostic progress component"
```

---

### Task 11: Add Netlify Redirects for Blog

**Files:**
- Modify: `netlify.toml`

- [ ] **Step 1: Add blog redirect rules**

Add to the redirects section of `netlify.toml`:

```toml
[[redirects]]
  from = "/blog/"
  to = "/blog.html"
  status = 200

[[redirects]]
  from = "/blog"
  to = "/blog/"
  status = 301
  force = true
```

- [ ] **Step 2: Verify config syntax**

```bash
cd /Users/jacobrozansky/exef
cat netlify.toml | head -20
```

Ensure no syntax errors.

- [ ] **Step 3: Commit**

```bash
git add netlify.toml
git commit -m "feat: add Netlify redirect for blog page"
```

---

### Task 12: Rebuild All Assets and Final Verification

**Files:**
- Run: `scripts/build_css.py`
- Run: `scripts/build_main_bundle.py` (if main.js was modified)

- [ ] **Step 1: Rebuild CSS**

```bash
cd /Users/jacobrozansky/exef
python3 scripts/build_css.py
```

- [ ] **Step 2: Rebuild JS bundle**

```bash
python3 scripts/build_main_bundle.py
```

- [ ] **Step 3: Full verification checklist**

Open each page in browser and verify:

| Page | Check |
|------|-------|
| `index.html` | Hero with 2 CTAs, three cards, assessment preview, bottom CTA. No old sections. |
| `about.html` | Jacob's profile, credentials, team expansion placeholder |
| `blog.html` | "Posts coming soon" message, correct nav active state |
| `resources.html` | Three sections: Assessments, Printables, External Resources |
| `coaching-contact.html` | Inline Calendly widget, jacob@exef.org email |
| `full-ef-profile.html` | Dark mode progress box readable |
| Any other page | Nav has new structure, footer updated, Calendly popup works |

- [ ] **Step 4: Verify dark mode on all updated pages**

Toggle dark mode on each page. Check:
- Nav dropdown menu visible in dark mode
- Cards readable
- Progress component readable
- Footer contrast good

- [ ] **Step 5: Run link checker**

```bash
cd /Users/jacobrozansky/exef
python3 scripts/check_links.py
```

Fix any broken links.

- [ ] **Step 6: Commit any final fixes**

```bash
git add -A
git commit -m "chore: rebuild assets and fix any remaining issues"
```
