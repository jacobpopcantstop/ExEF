(function() {
  if (!EFI.Auth.requireAuth()) return;

  var user = EFI.Auth.getCurrentUser();
  if (!user) return;

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(id, value) {
    var node = byId(id);
    if (node) node.textContent = value;
  }

  // Greeting
  setText('dash-greeting', 'Welcome back, ' + user.name.split(' ')[0]);

  // Account info
  setText('acct-name', user.name);
  setText('acct-email', user.email);
  setText('acct-since', new Date(user.createdAt).toLocaleDateString());

  // Logout
  var logoutBtn = byId('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', function() { EFI.Auth.logout(); });
  var logoutLink = byId('logout-link');
  if (logoutLink) logoutLink.addEventListener('click', function(e) { e.preventDefault(); EFI.Auth.logout(); });

  var isOpsRole = EFI.Auth.hasRole(['admin', 'reviewer']);
  var opsToolsCard = byId('ops-tools-card');
  if (opsToolsCard) opsToolsCard.style.display = isOpsRole ? 'block' : 'none';
  var submissionWorkflow = [];

  function setOpsStatus(msg) {
    setText('ops-status', msg);
  }

  function getLatestUser() {
    return EFI.Auth.getCurrentUser() || user;
  }

  function hasPurchasedItem(itemId) {
    var latestUser = getLatestUser();
    return ((latestUser && latestUser.purchases) || []).some(function (purchase) {
      return (purchase.items || []).some(function (item) { return String(item.id || '') === itemId; });
    });
  }

  function getSubmissionGateState() {
    return [
      {
        id: 'cefc-enrollment',
        label: 'Module grading queue',
        detail: hasPurchasedItem('cefc-enrollment')
          ? 'Enrollment entitlement is active. Module submissions can enter grading immediately.'
          : 'Enrollment entitlement is missing. Module submissions will be blocked until CEFC Enrollment Access or the bundle is purchased.',
        unlocked: hasPurchasedItem('cefc-enrollment'),
        href: 'store.html?offer=cefc_enrollment#paid-path',
        cta: 'Unlock Module Queue'
      },
      {
        id: 'capstone-review',
        label: 'Capstone review queue',
        detail: hasPurchasedItem('capstone-review')
          ? 'Capstone review entitlement is active. Final practicum can enter review when ready.'
          : 'Capstone review entitlement is missing. Capstone submission is blocked until Capstone Review or the bundle is purchased.',
        unlocked: hasPurchasedItem('capstone-review'),
        href: 'store.html?offer=capstone_review#paid-path',
        cta: 'Unlock Capstone Queue'
      }
    ];
  }

  function renderSubmissionGates() {
    var host = document.getElementById('submission-gates');
    if (!host) return;
    while (host.firstChild) host.removeChild(host.firstChild);
    var gates = getSubmissionGateState();
    gates.forEach(function (gate) {
      var card = document.createElement('div');
      card.className = 'notice';
      card.style.marginBottom = 'var(--space-sm)';
      card.style.borderLeft = gate.unlocked ? '4px solid var(--color-accent)' : '4px solid var(--color-warm)';
      var title = document.createElement('strong');
      title.textContent = gate.label + ': ';
      card.appendChild(title);
      card.appendChild(document.createTextNode(gate.unlocked ? 'Unlocked. ' : 'Locked. '));
      card.appendChild(document.createTextNode(gate.detail));
      if (!gate.unlocked) {
        card.appendChild(document.createTextNode(' '));
        var link = document.createElement('a');
        link.href = gate.href;
        link.textContent = gate.cta;
        card.appendChild(link);
      }
      host.appendChild(card);
    });
  }

  function getSubmissionStateMeta(row) {
    var state = String((row && (row.workflow_state || row.status)) || '').toLowerCase();
    if (state === 'queued_for_release' || state === 'feedback_ready') {
      return { label: 'Queued for release', color: 'var(--module-4)' };
    }
    if (state === 'passed') {
      return { label: 'Passed', color: 'var(--color-accent)' };
    }
    if (state === 'needs_revision') {
      return { label: 'Needs revision', color: 'var(--color-warm)' };
    }
    if (state === 'submitted') {
      return { label: 'Submitted', color: 'var(--module-3)' };
    }
    return { label: state ? state.replace(/_/g, ' ') : 'Pending', color: 'var(--color-text-muted)' };
  }

  function collectSubmissionAttachments() {
    var attachments = [];
    [1, 2].forEach(function (index) {
      var labelEl = document.getElementById('submission-attachment-label-' + index);
      var urlEl = document.getElementById('submission-attachment-url-' + index);
      var url = urlEl ? String(urlEl.value || '').trim() : '';
      var label = labelEl ? String(labelEl.value || '').trim() : '';
      if (!url) return;
      attachments.push({
        label: label || ('Attachment ' + index),
        url: url,
        kind: 'supporting_evidence'
      });
    });
    return attachments;
  }

  function clearSubmissionAttachmentFields() {
    [1, 2].forEach(function (index) {
      var labelEl = document.getElementById('submission-attachment-label-' + index);
      var urlEl = document.getElementById('submission-attachment-url-' + index);
      if (labelEl) labelEl.value = '';
      if (urlEl) urlEl.value = '';
    });
  }

  function renderSubmissionTimeline(records) {
    var host = document.getElementById('submission-timeline-list');
    if (!host) return;
    while (host.firstChild) host.removeChild(host.firstChild);

    var events = [];
    (records || []).forEach(function (row) {
      var title = row.kind === 'capstone' ? 'Capstone practicum' : ('Module ' + row.module_id + ' submission');
      (row.timeline || []).forEach(function (entry) {
        events.push({
          submissionTitle: title,
          at: entry && entry.at ? entry.at : '',
          label: entry && entry.label ? entry.label : 'Submission event',
          score: entry && typeof entry.score === 'number' ? entry.score : null
        });
      });
    });

    if (!events.length) return;

    events.sort(function (a, b) {
      return new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime();
    });

    var card = document.createElement('div');
    card.className = 'card';
    card.style.padding = 'var(--space-md)';
    var heading = document.createElement('h4');
    heading.style.marginBottom = 'var(--space-sm)';
    heading.textContent = 'Recent workflow timeline';
    card.appendChild(heading);

    var list = document.createElement('ul');
    list.style.margin = '0';
    list.style.paddingLeft = '1.1rem';
    events.slice(0, 10).forEach(function (event) {
      var item = document.createElement('li');
      item.style.marginBottom = 'var(--space-xs)';
      item.textContent = [
        event.at ? new Date(event.at).toLocaleString() : 'Pending date',
        event.submissionTitle,
        event.label,
        event.score != null ? (event.score + '%') : ''
      ].filter(Boolean).join(' - ');
      list.appendChild(item);
    });
    card.appendChild(list);
    host.appendChild(card);
  }

  function renderSubmissionWorkflow(records) {
    var host = document.getElementById('submission-workflow-list');
    if (!host) return;
    while (host.firstChild) host.removeChild(host.firstChild);
    renderSubmissionTimeline(records || []);

    if (!records || !records.length) {
      var empty = document.createElement('p');
      empty.style.color = 'var(--color-text-muted)';
      empty.textContent = 'No submission records yet. When you submit a module or capstone, it will appear here with a clear workflow state.';
      host.appendChild(empty);
      return;
    }

    records.slice(0, 6).forEach(function (row) {
      var card = document.createElement('div');
      card.className = 'card';
      card.style.marginBottom = 'var(--space-sm)';
      card.style.padding = 'var(--space-md)';

      var heading = document.createElement('div');
      heading.style.display = 'flex';
      heading.style.justifyContent = 'space-between';
      heading.style.alignItems = 'center';
      heading.style.gap = 'var(--space-sm)';
      heading.style.flexWrap = 'wrap';

      var title = document.createElement('strong');
      title.textContent = row.kind === 'capstone' ? 'Capstone practicum' : ('Module ' + row.module_id + ' submission');
      heading.appendChild(title);

      var badge = document.createElement('span');
      var meta = getSubmissionStateMeta(row);
      badge.textContent = meta.label;
      badge.style.display = 'inline-flex';
      badge.style.padding = '0.25rem 0.6rem';
      badge.style.borderRadius = '999px';
      badge.style.background = 'rgba(74, 158, 218, 0.1)';
      badge.style.color = meta.color;
      badge.style.fontSize = '0.82rem';
      badge.style.fontWeight = '700';
      heading.appendChild(badge);

      card.appendChild(heading);

      var submitted = document.createElement('p');
      submitted.style.margin = 'var(--space-xs) 0 0';
      submitted.style.color = 'var(--color-text-muted)';
      submitted.style.fontSize = '0.92rem';
      submitted.textContent = 'Submitted ' + new Date(row.submitted_at).toLocaleString();
      card.appendChild(submitted);

      if (row.release_at) {
        var release = document.createElement('p');
        release.style.margin = 'var(--space-xs) 0 0';
        release.style.color = 'var(--color-text-muted)';
        release.style.fontSize = '0.92rem';
        release.textContent = row.feedback_available
          ? 'Feedback released ' + new Date(row.release_at).toLocaleString()
          : 'Feedback scheduled for release ' + new Date(row.release_at).toLocaleString();
        card.appendChild(release);
      }

      if (typeof row.score === 'number') {
        var score = document.createElement('p');
        score.style.margin = 'var(--space-xs) 0 0';
        score.innerHTML = '<strong>Score:</strong> ' + row.score + '%';
        card.appendChild(score);
      }

      if (Array.isArray(row.attachments) && row.attachments.length) {
        var attachmentWrap = document.createElement('div');
        attachmentWrap.style.margin = 'var(--space-sm) 0 0';
        var attachmentHeading = document.createElement('p');
        attachmentHeading.style.margin = '0 0 var(--space-xs)';
        attachmentHeading.innerHTML = '<strong>Evidence package</strong>';
        attachmentWrap.appendChild(attachmentHeading);
        var attachmentList = document.createElement('ul');
        attachmentList.style.margin = '0';
        attachmentList.style.paddingLeft = '1.1rem';
        row.attachments.forEach(function (attachment) {
          var item = document.createElement('li');
          var link = document.createElement('a');
          link.href = attachment.url;
          link.target = '_blank';
          link.rel = 'noopener';
          link.textContent = attachment.label || attachment.url;
          item.appendChild(link);
          attachmentList.appendChild(item);
        });
        attachmentWrap.appendChild(attachmentList);
        card.appendChild(attachmentWrap);
      }

      if (row.feedback && row.feedback.summary) {
        var summary = document.createElement('p');
        summary.style.margin = 'var(--space-xs) 0 0';
        summary.style.color = 'var(--color-text-muted)';
        summary.textContent = row.feedback.summary;
        card.appendChild(summary);
      }

      if (row.feedback && row.feedback.reviewer_override && row.feedback.reviewer_override.reviewer_notes) {
        var reviewerNotes = document.createElement('p');
        reviewerNotes.style.margin = 'var(--space-xs) 0 0';
        reviewerNotes.innerHTML = '<strong>Reviewer notes:</strong> ' + row.feedback.reviewer_override.reviewer_notes;
        card.appendChild(reviewerNotes);
      }

      if (row.feedback && row.feedback.reviewer_override && row.feedback.reviewer_override.reviewed_at) {
        var reviewedAt = document.createElement('p');
        reviewedAt.style.margin = 'var(--space-xs) 0 0';
        reviewedAt.style.color = 'var(--color-text-muted)';
        reviewedAt.style.fontSize = '0.92rem';
        reviewedAt.textContent = 'Reviewed ' + new Date(row.feedback.reviewer_override.reviewed_at).toLocaleString();
        card.appendChild(reviewedAt);
      }

      if (row.feedback && Array.isArray(row.feedback.review_history) && row.feedback.review_history.length) {
        var historyWrap = document.createElement('div');
        historyWrap.style.margin = 'var(--space-sm) 0 0';
        var historyHeading = document.createElement('p');
        historyHeading.style.margin = '0 0 var(--space-xs)';
        historyHeading.innerHTML = '<strong>Review history</strong>';
        historyWrap.appendChild(historyHeading);
        var historyList = document.createElement('ul');
        historyList.style.margin = '0';
        historyList.style.paddingLeft = '1.1rem';
        row.feedback.review_history.slice(-3).reverse().forEach(function (entry) {
          var item = document.createElement('li');
          var pieces = [];
          if (entry.reviewed_at) pieces.push(new Date(entry.reviewed_at).toLocaleString());
          if (entry.decision) pieces.push(String(entry.decision).replace(/_/g, ' '));
          if (typeof entry.score === 'number') pieces.push(entry.score + '%');
          if (entry.reviewer_notes) pieces.push(entry.reviewer_notes);
          item.textContent = pieces.join(' - ');
          historyList.appendChild(item);
        });
        historyWrap.appendChild(historyList);
        card.appendChild(historyWrap);
      }

      if (row.notes) {
        var submissionNotes = document.createElement('p');
        submissionNotes.style.margin = 'var(--space-xs) 0 0';
        submissionNotes.style.color = 'var(--color-text-muted)';
        submissionNotes.style.fontSize = '0.92rem';
        submissionNotes.textContent = 'Submission notes: ' + row.notes;
        card.appendChild(submissionNotes);
      }
      host.appendChild(card);
    });
  }

  function fetchSubmissionWorkflow() {
    var latestUser = getLatestUser();
    if (!latestUser || !latestUser.email) return Promise.resolve([]);
    var token = localStorage.getItem('efi_access_token') || '';
    var headers = {};
    if (token) headers.Authorization = 'Bearer ' + token;
    return fetch('/api/submissions?email=' + encodeURIComponent(latestUser.email), { headers: headers })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          if (!res.ok || body.ok === false) throw new Error(body.error || 'Unable to load submission workflow.');
          return body.submissions || [];
        });
      })
      .catch(function () { return []; });
  }

  function refreshSubmissionWorkflow() {
    renderSubmissionGates();
    return fetchSubmissionWorkflow().then(function (records) {
      submissionWorkflow = records || [];
      renderSubmissionWorkflow(submissionWorkflow);
      return submissionWorkflow;
    });
  }

  if (isOpsRole) {
  document.getElementById('export-data-btn').addEventListener('click', function () {
    var payload = EFI.Auth.exportPrototypeData();
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'efi-prototype-data-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setOpsStatus('Data exported.');
  });

  document.getElementById('import-data-btn').addEventListener('click', function () {
    document.getElementById('import-data-file').click();
  });

  document.getElementById('import-data-file').addEventListener('change', function () {
    var file = this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        var res = EFI.Auth.importPrototypeData(data);
        if (!res.ok) throw new Error(res.error || 'Import failed.');
        setOpsStatus('Data imported. Reloading...');
        setTimeout(function () { window.location.reload(); }, 400);
      } catch (err) {
        setOpsStatus('Import failed: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('reset-data-btn').addEventListener('click', function () {
    EFI.Auth.resetPrototypeData();
    setOpsStatus('Prototype data reset. Redirecting to login...');
    setTimeout(function () { window.location.href = 'login.html'; }, 600);
  });
  }

  function renderCertificationReadiness() {
    var latestUser = EFI.Auth.getCurrentUser();
    if (!latestUser) return;
    var status = EFI.Auth.getCertificationStatus(latestUser);
    var list = byId('readiness-list');
    if (!list) return;
    while (list.firstChild) list.removeChild(list.firstChild);

    var checks = [
      { label: 'Modules completed: ' + status.modulesCompleted + '/6', done: status.allModulesCompleted },
      { label: 'Capstone review passed', done: status.capstonePassed },
      { label: 'Certificate purchased', done: status.certificatePurchased },
      { label: 'Framed certificate purchased (optional)', done: status.framedCertificatePurchased, optional: true }
    ];

    checks.forEach(function (item) {
      var li = document.createElement('li');
      li.style.marginBottom = 'var(--space-xs)';
      var marker = item.done ? '[Done] ' : (item.optional ? '[Optional] ' : '[Pending] ');
      li.textContent = marker + item.label;
      list.appendChild(li);
    });
  }

  function appendTextLine(parent, label, value) {
    var p = document.createElement('p');
    var strong = document.createElement('strong');
    strong.textContent = label;
    p.appendChild(strong);
    p.appendChild(document.createTextNode(' ' + value));
    parent.appendChild(p);
    return p;
  }

  function renderOutcomeMetrics() {
    var latestUser = EFI.Auth.getCurrentUser();
    if (!latestUser) return;
    var progress = latestUser.progress || {};
    var moduleIds = ['1', '2', '3', '4', '5', '6'];
    var completed = moduleIds.filter(function(id) { return EFI.Auth.isModuleComplete(id, progress); }).length;
    var completionPct = Math.round((completed / moduleIds.length) * 100);
    setText('metric-completion-trend', completed + '/6 modules passed (' + completionPct + '%)');

    var metrics = EFI.Auth.getReleaseMetrics(progress);
    setText('stat-avg-score', metrics.averageScore == null ? 'N/A' : (metrics.averageScore + '%'));
    setText('metric-pending-release', metrics.pendingReleaseCount + ' submission(s) waiting for release');

    if (!metrics.nextReleaseAt) {
      setText('metric-next-release', 'No pending feedback release windows.');
    } else {
      setText('metric-next-release', new Date(metrics.nextReleaseAt).toLocaleString());
    }
  }

  // Purchase stats
  var purchases = user.purchases || [];
  var totalSpent = purchases.reduce(function(s, p) { return s + p.total; }, 0);
  var totalItems = purchases.reduce(function(s, p) { return s + p.items.length; }, 0);
  var certStatus = EFI.Auth.getCertificationStatus(user);

  setText('stat-purchases', totalItems);
  setText('stat-spent', '$' + totalSpent);
  setText('stat-cert', certStatus.fullyCertified ? 'Earned' : (certStatus.eligibleForCertificate ? 'Ready to Purchase' : 'In Progress'));
  if (certStatus.fullyCertified && byId('stat-cert')) byId('stat-cert').style.color = 'var(--color-accent)';
  renderOutcomeMetrics();

  // Purchase history
  var listEl = byId('purchase-list');
  var noEl = byId('no-purchases');
  if (!listEl || !noEl) return;
  if (purchases.length === 0) {
    noEl.style.display = 'block';
    listEl.style.display = 'none';
  } else {
    noEl.style.display = 'none';
    while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
    listEl.style.display = 'block';
    purchases.forEach(function(p) {
      var card = document.createElement('div');
      card.className = 'card';
      card.style.marginBottom = 'var(--space-md)';

      var header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.flexWrap = 'wrap';
      header.style.gap = 'var(--space-sm)';

      var orderMeta = document.createElement('div');
      var orderStrong = document.createElement('strong');
      orderStrong.textContent = 'Order ' + String(p.id || '').toUpperCase();
      orderMeta.appendChild(orderStrong);
      orderMeta.appendChild(document.createTextNode(' - ' + new Date(p.date).toLocaleDateString()));
      header.appendChild(orderMeta);

      var total = document.createElement('div');
      total.style.fontWeight = '700';
      total.textContent = '$' + p.total;
      header.appendChild(total);
      card.appendChild(header);

      if (p.verification && p.verification.mode) {
        var verification = document.createElement('p');
        verification.style.margin = 'var(--space-sm) 0 0';
        verification.style.color = 'var(--color-text-muted)';
        verification.style.fontSize = '0.9rem';
        verification.textContent = 'Verification mode: ' + String(p.verification.mode).replace(/_/g, ' ') + '.';
        card.appendChild(verification);
      }

      var items = document.createElement('ul');
      items.style.marginTop = 'var(--space-sm)';
      items.style.paddingLeft = 'var(--space-lg)';
      p.items.forEach(function(item) {
        var li = document.createElement('li');
        li.appendChild(document.createTextNode(item.name + ' ($' + item.price + ')'));
        if (item.id === 'certificate') {
          li.appendChild(document.createTextNode(' - '));
          var link = document.createElement('a');
          link.href = 'certificate.html';
          link.style.color = 'var(--color-accent)';
          link.style.fontWeight = '600';
          link.textContent = 'View Certificate';
          li.appendChild(link);
          if (p.credentialId) {
            li.appendChild(document.createTextNode(' - Credential ID: ' + p.credentialId));
          }
        }
        items.appendChild(li);
      });
      card.appendChild(items);
      listEl.appendChild(card);
    });
  }

  // Module progress
  var progress = user.progress || { modules: {} };
  document.querySelectorAll('.module-progress-card').forEach(function(card) {
    var mod = card.getAttribute('data-module');
    var path = card.getAttribute('data-module-path');
    var check = card.querySelector('.progress-check');
    var statusText = card.querySelector('.module-progress-status');
    var assessment = EFI.Auth.getModuleAssessment(mod, progress);
    var isComplete = EFI.Auth.isModuleComplete(mod, progress);
    if (isComplete) {
      check.textContent = '\u2611';
      check.style.color = 'var(--color-accent)';
      check.style.fontSize = '1.5rem';
    } else {
      check.textContent = '\u2610';
      check.style.color = '';
      check.style.fontSize = '';
    }
    if (statusText) {
      if (assessment && typeof assessment.score === 'number') {
        var completedAt = assessment.completedAt ? new Date(assessment.completedAt).toLocaleDateString() : 'today';
        statusText.textContent = (assessment.passed ? 'Passed' : 'Needs retake') + ' - Score: ' + assessment.score + '% - Saved ' + completedAt + '.';
      } else {
        statusText.textContent = 'No saved test result yet.';
      }
    }

    card.addEventListener('click', function() {
      window.location.href = path || ('module-' + mod + '.html');
    });
  });

  // Near-mastery guidance state (V2 backlog #1)
  (function renderNearMasteryGuidance() {
    var latestUser = EFI.Auth.getCurrentUser();
    if (!latestUser) return;
    var prog = latestUser.progress || {};
    var moduleIds = ['1', '2', '3', '4', '5', '6'];
    var completed = [];
    var incomplete = [];
    var nearPass = [];
    moduleIds.forEach(function (id) {
      if (EFI.Auth.isModuleComplete(id, prog)) {
        completed.push(id);
      } else {
        incomplete.push(id);
        var assessment = EFI.Auth.getModuleAssessment(id, prog);
        if (assessment && typeof assessment.score === 'number' && assessment.score >= 60) {
          nearPass.push({ id: id, score: assessment.score });
        }
      }
    });

    var container = byId('module-progress');
    if (!container) return;

    var capstone = prog.capstone || {};
    var capstonePassed = capstone.passed === true;

    if (completed.length === 6 && !capstonePassed) {
      var guidance = document.createElement('div');
      guidance.id = 'near-mastery-guidance';
      guidance.className = 'card';
      guidance.style.gridColumn = '1 / -1';
      guidance.style.borderLeft = '4px solid var(--color-accent)';
      guidance.style.background = 'linear-gradient(135deg,rgba(39,174,96,0.04),rgba(41,128,185,0.04))';
      var heading = document.createElement('h3');
      heading.style.marginBottom = 'var(--space-sm)';
      heading.style.color = 'var(--color-accent)';
      heading.textContent = 'All Modules Complete - Capstone Is Your Final Step';
      var body = document.createElement('p');
      body.appendChild(document.createTextNode('You have passed all required Pathway modules. Submit your capstone practicum to complete the certification pathway. Review the '));
      var rubricLink = document.createElement('a');
      rubricLink.href = 'certification.html#transparency-rubric';
      rubricLink.textContent = 'rubric expectations';
      body.appendChild(rubricLink);
      body.appendChild(document.createTextNode(' before submitting.'));
      var cta = document.createElement('a');
      cta.className = 'btn btn--primary btn--sm';
      cta.href = '#submit-capstone-btn';
      cta.textContent = 'Go to Capstone Submission';
      cta.addEventListener('click', function (event) {
        event.preventDefault();
        var capstoneBtn = byId('submit-capstone-btn');
        if (capstoneBtn) capstoneBtn.scrollIntoView({ behavior: 'smooth' });
      });
      guidance.appendChild(heading);
      guidance.appendChild(body);
      guidance.appendChild(cta);
      container.parentNode.insertBefore(guidance, container);
    } else if (completed.length === 5 && incomplete.length === 1) {
      var moduleNames = { '1': 'Neuropsychology', '2': 'Assessment', '3': 'Coaching Architecture', '4': 'Applied Methods', '5': 'Special Populations', '6': 'Professional Practice' };
      var missing = incomplete[0];
      var nearInfo = nearPass.find(function (n) { return n.id === missing; });
      var guidance = document.createElement('div');
      guidance.id = 'near-mastery-guidance';
      guidance.className = 'card';
      guidance.style.gridColumn = '1 / -1';
      guidance.style.borderLeft = '4px solid var(--module-' + missing + ')';
      guidance.style.background = 'linear-gradient(135deg,rgba(142,68,173,0.04),rgba(41,128,185,0.04))';
      var heading = document.createElement('h3');
      heading.style.marginBottom = 'var(--space-sm)';
      heading.style.color = 'var(--module-' + missing + ')';
      heading.textContent = 'One Module Away - Module ' + missing + ': ' + moduleNames[missing];
      var body = document.createElement('p');
      body.textContent = 'You have completed 5 of 6 modules. Pass Module ' + missing + ' to unlock capstone eligibility.' + (nearInfo ? (' Your last attempt scored ' + nearInfo.score + '% - you are close.') : '');
      var cta = document.createElement('a');
      cta.className = 'btn btn--primary btn--sm';
      cta.href = 'module-' + missing + '.html';
      cta.textContent = 'Open Module ' + missing;
      guidance.appendChild(heading);
      guidance.appendChild(body);
      guidance.appendChild(cta);
      container.parentNode.insertBefore(guidance, container);
    } else if (completed.length >= 4 && nearPass.length > 0) {
      var closest = nearPass.sort(function (a, b) { return b.score - a.score; })[0];
      var guidance = document.createElement('div');
      guidance.id = 'near-mastery-guidance';
      guidance.className = 'card';
      guidance.style.gridColumn = '1 / -1';
      guidance.style.borderLeft = '4px solid var(--module-' + closest.id + ')';
      guidance.style.background = 'linear-gradient(135deg,rgba(230,126,34,0.04),rgba(41,128,185,0.04))';
      var heading = document.createElement('h3');
      heading.style.marginBottom = 'var(--space-sm)';
      heading.textContent = 'Almost There - Module ' + closest.id + ' Scored ' + closest.score + '%';
      var body = document.createElement('p');
      body.textContent = 'You are ' + incomplete.length + ' module(s) from capstone eligibility. Module ' + closest.id + ' is your closest near-pass - a focused review session could push it over the threshold.';
      var cta = document.createElement('a');
      cta.className = 'btn btn--secondary btn--sm';
      cta.href = 'module-' + closest.id + '.html';
      cta.textContent = 'Review Module ' + closest.id;
      guidance.appendChild(heading);
      guidance.appendChild(body);
      guidance.appendChild(cta);
      container.parentNode.insertBefore(guidance, container);
    }
  })();

  document.querySelectorAll('[data-submit-module]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var url = byId('submission-url').value;
      var notes = byId('submission-notes').value;
      var attachments = collectSubmissionAttachments();
      var msg = byId('grading-message');
      var moduleId = this.getAttribute('data-submit-module');
      Promise.resolve(EFI.Auth.saveModuleSubmission(moduleId, url, notes, attachments)).then(function (result) {
        msg.textContent = result.ok
          ? ('Module ' + moduleId + ' submitted. Rubric-engine feedback is queued for release after 24 hours (' + new Date(result.release_at).toLocaleString() + ').')
          : result.error;
        if (result.ok) clearSubmissionAttachmentFields();
        return refreshSubmissionWorkflow();
      });
    });
  });

  byId('submit-capstone-btn').addEventListener('click', function () {
    var url = byId('submission-url').value;
    var notes = byId('submission-notes').value;
    var attachments = collectSubmissionAttachments();
    Promise.resolve(EFI.Auth.submitCapstone(url, notes, attachments)).then(function (result) {
      byId('grading-message').textContent = result.ok
        ? ('Capstone submitted. Rubric-engine feedback will unlock in dashboard after 24 hours (' + new Date(result.release_at).toLocaleString() + ').')
        : result.error;
      if (result.ok) clearSubmissionAttachmentFields();
      renderCertificationReadiness();
      renderOutcomeMetrics();
      return refreshSubmissionWorkflow();
    });
  });

  byId('run-grading-btn').addEventListener('click', function () {
    Promise.resolve(EFI.Auth.runAutoGrading()).then(function (result) {
      if (!result.ok) {
        byId('grading-message').textContent = result.error;
        return;
      }
      var statusText = result.status.capstonePassed
        ? 'Feedback refresh complete. Released grading feedback applied to your readiness.'
        : 'Feedback refresh complete. Some submissions may still be waiting for 24-hour release.';
      byId('grading-message').textContent = statusText;
      renderCertificationReadiness();
      renderOutcomeMetrics();
      refreshSubmissionWorkflow();
    });
  });

  Promise.resolve(EFI.Auth.runAutoGrading()).finally(function () {
    renderCertificationReadiness();
    renderOutcomeMetrics();
    refreshSubmissionWorkflow();
  });
})();
