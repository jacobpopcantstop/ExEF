# Embedded Checkout Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the off-site Stripe payment link redirect with an embedded Stripe Checkout modal on store.html, keeping buyers on-site through the full payment flow.

**Architecture:** A new Netlify function creates a Stripe Checkout Session with `ui_mode: embedded` and returns a `clientSecret`. The existing `store-checkout.js` opens a modal and mounts the Stripe form client-side using `stripe.initEmbeddedCheckout()`. After payment, Stripe redirects to a new `checkout-return.html` page which calls a second lightweight function to verify the session and display confirmation.

**Tech Stack:** Vanilla JS (no build step), Netlify Functions (Node.js, CommonJS), Stripe API v1, Stripe.js v3 (`https://js.stripe.com/v3/`)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `netlify/functions/create-checkout-session.js` | Create | Creates Stripe Checkout Session, returns clientSecret + offer metadata |
| `netlify/functions/get-checkout-session.js` | Create | Verifies session status for the return page |
| `checkout-return.html` | Create | Post-payment confirmation page |
| `js/store-checkout.js` | Modify | Replace redirect logic with modal + embedded checkout |
| `js/store-checkout.min.js` | Modify | Must be kept in sync with store-checkout.js (copy, no build tool) |
| `store.html` | Modify | Add Stripe.js script tag + modal container markup |

---

## Task 1: `create-checkout-session.js` Netlify function

**Files:**
- Create: `netlify/functions/create-checkout-session.js`

**Context:** The existing pattern is in `netlify/functions/create-checkout-link.js`. This function follows the same structure but creates a Checkout Session instead of resolving a payment link URL. Uses `_common.js` helpers (`json`, `parseBody`, `normalizeEmail`, `requiredEnv`). Node.js `https` is available natively; use `fetch` (available in Node 18+, which Netlify uses).

- [ ] **Step 1: Create the function file**

```js
// netlify/functions/create-checkout-session.js
const { json, parseBody, normalizeEmail, requiredEnv } = require('./_common');

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

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  const body = await parseBody(event);
  if (!body) return json(400, { ok: false, error: 'Invalid JSON body' });

  const offer = String(body.offer || '').trim();
  const email = normalizeEmail(body.email);
  const name = String(body.name || '').trim().slice(0, 200); // Stripe metadata values max 500 chars

  const entry = OFFER_CONFIG[offer];
  if (!entry) return json(400, { ok: false, error: 'Unsupported offer' });
  if (!email || !email.includes('@')) return json(400, { ok: false, error: 'Valid email required' });

  const secretKey = requiredEnv('STRIPE_SECRET_KEY');
  if (!secretKey) return json(503, { ok: false, error: 'Stripe not configured' });

  const priceId = requiredEnv(entry.priceEnv);
  if (!priceId) return json(503, { ok: false, error: 'Price not configured for this offer' });

  const baseUrl = (requiredEnv('URL') || 'https://theexecutivefunctioninginstitute.com').replace(/\/$/, '');
  const returnUrl = `${baseUrl}/checkout-return.html?session_id={CHECKOUT_SESSION_ID}`; // {CHECKOUT_SESSION_ID} is a Stripe literal — Stripe replaces it at redirect time

  const params = new URLSearchParams({
    'mode': 'payment',
    'ui_mode': 'embedded',
    'return_url': returnUrl,
    'customer_email': email,
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    'metadata[offer]': offer,
    'metadata[customer_name]': name,
    'metadata[offer_label]': entry.label
  });

  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await res.json();

    if (!res.ok || !data.client_secret) {
      return json(502, { ok: false, error: data.error?.message || 'Stripe session creation failed' });
    }

    return json(200, {
      ok: true,
      clientSecret: data.client_secret,
      offer_label: entry.label,
      price_display: entry.price_display,
      includes: entry.includes
    });
  } catch (err) {
    return json(502, { ok: false, error: 'Failed to reach Stripe' });
  }
};
```

- [ ] **Step 2: Verify function syntax locally**

```bash
node -e "require('./netlify/functions/create-checkout-session.js'); console.log('syntax ok')"
```
Expected: `syntax ok` with no errors.

