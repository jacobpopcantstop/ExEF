# Embedded Checkout Design Spec

**Date:** 2026-03-19
**Status:** Approved for implementation

---

## Goal

Replace the current off-site Stripe payment link redirect with an embedded Stripe Checkout modal that opens on `store.html`, keeping the buyer on-site through the payment flow.

---

## Architecture

### New files
- `netlify/functions/create-checkout-session.js` — creates a Stripe Checkout Session with `ui_mode: embedded`, returns `clientSecret` and offer summary metadata
- `checkout-return.html` — confirmation page Stripe redirects to after successful payment; reads session status from Stripe and shows offer-specific confirmation copy
- `netlify/functions/get-checkout-session.js` — lightweight function called by `checkout-return.html` to verify session status and retrieve offer/email from Stripe (avoids exposing secret key to client)

### Modified files
- `js/store-checkout.js` — `startDirectCheckout()` replaced: instead of redirecting, opens modal and mounts embedded Stripe form using `stripe.initEmbeddedCheckout({ clientSecret })`; analytics event updated from `store_direct_checkout_started / destination: 'stripe_payment_link'` to `store_embedded_checkout_opened / destination: 'stripe_embedded'`
- `store.html` — modal container markup added; Stripe.js loaded via `<script src="https://js.stripe.com/v3/">` (must use this exact URL — Stripe's terms prohibit self-hosting). Load failure detected via `window.Stripe === undefined` check inside `startDirectCheckout()` before calling the API.

---

## Data Flow

```
Buyer fills form (name, email, offer) → clicks "Go To Secure Checkout"
  → POST /api/create-checkout-session { offer, email }
  → Netlify fn creates Stripe Checkout Session (ui_mode: embedded, return_url: /checkout-return.html?session_id={CHECKOUT_SESSION_ID})
  → Returns { clientSecret, offer_label, price, includes[] }
  → JS opens modal, mounts stripe.initEmbeddedCheckout({ clientSecret }) in right panel
  → Left panel populated from response metadata (offer label, price, includes list)
  → Buyer completes payment in Stripe form
  → Stripe redirects to checkout-return.html?session_id=cs_xxx
  → checkout-return.html calls GET /api/get-checkout-session?session_id=cs_xxx
  → Shows confirmation: offer name, next steps, dashboard link
```

---

## Components

### `create-checkout-session.js`

- Accepts `POST { offer, email, name }`
- `name` is stored as Stripe session metadata (`metadata.customer_name`) — it is not used to create a Stripe Customer object
- Validates offer key against `OFFER_CONFIG`:

```js
const OFFER_CONFIG = {
  cefc_enrollment: {
    priceEnv: 'EFI_STRIPE_PRICE_CEFC_ENROLLMENT',
    label: 'CEFC Enrollment Access',
    price_display: '$695',
    includes: [
      'Six graded module assessments',
      'Written evaluator feedback',
      'Readiness tracking toward capstone eligibility'
    ]
  },
  capstone_review: {
    priceEnv: 'EFI_STRIPE_PRICE_CAPSTONE_REVIEW',
    label: 'Capstone Review & Credentialing',
    price_display: '$350',
    includes: [
      'Manual capstone evaluation against published rubric',
      'Written revision notes',
      'Credential processing on pass',
      'Resubmission included at no extra charge'
    ]
  },
  cefc_bundle: {
    priceEnv: 'EFI_STRIPE_PRICE_CEFC_BUNDLE',
    label: 'CEFC Bundle',
    price_display: '$895',
    includes: [
      'Full enrollment access',
      'Capstone review and credentialing',
      'Best value for practitioners starting from scratch'
    ]
  },
  esqr_analysis: {
    priceEnv: 'EFI_STRIPE_PRICE_ESQR_ANALYSIS',
    label: 'ESQ-R Professional Analysis',
    price_display: '$199',
    includes: [
      'Professional scoring and interpretation report',
      'Coaching application guidance',
      'Lowest-commitment entry point'
    ]
  }
};
```

- Creates Stripe Checkout Session:
  - `mode: payment`
  - `ui_mode: embedded`
  - `return_url`: built from `process.env.URL` (Netlify auto-injects site URL) with fallback to `https://theexecutivefunctioninginstitute.com`. Format: `${baseUrl}/checkout-return.html?session_id={CHECKOUT_SESSION_ID}`
  - `customer_email: email`
  - `metadata: { offer, customer_name: name, offer_label }`
  - `line_items` from resolved price ID env var
- Returns `{ ok: true, clientSecret, offer_label, price_display, includes[] }`
- Requires env vars: `STRIPE_SECRET_KEY`, plus the relevant `EFI_STRIPE_PRICE_*` var for the selected offer

### `get-checkout-session.js`

- Accepts `GET ?session_id=cs_xxx`
- Retrieves session from Stripe, returns `{ status, customer_email, offer_label, dashboard_url }`
- `dashboard_url` is hardcoded to `/dashboard.html` — not derived from the session
- Only exposes: `status`, `customer_email`, `metadata.offer_label`, and the hardcoded dashboard link
- Returns 400 if session_id missing, 404 if not found

### Modal (store.html + store-checkout.js)

- Container: `<div id="checkout-modal">` with overlay backdrop
- Left panel: offer label, price, includes list (populated from API response)
- Right panel: `<div id="stripe-checkout-container">` where Stripe mounts
- Close button (×) and ESC key handler
- On open: `document.body.style.overflow = 'hidden'`
- On close: `checkoutInstance.destroy()`, restore scroll
- Modal does not close on backdrop click (prevents accidental dismissal mid-payment)
- Once the Stripe form has received any interaction (detected via a `change` event on the container), the × button and ESC key show a simple `confirm('Leave checkout? Your payment has not been submitted.')` dialog before destroying the session

### `checkout-return.html`

- Minimal layout — EFI nav, centered confirmation card
- On load: reads `?session_id` from URL, calls `/api/get-checkout-session`
- If `status === 'complete'`: shows success state — offer name, "EFI will follow up within 1 business day", link to dashboard
- If `status !== 'complete'` or error: shows neutral message — "Your payment is processing. Check your email for confirmation or contact us if you have questions."
- No sensitive data displayed (no amounts, no card details)

---

## Stripe Configuration

Embedded Checkout requires Stripe Checkout Sessions (not Payment Links). The existing payment links are not used for this flow. Each offer needs a **Price ID** (not a Payment Link URL) set as env vars:

- `EFI_STRIPE_PRICE_CEFC_ENROLLMENT`
- `EFI_STRIPE_PRICE_CAPSTONE_REVIEW`
- `EFI_STRIPE_PRICE_CEFC_BUNDLE`
- `EFI_STRIPE_PRICE_ESQR_ANALYSIS`
- `STRIPE_SECRET_KEY` — Stripe secret key (test: `sk_test_...`, live: `sk_live_...`)

The existing `EFI_STRIPE_PAYMENT_LINK_*` vars and `create-checkout-link.js` remain untouched as fallback.

---

## Error Handling

- If `create-checkout-session` fails: show inline error below the checkout button, do not open modal
- If Stripe.js fails to load: button shows "Checkout unavailable — contact us directly" with mailto link
- If `get-checkout-session` fails on return page: show neutral processing message (never a hard error page)

---

## Testing

- Test with Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC
- Verify modal opens and closes cleanly (ESC, × button)
- Verify left panel populates correctly for all 4 offers
- Verify `checkout-return.html` shows success state after completed test payment
- Verify `checkout-return.html` shows neutral state if session_id is missing or invalid
- Verify existing purchase intent form (`submitPurchaseIntent`) still works independently

---

## Out of Scope

- Installment/subscription billing (future Stripe work)
- Authenticated purchase state sync (handled by existing `stripe-webhook.js` → `_db.js`)
- Receipt email customization (handled in Stripe dashboard)
