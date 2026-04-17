(function () {
  'use strict';

  var track = document.querySelector('[data-insight-track]');
  var prev = document.querySelector('[data-carousel-prev]');
  var next = document.querySelector('[data-carousel-next]');
  var indexEl = document.querySelector('[data-carousel-index]');

  function updateCarouselIndex() {
    if (!track || !indexEl) return;
    var cards = Array.prototype.slice.call(track.children);
    if (!cards.length) return;
    var closestIndex = 0;
    var closestDistance = Infinity;
    var left = track.scrollLeft;
    cards.forEach(function (card, idx) {
      var distance = Math.abs(card.offsetLeft - left);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = idx;
      }
    });
    indexEl.textContent = String(closestIndex + 1);
  }

  function scrollByCard(direction) {
    if (!track) return;
    var width = track.firstElementChild ? track.firstElementChild.getBoundingClientRect().width : track.clientWidth;
    track.scrollBy({ left: direction * (width + 24), behavior: 'smooth' });
  }

  if (prev) prev.addEventListener('click', function () { scrollByCard(-1); });
  if (next) next.addEventListener('click', function () { scrollByCard(1); });
  if (track) {
    track.addEventListener('scroll', function () {
      window.requestAnimationFrame(updateCarouselIndex);
    }, { passive: true });
    updateCarouselIndex();
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
