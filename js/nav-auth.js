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

    function clearNode(node) {
      while (node.firstChild) node.removeChild(node.firstChild);
    }

    function appendNavLink(container, href, label) {
      var link = document.createElement('a');
      link.href = href;
      link.className = 'nav__link';
      link.textContent = label;
      container.appendChild(link);
    }

    authLinks.forEach(function (el) {
      clearNode(el);
      if (session) {
        appendNavLink(el, 'dashboard.html', 'Dashboard');
        if (session.role === 'admin' || session.role === 'reviewer') {
          appendNavLink(el, 'admin.html', 'Admin');
        }
      } else {
        appendNavLink(el, 'login.html', 'Login');
      }
    });

    if (window.EFI && typeof window.EFI.highlightActiveNavLinks === 'function') {
      window.EFI.highlightActiveNavLinks();
    }
  }

  document.addEventListener('DOMContentLoaded', renderNavAuth);
})();
