// Extracted from coaching-home.html so it runs under the site CSP (script-src 'self').
(function () {
  var form = document.getElementById('specialist-selector-form');
  if (!form) return;
  var errorEl = document.getElementById('specialist-selector-error');
  var resultEl = document.getElementById('specialist-selector-result');
  var headline = document.getElementById('specialist-selector-headline');
  var rationale = document.getElementById('specialist-selector-rationale');
  var secondary = document.getElementById('specialist-selector-secondary');
  var ctaEl = document.getElementById('specialist-selector-cta');
  var resetBtn = document.getElementById('specialist-selector-reset');

  var LANES = {
    coach: {
      label: 'EF coaching with Jacob',
      person: 'Jacob Rozansky',
      short: 'coaching',
      why: 'building adult systems, ADHD-aware planning, and follow-through',
      target: '#coaching-packages',
      cta: 'See coaching packages'
    },
    ed: {
      label: 'Educational specialist work with Diamond',
      person: 'Diamond B.',
      short: 'educational specialist',
      why: 'school systems, IEP/504 translation, and student routines',
      target: '#ed-specialist-services',
      cta: 'See Ed Specialist services'
    },
    ot: {
      label: 'Occupational therapy with Cole',
      person: 'Cole M.',
      short: 'occupational therapy',
      why: 'sensory regulation, daily living, and motor-driven bottlenecks',
      target: '#ot-services',
      cta: 'See OT services'
    }
  };

  function tally() {
    var checked = form.querySelectorAll('input[name="specialist-need"]:checked');
    var scores = { coach: 0, ed: 0, ot: 0 };
    checked.forEach(function (input) {
      var lane = input.getAttribute('data-lane');
      if (scores[lane] !== undefined) scores[lane] += 1;
    });
    return { scores: scores, count: checked.length };
  }

  function rank(scores) {
    return Object.keys(scores)
      .map(function (key) { return { lane: key, score: scores[key] }; })
      .sort(function (a, b) { return b.score - a.score; });
  }

  function renderResult(ranked, total) {
    var top = ranked[0];
    var second = ranked[1];
    var topLane = LANES[top.lane];
    resultEl.hidden = false;

    var allTied = ranked.every(function (r) { return r.score === ranked[0].score; });
    if (allTied && total >= 3) {
      headline.textContent = 'All three lanes overlap for you.';
      rationale.textContent = 'You checked items spread evenly across coaching, educational specialist, and OT scope. A 30-minute consultation will sort the sequence faster than another form.';
      ctaEl.textContent = 'Book a consult';
      ctaEl.setAttribute('href', 'https://calendly.com/jacobansky/30min?utm_source=coaching-home&amp;utm_content=selector-all-lanes');
      secondary.hidden = true;
      return;
    }

    headline.textContent = topLane.label + ' looks like the best fit.';
    rationale.textContent = 'Your answers cluster around ' + topLane.why + '. ' + topLane.person + ' leads that lane.';
    ctaEl.textContent = topLane.cta;
    ctaEl.setAttribute('href', topLane.target);

    if (second && second.score > 0 && (top.score - second.score) <= 1 && second.lane !== top.lane) {
      secondary.hidden = false;
      secondary.textContent = 'Close runner-up: ' + LANES[second.lane].short + '. Mention it on the consult so we can sequence both.';
    } else {
      secondary.hidden = true;
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var result = tally();
    if (result.count === 0) {
      errorEl.hidden = false;
      resultEl.hidden = true;
      return;
    }
    errorEl.hidden = true;
    var ranked = rank(result.scores);
    renderResult(ranked, result.count);
    if (window.EFI && window.EFI.Analytics && typeof window.EFI.Analytics.track === 'function') {
      window.EFI.Analytics.track('specialist_selector_result', {
        top_lane: ranked[0].lane,
        top_score: ranked[0].score,
        total_checked: result.count,
        scores: result.scores
      });
    }
    if (typeof resultEl.focus === 'function') {
      resultEl.setAttribute('tabindex', '-1');
      resultEl.focus({ preventScroll: false });
    }
    window.setTimeout(function () { resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
  });

  resetBtn.addEventListener('click', function () {
    resultEl.hidden = true;
    errorEl.hidden = true;
  });
})();

(function () {
  var form = document.getElementById('ot-interest-form');
  if (!form) return;
  var emailEl = document.getElementById('ot-interest-email');
  var errorEl = document.getElementById('ot-interest-error');
  var successEl = document.getElementById('ot-interest-success');
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = (emailEl.value || '').trim();
    if (!EMAIL_RE.test(email)) {
      errorEl.hidden = false;
      emailEl.focus();
      return;
    }
    errorEl.hidden = true;
    var focus = Array.prototype.map.call(
      form.querySelectorAll('input[name="ot-focus"]:checked'),
      function (cb) { return cb.value; }
    );
    if (window.EFI && window.EFI.Analytics && typeof window.EFI.Analytics.track === 'function') {
      window.EFI.Analytics.track('ot_interest_list_signup', {
        email: email,
        focus: focus
      });
    }
    form.hidden = true;
    successEl.hidden = false;
    if (typeof successEl.focus === 'function') {
      successEl.setAttribute('tabindex', '-1');
      successEl.focus({ preventScroll: false });
    }
  });
})();
