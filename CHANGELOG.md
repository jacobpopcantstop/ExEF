# Changelog

## Unreleased

### Added
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