- [ ] **Step 3: Smoke-test against Stripe test API**

Set env vars locally for this test (replace with your actual test key and price IDs):

```bash
STRIPE_SECRET_KEY=sk_test_... \
EFI_STRIPE_PRICE_CEFC_ENROLLMENT=price_... \
URL=http://localhost:8888 \
node -e "
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const { handler } = require('./netlify/functions/create-checkout-session.js');
handler({
  httpMethod: 'POST',
  body: JSON.stringify({ offer: 'cefc_enrollment', email: 'test@example.com', name: 'Test User' }),
  headers: {}
}).then(r => { const b = JSON.parse(r.body); console.log('status:', r.statusCode, 'ok:', b.ok, 'has clientSecret:', !!b.clientSecret); });
"
```
Expected: `status: 200 ok: true has clientSecret: true`

- [ ] **Step 4: Commit**

```bash
git add netlify/functions/create-checkout-session.js
git commit -m "feat: add create-checkout-session Netlify function for embedded checkout"
```

---

## Task 2: `get-checkout-session.js` Netlify function

**Files:**
- Create: `netlify/functions/get-checkout-session.js`

**Context:** Called by `checkout-return.html` after Stripe redirects back. Must not expose the secret key to the client — the client sends only the session_id, the server fetches status from Stripe. This is a GET handler.

- [ ] **Step 1: Create the function file**

```js
// netlify/functions/get-checkout-session.js
const { json, requiredEnv } = require('./_common');

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') return json(405, { ok: false, error: 'Method not allowed' });

  const sessionId = (event.queryStringParameters || {}).session_id;
  if (!sessionId) return json(400, { ok: false, error: 'session_id required' });

  const secretKey = requiredEnv('STRIPE_SECRET_KEY');
  if (!secretKey) return json(503, { ok: false, error: 'Stripe not configured' });

  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`
      }
    });

    if (res.status === 404) return json(404, { ok: false, error: 'Session not found' });

    const data = await res.json();

    if (!res.ok) {
      return json(502, { ok: false, error: data.error?.message || 'Stripe lookup failed' });
    }

    return json(200, {
      ok: true,
      status: data.status,
      customer_email: data.customer_details?.email || data.customer_email || null,
      offer_label: (data.metadata && data.metadata.offer_label) || null,
      dashboard_url: '/dashboard.html'
    });
  } catch (err) {
    return json(502, { ok: false, error: 'Failed to reach Stripe' });
  }
};
```

- [ ] **Step 2: Verify function syntax**

```bash
node -e "require('./netlify/functions/get-checkout-session.js'); console.log('syntax ok')"
```
Expected: `syntax ok`

- [ ] **Step 3: Test missing session_id returns 400**

```bash
node -e "
const { handler } = require('./netlify/functions/get-checkout-session.js');
handler({ httpMethod: 'GET', queryStringParameters: {}, headers: {} })
  .then(r => console.log('status:', r.statusCode, JSON.parse(r.body).error));
