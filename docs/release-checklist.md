# Release Checklist

Canonical outstanding roadmap: `docs/progress.md`

1. Rebuild CSS bundle: `python3 scripts/build_css.py`.
2. Rebuild main JS bundle: `python3 scripts/build_main_bundle.py`.
3. Minify page-specific JS files: `python3 scripts/minify_page_scripts.py`.
4. Run consolidated gate: `python3 scripts/release_gate.py`.
5. Confirm launch-blocker checks pass: `python3 scripts/check_launch_blockers.py`.
6. Validate role-restricted pages (`admin.html`, `telemetry.html`) with reviewer/admin and learner accounts.
7. Verify checkout and post-purchase certificate route behavior.
8. Verify ESQ-R export/share (PNG/PDF/share file) behavior.
9. Confirm canonical tags and sitemap include any new pages.
10. Confirm `netlify.toml` security headers are present.
11. Smoke-test in dark mode and mobile navigation.
12. Update `CHANGELOG.md` with release notes.
13. Confirm the directory citation section and `Further Sources` source corpus are updated for any new citation additions.
14. Validate API endpoints on deploy preview:
    - `/api/leads`
    - `/api/sign-download`
    - `/api/download-file`
    - `/api/track-event`
    - `/api/auth?action=config`
    - `/api/sync-progress?email=test@example.com`
    - `/api/verify`
    - `/api/submissions`
    - `/api/coach-directory`
    - `/api/ops-config` (privileged)
    - `/api/community-question` (POST)
15. In Netlify UI, verify environment values are set for:
    - `EFI_CRM_WEBHOOK_URL`, `EFI_ESP_WEBHOOK_URL`
    - `EFI_DOWNLOAD_SIGNING_SECRET`, `EFI_PURCHASE_SIGNING_SECRET`
    - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
    - `STRIPE_WEBHOOK_SECRET`, `EFI_SUBMISSIONS_CRON_SECRET`
    - `GEMINI_API_KEY`
    - `EFI_VIDEO_PROVIDER`, `EFI_VIDEO_ALLOWED_HOSTS`
