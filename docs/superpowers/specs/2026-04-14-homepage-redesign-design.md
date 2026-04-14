# EFI Site Overhaul: Coaching-First Redesign

**Date:** 2026-04-14
**Status:** Approved
**Goal:** Streamline exef.org to prioritize coaching client acquisition. Reduce preamble across all pages, add blog and team pages, integrate Calendly, update contact info.

---

## 1. Navigation Overhaul

**Current:** Home, About, Curriculum, Certification, Search, Resources, Store

**New nav (left to right):**
- Home
- Assessments
- Coaching
- Blog
- About
- Learn (dropdown: Curriculum, Certification)
- **[Book a Consultation]** (styled CTA button, always visible)

**Moved to footer:** Resources, Store, Search

**"Book a Consultation" behavior:** Opens Calendly popup widget using `calendly.com/jacobansky/30min`. Uses Calendly's external widget JS (`assets.calendly.com/assets/external/widget.js`). Every page loads this script.

---

## 2. Homepage Redesign (index.html)

Strip down to 5 lean sections. Remove: hero sheet/dossier, institute dossier, public artifacts, start paths (3 lanes), pricing row. Those can live on Learn/About pages.

### Section 1: Hero
- Headline: "You know what you need to do. You just can't seem to start."
- Subtext: 1-2 sentences, anti-shame framing. EF challenges are neurobiological, not character flaws.
- Two CTAs: "Book a Consultation" (Calendly popup) + "Take an Assessment" (links to assessments page)
- No statistics, no "1 in 3 adults" — save that for deeper pages.

### Section 2: What is EF Coaching?
- 2-3 sentences max. Plain language.
- One "Learn more" link to the about or coaching page.

### Section 3: Three Value Cards
- Card 1: Get Started — break through task initiation barriers
- Card 2: Stay on Track — build systems that work with your brain
- Card 3: Build Momentum — sustainable strategies, not willpower
- Each card: icon/visual, title, one sentence.

### Section 4: Assessment Preview
- 2-3 featured assessment tools (ESQ-R, EF Profile Story, one other)
- One-line description each
- "Explore all assessments" link

### Section 5: Bottom CTA
- "Ready to get started?"
- "Book a Consultation" button (Calendly popup)

---

## 3. Calendly Integration

### Script Loading
- Add Calendly widget CSS and JS to every page via shared head/footer pattern:
  - `<link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">`
  - `<script src="https://assets.calendly.com/assets/external/widget.js" async></script>`

### Popup Widget
- All "Book a Consultation" buttons call:
  ```js
  Calendly.initPopupWidget({url: 'https://calendly.com/jacobansky/30min'});
  ```
- This opens the calendar as an overlay without leaving the page.

### Coaching Contact Page
- Embed inline Calendly widget as the primary content (not just a popup)
- Use `Calendly.initInlineWidget()` targeting a container div
- Minimal preamble above the widget

---

## 4. Blog Page (new file: blog.html)

### Structure
- Page title: "Blog" (no subtitle needed)
- Card grid layout (responsive: 1 col mobile, 2 col tablet, 3 col desktop)
- Each card: title, date, short excerpt (2-3 sentences), "Read more" link

### Blog Post Storage
- Individual HTML files: `blog/post-slug.html`
- Create `blog/` directory
- Each post is a standalone HTML page with the site's shared nav/footer
- Blog index page links to posts manually (no build system needed — static site)

### Initial State
- Empty state message: "Posts coming soon." with a brief note
- Scaffold with 1-2 placeholder cards showing the layout

### Design
- Match site's existing card aesthetic (warm cream backgrounds, navy headings)
- No categories/tags initially — add later when there's enough content to warrant them

---

## 5. About / Team Page (rewrite about.html)

### New Structure

**Section 1: Page Header**
- Title: "Our Team"
- One sentence: who EFI is and what we do.

**Section 2: Jacob Rozansky (featured)**
- Photo placeholder (div with initials or icon until photo is provided)
- Name: Jacob Rozansky
- Credentials: ICF-Certified Coach | ADDCA ADHD Coaching (in progress) | PhD, Occupational Therapy | M.Ed. | Ed.S.
- Personal statement: 3-4 sentences on why EF coaching matters. Written by Jacob (placeholder for now).
- Contact: jacob@exef.org

**Section 3: Team (scaffolded)**
- "Growing our team" or similar — brief note that EFI is expanding
- Empty grid that can hold additional team member cards in the same format

**Theoretical models content** (Barkley, Brown, Dawson & Guare, Ward) moves to the Curriculum page or a dedicated "Our Approach" section under Learn. It doesn't belong on a team page.

---

## 6. Email Updates

**Find and replace across all HTML files:**
- `jacob@jacobef.com` → `jacob@exef.org`
- `info@theexecutivefunctioninginstitute.com` → `jacob@exef.org`

**Files affected** (from codebase search):
- coaching-contact.html
- about.html
- coach-directory.html
- coach-directory-policy.html
- EFI-Capstone-Transparency-Rubric.html
- EFI-Competency-Crosswalk-Map.html
- privacy.html
- terms.html
- Any other files containing either email

---

## 7. Resources Page Simplification (resources.html)

### Current Problems
- Role-selection routing ("Which route are you on?") adds friction
- "About This Page" artifact grid explains the page instead of showing content
- "Use This Desk In Order" sidebar is overhead

### New Structure

**Header:** "Resources" + one sentence ("Tools and materials to support your executive functioning journey.")

**Section 1: Assessments**
- Cards linking to interactive EF tools (ESQ-R, EF Profile Story, Environment Quiz, etc.)
- Brief one-line description each

**Section 2: Printables**
- Grid of available PDFs with download links
- Title + brief description for each

**Section 3: Outgoing Links**
- Curated external resources, research links, partner organizations
- Organized by topic, not by "role"

**Remove:** Role selection, "About This Page" explainer, artifact grid, "Use This Desk In Order" sidebar, reading packets narrative (convert to links)

---

## 8. Preamble Trimming Guidelines

**Rule:** If the first viewport doesn't show actionable content or a clear CTA, cut or condense what's above it.

**Pages to audit:**
- Coaching pages (coaching-home, coaching-services, coaching-methodology): lead with what coaching is and how to book, not philosophy
- Module pages: trim "Why This Matters" callouts to 1 sentence each
- Curriculum page: collapse module overviews to bullet points, expand on click
- Certification page: lead with requirements, not "what makes this credible"

**General approach:** For each page, identify the first piece of genuinely useful or actionable content. Everything above it either gets cut, condensed to one sentence, or moved below the fold.

---

## 9. Dark Mode Fix

**Problem:** "Diagnostic progress 0 of 5 diagnostics complete" box doesn't render properly in dark mode.

**Fix:** Add appropriate color overrides in `css/src/90-dark-theme.css` for the diagnostic progress component. Likely needs:
- Background color override
- Text color override
- Border/shadow adjustments
- Progress indicator contrast fix

Locate the component's CSS class, verify the issue, add `[data-theme="dark"]` overrides.

---

## 10. Scope Boundaries

**In scope:**
- All 9 items above
- Updating existing Netlify redirects if routes change

**Out of scope (for now):**
- Store redesign
- Module content editing
- New assessment tools
- Authentication/dashboard changes
- SEO overhaul (beyond what naturally improves)
- Mobile app or PWA changes
