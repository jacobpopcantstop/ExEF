window.EFI = window.EFI || {};
window.EFI.registerMainModule = window.EFI.registerMainModule || function (fn) {
  window.EFI._mainModules = window.EFI._mainModules || [];
  window.EFI._mainModules.push(fn);
};

window.EFI.registerMainModule(function (shared) {
  'use strict';

  function clearNode(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function appendTextLink(container, href, label, className) {
    var link = document.createElement('a');
    link.href = href;
    if (className) link.className = className;
    link.textContent = label;
    container.appendChild(link);
    return link;
  }

  function appendFooterListSection(container, headingText, links) {
    var section = document.createElement('div');
    var heading = document.createElement('h4');
    heading.textContent = headingText;
    section.appendChild(heading);
    var list = document.createElement('ul');
    list.className = 'footer__links';
    (links || []).forEach(function (item) {
      var li = document.createElement('li');
      var link = appendTextLink(li, item.href, item.label);
      if (item.target) link.target = item.target;
      if (item.rel) link.rel = item.rel;
      list.appendChild(li);
    });
    section.appendChild(list);
    container.appendChild(section);
  }

  function appendFooterDossierItem(list, step, text) {
    var item = document.createElement('li');
    var label = document.createElement('span');
    label.textContent = step;
    item.appendChild(label);
    var strong = document.createElement('strong');
    strong.textContent = text;
    item.appendChild(strong);
    list.appendChild(item);
  }

  (function normalizeInstitutionFooter() {
    var footer = document.querySelector('.footer');
    if (!footer) return;
    var container = footer.querySelector('.container');
    if (!container) return;
    clearNode(container);

    var grid = document.createElement('div');
    grid.className = 'footer__grid footer__grid--institutional';

    var brand = document.createElement('div');
    brand.className = 'footer__brand footer__brand--institutional';
    var eyebrow = document.createElement('p');
    eyebrow.className = 'footer__eyebrow';
    eyebrow.textContent = 'Route Before You Buy';
    brand.appendChild(eyebrow);

    var logo = document.createElement('a');
    logo.href = 'index.html';
    logo.className = 'nav__logo';
    logo.style.color = 'var(--color-white)';
    var logoIcon = document.createElement('div');
    logoIcon.className = 'nav__logo-icon';
    logoIcon.textContent = 'EFI';
    var logoText = document.createElement('span');
    logoText.textContent = 'Executive Functioning Institute';
    logo.appendChild(logoIcon);
    logo.appendChild(logoText);
    brand.appendChild(logo);

    var description = document.createElement('p');
    description.textContent = 'EFI is structured as a decision tree. Visitors should identify their role, use one free tool or route page first, and only move to paid review when the next step is already obvious.';
    brand.appendChild(description);

    var dossier = document.createElement('ul');
    dossier.className = 'footer__dossier';
    appendFooterDossierItem(dossier, 'Step 1', 'Choose a role: parent, educator, or practitioner');
    appendFooterDossierItem(dossier, 'Step 2', 'Use the free layer: assessments, toolkits, curriculum, and public standards');
    appendFooterDossierItem(dossier, 'Step 3', 'Use reviewed services only when the route and scope are already clear');
    brand.appendChild(dossier);
    grid.appendChild(brand);

    appendFooterListSection(grid, 'Audience Routes', [
      { href: 'coaching-home.html', label: 'Parents and Families' },
      { href: 'teacher-to-coach.html', label: 'Educators in Transition' },
      { href: 'certification.html', label: 'Professionals and Practitioners' },
      { href: 'index.html#start-paths', label: 'Homepage Router' }
    ]);
    appendFooterListSection(grid, 'Free Layer', [
      { href: 'resources.html#assessments', label: 'Assessments and Tools' },
      { href: 'resources.html#toolkits', label: 'Role-Based Toolkits' },
      { href: 'curriculum.html', label: 'Open Curriculum' },
      { href: 'resources.html#library', label: 'Reference Library' }
    ]);
    appendFooterListSection(grid, 'Reviewed Next Steps', [
      { href: 'certification.html', label: 'Certification Standards' },
      { href: 'store.html', label: 'Reviewed Services and Pricing' },
      { href: 'coaching-contact.html', label: 'Start an Intake Conversation' },
      { href: 'store.html#paid-path', label: 'Free vs Paid Boundary' }
    ]);
    appendFooterListSection(grid, 'Evidence', [
      { href: 'EFI-Capstone-Transparency-Rubric.pdf', label: 'Capstone Rubric PDF', target: '_blank', rel: 'noopener' },
      { href: 'EFI-Competency-Crosswalk-Map.pdf', label: 'Competency Crosswalk', target: '_blank', rel: 'noopener' },
      { href: 'verify.html', label: 'Credential Verification' },
      { href: 'resources.html#source-access', label: 'Source Access Notes' },
      { href: 'https://github.com/jacobpopcantstop/TheExecutiveFunctioningInstitute', label: 'GitHub Repository', target: '_blank', rel: 'noopener' }
    ]);
    container.appendChild(grid);

    var bottom = document.createElement('div');
    bottom.className = 'footer__bottom';
    var status = document.createElement('span');
    status.className = 'footer__status';
    status.textContent = 'Built around Barkley, Brown, Dawson & Guare, and Ward with public routing, standards, and review artifacts.';
    bottom.appendChild(status);
    container.appendChild(bottom);
  })();

  (function injectFooterLegalLinks() {
    var footers = document.querySelectorAll('.footer__bottom');
    if (!footers.length) return;
    footers.forEach(function (footerBottom) {
      if (footerBottom.querySelector('.footer__legal')) return;
      var legal = document.createElement('span');
      legal.className = 'footer__legal';
      appendTextLink(legal, 'privacy.html', 'Privacy');
      legal.appendChild(document.createTextNode(' · '));
      appendTextLink(legal, 'terms.html', 'Terms');
      legal.appendChild(document.createTextNode(' · '));
      appendTextLink(legal, 'verify.html', 'Verify Certificate');
      footerBottom.appendChild(legal);
    });
  })();

  (function normalizePrimaryNav() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage === 'admin.html') return;

  var primaryLinks = [
    { href: 'curriculum.html', label: 'Curriculum' },
    { href: 'resources.html', label: 'Resources' },
    { href: 'certification.html', label: 'Certification' },
    { href: 'search.html', label: 'Search' }
  ];

    var audienceLinks = [
      { href: 'coaching-home.html', label: 'Parents' },
      { href: 'teacher-to-coach.html', label: 'Educators' },
      { href: 'certification.html', label: 'Professionals' }
    ];

    document.querySelectorAll('.nav__links').forEach(function (links) {
      var existingAuth = links.querySelector('.nav__auth');
      var authNodes = existingAuth ? Array.from(existingAuth.childNodes) : [];
      clearNode(links);

      var primaryCluster = document.createElement('div');
      primaryCluster.className = 'nav__cluster';
      var primaryEyebrow = document.createElement('p');
      primaryEyebrow.className = 'nav__eyebrow';
      primaryEyebrow.textContent = 'Explore';
      primaryCluster.appendChild(primaryEyebrow);
      primaryLinks.forEach(function (item) {
        appendTextLink(primaryCluster, item.href, item.label, 'nav__link');
      });
      links.appendChild(primaryCluster);

      var audienceCluster = document.createElement('div');
      audienceCluster.className = 'nav__cluster nav__cluster--support';
      var audienceEyebrow = document.createElement('p');
      audienceEyebrow.className = 'nav__eyebrow';
      audienceEyebrow.textContent = 'By Audience';
      audienceCluster.appendChild(audienceEyebrow);
      audienceLinks.forEach(function (item) {
        appendTextLink(audienceCluster, item.href, item.label, 'nav__link');
      });

      var authWrap = document.createElement('span');
      authWrap.className = 'nav__auth';
      authNodes.forEach(function (node) {
        authWrap.appendChild(node);
      });
      audienceCluster.appendChild(authWrap);
      links.appendChild(audienceCluster);
    });
  })();

  (function injectFloatingStoreCTA() {
    if (!document.body.hasAttribute('data-enable-floating-store')) return;
    if (window.location.pathname.split('/').pop() === 'store.html') return;
    if (window.location.pathname.split('/').pop() === 'checkout.html') return;
    if (document.querySelector('.floating-store-cta')) return;
    var cta = document.createElement('a');
    cta.href = 'store.html';
    cta.className = 'floating-store-cta';
    cta.textContent = 'Reviewed Services';
    cta.setAttribute('data-analytics-event', 'floating_store_click');
    document.body.appendChild(cta);
  })();

  (function injectModuleScrollProgress() {
    var currentPage = window.location.pathname.split('/').pop() || '';
    if (!/^module-\d+\.html$/.test(currentPage)) return;
    if (document.querySelector('.module-scroll-progress')) return;

    var shell = document.createElement('div');
    shell.className = 'module-scroll-progress';
    shell.setAttribute('aria-hidden', 'true');
    var fill = document.createElement('div');
    fill.className = 'module-scroll-progress__fill';
    shell.appendChild(fill);
    document.body.appendChild(shell);

    function updateProgress() {
      var doc = document.documentElement;
      var scrollable = Math.max(doc.scrollHeight - window.innerHeight, 1);
      var percent = Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100));
      fill.style.width = percent + '%';
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
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
    node.appendChild(document.createTextNode('If a source link is unavailable, check '));
    appendTextLink(node, 'resources.html#source-access', 'resource access notes');
    node.appendChild(document.createTextNode(' for legitimate acquisition paths.'));
    anchor.appendChild(node);
  })();

  (function injectGettingStartedPrompts() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage === 'index.html') return;
    if (currentPage !== 'curriculum.html') return;
    if (document.getElementById('getting-started-guide-card')) return;
    var headerContainer = document.querySelector('.page-header .container');
    if (!headerContainer) return;
    var card = document.createElement('div');
    card.id = 'getting-started-guide-card';
    card.className = 'card';
    card.style.marginTop = 'var(--space-xl)';
    var heading = document.createElement('h3');
    heading.style.marginTop = '0';
    heading.textContent = 'New to EFI?';
    card.appendChild(heading);

    var intro = document.createElement('p');
    intro.style.color = 'var(--color-text-light)';
    intro.textContent = 'Use the homepage start paths for parents, educators, and professionals to find the right starting sequence in under 30 minutes.';
    card.appendChild(intro);

    var actions = document.createElement('div');
    actions.className = 'button-group';
    actions.style.marginTop = 'var(--space-md)';
    appendTextLink(actions, 'index.html#start-paths', 'Open Start Paths', 'btn btn--primary btn--sm');
    appendTextLink(actions, 'esqr.html', 'Take Free ESQ-R', 'btn btn--secondary btn--sm');
    card.appendChild(actions);
    headerContainer.appendChild(card);
  })();

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
      if (!shared.canPostTracking()) {
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

  (function initDarkModeToggle() {
    var THEME_KEY = 'efi_theme';
    var navInner = document.querySelector('.nav__inner');
    if (!navInner) return;
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
      shared.safeSetLocalStorage(THEME_KEY, next);
      btn.textContent = next === 'dark' ? '\u2600' : '\u263E';
      btn.title = next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    });

    var mobileToggle = navInner.querySelector('.nav__toggle');
    if (mobileToggle) {
      navInner.insertBefore(btn, mobileToggle);
    } else {
      navInner.appendChild(btn);
    }
  })();

  var navToggle = document.querySelector('.nav__toggle');
  var navLinks = document.querySelector('.nav__links');

  function buildNavIcon(isOpen) {
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');

    function appendLine(x1, y1, x2, y2) {
      var line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      svg.appendChild(line);
    }

    if (isOpen) {
      appendLine('18', '6', '6', '18');
      appendLine('6', '6', '18', '18');
    } else {
      appendLine('3', '6', '21', '6');
      appendLine('3', '12', '21', '12');
      appendLine('3', '18', '21', '18');
    }

    return svg;
  }

  function setNavState(isOpen) {
    if (!navToggle || !navLinks) return;
    navLinks.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    navToggle.replaceChildren(buildNavIcon(isOpen));
  }

  function closeNav() {
    if (navToggle && navLinks) {
      setNavState(false);
    }
  }

  if (navToggle && navLinks) {
    setNavState(navLinks.classList.contains('open'));

    navToggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var isOpen = navLinks.classList.contains('open');
      setNavState(!isOpen);
    });

    navLinks.querySelectorAll('.nav__link').forEach(function (link) {
      link.addEventListener('click', function () {
        closeNav();
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        closeNav();
        navToggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (!navLinks.classList.contains('open')) return;
      if (navLinks.contains(e.target) || e.target.closest('.nav__toggle')) return;
      closeNav();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024 && navLinks.classList.contains('open')) {
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
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
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
      shared.safeSetLocalStorage('efi_wave_direction', String(direction));

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

  (function initNavShadowAndBackToTop() {
    var nav = document.querySelector('.nav');
    var backToTop = document.querySelector('.back-to-top');
    var ticking = false;

    function onScroll() {
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 10);
      if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 500);
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
  })();

  (function initPageTransitions() {
    if (!document.body) return;
    var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    var leaveTimer = null;

    requestAnimationFrame(function () {
      document.body.classList.add('page-ready');
    });

    window.addEventListener('pageshow', function () {
      if (leaveTimer) {
        window.clearTimeout(leaveTimer);
        leaveTimer = null;
      }
      document.body.classList.remove('page-is-leaving');
      document.body.classList.add('page-ready');
    });

    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var link = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!link || link.hasAttribute('download')) return;
      if ((link.getAttribute('target') || '').toLowerCase() === '_blank') return;
      if (link.classList.contains('btn')) return;
      if (link.closest('.accordion__content, form, .tool-panel, .resources-assessment-layout, .resources-role-layout')) return;

      var rawHref = link.getAttribute('href');
      if (!rawHref || rawHref.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(rawHref)) return;

      var url;
      try {
        url = new URL(link.href, window.location.href);
      } catch (err) {
        return;
      }

      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;

      e.preventDefault();
      document.body.classList.add('page-is-leaving');
      if (leaveTimer) window.clearTimeout(leaveTimer);
      leaveTimer = window.setTimeout(function () {
        document.body.classList.remove('page-is-leaving');
      }, 900);

      window.setTimeout(function () {
        window.location.href = url.href;
      }, 180);
    });
  })();

  document.querySelectorAll('.accordion').forEach(function (accordion) {
    var headers = accordion.querySelectorAll('.accordion__header');
    headers.forEach(function (header, index) {
      var item = header.closest('.accordion__item');
      var body = item ? item.querySelector('.accordion__body') : null;
      if (!body) return;

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
        accordion.querySelectorAll('.accordion__item').forEach(function (otherItem) {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            var otherBody = otherItem.querySelector('.accordion__body');
            var otherHeader = otherItem.querySelector('.accordion__header');
            if (otherBody) otherBody.style.maxHeight = '0';
            if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
          }
        });

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
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          var nextIndex = e.key === 'ArrowDown' ? (index + 1) % headers.length : (index - 1 + headers.length) % headers.length;
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

  document.querySelectorAll('.tabs').forEach(function (tabGroup) {
    var tabList = tabGroup.querySelector('.tabs__list');
    var buttons = tabGroup.querySelectorAll('.tabs__btn');
    var panels = tabGroup.querySelectorAll('.tabs__panel');
    if (!tabList || buttons.length === 0) return;

    tabList.setAttribute('role', 'tablist');
    buttons.forEach(function (btn, index) {
      var target = btn.getAttribute('data-tab');
      var panel = tabGroup.querySelector('[data-panel="' + target + '"]');
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

    var staggerObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          Array.from(entry.target.children).forEach(function (child, i) {
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
    document.querySelectorAll('.fade-in, .stagger > *').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  shared.highlightActiveNavLinks();

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
