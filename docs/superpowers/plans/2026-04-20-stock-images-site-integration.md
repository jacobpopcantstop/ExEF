# Stock Images Site Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate 17 stock images into 11 pages of the EFI site (6 Tier 1 heroes + 11 Tier 2 inline placements), matching the site's existing responsive-image conventions.

**Architecture:** Copy source JPGs into `/images/` with kebab-case-lowercase filenames, generate 640/960 variants via the existing `build_responsive_images.py`, reference with `<img srcset>` matching the pattern already used (see `module-4.html:113`). Add one CSS partial for an `inline-figure` helper; heroes reuse existing inline-figure styling.

**Tech Stack:** HTML, CSS (custom-property-based build via `scripts/build_css.py`), `sips` for image resizing via existing `scripts/build_responsive_images.py`.

---

## File Structure

**Created:**
- `images/morningcoffeesunlight.jpg`, `images/forestpath.jpg`, `images/san-diego-beach.jpg`, `images/kaleidoscope.jpg`, `images/mountainpeak.jpg`, `images/bookshelf.jpg` (Tier 1 originals)
- `images/waterfall.jpg`, `images/airtrafficcontrol.jpg`, `images/hourglass.jpg`, `images/prism.jpg`, `images/puzzlepieces.jpg`, `images/conductororchestra.jpg`, `images/scaffolding.jpg`, `images/bonzaitree.jpg`, `images/lighthouse.jpg`, `images/compass.jpg`, `images/bullseye.jpg`, `images/checklistboard.jpg` (Tier 2 originals — superset; some pages use 2-3)
- `-640.jpg` and `-960.jpg` variants for each (auto-generated)
- `css/src/45-imagery.css` (new CSS partial)

**Modified:**
- `scripts/build_responsive_images.py` — add entries for the new JPGs
- `css/src/manifest.txt` — register the new partial
- `index.html`, `coaching-home.html`, `about.html`, `free-executive-functioning-tests.html`, `certification.html`, `curriculum.html` (Tier 1)
- `barkley-model-guide.html`, `barkley-vs-brown.html`, `ef-profile-story.html`, `coaching-methodology.html`, `getting-started.html` (Tier 2)

---

## Conventions Used Throughout This Plan

The site uses this image pattern (see `module-4.html:113` and `module-4.html:125`):

```html
<figure style="margin:var(--space-2xl) 0;text-align:center;">
  <img src="images/FILENAME.jpg"
       srcset="images/FILENAME-640.jpg 640w, images/FILENAME-960.jpg 960w, images/FILENAME.jpg WIDTHw"
       sizes="(max-width: 768px) 92vw, (max-width: 1200px) 88vw, 960px"
       width="FULLWIDTH" height="FULLHEIGHT"
       alt="DESCRIPTIVE ALT"
       style="max-width:100%;border-radius:var(--border-radius);box-shadow:0 4px 20px rgba(0,0,0,0.12);"
       loading="lazy" decoding="async">
</figure>
```

For **hero images** (Tier 1), drop `loading="lazy"` (keep `decoding="async"`), and place inside the `<header class="page-header">` just under the breadcrumb+h1 block.

For **inline images** (Tier 2), keep `loading="lazy"` and place in a `<figure>` inside the relevant `<section>`, typically just after the first paragraph that introduces the concept.

---

## Task 1: Copy source images and generate responsive variants

**Files:**
- Create: `images/*.jpg` (17 sources + 34 responsive variants)
- Modify: `scripts/build_responsive_images.py`

- [ ] **Step 1: Copy source images with normalized filenames**

Run:

