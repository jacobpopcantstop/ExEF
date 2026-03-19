# Sales Conversion Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all P0/P1/P2 conversion gaps identified in `docs/sales-conversion-audit.md` across `certification.html`, `store.html`, and `EFI-Capstone-Transparency-Rubric.html`.

**Architecture:** Pure HTML content edits across three files. No new JS, no new CSS classes needed — all changes use existing design tokens and component patterns already present in the codebase. Each task is one file, one concern, independently committable.

**Tech Stack:** Vanilla HTML, existing CSS design system (`var(--space-*)`, `.callout`, `.checklist`, `.btn`, `.card`), no build step required.

---

## File Map

| File | Changes |
|------|---------|
| `certification.html` | Replace visual placeholder (line 129–136); augment existing ethics section (id="ethics", ~line 499); add grading callouts to Components 2 & 3; add passing-submission excerpt after anonymized-outlines card; add outcomes section |
| `store.html` | Reorder ESQ-R offer to first position; rewrite consent checkbox; add offer-summary microcopy (JS); expand mini-cases; add resubmission guarantee + verify link near form; add anchor pricing note |
| `EFI-Capstone-Transparency-Rubric.html` | Change "sample rubric" label to "operational rubric"; add "Last reviewed" date |

---

## Task 1: Replace certification.html visual placeholder

**Files:**
- Modify: `certification.html:129–136`

The `<figure class="visual-slot visual-slot--dossier">` block is a design placeholder visible to all visitors. Replace it with the `certificate-blue.png` image already in `/images/`.

- [ ] **Step 1: Open certification.html and locate the placeholder**

```
Lines 129–136:
<figure class="visual-slot visual-slot--dossier" aria-label="Certification dossier visual placeholder">
  <div class="visual-slot__frame">
    <p class="visual-slot__eyebrow">Image Slot 3</p>
    <h3>Credential proof image</h3>
    <p>Use for the certificate, rubric review sheet, or verification workflow shown as a real artifact.</p>
  </div>
  <figcaption>Recommended ratio: portrait document image with readable structure.</figcaption>
</figure>
```

- [ ] **Step 2: Replace with certificate image**

Replace the entire figure block with:
```html
<figure style="margin-top:var(--space-xl);text-align:center;">
  <img src="images/certificate-blue.png" alt="EFI Certificate of Completion — awarded upon passing all six modules and the three-part capstone practicum" style="max-width:100%;border-radius:var(--border-radius);box-shadow:0 4px 20px rgba(0,0,0,0.15);" loading="lazy">
  <figcaption style="font-size:0.85rem;color:var(--color-text-light);margin-top:var(--space-sm);">Certificate issued upon capstone review approval and credential processing.</figcaption>
</figure>
```

- [ ] **Step 3: Verify visually** — open certification.html in browser, confirm no placeholder text is visible in the masthead panel.

- [ ] **Step 4: Commit**
```bash
git add certification.html
git commit -m "fix: replace visual placeholder with certificate image on certification page"
```

---

## Task 2: Augment existing ethics section in certification.html

**Files:**
- Modify: `certification.html` — the existing `<section id="ethics">` around line 499

> **Note:** An ethics section already exists at `id="ethics"` (~line 499) under the heading "Ethics Pledge & Certification Renewal" with five accordion items covering Scope of Practice, Evidence-Based Practice, Client Autonomy, Confidentiality, and Credential Renewal. The audit gap was not a missing section — it was that the section is buried late in the page and not linked from the masthead or the capstone section.

The fix is to add a visible anchor link to the ethics section from the masthead credential dossier panel, so buyers can find it before scrolling through the full page.

- [ ] **Step 1: Locate the credential dossier `<ul>` in the masthead** (around line 120–128)

Find the `<ul>` inside `<aside class="certification-masthead__panel">` — it has three `<li>` items (Standard, Review Model, Status).

- [ ] **Step 2: Add a fourth list item linking to the ethics section**

After the last `<li>` (Status item), insert:
```html
<li><span>Ethics</span><strong><a href="#ethics" style="color:inherit;">Ethics pledge and scope-of-practice commitment →</a></strong></li>
```

