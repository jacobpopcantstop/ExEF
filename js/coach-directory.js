(function () {
  var body = document.getElementById('dir-body');
  if (!body) return;

  var searchInput = document.getElementById('dir-search');
  var specialtySelect = document.getElementById('dir-specialty');
  var modeSelect = document.getElementById('dir-mode');
  var resetBtn = document.getElementById('dir-reset');
  var countEl = document.getElementById('dir-count');
  var submitForm = document.getElementById('dir-submit-form');
  var submitStatus = document.getElementById('dir-submit-status');
  var submitBtn = document.getElementById('dir-submit-btn');
  var statusForm = document.getElementById('dir-status-form');
  var statusBtn = document.getElementById('dir-status-btn');
  var statusBody = document.getElementById('dir-status-body');
  var statsEl = document.getElementById('dir-stats');

  var records = [];

  function normalize(text) {
    return String(text || '').toLowerCase().trim();
  }

  function isPublicRecord(record) {
    return record.verification_status === 'verified' && record.moderation_status === 'approved';
  }

  function updateSpecialtyOptions(publicRecords) {
    var specialties = {};
    publicRecords.forEach(function (record) {
      specialties[record.specialty] = true;
    });
    Object.keys(specialties).sort().forEach(function (name) {
      var option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      specialtySelect.appendChild(option);
    });
  }

  function matchesFilters(record) {
    var query = normalize(searchInput.value);
    var specialty = specialtySelect.value;
    var mode = modeSelect.value;
    var haystack = normalize(
      [
        record.name,
        record.city,
        record.state,
        record.zip,
        record.specialty,
        record.credential_id
      ].join(' ')
    );
    var matchesQuery = !query || haystack.indexOf(query) !== -1;
    var matchesSpecialty = !specialty || record.specialty === specialty;
    var modes = Array.isArray(record.delivery_modes) ? record.delivery_modes : [];
    var matchesMode = !mode || modes.indexOf(mode) >= 0;
    return matchesQuery && matchesSpecialty && matchesMode;
  }

  function escapeHTML(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str || '')));
    return div.innerHTML;
  }

  function clearNode(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function renderEmptyBody(targetBody, colspan, text) {
    if (!targetBody) return;
    clearNode(targetBody);
    var row = document.createElement('tr');
    var cell = document.createElement('td');
    cell.colSpan = colspan;
    cell.textContent = text;
    row.appendChild(cell);
    targetBody.appendChild(row);
  }

  function appendCell(row, text) {
    var cell = document.createElement('td');
    cell.textContent = text;
    row.appendChild(cell);
    return cell;
  }

  function appendCoachNameCell(row, record) {
    var cell = document.createElement('td');
    var strong = document.createElement('strong');
    strong.textContent = record.name || '';
    cell.appendChild(strong);
    cell.appendChild(document.createElement('br'));
    var meta = document.createElement('span');
    meta.style.fontSize = '0.85rem';
    meta.style.color = 'var(--color-text-muted)';
    meta.textContent = 'ID: ' + (record.credential_id || '');
    cell.appendChild(meta);
    row.appendChild(cell);
  }

  function appendProfileCell(row, record) {
    var cell = document.createElement('td');
    if (record.website) {
      var link = document.createElement('a');
      link.href = record.website;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Profile';
      cell.appendChild(link);
    } else {
      var verifyLink = document.createElement('a');
      verifyLink.href = 'verify.html?credential=' + encodeURIComponent(record.credential_id || '');
      verifyLink.textContent = 'Verify ID';
      cell.appendChild(verifyLink);
    }
    row.appendChild(cell);
  }

  function formatDelivery(modes) {
    if (!Array.isArray(modes) || !modes.length) return 'Not listed';
    return modes.map(function (mode) {
      return mode === 'in-person' ? 'In-person' : 'Virtual';
    }).join(' + ');
  }

  function verificationState(record) {
    var reviewedAt = record.last_reviewed || record.updated_at || '';
    if (!reviewedAt) return 'probation';
    var ageDays = (Date.now() - new Date(reviewedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > 365) return 'expired';
    if (ageDays > 180) return 'probation';
    return 'active';
  }

  function statusBadge(record) {
    var state = verificationState(record);
    var color = 'var(--module-3)';
    if (state === 'probation') color = 'var(--module-5)';
    if (state === 'expired') color = 'var(--color-warm)';
    return '<span style="display:inline-block;margin-top:0.2rem;padding:0.1rem 0.45rem;border:1px solid ' + color + ';border-radius:999px;font-size:0.75rem;color:' + color + ';">' + state.charAt(0).toUpperCase() + state.slice(1) + '</span>';
  }

  function render() {
    var publicRecords = records.filter(isPublicRecord);
    var filtered = publicRecords.filter(matchesFilters);

    if (!filtered.length) {
      renderEmptyBody(body, 5, 'No coaches found for those filters.');
      countEl.textContent = '0 results';
      return;
    }

    clearNode(body);
    filtered.forEach(function (record) {
      var row = document.createElement('tr');
      appendCoachNameCell(row, record);
      appendCell(row, [record.city, record.state, record.zip].filter(Boolean).join(', '));
      appendCell(row, record.specialty || '');
      appendCell(row, formatDelivery(record.delivery_modes));
      appendProfileCell(row, record);
      body.appendChild(row);
    });

    countEl.textContent = filtered.length + ' result' + (filtered.length === 1 ? '' : 's');
  }

  function bindEvents() {
    searchInput.addEventListener('input', render);
    specialtySelect.addEventListener('change', render);
    modeSelect.addEventListener('change', render);
    resetBtn.addEventListener('click', function () {
      searchInput.value = '';
      specialtySelect.value = '';
      modeSelect.value = '';
      render();
    });

    if (submitForm) {
      submitForm.addEventListener('submit', function (event) {
        event.preventDefault();
        if (submitBtn) submitBtn.disabled = true;
        if (submitStatus) submitStatus.textContent = 'Submitting listing request...';

        var modes = Array.prototype.slice.call(document.querySelectorAll('input[name="dir-submit-mode"]:checked')).map(function (el) {
          return el.value;
        });
        var payload = {
          action: 'submit_listing',
          name: document.getElementById('dir-submit-name').value.trim(),
          email: document.getElementById('dir-submit-email').value.trim(),
          city: document.getElementById('dir-submit-city').value.trim(),
          state: document.getElementById('dir-submit-state').value.trim().toUpperCase(),
          zip: document.getElementById('dir-submit-zip').value.trim(),
          specialty: document.getElementById('dir-submit-specialty').value,
          website: document.getElementById('dir-submit-website').value.trim(),
          credential_id: document.getElementById('dir-submit-credential').value.trim(),
          bio: document.getElementById('dir-submit-bio').value.trim(),
          delivery_modes: modes,
          company: document.getElementById('dir-submit-company').value.trim()
        };

        var attest = document.getElementById('dir-submit-attest');
        if (!attest || !attest.checked) {
          if (submitStatus) submitStatus.textContent = 'Attestation is required.';
          if (submitBtn) submitBtn.disabled = false;
          return;
        }

        fetch('/api/coach-directory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(function (res) {
            return res.json().catch(function () { return {}; }).then(function (data) {
              if (!res.ok || data.ok === false) throw new Error(data.error || 'Unable to submit listing.');
              return data;
            });
          })
          .then(function () {
            submitForm.reset();
            if (submitStatus) submitStatus.textContent = 'Listing request submitted. It will appear after verification and moderation approval.';
          })
          .catch(function (err) {
            if (submitStatus) submitStatus.textContent = err.message || 'Unable to submit listing.';
          })
          .finally(function () {
            if (submitBtn) submitBtn.disabled = false;
          });
      });
    }

    if (statusForm) {
      statusForm.addEventListener('submit', function (event) {
        event.preventDefault();
        if (statusBtn) statusBtn.disabled = true;
        var email = document.getElementById('dir-status-email').value.trim().toLowerCase();
        fetch('/api/coach-directory?email=' + encodeURIComponent(email), { cache: 'no-cache' })
          .then(function (res) {
            return res.json().catch(function () { return {}; }).then(function (payload) {
              if (!res.ok || payload.ok === false) throw new Error(payload.error || 'Unable to load status.');
              return payload;
            });
          })
          .then(function (payload) {
            var rows = payload.records || [];
            if (!rows.length) {
              renderEmptyBody(statusBody, 4, 'No listing requests found for this email.');
              return;
            }
            clearNode(statusBody);
            rows.forEach(function (row) {
              var reviewed = row.last_reviewed || row.updated_at;
              var tr = document.createElement('tr');
              appendCell(tr, row.credential_id || 'Pending');
              appendCell(tr, row.moderation_status || 'pending');
              appendCell(tr, row.verification_status || 'pending');
              appendCell(tr, reviewed ? new Date(reviewed).toLocaleString() : 'N/A');
              statusBody.appendChild(tr);
            });
          })
          .catch(function (err) {
            renderEmptyBody(statusBody, 4, err.message || 'Unable to load status.');
          })
          .finally(function () {
            if (statusBtn) statusBtn.disabled = false;
          });
      });
    }
  }

  function init(data, stats) {
    records = (data && data.records) || [];
    var publicRecords = records.filter(isPublicRecord);
    updateSpecialtyOptions(publicRecords);
    if (statsEl) {
      if (stats && typeof stats.total === 'number') {
        statsEl.textContent = 'Directory totals: ' + stats.total + ' records, ' + (stats.approved || 0) + ' approved, ' + (stats.pending || 0) + ' pending.';
      } else {
        statsEl.textContent = 'Directory loaded.';
      }
    }
    bindEvents();
    render();
  }

  fetch('/api/coach-directory', { cache: 'no-cache' })
    .then(function (response) {
      if (!response.ok) throw new Error('directory api failed');
      return response.json();
    })
    .then(function (payload) {
      if (!payload || payload.ok === false || !Array.isArray(payload.records)) {
        throw new Error('directory api invalid payload');
      }
      init({ records: payload.records }, payload.stats || null);
    })
    .catch(function () {
      renderEmptyBody(body, 5, 'Directory is temporarily unavailable. Please try again shortly.');
      countEl.textContent = 'Unavailable';
      if (statsEl) statsEl.textContent = 'Live directory source could not be reached.';
      bindEvents();
    });
})();