"
```
Expected: `status: 400 session_id required`

- [ ] **Step 4: Commit**

```bash
git add netlify/functions/get-checkout-session.js
git commit -m "feat: add get-checkout-session Netlify function for return page verification"
```

---

## Task 3: `checkout-return.html` confirmation page

**Files:**
- Create: `checkout-return.html`

**Context:** Stripe redirects here after payment with `?session_id=cs_xxx` in the URL. The page calls `/api/get-checkout-session` to verify status. Look at an existing simple page like `verify.html` for the nav/footer pattern to copy. The design system uses CSS custom properties (`var(--space-lg)`, `var(--color-success)`, etc.) and component classes (`.callout`, `.btn`, `.card`).

- [ ] **Step 1: Check the nav/footer pattern used in a simple existing page**

```bash
head -40 verify.html
tail -20 verify.html
```
Look for a `<nav class="site-nav"` element at the top and a `<footer` element at the bottom. That is the pattern to copy into `checkout-return.html`.

- [ ] **Step 2: Create `checkout-return.html`**

Use the nav/footer from the existing page. The body content should be:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Purchase Confirmation — EFI</title>
  <meta name="robots" content="noindex">
  <link rel="stylesheet" href="css/styles.min.css">
</head>
<body>
  <!-- Copy nav from verify.html -->

  <main class="container" style="max-width:560px;margin:var(--space-3xl) auto;padding:var(--space-xl) var(--space-lg);">
    <div id="return-loading" style="text-align:center;padding:var(--space-2xl) 0;">
      <p style="color:var(--color-text-light);">Confirming your purchase…</p>
    </div>

    <div id="return-success" style="display:none;">
      <div class="callout callout--accent">
        <p class="callout__label">Purchase confirmed</p>
        <p id="return-offer-label" style="font-weight:600;font-size:1.1rem;"></p>
        <p>EFI will follow up within 1 business day with your next steps and onboarding details.</p>
      </div>
      <div style="margin-top:var(--space-lg);display:flex;gap:var(--space-sm);flex-wrap:wrap;">
        <a id="return-dashboard-link" href="/dashboard.html" class="btn btn--primary btn--sm">Go to Dashboard</a>
        <a href="store.html" class="btn btn--secondary btn--sm">Back to Store</a>
      </div>
    </div>

    <div id="return-processing" style="display:none;">
      <div class="callout">
        <p class="callout__label">Payment processing</p>
        <p>Your payment is processing. Check your email for confirmation, or <a href="coaching-contact.html">contact us</a> if you have questions.</p>
      </div>
      <div style="margin-top:var(--space-lg);">
        <a href="store.html" class="btn btn--secondary btn--sm">Back to Store</a>
      </div>
    </div>
  </main>

  <!-- Copy footer from verify.html -->

  <script>
  (function () {
    var params = new URLSearchParams(window.location.search);
    var sessionId = params.get('session_id');

    var loading = document.getElementById('return-loading');
    var success = document.getElementById('return-success');
    var processing = document.getElementById('return-processing');

    function showState(state) {
      loading.style.display = 'none';
      success.style.display = 'none';
      processing.style.display = 'none';
      state.style.display = '';
    }

    if (!sessionId) {
      showState(processing);
      return;
    }

    fetch('/api/get-checkout-session?session_id=' + encodeURIComponent(sessionId))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.ok && data.status === 'complete') {
          var label = document.getElementById('return-offer-label');
          if (label && data.offer_label) label.textContent = data.offer_label;
          var dashLink = document.getElementById('return-dashboard-link');
          if (dashLink && data.dashboard_url) dashLink.href = data.dashboard_url;
          showState(success);
        } else {
          showState(processing);
        }
      })
      .catch(function () {
        showState(processing);
      });
  })();
  </script>
</body>
</html>
```

- [ ] **Step 3: Open `checkout-return.html` in a browser with no session_id**

```
open checkout-return.html
```
Expected: shows the "Payment processing" neutral state immediately (no session_id in URL).

- [ ] **Step 4: Commit**

```bash
git add checkout-return.html
git commit -m "feat: add checkout-return.html confirmation page"
```

---

## Task 4: Modal markup in `store.html`

**Files:**
- Modify: `store.html`

**Context:** Add two things: (1) the Stripe.js script tag before `</body>`, and (2) the modal container HTML. The modal should be appended just before the closing `</body>` tag, after existing scripts. Use existing CSS variables and the design system — `.callout`, `var(--space-*)`, `var(--border-radius)`. Do not add a `<style>` block — write inline styles using existing CSS variables.

- [ ] **Step 1: Add Stripe.js script tag**

Find the line with `<script src="js/store-checkout.min.js">` in `store.html` and add the Stripe.js script tag **before** it:

```html
  <script src="https://js.stripe.com/v3/"></script>
  <script src="js/store-checkout.min.js"></script>
```

- [ ] **Step 2: Add modal container**

Add this HTML just before the `</body>` tag (after all other scripts):

