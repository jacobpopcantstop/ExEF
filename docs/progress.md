# Progress Tracker (Canonical)

Last updated: March 19, 2026

This is the single source of truth for **active needed changes**. Roadmaps/audits/todo wave logs are archived snapshots unless explicitly marked active here.

## 1) Launch blockers (do first)

### Platform/operator
Requires Deployment/Operator Input

- [x] Set production Netlify env vars:
  - `EFI_CRM_WEBHOOK_URL`
  - `EFI_ESP_WEBHOOK_URL`
  - `EFI_DOWNLOAD_SIGNING_SECRET`
  - `EFI_PURCHASE_SIGNING_SECRET`
  - `EFI_SUBMISSIONS_CRON_SECRET`
  - `EFI_VIDEO_PROVIDER`
  - `EFI_VIDEO_ALLOWED_HOSTS`
- [x] Set `EFI_ADMIN_API_KEY` in Netlify production and dev contexts.
- [x] Mirror the current Zapier webhook endpoints into Netlify dev context for `EFI_CRM_WEBHOOK_URL` and `EFI_ESP_WEBHOOK_URL`.
- [ ] Verify production webhook fanout delivery + persistence.
- [x] Apply Supabase `efi_user_purchases` migration for certificate review state columns (`reviewer_decision`, `reviewer_notes`, `reviewed_at`, `reviewed_by`).
- [ ] Finalize/publish jurisdiction + principal-office legal metadata (if required for go-live policy).

### Release gate
- [x] Run `python3 scripts/release_gate.py` and resolve all blockers.

## External critique follow-up (Gemini review, March 17, 2026)

Critique was directionally useful, but not every point is current. In particular, authenticated progress sync already exists; the remaining work is to audit which learner states are still local-only and harden those paths.

- [ ] Refactor `js/main.js` into focused modules. Start by separating analytics/event delivery, shared UI behaviors, and dashboard learning-loop logic so future changes stop accumulating in one file.
- [ ] Break `css/styles.css` into maintainable partials or layered files by concern (`base`, `layout`, `components`, `page/feature`) without changing the existing visual system.
- [ ] Audit progress durability end to end. Confirm which states already sync for signed-in users and move any remaining high-value local-only state (`efi_action_plans_v1`, mastery/recheck queues, related dashboard data) onto the authenticated sync path or clearly label them as device-local.
- [ ] Replace unsafe string-built UI rendering on user-adjacent surfaces with DOM construction (`createElement`, `textContent`). Prioritize `js/main.js`, then expand the audit to other files that still rely on `innerHTML`.
- [ ] Run a mobile touch-target pass and enforce a 44x44 px minimum on inline utility links, pagination, and compact controls that currently require precision taps.
- [ ] Add stylesheet preload on the main entry pages and verify it improves the critical rendering path without causing duplicate fetches or priority regressions.

## Recently Completed
- ✅ Release gate now passes end to end (`python3 scripts/release_gate.py`) after fixing checkout-return asset/link drift, credential-doc landmarks/canonicals, and store-page quote corruption.
- ✅ Managed-auth enforcement added to learner progress and submission endpoints so `/api/sync-progress` and learner-facing `/api/submissions` access are bound to the authenticated Supabase user when managed auth is enabled.
- ✅ Stripe purchase fulfillment now persists from checkout completion: webhook fulfillment issues durable purchase records/receipts, return-page sync hydrates the logged-in account, and purchases are idempotent by `payment_intent_id`.
- ✅ Supabase payment-tracking migration pushed (`supabase/migrations/20260319202500_add_purchase_payment_tracking.sql`) for `payment_intent_id` / `offer_code` purchase persistence.
- ✅ Store checkout no longer ships with a hardcoded Stripe test publishable key; public checkout config now comes from `netlify/functions/public-config.js`.
- ✅ Netlify env audit completed via CLI; core Supabase, Stripe, Gemini, signing, video, and submissions vars verified in the linked EFI site.
- ✅ `EFI_ADMIN_API_KEY` added to Netlify production and dev contexts.
- ✅ Dev webhook parity configured by pointing `EFI_CRM_WEBHOOK_URL` and `EFI_ESP_WEBHOOK_URL` at the same Zapier endpoints currently used in production.
- ✅ Supabase project `teyxrugwihczcglhkgkw` linked locally and purchase-review migration pushed (`supabase/migrations/20260319200909_add_purchase_review_columns.sql`).
- ✅ 19 real photos added to all 6 modules — each contextually matched to section content (BarkleyTrajectory, limbicGap, airtraffic2, wallofawful in M1; goodnessoffit, discrepancyasdata, referralredflags in M2; 2tiered, coachsupport, coachingvstherapy in M3; getreadydodone, timeblindness, analogvdigital, timecorrection, airtraffic2 in M4; specialpopulations in M5; curriculumpipeline, certificates in M6).
- ✅ Image placement corrected by filename semantics — leakybucket moved to M4 cognitive offloading section; limbicGap repositioned to M1 adolescent gap section.
- ✅ Rubric links in certification.html and store.html updated from PDF to HTML page.
- ✅ Accordion flicker bug fixed — coachingvstherapy image moved outside accordion in module-3 (max-height/scrollHeight race condition on open).
- ✅ Sales conversion audit created — see `docs/sales-conversion-audit.md`.
- ✅ All P0/P1/P2 sales conversion audit items resolved (March 19, 2026):
  - P0: Visual placeholder replaced with certificate image; resubmission guarantee added near purchase form; rubric clarified as operational with last-reviewed date.
  - P1: Ethics section linked from masthead dossier; grading criteria added to capstone Components 2 & 3; ESQ-R repositioned as first/start-here offer; anchor pricing context added; mini-cases expanded to narrative format.
  - P2: Passing-submission excerpt added to rubric section; post-certification outcomes section added; homepage trust anchor added; off-season enrollment notification capture added.
  - Deferred (operator confirmation required): installment payment language (Task 13), urgency signal with capstone window date (Task 14).
