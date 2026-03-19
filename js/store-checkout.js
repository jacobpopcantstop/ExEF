(function () {
  var stripe = null;
  var stripeInitPromise = null;
  var checkoutInstance = null;
  var checkoutFormTouched = false;
  var hasStartedPurchaseIntent = false;
  var hasSubmittedPurchaseIntent = false;

  async function getStripe() {
    if (stripe) return stripe;
    if (stripeInitPromise) return stripeInitPromise;
    stripeInitPromise = (async function () {
      if (typeof window.Stripe === 'undefined') {
        throw new Error('Stripe.js is unavailable on this page.');
      }

      var response = await fetch('/api/public-config');
      var config = await response.json().catch(function () { return {}; });
      if (!response.ok || !config.ok || !config.stripePublicKey) {
        throw new Error('Stripe checkout is not configured.');
      }

      stripe = Stripe(config.stripePublicKey);
      return stripe;
    })().catch(function (err) {
      stripeInitPromise = null;
      throw err;
    });
    return stripeInitPromise;
  }

  function showMessage(node, text, isError) {
    if (!node) return;
    node.textContent = text;
    node.style.color = isError ? 'var(--color-danger, #b42318)' : 'var(--color-success, #067647)';
  }

  function getFormPayload(form) {
    var name = (form.querySelector('#purchase-name') || {}).value || '';
    var email = (form.querySelector('#purchase-email') || {}).value || '';
    var offer = (form.querySelector('#purchase-offer') || {}).value || '';
    return {
      name: String(name).trim(),
      email: String(email).trim(),
      offer: String(offer).trim()
    };
  }

  async function submitPurchaseIntent(form) {
    var consent = form.querySelector('#purchase-consent') && form.querySelector('#purchase-consent').checked;
    var message = document.getElementById('purchase-intent-message');
    var btn = form.querySelector('button[type="submit"]');
    var payload = getFormPayload(form);

    if (!consent) {
      showMessage(message, 'Please confirm consent before submitting.', true);
      return;
    }

    var original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    showMessage(message, '', false);

    try {
      var response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          email: payload.email,
          consent: true,
          source: 'store_purchase_intent',
          lead_type: 'purchase_intent',
          metadata: {
            offer: payload.offer,
            page: window.location.pathname.split('/').pop() || 'store.html'
          }
        })
      });
      var result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error((result && result.error) || 'Unable to submit purchase request right now.');
      }

      hasSubmittedPurchaseIntent = true;

      if (window.EFI && EFI.Analytics && EFI.Analytics.track) {
        EFI.Analytics.track('store_purchase_intent_submitted', {
          offer: payload.offer,
          lead_id: result.lead_id || ''
        });
      }

      showMessage(message, 'Request received. EFI will follow up with onboarding steps within 1 business day.', false);
    } catch (err) {
      showMessage(message, err.message || 'Submission failed. Please try again.', true);
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  }

  function openModal(summaryData) {
    var modal = document.getElementById('checkout-modal');
    var titleEl = document.getElementById('checkout-modal-title');
    var priceEl = document.getElementById('checkout-modal-price');
    var includesList = document.getElementById('checkout-modal-includes');
    if (!modal) return;

    if (titleEl) titleEl.textContent = summaryData.offerLabel || '';
    if (priceEl) priceEl.textContent = summaryData.priceDisplay || '';
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

      var stripeClient = await getStripe();

      if (window.EFI && EFI.Analytics && EFI.Analytics.track) {
        EFI.Analytics.track('store_embedded_checkout_opened', {
          offer: payload.offer,
          destination: 'stripe_embedded'
        });
      }

      openModal(result);

      checkoutInstance = await stripeClient.initEmbeddedCheckout({ clientSecret: result.clientSecret });
      var container = document.getElementById('stripe-checkout-container');
      if (!container) throw new Error('Checkout container not found.');
      checkoutInstance.mount(container);

    } catch (err) {
      showMessage(message, err.message || 'Could not open checkout.', true);
    } finally {
      // checkoutBtn is guaranteed non-null here — the null guard above returns before try{}
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = original;
    }
  }

  function initAbandonTracking(form) {
    ['input', 'change'].forEach(function (evt) {
      form.addEventListener(evt, function () {
        hasStartedPurchaseIntent = true;
      });
    });

    window.addEventListener('beforeunload', function () {
      if (!hasStartedPurchaseIntent || hasSubmittedPurchaseIntent) return;
      if (window.EFI && EFI.Analytics && EFI.Analytics.track) {
        EFI.Analytics.track('store_purchase_intent_abandoned', {
          page: window.location.pathname.split('/').pop() || 'store.html'
        });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('purchase-intent-form');
    var checkoutBtn = document.getElementById('direct-checkout-btn');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitPurchaseIntent(form);
    });

    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function () {
        startDirectCheckout(form);
      });
    }

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

    initAbandonTracking(form);
  });
})();
