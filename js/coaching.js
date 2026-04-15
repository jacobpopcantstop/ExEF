/**
 * EFI Coaching Practice
 * Main JavaScript File
 */

document.addEventListener('DOMContentLoaded', function () {
    replaceLegacyGlyphIcons();
    injectInstituteCommerceLinks();
    initThemeToggle();
    initMobileMenu();
    initSmoothScroll();
    initFormHandling();
    initAnimations();
    trackEvent('coaching_page_view', {
        page: window.location.pathname.split('/').pop() || 'coaching-home.html',
        title: document.title
    });
});

function initThemeToggle() {
    var THEME_KEY = 'efi_theme';
    var themeToggle = document.querySelector('.theme-toggle');
    if (!themeToggle) return;

    function syncThemeButton() {
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        themeToggle.textContent = isDark ? '\u2600' : '\u263E';
        themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        themeToggle.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    }

    syncThemeButton();

    themeToggle.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme');
        var next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try {
            localStorage.setItem(THEME_KEY, next);
        } catch (err) {}
        syncThemeButton();
    });
}

function injectInstituteCommerceLinks() {
    var currentPage = window.location.pathname.split('/').pop() || 'coaching-home.html';
    document.querySelectorAll('.nav-links').forEach(function (list) {
        if (!list || list.querySelector('a[href="store.html"]')) return;

        var getStarted = list.querySelector('a[href="coaching-contact.html"]');
        var storeItem = document.createElement('li');
        var storeLink = document.createElement('a');
        storeLink.href = 'store.html';
        if (currentPage === 'store.html') storeLink.className = 'active';
        storeLink.textContent = 'ExEF Store';
        storeItem.appendChild(storeLink);

        var certItem = document.createElement('li');
        var certLink = document.createElement('a');
        certLink.href = 'certification.html';
        if (currentPage === 'certification.html') certLink.className = 'active';
        certLink.textContent = 'Certification';
        certItem.appendChild(certLink);

        if (getStarted && getStarted.parentNode) {
            list.insertBefore(storeItem, getStarted.parentNode);
            list.insertBefore(certItem, getStarted.parentNode);
        } else {
            list.appendChild(certItem);
            list.appendChild(storeItem);
        }
    });
}

function replaceLegacyGlyphIcons() {
    var glyphToIcon = {
        '♔': 'chess_king',
        '♕': 'chess_queen',
        '♘': 'chess_knight',
        '♙': 'chess_pawn',
        '♟': 'chess_knight',
        '🎓': 'cap',
        '🎭': 'theater',
        '🧩': 'puzzle',
        '🎲': 'dice',
        '🎬': 'film',
        '📚': 'book',
        '😰': 'alert',
        '📄': 'doc',
        '💡': 'bulb',
        '📞': 'phone',
        '✉': 'mail',
        '📅': 'calendar',
        '📍': 'pin',
        '🕒': 'clock',
        '👤': 'user',
        '⏱': 'clock',
        '⛔': 'ban',
        '🔄': 'refresh',
        '🎯': 'target'
    };

    var selectors = [
        '.logo-icon',
        '.credential-icon',
        '.stat-number',
        '.problem-icon',
        '.method-icon',
        '.option-icon',
        '.quick-icon',
        '.skill-icon',
        '.skill-icon-large',
        '.workshop-icon',
        '.resource-icon',
        '.calendar-icon',
        '.photo-icon'
    ];

    selectors.forEach(function (selector) {
        document.querySelectorAll(selector).forEach(function (el) {
            if (el.querySelector('svg')) return;
            var raw = (el.textContent || '').trim();
            var iconName = glyphToIcon[raw] || 'spark';
            clearNode(el);
            el.appendChild(svgIcon(iconName));
            el.setAttribute('aria-hidden', 'true');
        });
    });

    document.querySelectorAll('.chess-board-mini .piece').forEach(function (el) {
        if (el.querySelector('svg')) return;
        var iconName = 'chess_pawn';
        if (el.classList.contains('king')) iconName = 'chess_king';
        else if (el.classList.contains('queen')) iconName = 'chess_queen';
        else if (el.classList.contains('knight')) iconName = 'chess_knight';
        clearNode(el);
        el.appendChild(svgIcon(iconName));
        el.setAttribute('aria-hidden', 'true');
    });
}

