(function () {
  var hasStartedPurchaseIntent = false;
  var hasSubmittedPurchaseIntent = false;

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

    var original = checkoutBtn.textContent;
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Opening checkout...';

    try {
      var response = await fetch('/api/create-checkout-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      var result = await response.json();
      if (!response.ok || !result.ok || !result.checkout_url) {
        throw new Error((result && result.error) || 'Direct checkout is unavailable for this offer right now.');
      }

      if (window.EFI && EFI.Analytics && EFI.Analytics.track) {
        EFI.Analytics.track('store_direct_checkout_started', {
          offer: payload.offer,
          destination: 'stripe_payment_link'
        });
      }

      window.location.href = result.checkout_url;
    } catch (err) {
      showMessage(message, err.message || 'Could not open checkout.', true);
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

    initAbandonTracking(form);
  });
})();
