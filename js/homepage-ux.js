(function () {
  'use strict';

  // Pointer-based swipe helper. Works for touch, pen, and mouse drag.
  // Calls onSwipe(direction) where direction is -1 (left -> next) or 1 (right -> prev).
  function attachSwipe(target, onSwipe, opts) {
    if (!target) return;
    var threshold = (opts && opts.threshold) || 40;     // px before it counts
    var verticalGuard = (opts && opts.verticalGuard) || 1.2; // |dx|/|dy| must exceed this
    var startX = 0, startY = 0, tracking = false, captured = false, pointerId = null;

    function onDown(e) {
      // Ignore non-primary buttons for mouse
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      tracking = true;
      captured = false;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
    }
    function onMove(e) {
      if (!tracking || e.pointerId !== pointerId) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      // If they're clearly scrolling vertically, abandon.
      if (!captured && Math.abs(dy) > 12 && Math.abs(dx) < Math.abs(dy)) {
        tracking = false;
        return;
      }
      if (!captured && Math.abs(dx) > 8) {
        captured = true;
        try { target.setPointerCapture(pointerId); } catch (err) {}
      }
      if (captured) {
        // Block the page from scrolling horizontally with the gesture.
        e.preventDefault();
      }
    }
    function onUp(e) {
      if (!tracking || e.pointerId !== pointerId) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      var wasCaptured = captured;
      tracking = false;
      try { target.releasePointerCapture(pointerId); } catch (err) {}
      pointerId = null;
      var triggered = Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy) * verticalGuard;
      if (triggered) onSwipe(dx < 0 ? -1 : 1);
      // If the gesture was a real horizontal drag, suppress the click that
      // would otherwise fire on whatever (link, button) we landed on.
      if (wasCaptured || triggered) suppressNextClick = true;
    }
    function onCancel() { tracking = false; pointerId = null; }

    var suppressNextClick = false;
    target.addEventListener('click', function (e) {
      if (suppressNextClick) {
        e.preventDefault();
        e.stopPropagation();
        suppressNextClick = false;
      }
    }, true);

    target.addEventListener('pointerdown', onDown);
    target.addEventListener('pointermove', onMove, { passive: false });
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onCancel);
    target.addEventListener('lostpointercapture', onCancel);
    // Hint to browsers that horizontal pan is consumed by us.
    target.style.touchAction = 'pan-y';
  }

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
        dot.addEventListener('click', function () {
          if (isMobileCarousel()) {
            scrollToCard(idx);
          } else {
            show(idx);
            restart();
          }
        });
        dotsHost.appendChild(dot);
        dots.push(dot);
      });
    }

    function scrollToCard(idx) {
      var target = cards[idx];
      if (!target) return;
      var stageRect = stage.getBoundingClientRect();
      var targetRect = target.getBoundingClientRect();
      stage.scrollTo({
        left: stage.scrollLeft + (targetRect.left - stageRect.left),
        behavior: 'smooth'
      });
    }

    function show(idx) {
      current = (idx + cards.length) % cards.length;
      var mobile = isMobileCarousel();
      cards.forEach(function (card, i) {
        var isActive = i === current;
        card.classList.toggle('is-active', isActive);
        // On mobile, all cards are visible side-by-side via native scroll-snap.
        card.hidden = mobile ? false : !isActive;
        card.setAttribute('aria-hidden', mobile ? 'false' : (isActive ? 'false' : 'true'));
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
      });
    }

    // Update active dot as the user swipes through the native scroll on mobile.
    var scrollSyncTimer = null;
    stage.addEventListener('scroll', function () {
      if (!isMobileCarousel()) return;
      if (scrollSyncTimer) window.clearTimeout(scrollSyncTimer);
      scrollSyncTimer = window.setTimeout(function () {
        var stageRect = stage.getBoundingClientRect();
        var stageCenter = stageRect.left + stageRect.width / 2;
        var nearestIdx = 0;
        var nearestDelta = Infinity;
        cards.forEach(function (card, i) {
          var r = card.getBoundingClientRect();
          var center = r.left + r.width / 2;
          var delta = Math.abs(center - stageCenter);
          if (delta < nearestDelta) {
            nearestDelta = delta;
            nearestIdx = i;
          }
        });
        if (nearestIdx !== current) {
          current = nearestIdx;
          dots.forEach(function (dot, i) {
            dot.classList.toggle('is-active', i === current);
          });
          cards.forEach(function (card, i) {
            card.classList.toggle('is-active', i === current);
          });
        }
      }, 80);
    }, { passive: true });

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

    // Desktop only: pointer-drag swipe over a single visible card.
    // Mobile uses native CSS scroll-snap (see .insight-carousel__stage in CSS).
    attachSwipe(carousel, function (dir) {
      if (isMobileCarousel()) return;
      if (dir < 0) show(current + 1);
      else show(current - 1);
      restart();
    });
  }

  // Tile carousel (assessments + resources, three at a time, smooth cycle)
  var tileCarousel = document.querySelector('[data-tile-carousel]');
  if (tileCarousel) {
    var track = tileCarousel.querySelector('[data-tile-track]');
    var viewport = tileCarousel.querySelector('[data-tile-viewport]');
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

    function render() {
      if (!items.length || !track) return;
      var mobile = isMobileTiles();

      if (mobile) {
        // Native scroll on mobile - don't fight it with transforms or disabled buttons.
        track.style.transform = '';
        if (prevBtn) prevBtn.disabled = false;
        if (nextBtn) nextBtn.disabled = false;
        if (tileDotsHost) {
          var mDots = Array.prototype.slice.call(tileDotsHost.children);
          mDots.forEach(function (dot, i) {
            dot.classList.toggle('is-active', i === pageIndex);
          });
        }
        return;
      }

      var vc = visibleCount();
      var first = items[0];
      var style = window.getComputedStyle(track);
      var gap = parseFloat(style.columnGap || style.gap || '0') || 0;
      var itemWidth = first.getBoundingClientRect().width;
      var offset = pageIndex * (itemWidth + gap);
      track.style.transform = 'translateX(' + (-offset) + 'px)';

      if (prevBtn) prevBtn.disabled = pageIndex <= 0;
      if (nextBtn) nextBtn.disabled = pageIndex >= items.length - vc;

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
      var mobile = isMobileTiles();
      var pages = mobile
        ? items.length
        : Math.max(1, items.length - visibleCount() + 1);
      for (var i = 0; i < pages; i++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'tile-carousel__dot';
        dot.setAttribute('aria-label', 'Show tiles starting at ' + (i + 1));
        (function (idx) {
          dot.addEventListener('click', function () {
            if (isMobileTiles()) {
              scrollTileTo(idx);
            } else {
              goTo(idx);
              tileRestart();
            }
          });
        })(i);
        tileDotsHost.appendChild(dot);
      }
    }

    function scrollTileTo(idx) {
      var target = items[idx];
      if (!target || !viewport) return;
      var vpRect = viewport.getBoundingClientRect();
      var tgtRect = target.getBoundingClientRect();
      var delta = (tgtRect.left + tgtRect.width / 2) - (vpRect.left + vpRect.width / 2);
      viewport.scrollTo({
        left: viewport.scrollLeft + delta,
        behavior: 'smooth'
      });
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

    if (prevBtn) prevBtn.addEventListener('click', function () {
      if (isMobileTiles()) {
        scrollTileTo(Math.max(0, pageIndex - 1));
      } else {
        goTo(pageIndex - 1);
        tileRestart();
      }
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      if (isMobileTiles()) {
        scrollTileTo(Math.min(items.length - 1, pageIndex + 1));
      } else {
        goTo(pageIndex + 1);
        tileRestart();
      }
    });

    tileCarousel.addEventListener('mouseenter', function () { tilePaused = true; });
    tileCarousel.addEventListener('mouseleave', function () { tilePaused = false; });
    tileCarousel.addEventListener('focusin', function () { tilePaused = true; });
    tileCarousel.addEventListener('focusout', function () { tilePaused = false; });

    // Keyboard navigation: ArrowLeft/ArrowRight when focus is inside the carousel
    tileCarousel.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      if (isMobileTiles()) {
        var nextIdx = e.key === 'ArrowRight'
          ? Math.min(items.length - 1, pageIndex + 1)
          : Math.max(0, pageIndex - 1);
        scrollTileTo(nextIdx);
      } else {
        goTo(pageIndex + (e.key === 'ArrowRight' ? 1 : -1));
        tileRestart();
      }
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) tilePaused = true;
    });

    // Update active dot in real time as the user swipes the native scroll on mobile.
    if (viewport) {
      var tileScrollSyncTimer = null;
      viewport.addEventListener('scroll', function () {
        if (!isMobileTiles()) return;
        if (tileScrollSyncTimer) window.clearTimeout(tileScrollSyncTimer);
        tileScrollSyncTimer = window.setTimeout(function () {
          var vpRect = viewport.getBoundingClientRect();
          var center = vpRect.left + vpRect.width / 2;
          var nearest = 0;
          var nearestDelta = Infinity;
          items.forEach(function (item, i) {
            var r = item.getBoundingClientRect();
            var d = Math.abs((r.left + r.width / 2) - center);
            if (d < nearestDelta) {
              nearestDelta = d;
              nearest = i;
            }
          });
          if (nearest !== pageIndex) {
            pageIndex = nearest;
            render();
          }
        }, 80);
      }, { passive: true });
    }

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        buildDots();
        var maxIdx = isMobileTiles()
          ? items.length - 1
          : items.length - visibleCount();
        if (pageIndex > Math.max(0, maxIdx)) {
          pageIndex = Math.max(0, maxIdx);
        }
        render();
      }, 120);
    });

    buildDots();
    render();
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(render);
    });
    window.addEventListener('load', render);
    tileStart();

    // Desktop only: pointer-drag swipe (mobile is native scroll).
    attachSwipe(tileCarousel, function (dir) {
      if (isMobileTiles()) return;
      if (dir < 0) goTo(pageIndex + 1);
      else goTo(pageIndex - 1);
      tileRestart();
    });
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