function svgIcon(name) {
    var SVG_NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'icon-svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    var iconDefs = {
        cap: [{ tag: 'path', attrs: { d: 'M2 10l10-5 10 5-10 5-10-5z' } }, { tag: 'path', attrs: { d: 'M6 12v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4' } }],
        theater: [{ tag: 'path', attrs: { d: 'M4 5h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5z' } }, { tag: 'path', attrs: { d: 'M8 9h.01M16 9h.01M8 13c1 1 2 1.5 4 1.5S15 14 16 13' } }],
        puzzle: [{ tag: 'path', attrs: { d: 'M9 3h4a2 2 0 0 1 2 2v2.2a2 2 0 1 1 0 3.6V13a2 2 0 0 1-2 2h-2.2a2 2 0 1 0-3.6 0H5a2 2 0 0 1-2-2V9h2.2a2 2 0 1 0 0-3.6H3V5a2 2 0 0 1 2-2h2a2 2 0 1 0 2 0z' } }],
        dice: [{ tag: 'rect', attrs: { x: '4', y: '4', width: '16', height: '16', rx: '3' } }, { tag: 'circle', attrs: { cx: '9', cy: '9', r: '1' } }, { tag: 'circle', attrs: { cx: '15', cy: '15', r: '1' } }, { tag: 'circle', attrs: { cx: '9', cy: '15', r: '1' } }, { tag: 'circle', attrs: { cx: '15', cy: '9', r: '1' } }],
        film: [{ tag: 'rect', attrs: { x: '3', y: '5', width: '18', height: '14', rx: '2' } }, { tag: 'path', attrs: { d: 'M7 5v14M17 5v14M3 9h18M3 15h18' } }],
        book: [{ tag: 'path', attrs: { d: 'M4 5a3 3 0 0 1 3-3h13v18H7a3 3 0 0 0-3 3V5z' } }, { tag: 'path', attrs: { d: 'M7 2v18' } }],
        alert: [{ tag: 'path', attrs: { d: 'M12 4l9 16H3l9-16z' } }, { tag: 'path', attrs: { d: 'M12 10v4M12 17h.01' } }],
        doc: [{ tag: 'path', attrs: { d: 'M14 2H6a2 2 0 0 0-2 2v16h16V8l-6-6z' } }, { tag: 'path', attrs: { d: 'M14 2v6h6M8 13h8M8 17h5' } }],
        bulb: [{ tag: 'path', attrs: { d: 'M9 18h6M10 22h4M8 14a6 6 0 1 1 8 0c-1.1 1-2 2.2-2 4h-4c0-1.8-.9-3-2-4z' } }],
        phone: [{ tag: 'path', attrs: { d: 'M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 11.2 19 19.5 19.5 0 0 1 5 12.8 19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 2.8a2 2 0 0 1-.6 1.8L7.8 9.5a16 16 0 0 0 6.7 6.7l1.2-1.2a2 2 0 0 1 1.8-.6l2.8.5a2 2 0 0 1 1.7 2z' } }],
        mail: [{ tag: 'rect', attrs: { x: '3', y: '5', width: '18', height: '14', rx: '2' } }, { tag: 'path', attrs: { d: 'M3 7l9 6 9-6' } }],
        calendar: [{ tag: 'rect', attrs: { x: '3', y: '5', width: '18', height: '16', rx: '2' } }, { tag: 'path', attrs: { d: 'M8 3v4M16 3v4M3 10h18' } }],
        pin: [{ tag: 'path', attrs: { d: 'M12 22s7-5.3 7-12a7 7 0 1 0-14 0c0 6.7 7 12 7 12z' } }, { tag: 'circle', attrs: { cx: '12', cy: '10', r: '2.5' } }],
        clock: [{ tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } }, { tag: 'path', attrs: { d: 'M12 7v6l4 2' } }],
        user: [{ tag: 'circle', attrs: { cx: '12', cy: '8', r: '4' } }, { tag: 'path', attrs: { d: 'M4 20a8 8 0 0 1 16 0' } }],
        ban: [{ tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } }, { tag: 'path', attrs: { d: 'M6 6l12 12' } }],
        refresh: [{ tag: 'path', attrs: { d: 'M21 12a9 9 0 0 1-15.4 6.4' } }, { tag: 'path', attrs: { d: 'M3 12a9 9 0 0 1 15.4-6.4' } }, { tag: 'path', attrs: { d: 'M3 4v4h4M21 20v-4h-4' } }],
        target: [{ tag: 'circle', attrs: { cx: '12', cy: '12', r: '8' } }, { tag: 'circle', attrs: { cx: '12', cy: '12', r: '4' } }, { tag: 'circle', attrs: { cx: '12', cy: '12', r: '1' } }],
        chess_king: [{ tag: 'path', attrs: { d: 'M12 3v4M10 5h4' } }, { tag: 'path', attrs: { d: 'M8 9h8l-1 4H9l-1-4z' } }, { tag: 'path', attrs: { d: 'M9 13l-1 5h8l-1-5M7 20h10' } }],
        chess_queen: [{ tag: 'circle', attrs: { cx: '6', cy: '6', r: '1' } }, { tag: 'circle', attrs: { cx: '12', cy: '5', r: '1' } }, { tag: 'circle', attrs: { cx: '18', cy: '6', r: '1' } }, { tag: 'path', attrs: { d: 'M5 9l2 7h10l2-7-4 2-3-3-3 3-4-2z' } }, { tag: 'path', attrs: { d: 'M7 20h10' } }],
        chess_knight: [{ tag: 'path', attrs: { d: 'M16 18H8l1-4 2-2-2-4 4-3 3 2-2 3h2l2 2-2 6z' } }, { tag: 'path', attrs: { d: 'M8 20h8' } }],
        chess_pawn: [{ tag: 'circle', attrs: { cx: '12', cy: '7', r: '2.5' } }, { tag: 'path', attrs: { d: 'M9.5 18h5l-1.2-5h-1.6z' } }, { tag: 'path', attrs: { d: 'M8 20h8' } }],
        spark: [{ tag: 'path', attrs: { d: 'M12 3l2.3 4.7L19 10l-4.7 2.3L12 17l-2.3-4.7L5 10l4.7-2.3L12 3z' } }]
    };

    (iconDefs[name] || iconDefs.spark).forEach(function (shape) {
        var node = document.createElementNS(SVG_NS, shape.tag);
        Object.keys(shape.attrs).forEach(function (key) {
            node.setAttribute(key, shape.attrs[key]);
        });
        svg.appendChild(node);
    });

    return svg;
}

