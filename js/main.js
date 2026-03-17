/* ============================================
   The Executive Functioning Institute
   Main Bootstrap Loader
   ============================================ */

/* Apply saved theme immediately to prevent flash */
(function () {
  var saved = null;
  try {
    saved = localStorage.getItem('efi_theme');
  } catch (e) {
    saved = null;
  }
  if (saved) document.documentElement.setAttribute('data-theme', saved);
})();

(function () {
  'use strict';

  var EFI = window.EFI = window.EFI || {};
  var pending = Array.isArray(EFI._pendingMainModules) ? EFI._pendingMainModules.slice() : [];
  EFI.MainModules = pending;
  delete EFI._pendingMainModules;

  EFI.registerMainModule = function (init) {
    if (typeof init === 'function') {
      EFI.MainModules.push(init);
    }
  };

  var host = window.location.hostname || '';
  var TRACKING_ENABLED = !/github\.io$/i.test(host) &&
    !/^(localhost|127\.0\.0\.1)$/i.test(host) &&
    window.location.protocol !== 'file:';

  function revealStaticContent() {
    document.querySelectorAll('.fade-in, .stagger > *').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  function safeSetLocalStorage(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  }

  function canPostTracking() {
    return TRACKING_ENABLED && !!window.fetch;
  }

  function highlightActiveNavLinks() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav__link').forEach(function (link) {
      link.classList.remove('nav__link--active');
      link.removeAttribute('aria-current');

      var href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('nav__link--active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  EFI.highlightActiveNavLinks = highlightActiveNavLinks;
  EFI.MainShared = {
    canPostTracking: canPostTracking,
    highlightActiveNavLinks: highlightActiveNavLinks,
    revealStaticContent: revealStaticContent,
    safeSetLocalStorage: safeSetLocalStorage
  };

  var modulesReady = false;
  var domReady = document.readyState !== 'loading';
  var modulesStarted = false;
  var bundledModuleFile = 'main.bundle.min.js';
  var bundledModuleFileFallback = 'main.bundle.js';
  var fallbackModuleFiles = ['main-analytics.js', 'main-learning-loop.js', 'main-ui.js'];
  var fallbackLoadStarted = false;

  function runModules() {
    if (!modulesReady || !domReady || modulesStarted) return;
    modulesStarted = true;
    revealStaticContent();
    EFI.MainModules.forEach(function (init) {
      try {
        init(EFI.MainShared);
      } catch (err) {
        console.error('[EFI main bootstrap] Module init failed:', err);
      }
    });
  }

  function maybeRunModules() {
    runModules();
  }

  if (!domReady) {
    document.addEventListener('DOMContentLoaded', function () {
      domReady = true;
      maybeRunModules();
    }, { once: true });
  }

  function getBasePath() {
    var currentScript = document.currentScript;
    if (currentScript && currentScript.src) {
      return currentScript.src.replace(/main\.js(?:\?.*)?$/, '');
    }
    return 'js/';
  }

  function loadScriptsSequentially(files, done, errorHandler) {
    var base = getBasePath();
    var index = 0;

    function next() {
      if (index >= files.length) {
        done();
        return;
      }

      var file = files[index++];
      if (document.querySelector('script[data-efi-main-module="' + file + '"]')) {
        next();
        return;
      }

      var script = document.createElement('script');
      script.src = base + file;
      script.async = false;
      script.defer = false;
      script.setAttribute('data-efi-main-module', file);
      script.onload = next;
      script.onerror = function () {
        console.error('[EFI main bootstrap] Failed to load module:', file);
        if (typeof errorHandler === 'function') {
          errorHandler(file, next);
          return;
        }
        next();
      };
      document.head.appendChild(script);
    }

    next();
  }

  function loadFallbackModules() {
    if (fallbackLoadStarted) return;
    fallbackLoadStarted = true;
    loadScriptsSequentially(fallbackModuleFiles, function () {
      modulesReady = true;
      maybeRunModules();
    });
  }

  loadScriptsSequentially([bundledModuleFile], function () {
    modulesReady = true;
    maybeRunModules();
  }, function (file) {
    // min bundle failed — try unminified bundle, then individual files
    if (file === bundledModuleFile) {
      loadScriptsSequentially([bundledModuleFileFallback], function () {
        modulesReady = true;
        maybeRunModules();
      }, function () {
        loadFallbackModules();
      });
      return;
    }
    loadFallbackModules();
  });
})();
