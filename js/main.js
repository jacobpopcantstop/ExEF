/* ============================================
   The Executive Functioning Institute
   Main JavaScript
   ============================================ */

/* Apply saved theme immediately to prevent flash */
(function () {
  var saved = localStorage.getItem('efi_theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
})();

document.addEventListener('DOMContentLoaded', function () {
  var TRACKING_ENABLED = !/github\.io$/i.test(window.location.hostname);

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

  window.EFI = window.EFI || {};
  window.EFI.highlightActiveNavLinks = highlightActiveNavLinks;

  (function initTelemetry() {
    var KEY = 'efi_client_errors';
    function post(payload) {
      if (!canPostTracking()) return Promise.resolve();
      return fetch('/api/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function () {});
    }
    function read() {
      try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
    }
    function write(list) {
      localStorage.setItem(KEY, JSON.stringify(list.slice(-50)));
    }
    function log(type, payload) {
      var list = read();
      var item = { type: type, payload: payload, at: new Date().toISOString(), page: window.location.pathname };
      list.push(item);
      write(list);
      post({
        event_name: 'client_error',
        page: window.location.pathname.split('/').pop() || 'index.html',
        source: 'telemetry',
        properties: item
      });
    }
    window.EFI.Telemetry = {
      getErrors: read,
      clearErrors: function () { localStorage.removeItem(KEY); },
      log: log
    };
    window.addEventListener('error', function (e) {
      log('error', { message: e.message, source: e.filename, line: e.lineno, col: e.colno });
    });
    window.addEventListener('unhandledrejection', function (e) {
      log('promise_rejection', { reason: String(e.reason) });
    });
  })();

  (function initAnalytics() {
    function post(payload) {
      if (!canPostTracking()) return Promise.resolve();
      return fetch('/api/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function () {});
    }

    function track(eventName, properties) {
      var page = window.location.pathname.split('/').pop() || 'index.html';
      var params = new URLSearchParams(window.location.search || '');
      var source = params.get('utm_source') || params.get('source') || document.referrer || 'direct';
      return post({
        event_name: eventName,
        page: page,
        source: source,
        properties: properties || {}
      });
    }

    window.EFI.Analytics = {
      track: track
    };

    track('page_view', {
      title: document.title
    });

    document.addEventListener('click', function (e) {
      var el = e.target && e.target.closest ? e.target.closest('[data-analytics-event]') : null;
      if (!el) return;
      track(el.getAttribute('data-analytics-event'), {
        label: el.getAttribute('data-analytics-label') || el.textContent.trim().slice(0, 80)
      });
    });
  })();

  (function injectFooterLegalLinks() {
    var footers = document.querySelectorAll('.footer__bottom');
    if (!footers.length) return;
    footers.forEach(function (footerBottom) {
      if (footerBottom.querySelector('.footer__legal')) return;
      var legal = document.createElement('span');
      legal.className = 'footer__legal';
      legal.innerHTML = '<a href="privacy.html">Privacy</a> &middot; <a href="terms.html">Terms</a> &middot; <a href="verify.html">Verify Certificate</a>';
      footerBottom.appendChild(legal);
    });
  })();

  /* Topic cluster navigation — planned feature, not yet enabled */

  (function normalizePrimaryNav() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage === 'admin.html') return;

    var primaryLinks = [
      { href: 'index.html', label: 'Home' },
      { href: 'about.html', label: 'About' },
      { href: 'curriculum.html', label: 'Curriculum' },
      { href: 'resources.html', label: 'Resources' },
      { href: 'coaching-home.html', label: 'Coaching' },
      { href: 'store.html', label: 'Store' },
      { href: 'certification.html', label: 'Certification' }
    ];

    document.querySelectorAll('.nav__links').forEach(function (links) {
      var existingAuth = links.querySelector('.nav__auth');
      var authHtml = existingAuth ? existingAuth.innerHTML : '';
      var currentSignature = Array.prototype.map.call(links.children, function (child) {
        if (child.classList && child.classList.contains('nav__auth')) return 'auth';
        if (child.tagName === 'A') return (child.getAttribute('href') || '') + '|' + child.textContent.trim();
        return '';
      }).join('||');
      var expectedSignature = primaryLinks.map(function (item) {
        return item.href + '|' + item.label;
      }).join('||') + '||auth||store.html|View Store';
      if (currentSignature === expectedSignature) return;
      var html = '';

      primaryLinks.forEach(function (item) {
        html += '<a href="' + item.href + '" class="nav__link">' + item.label + '</a>';
      });

      html += '<span class="nav__auth">' + authHtml + '</span>';
      html += '<a href="store.html" class="nav__link nav__link--cta">View Store</a>';
      links.innerHTML = html;
    });
  })();

  /* Store visibility injection — planned feature, not yet enabled */

  (function injectFloatingStoreCTA() {
    if (!document.body.hasAttribute('data-enable-floating-store')) return;
    if (window.location.pathname.split('/').pop() === 'store.html') return;
    if (window.location.pathname.split('/').pop() === 'checkout.html') return;
    if (document.querySelector('.floating-store-cta')) return;
    var cta = document.createElement('a');
    cta.href = 'store.html';
    cta.className = 'floating-store-cta';
    cta.textContent = 'Open Store';
    cta.setAttribute('data-analytics-event', 'floating_store_click');
    document.body.appendChild(cta);
  })();

  (function injectSourceAccessReminder() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var sourceHeavy = [
      'module-1.html',
      'module-4.html',
      'module-5.html',
      'barkley-model-guide.html',
      'barkley-vs-brown.html',
      'brown-clusters-tool.html',
      'ward-360-thinking.html'
    ];
    if (sourceHeavy.indexOf(currentPage) === -1) return;
    if (document.querySelector('.source-access-reminder')) return;
    var anchor = document.querySelector('main .sources-block') || document.querySelector('main section:last-of-type .container');
    if (!anchor) return;
    var node = document.createElement('p');
    node.className = 'source-access-reminder';
    node.style.fontSize = '0.9rem';
    node.style.color = 'var(--color-text-muted)';
    node.style.marginTop = 'var(--space-md)';
    node.innerHTML = 'If a source link is unavailable, check <a href="resources.html#source-access">resource access notes</a> for legitimate acquisition paths.';
    anchor.appendChild(node);
  })();

  (function injectGettingStartedPrompts() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage === 'index.html') return;
    if (['resources.html', 'curriculum.html'].indexOf(currentPage) === -1) return;
    if (document.getElementById('getting-started-guide-card')) return;
    var headerContainer = document.querySelector('.page-header .container');
    if (!headerContainer) return;
    var card = document.createElement('div');
    card.id = 'getting-started-guide-card';
    card.className = 'card';
    card.style.marginTop = 'var(--space-xl)';
    card.innerHTML =
      '<h3 style="margin-top:0;">New to EFI?</h3>' +
      '<p style="color:var(--color-text-light);">Use the homepage start paths for parents, educators, and professionals to find the right starting sequence in under 30 minutes.</p>' +
      '<div class="button-group" style="margin-top:var(--space-md);">' +
      '<a href="index.html#start-paths" class="btn btn--primary btn--sm">Open Start Paths</a>' +
      '<a href="esqr.html" class="btn btn--secondary btn--sm">Take Free ESQ-R</a>' +
      '</div>';
    headerContainer.appendChild(card);
  })();

  (function injectSiteGuide() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage !== 'getting-started.html') return;
    // Getting Started already includes a native path selector in the page body.
    // Avoid duplicating it in the header, which can create hover/scroll jitter.
    return;
  })();

  /* Roadmap hub links — planned feature, not yet enabled */

  (function loadAssessmentTools() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (['time-blindness-calibrator.html', 'task-start-friction.html'].indexOf(currentPage) === -1) return;
    if (document.querySelector('script[data-src="js/assessment-tools.js"]')) return;
    var s = document.createElement('script');
    s.src = 'js/assessment-tools.js';
    s.defer = true;
    s.setAttribute('data-src', 'js/assessment-tools.js');
    document.head.appendChild(s);
  })();

  (function loadModuleEnhancements() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var isModulePage = /^module-(1|2|3|4|5|6|a-neuroscience|b-pedagogy|c-interventions)\.html$/.test(currentPage);
    if (!isModulePage && currentPage !== 'curriculum.html') return;
    if (document.querySelector('script[data-src="js/module-enhancements.js"]')) return;
    var s = document.createElement('script');
    s.src = 'js/module-enhancements.js';
    s.defer = true;
    s.setAttribute('data-src', 'js/module-enhancements.js');
    document.head.appendChild(s);
  })();

  (function reduceEnrollButtons() {
    return;
  })();

  (function enforceCtaGovernance() {
    return;
  })();

  (function injectBrokenLinkReportButtons() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (['404.html', 'resources.html'].indexOf(currentPage) === -1) return;
    if (document.getElementById('report-broken-link-btn')) return;

    var anchor = document.querySelector('.page-header .container') || document.querySelector('main .container');
    if (!anchor) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'report-broken-link-btn';
    btn.className = 'btn btn--secondary btn--sm';
    btn.style.marginTop = 'var(--space-md)';
    btn.textContent = 'Report Broken Link';
    anchor.appendChild(btn);

    var status = document.createElement('p');
    status.id = 'report-broken-link-status';
    status.style.marginTop = 'var(--space-sm)';
    status.style.color = 'var(--color-text-muted)';
    anchor.appendChild(status);

    btn.addEventListener('click', function () {
      btn.disabled = true;
      var payload = {
        event_name: 'broken_link_report',
        page: currentPage,
        source: 'manual_report',
        properties: {
          referrer: document.referrer || '',
          location: window.location.href
        }
      };
      if (!canPostTracking()) {
        status.textContent = 'Tracking is unavailable on this host. Please report the issue directly.';
        btn.disabled = false;
        return;
      }
      fetch('/api/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function () {
        status.textContent = 'Thanks. The broken link report was submitted.';
      }).catch(function () {
        status.textContent = 'Could not send report right now. Please try again.';
      }).finally(function () {
        btn.disabled = false;
      });
    });
  })();


  /* --- Dark Mode Toggle --- */
  (function () {
    var THEME_KEY = 'efi_theme';

    // Create toggle button in nav
    var navInner = document.querySelector('.nav__inner');
    if (navInner) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dark-toggle';
      btn.setAttribute('aria-label', 'Toggle dark mode');
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      btn.textContent = isDark ? '\u2600' : '\u263E';
      btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';

      btn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme');
        var next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(THEME_KEY, next);
        btn.textContent = next === 'dark' ? '\u2600' : '\u263E';
        btn.title = next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
      });

      // Insert before the mobile toggle button
      var mobileToggle = navInner.querySelector('.nav__toggle');
      if (mobileToggle) {
        navInner.insertBefore(btn, mobileToggle);
      } else {
        navInner.appendChild(btn);
      }
    }
  })();

  /* --- SVG Icon Templates --- */
  var hamburgerSVG = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
  var closeSVG = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  /* --- Mobile Navigation Toggle --- */
  var navToggle = document.querySelector('.nav__toggle');
  var navLinks = document.querySelector('.nav__links');

  function closeNav() {
    if (navToggle && navLinks) {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.innerHTML = hamburgerSVG;
    }
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.contains('open');
      if (isOpen) {
        closeNav();
      } else {
        navLinks.classList.add('open');
        navToggle.setAttribute('aria-expanded', 'true');
        navToggle.innerHTML = closeSVG;
      }
    });

    // Close nav when clicking a link
    navLinks.querySelectorAll('.nav__link').forEach(function (link) {
      link.addEventListener('click', function () {
        closeNav();
      });
    });

    // Close nav on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        closeNav();
        navToggle.focus();
      }
    });

    // Close nav when clicking outside
    document.addEventListener('click', function (e) {
      if (!navLinks.classList.contains('open')) return;
      if (navLinks.contains(e.target) || navToggle.contains(e.target)) return;
      closeNav();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900 && navLinks.classList.contains('open')) {
        closeNav();
      }
    });

    window.addEventListener('scroll', function () {
      if (navLinks.classList.contains('open')) {
        closeNav();
      }
    }, { passive: true });
  }

  (function initLogoWave() {
    var logo = document.querySelector('.nav .nav__logo');
    if (!logo) return;

    logo.addEventListener('click', function (e) {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      var href = logo.getAttribute('href');
      if (!href) return;

      var rect = logo.getBoundingClientRect();
      var wave = document.createElement('span');
      wave.className = 'nav-pixel-wave';
      var centerX = Math.round(rect.left + rect.width / 2);
      var centerY = Math.round(rect.top + rect.height / 2);
      wave.style.setProperty('--wave-x', centerX + 'px');
      wave.style.setProperty('--wave-y', centerY + 'px');
      var savedDir = localStorage.getItem('efi_wave_direction');
      var direction = savedDir === '-1' ? -1 : 1;
      localStorage.setItem('efi_wave_direction', String(direction));
      var count = 20;
      var baseRadius = 10;
      var travel = 56;
      for (var i = 0; i < count; i += 1) {
        var px = document.createElement('span');
        px.className = 'nav-pixel';
        var theta = (Math.PI * 2 * i / count) * direction;
        var dx = Math.cos(theta) * travel;
        var dy = Math.sin(theta) * travel;
        var startX = Math.cos(theta) * baseRadius;
        var startY = Math.sin(theta) * baseRadius;
        px.style.left = (centerX + startX) + 'px';
        px.style.top = (centerY + startY) + 'px';
        px.style.setProperty('--dx', dx + 'px');
        px.style.setProperty('--dy', dy + 'px');
        px.style.setProperty('--burst-delay', (i % 5) * 14 + 'ms');
        wave.appendChild(px);
      }
      document.body.appendChild(wave);

      var currentPage = window.location.pathname.split('/').pop() || 'index.html';
      if (currentPage !== href) {
        e.preventDefault();
        setTimeout(function () {
          window.location.href = href;
        }, 210);
      }

      setTimeout(function () { wave.remove(); }, 760);
    });
  })();

  /* --- Sticky Nav Shadow + Back-to-Top (single throttled scroll handler) --- */
  var nav = document.querySelector('.nav');
  var backToTop = document.querySelector('.back-to-top');
  var ticking = false;

  function onScroll() {
    if (nav) {
      nav.classList.toggle('scrolled', window.scrollY > 10);
    }
    if (backToTop) {
      backToTop.classList.toggle('visible', window.scrollY > 500);
    }
    ticking = false;
  }

  if (nav || backToTop) {
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });
  }

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* --- Accordion --- */
  document.querySelectorAll('.accordion').forEach(function (accordion) {
    var headers = accordion.querySelectorAll('.accordion__header');

    headers.forEach(function (header, index) {
      // Ensure ARIA attributes
      var item = header.closest('.accordion__item');
      var body = item ? item.querySelector('.accordion__body') : null;
      if (!body) return;

      // Generate IDs if missing
      if (!header.id) header.id = 'accordion-header-' + Math.random().toString(36).substr(2, 6);
      if (!body.id) body.id = 'accordion-panel-' + Math.random().toString(36).substr(2, 6);

      header.setAttribute('role', 'button');
      header.setAttribute('aria-controls', body.id);
      header.setAttribute('tabindex', '0');
      body.setAttribute('role', 'region');
      body.setAttribute('aria-labelledby', header.id);

      var isActive = item.classList.contains('active');
      header.setAttribute('aria-expanded', isActive ? 'true' : 'false');

      function toggleAccordion() {
        var isCurrentlyActive = item.classList.contains('active');
        var content = item.querySelector('.accordion__content');

        // Close all others in the same accordion
        accordion.querySelectorAll('.accordion__item').forEach(function (otherItem) {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            var otherBody = otherItem.querySelector('.accordion__body');
            var otherHeader = otherItem.querySelector('.accordion__header');
            if (otherBody) otherBody.style.maxHeight = '0';
            if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle current
        if (isCurrentlyActive) {
          item.classList.remove('active');
          body.style.maxHeight = '0';
          header.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('active');
          body.style.maxHeight = (content ? content.scrollHeight : body.scrollHeight) + 'px';
          header.setAttribute('aria-expanded', 'true');
        }
      }

      header.addEventListener('click', toggleAccordion);
      header.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleAccordion();
        }
        // Arrow key navigation between accordion headers
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          var nextIndex = e.key === 'ArrowDown'
            ? (index + 1) % headers.length
            : (index - 1 + headers.length) % headers.length;
          headers[nextIndex].focus();
        }
        if (e.key === 'Home') {
          e.preventDefault();
          headers[0].focus();
        }
        if (e.key === 'End') {
          e.preventDefault();
          headers[headers.length - 1].focus();
        }
      });
    });
  });

  /* --- Tabs --- */
  document.querySelectorAll('.tabs').forEach(function (tabGroup) {
    var tabList = tabGroup.querySelector('.tabs__list');
    var buttons = tabGroup.querySelectorAll('.tabs__btn');
    var panels = tabGroup.querySelectorAll('.tabs__panel');

    if (!tabList || buttons.length === 0) return;

    // Set ARIA roles
    tabList.setAttribute('role', 'tablist');

    buttons.forEach(function (btn, index) {
      var target = btn.getAttribute('data-tab');
      var panel = tabGroup.querySelector('[data-panel="' + target + '"]');

      // Generate IDs if missing
      if (!btn.id) btn.id = 'tab-' + Math.random().toString(36).substr(2, 6);
      if (panel && !panel.id) panel.id = 'tabpanel-' + Math.random().toString(36).substr(2, 6);

      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-controls', panel ? panel.id : '');
      if (panel) {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', btn.id);
        panel.setAttribute('tabindex', '0');
      }

      var isActive = btn.classList.contains('active');
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      btn.setAttribute('tabindex', isActive ? '0' : '-1');

      btn.addEventListener('click', function () {
        activateTab(tabGroup, buttons, panels, index);
      });

      btn.addEventListener('keydown', function (e) {
        var nextIndex;
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          nextIndex = (index + 1) % buttons.length;
          activateTab(tabGroup, buttons, panels, nextIndex);
          buttons[nextIndex].focus();
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          nextIndex = (index - 1 + buttons.length) % buttons.length;
          activateTab(tabGroup, buttons, panels, nextIndex);
          buttons[nextIndex].focus();
        }
        if (e.key === 'Home') {
          e.preventDefault();
          activateTab(tabGroup, buttons, panels, 0);
          buttons[0].focus();
        }
        if (e.key === 'End') {
          e.preventDefault();
          var last = buttons.length - 1;
          activateTab(tabGroup, buttons, panels, last);
          buttons[last].focus();
        }
      });
    });
  });

  function activateTab(tabGroup, buttons, panels, activeIndex) {
    buttons.forEach(function (b, i) {
      var isActive = i === activeIndex;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      b.setAttribute('tabindex', isActive ? '0' : '-1');
    });
    panels.forEach(function (p) {
      p.classList.remove('active');
    });
    var target = buttons[activeIndex].getAttribute('data-tab');
    var panel = tabGroup.querySelector('[data-panel="' + target + '"]');
    if (panel) panel.classList.add('active');
  }

  /* --- Scroll Reveal Animation --- */
  if ('IntersectionObserver' in window) {
    var observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    var fadeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(function (el) {
      fadeObserver.observe(el);
    });

    // Stagger children
    var staggerObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var children = entry.target.children;
          Array.from(children).forEach(function (child, i) {
            setTimeout(function () {
              child.classList.add('visible');
            }, i * 100);
          });
          staggerObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.stagger').forEach(function (el) {
      staggerObserver.observe(el);
    });
  } else {
    // Fallback: show everything immediately
    document.querySelectorAll('.fade-in, .stagger > *').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* --- Active nav link highlighting --- */
  highlightActiveNavLinks();

  /* --- Enrollment / Contact Form Handler --- */
  var form = document.getElementById('contact-form') || document.getElementById('enroll-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"], .btn');
      if (!btn) return;
      var originalText = btn.textContent;
      btn.textContent = 'Submitted! Thank you.';
      btn.disabled = true;
      setTimeout(function () {
        btn.textContent = originalText;
        btn.disabled = false;
        form.reset();
      }, 3000);
    });
  }

});