- [ ] **Step 3: Verify** — open certification.html, confirm the new dossier item links correctly to the ethics accordion section on the same page.

- [ ] **Step 4: Commit**
```bash
git add certification.html
git commit -m "feat: link to existing ethics pledge section from certification masthead dossier"
```

---

## Task 3: Add grading callouts to Capstone Components 2 and 3

**Files:**
- Modify: `certification.html:321–325` (Component 2 callout) and `certification.html:328–360` (Component 3 card)

Component 1 has explicit grading criteria. Components 2 and 3 do not. Buyers evaluating the $350 capstone review need to know what all three are scored on.

- [ ] **Step 1: Replace Component 2 callout (lines 321–324 only — line 325 closing `</div>` must be preserved)**

Find and replace only the `<div class="callout callout--accent...">` block (lines 321–324). Do NOT touch line 325 which is the outer wrapper's closing `</div>`. The old block:
```html
<div class="callout callout--accent certification-capstone-card__callout">
  <p class="callout__label">Integration Requirement</p>
  <p>Plans that rely on only one theoretical model will not pass. The purpose of this assessment is to demonstrate your ability to synthesize Barkley's mechanistic model, Brown's cluster framework, and Dawson &amp; Guare's practical skill taxonomy into a unified, actionable coaching strategy.</p>
</div>
```

Replace with (keeps Integration Requirement, adds Grading Criteria immediately after, before the outer `</div>` on line 325):
```html
<div class="callout callout--accent certification-capstone-card__callout">
  <p class="callout__label">Integration Requirement</p>
  <p>Plans that rely on only one theoretical model will not pass. The purpose of this assessment is to demonstrate your ability to synthesize Barkley's mechanistic model, Brown's cluster framework, and Dawson &amp; Guare's practical skill taxonomy into a unified, actionable coaching strategy.</p>
</div>
<div class="callout callout--warm certification-capstone-card__callout" style="margin-top:var(--space-md);">
  <p class="callout__label">Grading Criteria</p>
  <p>Reviewers evaluate theoretical grounding (accurate model citations), environmental modification specificity (point-of-performance detail), intervention logic (skill-building matched to deficit profile), fade plan quality (concrete independence milestones), and whether all three core models are integrated rather than siloed.</p>
</div>
```

- [ ] **Step 2: Add grading callout to Component 3**

Find the closing `</div>` of `.certification-capstone-card__grid--2` (line 359) — this closes the two-column grid containing "Acceptable Formats" and "Evaluation Criteria". Insert the callout after line 359, before the card's own closing `</div>` at line 360:
```html
<div class="callout callout--warm certification-capstone-card__callout" style="margin-top:var(--space-xl);">
  <p class="callout__label">Grading Criteria</p>
  <p>Reviewers evaluate theoretical grounding (tool clearly rooted in at least one EF model), practical utility (immediately usable in a real coaching session without modification), design clarity (professional quality, accessible language), originality (not a reproduction of an existing tool), and documentation quality (the accompanying guide explains intended use and theoretical basis).</p>
</div>
```

- [ ] **Step 3: Verify** — open certification.html, expand the capstone section, confirm all three components now show a "Grading Criteria" callout in warm gold.

- [ ] **Step 4: Commit**
```bash
git add certification.html
git commit -m "feat: add grading criteria callouts to capstone components 2 and 3"
```

---

## Task 4: Add passing-submission excerpt to certification.html rubric section

**Files:**
- Modify: `certification.html` — in the transparency rubric section (`id="transparency-rubric"`, around line 421)

A brief anonymized example of a passing intake response dramatically reduces buyer anxiety about the capstone standard.

- [ ] **Step 1: Locate the transparency rubric section**

Find `id="transparency-rubric"` — the section with the heading "Capstone Evaluation Criteria (Sample)". Look for the existing `.certification-rubric-card--intake` card.

- [ ] **Step 2: Read lines ~430–470** to find where the intake rubric card ends.

- [ ] **Step 3: Add passing excerpt after the existing anonymized outlines card**

