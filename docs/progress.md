# Progress Tracker (Canonical)

Last updated: February 26, 2026

## Current State
- This is the single source of truth for project progress.
- Historical implementation logs are archived in:
  - `docs/production-readiness-todos.md`
  - `docs/next-10-todos.md`
  - `docs/content-gap-audit.md`
  - `docs/roadmap-to-perfection.md`

## Active Open Items
### Requires Deployment/Operator Input
- ⚠️ Set Netlify production env vars:
  - `EFI_CRM_WEBHOOK_URL`
  - `EFI_ESP_WEBHOOK_URL`
  - `EFI_DOWNLOAD_SIGNING_SECRET`
  - `EFI_PURCHASE_SIGNING_SECRET`
  - `EFI_SUBMISSIONS_CRON_SECRET`
  - `EFI_VIDEO_PROVIDER`
  - `EFI_VIDEO_ALLOWED_HOSTS`
- ⚠️ Confirm production webhooks receive and persist external fanout payloads.
- ⚠️ Publish final jurisdiction/principal-office legal metadata if desired.

## Recently Completed
- ✅ Full icon normalization completed on legacy utility navigation controls.
- ✅ Production video CDN/storage provider policy finalized and enforced in manifest + release checks.
- ✅ CMS-backed coach directory operations, moderation queue, and audit history.
- ✅ Video metadata manifest and caption/transcript release-gate checks.
- ✅ Community hub recap archive and API-backed anonymous question intake.
- ✅ Certification transparency updates (SLA ranges + sample passing outline visibility).
- ✅ Launch-blocker gate (`scripts/check_launch_blockers.py`) wired into release checks.
- ✅ Conversion and trust copy polish across curriculum/store/enroll/legal surfaces.

## Acceptance Gate
- Run: `python3 scripts/release_gate.py`
- Expected: all checks pass (links, accessibility, PDFs, source hub, video pipeline, copy style, tests, sitemap/canonical, security headers, launch blockers).

## Notes
- For release-ready historical change detail by wave, see `docs/production-readiness-todos.md`.
