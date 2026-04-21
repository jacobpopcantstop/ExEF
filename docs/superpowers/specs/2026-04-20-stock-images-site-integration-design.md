# Stock Images Site Integration — Design

**Date:** 2026-04-20
**Status:** Draft for review

## Goal

Integrate 34 stock images from `~/Desktop/Media/EFI Photos/Stock Images for Site` into the EFI website across Tier 1 (landing) and Tier 2 (concept) pages, using a hybrid approach: mood-driven heroes on landing pages, metaphor-driven inline placements on concept pages.

## Approach

**Hybrid placement strategy (Approach 3):**
- **Tier 1 landing pages** → large hero images, mood/warmth
- **Tier 2 concept pages** → medium inline images (~300–400px wide), metaphor-driven, placed near the concept they illustrate

**Technical pattern (matches existing site):**
- Copy originals into `/images/` directory
- Generate responsive variants at 640px and 960px widths using `sips` (macOS)
- Keep originals as full-size fallback
- Use `<picture>` with `<source srcset>` for responsive loading, matching existing `-640.png` / `-960.png` convention but with `.jpg`
- All images get descriptive `alt` text
- Add `loading="lazy"` for non-hero images
- Add `width` and `height` attributes to prevent CLS

## Image-to-Page Mappings

### Tier 1 — Hero placements (mood-driven)

| Page | Image | Rationale | Placement |
|------|-------|-----------|-----------|
| `index.html` | `morningcoffeesunlight.jpg` | Warm, intentional start to the day | Hero area or intro section |
| `coaching-home.html` | `forestpath.jpg` | Journey, guided path | Hero area |
| `about.html` | `SanDiegoBeach.jpg` | Regional anchor, personal/founder context | Hero or bio section |
| `free-executive-functioning-tests.html` | `kaleidoscope.jpg` | Varied perspectives, many lenses on EF | Hero or intro |
| `certification.html` | `mountainpeak.jpg` | Achievement, summit, professional milestone | Hero |
| `curriculum.html` | `bookshelf.jpg` | Structured body of knowledge | Hero |

### Tier 2 — Inline metaphor placements

| Page | Image(s) | Concept it illustrates |
|------|----------|------------------------|
| `barkley-model-guide.html` | `waterfall.jpg` | Barkley's inhibition cascade |
| `barkley-model-guide.html` | `airtrafficcontrol.jpg` | Working memory / orchestration of incoming demands |
| `barkley-model-guide.html` | `hourglass.jpg` | Time horizon / sense of time |
| `barkley-vs-brown.html` | `prism.jpg` | Different theoretical perspectives refracting EF |
| `ef-profile-story.html` | `puzzlepieces.jpg` | Assembling the profile from multiple signals |
| `ef-profile-story.html` | `conductororchestra.jpg` | EF as conductor (classic metaphor) |
| `coaching-methodology.html` | `scaffolding.jpg` | Coaching scaffolding |
| `coaching-methodology.html` | `bonzaitree.jpg` | Patience, slow growth, shaped intentionally |
| `coaching-methodology.html` | `lighthouse.jpg` | Guidance without doing the work for the client |
| `getting-started.html` | `compass.jpg` | Orientation, direction |
| `getting-started.html` | `bullseye.jpg` | Goal setting |
| `getting-started.html` | `checklistboard.jpg` | Concrete next steps |

### Reserved for future / not placed in this pass
- `Card_magic.jpg` — earmarked for a future "unlock" / creative moment section
- `cheweduppen.jpg` — earmarked for task-start friction content
- `alarmclock.jpg`, `balancingrocks.jpg`, `deepbreath.jpg`, `focus.jpg`, `handshake.jpg`, `highfive.jpg`, `meditation.jpg`, `messydesk.jpg`, `officedesk.jpg`, `Planner.jpg`, `chessboard.jpg`, `rubikscube.jpg`, `sparks.jpg`, `stickynote.jpg` — available for later passes (blog posts, result pages, resources expansions)

## Build / Asset Pipeline

1. **Resize script** — write `scripts/resize_stock_images.sh` using `sips` to generate `-640.jpg` and `-960.jpg` variants for each image we're placing. Output to `/images/`.
2. **Filename normalization** — rename during copy to kebab-case lowercase (e.g., `Card_magic.jpg` → `card-magic.jpg`, `SanDiegoBeach.jpg` → `san-diego-beach.jpg`, `Planner.jpg` → `planner.jpg`).
3. **No changes to the build pipeline itself** — we're only adding new asset files, not touching `scripts/build_css.py` or the JS minification.

## HTML Pattern

**Hero image (Tier 1):**
```html
<picture>
  <source media="(max-width: 640px)" srcset="images/morningcoffeesunlight-640.jpg">
  <source media="(max-width: 960px)" srcset="images/morningcoffeesunlight-960.jpg">
  <img src="images/morningcoffeesunlight.jpg"
       alt="Morning coffee in warm sunlight"
       class="page-hero__image"
       width="1600" height="900">
</picture>
```

**Inline image (Tier 2):**
```html
<figure class="inline-figure">
  <picture>
    <source media="(max-width: 640px)" srcset="images/waterfall-640.jpg">
    <img src="images/waterfall-960.jpg"
         alt="Waterfall cascading down rocks"
         loading="lazy"
         width="960" height="640">
  </picture>
  <figcaption>Barkley's model treats inhibition as the source of a cascade.</figcaption>
</figure>
```

## CSS Additions

Add to `css/src/` a new partial (e.g., `45-imagery.css`):
- `.page-hero__image` — full-width, max-height cap, object-fit: cover, rounded corners matching site style
- `.inline-figure` — max-width 480px, centered or floated based on modifier class, rounded corners, optional caption styling
- `.inline-figure--float-right` and `.inline-figure--float-left` modifiers for magazine-style layout on wider viewports; stack on mobile
- Dark theme overrides (if needed) for caption text color in `css/src/90-dark-theme.css`

## Accessibility

- Every image gets descriptive `alt` text (not filename-derived)
- Decorative-only images (none in this pass — all are meaningful) would use `alt=""`
- `<figure>` + `<figcaption>` when the image has explanatory context
- All placements must meet contrast/legibility when text overlays are involved (none planned in this pass — images sit beside or above text, not behind)

## Performance

- Responsive variants (640, 960, full) served via `<picture>`
- `loading="lazy"` on all non-hero images
- `width`/`height` attributes to prevent CLS
- Expected page weight impact: ~100–200KB per page with 1–3 images using 960px JPEGs at ~85% quality

## Out of Scope

- No new pages
- No redesign of existing layouts beyond adding image slots
- No changes to assessment UIs, dashboards, or interactive tools
- No blog post illustrations (Tier 3, future pass)

## Success Criteria

- All 6 Tier 1 pages have a hero image
- All 5 Tier 2 pages have 1–3 inline metaphor images placed near the concept
- All images have responsive variants
- All images have meaningful alt text
- No Lighthouse regression >5 points on any modified page
- Existing Playwright tests still pass
