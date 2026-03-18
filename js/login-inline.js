(function() {
  // If already logged in, redirect to dashboard
  if (EFI.Auth.isLoggedIn()) {
    var params = new URLSearchParams(window.location.search);
    window.location.href = params.get('redirect') || 'dashboard.html';
    return;
  }

  var loginPanel = document.getElementById('login-panel');
  var registerPanel = document.getElementById('register-panel');
  var heroTitle = document.getElementById('auth-hero-title');
  var heroLead = document.getElementById('auth-hero-lead');

  function setAuthMode(mode) {
    var isRegister = mode === 'register';
    loginPanel.style.display = isRegister ? 'none' : 'block';
    registerPanel.style.display = isRegister ? 'block' : 'none';
    if (heroTitle) {
      heroTitle.textContent = isRegister ? 'Welcome' : 'Welcome Back';
    }
    if (heroLead) {
      heroLead.textContent = isRegister
        ? 'Create an account to access your EFI dashboard, keep purchases attached to one member record, and track certification progress over time.'
        : 'Log in to access your dashboard, purchase records, released grading results, and certificate verification links.';
    }
  }

  document.getElementById('show-register').addEventListener('click', function() {
    setAuthMode('register');
  });

  document.getElementById('show-login').addEventListener('click', function() {
    setAuthMode('login');
  });

  // Login
  document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    var errEl = document.getElementById('login-error');
    errEl.hidden = true;
    var email = document.getElementById('login-email').value;
    var pw = document.getElementById('login-password').value;
    var result = await EFI.Auth.login(email, pw);
    if (result.ok) {
      var params = new URLSearchParams(window.location.search);
      window.location.href = params.get('redirect') || 'dashboard.html';
    } else {
      errEl.textContent = result.error;
      errEl.hidden = false;
    }
  });

  // Register
  document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    var errEl = document.getElementById('register-error');
    errEl.hidden = true;
    var name = document.getElementById('reg-name').value;
    var email = document.getElementById('reg-email').value;
    var pw = document.getElementById('reg-password').value;
    var pw2 = document.getElementById('reg-password2').value;
    if (pw !== pw2) {
      errEl.textContent = 'Passwords do not match.';
      errEl.hidden = false;
      return;
    }
    var result = await EFI.Auth.register(name, email, pw);
    if (result.ok) {
      window.location.href = 'dashboard.html';
    } else {
      errEl.textContent = result.error;
      errEl.hidden = false;
    }
  });
})();
