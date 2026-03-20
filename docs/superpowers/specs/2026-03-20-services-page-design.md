# Services Page Redesign — Design Spec
**Date:** 2026-03-20
**File:** `coaching-home.html`
**Status:** Approved

---

## Overview

Rebrand `coaching-home.html` from a single-service EF coaching page into a multi-specialty services hub. The page introduces three specialist types — EF Coaching (active), Educational Specialist (coming soon), and Occupational Therapy (coming soon) — and routes visitors to the right lane. All existing coaching content is preserved below the new hub section.

---

## Goals

- Signal that EFI connects families with more than one type of specialist
- Let visitors self-identify quickly (families/students primary; adults secondary)
- Avoid implying ed specialist and OT are currently bookable
- Preserve existing coaching page SEO and content investment

---

## What Changes

### Navigation
- Label: `"Coaching"` → `"Services"` in every HTML file that contains it
- The nav label is **hardcoded in each HTML file** — there is no JS bundle managing it. Grep all `.html` files for `>Coaching<` and update each one. The primary nav in `main-ui.js` / compiled bundles uses labels like `"Parents and Families"` and `"Parents"` (not `"Coaching"`) — those do **not** need changes.
- Known files to update (grep to confirm complete list): `coaching-home.html`, `coaching-contact.html`, `index.html`, `resources.html`, `curriculum.html`, `store.html`, `certification.html`, `search.html`, `task-start-friction.html`, `time-blindness-calibrator.html`, and any other `.html` files in the root.
- Page `<title>` and `<meta description>` in `coaching-home.html` updated to reflect broader scope.

### Hero Section
- **Old:** "Creative Executive Function Coaching That Actually Engages Your Child" — child-focused, coaching-specific
- **New:** "Executive Function Support From the Right Specialist" — families first, adults acknowledged, specialist-agnostic
- Subheading explains the three specialties briefly
- CTAs unchanged: "Schedule a Consultation" + "Start With Free Tools"

### New: Three Service Cards (inserted between `#hero-parent` and `#problem-parent`)

Insert a new `<section>` between the closing `</section>` of `#hero-parent` (line ~105) and the opening of `#problem-parent` (line ~108).

| Card | State | CTA |
|------|-------|-----|
| EF Coaching | Active (green border, "Available Now" badge) | "Schedule Consultation" → `coaching-contact.html` |
| Educational Specialist | Coming Soon (dashed border, muted) | "Notify Me When Available" → `coaching-contact.html` |
| Occupational Therapy | Coming Soon (dashed border, muted) | "Notify Me When Available" → `coaching-contact.html` |

Note: "Notify Me" CTAs link to `coaching-contact.html` with no query string. The contact page has no handler for URL parameters and is out of scope — plain links are sufficient.

**EF Coaching card copy:** Creative, engagement-first coaching for students using improv, chess, and cubing. Also available for adults navigating ADHD.

**Educational Specialist card copy:** School-system navigation, IEP support, placement decisions, and academic advocacy for families who need someone in their corner.

**Occupational Therapy card copy:** Sensory regulation, fine motor, and daily-living skill support. OT referrals for children and adolescents whose profile points beyond coaching.

**Accessibility:** Coming-soon cards must not use `disabled` on anchor/button elements. Instead, use `aria-label` to convey unavailability (e.g., `aria-label="Educational Specialist — not yet available"`). Add a visually-hidden `<span class="sr-only">Currently unavailable</span>` inside each coming-soon CTA button so screen readers announce it.

### New: "Which specialist do I need?" Triage Box

A brief callout box immediately after the three-card grid. Three plain-language signals:
- Coaching fits when motivation and follow-through are the problem
- Ed specialist fits when the school system is the problem
- OT fits when the body is the problem — sensory, motor, or regulation at a physical level

CTAs: "Take the Free ESQ-R First" → `esqr.html` (the ESQ-R surfaces coaching-relevant EF patterns and confirms whether coaching is the right lane) | "Ask in Consultation" → `coaching-contact.html`

### Existing Content (unchanged, preserved below new sections)
- What families usually bring to the first call (`#problem-parent`)
- Creative-to-Structured coaching method
- Why families choose EFI Coaching
- Services preview
- Testimonials / Signals from the Field
- Cube Challenge
- San Diego Community Calendar
- Final CTA

---

## Implementation Notes

### HTML (`coaching-home.html`)
1. Update `<title>`, `<meta description>`, and `<meta keywords>`
2. Update hero `<h1>` and subtitle `<p>`
3. Insert three-card grid section between `#hero-parent` and `#problem-parent`
4. Insert triage box section immediately after the card grid
5. Keep all existing sections (`#problem-parent` onward) unchanged

### CSS (`coaching.css` — additions only, no edits to existing rules)
Add new styles at the end of `coaching.css`. Do **not** edit `coaching.min.js` (there is no minified CSS). The stylesheet is loaded directly as `coaching.css` — no compiled counterpart.

New classes needed:
- `.services-cards` — three-column grid, stacks to single column at ≤768px
- `.service-card` — base card style (border-radius, padding, flex column layout)
- `.service-card--active` — green border (`#27ae60`) + "Available Now" badge
- `.service-card--soon` — dashed grey border, reduced opacity (0.8), "Coming Soon" badge
- `.service-triage` — triage box (light blue background, info-style left border)
- `.sr-only` — if not already defined in `coaching.css`: `position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0`

### JavaScript (`coaching.js` and `coaching.min.js`)
No JS changes required for the new service cards or triage box — they are static HTML.

If any new interactive behavior is added later (e.g., reading URL params on the contact page), both `coaching.js` **and** `coaching.min.js` must be updated together. The page loads `coaching.min.js` (see `<script src="js/coaching.min.js">` in `coaching-home.html`). Since there is no automated minification build step in `package.json`, update the `.min.js` manually by copying and compressing the relevant function.

### Nav label update (all `.html` files)
Run: `grep -rn ">Coaching<" *.html` from the project root to find every file. Update each occurrence of the nav link text from `Coaching` to `Services`. The `href` attribute (`coaching-home.html`) does not change.

---

## Out of Scope
- Building actual ed specialist or OT sub-pages
- Adding URL parameter handling to `coaching-contact.html`
- Any changes to `coaching.css` beyond appended additions
- Changes to the JS bundle (`main-ui.js` / compiled variants) — nav labels there are unrelated