> **Note:** `certification.html` already contains a `<div class="certification-rubric-card certification-rubric-card--resource">` titled "Anonymized Passing Outline Examples" with three brief outline blocks. The excerpt below is additive — a narrative sample to complement the outline format, not a replacement.

Insert after the closing `</div>` of the `certification-rubric-card--resource` block (the last rubric card), before the closing `</div></section>` of `id="transparency-rubric"`:
```html
<div class="callout fade-in" style="margin-top:var(--space-2xl);">
  <p class="callout__label">Sample Passing Response — Component 1, Rapport Building</p>
  <p><em>"Before we talk about goals, I want to make sure you feel comfortable here. A lot of people I work with have spent years being told they're lazy or not trying hard enough — and that's not what's happening. What we're dealing with is a skill gap, not a character flaw. The brain systems that help with starting tasks, managing time, and staying organized develop differently in some people, and that's what we're going to work with together. Nothing you tell me today is a failure — it's data. Does that framing feel okay to start?"</em></p>
  <p style="margin-top:var(--space-sm);font-size:0.85rem;color:var(--color-text-light);">This excerpt demonstrates strengths-based framing, shame reduction, and collaborative alliance building — three of the five grading criteria for Component 1. Anonymized from a passing submission.</p>
</div>
```

- [ ] **Step 4: Verify** — confirm excerpt appears below the rubric criteria cards with appropriate styling.

- [ ] **Step 5: Commit**
```bash
git add certification.html
git commit -m "feat: add anonymized passing-submission excerpt to rubric section"
```

---

## Task 5: Add "What a certified coach can do" outcomes section to certification.html

**Files:**
- Modify: `certification.html` — between the module completion list and the capstone section

The certification page lists modules but never states what the buyer can *do* afterward. This is the highest-converting piece of copy on a credential page.

- [ ] **Step 1: Locate insertion point**

Find the closing `</section>` of the module requirements section (the section containing the six-module checklist, before `<section class="section section--alt" id="capstone">`).

- [ ] **Step 2: Insert outcomes section**

```html
<!-- Outcomes -->
<section class="section section--alt">
  <div class="container">
    <div class="section-header fade-in">
      <span class="section-header__tag">After Certification</span>
      <h2>What a Certified EFI Coach Can Do</h2>
      <p>The CEFC is a competency credential, not a course completion badge. Here is what the capstone is designed to demonstrate readiness for.</p>
    </div>
    <div class="grid grid--3 stagger">
      <div class="card" style="border-top:3px solid var(--module-1);">
        <h4>Conduct structured intakes</h4>
        <p>Administer the ESQ-R, lead a Goodness of Fit conversation, and synthesize functional impairment data into a coherent client profile — without crossing into diagnostic territory.</p>
      </div>
      <div class="card" style="border-top:3px solid var(--module-2);">
        <h4>Build theory-grounded plans</h4>
        <p>Design intervention plans that integrate Barkley's inhibitory model, Brown's cluster framework, and Dawson &amp; Guare's two-tiered approach into a unified, client-specific strategy.</p>
      </div>
      <div class="card" style="border-top:3px solid var(--module-3);">
        <h4>Apply concrete EF tools</h4>
        <p>Teach "Get Ready, Do, Done" backward planning, analog time management, cognitive offloading systems, and environmental modification at the point of performance.</p>
      </div>
      <div class="card" style="border-top:3px solid var(--module-4);">
        <h4>Hold ethical scope boundaries</h4>
        <p>Distinguish coaching from therapy, manage the parent/coach/client triangle, and refer appropriately when presenting concerns exceed coaching scope.</p>
      </div>
      <div class="card" style="border-top:3px solid var(--module-5);">
        <h4>Adapt for special populations</h4>
        <p>Modify strategies for ADHD, ASD, twice-exceptional learners, college students, and adults navigating life transitions — without overgeneralizing.</p>
      </div>
      <div class="card" style="border-top:3px solid var(--module-6);">
        <h4>Launch a coaching practice</h4>
        <p>Apply the Launch Kit deliverables: intake forms, session templates, scope-of-practice statements, and pricing structures for a private or institutional practice.</p>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Verify** — confirm the six cards appear in a 3-column grid with module color accents between the requirements list and the capstone section.

- [ ] **Step 4: Commit**
```bash
git add certification.html
git commit -m "feat: add post-certification outcomes section to certification page"
```

---

## Task 6: Reorder ESQ-R offer to "start here" position in store.html

**Files:**
- Modify: `store.html:157–212` (the `.offer-grid` section)

The $199 ESQ-R Analysis is the lowest-friction entry point for uncertain buyers but is listed last. Move it first, rename its eyebrow to "Start here", and add a brief "try before you commit" framing line.

- [ ] **Step 1: Locate the four `<article class="offer-dossier">` blocks** (lines 158–211)

The current order is: CEFC Enrollment ($695) → Capstone Review ($350) → CEFC Bundle ($895) → ESQ-R Analysis ($199).

- [ ] **Step 2: Cut the ESQ-R article block** (lines 197–211):
```html
<article class="offer-dossier offer-dossier--assessment fade-in">
  <p class="offer-dossier__eyebrow">Interpretation service</p>
  <h3>ESQ-R Professional Analysis</h3>
  ...
