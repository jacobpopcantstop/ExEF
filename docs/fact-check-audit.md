# Fact-Check Audit

Audit date: March 11, 2026

Scope of this pass:
- Standards and accreditation claims
- Assessment-tool availability claims
- Current-status/date language

## Highest-priority findings

1. `certification.html` and `accreditation.html`: standards status language is partly internal and not fully externally verifiable.
- Current site copy says things like `ICF CCE status: Planning phase (application not yet submitted)` and `NBEFC Alignment: In progress`.
- The safe, source-backed claim is that EFI is not currently accredited/approved and that the crosswalk is internal.
- Recommended rewrite:
  - `EFI is not currently ICF-accredited and is not currently represented as an NBEFC-approved education provider.`
  - `EFI maintains an internal competency crosswalk to current ICF core competencies and executive-function-coaching standards themes.`
- Why:
  - `Planning phase`, `in progress`, and `finalize external review packet` are internal roadmap statements, not externally checkable facts.

2. `certification.html`: `ICF CCE status` is too specific unless EFI actually intends that exact accreditation type.
- ICF currently distinguishes Continuing Coach Education accreditation as a specific accreditation category for coach educators.
- If EFI has not applied, the stronger factual wording is simply `No current ICF accreditation claimed`.
- Recommended rewrite:
  - Replace `ICF CCE status: Planning phase (application not yet submitted)` with `ICF status: No current ICF accreditation or approval claimed`.

3. `about.html`: `Assessment tools (ESQ-R) available without proprietary licensing` is not adequately supported.
- The ESQ/ESQ-R is publicly accessible in Dawson/Guare materials and Smart but Scattered materials, but that does not by itself prove unrestricted non-proprietary reuse/licensing.
- Recommended rewrite:
  - `Assessment tools include publicly accessible ESQ-R materials and EFI’s own free tools`
  - or `EFI uses publicly accessible ESQ-R materials alongside its own open web tools`

4. `accreditation.html` and `certification.html`: `Current status date: February 16, 2026` is now stale if this page is being reverified today.
- If the page is reviewed and still accurate, the page should use `March 11, 2026` as the status-check date.
- If not reviewed, remove the exact date until the review is complete.

## Lower-priority wording improvements

1. Prefer `approved provider`, `recognized`, or `certification context` for NBEFC wording instead of `accreditation`.
- ICF uses explicit accreditation language.
- NBEFC more commonly uses certification, board certification, and education-provider language.

2. Prefer `current ICF Core Competencies` over `2025 Framework` unless the page specifically cites a 2025-issued official framework document.

3. In `module-2.html` and related curriculum copy, keep BRIEF-2 and Brown Scales framed as referenced/proprietary instruments, not tools EFI is implying users can freely administer without qualification.

## Primary sources used

- ICF Continuing Coach Education accreditation:
  - https://coachingfederation.org/credentials-and-standards/education-accreditation/continuing-coach-education
- ICF Core Competencies:
  - https://coachingfederation.org/credentials-and-standards/core-competencies
- NBEFC certification context:
  - https://www.nbefc.org/executive-functioning-coach-certification/
- NBEFC educational providers:
  - https://www.nbefc.org/educational-providers/

## Next pass

- Verify proprietary-assessment descriptions against official BRIEF-2 and Brown EF/A materials
- Verify ESQ-R wording against Dawson/Guare/Smart but Scattered source materials
- Verify neuroscience/development claims on `module-1.html`, `about.html`, and `curriculum.html`

## Second-pass fixes applied

Audit date: March 11, 2026

Scope of this pass:
- ESQ-R structure wording
- BRIEF-2 and Brown EF/A positioning
- neuroscience/development age-range phrasing
- open-source/public-access overstatements

### Fixes made

1. `module-2.html`, `curriculum.html`, and `resources.html`
- Replaced older ESQ-R wording that implied a 36-item / 12-skill scored structure.
- Updated copy to the safer public-manual framing:
  - 25-item self-report survey
  - summarized into five skill areas
  - useful as a non-diagnostic intake survey

2. `module-2.html`, `curriculum.html`, and `resources.html`
- Reframed BRIEF-2 and Brown EF/A references as proprietary / qualified-assessment tools.
- Removed language that could imply unrestricted coaching administration or free institute ownership.

3. `module-1.html` and `curriculum.html`
- Replaced `mid-twenties` with `early adulthood` for prefrontal development language.
- This keeps the educational point while avoiding an over-precise developmental cutoff.

