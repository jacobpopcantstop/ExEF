/* Lightweight nav auth renderer for static pages */
(function () {
  'use strict';

  var SESSION_KEY = 'efi_session';

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
    } catch (e) {
      return null;
    }
  }

  function renderNavAuth() {
    var session = getSession();
    var authLinks = document.querySelectorAll('.nav__auth');
    if (!authLinks.length) return;

    authLinks.forEach(function (el) {
      if (session) {
        var opsLink = (session.role === 'admin' || session.role === 'reviewer')
          ? '<a href="admin.html" class="nav__link">Admin</a>'
          : '';
        el.innerHTML = '<a href="dashboard.html" class="nav__link">Dashboard</a>' + opsLink;
      } else {
        el.innerHTML = '<a href="login.html" class="nav__link">Login</a>';
      }
    });

    if (window.EFI && typeof window.EFI.highlightActiveNavLinks === 'function') {
      window.EFI.highlightActiveNavLinks();
    }
  }

  document.addEventListener('DOMContentLoaded', renderNavAuth);
})();