```html
<!-- Embedded Checkout Modal -->
<div id="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-modal-title"
  style="display:none;position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.55);overflow-y:auto;padding:var(--space-xl) var(--space-md);">
  <div style="background:#fff;border-radius:var(--border-radius);max-width:860px;margin:0 auto;position:relative;display:grid;grid-template-columns:1fr 1fr;min-height:400px;">
    <!-- Close button -->
    <button id="checkout-modal-close" type="button" aria-label="Close checkout"
      style="position:absolute;top:var(--space-md);right:var(--space-md);background:none;border:none;font-size:1.5rem;cursor:pointer;line-height:1;color:var(--color-text-light);z-index:1;">&#x2715;</button>

    <!-- Left panel: order summary -->
    <div id="checkout-summary-panel"
      style="padding:var(--space-xl);border-right:1px solid var(--color-border, #e5e7eb);display:flex;flex-direction:column;gap:var(--space-sm);">
      <p style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-light);margin:0;">Order summary</p>
      <p id="checkout-modal-title" style="font-weight:700;font-size:1.1rem;margin:0;"></p>
      <p id="checkout-modal-price" style="font-size:1.5rem;font-weight:800;margin:0;color:var(--module-1,#1a1a2e);"></p>
      <ul id="checkout-modal-includes" style="list-style:none;padding:0;margin:var(--space-sm) 0 0;display:flex;flex-direction:column;gap:var(--space-xs);font-size:0.9rem;color:var(--color-text-light);"></ul>
      <p style="font-size:0.8rem;color:var(--color-text-light);margin-top:auto;padding-top:var(--space-md);border-top:1px solid var(--color-border,#e5e7eb);">&#x1F512; Secured by Stripe. Resubmission included at no extra charge.</p>
    </div>

    <!-- Right panel: Stripe mounts here -->
    <div id="stripe-checkout-container" style="padding:var(--space-xl);"></div>
  </div>
</div>
```

**Note on backdrop click:** The modal overlay div intentionally has no `click` handler. Per spec, backdrop click must NOT close the modal during checkout to prevent accidental dismissal mid-payment. Do not add a backdrop click listener.

- [ ] **Step 3: Verify store.html loads without errors**

```bash
open store.html
```
Open browser console — expected: no JS errors. Modal is not visible (display:none).

- [ ] **Step 4: Commit**

```bash
git add store.html
git commit -m "feat: add checkout modal markup and Stripe.js to store.html"
```

---

## Task 5: Update `store-checkout.js` with modal + embedded checkout logic

**Files:**
- Modify: `js/store-checkout.js`
- Modify: `js/store-checkout.min.js` (copy of store-checkout.js — keep in sync manually)

**Context:** The current `startDirectCheckout()` function (lines 77–119 of `js/store-checkout.js`) calls `/api/create-checkout-link`, gets a URL, and does `window.location.href = result.checkout_url`. Replace this entire function with the modal flow. The `submitPurchaseIntent()` function is **not changed**. The `initAbandonTracking()` function is **not changed**.

Key APIs:
- `const stripe = Stripe('pk_test_...')` — initialize with the **publishable** key (safe for client-side). **Must be called once at module scope**, not inside `startDirectCheckout`. Re-instantiating on every click causes memory leaks and can trigger Stripe fraud heuristics.
- `const checkout = await stripe.initEmbeddedCheckout({ clientSecret })` — mounts the form
- `checkout.mount(containerElement)` — renders into the container DOM element (pass the element, not a selector string)
- `checkout.destroy()` — cleans up when modal closes

**On `checkoutFormTouched`:** Stripe's embedded checkout renders inside a cross-origin iframe. DOM `change` events from inside the iframe do not bubble to the parent document. Therefore `checkoutFormTouched` is set to `true` immediately when `openModal()` is called — once the modal opens, any close attempt will show the confirm dialog. This is the safe, conservative choice: a buyer who opens checkout and immediately tries to close is probably reconsidering their purchase, and a one-click confirm dialog is low friction.

The Stripe publishable test key is: `pk_test_51T1fIQAH2ps6zpq4R8fh4Uvx1oQHMynW3GEJoJwtuq048Sgv4H539HuzEJSmR76rrPruJxY0HZgcPvJCi4Wr3San00kiK6KzZ6`

- [ ] **Step 1: Replace `startDirectCheckout()` in `js/store-checkout.js`**

