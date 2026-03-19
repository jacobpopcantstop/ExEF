# EFI Sales Conversion Audit

**Date:** 2026-03-19
**Scope:** store.html, certification.html, index.html (hero/CTA surfaces)
**Goal:** Identify friction, weak trust signals, and missed conversion opportunities across the purchase funnel.

---

## Funnel Map

```
Homepage hero → Curriculum overview → Module pages → Certification page → Store → Purchase intent form
                                                              ↑
                                             Rubric / Crosswalk (proof artifacts)
```

The store is the terminal conversion surface. Certification.html functions as a warm-up page that builds credibility before the price reveal.

---

## 1. Homepage / Entry

### Strengths
- Three-lane routing (parents, educators, practicing coaches) prevents irrelevant bounces.
- "Try the ESQ-R" CTA provides a free value entry point — the assessment result is a warm lead trigger.
- Hero communicates "open-source, science-based" which differentiates immediately.

### Gaps
- **No urgency or scarcity signal.** The hero communicates what the program is, but no reason to act now. Seasonal enrollment windows (mentioned internally) are not surfaced to the visitor.
- **Social proof is absent above the fold.** No testimonials, completions, or cohort-size indicator anywhere on the homepage. The first credibility signal a visitor sees is the EF framework citation list — useful for experts, opaque for parents.
- **CTA hierarchy is flat.** "View Curriculum" and "Get Certified" carry equal visual weight. The certification path (the revenue action) should be the primary CTA.

### Recommendations
- Add one social-proof anchor above the fold: e.g., "X coaches certified since launch" or a single testimonial from a coach who transitioned from classroom teacher.
- Promote the seasonal enrollment window on the hero ("Spring enrollment open through June") when applicable.
- Increase visual weight on the certification CTA vs. the curriculum browse CTA.

---

## 2. Certification Page (Pre-sell)

### Strengths
- Accreditation status is disclosed upfront and honestly (no ICF/NBEFC claimed). This is rare and builds trust with informed buyers.
- The "Credential Dossier" panel gives buyers a quick-scan summary.
- Rubric and crosswalk are publicly accessible before purchase — this removes a major objection.
- Capstone described in three components (Intake Simulation, Case Study, Resource Development) — gives the buyer a realistic picture of effort.

### Gaps
- **Visual placeholder still in page** (line ~129-136): `<figure class="visual-slot visual-slot--dossier">` with placeholder text "Image Slot 3 — Credential proof image." This is visible to visitors and breaks trust in an otherwise polished page.
- **Ethics pledge mentioned in meta description but absent from page.** Buyers searching for "ethics pledge" after reading the meta will find nothing.
- **Capstone components 2 and 3 lack detail.** Component 1 (Intake Simulation) has a clear rubric breakdown. Components 2 and 3 are described but not rubric-mapped. A buyer deciding on the $350 capstone review needs to know what all three components are graded on.
- **No example of a passing submission.** The rubric sample shows criteria but no example excerpt. A 2–3 sentence sample of a passing intake narrative would dramatically reduce anxiety around the capstone.
- **"Plan for obsolescence" / fade plan language is in module content but not surfaced in the certification narrative.** Buyers want to know the program produces coaches with a clear methodology — articulating this on the certification page converts better than a list of module names.

### Recommendations
- Remove or fill the visual placeholder immediately (use `certificate-blue.png` or `certificate-white-gold.png` which are already in `/images/`).
- Add an ethics pledge section (even 3–4 bullet points) — it is promised in the meta description.
- Expand Component 2 and Component 3 capstone descriptions with grading criteria matching Component 1's level of detail.
- Add one passing-submission excerpt (anonymized) to the rubric section.
- Add a "What a certified EFI coach can do" outcomes section — 4–5 behavioral competencies — between the module list and the capstone section.

---

## 3. Store Page (Conversion)

### Strengths
- Pricing logic (free vs. paid layer) is explained before prices are shown — a sound sequencing move that reduces sticker shock.
- Route check section ("Too early? Here's where to start") prevents premature drop-off.
- Sub-$1,000 bundle positioning ($895) is smart given the target market.
- FAQ section addresses the top objections (timeline, credential recognition, resubmission).
- Proof artifacts (rubric, crosswalk, verification) are surfaced immediately before the purchase form.

### Gaps

#### Pricing architecture
- **No anchor pricing.** $695 is presented as the starting price with no reference point that makes it feel like value. A brief "comparable certifications in EF coaching run $1,200–$2,400" line reframes the price without making unverifiable claims.
- **The $199 ESQ-R Professional Analysis offer is undersold.** It is the lowest-friction entry point for uncertain buyers, but it is listed last and described in the same density as the $895 bundle. It should be positioned as the "try before you commit" entry.
- **No monthly payment option mentioned.** If installments are available (even informally), stating this removes a major blocker for educators and parents who are budget-constrained.

