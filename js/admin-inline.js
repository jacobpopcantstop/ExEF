document.addEventListener('DOMContentLoaded', function () {
  if (!EFI.Auth.requireRole(['admin', 'reviewer'], 'dashboard.html')) return;
  document.getElementById('year').textContent = new Date().getFullYear();
});
