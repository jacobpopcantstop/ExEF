# Business Audit — The Executive Functioning Institute (2026-03-12)

## Scope & Method
This audit reviewed EFI's public funnel, offer architecture, conversion pathways, and instrumentation readiness across core pages (`index`, `store`, `certification`, `coaching-contact`) plus the current quality-gate scripts.

Primary checks run:
- `python3 scripts/check_links.py`
- `python3 scripts/check_accessibility.py`
- `python3 scripts/check_ux_audit.py`

## Executive Summary
EFI has strong **offer clarity** and **trust-through-transparency** for an education-first business model: free curriculum, explicit paid boundaries, and a named credential pathway. The main business bottleneck is the final conversion layer: checkout and scheduling are still partially manual, which creates drop-off risk for high-intent visitors.

### Overall business posture
- **Positioning:** Strong and differentiated (science-grounded, open resources, human-reviewed credentialing).
- **Monetization logic:** Coherent (charges tied to reviewer labor and credential operations).
- **Conversion operations:** Functional but friction-heavy (consultation + email scheduling substitutes self-serve checkout).
- **Measurement maturity:** Good event plumbing exists, but KPI framing and growth loops are not yet explicit.

## What is working (strengths)

1. **Clear value ladder from free to paid**  
   The site clearly distinguishes free educational assets from paid reviewer-intensive services, reducing confusion and increasing trust.

2. **Pricing transparency is better than most peers**  
   Public list pricing and package logic are plainly visible in the Store experience, including bundle economics.

3. **Authority assets are visible before purchase**  
   Curriculum depth, named frameworks, and transparency language create a strong pre-sale credibility layer.

4. **Role-based entry paths improve relevance**  
   Parent, educator, and professional routing reduces "where do I start" friction on first visit.

5. **Technical baseline quality is healthy**  
   Current scripted checks show links and accessibility passing, with a high UX structural baseline score.

## Revenue and growth constraints (highest-impact issues)

### 1) Conversion friction at bottom-of-funnel (Critical)
- Store explicitly states direct self-serve checkout is not yet live and routes users to consultation.
- Consultation booking currently relies on a mailto availability request instead of instant scheduling.
- Result: high-intent users face extra steps at the exact moment purchase intent is highest.

**Business impact:** Lost conversions, slower cash collection cycle, heavier founder/operator time burden.

### 2) Funnel leakage due to mixed primary CTAs (High)
- Across key pages, users are offered multiple destinations (curriculum, tools, consultation, certification, store) with limited priority logic per visitor stage.
- This is strong for exploration but weaker for decisive conversion journeys.

**Business impact:** More browsing, less progression; lower visitor-to-lead and lead-to-paid rates.

### 3) Social proof is present but not systematically productized (High)
- The site has authority framing, but conversion pages would benefit from tighter, repeated proof blocks (outcomes, testimonials, mini case snapshots, objections handled in-line).

**Business impact:** Lower confidence at pricing and consultation decision points.

### 4) Offer packaging could better segment by buyer intent (Medium)
- Certification and coaching are both visible, but packaging could more aggressively define "who should buy what first" with explicit qualification guidance and urgency logic.

**Business impact:** Reduced average order velocity; potential confusion for visitors who fit multiple lanes.

### 5) Analytics instrumentation exists, but KPI operating rhythm is unclear (Medium)
- Event tracking infrastructure exists, but business dashboards/targets are not clearly documented as a weekly operating system.

**Business impact:** Harder to prioritize experiments and diagnose where revenue is leaking.


## Implementation update (2026-03-12 remediation pass)
- Added an on-page **purchase intent form** on `store.html` tied to `/api/leads` so high-intent buyers can convert without leaving the pricing page.
- Added `js/store-checkout.js` to operationalize the new purchase intent submission flow and analytics event (`store_purchase_intent_submitted`).
- Updated store conversion copy to prioritize a single primary action (submit purchase intent) while preserving consultation as a secondary path.
- Replaced consultation `mailto` booking on `coaching-contact.html` with an instant calendar booking link and analytics event instrumentation (`consultation_booking_click`).
- Added explicit offer-lane qualifiers and a concise proof/outcomes block on `store.html` to reduce CTA ambiguity and improve purchase confidence.

## Prioritized action plan

## 0-30 days (quick wins)
1. **Enable true self-serve scheduling** for consultations (calendar booking flow).
2. **Launch direct checkout for at least one paid offer** (start with CEFC Bundle or Enrollment Access).
3. **Reduce CTA entropy on 3 key pages** (`index`, `store`, `coaching-contact`) by assigning one primary conversion action per page section.
4. **Add conversion proof modules** near pricing/consultation blocks:
   - 3-5 testimonials
   - 2 mini case snapshots
   - explicit FAQ for common objections (time, fit, legitimacy, outcome timeline)

## 31-60 days (funnel optimization)
1. **Implement stage-specific lead magnets**:
   - Parent lane: practical home implementation checklist
   - Educator lane: classroom EF intervention starter packet
   - Professional lane: credential readiness self-assessment
2. **Create a lifecycle follow-up sequence** for form fills and abandoned checkout intents.
3. **Add clear lane qualifiers** ("Start here if...") on store/certification/coaching pages.

## 61-90 days (growth system)
1. **Stand up weekly KPI dashboard** with targets:
   - Visits → lead form completion rate
   - Lead → consultation booked
   - Consultation → paid conversion
   - AOV and offer mix
2. **Run 2-3 conversion experiments per month** (CTA copy, proof placement, pricing page layout).
3. **Publish one recurring authority asset per month** (case deconstruction, framework application note, practitioner guide).

## KPI framework (recommended)
Track these as core business health metrics:
- **Top-of-funnel:** organic sessions, returning visitors, top entry pages.
- **Mid-funnel:** CTA click-through rate by page + audience lane.
- **Bottom-funnel:** consult booking rate, checkout completion rate, consultation close rate.
- **Revenue:** monthly gross revenue, revenue by offer, refund rate, time-to-cash.
- **Operating leverage:** manual hours per closed client/candidate.

## Risk register
- **Operational bottleneck risk:** manual consultation and purchase routing can cap growth.
- **Brand-trust risk:** if conversion steps feel improvised after strong authority framing, credibility can erode.
- **Data-blindness risk:** without explicit KPI cadence, high-effort activities may continue despite low revenue contribution.

## Audit scorecard (business view)
- Positioning clarity: **9/10**
- Offer clarity: **8.5/10**
- Conversion readiness: **6/10**
- Funnel measurability: **6.5/10**
- Overall commercial readiness: **7.2/10**


## Audit resolution status (implementation-driven)
- ✅ Direct checkout path implemented in code via `/api/create-checkout-link` + Store CTA (`Go To Secure Checkout`) pending production payment-link env wiring.
- ✅ Consultation booking moved to instant calendar booking flow.
- ✅ Store qualifier + proof modules + objection FAQ added to conversion context.
- ✅ Abandon signal instrumentation added for unfinished purchase-intent forms (`store_purchase_intent_abandoned`).
- ✅ Weekly KPI operating cadence documented in `docs/weekly-kpi-operating-rhythm.md`.

## Appendix — command outputs used
- `python3 scripts/check_links.py` → `Local links OK`
- `python3 scripts/check_accessibility.py` → `Accessibility checks OK across 57 HTML files.`
- `python3 scripts/check_ux_audit.py` → `UX audit baseline score: 93.9% (155/165 structural checks passed)` with warnings focused on coaching pages.
