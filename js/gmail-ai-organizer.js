(function initGmailAiOrganizer() {
  'use strict';
  if (!document.getElementById('gao-questionnaire')) return;

  var form = document.getElementById('gao-questionnaire');
  var outputSection = document.getElementById('gao-output');
  var summaryEl = document.getElementById('gao-summary');
  var promptBlockEl = document.getElementById('gao-prompt-block');
  var copyBtn = document.getElementById('gao-copy-prompt');
  var digestRadios = form.querySelectorAll('input[name="gao-digest"]');
  var digestOptions = document.getElementById('gao-digest-options');
  var digestTimeSelect = document.getElementById('gao-digest-time');
  var digestCustomTime = document.getElementById('gao-digest-custom-time');
  var daysRadios = form.querySelectorAll('input[name="gao-days"]');
  var customDaysContainer = document.getElementById('gao-custom-days-container');
  var draftsNone = document.getElementById('gao-drafts-none');
  var draftCheckboxes = form.querySelectorAll('input[name="gao-drafts"]');

  function toggleDigestOptions() {
    var checked = form.querySelector('input[name="gao-digest"]:checked');
    if (digestOptions) digestOptions.hidden = !(checked && checked.value === 'yes');
  }

  function toggleCustomDays() {
    var checked = form.querySelector('input[name="gao-days"]:checked');
    if (customDaysContainer) customDaysContainer.hidden = !(checked && checked.value === 'custom');
  }

  function toggleCustomDigestTime() {
    if (digestCustomTime) digestCustomTime.hidden = !(digestTimeSelect && digestTimeSelect.value === 'custom');
  }

  function handleDraftsNone() {
    if (draftsNone && draftsNone.checked) {
      draftCheckboxes.forEach(function (cb) { cb.checked = false; });
    }
  }

  function handleDraftCategory() {
    if (draftsNone) {
      var anyChecked = Array.prototype.some.call(draftCheckboxes, function (cb) { return cb.checked; });
      if (anyChecked) draftsNone.checked = false;
    }
  }

  digestRadios.forEach(function (r) { r.addEventListener('change', toggleDigestOptions); });
  daysRadios.forEach(function (r) { r.addEventListener('change', toggleCustomDays); });
  if (digestTimeSelect) digestTimeSelect.addEventListener('change', toggleCustomDigestTime);
  if (draftsNone) draftsNone.addEventListener('change', handleDraftsNone);
  draftCheckboxes.forEach(function (cb) { cb.addEventListener('change', handleDraftCategory); });

  function getCheckedValues(name) {
    var checked = form.querySelectorAll('input[name="' + name + '"]:checked');
    return Array.prototype.map.call(checked, function (el) { return el.value; });
  }

  function getRadioValue(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  }

  function clearErrors() {
    var errs = form.querySelectorAll('.gao-error');
    errs.forEach(function (el) { el.remove(); });
  }

  function showError(afterEl, message) {
    var span = document.createElement('span');
    span.className = 'gao-error';
    span.setAttribute('role', 'alert');
    span.style.cssText = 'display:block;color:var(--color-warm);font-size:0.85rem;margin-top:var(--space-xs)';
    span.textContent = message;
    afterEl.parentNode.insertBefore(span, afterEl.nextSibling);
    return span;
  }

  function validate() {
    clearErrors();
    var valid = true;
    var firstError = null;

    var cats = getCheckedValues('gao-categories');
    var customCats = (document.getElementById('gao-custom-categories') || {}).value || '';
    if (cats.length === 0 && customCats.trim() === '') {
      var q1 = form.querySelector('input[name="gao-categories"]');
      var err = showError(q1.closest('fieldset').querySelector('legend'), 'Select at least one category or add a custom one.');
      if (!firstError) firstError = err;
      valid = false;
    }

    if (!getRadioValue('gao-lowpri')) {
      var q3legend = form.querySelectorAll('fieldset')[1].querySelector('legend');
      var err = showError(q3legend, 'Select how low-priority emails should be handled.');
      if (!firstError) firstError = err;
      valid = false;
    }

    if (!getRadioValue('gao-tone')) {
      var toneEl = form.querySelector('input[name="gao-tone"]').closest('div');
      var err = showError(toneEl, 'Select a reply tone.');
      if (!firstError) firstError = err;
      valid = false;
    }

    if (!getRadioValue('gao-frequency')) {
      var freqEl = form.querySelector('input[name="gao-frequency"]').closest('div');
      var err = showError(freqEl, 'Select how often the bot should run.');
      if (!firstError) firstError = err;
      valid = false;
    }

    var daysVal = getRadioValue('gao-days');
    if (!daysVal) {
      var daysEl = form.querySelector('input[name="gao-days"]').closest('div');
      var err = showError(daysEl, 'Select which days the bot should run.');
      if (!firstError) firstError = err;
      valid = false;
    } else if (daysVal === 'custom' && getCheckedValues('gao-custom-days').length === 0) {
      var customDaysEl = document.getElementById('gao-custom-days-container');
      var err = showError(customDaysEl, 'Select at least one day.');
      if (!firstError) firstError = err;
      valid = false;
    }

    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return valid;
  }

  function readForm() {
    var cats = getCheckedValues('gao-categories');
    var customRaw = (document.getElementById('gao-custom-categories') || {}).value || '';
    var customCats = customRaw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var allCategories = cats.concat(customCats);

    var draftCats = getCheckedValues('gao-drafts');
    var activeDrafts = draftCats.filter(function (d) { return allCategories.indexOf(d) !== -1; });

    var digestEnabled = getRadioValue('gao-digest') === 'yes';
    var digestIncludes = digestEnabled ? getCheckedValues('gao-digest-include') : [];
    var digestTime = digestEnabled ? (digestTimeSelect ? digestTimeSelect.value : 'morning') : null;
    if (digestTime === 'custom') {
      var customEl = document.getElementById('gao-digest-custom-time');
      digestTime = customEl ? customEl.value : 'morning';
    }

    var days = getRadioValue('gao-days');
    if (days === 'every') days = 'every day';
    else if (days === 'weekdays') days = 'weekdays only';
    else if (days === 'custom') days = getCheckedValues('gao-custom-days').join(', ');

    return {
      categories: allCategories,
      catchall: getRadioValue('gao-catchall') !== 'no',
      lowpri: getRadioValue('gao-lowpri'),
      draftCategories: activeDrafts,
      tone: getRadioValue('gao-tone'),
      digestEnabled: digestEnabled,
      digestIncludes: digestIncludes,
      digestTime: digestTime,
      frequency: getRadioValue('gao-frequency'),
      days: days,
      vip: (document.getElementById('gao-vip') || {}).value || '',
      extra: (document.getElementById('gao-extra') || {}).value || ''
    };
  }

  function buildPrompt(data) {
    var lines = [];
    lines.push('Build me a Google Apps Script that connects to the Gemini API to organize my Gmail inbox.');
    lines.push('Store the API key in Script Properties under the key "GEMINI_API_KEY".');
    lines.push('');
    lines.push('SORTING RULES:');
    lines.push('- Create these Gmail labels and sort incoming unread emails into them: ' + data.categories.join(', '));
    if (data.catchall) lines.push('- Anything that doesn\'t match a category goes to a label called "Other"');
    lines.push('');
    lines.push('AUTOMATION:');
    var lowpriMap = { 'label': 'Label only (do not archive)', 'archive': 'Archive out of inbox', 'archive-read': 'Archive out of inbox and mark as read', 'nothing': 'Do not touch — leave in inbox as-is' };
    lines.push('- Low-priority emails (Newsletters, Promotions, Social Media): ' + (lowpriMap[data.lowpri] || data.lowpri));
    if (data.draftCategories.length > 0) {
      lines.push('- Draft reply suggestions for: ' + data.draftCategories.join(', '));
      var toneMap = { 'formal': 'formal', 'friendly': 'friendly and brief', 'casual': 'casual', 'match': 'match the sender\'s tone' };
      lines.push('- Reply tone: ' + (toneMap[data.tone] || data.tone));
    } else {
      lines.push('- Do not draft any replies');
    }
    lines.push('');
    if (data.digestEnabled) {
      lines.push('DAILY DIGEST:');
      var timeMap = { 'morning': 'every morning between 7-9am', 'midday': 'around midday (12-1pm)', 'evening': 'in the evening (5-7pm)' };
      lines.push('- Send me a summary email ' + (timeMap[data.digestTime] || 'at ' + data.digestTime));
      var includeMap = { 'counts': 'count of emails per category', 'action': 'list of action-required emails', 'flagged': 'flagged sender highlights', 'archived': 'summary of what was auto-archived' };
      var includes = data.digestIncludes.map(function (k) { return includeMap[k] || k; });
      if (includes.length > 0) lines.push('- Include: ' + includes.join(', '));
      lines.push('');
    }
    lines.push('SCHEDULE:');
    var freqMap = { 'hourly': 'every hour', '6hours': 'every 6 hours', 'daily': 'once daily', 'twice': 'twice daily (morning and evening)' };
    lines.push('- Process unread emails ' + (freqMap[data.frequency] || data.frequency));
    lines.push('- Run on: ' + data.days);
    lines.push('');
    if (data.vip.trim()) {
      lines.push('VIP LIST (never auto-archive or auto-sort these senders):');
      data.vip.trim().split('\n').forEach(function (line) {
        var trimmed = line.trim();
        if (trimmed) lines.push('- ' + trimmed);
      });
      lines.push('');
    }
    if (data.extra.trim()) {
      lines.push('ADDITIONAL INSTRUCTIONS:');
      lines.push('- ' + data.extra.trim());
      lines.push('');
    }
    lines.push('IMPLEMENTATION REQUIREMENTS:');
    lines.push('- Include a main function that processes unread emails using the Gemini API');
    if (data.digestEnabled) lines.push('- Include a separate digest function that composes and sends the summary email');
    lines.push('- Add clear comments explaining each section so a non-developer can modify it later');
    lines.push('- Add error handling that sends me an email notification if the script fails');
    lines.push('- Use GmailApp and UrlFetchApp (no external libraries)');
    return lines.join('\n');
  }

  function buildSummary(data) {
    var parts = [];
    var freqMap = { 'hourly': 'every hour', '6hours': 'every 6 hours', 'daily': 'once daily', 'twice': 'twice daily' };
    parts.push('Your bot will run ' + (freqMap[data.frequency] || data.frequency) + ' on ' + data.days);
    parts.push('sort emails into ' + data.categories.length + ' categories (' + data.categories.slice(0, 4).join(', ') + (data.categories.length > 4 ? ', ...' : '') + ')');
    var lowpriDesc = { 'archive': 'archive low-priority mail', 'archive-read': 'archive and mark low-priority mail as read', 'label': 'label low-priority mail', 'nothing': 'leave low-priority mail alone' };
    parts.push(lowpriDesc[data.lowpri] || '');
    if (data.draftCategories.length > 0) {
      var toneMap = { 'formal': 'formal', 'friendly': 'friendly', 'casual': 'casual', 'match': 'tone-matched' };
      parts.push('draft ' + (toneMap[data.tone] || '') + ' replies for ' + data.draftCategories.join(' and ') + ' emails');
    }
    if (data.digestEnabled) {
      var timeMap = { 'morning': 'morning', 'midday': 'midday', 'evening': 'evening' };
      parts.push('send you a ' + (timeMap[data.digestTime] || data.digestTime) + ' digest');
    }
    return parts.filter(Boolean).join(', ') + '.';
  }

  function copyPrompt(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        if (copyBtn) copyBtn.textContent = 'Copied!';
        setTimeout(function () { if (copyBtn) copyBtn.textContent = 'Copy Prompt'; }, 2000);
      }).catch(function () {
        if (copyBtn) copyBtn.textContent = 'Copy failed \u2014 select and copy manually';
        setTimeout(function () { if (copyBtn) copyBtn.textContent = 'Copy Prompt'; }, 3000);
      });
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;
    var data = readForm();
    var prompt = buildPrompt(data);
    var summary = buildSummary(data);
    if (summaryEl) {
      summaryEl.textContent = summary;
      summaryEl.style.cssText = 'font-size:1.05rem;line-height:1.6;color:var(--color-text);margin-bottom:var(--space-lg);padding:var(--space-md);background:var(--color-bg-alt);border-radius:var(--border-radius);border-left:4px solid var(--module-3)';
    }
    if (promptBlockEl) {
      promptBlockEl.innerHTML = '';
      var pre = document.createElement('pre');
      pre.style.cssText = 'white-space:pre-wrap;word-wrap:break-word;background:var(--color-bg-alt);padding:var(--space-lg);border-radius:var(--border-radius);border:1px solid var(--color-border);font-size:0.88rem;line-height:1.6;max-height:500px;overflow-y:auto';
      pre.textContent = prompt;
      promptBlockEl.appendChild(pre);
    }
    if (outputSection) outputSection.hidden = false;
    if (copyBtn) copyBtn.onclick = function () { copyPrompt(prompt); };
    if (outputSection) outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