Replace the entire `startDirectCheckout` function (lines 77–119) with the following. Also add the `var stripe` initialization and the module-level state variables at the top of the IIFE (before `var hasStartedPurchaseIntent`):

**At the top of the IIFE, before `var hasStartedPurchaseIntent`, add:**
```js
  // Stripe initialized once at module scope — never re-instantiate per click
  var stripe = (typeof window.Stripe !== 'undefined')
    ? Stripe('pk_test_51T1fIQAH2ps6zpq4R8fh4Uvx1oQHMynW3GEJoJwtuq048Sgv4H539HuzEJSmR76rrPruJxY0HZgcPvJCi4Wr3San00kiK6KzZ6')
    : null;
  var checkoutInstance = null;
  var checkoutFormTouched = false;
```

**Replace the entire `startDirectCheckout` function (lines 77–119) with:**
```js
  function openModal(summaryData) {
    var modal = document.getElementById('checkout-modal');
    var titleEl = document.getElementById('checkout-modal-title');
    var priceEl = document.getElementById('checkout-modal-price');
    var includesList = document.getElementById('checkout-modal-includes');
    if (!modal) return;

    if (titleEl) titleEl.textContent = summaryData.offer_label || '';
    if (priceEl) priceEl.textContent = summaryData.price_display || '';
    if (includesList) {
      includesList.innerHTML = '';
      (summaryData.includes || []).forEach(function (item) {
        var li = document.createElement('li');
        li.textContent = '✓ ' + item;
        includesList.appendChild(li);
      });
    }

    // Set touched immediately — Stripe iframe is cross-origin and change events
    // don't bubble, so we treat modal-open as the commitment point.
    checkoutFormTouched = true;
    modal.style.display = '';
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    var modal = document.getElementById('checkout-modal');
    if (checkoutFormTouched) {
      if (!confirm('Leave checkout? Your payment has not been submitted.')) return;
    }
    if (checkoutInstance) {
      checkoutInstance.destroy();
      checkoutInstance = null;
    }
    var container = document.getElementById('stripe-checkout-container');
    if (container) container.innerHTML = '';
    checkoutFormTouched = false;
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  async function startDirectCheckout(form) {
    var message = document.getElementById('purchase-intent-message');
    var checkoutBtn = document.getElementById('direct-checkout-btn');
    var payload = getFormPayload(form);

    if (!payload.offer) {
      showMessage(message, 'Select an offer before launching checkout.', true);
      return;
    }
    if (!payload.email || payload.email.indexOf('@') === -1) {
      showMessage(message, 'Enter a valid email to prefill checkout.', true);
      return;
    }
    if (!stripe) {
      showMessage(message, 'Checkout unavailable — <a href="mailto:info@theexecutivefunctioninginstitute.com">contact us directly</a> to complete your purchase.', false);
      return;
    }
    if (!checkoutBtn) return;

    var original = checkoutBtn.textContent;
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Opening checkout…';
    showMessage(message, '', false);

    try {
      var response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer: payload.offer, email: payload.email, name: payload.name })
      });
      var result = await response.json();
      if (!response.ok || !result.ok || !result.clientSecret) {
        throw new Error((result && result.error) || 'Could not open checkout.');
      }

      if (window.EFI && EFI.Analytics && EFI.Analytics.track) {
        EFI.Analytics.track('store_embedded_checkout_opened', {
          offer: payload.offer,
          destination: 'stripe_embedded'
        });
      }

      openModal(result);

      checkoutInstance = await stripe.initEmbeddedCheckout({ clientSecret: result.clientSecret });
      var container = document.getElementById('stripe-checkout-container');
      checkoutInstance.mount(container);

    } catch (err) {
      showMessage(message, err.message || 'Could not open checkout.', true);
    } finally {
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = original;
    }
  }
```

- [ ] **Step 2: Wire up modal close handlers in `document.addEventListener('DOMContentLoaded', ...)`**

Inside the existing `DOMContentLoaded` callback (after the existing `if (checkoutBtn)` block), add:

