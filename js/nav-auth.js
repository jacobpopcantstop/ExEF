/* Lightweight nav auth renderer for static pages */
(function () {
  'use strict';

  // The learner program (login, dashboard, certification) is retired and its
  // URLs redirect to coaching, so the nav's auth slot stays empty for everyone.
  function renderNavAuth() {
    document.querySelectorAll('.nav__auth').forEach(function (el) {
      while (el.firstChild) el.removeChild(el.firstChild);
    });

    if (window.EFI && typeof window.EFI.highlightActiveNavLinks === 'function') {
      window.EFI.highlightActiveNavLinks();
    }
  }

  document.addEventListener('DOMContentLoaded', renderNavAuth);
})();