#### Social proof
- **Mini-cases are 2–3 sentences.** The current examples (unnamed demographics, generic outcomes) do not create identification. A buyer reads "a high school teacher who became an EF coach" and thinks "that could be me" — but only if the outcome is specific and credible. Target 80–120 words per case, with a clear before/after.
- **No completion count or cohort reference.** Even "Fewer than 50 certifications issued annually — each reviewed by a human evaluator" signals scarcity and quality simultaneously.

#### Purchase intent form
- **"Offer" dropdown is the only required decision point.** After the buyer selects an offer, the form goes quiet — no price confirmation, no "what happens next" microcopy. Add a 2-line summary under the dropdown that restates price and next steps.
- **Consent checkbox language is legal-neutral.** It reads as a compliance checkbox, not a trust signal. Rewrite as: "I understand this is a human-reviewed program. EFI will contact me within 1 business day to confirm my enrollment and payment details."
- **No urgency signal at the form.** A note like "Capstone review slots are limited — next available window: [date]" would increase conversion at the final step without false scarcity.

#### Operations section
- **Seasonal promo calendar dates are vague** ("late July – September"). A visitor arriving in March sees a calendar with no current window, no indication of when the next one opens, and no way to join a waitlist. Add a "Notify me when enrollment opens" email capture for off-season visitors.
- **"Feedback arrives within one business day" is not in the FAQ.** It appears in the backend logic but is not a stated buyer commitment. SLA promises in the FAQ ("You'll receive rubric engine results within 48 hours, held 24h, then released") would remove a major post-purchase anxiety point.

#### Trust signals
- **No money-back or revision guarantee language in the store.** The certification page implies resubmission is included ("no additional fee"), but this is not restated at the point of purchase. A buyer on the store page who has not read the certification page does not know this.
- **Verification link is buried in the artifact cards.** A prominent "Your credential can be verified publicly at verify.html" line near the purchase form answers a buyer objection they probably haven't articulated yet.

---

## 4. Rubric/Crosswalk Documents (Proof Artifacts)

### Strengths
- Publishing the full rubric before purchase is a strong trust differentiator.
- The HTML format is professional and print-ready.
- The competency crosswalk demonstrating ICF/NBEFC alignment is sophisticated.

### Gaps
- **Rubric is labeled "Sample" in some UI copy but appears to be the operational rubric.** Resolve this: either clearly label it as the full operational rubric or explain what distinguishes the sample from the evaluator sheet.
- **No version history or "last reviewed" date on the rubric page.** Serious buyers want to know the rubric is maintained, not abandoned. Add a "Last reviewed: [date]" line.

---

## 5. Priority Action List

| Priority | Action | Surface | Impact |
|----------|--------|---------|--------|
| P0 | Remove visual placeholder (`visual-slot--dossier`) from certification.html — replace with `certificate-blue.png` | certification.html | Trust |
| P0 | Restate resubmission included + verification URL near purchase form | store.html | Conversion |
| P0 | Clarify rubric "Sample" vs. operational status; add "Last reviewed" date | rubric HTML | Trust |
| P1 | Add ethics pledge section (4–5 bullets) to certification.html | certification.html | Trust |
| P1 | Expand Component 2 + 3 capstone criteria to match Component 1 detail | certification.html | Objection removal |
| P1 | Reposition ESQ-R Analysis ($199) as "Start here" entry offer | store.html | Low-friction entry |
| P1 | Add anchor pricing context ("comparable certifications run $X–$Y") | store.html | Price framing |
| P1 | Expand mini-cases to 80–120 words with specific before/after outcomes | store.html | Social proof |
| P2 | Add "Notify me when enrollment opens" capture for off-season visitors | store.html | Lead capture |
| P2 | Add one passing-submission excerpt (anonymized) to rubric section | certification.html | Anxiety reduction |
| P2 | Add installment/payment plan language if available | store.html | Friction removal |
| P2 | Add homepage social proof anchor (completion count or single testimonial) | index.html | Trust |
| P2 | Add urgency signal to purchase form (next capstone review window) | store.html | Conversion |

---

## 6. Conversion Funnel Assessment

| Stage | Current State | Conversion Risk |
|-------|--------------|-----------------|
| Homepage → Curriculum | Strong — role routing works | Low |
| Curriculum → Certification | Weak — no "next step" CTA at module bottom pointing to certification | Medium |
| Certification → Store | Moderate — visual placeholder and missing ethics pledge create hesitation | Medium-High |
| Store → Form submission | Moderate — form lacks post-selection microcopy and urgency | Medium |
| Form → Purchase | Unknown — no data on drop-off between form submit and payment completion | High risk (untracked) |

**Biggest single conversion gap:** The store page lacks a clear trust anchor at the exact point of commitment (the purchase form). Buyers who scroll to the form without having read certification.html arrive cold — the proof artifacts are above the fold of the form, not adjacent to it.

---

*Archive this file alongside `docs/outdated/business-audit-2026-03-12.md` for historical comparison.*