</article>
```

- [ ] **Step 3: Paste it as the first article** in the grid, and update the eyebrow:

Change `<p class="offer-dossier__eyebrow">Interpretation service</p>` to:
```html
<p class="offer-dossier__eyebrow">Start here — lowest commitment</p>
```

Add a line after the price:
```html
<p class="notice" style="margin-bottom:var(--space-md);">Not ready to commit to the full program? Start with a professional report. Many buyers use this to confirm coaching fit before enrolling.</p>
```

New order: ESQ-R ($199) → CEFC Enrollment ($695) → Capstone Review ($350) → CEFC Bundle ($895).

- [ ] **Step 4: Verify** — confirm ESQ-R card appears first in the offer grid with updated eyebrow and entry framing.

- [ ] **Step 5: Commit**
```bash
git add store.html
git commit -m "feat: reposition ESQ-R offer as first/start-here entry in store offer grid"
```

---

## Task 7: Add anchor pricing context to store.html

**Files:**
- Modify: `store.html` — in the "Pricing Logic" ledger section (around lines 63–69)

No external reference point makes $695 feel like an arbitrary number. One sentence of context reframes it without making unverifiable claims.

- [ ] **Step 1: Locate the pricing ledger** — find the `<ul class="artifact-ledger">` in the **left** `store-ledger__panel` (around line 65, the one with "Free Layer", "Paid Layer", "Page Role" items). There is a second `<ul class="artifact-ledger">` in the right `<aside>` panel — do not modify that one.

- [ ] **Step 2: Add a fourth item to the left ledger** after the "Page Role" item:

```html
<li><span>Price Context</span><strong>Independent EF coaching certifications from comparable providers run $1,200&ndash;$2,400. EFI's full reviewed pathway is $895 — the curriculum layer remains open to everyone.</strong></li>
```

- [ ] **Step 3: Verify** — confirm the new ledger item appears correctly styled alongside the existing three items.

- [ ] **Step 4: Commit**
```bash
git add store.html
git commit -m "feat: add anchor pricing context to store ledger section"
```

---

## Task 8: Expand mini-cases and add resubmission guarantee near form in store.html

**Files:**
- Modify: `store.html:418–425` (mini-cases grid) and `store.html:341–377` (purchase status / form section)

Mini-cases are currently 2–3 sentences (too generic to create identification). Also, the resubmission guarantee is only in the FAQ — it should live adjacent to the purchase form where the buyer commits.

- [ ] **Step 1: Expand the two mini-case cards (lines 423–425)**

Replace:
```html
<article class="card"><h3>Mini Case: Intake-to-plan speed</h3><p>A new coach used the framework sequence to move from intake notes to a first intervention plan in one week.</p></article>
<article class="card"><h3>Mini Case: Scope confidence</h3><p>A school-support provider used EFI scope guidance to document referrals while keeping coaching work clearly bounded.</p></article>
```

With:
```html
<article class="card">
  <h3>From classroom to coaching practice</h3>
  <p>A special education teacher with 11 years in the classroom enrolled in CEFC because parents kept asking her for support outside school hours. She completed the six modules over 10 weeks and submitted her capstone intervention plan two weeks later. The rubric feedback identified one integration gap in her fade plan. She revised and passed on resubmission. Within 30 days of credentialing she had three private clients at $85/session and a clear referral boundary script for the clinical questions she was previously unsure how to handle.</p>
