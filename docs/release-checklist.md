# Release Checklist

Canonical outstanding roadmap: `docs/progress.md`

## 1) Pre-deploy build + gate

- [ ] Rebuild CSS bundle: `python3 scripts/build_css.py`
- [ ] Rebuild main JS bundle: `python3 scripts/build_main_bundle.py`
- [ ] Rebuild page-group JS bundles: `python3 scripts/build_page_group_bundles.py`
- [ ] Rebuild responsive raster variants: `python3 scripts/build_responsive_images.py`
- [ ] Minify page-specific JS files: `python3 scripts/minify_page_scripts.py`
- [ ] Verify no executable inline scripts:
  `grep -rn '<script>' *.html | grep -v 'src=' | grep -v 'ld+json'`
  Expected: no output
- [ ] Run consolidated gate: `python3 scripts/release_gate.py`
- [ ] Confirm launch-blocker checks pass: `python3 scripts/check_launch_blockers.py`
- [ ] Update `CHANGELOG.md` with release notes

## 2) Netlify environment verification

- [ ] In Netlify UI, confirm production env values exist for:
  - `EFI_CRM_WEBHOOK_URL`
  - `EFI_ESP_WEBHOOK_URL`
  - `EFI_DOWNLOAD_SIGNING_SECRET`
  - `EFI_PURCHASE_SIGNING_SECRET`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `EFI_SUBMISSIONS_CRON_SECRET`
  - `EFI_ADMIN_API_KEY`
  - `GEMINI_API_KEY`
  - `EFI_VIDEO_PROVIDER`
  - `EFI_VIDEO_ALLOWED_HOSTS`
- [ ] In Netlify UI, confirm the deploy picked up the latest env change set.
- [ ] After deploy, open function logs and keep them available during the live checks below.

## 3) Production webhook fanout verification

- [ ] Submit a real lead capture from the live site:
  - store lead form
  - off-season/waitlist form
  - coaching/contact form if applicable
- [ ] In Zapier, confirm each submission creates a run.
- [ ] For each run, confirm payload fields are correct:
  - name
  - email
  - source page
  - selected offer, if present
  - timestamp / flow id, if present
- [ ] If a Zap fails, inspect the originating Netlify function logs and note the failing endpoint.
- [ ] Confirm no duplicate runs were created for a single submit action.

## 4) Live Stripe purchase verification

- [ ] Create or use a real learner account on the deployed site.
- [ ] Start checkout from the live [store.html](/Users/jacobrozansky/exef/store.html).
- [ ] Complete one real purchase for the lowest-risk live offer.
- [ ] Confirm:
  - Stripe Checkout opens successfully
  - payment succeeds
  - the return page resolves without error
  - the dashboard/account reflects the purchase
  - the user receives the correct entitlement or next-step state
- [ ] In Stripe Dashboard, verify:
  - `checkout.session.completed`
  - webhook delivery succeeded
  - `payment_intent` exists
- [ ] In Supabase, verify a new `efi_user_purchases` row exists with:
  - purchaser identity
  - `offer_code`
  - `payment_intent_id`
  - expected review / fulfillment fields
- [ ] In Netlify logs, verify `create-checkout-session`, `stripe-webhook`, and `verify` show a clean path.

## 5) Role-restricted access validation

- [ ] Prepare three deployed accounts:
  - learner
  - reviewer
  - admin
- [ ] As learner, verify:
  - only own progress is visible
  - only own submissions/purchases are visible
  - admin/reviewer pages are blocked
- [ ] As reviewer, verify:
  - review queue loads
  - review notes save
  - review decisions persist
- [ ] As admin, verify:
  - privileged pages load
  - admin-only endpoints return successfully
- [ ] Record any silent failure, incorrect 403, or data-leak behavior.

## 6) ESQ-R deploy verification

- [ ] Complete the live ESQ-R flow end to end.
- [ ] Confirm results render without console errors.
- [ ] Confirm PNG/PDF/share-file export behavior works.
- [ ] Confirm mobile behavior is acceptable.
- [ ] Confirm any shared/downloaded artifact contains the expected result state.

## 7) API validation on deploy

- [ ] Verify public endpoints:
  - `/api/track-event`
  - `/api/auth?action=config`
  - `/api/public-config`
  - `/api/coach-directory`
- [ ] Verify authenticated endpoints with a real signed-in user:
  - `/api/sync-progress`
  - `/api/submissions`
  - `/api/verify`
- [ ] Verify privileged endpoint behavior with proper credentials:
  - `/api/ops-config`
- [ ] For each endpoint above, confirm:
  - expected auth behavior
  - expected success response
  - correct side effects / persistence
  - no silent 500s in Netlify logs

## 8) Content, SEO, and security verification

- [ ] Finalize and publish jurisdiction / principal-office legal metadata in:
  - `terms.html`
  - `privacy.html`
  - any footer/contact/legal surfaces that must match
- [ ] Confirm canonical tags and sitemap include any new pages or route aliases.
- [ ] Confirm `netlify.toml` security headers are present in the deployed response.
- [ ] Smoke-test dark mode and mobile navigation on the live site.
- [ ] Confirm the directory citation section and `Further Sources` source corpus are updated for any new citation additions.

## 9) Uptime workflow verification

- [ ] In GitHub Actions, inspect the next run of `.github/workflows/uptime-check.yml`.
- [ ] Confirm the workflow can open or update an `uptime-alert` issue on failure.
- [ ] Confirm the workflow can close that issue after recovery.
- [ ] If needed, test this in a branch by temporarily probing a known-bad route.
