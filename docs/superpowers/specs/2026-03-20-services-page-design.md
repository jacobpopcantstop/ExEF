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
- Label: `"Coaching"` → `"Services"` across all pages that reference it
- Page `<title>` and `<meta description>` updated to reflect broader scope

### Hero Section
- **Old:** "Creative Executive Function Coaching That Actually Engages Your Child" — child-focused, coaching-specific
- **New:** "Executive Function Support From the Right Specialist" — families first, adults acknowledged, specialist-agnostic
- Subheading explains the three specialties briefly
- CTAs unchanged: "Schedule a Consultation" + "Start With Free Tools"

### New: Three Service Cards (inserted between hero and existing coaching content)

| Card | State | CTA |
|------|-------|-----|
| EF Coaching | Active (green border, "Available Now" badge) | "Schedule Consultation" → `coaching-contact.html` |
| Educational Specialist | Coming Soon (dashed border, muted) | "Notify Me When Available" → `coaching-contact.html?subject=ed-specialist` |
| Occupational Therapy | Coming Soon (dashed border, muted) | "Notify Me When Available" → `coaching-contact.html?subject=ot` |

**EF Coaching card copy:** Creative, engagement-first coaching for students using improv, chess, and cubing. Also available for adults navigating ADHD.

**Educational Specialist card copy:** School-system navigation, IEP support, placement decisions, and academic advocacy for families who need someone in their corner.

**Occupational Therapy card copy:** Sensory regulation, fine motor, and daily-living skill support. OT referrals for children and adolescents whose profile points beyond coaching.

### New: "Which specialist do I need?" Triage Box

A brief callout box below the three cards. Three plain-language signals:
- Coaching fits when motivation and follow-through are the problem
- Ed specialist fits when the school system is the problem
- OT fits when the body is the problem — sensory, motor, or regulation at a physical level

CTAs: "Take the Free ESQ-R First" → `esqr.html` | "Ask in Consultation" → `coaching-contact.html`

### Existing Content (unchanged, preserved below new sections)
- What families usually bring to the first call
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
3. Insert three-card grid section immediately after the hero section (`#hero-parent`)
4. Insert triage box section immediately after the card grid
5. Keep all existing sections unchanged below

### CSS
The page uses `coaching.css` (separate from `styles.css`). Add new styles for:
- `.services-cards` — three-column grid, stacks to single column at ≤768px
- `.service-card` — base card style
- `.service-card--active` — green border + "Available Now" badge
- `.service-card--soon` — dashed border, muted treatment, badge
- `.service-triage` — triage box styling (light blue background, info border)

### Nav label update
Update `"Coaching"` → `"Services"` in every page that has this nav link. The JS bundle (`main-ui.js` and all compiled variants) normalizes the primary nav — check whether "Coaching" appears there and update it. Also update `coaching-home.html`'s own nav and any hardcoded nav links in other HTML files.

---

## Out of Scope
- Building actual ed specialist or OT sub-pages
- Collecting "notify me" emails via a form (links to contact page with pre-filled subject is sufficient for now)
- Changes to `coaching-contact.html`
- Any changes to `coaching.css` beyond additions
