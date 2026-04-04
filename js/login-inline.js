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
  var demoBtn = document.getElementById('demo-account-btn');
  var demoStatus = document.getElementById('demo-account-status');

  function redirectAfterAuth() {
    var params = new URLSearchParams(window.location.search);
    window.location.href = params.get('redirect') || 'dashboard.html';
  }

  function hashPasswordLegacy(pw) {
    var hash = 0;
    for (var i = 0; i < pw.length; i++) {
      var ch = pw.charCodeAt(i);
      hash = ((hash << 5) - hash) + ch;
      hash |= 0;
    }
    return 'h' + Math.abs(hash).toString(36);
  }

  function makeCredentialId(email) {
    var lower = String(email || '').toLowerCase();
    var hash = 0;
    for (var i = 0; i < lower.length; i++) {
      hash = ((hash << 5) - hash) + lower.charCodeAt(i);
      hash |= 0;
    }
    return 'EFI-CEFC-' + Math.abs(hash).toString(36).toUpperCase().substring(0, 8);
  }

  function buildDemoPayload() {
    var email = 'demo-preview@exef.org';
    var password = 'EFIDemo2026';
    var name = 'EFI Demo Learner';
    var createdAt = '2026-02-20T15:30:00.000Z';
    var credentialId = makeCredentialId(email);
    var certificateReceipt = 'demo-preview';
    var progress = {
      modules: {
        '1': true,
        '2': true,
        '3': true,
        '4': true,
        '5': true,
        '6': true
      },
      moduleAssessments: {
        '1': { moduleId: '1', score: 94, correct: 17, total: 18, passed: true, completedAt: '2026-02-24T16:00:00.000Z', savedAt: '2026-02-24T16:00:00.000Z' },
        '2': { moduleId: '2', score: 91, correct: 16, total: 18, passed: true, completedAt: '2026-02-27T16:00:00.000Z', savedAt: '2026-02-27T16:00:00.000Z' },
        '3': { moduleId: '3', score: 96, correct: 18, total: 19, passed: true, completedAt: '2026-03-02T16:00:00.000Z', savedAt: '2026-03-02T16:00:00.000Z' },
        '4': { moduleId: '4', score: 89, correct: 16, total: 18, passed: true, completedAt: '2026-03-06T16:00:00.000Z', savedAt: '2026-03-06T16:00:00.000Z' },
        '5': { moduleId: '5', score: 93, correct: 14, total: 15, passed: true, completedAt: '2026-03-10T16:00:00.000Z', savedAt: '2026-03-10T16:00:00.000Z' },
        '6': { moduleId: '6', score: 97, correct: 18, total: 19, passed: true, completedAt: '2026-03-14T16:00:00.000Z', savedAt: '2026-03-14T16:00:00.000Z' }
      },
      esqrCompleted: true,
      submissions: {
        '1': { status: 'released', submittedAt: '2026-02-24T15:00:00.000Z', releaseAt: '2026-02-26T18:00:00.000Z', score: 94, feedback: 'Concept application is accurate and clinically grounded.' },
        '2': { status: 'released', submittedAt: '2026-02-27T15:00:00.000Z', releaseAt: '2026-03-01T18:00:00.000Z', score: 91, feedback: 'Assessment reasoning is clear and appropriately conservative.' },
        '3': { status: 'released', submittedAt: '2026-03-02T15:00:00.000Z', releaseAt: '2026-03-04T18:00:00.000Z', score: 96, feedback: 'Coaching framework aligns tightly with the learner profile.' },
        '4': { status: 'released', submittedAt: '2026-03-06T15:00:00.000Z', releaseAt: '2026-03-08T18:00:00.000Z', score: 89, feedback: 'Applied methods are strong and implementation-ready.' },
        '5': { status: 'released', submittedAt: '2026-03-10T15:00:00.000Z', releaseAt: '2026-03-12T18:00:00.000Z', score: 93, feedback: 'Population-specific accommodations are well justified.' },
        '6': { status: 'released', submittedAt: '2026-03-14T15:00:00.000Z', releaseAt: '2026-03-16T18:00:00.000Z', score: 97, feedback: 'Professional practice plan is ready for supervised use.' }
      },
      capstone: {
        status: 'passed',
        submittedAt: '2026-03-20T15:00:00.000Z',
        releaseAt: '2026-03-24T18:00:00.000Z',
        score: 96,
        evidenceUrl: 'https://exef.org/resources.html',
        notes: 'Demo capstone packet approved for release.'
      },
      learningLoop: {
        actionPlans: [
          { id: 'demo-plan-1', at: '2026-03-18T09:00:00.000Z', focus: 'Reduce initiation lag with externalized planning blocks.' },
          { id: 'demo-plan-2', at: '2026-03-25T09:00:00.000Z', focus: 'Stabilize follow-through using weekly accountability reviews.' }
        ],
        reflections: [
          { id: 'demo-reflection-1', at: '2026-03-19T17:00:00.000Z', summary: 'Noticed reduced overwhelm once steps were visible on one page.' },
          { id: 'demo-reflection-2', at: '2026-03-26T17:00:00.000Z', summary: 'Adherence improved when the plan was paired with a fixed calendar block.' }
        ],
        adherence: {
          sessions: [
            { id: 'demo-session-1', at: '2026-03-21T10:00:00.000Z', completed: true },
            { id: 'demo-session-2', at: '2026-03-23T10:00:00.000Z', completed: true },
            { id: 'demo-session-3', at: '2026-03-25T10:00:00.000Z', completed: true },
            { id: 'demo-session-4', at: '2026-03-27T10:00:00.000Z', completed: false },
            { id: 'demo-session-5', at: '2026-03-29T10:00:00.000Z', completed: true }
          ]
        }
      }
    };

    var purchases = [
      {
        id: 'ord_demo_esqr',
        date: '2026-02-22T16:00:00.000Z',
        total: 199,
        items: [{ id: 'esqr-analysis', name: 'ESQ-R Professional Analysis', price: 199 }],
        verification: { mode: 'demo_preview' }
      },
      {
        id: 'ord_demo_bundle',
        date: '2026-02-23T16:00:00.000Z',
        total: 895,
        items: [
          { id: 'cefc-enrollment', name: 'CEFC Enrollment Access', price: 695 },
          { id: 'capstone-review', name: 'Capstone Review & Credentialing', price: 200 }
        ],
        verification: { mode: 'demo_preview' }
      },
      {
        id: 'ord_demo_certificate',
        date: '2026-03-28T16:00:00.000Z',
        total: 0,
        items: [
          { id: 'certificate', name: 'Certificate of Completion', price: 0 },
          { id: 'certificate-frame', name: 'Framed Certificate Fulfillment', price: 0 }
        ],
        credentialId: credentialId,
        receipt: certificateReceipt,
        verification: { mode: 'demo_preview' }
      }
    ];

    var user = {
      name: name,
      email: email,
      role: 'learner',
      passwordHash: hashPasswordLegacy(password),
      passwordSalt: null,
      passwordAlgo: 'legacy',
      createdAt: createdAt,
      progress: progress,
      purchases: purchases
    };

    return {
      users: (function() {
        var users = {};
        users[email] = user;
        return users;
      })(),
      session: {
        email: email,
        name: name,
        mode: 'prototype',
        role: 'learner',
        createdAt: createdAt,
        progress: progress,
        purchases: purchases,
        loggedInAt: new Date().toISOString()
      },
      cart: []
    };
  }

  function launchDemoAccount() {
    localStorage.removeItem('efi_access_token');
    localStorage.removeItem('efi_refresh_token');
    EFI.Auth.importPrototypeData(buildDemoPayload());
    redirectAfterAuth();
  }

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
      redirectAfterAuth();
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
      if (result.requiresConfirmation) {
        registerPanel.querySelector('h2').textContent = 'Check Your Email';
        registerPanel.querySelector('form').style.display = 'none';
        errEl.hidden = true;
        heroTitle.textContent = 'Confirm Your Email';
        heroLead.textContent = 'Open the confirmation email EFI just sent and use that link to finish activating your account.';
        var message = document.createElement('p');
        message.className = 'notice';
        message.textContent = 'A confirmation link was sent to ' + result.email + '. If that link opens the wrong host, update Supabase Auth Site URL and allowed redirect URLs to the live EFI domain.';
        registerPanel.appendChild(message);
        return;
      }
      redirectAfterAuth();
    } else {
      errEl.textContent = result.error;
      errEl.hidden = false;
    }
  });

  if (demoBtn) {
    demoBtn.addEventListener('click', function() {
      if (demoStatus) demoStatus.textContent = 'Loading demo account...';
      launchDemoAccount();
    });
  }
})();
