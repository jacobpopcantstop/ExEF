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

  // Advanced panel toggle
  var advancedToggle = document.getElementById('gao-advanced-toggle');
  var advancedPanel = document.getElementById('gao-advanced-panel');
  if (advancedToggle && advancedPanel) {
    advancedToggle.addEventListener('change', function () {
      advancedPanel.hidden = !advancedToggle.checked;
    });
  }

  // Slider value echoes
  var sliderIds = ['gao-batch-size', 'gao-sleep-ms', 'gao-max-exec', 'gao-confidence', 'gao-body-chars'];
  sliderIds.forEach(function (id) {
    var slider = document.getElementById(id);
    var echo = document.querySelector('.gao-slider-value[data-for="' + id + '"]');
    if (!slider || !echo) return;
    var fmt = function (v) { return id === 'gao-confidence' ? parseFloat(v).toFixed(2) : v; };
    slider.addEventListener('input', function () { echo.textContent = fmt(slider.value); });
  });

  // Backlog situation drives defaults for sliders + aggressiveness
  var backlogDefaults = {
    zero:          { batch: 15, sleep: 400, exec: 3, conf: 0.80, body: 1500, oldest: false, dry: false },
    light:         { batch: 25, sleep: 250, exec: 4, conf: 0.70, body: 1500, oldest: false, dry: false },
    medium:        { batch: 40, sleep: 200, exec: 4, conf: 0.70, body: 1200, oldest: true,  dry: false },
    heavy:         { batch: 60, sleep: 150, exec: 5, conf: 0.65, body: 1000, oldest: true,  dry: false },
    overwhelming:  { batch: 90, sleep: 100, exec: 5, conf: 0.60, body: 800,  oldest: true,  dry: true  }
  };
  function applyBacklogDefaults(key) {
    var d = backlogDefaults[key];
    if (!d) return;
    var set = function (id, val) {
      var el = document.getElementById(id);
      if (!el) return;
      el.value = val;
      var echo = document.querySelector('.gao-slider-value[data-for="' + id + '"]');
      if (echo) echo.textContent = id === 'gao-confidence' ? parseFloat(val).toFixed(2) : val;
    };
    set('gao-batch-size', d.batch);
    set('gao-sleep-ms', d.sleep);
    set('gao-max-exec', d.exec);
    set('gao-confidence', d.conf);
    set('gao-body-chars', d.body);
    var oldest = document.getElementById('gao-oldest-first');
    var dry = document.getElementById('gao-dry-run');
    if (oldest) oldest.checked = d.oldest;
    if (dry) dry.checked = d.dry;
  }
  form.querySelectorAll('input[name="gao-backlog"]').forEach(function (r) {
    r.addEventListener('change', function () { if (r.checked) applyBacklogDefaults(r.value); });
  });

  // Category preset buttons
  var categoryPresets = {
    personal:     ['bills','family','health','shopping','travel','receipts','newsletters','promotions','subscriptions','deliveries','calendar'],
    professional: ['work','projects','support','calendar','events','newsletters','promotions','travel','receipts','invoices'],
    financial:    ['bills','invoices','banking','taxes','insurance','receipts','subscriptions','shopping','promotions'],
    parent:       ['school','family','health','calendar','events','shopping','deliveries','bills','promotions','newsletters'],
    power:        ['school','work','bills','family','health','shopping','newsletters','social','promotions','travel','receipts','invoices','banking','taxes','insurance','realestate','job-search','education','subscriptions','deliveries','calendar','support','government','projects','events']
  };
  function flashPreset(btn) {
    var orig = btn.textContent;
    btn.setAttribute('data-orig', orig);
    btn.textContent = '✓ applied';
    btn.style.borderColor = 'var(--color-primary)';
    btn.style.background = 'color-mix(in srgb, var(--color-primary) 12%, white)';
    setTimeout(function () {
      btn.textContent = btn.getAttribute('data-orig') || orig;
      btn.style.borderColor = '';
      btn.style.background = '';
    }, 900);
  }
  form.querySelectorAll('.gao-preset[data-preset]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var preset = btn.getAttribute('data-preset');
      var all = form.querySelectorAll('input[name="gao-categories"]');
      if (preset === 'clear') {
        all.forEach(function (cb) { cb.checked = false; });
      } else {
        var set = categoryPresets[preset] || [];
        all.forEach(function (cb) { cb.checked = set.indexOf(cb.value) !== -1; });
      }
      flashPreset(btn);
    });
  });

  // Draft preset buttons
  var draftPresets = {
    none:            [],
    work:            ['work'],
    'all-important': ['work','school','family','health','bills','projects','events','support','job-search']
  };
  form.querySelectorAll('.gao-preset[data-drafts-preset]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var preset = btn.getAttribute('data-drafts-preset');
      var set = draftPresets[preset] || [];
      draftCheckboxes.forEach(function (cb) { cb.checked = set.indexOf(cb.value) !== -1; });
      if (draftsNone) draftsNone.checked = set.length === 0;
      flashPreset(btn);
    });
  });

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

    var getVal = function (id, fallback) {
      var el = document.getElementById(id);
      return el ? el.value : fallback;
    };
    var getChecked = function (id) {
      var el = document.getElementById(id);
      return !!(el && el.checked);
    };

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
      extra: (document.getElementById('gao-extra') || {}).value || '',
      backlog: getRadioValue('gao-backlog') || 'light',
      aggressiveness: getRadioValue('gao-aggressiveness') || 'balanced',
      batchSize: parseInt(getVal('gao-batch-size', '25'), 10),
      sleepMs: parseInt(getVal('gao-sleep-ms', '250'), 10),
      maxExecMin: parseInt(getVal('gao-max-exec', '4'), 10),
      confidence: parseFloat(getVal('gao-confidence', '0.7')),
      bodyChars: parseInt(getVal('gao-body-chars', '1500'), 10),
      quietStart: getVal('gao-quiet-start', '07:00'),
      quietEnd: getVal('gao-quiet-end', '22:00'),
      dryRun: getChecked('gao-dry-run'),
      oldestFirst: getChecked('gao-oldest-first'),
      separatePromos: getChecked('gao-separate-promos')
    };
  }

  function buildPrompt(data) {
    var lines = [];
    lines.push('Build me a Google Apps Script that connects to the Gemini API to organize my Gmail inbox.');
    lines.push('Store the API key in Script Properties under the key "GEMINI_API_KEY".');
    lines.push('');
    var backlogBlurb = {
      zero: 'I am at Inbox Zero and just maintaining — optimize for accuracy over speed.',
      light: 'I have a light backlog (<500 unread) — balanced throughput is fine.',
      medium: 'I have a medium backlog (500-5,000 unread) — I need steady cleanup.',
      heavy: 'I have a heavy backlog (5,000-10,000 unread) — prioritize throughput.',
      overwhelming: 'I have an OVERWHELMING backlog (10,000+ unread) — enable backlog-blitz mode: max the Gmail daily quota, process oldest threads first, and keep DRY_RUN true for the first 3 days so I can verify behavior before letting it modify mail.'
    };
    lines.push('SITUATION: ' + (backlogBlurb[data.backlog] || backlogBlurb.light));
    var aggBlurb = {
      conservative: 'CONSERVATIVE MODE: label only, never archive or trash. Use confidence >= 0.80 for any action.',
      balanced: 'BALANCED MODE: label everything, archive low-priority, keep important threads in inbox.',
      aggressive: 'AGGRESSIVE MODE: archive + mark-read broadly, trash obvious promotional junk, only leave clearly-important threads in inbox.',
      blitz: 'BACKLOG-BLITZ MODE: the goal is to clear the backlog fast. Max daily Gmail quotas, run every 15 minutes during active hours, process oldest threads first, and keep a conservative confidence threshold (0.60) so the AI is willing to sort aggressively. Keep DRY_RUN true by default so I can verify the first few runs.'
    };
    lines.push('MODE: ' + (aggBlurb[data.aggressiveness] || aggBlurb.balanced));
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
    lines.push('- Include a main function that processes unread threads using the Gemini API');
    if (data.digestEnabled) lines.push('- Include a separate digest function that composes and sends the summary email (set MimeType/charset to UTF-8 so emoji and em-dashes render correctly)');
    lines.push('- Add clear comments explaining each section so a non-developer can modify it later');
    lines.push('- Use GmailApp and UrlFetchApp only (no external libraries)');
    lines.push('');
    lines.push('ARCHITECTURE (important — these are the lessons from real deployments):');
    lines.push('- Rule engine BEFORE the LLM: apply deterministic rules first and only call Gemini for ambiguous threads. Hardcoded rule hits (not AI decisions) must include: Gmail category matches (`category:promotions`, `category:social`, `list:*` for mailing lists), VIP allowlist, security alerts, self-sent mail, and obvious unsubscribe footers. This typically cuts API cost by ~60%.');
    lines.push('- Model: default to "gemini-2.5-flash" (stable). Expose a MODEL_ID constant at the top so I can swap in "gemini-3.1-flash-lite-preview" later.');
    lines.push('- Gemini request protocol (critical — skipping this produces markdown-wrapped JSON and silent miscategorizations): call the API with `generationConfig: { temperature: 0.1, responseMimeType: "application/json", thinkingConfig: { thinkingLevel: "minimal" } }`. Define a strict JSON schema for the response with fields `action`, `label`, `urgency`, `confidence`, `summary`. Parse `candidates[0].content.parts[0].text` as JSON. If parsing fails, skip the thread and log the error — do NOT guess or fall back to text parsing.');
    lines.push('- Truncate email body content sent to Gemini to the first ' + data.bodyChars + ' characters. Long reply chains otherwise burn tokens for no classification benefit.');
    lines.push('- Retries: on 429 or 5xx, retry with exponential backoff (1s, 2s, 4s) with a MAX_RETRIES cap of 3. Never use an infinite retry loop (no "i--" patterns).');
    lines.push('- Tuning constants (use these exact values): BATCH_SIZE = ' + data.batchSize + ', INTER_THREAD_SLEEP_MS = ' + data.sleepMs + ', MAX_EXECUTION_MS = ' + (data.maxExecMin * 60 * 1000) + ', MIN_CONFIDENCE = ' + data.confidence.toFixed(2) + '. Expose these as named constants at the top of the script so I can retune without reading the code.');
    lines.push('- Order of operations on each thread: apply the PROCESSED label FIRST, then archive/trash/draft. Skip label ops on already-trashed threads. Do not mark threads unread again after processing.');
    lines.push('- SEARCH_QUERY must exclude the PROCESSED label dynamically (e.g. `-label:"Processed"`), and must be built from the label name constant so renaming the label does not break the search.');
    lines.push('- NEVER-TOUCH guards (hardcode these): security alerts and 2FA codes, mail sent by me (self-sender), threads already in Drafts, threads in Trash or Spam. VIPs never get auto-archived or trashed.');
    lines.push('- Quiet hours: if the script fires before ' + data.quietStart + ' or after ' + data.quietEnd + ' local time, exit early without processing.');
    lines.push('- Concurrency lock: call `LockService.getScriptLock().waitLock(10000)` at the start of the main sweep. If the lock cannot be acquired, exit immediately — another instance is already running. Skipping this corrupts the stats counter when triggers overlap.');
    lines.push('- Execution-time safety: use the MAX_EXECUTION_MS constant above (Apps Script hard-kills at 6 minutes). Record start time, check elapsed inside the thread loop, and break out cleanly when approaching the limit.');
    lines.push('- DRY_RUN mode: include a `DRY_RUN` boolean flag at the top, default ' + (data.dryRun ? 'TRUE' : 'false') + '. When true, log the decision for each thread but do NOT execute archive/trash/draft operations.' + (data.dryRun ? ' I want it ON initially so I can verify the first runs before trusting it.' : ''));
    if (data.oldestFirst) {
      lines.push('- Process oldest threads first: sort the search results by date ascending (use `older_than` queries stepping back in time if needed) so the backlog gets chewed through chronologically, not newest-first.');
    }
    if (data.separatePromos) {
      lines.push('- Use Gmail\'s native category filters: match `category:promotions`, `category:social`, and `list:*` threads via SEARCH_QUERY and handle them deterministically (archive + label) BEFORE any Gemini call. These should never hit the LLM.');
    }
    lines.push('- VIPs: define a `VIPS` JavaScript array of email addresses at the top of the script (populated from my VIP list above). Any match bypasses all archive/trash rules and gets a "VIP" label applied.');
    lines.push('- PROCESSED label: use a flat label named exactly `Processed` (never include "AI" or any tooling suffix in any label name — the label list should look human-authored). Store the exact string in a `PROCESSED_LABEL` constant and build SEARCH_QUERY from it.');
    lines.push('- Label naming rule (strict): no label created by this script may contain "AI", "Bot", "GPT", "Gemini", or any other tooling tell. Category labels use plain human names only (e.g. `Newsletters`, `Receipts`, `VIP`).');
    lines.push('- Logging: use `console.error` for failures and `console.log` for successes, so the Apps Script execution panel\'s severity filter works cleanly.');
    lines.push('- Secrets: read the API key via PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY"). Never hardcode. If missing, throw a clear error that names the exact property key.');
    lines.push('- Error handling: wrap the main loop in try/catch. On fatal error, send me a single notification email (not one per thread) and store last-error + timestamp in UserProperties so the digest can surface it.');
    if (data.draftCategories.length > 0) {
      lines.push('- Drafts: only create a draft if Gemini returns a confidence >= ' + data.confidence.toFixed(2) + '. Otherwise label the thread for manual review with a "Review" label.');
    }
    lines.push('- Include a one-time setup() function that (a) creates any missing labels so the first run does not fail on a MailLabel lookup, (b) installs the time-based triggers for the main sweep (hourly) and digest (daily), checking first whether each already exists to avoid duplicates. Non-dev users will forget to install triggers manually and the script will silently never run.');
    lines.push('');
    lines.push('OBSERVABILITY (do not skip this — without it I am flying blind):');
    lines.push('- Maintain running counters in `PropertiesService.getUserProperties()` for threads trashed, archived, kept, drafted, skipped, and errors since last digest.');
    lines.push('- Include a daily digest function on its own trigger that emails me a plain-text summary using `MailApp.sendEmail` with `charset: "UTF-8"`. Reset the counters after sending.');
    lines.push('- The digest should surface the last fatal error (timestamp + message) if any occurred since the previous digest.');
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
