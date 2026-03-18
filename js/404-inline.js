(function () {
  var btn = document.getElementById('report-broken-link');
  var status = document.getElementById('report-status');
  if (!btn || !status) return;
  btn.addEventListener('click', function () {
    if (!(window.EFI && EFI.Analytics && EFI.Analytics.track)) {
      status.textContent = 'Unable to submit report right now.';
      return;
    }
    EFI.Analytics.track('broken_link_reported', {
      missing_path: window.location.pathname,
      referrer: document.referrer || 'direct'
    }).then(function () {
      status.textContent = 'Thanks. We logged this broken link report.';
    });
  });
})();
