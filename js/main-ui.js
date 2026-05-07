window.EFI = window.EFI || {};
window.EFI.registerMainModule = window.EFI.registerMainModule || function (fn) {
  window.EFI._mainModules = window.EFI._mainModules || [];
  window.EFI._mainModules.push(fn);
};

window.EFI.registerMainModule(function (shared) {
  'use strict';
  var CONSULT_URL = 'https://calendly.com/jacobansky/30min?month=2026-04';

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

  (function initLandingGate() {
    if (!document.body.classList.contains('page-home')) return;
    var landing = document.querySelector('.ef-landing');
    if (!landing) return;
    var seen = false;
    try { seen = localStorage.getItem('efi_landing_seen') === '1'; } catch (e) {}
    if (!seen) {
      landing.style.display = '';
      landing.classList.add('ef-landing--reveal');
      try { localStorage.setItem('efi_landing_seen', '1'); } catch (e) {}
    } else {
      landing.remove();
    }
  })();

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
    eyebrow.textContent = 'Executive Function Coaching';
    brand.appendChild(eyebrow);

    var logo = document.createElement('a');
    logo.href = 'index.html';
    logo.className = 'nav__logo';
    logo.style.color = 'var(--color-white)';
    var logoIcon = document.createElement('div');
    logoIcon.className = 'nav__logo-icon';
    logoIcon.textContent = 'ExEF';
    var logoText = document.createElement('span');
    logoText.textContent = 'Expert EF';
    logo.appendChild(logoIcon);
    logo.appendChild(logoText);
    brand.appendChild(logo);

    var description = document.createElement('p');
    description.textContent = 'Executive function and ADHD coaching with Jacob Rozansky. Free assessments, practical tools, and short-form resources to help you find the next workable step.';
    brand.appendChild(description);

    var dossier = document.createElement('ul');
    dossier.className = 'footer__dossier';
    appendFooterDossierItem(dossier, 'Training Lens', 'ADDCA ADHD coaching in progress, integrated with ExEF\'s coaching scope controls.');
    appendFooterDossierItem(dossier, 'Scope', 'Skills-based coaching, not therapy, diagnosis, or medical treatment.');
    brand.appendChild(dossier);
    grid.appendChild(brand);

    appendFooterListSection(grid, 'Coaching', [
      { href: 'coaching-home.html', label: 'Support Paths' },
      { href: 'coaching-home.html#service-lanes', label: 'Services' },
      { href: 'meet-the-team.html', label: 'Team' },
      { href: 'free-executive-functioning-tests.html', label: 'Assessments' }
    ]);
    appendFooterListSection(grid, 'Resources', [
      { href: 'resources.html', label: 'Resources' },
      { href: 'printables.html', label: 'Printables' },
      { href: 'open-ef-resources-directory.html', label: 'Open EF Directory' },
      { href: 'blog.html', label: 'Blog' }
    ]);
    appendFooterListSection(grid, 'Connect', [
      { href: 'coaching-home.html#service-lanes', label: 'Services' },
      { href: CONSULT_URL, label: 'Book a Consultation' },
      { href: 'mailto:jacob@exef.org', label: 'jacob@exef.org' },
      { href: 'search.html', label: 'Search' }
    ]);
    container.appendChild(grid);

    var bottom = document.createElement('div');
    bottom.className = 'footer__bottom';
    var status = document.createElement('span');
    status.className = 'footer__status';
    status.textContent = 'Built around Barkley, Brown, Dawson & Guare, Ward, ICF ethics, NBEFC context, and ADDCA ADHD coaching training in progress.';
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
    footerBottom.appendChild(legal);
  });
  })();

  (function normalizePrimaryNav() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage === 'admin.html') return;
    if (document.querySelector('.nav__dropdown-trigger')) return;

    var assessmentPages = [
      'free-executive-functioning-tests.html', 'esqr.html', 'ef-profile-story.html',
      'conative-action-profile.html', 'environment-quiz.html', 'full-ef-profile.html',
      'brown-clusters-tool.html', 'time-blindness-calibrator.html', 'task-start-friction.html'
    ];
    var resourcePages = [
      'resources.html', 'blog.html', 'open-ef-resources-directory.html', 'printables.html',
      'parent-toolkit.html', 'educator-toolkit.html', 'teacher-to-coach.html',
      'executive-functioning-iep-goal-bank.html', 'barkley-model-guide.html',
      'barkley-vs-brown.html', 'further-sources.html', 'scope-of-practice.html'
    ];
    function isActive(pageList) {
      return pageList.indexOf(currentPage) !== -1;
    }

    function makeNavLink(container, href, label, pageList) {
      var className = 'nav__link' + (pageList && isActive(pageList) ? ' nav__link--active' : '');
      return appendTextLink(container, href, label, className);
    }

    document.querySelectorAll('.nav__links').forEach(function (links) {
      var existingAuth = links.querySelector('.nav__auth');
      var authNodes = existingAuth ? Array.from(existingAuth.childNodes) : [];
      clearNode(links);

      var primaryCluster = document.createElement('div');
      primaryCluster.className = 'nav__cluster';
      makeNavLink(primaryCluster, 'coaching-home.html', 'Coaching', ['coaching-home.html', 'coaching-contact.html', 'coaching-creative.html', 'coaching-about.html', 'coaching-methodology.html']);
      makeNavLink(primaryCluster, 'free-executive-functioning-tests.html', 'Assessments', assessmentPages);
      makeNavLink(primaryCluster, 'resources.html', 'Resources', resourcePages);
      makeNavLink(primaryCluster, 'meet-the-team.html', 'Team', ['meet-the-team.html', 'about.html']);
      var authWrap = document.createElement('span');
      authWrap.className = 'nav__auth';
      authNodes.forEach(function (node) {
        authWrap.appendChild(node);
      });
      links.appendChild(primaryCluster);

      var supportCluster = document.createElement('div');
      supportCluster.className = 'nav__cluster nav__cluster--support';
      supportCluster.appendChild(authWrap);
      var consultLink = document.createElement('a');
      consultLink.href = CONSULT_URL;
      consultLink.className = 'nav__link nav__link--cta';
      consultLink.textContent = 'Book Consultation';
      supportCluster.appendChild(consultLink);
      links.appendChild(supportCluster);
    });
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
    heading.textContent = 'New to ExEF?';
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

  // Dark mode toggle has been retired. The dark theme produced grey washes that
  // never matched the warm paper/ink palette. js/theme-init.js clears any stale
  // efi_theme preference so existing visitors return to light.
  (function purgeStrayDarkToggle() {
    var stale = document.querySelector('.dark-toggle');
    if (stale && stale.parentNode) stale.parentNode.removeChild(stale);
    document.documentElement.removeAttribute('data-theme');
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

  (function initLogoRipple() {
    var logo = document.querySelector('.nav .nav__logo');
    if (!logo) return;
    var logoIcon = logo.querySelector('.nav__logo-icon');
    if (!logoIcon) return;

    logo.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      // Remove any existing ripple elements
      logoIcon.querySelectorAll('.nav__logo-ripple').forEach(function (el) { el.remove(); });

      // Create three staggered ripple rings
      [1, 2, 3].forEach(function (n) {
        var ripple = document.createElement('span');
        ripple.className = 'nav__logo-ripple nav__logo-ripple--' + n;
        ripple.setAttribute('aria-hidden', 'true');
        logoIcon.appendChild(ripple);
        ripple.addEventListener('animationend', function () { ripple.remove(); }, { once: true });
      });
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

    requestAnimationFrame(function () {
      document.body.classList.add('page-ready');
    });

    window.addEventListener('pageshow', function () {
      document.body.classList.remove('page-is-leaving');
      document.body.classList.add('page-ready');
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
