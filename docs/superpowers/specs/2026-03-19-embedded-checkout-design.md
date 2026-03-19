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
- `js/store-checkout.js` — `startDirectCheckout()` replaced: instead of redirecting, opens modal and mounts embedded Stripe form using `stripe.initEmbeddedCheckout({ clientSecret })`
- `store.html` — modal container markup added; Stripe.js script tag added

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

- Accepts `POST { offer, email }`
- Validates offer key against `OFFER_CONFIG` (same map as `create-checkout-link.js`)
- Creates Stripe Checkout Session:
  - `mode: payment`
  - `ui_mode: embedded`
  - `return_url: https://theexecutivefunctioninginstitute.com/checkout-return.html?session_id={CHECKOUT_SESSION_ID}`
  - `customer_email: email`
  - `line_items` from offer price ID
- Returns `{ ok: true, clientSecret, offer_label, price_display, includes[] }`
- Requires env var: `STRIPE_SECRET_KEY`

### `get-checkout-session.js`

- Accepts `GET ?session_id=cs_xxx`
- Retrieves session from Stripe, returns `{ status, customer_email, offer_label }`
- Only exposes: `status`, `customer_email`, `metadata.offer_label`
- Returns 400 if session_id missing, 404 if not found

### Modal (store.html + store-checkout.js)

- Container: `<div id="checkout-modal">` with overlay backdrop
- Left panel: offer label, price, includes list (populated from API response)
- Right panel: `<div id="stripe-checkout-container">` where Stripe mounts
- Close button (×) and ESC key handler
- On open: `document.body.style.overflow = 'hidden'`
- On close: `checkoutInstance.destroy()`, restore scroll
- Modal does not close on backdrop click (prevents accidental dismissal mid-payment)

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
