# Changelog

## Unreleased

### Security
- Self-hosted html2canvas and jsPDF in `js/vendor/` and removed `cdn.jsdelivr.net` from the CSP, eliminating the third-party CDN script dependency.
- Auth tokens now live in `sessionStorage` (cleared when the browser closes) instead of `localStorage`, with one-time migration; stale managed sessions without a token are dropped on page load.
- Fixed stored XSS in dashboard reviewer notes (`js/dashboard-inline.js`) by rendering notes as text instead of HTML.
- Signing/CSRF secrets now fail closed: dev fallback secrets only apply under `netlify dev`, never in deployed environments.
- CORS now defaults to `https://exef.org` instead of `*` when `EFI_CORS_ORIGIN` is unset.
- Stripe webhook demo-secret path is disabled in the production deploy context.
- Added IP and per-email rate limiting to login and registration endpoints.
- Raised minimum registration password length from 6 to 8 characters.
- Expanded `Permissions-Policy` to deny accelerometer, gyroscope, magnetometer, payment, and USB.

### Fixed
- `emotion-check-in.html` was the only page on the site with no Google Analytics tag and no shared analytics bundle, so all of its traffic and its email captures were invisible. It now loads both.
- Rebuilt stale `js/quality-of-life-wheel.min.js`; the shipped minified file predated a slider-fill fix in its source.
- Sitemap no longer lists pages disallowed in `robots.txt` (`scripts/build_sitemap.py` now reads robots.txt).
- Added missing canonical tag to `quality-of-life-wheel.html`.
- Homepage now loads minified `homepage-ux.min.js`.
- Untracked generated artifacts (`output/`, `tmp/`) and moved unlinked source DOCX files out of the web root into `docs/source-materials/`.

### Added
- GA4 event bridge in `js/main-analytics.js`: every `EFI.Analytics.track()` call is now mirrored into `gtag('event', …)`, so tool completions, lead submits, and booking clicks reach GA4 instead of only `/api/track-event`. GA4 previously reported zero key events because nothing but automatic page views ever reached it.
- `assessment_completed` events on the six scored tools (ESQ-R, Conative Action Profile, Brain Mode Quiz, Environment Quiz, Sleep Functioning Quiz, Best-Fit Fitness Quiz), fired on submit only so restoring a saved result does not re-count as a completion.
- `resource_download` events for ungated PDF/DOC/ZIP links. Sessions that landed on a page, downloaded a resource and left were previously scored as bounces. Named to avoid double-counting GA4 enhanced measurement's built-in `file_download`.
- `docs/analytics-key-events.md` — which events to mark as Key Events in GA4, the custom dimensions they need, and the URL-split and sample-size caveats in the current reports.
- `tests/e2e/analytics-ga4.spec.js` — end-to-end coverage for the GA4 bridge, including that `page_view` is not re-sent and that a restored quiz result does not re-fire a completion.
- `scripts/optimize_images.py` — in-place JPEG re-encoding and PNG optimization/quantization (saved ~61 MB across `images/`; directory now 38 MB).
- `scripts/check_perf_budget.py` — performance budget gate (per-image, total images, CSS, and JS size limits) wired into `release_gate.py`.
- Product/Offer JSON-LD structured data on `store.html`.
- Reviewer/Admin operations page (`admin.html`) with role-gated access.
- Static accessibility checker and CI workflow.
- Netlify deployment headers/CSP baseline.
- Release checklist and API contract starter docs.
- Consolidated deployment gate script (`scripts/release_gate.py`) and CI workflow (`.github/workflows/release-gate.yml`).
- Supporting theory/resource pages: `barkley-model-guide.html`, `brown-clusters-tool.html`, `ward-360-thinking.html`, `barkley-vs-brown.html`.
- Business and lead-magnet pages/features: `teacher-to-coach.html`, `gap-analyzer.html`, `launch-plan.html`.
- Directory/community/trust pages: `coach-directory.html`, `community.html`, `scope-of-practice.html`, `accreditation.html`.
- Placeholder lead magnet assets in `docs/assets/`.
- Canonical `Further Sources` source file plus directory/citation integration.
- Source integration validation script `scripts/check_source_hub.py`.
- Netlify Functions backend for deployment flows: `/api/leads`, `/api/sign-download`, `/api/download-file`, `/api/track-event`.
- PDF integrity validation script `scripts/check_pdfs.py`.
- UX audit script `scripts/check_ux_audit.py` and utility-page UX fixes (skip links, labels, form semantics).
- Uptime probe workflow for production routes (`.github/workflows/uptime-check.yml`).

### Changed
- Authentication password handling upgraded to PBKDF2 (`crypto.subtle`) with migration from legacy hashes.
- Login/register handlers updated to async auth calls.
- Expanded canonical URL coverage and sitemap route coverage.
- Canonical tags and sitemap URLs normalized to `https://executivefunctioninginstitute.com`.
- Added `EducationalOrganization` + `Course` JSON-LD markup on curriculum and certification pages.
- Added source-hub checks into the consolidated release gate.
- Added PDF integrity checks into the consolidated release gate.
- Updated deployment environment template and baseline docs for webhook/signing configuration.
- Added roadmap and checklist updates for API validation and UX audit quality gates.
- Fixed dark-mode token issue causing black-on-black text in specific contexts.
- Consolidated the public site architecture around a smaller core:
  - `store.html` is now the single paid-path page
  - homepage start paths replaced the old standalone getting-started flow
  - coaching is effectively compressed to `coaching-home.html` + `coaching-contact.html`
  - `resources.html` + `open-ef-resources-directory.html` now handle the resource stack
  - `free-executive-functioning-tests.html` is the clear assessment hub
  - legacy toolkit, launchpad, and legacy module pages now act as bridge pages instead of parallel destinations
- Updated store and certification language to emphasize human-reviewed grading, paid pathway clarity, and public pricing instead of interest-form positioning.
