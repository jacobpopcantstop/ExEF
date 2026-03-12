# Weekly KPI Operating Rhythm

This runbook operationalizes the business audit recommendations into a weekly cadence.

## Weekly dashboard metrics
- Sessions (all traffic) and sessions by landing page.
- `store_direct_checkout_started` count.
- `store_purchase_intent_submitted` count.
- `consultation_booking_click` count.
- Lead captures by `lead_type` (`purchase_intent`, `coaching_consultation`, `esqr_results`).
- Close rate: paid purchases / purchase-intent submissions.

## Required events to monitor
- `page_view`
- `store_direct_checkout_started`
- `store_purchase_intent_submitted`
- `store_purchase_intent_abandoned`
- `consultation_booking_click`

## Monday review checklist (30 minutes)
1. Pull prior 7-day totals for required events.
2. Compare to previous 7-day window.
3. Identify single largest drop-off stage:
   - store page view → checkout start
   - checkout start → paid
   - consultation click → booked consults
4. Define one experiment for the next week.
5. Record owner + ship date.

## Experiment template
- Hypothesis:
- Segment:
- Primary KPI:
- Secondary guardrail:
- Launch date:
- End date:
- Decision rule:

## Data quality checks
- Confirm `/api/track-event` success responses in production logs.
- Confirm `lead_type` and `metadata.offer` are present for store submissions.
- Confirm Stripe webhook events are recording successful payments.
