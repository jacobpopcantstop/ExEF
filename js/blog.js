(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  var form = document.getElementById('blog-newsletter-form');
  var status = document.getElementById('blog-newsletter-status');

  if (!form) {
    return;
  }

  function setStatus(message, isError) {
    if (!status) return;
    status.textContent = message;
    status.style.color = isError ? 'var(--color-danger, #b42318)' : 'var(--color-text-muted)';
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;

    var submit = form.querySelector('button[type="submit"]');
    var original = submit ? submit.textContent : '';
    var name = (document.getElementById('blog-newsletter-name') || {}).value || '';
    var email = (document.getElementById('blog-newsletter-email') || {}).value || '';

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
          source: 'blog_newsletter',
          lead_type: 'mailing_list',
          metadata: {
            page: 'blog.html',
            newsletter_opt_in: true
          }
        })
      });
      var body = await response.json();
      if (!response.ok || !body.ok) throw new Error((body && body.error) || 'Unable to subscribe right now.');
      setStatus('You are on the list. New posts land every Friday.', false);
      form.reset();
    } catch (err) {
      setStatus(err.message || 'Unable to subscribe right now.', true);
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.textContent = original;
      }
    }
  });
})();