```js
    var modal = document.getElementById('checkout-modal');
    var closeBtn = document.getElementById('checkout-modal-close');

    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
        closeModal();
      }
    });
```

- [ ] **Step 3: Copy `store-checkout.js` to `store-checkout.min.js`**

There is no build tool — the `.min.js` file is a manual copy:

```bash
cp js/store-checkout.js js/store-checkout.min.js
```

- [ ] **Step 4: Verify no syntax errors**

```bash
node --check js/store-checkout.js
```
Expected: no output (silent = success).

- [ ] **Step 5: Commit**

```bash
git add js/store-checkout.js js/store-checkout.min.js
git commit -m "feat: replace redirect checkout with embedded Stripe modal in store-checkout.js"
```

---

## Task 6: End-to-end test + push

**Context:** With `netlify dev` running locally, test the full flow: open store, fill form, click checkout, complete test payment, verify return page.

- [ ] **Step 1: Start local Netlify dev server**

```bash
netlify dev
```
Expected: server running at `http://localhost:8888`

- [ ] **Step 2: Open store and trigger modal**

Navigate to `http://localhost:8888/store.html`. Fill in:
- Name: `Test User`
- Email: `test@example.com`
- Offer: `CEFC Enrollment Access ($695)`

Click "Go To Secure Checkout".

Expected:
- Modal opens
- Left panel shows "CEFC Enrollment Access", "$695", and the three includes bullets
- Right panel shows the Stripe embedded payment form

- [ ] **Step 3: Complete a test payment**

In the Stripe form, enter:
- Card: `4242 4242 4242 4242`
- Expiry: any future date (e.g. `12/29`)
- CVC: any 3 digits (e.g. `123`)
- Name: any

Click Pay.

Expected: browser navigates to `http://localhost:8888/checkout-return.html?session_id=cs_test_...`

- [ ] **Step 4: Verify return page success state**

Expected on `checkout-return.html`:
- Shows "Purchase confirmed"
- Shows "CEFC Enrollment Access"
- Shows "EFI will follow up within 1 business day"
- "Go to Dashboard" link present

- [ ] **Step 5: Verify modal close behavior**

Open the modal. Immediately press ESC (without entering any payment details).
Expected: `confirm()` dialog appears — "Leave checkout? Your payment has not been submitted." Click Cancel — modal stays open. Press ESC again, click OK — modal closes cleanly, page scroll is restored.

Note: the confirm dialog appears on every close attempt once the modal has opened. This is intentional — `checkoutFormTouched` is set to `true` when the modal opens because Stripe's cross-origin iframe prevents reliable change event detection from the parent document.

- [ ] **Step 6: Verify purchase intent form still works**

Fill form, click "Start Purchase Request" (not "Go To Secure Checkout").
Expected: success message appears inline, no modal opens.

- [ ] **Step 7: Verify `checkout-return.html` with no session_id**

Navigate to `http://localhost:8888/checkout-return.html` (no query string).
Expected: shows "Payment processing" neutral state.

- [ ] **Step 8: Push to GitHub**

```bash
git push
```

---

## Env Vars Checklist

All of these must be set in Netlify before the live site works. They were set via CLI during planning — verify in the Netlify dashboard:

| Var | Value source |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys (test: `sk_test_...`) |
| `EFI_STRIPE_PRICE_CEFC_ENROLLMENT` | `price_1TCl5PAH2ps6zpq4fa2A093q` |
| `EFI_STRIPE_PRICE_CAPSTONE_REVIEW` | `price_1TCl5QAH2ps6zpq4VVLkwVJR` |
| `EFI_STRIPE_PRICE_CEFC_BUNDLE` | `price_1TCl5QAH2ps6zpq4HsE4AsUS` |
| `EFI_STRIPE_PRICE_ESQR_ANALYSIS` | `price_1TCl5RAH2ps6zpq4LsjzHObP` |

Stripe publishable key (safe for client): `pk_test_51T1fIQAH2ps6zpq4R8fh4Uvx1oQHMynW3GEJoJwtuq048Sgv4H539HuzEJSmR76rrPruJxY0HZgcPvJCi4Wr3San00kiK6KzZ6`
