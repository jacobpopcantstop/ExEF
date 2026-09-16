# GA4 Key Events — configuration guide

GA4 property: `G-2WLZPV0PD6` (exef.org)

## Why the property reported zero key events

The site has had event tracking for a long time, but it went to one place
only: `EFI.Analytics.track()` posted to the `/api/track-event` Netlify
function. GA4 was loaded on every page (`js/google-analytics.js`) and
collected nothing but its own automatic `page_view`. Nothing the site
considered a conversion — a tool completion, an email capture, a booking
click, a PDF download — ever reached GA4, so the Key Events report was
necessarily empty.

`js/main-analytics.js` now mirrors every tracked event into
`gtag('event', …)` as well as the internal endpoint. The events below start
flowing on the next deploy. They are *not* key events until someone marks
them as such in the GA4 admin — GA4 has no way to guess which of them
represent business outcomes.

## Mark these as Key Events

Admin → Data display → Events → toggle **Mark as key event**.

| Event | Fires when | Why it matters |
| --- | --- | --- |
| `tool_lead_submitted` | Email capture on any tool results block | Direct lead. The highest-value event on the site. |
| `book_call_click` | Any "Book a 30-minute consultation" CTA | Booking intent; the top of the paid funnel. |
| `assessment_completed` | A visitor finishes a quiz or assessment | The core product action. `tool` param names which one. |
| `lead_magnet_download` | Gated PDF downloaded after email capture | Confirms the lead magnet delivered. |
| `resource_download` | Any ungated PDF/DOC/ZIP link clicked | See "Downloads looked like bounces" below. |
| `ot_interest_list_signup` | OT interest list signup on coaching-home | Waitlist demand signal. |

Worth watching but not key events: `specialist_selector_result`,
`roi_calculate_submit`, `gap_gate_submit_click`, `launchpad_submit_click`,
`purchase_intent_submit_click`, `store_direct_checkout_click`.

Every forwarded event carries two extra params:

- `page_slug` — the page the event happened on
- `traffic_source` — `utm_source`, then `?source=`, then referrer, else `direct`

Register both as custom dimensions (Admin → Custom definitions) or they
cannot be used to break down reports.

### Downloads looked like bounces

A visitor who landed on `/resources`, clicked a PDF and left did everything
we wanted, but produced one `page_view` and no second event — GA4 scored
that session as a bounce. `resource_download` makes those sessions engaged,
which is a real and expected part of any engagement-rate recovery.

The event is deliberately *not* named `file_download`: GA4 enhanced
measurement already sends `file_download` for these extensions, and reusing
the name would double-count.

## Enable benchmarking

Admin → Account settings → check **Modeling contributions & business
insights**. This is an account-level setting and unlocks the Jobs &
Education benchmarks. Nothing in this repository can set it.

## Reading the Aug–Sep 2026 report

Two measurement artifacts inflate the apparent problems in that analysis:

1. **Split URLs.** Before 2026-09-10, `/x` and `/x.html` both served 200,
   so sessions for one page were split across two rows — hence both
   `/free-executive-functioning-tests` (30) and
   `/free-executive-functioning-tests.html` (3). The `/*.html` → `/:splat`
   301 in `netlify.toml` landed on 2026-09-10 and consolidates them, so
   the `.html` rows will disappear on their own. Page-level fixes aimed at
   `/conative-action-profile.html` or `/resources.html` are aimed at URLs
   that no longer exist.
2. **Sample size.** `/resources.html` at "100% bounce" is 7 sessions and
   `/brain-mode-quiz` is 3. At that volume a single visitor moves the rate
   by 14–33 points. Neither supports a conclusion about broken links; a
   link check over `resources.html` passes.

Rebaseline once the events above are collecting and the 301s have a full
28-day window behind them.
