(function() {
  'use strict';

  function setStyles(el, styles) {
    if (!el || !styles) return;
    Object.keys(styles).forEach(function(key) {
      el.style[key] = styles[key];
    });
  }

  function hasAdvancedAccess() {
    if (!window.EFI || !EFI.Auth) return false;
    if (typeof EFI.Auth.hasRole === 'function' && EFI.Auth.hasRole(['admin', 'reviewer'])) {
      return true;
    }
    if (typeof EFI.Auth.hasPurchased === 'function') {
      if (EFI.Auth.hasPurchased('cefc-enrollment') || EFI.Auth.hasPurchased('capstone-review')) {
        return true;
      }
    }
    if (typeof EFI.Auth.getCertificationStatus === 'function') {
      var status = EFI.Auth.getCertificationStatus();
      if (status && (status.fullyCertified || status.certificatePurchased || status.eligibleForCertificate)) {
        return true;
      }
    }
    return false;
  }

  function initGate() {
    var gate = document.getElementById('advanced-gate');
    var content = document.getElementById('advanced-content');
    var gateMessage = document.getElementById('advanced-gate-message');
    var gateActions = document.getElementById('advanced-gate-actions');
    var loginLink = document.getElementById('advanced-gate-login');
    if (!gate || !content || !gateMessage || !gateActions || !window.EFI || !EFI.Auth) return;

    var current = window.location.pathname.split('/').pop() || 'curriculum.html';
    if (loginLink) {
      loginLink.href = 'login.html?redirect=' + encodeURIComponent(current);
    }

    function reveal() {
      gate.style.display = 'none';
      content.style.display = 'block';
    }

    function showGate(message, loggedIn) {
      gateMessage.textContent = message;
      gate.style.display = 'flex';
      content.style.display = 'none';
      gateActions.style.display = 'flex';
      setStyles(gateActions, {
        justifyContent: 'center',
        gap: 'var(--space-md)',
        flexWrap: 'wrap'
      });
      if (loginLink) {
        loginLink.style.display = loggedIn ? 'none' : 'inline-flex';
      }
    }

    function evaluate() {
      if (!EFI.Auth.isLoggedIn()) {
        showGate('Log in with a paid ExEF account to open this advanced module.', false);
        return;
      }
      if (hasAdvancedAccess()) {
        reveal();
        return;
      }
      showGate('This advanced module is part of the paid ExEF pathway. Your current account does not include advanced-module access.', true);
    }

    var refresher = EFI.Auth.refreshManagedSession;
    if (typeof refresher === 'function') {
      Promise.resolve(refresher()).finally(evaluate);
      return;
    }
    evaluate();
  }

  document.addEventListener('DOMContentLoaded', initGate);
})();
