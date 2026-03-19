(function () {
  var form = document.getElementById('gate-form-b');
  var out = document.getElementById('gate-out-b');
  var submit = document.getElementById('gate-submit-b');

  function clearNode(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function message(text, linkHref, linkLabel, suffix) {
    clearNode(out);
    out.appendChild(document.createTextNode(text));
    if (linkHref && linkLabel) {
      var link = document.createElement('a');
      link.href = linkHref;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = linkLabel;
      out.appendChild(link);
    }
    if (suffix) {
      out.appendChild(document.createTextNode(suffix));
    }
    out.focus();
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;

    submit.disabled = true;
    submit.textContent = 'Generating secure link...';

    var email = document.getElementById('gate-email-b').value.trim();
    var consent = document.getElementById('gate-consent-b').checked;

    try {
      var leadRes = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          consent: consent,
          lead_type: 'download_launch_plan',
          source: 'launch-plan.html'
        })
      });
      var leadData = await leadRes.json();
      if (!leadRes.ok || !leadData.ok) throw new Error(leadData.error || 'Unable to capture lead');

      var signRes = await fetch('/api/sign-download?asset=launch-plan');
      var signData = await signRes.json();
      if (!signRes.ok || !signData.ok) throw new Error(signData.error || 'Unable to sign download link');

      if (window.EFI && EFI.Analytics) {
        EFI.Analytics.track('lead_magnet_unlocked', { magnet: 'launch-plan', lead_id: leadData.lead_id || '' });
      }

      message('Access granted: ', signData.url, 'Download the 90-Day Launch Plan (PDF)', '. Link expires in 15 minutes.');
    } catch (err) {
      if (window.EFI && EFI.Analytics) {
        EFI.Analytics.track('lead_magnet_error', { magnet: 'launch-plan', error: String(err.message || err) });
      }
      message('Unable to unlock download right now. Please try again in a moment.');
    } finally {
      submit.disabled = false;
      submit.textContent = 'Unlock PDF';
    }
  });
})();