function clearNode(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
}

function initMobileMenu() {
    var mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    var navLinks = document.querySelector('.nav-links');

    if (!mobileMenuBtn || !navLinks) return;

    mobileMenuBtn.addEventListener('click', function () {
        navLinks.classList.toggle('active');
        this.classList.toggle('active');
        this.setAttribute('aria-expanded', this.classList.contains('active') ? 'true' : 'false');

        var spans = this.querySelectorAll('span');
        if (this.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            navLinks.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');

            var spans = mobileMenuBtn.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        });
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            navLinks.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            var spans = mobileMenuBtn.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        });
    });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;

            var targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                var navbar = document.querySelector('.navbar');
                var navHeight = navbar ? navbar.offsetHeight : 0;
                var targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function initFormHandling() {
    var contactForm = document.getElementById('main-contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            await submitContactLead(this);
        });
    }

    var cubeForm = document.getElementById('cube-form');
    if (cubeForm) {
        cubeForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            await submitCubeLead(this);
        });
    }
}

async function submitContactLead(form) {
    var name = (form.querySelector('#parent-name') || {}).value || '';
    var email = (form.querySelector('#email') || {}).value || '';
    var phone = (form.querySelector('#phone') || {}).value || '';
    var interest = (form.querySelector('#interest') || {}).value || '';
    var studentAge = (form.querySelector('#student-age') || {}).value || '';
    var situation = (form.querySelector('#situation') || {}).value || '';
    var howFound = (form.querySelector('#how-found') || {}).value || '';
    var newsletter = form.querySelector('input[name="newsletter"]') && form.querySelector('input[name="newsletter"]').checked;
    var consent = form.querySelector('input[name="consent"]') && form.querySelector('input[name="consent"]').checked;

    if (!consent) {
        showInlineError(form, 'Please confirm consent before submitting.');
        return;
    }

    var payload = {
        name: String(name).trim(),
        email: String(email).trim(),
        consent: true,
        source: 'coaching_contact',
        lead_type: 'coaching_consultation',
        metadata: {
            interest: interest,
            phone: phone,
            student_age: studentAge,
            situation: situation,
            how_found: howFound,
            newsletter_opt_in: !!newsletter,
            page: window.location.pathname.split('/').pop() || 'coaching-contact.html'
        }
    };

    await submitLeadForm(form, payload, 'Thanks. Your message was sent. The ExEF coaching team will follow up within 24-48 hours.');
}