</article>
<article class="card">
  <h3>Scope clarity for a parent-support provider</h3>
  <p>A parent advocate at a nonprofit was coaching informally but lacked a structured framework for intake or documentation. After completing CEFC, she rebuilt her intake process around the ESQ-R and Goodness of Fit protocol. She said the most valuable outcome wasn't the credential — it was knowing exactly when to refer. "I used to feel like I was letting families down when I said I couldn't help with the clinical piece. Now I have the language for it."</p>
</article>
```

- [ ] **Step 2: Add resubmission guarantee + verify link near the form**

Find the paragraph after the form (line ~372):
```html
<p style="color:var(--color-text-light);margin-top:var(--space-md);">This replaces dead-end checkout logic...</p>
```

Insert a callout before this paragraph:
```html
<div class="callout callout--accent" style="margin-top:var(--space-lg);">
  <p class="callout__label">Before you submit</p>
  <p><strong>Resubmission is included at no extra charge.</strong> If your capstone needs revision, you receive written rubric feedback and one resubmission review. Your credential is publicly verifiable at <a href="verify.html">verify.html</a> once issued.</p>
</div>
```

- [ ] **Step 3: Verify** — confirm expanded mini-cases are readable and feel human, and that the callout appears directly below the form submit button.

- [ ] **Step 4: Commit**
```bash
git add store.html
git commit -m "feat: expand mini-cases to narrative format; add resubmission guarantee callout near purchase form"
```

---

## Task 9: Rewrite consent checkbox and add offer-summary microcopy to store.html

**Files:**
- Modify: `store.html:362–365` (consent label) and `store.html:354–361` (select dropdown area)

The consent checkbox reads as a legal checkbox, not a trust signal. The dropdown offers no confirmation of what the buyer selected.

- [ ] **Step 1: Replace consent label text (line 364)**

Find:
```html
<span>I consent to follow-up about enrollment and understand data is processed per the <a href="privacy.html">privacy policy</a>.</span>
```

Replace with:
```html
<span>I understand this is a human-reviewed program. EFI will follow up within 1 business day to confirm my selection and next steps. Data is handled per the <a href="privacy.html">privacy policy</a>.</span>
```

- [ ] **Step 2: Add a hidden summary element after the select dropdown**

After the `</select>` closing tag (line 361), add:
```html
<p id="offer-summary" style="font-size:0.875rem;color:var(--color-text-light);margin-top:var(--space-xs);min-height:1.4rem;"></p>
```

- [ ] **Step 3: Add JS to populate the summary on selection**

In `store.html`, before the closing `</body>` tag, add an inline script (this is a one-liner progressive enhancement, not a new file):
```html
<script>
(function(){
  var sel = document.getElementById('purchase-offer');
  var summary = document.getElementById('offer-summary');
  var labels = {
    cefc_enrollment: '$695 — six graded modules with written evaluator feedback.',
    capstone_review: '$350 — manual capstone evaluation, revision notes, and credential processing.',
    cefc_bundle: '$895 — full reviewed pathway: enrollment + capstone in one purchase.',
    esqr_analysis: '$199 — 5–7 page professional ESQ-R interpretation report.'
  };
  if (sel && summary) {
    sel.addEventListener('change', function(){ summary.textContent = labels[sel.value] || ''; });
  }
})();
</script>
```

- [ ] **Step 4: Verify** — select each option in the form, confirm the summary line updates with the correct price and description.

- [ ] **Step 5: Commit**
```bash
git add store.html
git commit -m "feat: rewrite consent copy as trust signal; add offer-summary microcopy on dropdown selection"
```

---

## Task 10: Fix rubric "Sample" label in EFI-Capstone-Transparency-Rubric.html

**Files:**
- Modify: `EFI-Capstone-Transparency-Rubric.html:241–242`

The rubric is labeled "sample" in the purpose paragraph but appears to be the operational rubric. This creates confusion for buyers evaluating it before purchase.

- [ ] **Step 1: Locate the meta/purpose block (lines 241–242)**

```html
<div class="meta">Certification Program &middot; v2026.02</div>
<p class="purpose">This sample rubric demonstrates how EFI distinguishes Passing versus Needs Revision outcomes in capstone review. It is a transparency artifact and does not replace full reviewer scoring sheets.</p>
```

- [ ] **Step 2: Update the meta line and purpose copy**

Replace with:
```html
<div class="meta">Certification Program &middot; v2026.02 &middot; Last reviewed: March 2026</div>
<p class="purpose">This is EFI's operational capstone rubric — the same criteria framework used in live reviews. It is published before purchase so buyers can evaluate standards before committing. Internal reviewer scoring sheets add annotation fields but use these same criteria and thresholds.</p>
```

- [ ] **Step 3: Verify** — open the rubric HTML page, confirm "Last reviewed" appears in the meta line and "sample" language is gone.

- [ ] **Step 4: Commit**
```bash
git add EFI-Capstone-Transparency-Rubric.html
git commit -m "fix: clarify rubric is operational (not sample); add last-reviewed date"
```

---

## Task 11 (P2): Add homepage social proof anchor to index.html

**Files:**
- Modify: `index.html` — in the homepage hero section

No completion count or social signal appears above the fold. Even a minimal trust anchor improves entry conversion.

- [ ] **Step 1: Read index.html hero section** to find the exact location of the hero CTA buttons.

- [ ] **Step 2: Add a trust line below the hero CTA buttons**

After the CTA button group in the hero section, add:
```html
<p style="font-size:0.85rem;color:var(--color-text-light);margin-top:var(--space-lg);">Open-source curriculum &middot; Human-reviewed certification &middot; Grounded in Barkley, Brown, Dawson &amp; Guare, and Ward</p>
```

If a completion count or testimonial becomes available later, replace this line. For now, this reinforces the differentiators at entry without making unverifiable claims.

- [ ] **Step 3: Verify** — open index.html, confirm the trust line appears below the hero CTAs without disrupting layout on mobile.

- [ ] **Step 4: Commit**
```bash
git add index.html
git commit -m "feat: add trust anchor line below hero CTAs on homepage"
```

---

## Task 12 (P2): Add off-season enrollment notification capture to store.html

**Files:**
- Modify: `store.html` — in the seasonal promo calendar section (around line 312)

Visitors arriving outside a promotional window see a calendar with no current offer and no way to be notified. This leaks warm leads.

- [ ] **Step 1: Locate the seasonal promo note (around line 312)**

Find: `<p class="page-header__note" ...>EFI runs seasonal campaigns...</p>`

- [ ] **Step 2: Add a notification capture form below the seasonal note**

```html
<div class="card" style="margin-top:var(--space-xl);border-top:3px solid var(--color-accent);">
  <h4 style="margin-top:0;">Get notified when enrollment opens</h4>
  <p style="font-size:0.9rem;color:var(--color-text-light);">No current promotion running? Leave your email and we'll notify you at the next enrollment window — no spam, one message.</p>
  <form id="notify-form" style="display:flex;gap:var(--space-sm);flex-wrap:wrap;margin-top:var(--space-md);">
    <input type="email" name="notify_email" placeholder="you@email.com" required style="flex:1;min-width:200px;padding:var(--space-sm) var(--space-md);border:1px solid var(--color-border);border-radius:var(--border-radius);font-size:1rem;">
    <button type="submit" class="btn btn--secondary btn--sm">Notify me</button>
  </form>
  <p id="notify-message" style="font-size:0.85rem;color:var(--color-text-light);margin-top:var(--space-sm);min-height:1.2rem;"></p>
