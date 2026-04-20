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
      cards.forEach(function (card, i) {
        card.classList.toggle('is-active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
      });
    }

    function advance() {
      if (paused) return;
      show(current + 1);
    }

    function start() {
      stop();
      timer = window.setInterval(advance, INTERVAL);
    }

    function stop() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }

    function restart() { stop(); start(); }

    document.addEventListener('visibilitychange', function () {
      paused = document.hidden;
    });

    show(0);
    start();
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
