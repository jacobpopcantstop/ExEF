(function () {
  'use strict';

  // Shared results-capture block for free tools and quizzes. A page opts in
  // with <div id="tool-lead-capture" data-tool="brain-mode-quiz"> and this
  // script renders the ESQ-R-style email capture card plus a UTM-tagged
  // consultation CTA, posting to the same /api/leads pipeline as esqr.js.

  var CALENDLY_BASE = 'https://calendly.com/jacobansky/30min';

  function trackEvent(name, props) {
    try {
      if (window.EFI && window.EFI.Analytics && typeof window.EFI.Analytics.track === 'function') {
        window.EFI.Analytics.track(name, props || {});
      }
    } catch (e) {}
  }

  function pageSlug() {
    var page = window.location.pathname.split('/').pop() || 'index.html';
    return page.replace(/\.html$/, '');
  }

  function bookingUrl(tool) {
    return CALENDLY_BASE + '?utm_source=' + encodeURIComponent(tool) +
      '&utm_medium=site&utm_content=results-next-step';
  }

  function render(mount) {
    var tool = mount.getAttribute('data-tool') || pageSlug();
    var toolLabel = mount.getAttribute('data-tool-label') || 'this tool';
    var url = bookingUrl(tool);

    mount.innerHTML =
      '<div class="container" style="max-width:var(--max-width-narrow);">' +
        '<div class="card" style="margin-top:var(--space-xl);">' +
          '<h3 style="margin-top:0;">Save your results + get the right next step</h3>' +
          '<p style="color:var(--color-text-light);">Enter your email to keep what ' + toolLabel + ' showed you and receive related ExEF tools, planning resources, and occasional updates.</p>' +
          '<form class="tlc-form">' +
            '<div class="grid grid--2" style="gap:var(--space-md);">' +
              '<div class="form-group">' +
                '<label for="tlc-name">Name</label>' +
                '<input id="tlc-name" class="form-control" type="text" autocomplete="name" placeholder="Your name">' +
              '</div>' +
              '<div class="form-group">' +
                '<label for="tlc-email">Email</label>' +
                '<input id="tlc-email" class="form-control" type="email" autocomplete="email" required placeholder="you@example.com">' +
              '</div>' +
            '</div>' +
            '<label style="display:flex;gap:0.5rem;align-items:flex-start;margin:var(--space-sm) 0;">' +
              '<input id="tlc-consent" type="checkbox" required style="margin-top:0.3rem;">' +
              '<span>I agree to receive ExEF resources, updates, and occasional offers. I can unsubscribe anytime.</span>' +
            '</label>' +
            '<div class="button-group" style="margin-top:var(--space-md);">' +
              '<button type="submit" class="btn btn--primary btn--sm">Save + Subscribe</button>' +
              '<span class="tlc-status" style="color:var(--color-text-muted);" role="status" aria-live="polite"></span>' +
            '</div>' +
          '</form>' +
        '</div>' +
        '<div class="card" style="margin-top:var(--space-xl);border:1px solid var(--color-primary);background:linear-gradient(135deg,rgba(26,82,118,0.04),rgba(255,255,255,0.98));">' +
          '<span class="section-header__tag" style="margin-bottom:var(--space-sm);display:inline-block;">Coaching next step</span>' +
          '<h3 style="margin-top:0;">Want help reading the pattern?</h3>' +
          '<p style="color:var(--color-text-light);margin-bottom:var(--space-md);">A free 30-minute consultation takes what this tool surfaced and maps it to a practical next step &mdash; or tells you honestly that the free tools are enough for now.</p>' +
          '<a href="' + url + '" class="btn btn--primary" data-analytics-event="book_call_click" data-analytics-label="' + tool + '-results-cta" target="_blank" rel="noopener">Book a 30-minute consultation</a>' +
        '</div>' +
      '</div>';

    var form = mount.querySelector('.tlc-form');
    var status = mount.querySelector('.tlc-status');
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      var email = mount.querySelector('#tlc-email').value.trim();
      var name = mount.querySelector('#tlc-name').value.trim();
      var consent = mount.querySelector('#tlc-consent').checked;
      if (!email || !consent) {
        status.textContent = 'Enter your email and check the consent box first.';
        return;
      }
      var submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      status.textContent = 'Saving...';
      try {
        var response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name,
            email: email,
            consent: true,
            source: tool,
            lead_type: 'tool_results',
            metadata: { tool: tool, page: pageSlug() + '.html' }
          })
        });
        var body = await response.json();
        if (!response.ok || !body.ok) throw new Error((body && body.error) || 'Unable to save right now.');
        trackEvent('tool_lead_submitted', { tool: tool });
        status.textContent = 'Saved. Check your inbox for your ExEF resources.';
        form.reset();
      } catch (err) {
        status.textContent = err.message || 'Unable to save right now. Please try again.';
        submit.disabled = false;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var mount = document.getElementById('tool-lead-capture');
    if (mount) render(mount);
  });
})();