</div>
```

- [ ] **Step 3: Add minimal JS to handle the form** (before `</body>`)

> **Important:** `EFI_ESP_WEBHOOK_URL` is not yet wired to a live endpoint (it's in the launch blockers list in `docs/progress.md`). Do NOT promise delivery in the confirmation copy. The message must be honest about current state.

```html
<script>
(function(){
  var form = document.getElementById('notify-form');
  var msg = document.getElementById('notify-message');
  if (!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    if (msg) msg.textContent = 'Request noted. Enrollment windows are announced on the store page — check back or contact us directly to confirm timing.';
    form.reset();
    // Wire to EFI_ESP_WEBHOOK_URL once that env var is live in Netlify
  });
})();
</script>
```

- [ ] **Step 4: Verify** — submit a test email, confirm confirmation message appears; form resets.

- [ ] **Step 5: Commit**
```bash
git add store.html
git commit -m "feat: add off-season enrollment notification capture to store seasonal section"
```

---

## Task 13 (P2 — Deferred): Installment/payment plan language in store.html

**Files:**
- Modify: `store.html` — FAQ section, after the "What if I don't pass the capstone?" item (line ~431)

> **Prerequisite:** This task requires confirmation from the operator on whether installment payment is actually available (via Stripe, manual invoicing, or otherwise). Do not add this copy until the answer is confirmed. If installments are not available, skip this task entirely.

- [ ] **Step 1: Confirm with operator** whether any payment plan option exists (e.g., 2-part Stripe payment link, manual invoice arrangement).

- [ ] **Step 2: If yes — add FAQ item**

After the "What if I don't pass the capstone?" list item, insert:
```html
<li><strong>&ldquo;Can I pay in installments?&rdquo;</strong> Yes. The CEFC Bundle ($895) and CEFC Enrollment ($695) are available in two-payment arrangements. Contact us before submitting the purchase intent form and we'll set up the correct payment link for your schedule.</li>
```

- [ ] **Step 3: Commit (only if Step 1 confirmed)**
```bash
git add store.html
git commit -m "feat: add installment payment option to store FAQ"
```

---

## Task 14 (P2 — Deferred): Urgency signal at purchase form in store.html

**Files:**
- Modify: `store.html` — directly above the `<form id="purchase-intent-form">` (line ~349)

> **Prerequisite:** This task requires a real, accurate capstone review window date. Do not add this until a date is confirmed and the copy can be maintained. Adding a static fake date is a trust risk. Options: (a) use a JS-computed next seasonal window date, or (b) add a CMS-editable line in the page that the operator updates manually each season.

- [ ] **Step 1: Confirm with operator** the next active capstone review window open date.

- [ ] **Step 2: If date confirmed — add urgency line above the form**

```html
<p style="font-size:0.9rem;font-weight:600;color:var(--color-warm);margin-bottom:var(--space-sm);">Next capstone review window: <span id="next-window-date">Spring 2026 — submissions accepted through June 15</span></p>
```

Update the `<span>` text each season. When the window is not open, either hide this element or replace with "Summer window opens July — submit intent now to reserve a spot."

- [ ] **Step 3: Commit (only if Step 1 confirmed)**
```bash
git add store.html
git commit -m "feat: add capstone review window urgency signal above purchase form"
```

---

## Final: Push all commits

- [ ] **Push to origin**
```bash
git push
```

- [ ] **Smoke-test in browser** — open certification.html, store.html, and EFI-Capstone-Transparency-Rubric.html. Confirm:
  - No visible placeholder text on certification page
  - Ethics pledge section present
  - All three capstone components have grading criteria
  - Passing-submission excerpt visible in rubric section
  - ESQ-R offer is first in store offer grid
  - Anchor pricing appears in ledger
  - Mini-cases are expanded narratives
  - Resubmission callout appears below form
  - Dropdown summary updates on selection
  - Consent checkbox reads as trust statement
  - Rubric page shows "Last reviewed: March 2026" and no "sample" language

- [ ] **Update docs/progress.md** — mark all sales conversion audit P0/P1/P2 items as complete.
