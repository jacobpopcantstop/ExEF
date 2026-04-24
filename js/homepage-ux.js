(function () {
  'use strict';

  var carousel = document.querySelector('[data-insight-carousel]');
  var stage = document.querySelector('[data-insight-stage]');
  var dotsHost = document.querySelector('[data-insight-dots]');

  if (carousel && stage) {
    var cards = Array.prototype.slice.call(stage.querySelectorAll('.insight-card'));
    var current = 0;
    var timer = null;
    var INTERVAL = 6500;
    var paused = false;

    function isMobileCarousel() {
      return window.matchMedia('(max-width: 640px)').matches;
    }

    var dots = [];
    if (dotsHost) {
      cards.forEach(function (_, idx) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'insight-carousel__dot';
        dot.setAttribute('aria-label', 'Show fact ' + (idx + 1));
        dot.addEventListener('click', function () { show(idx); restart(); });
        dotsHost.appendChild(dot);
        dots.push(dot);
      });
    }

    function show(idx) {
      current = (idx + cards.length) % cards.length;
      var mobile = isMobileCarousel();
      cards.forEach(function (card, i) {
        var isActive = i === current;
        card.classList.toggle('is-active', isActive);
        card.hidden = mobile ? false : !isActive;
        card.setAttribute('aria-hidden', mobile ? 'false' : (isActive ? 'false' : 'true'));
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
      });
    }

    function start() {
      stop();
      if (isMobileCarousel()) return;
      timer = window.setTimeout(tick, INTERVAL);
    }

    function stop() {
      if (timer) { window.clearTimeout(timer); timer = null; }
    }

    function restart() { stop(); start(); }

    function tick() {
      if (!paused) {
        show(current + 1);
      }
      start();
    }

    document.addEventListener('visibilitychange', function () {
      paused = document.hidden;
      if (paused) {
        stop();
      } else {
        restart();
      }
    });

    carousel.addEventListener('mouseenter', function () {
      paused = true;
      stop();
    });

    carousel.addEventListener('mouseleave', function () {
      paused = false;
      restart();
    });

    carousel.addEventListener('focusin', function () {
      paused = true;
      stop();
    });

    carousel.addEventListener('focusout', function () {
      paused = false;
      restart();
    });

    function applyInsightLayoutMode() {
      if (isMobileCarousel()) {
        stop();
      } else if (!document.hidden) {
        start();
      }
      show(current);
    }

    show(0);
    applyInsightLayoutMode();
    window.addEventListener('resize', applyInsightLayoutMode);
  }

  // Tile carousel (assessments + resources, three at a time, smooth cycle)
  var tileCarousel = document.querySelector('[data-tile-carousel]');
  if (tileCarousel) {
    var track = tileCarousel.querySelector('[data-tile-track]');
    var items = track ? Array.prototype.slice.call(track.children) : [];
    var prevBtn = tileCarousel.querySelector('[data-tile-prev]');
    var nextBtn = tileCarousel.querySelector('[data-tile-next]');
    var tileDotsHost = tileCarousel.querySelector('[data-tile-dots]');
    var tilePaused = false;
    var tileTimer = null;
    var TILE_INTERVAL = 5200;

    function visibleCount() {
      var w = window.innerWidth;
      if (w <= 640) return 1;
      if (w <= 960) return 2;
      return 3;
    }

    function isMobileTiles() {
      return window.matchMedia('(max-width: 640px)').matches;
    }

    var pageIndex = 0;

    function pageCount() {
      var vc = visibleCount();
      return Math.max(1, items.length - vc + 1);
    }

    function render() {
      if (!items.length || !track) return;
      var vc = visibleCount();
      if (isMobileTiles()) {
        track.style.transform = 'none';
      } else {
        var first = items[0];
        var style = window.getComputedStyle(track);
        var gap = parseFloat(style.columnGap || style.gap || '0') || 0;
        var itemWidth = first.getBoundingClientRect().width;
        var offset = pageIndex * (itemWidth + gap);
        track.style.transform = 'translateX(' + (-offset) + 'px)';
      }

      if (prevBtn) prevBtn.disabled = isMobileTiles() || pageIndex <= 0;
      if (nextBtn) nextBtn.disabled = isMobileTiles() || pageIndex >= items.length - vc;

      if (tileDotsHost) {
        var dots = Array.prototype.slice.call(tileDotsHost.children);
        dots.forEach(function (dot, i) {
          dot.classList.toggle('is-active', i === pageIndex);
        });
      }
    }

    function buildDots() {
      if (!tileDotsHost) return;
      tileDotsHost.innerHTML = '';
      var vc = visibleCount();
      var pages = Math.max(1, items.length - vc + 1);
      for (var i = 0; i < pages; i++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'tile-carousel__dot';
        dot.setAttribute('aria-label', 'Show tiles starting at ' + (i + 1));
        (function (idx) {
          dot.addEventListener('click', function () { goTo(idx); tileRestart(); });
        })(i);
        tileDotsHost.appendChild(dot);
      }
    }

    function goTo(idx) {
      var max = items.length - visibleCount();
      if (max < 0) max = 0;
      if (idx < 0) idx = max;
      if (idx > max) idx = 0;
      pageIndex = idx;
      render();
    }

    function tileAdvance() {
      if (tilePaused || isMobileTiles()) return;
      goTo(pageIndex + 1);
    }

    function tileStart() {
      tileStop();
      if (isMobileTiles()) return;
      tileTimer = window.setInterval(tileAdvance, TILE_INTERVAL);
    }

    function tileStop() {
      if (tileTimer) { window.clearInterval(tileTimer); tileTimer = null; }
    }

    function tileRestart() { tileStop(); tileStart(); }

    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(pageIndex - 1); tileRestart(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(pageIndex + 1); tileRestart(); });

    tileCarousel.addEventListener('mouseenter', function () { tilePaused = true; });
    tileCarousel.addEventListener('mouseleave', function () { tilePaused = false; });
    tileCarousel.addEventListener('focusin', function () { tilePaused = true; });
    tileCarousel.addEventListener('focusout', function () { tilePaused = false; });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) tilePaused = true;
    });

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        buildDots();
        if (pageIndex > items.length - visibleCount()) {
          pageIndex = Math.max(0, items.length - visibleCount());
        }
        render();
      }, 120);
    });

    buildDots();
    render();
    // Re-render after layout settles (fonts/images) so the first prev/next click
    // has correct measurements.
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(render);
    });
    window.addEventListener('load', render);
    tileStart();
  }

  var NEWSLETTER_DISMISS_KEY = 'exef_newsletter_dismissed_v1';
  var strip = document.getElementById('newsletter-strip');
  var form = document.getElementById('homepage-newsletter-form');
  var dismiss = document.getElementById('homepage-newsletter-dismiss');
  var status = document.getElementById('homepage-newsletter-status');

  function setStatus(message, isError) {
    if (!status) return;
    status.textContent = message;
    status.style.color = isError ? 'var(--color-danger, #b42318)' : 'var(--color-text-muted)';
  }

  function hideStrip(persist) {
    if (strip) strip.hidden = true;
    if (persist) {
      try { localStorage.setItem(NEWSLETTER_DISMISS_KEY, '1'); } catch (err) {}
    }
  }

  try {
    if (localStorage.getItem(NEWSLETTER_DISMISS_KEY) === '1') hideStrip(false);
  } catch (err) {}

  if (dismiss) {
    dismiss.addEventListener('click', function () {
      setStatus('You can always join later from another page.', false);
      hideStrip(true);
    });
  }

  if (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;

      var submit = form.querySelector('button[type="submit"]');
      var original = submit ? submit.textContent : '';
      var name = (document.getElementById('homepage-newsletter-name') || {}).value || '';
      var email = (document.getElementById('homepage-newsletter-email') || {}).value || '';

      if (submit) {
        submit.disabled = true;
        submit.textContent = 'Joining...';
      }
      setStatus('Saving your preference...', false);

      try {
        var response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: String(name).trim(),
            email: String(email).trim(),
            consent: true,
            source: 'homepage_newsletter',
            lead_type: 'mailing_list',
            metadata: {
              page: 'index.html',
              newsletter_opt_in: true
            }
          })
        });
        var body = await response.json();
        if (!response.ok || !body.ok) throw new Error((body && body.error) || 'Unable to subscribe right now.');
        setStatus('You are on the list. Watch for assessments, curriculum drops, and new tools.', false);
        form.reset();
        window.setTimeout(function () { hideStrip(true); }, 1600);
      } catch (err) {
        setStatus(err.message || 'Unable to subscribe right now.', true);
      } finally {
        if (submit) {
          submit.disabled = false;
          submit.textContent = original;
        }
      }
    });
  }
})();