```bash
cd /Users/jacobrozansky/exef

SRC="/Users/jacobrozansky/Desktop/Media/EFI Photos/Stock Images for Site"

cp "$SRC/morningcoffeesunlight.jpg"   images/morningcoffeesunlight.jpg
cp "$SRC/forestpath.jpg"              images/forestpath.jpg
cp "$SRC/SanDiegoBeach.jpg"           images/san-diego-beach.jpg
cp "$SRC/kaleidoscope.jpg"            images/kaleidoscope.jpg
cp "$SRC/mountainpeak.jpg"            images/mountainpeak.jpg
cp "$SRC/bookshelf.jpg"               images/bookshelf.jpg
cp "$SRC/waterfall.jpg"               images/waterfall.jpg
cp "$SRC/airtrafficcontrol.jpg"       images/airtrafficcontrol.jpg
cp "$SRC/hourglass.jpg"               images/hourglass.jpg
cp "$SRC/prism.jpg"                   images/prism.jpg
cp "$SRC/puzzlepieces.jpg"            images/puzzlepieces.jpg
cp "$SRC/conductororchestra.jpg"      images/conductororchestra.jpg
cp "$SRC/scaffolding.jpg"             images/scaffolding.jpg
cp "$SRC/bonzaitree.jpg"              images/bonzaitree.jpg
cp "$SRC/lighthouse.jpg"              images/lighthouse.jpg
cp "$SRC/compass.jpg"                 images/compass.jpg
cp "$SRC/bullseye.jpg"                images/bullseye.jpg
cp "$SRC/checklistboard.jpg"          images/checklistboard.jpg
```

Expected: no errors; `ls images/*.jpg | wc -l` reports at least 17 new files.

- [ ] **Step 2: Record each image's pixel dimensions**

Run:

```bash
for f in images/morningcoffeesunlight.jpg images/forestpath.jpg images/san-diego-beach.jpg images/kaleidoscope.jpg images/mountainpeak.jpg images/bookshelf.jpg images/waterfall.jpg images/airtrafficcontrol.jpg images/hourglass.jpg images/prism.jpg images/puzzlepieces.jpg images/conductororchestra.jpg images/scaffolding.jpg images/bonzaitree.jpg images/lighthouse.jpg images/compass.jpg images/bullseye.jpg images/checklistboard.jpg; do
  echo "$f: $(sips -g pixelWidth -g pixelHeight "$f" | grep -E 'pixelWidth|pixelHeight' | awk '{print $2}' | tr '\n' ' ')"
done
```

Record the width and height of each — you'll need the original pixel dimensions for the `width`/`height` HTML attributes and for the `WIDTHw` entry in `srcset`.

- [ ] **Step 3: Extend `scripts/build_responsive_images.py` to include the new JPGs**

Modify `scripts/build_responsive_images.py:13-33` — the `TARGETS` dict. Add the JPG entries alongside the existing PNG entries:

```python
TARGETS = {
    # ...existing PNG entries unchanged...
    "morningcoffeesunlight.jpg": [640, 960],
    "forestpath.jpg": [640, 960],
    "san-diego-beach.jpg": [640, 960],
    "kaleidoscope.jpg": [640, 960],
    "mountainpeak.jpg": [640, 960],
    "bookshelf.jpg": [640, 960],
    "waterfall.jpg": [640, 960],
    "airtrafficcontrol.jpg": [640, 960],
    "hourglass.jpg": [640, 960],
    "prism.jpg": [640, 960],
    "puzzlepieces.jpg": [640, 960],
    "conductororchestra.jpg": [640, 960],
    "scaffolding.jpg": [640, 960],
    "bonzaitree.jpg": [640, 960],
    "lighthouse.jpg": [640, 960],
    "compass.jpg": [640, 960],
    "bullseye.jpg": [640, 960],
    "checklistboard.jpg": [640, 960],
}
```

- [ ] **Step 4: Run the build to generate variants**

