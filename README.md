# The Executive Functioning Institute

An open-source, science-based Executive Functioning Coaching Certification program grounded in the work of Barkley, Brown, Dawson & Guare, and Ward.

## Delivery Model

EFI is an asynchronous-first product:
- No synchronous classes
- No required video lectures
- No group projects
- Core paid offers focus on certification, assignment/test review, alumni network access, and individual 1:1 EF coaching

## About

The Executive Functioning Institute provides a rigorous six-module certification curriculum that trains professionals to become Certified Executive Functioning Coaches (CEFC). The program bridges the gap between theoretical neuroscience and practical coaching, training coaches to be the "external frontal lobe" their clients need.

## Site Structure

- **index.html** — Homepage with program overview, three foundational models, and certification path
- **about.html** — Mission, theoretical foundations (Barkley, Brown, Dawson & Guare), and the 360 Thinking model
- **curriculum.html** — Complete six-module curriculum overview with units, topics, and assignments
- **certification.html** — Certification requirements, capstone practicum, peer review, and ethics
- **resources.html** — Curated public resource hub for assessments, toolkits, templates, and directory access
- **getting-started.html** — Bridge page pointing to homepage start paths
- **enroll.html** — Bridge page pointing to the unified store
- **module-1.html** — Module 1: Neuropsychology of Self-Regulation
- **module-2.html** — Module 2: Assessment Protocols & Intake Strategy
- **module-3.html** — Module 3: The Coaching Architecture (Dawson & Guare Framework)
- **module-4.html** — Module 4: Applied Methodologies (360 Thinking Model)
- **module-5.html** — Module 5: Strategic Interventions & Special Populations
- **module-6.html** — Module 6: Professional Ethics & Practice Management
- **module-a-neuroscience.html** — Legacy bridge to Module 1
- **module-b-pedagogy.html** — Legacy bridge to Module 3
- **module-c-interventions.html** — Legacy bridge to Module 4
- **barkley-model-guide.html** — Definitive Barkley inhibition model hub
- **brown-clusters-tool.html** — Brown six-cluster interactive pre-diagnostic tool
- **ward-360-thinking.html** — 360 Thinking and Get Ready, Do, Done hub
- **barkley-vs-brown.html** — Comparative model analysis page
- **teacher-to-coach.html** — Educator transition landing page + ROI calculator
- **coaching-home.html** — Unified EFI coaching practice page
- **coaching-methodology.html** — Bridge page to coaching approach section
- **coaching-services.html** — Bridge page to coaching services section
- **coaching-about.html** — Bridge page to coaching practice section
- **coaching-contact.html** — Coaching consultation request page
- **educator-launchpad.html** — Bridge page to teacher-to-coach launchpad
- **gap-analyzer.html** — Download gate for skills gap analyzer lead magnet
- **launch-plan.html** — Download gate for 90-day business launch plan
- **coach-directory.html** — Searchable certified coach directory (city/state/zip)
- **community.html** — Community recap/forum digest hub
- **scope-of-practice.html** — Coaching vs therapy legal/scope guidance
- **accreditation.html** — NBEFC/ICF alignment status page
- **further-sources.html** — Bridge page to the directory citation section
- **Further Sources** — Root-level canonical source corpus used for citation integration

## Curriculum Modules

1. **Neuropsychology of Self-Regulation** — Barkley's inhibition hierarchy, Brown's six clusters, PFC development
2. **Assessment & Intake Strategy** — ESQ-R administration, BRIEF-2, intake simulations, "Goodness of Fit"
3. **The Coaching Architecture** — Dawson & Guare framework, two-tiered intervention, ICF competencies
4. **Applied Methodologies** — Ward's "Get Ready, Do, Done," temporal management, cognitive offloading
5. **Strategic Interventions & Special Populations** — ADHD/ASD adaptations, environmental engineering, transitions
6. **Professional Ethics & Practice** — ICF/NBEFC alignment, business setup, the Launch Kit

## Theoretical Foundations

The curriculum integrates three foundational models:
- **Barkley Model** — Inhibition as the keystone of self-regulation; the Extended Phenotype
- **Brown Model** — Six clusters of cognitive management; situational variability
- **Dawson & Guare Model** — 12 discrete executive skills in Thinking and Doing domains

## Running Locally

Open `index.html` in any web browser. No dependency install is required — the site is built with vanilla HTML, CSS, and JavaScript.

CSS now uses a tiny local build step while still shipping a single generated stylesheet:
- Edit source partials in `css/src/`
- Rebuild with `python3 scripts/build_css.py`
- Production pages continue to load `css/styles.css`
- Current split:
  - `css/src/00-base.css` for tokens, reset, typography, and layout utilities
  - `css/src/20-navigation.css` for navigation and button foundations
  - `css/src/30-page-sections.css` for hero and page-level section layouts
  - `css/src/40-components.css` for reusable cards, forms, tables, tabs, footer, and CTA blocks
  - `css/src/50-accessibility-responsive.css` for responsive, print, motion, and forced-colors rules
  - `css/src/60-esqr.css` for ESQ-R assessment UI
  - `css/src/70-commerce.css` for store cards, cart, and testimonials
  - `css/src/80-ui-extras.css` for dark-mode toggle, roadmap, and site-guide additions
  - `css/src/90-dark-theme.css` for dark theme overrides

For managed auth + durable persistence deployment, provision Supabase tables with `docs/supabase-schema.sql`.
Set `EFI_SUBMISSIONS_CRON_SECRET` in production and rely on `netlify/functions/process-due-feedback.js` for delayed feedback release notifications.

## Quality Gates

- `python3 scripts/check_links.py` — validates local links.
- `python3 scripts/check_accessibility.py` — static accessibility checks.
- `python3 scripts/check_pdfs.py` — validates local linked PDFs are real PDF files.
- `python3 scripts/check_source_hub.py` — validates directory/citation hub integration.
- `python3 scripts/check_ux_audit.py` — structural UX audit baseline.
- `python3 scripts/check_console_logs.py` — blocks `console.log` and `debugger` in production JS.
- `python3 scripts/build_css.py` — regenerates `css/styles.css` from `css/src/manifest.txt`.
- `python3 scripts/release_gate.py` — consolidated deployment gate.
- `node --test tests/ai-rubric.test.mjs` — unit tests for rubric grading utilities.

## Project Progress

- Canonical tracker: `docs/progress.md`
- Archived progress history:
  - `docs/production-readiness-todos.md`
  - `docs/roadmap-to-perfection.md`
  - `docs/next-10-todos.md`
  - `docs/content-gap-audit.md`

## License

Open-source curriculum built on publicly available, peer-reviewed research.
