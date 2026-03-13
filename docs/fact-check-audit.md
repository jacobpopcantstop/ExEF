# Fact-Check Audit (Archived)

Last updated: March 13, 2026

The multi-pass fact-check log was condensed to avoid duplicated trackers.

## Active unresolved fact-check/compliance work
Track only in `docs/progress.md` under:
- Content/compliance cleanup still open.

## Historical detail
The original pass-by-pass remediation log is preserved in git history.

## Most recent archived pass
Audit date: March 13, 2026

Scope:
- verification page accuracy
- certificate issuance gating
- purchase-state wording on member/store surfaces

Fixes recorded in that pass:
- `verify.html`: reframed verification as receipt-token-based validation rather than a public credential registry lookup by ID alone, with credential ID treated as an optional cross-check.
- `certificate.html`: removed the misleading provisional-issue presentation branch and required both certificate purchase and released eligibility before showing the certificate document.
- `store.html`, `login.html`, `dashboard.html`, and `certification.html`: aligned purchase-state copy to account-based purchase records, released grading state, and signed receipt verification, and clarified that dashboard refresh checks released results rather than triggering a new grading run.