Run: `python3 scripts/build_responsive_images.py`
Expected: `Built 36 responsive image variant(s).` (18 images × 2 widths; may be fewer if any original is narrower than 960px — that's fine)
Verify: `ls images/*-640.jpg images/*-960.jpg | wc -l` returns at least 30 files.

- [ ] **Step 5: Commit the asset additions and script change**

```bash
git add images/*.jpg scripts/build_responsive_images.py
git commit -m "assets: add stock image sources and responsive variants"
```

---

## Task 2: Add CSS partial for inline figure helper

**Files:**
- Create: `css/src/45-imagery.css`
- Modify: `css/src/manifest.txt`

- [ ] **Step 1: Write the CSS partial**

Create `css/src/45-imagery.css`:

```css
/* ==========================================================================
   45-imagery.css — Stock image / inline figure helpers
   Used by: content pages with inline metaphor images (Tier 2)
   Heroes use existing <figure> inline styles in page-header context.
   ========================================================================== */

.inline-figure {
  margin: var(--space-2xl) auto;
  text-align: center;
  max-width: 560px;
}

.inline-figure img {
  max-width: 100%;
  height: auto;
  border-radius: var(--border-radius);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.inline-figure figcaption {
  margin-top: var(--space-sm);
  font-size: 0.9rem;
  color: var(--color-text-muted);
  font-style: italic;
}

.page-hero-figure {
  margin: var(--space-lg) auto 0;
  text-align: center;
  max-width: 1040px;
}

.page-hero-figure img {
  max-width: 100%;
  height: auto;
  border-radius: var(--border-radius);
  box-shadow: 0 6px 32px rgba(0, 0, 0, 0.18);
}
```

- [ ] **Step 2: Register the partial in the manifest**

Edit `css/src/manifest.txt`. Current contents:

```
00-base.css
20-navigation.css
30-page-sections.css
40-components.css
50-accessibility-responsive.css
60-esqr.css
70-commerce.css
80-ui-extras.css
90-dark-theme.css
```

Insert `45-imagery.css` between `40-components.css` and `50-accessibility-responsive.css`:

```
00-base.css
20-navigation.css
30-page-sections.css
40-components.css
45-imagery.css
50-accessibility-responsive.css
60-esqr.css
70-commerce.css
80-ui-extras.css
90-dark-theme.css
```

- [ ] **Step 3: Add dark theme overrides for figcaption if needed**

Check `css/src/90-dark-theme.css` — if `--color-text-muted` is already overridden for dark theme, the figcaption will follow automatically and you can skip. If captions would be hard to read on dark, append to `90-dark-theme.css`:

```css
[data-theme="dark"] .inline-figure figcaption {
  color: var(--color-text-muted);
}
```

(Usually already covered by the variable — only add if visual QA in Task 8 shows a problem.)

- [ ] **Step 4: Build the CSS**

Run: `python3 scripts/build_css.py`
Expected: no errors, outputs updated `css/styles.css`.
Verify: `grep 'inline-figure' css/styles.css` returns the new rules.

- [ ] **Step 5: Commit**

```bash
git add css/src/45-imagery.css css/src/manifest.txt css/styles.css
git commit -m "css: add inline-figure and page-hero-figure helpers"
```

---

## Task 3: Tier 1 hero — `index.html`

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Locate the intro area**

Open `index.html`. Find the first `<section>` or the hero block at the top of `<main>`. The current hero typically lives right after `<main id="main-content">`.

- [ ] **Step 2: Insert the hero figure**

Inside the hero section, after the primary `<h1>` and intro paragraph but before any CTA buttons, insert:

```html
<figure class="page-hero-figure">
  <img src="images/morningcoffeesunlight.jpg"
       srcset="images/morningcoffeesunlight-640.jpg 640w, images/morningcoffeesunlight-960.jpg 960w, images/morningcoffeesunlight.jpg ORIGWIDTHw"
       sizes="(max-width: 768px) 92vw, (max-width: 1200px) 88vw, 960px"
       width="ORIGWIDTH" height="ORIGHEIGHT"
       alt="Sunlight streaming across a morning coffee, evoking a calm intentional start to the day"
       decoding="async">
</figure>
```

Replace `ORIGWIDTH`, `ORIGHEIGHT`, `ORIGWIDTHw` with the actual pixel dimensions recorded in Task 1 Step 2.

- [ ] **Step 3: Visually verify**

Run `scripts/serve.sh` in another terminal, open `http://localhost:PORT/index.html`, and confirm the image loads, is sized appropriately (not overflowing), and looks good in both light and dark theme.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "index: add morning-coffee hero image"
```

---

## Task 4: Tier 1 heroes — coaching-home, about, free-executive-functioning-tests

**Files:**
- Modify: `coaching-home.html`, `about.html`, `free-executive-functioning-tests.html`

- [ ] **Step 1: `coaching-home.html`**

Open `coaching-home.html`. Find the hero / intro area (typically first section after nav). Insert after the intro paragraph:

```html
<figure class="page-hero-figure">
  <img src="images/forestpath.jpg"
       srcset="images/forestpath-640.jpg 640w, images/forestpath-960.jpg 960w, images/forestpath.jpg ORIGWIDTHw"
       sizes="(max-width: 768px) 92vw, (max-width: 1200px) 88vw, 960px"
       width="ORIGWIDTH" height="ORIGHEIGHT"
       alt="Forest path winding into soft light, representing a guided coaching journey"
       decoding="async">
</figure>
```

- [ ] **Step 2: `about.html`**

Open `about.html`. Insert after the intro paragraph in the first content section:

```html
<figure class="page-hero-figure">
  <img src="images/san-diego-beach.jpg"
       srcset="images/san-diego-beach-640.jpg 640w, images/san-diego-beach-960.jpg 960w, images/san-diego-beach.jpg ORIGWIDTHw"
       sizes="(max-width: 768px) 92vw, (max-width: 1200px) 88vw, 960px"
       width="ORIGWIDTH" height="ORIGHEIGHT"
       alt="San Diego coastline at golden hour, the region where Expert EF is based"
       decoding="async">
</figure>
```

- [ ] **Step 3: `free-executive-functioning-tests.html`**

Open `free-executive-functioning-tests.html`. Insert after the intro paragraph in the hub intro section:

```html
<figure class="page-hero-figure">
  <img src="images/kaleidoscope.jpg"
       srcset="images/kaleidoscope-640.jpg 640w, images/kaleidoscope-960.jpg 960w, images/kaleidoscope.jpg ORIGWIDTHw"
       sizes="(max-width: 768px) 92vw, (max-width: 1200px) 88vw, 960px"
       width="ORIGWIDTH" height="ORIGHEIGHT"
       alt="Kaleidoscope pattern evoking the many facets measured across EF assessments"
       decoding="async">
</figure>
```

- [ ] **Step 4: Visually verify each**

Run the dev server and check each of the three pages in light and dark themes.

- [ ] **Step 5: Commit**

```bash
git add coaching-home.html about.html free-executive-functioning-tests.html
git commit -m "pages: add Tier 1 hero images (coaching-home, about, assessment-hub)"
```

---

## Task 5: Tier 1 heroes — certification, curriculum

**Files:**
- Modify: `certification.html`, `curriculum.html`

- [ ] **Step 1: `certification.html`**

Open `certification.html`. Insert after the intro paragraph in the hero/intro section:

```html
<figure class="page-hero-figure">
  <img src="images/mountainpeak.jpg"
       srcset="images/mountainpeak-640.jpg 640w, images/mountainpeak-960.jpg 960w, images/mountainpeak.jpg ORIGWIDTHw"
       sizes="(max-width: 768px) 92vw, (max-width: 1200px) 88vw, 960px"
       width="ORIGWIDTH" height="ORIGHEIGHT"
       alt="Mountain peak above the clouds, representing the professional milestone of certification"
       decoding="async">
</figure>
```

- [ ] **Step 2: `curriculum.html`**

Open `curriculum.html`. Insert after the intro paragraph:

```html
<figure class="page-hero-figure">
  <img src="images/bookshelf.jpg"
       srcset="images/bookshelf-640.jpg 640w, images/bookshelf-960.jpg 960w, images/bookshelf.jpg ORIGWIDTHw"
       sizes="(max-width: 768px) 92vw, (max-width: 1200px) 88vw, 960px"
       width="ORIGWIDTH" height="ORIGHEIGHT"
       alt="Organized bookshelf, representing the structured body of knowledge in the ExEF curriculum"
       decoding="async">
</figure>
```

- [ ] **Step 3: Visually verify**

Run the dev server and confirm both pages look correct.

- [ ] **Step 4: Commit**

```bash
git add certification.html curriculum.html
git commit -m "pages: add Tier 1 hero images (certification, curriculum)"
```

---

## Task 6: Tier 2 inline — barkley-model-guide, barkley-vs-brown

**Files:**
- Modify: `barkley-model-guide.html`, `barkley-vs-brown.html`

- [ ] **Step 1: `barkley-model-guide.html` — waterfall near the cascade concept**

Open `barkley-model-guide.html`. Search for the section that introduces Barkley's inhibition cascade (terms: "cascade", "inhibition", "flows from"). Insert after the first paragraph that introduces the cascade:

```html
<figure class="inline-figure">
  <img src="images/waterfall.jpg"
       srcset="images/waterfall-640.jpg 640w, images/waterfall-960.jpg 960w, images/waterfall.jpg ORIGWIDTHw"
       sizes="(max-width: 768px) 92vw, 480px"
       width="ORIGWIDTH" height="ORIGHEIGHT"
       alt="Waterfall cascading over rocks, a visual metaphor for Barkley's inhibition cascade"
       loading="lazy" decoding="async">
  <figcaption>Inhibition cascades into the other executive functions.</figcaption>
</figure>
```

- [ ] **Step 2: `barkley-model-guide.html` — airtrafficcontrol near working memory**

Find the section covering working memory / nonverbal or verbal working memory. Insert after the introductory paragraph:

```html
<figure class="inline-figure">
  <img src="images/airtrafficcontrol.jpg"
       srcset="images/airtrafficcontrol-640.jpg 640w, images/airtrafficcontrol-960.jpg 960w, images/airtrafficcontrol.jpg ORIGWIDTHw"
       sizes="(max-width: 768px) 92vw, 480px"
       width="ORIGWIDTH" height="ORIGHEIGHT"
       alt="Air traffic control tower, a metaphor for working memory juggling multiple incoming demands"
       loading="lazy" decoding="async">
  <figcaption>Working memory as an air traffic controller for incoming information.</figcaption>
</figure>
```

- [ ] **Step 3: `barkley-model-guide.html` — hourglass near time / self-directed action across time**

Find the section covering sense of time, time horizon, or self-directed action across time. Insert after the introductory paragraph:

```html
<figure class="inline-figure">
  <img src="images/hourglass.jpg"
       srcset="images/hourglass-640.jpg 640w, images/hourglass-960.jpg 960w, images/hourglass.jpg ORIGWIDTHw"
       sizes="(max-width: 768px) 92vw, 480px"
       width="ORIGWIDTH" height="ORIGHEIGHT"
       alt="Hourglass representing the time horizon that executive functioning extends across"
       loading="lazy" decoding="async">
  <figcaption>Executive function extends behavior across time toward future goals.</figcaption>
</figure>
```

- [ ] **Step 4: `barkley-vs-brown.html` — prism near "different models of EF"**

Open `barkley-vs-brown.html`. Insert after the introductory paragraph contrasting the two models:

```html
<figure class="inline-figure">
  <img src="images/prism.jpg"
       srcset="images/prism-640.jpg 640w, images/prism-960.jpg 960w, images/prism.jpg ORIGWIDTHw"
       sizes="(max-width: 768px) 92vw, 480px"
       width="ORIGWIDTH" height="ORIGHEIGHT"
       alt="Prism refracting light, a metaphor for how different EF models illuminate different facets"
       loading="lazy" decoding="async">
  <figcaption>Different theoretical lenses refract the same construct differently.</figcaption>
</figure>
```

- [ ] **Step 5: Visually verify**

Run the dev server and check both pages. Confirm the images sit near the right concepts.

- [ ] **Step 6: Commit**

```bash
git add barkley-model-guide.html barkley-vs-brown.html
git commit -m "content: add inline metaphor images to Barkley guide and comparison"
```

---

## Task 7: Tier 2 inline — ef-profile-story, coaching-methodology, getting-started

**Files:**
- Modify: `ef-profile-story.html`, `coaching-methodology.html`, `getting-started.html`

- [ ] **Step 1: `ef-profile-story.html` — puzzlepieces near "assembling the profile"**

Open `ef-profile-story.html`. Find a section where the profile is described as being assembled from multiple signals. Insert:

```html
<figure class="inline-figure">
  <img src="images/puzzlepieces.jpg"
       srcset="images/puzzlepieces-640.jpg 640w, images/puzzlepieces-960.jpg 960w, images/puzzlepieces.jpg ORIGWIDTHw"
       sizes="(max-width: 768px) 92vw, 480px"
       width="ORIGWIDTH" height="ORIGHEIGHT"
       alt="Puzzle pieces coming together, representing how multiple assessments build one coherent profile"
       loading="lazy" decoding="async">
  <figcaption>Each assessment is one piece of the larger profile.</figcaption>
</figure>
```

- [ ] **Step 2: `ef-profile-story.html` — conductororchestra near the EF-as-orchestration concept**

Find a section that frames EF as an orchestration or conducting metaphor. Insert:

```html
<figure class="inline-figure">
  <img src="images/conductororchestra.jpg"
       srcset="images/conductororchestra-640.jpg 640w, images/conductororchestra-960.jpg 960w, images/conductororchestra.jpg ORIGWIDTHw"
       sizes="(max-width: 768px) 92vw, 480px"
       width="ORIGWIDTH" height="ORIGHEIGHT"
       alt="Conductor directing an orchestra, a metaphor for executive function coordinating cognitive resources"
       loading="lazy" decoding="async">
  <figcaption>EF as the conductor coordinating many cognitive instruments.</figcaption>
</figure>
```

- [ ] **Step 3: `coaching-methodology.html` — scaffolding near coaching scaffolding**

Open `coaching-methodology.html`. Find the scaffolding section. Insert:

```html
<figure class="inline-figure">
  <img src="images/scaffolding.jpg"
       srcset="images/scaffolding-640.jpg 640w, images/scaffolding-960.jpg 960w, images/scaffolding.jpg ORIGWIDTHw"
       sizes="(max-width: 768px) 92vw, 480px"
       width="ORIGWIDTH" height="ORIGHEIGHT"
       alt="Construction scaffolding, a metaphor for temporary external structures that support skill development"
       loading="lazy" decoding="async">
  <figcaption>Coaching provides scaffolding — temporary external structure that comes down as capacity grows.</figcaption>
</figure>
```

- [ ] **Step 4: `coaching-methodology.html` — bonzaitree near the patience / intentional shaping concept**

Find a section about patience, growth, or intentional shaping. Insert:

```html
<figure class="inline-figure">
  <img src="images/bonzaitree.jpg"
       srcset="images/bonzaitree-640.jpg 640w, images/bonzaitree-960.jpg 960w, images/bonzaitree.jpg ORIGWIDTHw"
       sizes="(max-width: 768px) 92vw, 480px"
       width="ORIGWIDTH" height="ORIGHEIGHT"
       alt="Bonsai tree carefully shaped over time, representing patient intentional development"
       loading="lazy" decoding="async">
  <figcaption>Growth is shaped intentionally, over time, with steady attention.</figcaption>
</figure>
```

- [ ] **Step 5: `coaching-methodology.html` — lighthouse near the guidance-not-doing concept**

Find a section framing the coach as a guide who does not do the work for the client. Insert:

```html
<figure class="inline-figure">
  <img src="images/lighthouse.jpg"
       srcset="images/lighthouse-640.jpg 640w, images/lighthouse-960.jpg 960w, images/lighthouse.jpg ORIGWIDTHw"
       sizes="(max-width: 768px) 92vw, 480px"
       width="ORIGWIDTH" height="ORIGHEIGHT"
       alt="Lighthouse on a rocky coast, a metaphor for guidance that illuminates the way without steering the ship"
       loading="lazy" decoding="async">
  <figcaption>A coach illuminates the path — the client still steers the ship.</figcaption>
</figure>
```

- [ ] **Step 6: `getting-started.html` — compass near "orient yourself"**

Open `getting-started.html`. Find a section about orientation or choosing a direction. Insert:

```html
<figure class="inline-figure">
  <img src="images/compass.jpg"
       srcset="images/compass-640.jpg 640w, images/compass-960.jpg 960w, images/compass.jpg ORIGWIDTHw"
       sizes="(max-width: 768px) 92vw, 480px"
       width="ORIGWIDTH" height="ORIGHEIGHT"
       alt="Compass resting on a map, representing orientation at the start of the journey"
       loading="lazy" decoding="async">
  <figcaption>Start by orienting — know where you are before choosing where to go.</figcaption>
</figure>
```

- [ ] **Step 7: `getting-started.html` — bullseye near goal-setting**

Find a section about goals or targeted outcomes. Insert:

```html
<figure class="inline-figure">
  <img src="images/bullseye.jpg"
       srcset="images/bullseye-640.jpg 640w, images/bullseye-960.jpg 960w, images/bullseye.jpg ORIGWIDTHw"
       sizes="(max-width: 768px) 92vw, 480px"
       width="ORIGWIDTH" height="ORIGHEIGHT"
       alt="Archery target with an arrow in the bullseye, representing clearly defined goals"
       loading="lazy" decoding="async">
  <figcaption>Clear goals are easier to aim at than vague ones.</figcaption>
</figure>
```

- [ ] **Step 8: `getting-started.html` — checklistboard near the concrete-next-steps section**

Find a section with numbered steps or a "what to do first" list. Insert:

```html
<figure class="inline-figure">
  <img src="images/checklistboard.jpg"
       srcset="images/checklistboard-640.jpg 640w, images/checklistboard-960.jpg 960w, images/checklistboard.jpg ORIGWIDTHw"
       sizes="(max-width: 768px) 92vw, 480px"
       width="ORIGWIDTH" height="ORIGHEIGHT"
       alt="Checklist on a board, representing concrete actionable steps"
       loading="lazy" decoding="async">
  <figcaption>Turn intentions into checkable items.</figcaption>
</figure>
```

- [ ] **Step 9: Visually verify all three pages**

Run the dev server. Check each page in both light and dark themes. Confirm images sit near their anchoring concepts and captions read well.

- [ ] **Step 10: Commit**

```bash
git add ef-profile-story.html coaching-methodology.html getting-started.html
git commit -m "content: add inline metaphor images to profile, methodology, and onboarding pages"
```

---

## Task 8: Validation and regression check

**Files:** (no changes; verification only)

- [ ] **Step 1: Run link checker**

Run: `python3 scripts/check_links.py`
Expected: no new broken links from the 17 new image references.

- [ ] **Step 2: Run accessibility check**

Run: `python3 scripts/check_accessibility.py`
Expected: no new violations. All new `<img>` tags have non-empty alt text (verified by script). If it flags any, fix the offending `alt` attribute.

- [ ] **Step 3: Run Playwright e2e suite**

Run: `npx playwright test`
Expected: all 19 tests pass (same as before this work).

- [ ] **Step 4: Manual spot-check in browser**

Run `scripts/serve.sh`. Visit each of the 11 modified pages in Chrome or Safari:

- `index.html`
- `coaching-home.html`
- `about.html`
- `free-executive-functioning-tests.html`
- `certification.html`
- `curriculum.html`
- `barkley-model-guide.html`
- `barkley-vs-brown.html`
- `ef-profile-story.html`
- `coaching-methodology.html`
- `getting-started.html`

For each: (a) image loads, (b) image is not distorted or overflowing, (c) image looks correct in both light and dark themes, (d) no layout shift visible during load, (e) captions readable.

- [ ] **Step 5: Final commit (only if any fixes were made in steps 1-4)**

```bash
git add -u
git commit -m "fix: address validation findings from image integration"
```

- [ ] **Step 6: Push to main**

```bash
git push origin main
```

---

## Self-Review Notes

- All 6 Tier 1 pages covered (Task 3, 4, 5)
- All 5 Tier 2 pages covered (Task 6, 7)
- CSS build pipeline updated (Task 2) before pages reference new classes (Task 3-7) ✓
- Responsive variants generated before pages reference them (Task 1) ✓
- Every `srcset` uses `-640.jpg` and `-960.jpg` variants that Task 1 Step 4 generates ✓
- All `<img>` tags have descriptive alt text ✓
- `loading="lazy"` on inline Tier 2 images, omitted on Tier 1 heroes ✓
- Class names consistent across tasks: `page-hero-figure` (heroes) and `inline-figure` (Tier 2) — defined in Task 2, used in Tasks 3-7 ✓