- ✅ Certificate review state now persists on purchase records and appears directly in the certificate review queue.
- ✅ Reviewer-only submission override/release actions and certificate decision logging added with required notes and admin controls.
- ✅ Server-side audit logging added for purchase issuance/denials, verification checks, submission events, and feedback release notifications, with admin audit-trail visibility.
- ✅ Trust and member-operations copy aligned to real verification, purchase-state, and release-window behavior across certification, store, dashboard, login, and verify surfaces.
- ✅ Full icon normalization completed on legacy utility navigation controls.
- ✅ Production video CDN/storage provider policy finalized and enforced in manifest + release checks.
- ✅ CMS-backed coach directory operations, moderation queue, and audit history.
- ✅ Video metadata manifest and caption/transcript release-gate checks.
- ✅ Community hub recap archive and API-backed anonymous question intake.
- ✅ Certification transparency updates (SLA ranges + sample passing outline visibility).
- ✅ Launch-blocker gate (`scripts/check_launch_blockers.py`) wired into release checks.
- ✅ Conversion and trust copy polish across curriculum/store/enroll/legal surfaces.

---

## 2) Product learning loop priorities (next build window)

### P0 (highest ROI)
- [x] Reflection prompt prefills from plan focus/history (backlog item #3). — `js/module-quiz.js` (buildReflectionPrefill + renderReflectionPrompt), `js/assessment-tools.js` (prefillReflection IIFE).
- [x] Adaptive practice intensity based on adherence state (item #4). — `js/module-quiz.js` (readAdherenceData, recordAdherenceSession, selectAdaptiveQuestions; key: efi_adherence_v1).
- [x] Misconception-family difficulty ladder for quiz remediation (item #5). — `js/module-quiz.js` (MISCONCEPTION_LADDER, renderRemediationLadderQuestion, remediationLadderState per-session state).

### P1
- [x] Branching scenario simulations for Modules 2-4 (item #7). — `js/module-scenarios.js` (new engine), scenario HTML sections in `module-2.html`, `module-3.html`, `module-4.html`.
- [x] Cohort analytics views (operator/curriculum/coaching slices) (item #8). — `js/admin-analytics.js` (new file), cohort analytics section added to `admin.html`.
- [x] Authenticated event sync + dedupe hardening for KPI reliability (item #9). — `js/main.js` (generateEventId, markEventSent, getAuthUserId; event_id + user_id on all events; key: efi_sent_event_ids_v1).

### P2
- [x] Intervention flags for chronically low adherence (item #10). — `js/module-enhancements.js` (initInterventionFlag IIFE; banner after 3+ consecutive incomplete sessions; 72 h cooldown).

---

## 3) Content/compliance cleanup still open

- [x] Final pass on outcome/effectiveness marketing claims not yet rechecked against evidence.
- [x] Legal/privacy/credential-verification copy pass against current backend behavior and policies.
- [x] Long-form model pages: verify explanatory language stays interpretation-safe (no over-absolute claims).

---

## 4) Already completed recently (do not re-open)

- [x] One-click recheck CTA in reminder rows.
- [x] Near-mastery guidance state.
- [x] Cross-tool effort/time estimate badges.
- [x] Action-plan schema established for cross-tool plan + recheck loop.
- [x] Coaching niche-positioning consistency pass across home/contact/services.
- [x] Major fact-check hardening pass across assessment language and operational claims.

---

## 5) Archive map

Historical detail is preserved in:
- `docs/production-readiness-todos.md`
- `docs/next-10-todos.md`
- `docs/roadmap-to-perfection.md`
- `docs/content-gap-audit.md`
- `docs/next-wave-v2-backlog.md`
- `docs/assessment-interactive-audit.md`
- `docs/business-audit-2026-03-12.md`
- `docs/fact-check-audit.md`