4. `about.html`
- Replaced the stronger `publicly available, peer-reviewed research` phrasing with a more accurate mix:
  - public research summaries
  - cited books
  - referenced professional resources
- Replaced `all reading packets use freely available PDFs` with a softer claim about source briefs plus public materials when available.

### Additional sources used

- Dawson/Guare ESQ-R public materials:
  - https://www.smartbutscatteredkids.com/resources/esq-r-self-report-assessment-tool/
- BRIEF-2 official overview:
  - https://www.parinc.com/Products/Pkey/39
- Brown EF/A official overview:
  - https://www.pearsonassessments.com/store/usassessments/en/Store/Professional-Assessments/Behavior/Brown-Executive-Function-Attention-Scales/p/100001885.html
- Harvard Center on the Developing Child, executive function overview:
  - https://developingchild.harvard.edu/resources/inbrief-executive-function/

## Remaining open audit areas

- Barkley/Brown/Ward explanatory claims on long-form guide pages
- efficacy-style or outcome-style marketing claims not yet checked against evidence
- any legal/privacy/credential-verification language that should be rechecked against actual backend behavior

## Third-pass fixes applied

Audit date: March 11, 2026

Scope of this pass:
- long-form model pages
- interpretation-vs-fact wording
- overconfident authority/tone language

### Fixes made

1. `module-1.html` and `about.html`
- Softened `primary pedagogical framework` to `one of EFI's main pedagogical frameworks`.
- Reframed `time blind` language as Barkley-style explanatory framing rather than absolute neurological fact.
- Reframed `extended phenotype` language as a coaching-use interpretation about environmental support systems.
- Replaced the stronger `neurochemical reality` phrasing in Brown copy with more source-safe language about context, interest, reward, and task demand.

2. `ward-360-thinking.html`
- Removed the unsupported `previously fragmented across PDFs` claim.
- Replaced it with a simpler description of Ward-style visual-spatial planning concepts.

3. `barkley-vs-brown.html`
- Reframed comparison copy as `EFI's teaching use` rather than an absolute model verdict.
- Replaced `Blind Spot` with `Common Limitation In Coaching Use`.

4. `barkley-model-guide.html`
- Replaced `Definitive Guide` with `Guide` / `A Guide` to reduce unsupported final-authority language.

### Remaining open areas after this pass

- outcome/effectiveness claims around coaching benefits and business impact
- any live operational claims tied to backend behavior, credential issuance, or verification logic

## Fourth-pass fixes applied

Audit date: March 11, 2026

Scope of this pass:
- outcome/effectiveness marketing language
- earnings/planning language
- operational copy checked against live verification and submission code

### Fixes made

1. `dashboard.html`
- Replaced `faculty-style feedback release` with `rubric-engine review`.
- Replaced `Run Automated Grading` with `Refresh Grading Status` so the button matches what the client actually does: fetch released results from the submissions API.
- Reframed the capstone note so it no longer implies a distinct payment gate the current client logic does not enforce on that screen.

2. `certification.html`
- Replaced `deliver consistent, measurable coaching outcomes` with safer wording about building consistent, documented coaching practice.
- This avoids implying site-validated outcome evidence that is not currently published.

3. `teacher-to-coach.html`
- Reworked the ROI calculator intro so it models target income rather than implying salary replacement as a likely or expected result.
- Changed the `$225/hour` wording from a market-positioning claim to an internal planning example.
- Expanded the disclaimer to cover pricing recommendations as well as earnings and financial advice.

4. `barkley-model-guide.html`
- Softened `predicts why` to `helps explain why` to keep the model framing interpretive rather than over-deterministic.

### Backend checks completed in this pass

1. Credential verification
- `js/auth.js` uses `verifyPurchasedProduct(productId, credentialId)` to call `/api/verify` with the latest signed receipt.
- `netlify/functions/verify.js` validates signed purchase receipts and optional credential IDs.
- Conclusion: language about verification against signed purchase records is supportable.

2. Certificate eligibility and purchase state
- `js/auth.js` computes certificate readiness from:
  - all six modules completed
  - capstone passed
  - certificate purchased
- Conclusion: readiness / purchase-state wording is supportable when tied to those exact states.

3. Submission pipeline
- `netlify/functions/submissions.js` grades submissions with the rubric engine immediately, stores scores/feedback, and withholds feedback until the `release_at` timestamp 24 hours later.
- `js/auth.js` client methods submit evidence and later refresh released results.
- Conclusion: `asynchronous rubric-engine review with delayed release` is supportable; `faculty-style feedback release` was not.
