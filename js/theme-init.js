(function () {
  // Dark mode is intentionally retired. The brand palette is warm paper + ink;
  // the dark theme produced inconsistent grey washes that never matched the rest
  // of the site. This migration clears any stale dark-mode preference from
  // localStorage and ensures no [data-theme="dark"] is applied on load.
  try {
    localStorage.removeItem('efi_theme');
  } catch (err) {}
  document.documentElement.removeAttribute('data-theme');
})();
