# Progress Tracker (Canonical)

Last updated: March 13, 2026

This is the single source of truth for **active needed changes**. Roadmaps/audits/todo wave logs are archived snapshots unless explicitly marked active here.

## 1) Launch blockers (do first)

### Platform/operator
Requires Deployment/Operator Input

- [ ] Set production Netlify env vars:
  - `EFI_CRM_WEBHOOK_URL`
  - `EFI_ESP_WEBHOOK_URL`
  - `EFI_DOWNLOAD_SIGNING_SECRET`
  - `EFI_PURCHASE_SIGNING_SECRET`
  - `EFI_SUBMISSIONS_CRON_SECRET`
  - `EFI_VIDEO_PROVIDER`
  - `EFI_VIDEO_ALLOWED_HOSTS`
- [ ] Verify production webhook fanout delivery + persistence.
- [ ] Apply Supabase `efi_user_purchases` migration for certificate review state columns (`reviewer_decision`, `reviewer_notes`, `reviewed_at`, `reviewed_by`).
- [ ] Finalize/publish jurisdiction + principal-office legal metadata (if required for go-live policy).

### Release gate
- [ ] Run `python3 scripts/release_gate.py` and resolve all blockers.

## Recently Completed
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
- [x] Reflection prompt prefills from plan focus/history (backlog item #3).
- [x] Adaptive practice intensity based on adherence state (item #4).
- [x] Misconception-family difficulty ladder for quiz remediation (item #5).

### P1
- [x] Branching scenario simulations for Modules 2-4 (item #7).
- [x] Cohort analytics views (operator/curriculum/coaching slices) (item #8).
- [x] Authenticated event sync + dedupe hardening for KPI reliability (item #9).

### P2
- [x] Intervention flags for chronically low adherence (item #10).

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