async function submitCubeLead(form) {
    var emailInput = form.querySelector('input[type="email"]');
    var childNameInput = form.querySelector('input[type="text"]');
    var consent = form.querySelector('input[name="consent"]') && form.querySelector('input[name="consent"]').checked;

    if (!consent) {
        showInlineError(form, 'Please confirm consent before requesting the challenge.');
        return;
    }

    var payload = {
        name: (childNameInput && childNameInput.value ? childNameInput.value.trim() + ' Parent' : 'Cube Challenge Parent'),
        email: emailInput ? emailInput.value.trim() : '',
        consent: true,
        source: 'coaching_cube_challenge',
        lead_type: 'cube_challenge',
        metadata: {
            child_first_name: childNameInput ? childNameInput.value.trim() : '',
            page: window.location.pathname.split('/').pop() || 'coaching-home.html'
        }
    };

    await submitLeadForm(form, payload, 'Success. Check your inbox for the Cube Challenge next steps.');
}

async function submitLeadForm(form, payload, successMessage) {
    var submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;

    clearInlineNotice(form);
    var originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    try {
        var response = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        var result = await response.json();
        if (!response.ok || !result.ok) {
            throw new Error((result && result.error) || 'Unable to submit form right now.');
        }

        trackEvent('coaching_lead_submitted', {
            lead_type: payload.lead_type,
            source: payload.source,
            page: payload.metadata && payload.metadata.page
        });

        clearNode(form);
        var success = document.createElement('div');
        success.className = 'form-success';
        success.textContent = successMessage;
        form.appendChild(success);
    } catch (err) {
        showInlineError(form, err.message || 'Submission failed. Please try again.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

function showInlineError(form, message) {
    clearInlineNotice(form);
    var errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.textContent = message;
    form.appendChild(errorDiv);
}

function clearInlineNotice(form) {
    var oldError = form.querySelector('.form-error');
    if (oldError) oldError.remove();
}

function initAnimations() {
    var observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    var animateElements = document.querySelectorAll(
        '.problem-card, .method-card, .why-card, .service-card, .testimonial-card, ' +
        '.ef-skill, .philosophy-card, .skill-card, .research-card, .faq-item'
    );

    animateElements.forEach(function (el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });

    if (!document.getElementById('coaching-animate-style')) {
        var style = document.createElement('style');
        style.id = 'coaching-animate-style';
        style.textContent = '.animate-in { opacity: 1 !important; transform: translateY(0) !important; }';
        document.head.appendChild(style);
    }

    var navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 50) {
                navbar.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
            } else {
                navbar.style.boxShadow = 'none';
            }
        }, { passive: true });
    }
}

function trackEvent(eventName, properties) {
    if (!window.fetch) return;
    if (/github\.io$/i.test(window.location.hostname)) return;
    fetch('/api/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event_name: eventName,
            page: window.location.pathname.split('/').pop() || 'coaching-home.html',
            source: 'coaching_site',
            properties: properties || {}
        }),
        keepalive: true
    }).catch(function () {});
}
