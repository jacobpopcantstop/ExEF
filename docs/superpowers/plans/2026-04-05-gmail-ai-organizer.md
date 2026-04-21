# Gmail AI Organizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a resource page that walks non-technical users through setting up a free Gmail AI organizer, with a 12-question questionnaire that generates a customized AI prompt.

**Architecture:** Single HTML page + one vanilla JS file (IIFE). The walkthrough is static HTML. The questionnaire reads form inputs and builds a prompt string at generation time — no state, no localStorage, no API calls. Output is a copyable text block.

**Tech Stack:** HTML, CSS (existing site classes), vanilla JS, inline form styles matching `coaching-contact.html`

**Spec:** `docs/superpowers/specs/2026-04-05-gmail-ai-organizer-design.md`

---

### Task 1: Create the HTML page — header, walkthrough, and static sections

**Files:**
- Create: `gmail-ai-organizer.html`

This task builds the full page shell: head/meta, nav, breadcrumb, page header, "What You'll Build" card, "Before You Start" checklist, 6-step walkthrough cards, empty questionnaire form container, empty output container, FAQ section, and footer. The questionnaire form fields and JS are added in later tasks.

- [ ] **Step 1: Create `gmail-ai-organizer.html` with complete static content**

Copy the full page boilerplate from `resources.html` as a starting template. This includes the `<body>` tag, skip-link, nav, and `<main>` wrapper. Key elements that MUST be present:

```html
<body class="page-gmail-ai-organizer">
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <nav class="nav" role="navigation" aria-label="Main navigation">
    <!-- Copy nav from resources.html, set nav__link--active on Resources -->
  </nav>

  <main id="main-content">
    <!-- All page sections go here -->
  </main>

  <footer>...</footer>
</body>
```

Head block:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Build a Free AI Email Organizer | EFI</title>
  <meta name="description" content="Step-by-step guide to building a free AI-powered Gmail organizer using Google Apps Script and the Gemini API. Includes a customization questionnaire that generates your personal setup prompt.">
  <link rel="preload" href="css/styles.css" as="style">
  <link rel="stylesheet" href="css/styles.css">
  <link rel="icon" href="favicon.svg">
  <meta property="og:title" content="Build a Free AI Email Organizer | EFI">
  <meta property="og:description" content="Set up an AI Gmail organizer for under $1/month. No coding required — customize with a questionnaire, copy a prompt, paste into any AI.">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="The Executive Functioning Institute">
  <meta property="og:image" content="https://executivefunctioninginstitute.com/images/efi-og-card.svg">
  <meta property="og:image:type" content="image/svg+xml">
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:image" content="https://executivefunctioninginstitute.com/images/efi-og-card.svg">
  <link rel="canonical" href="https://executivefunctioninginstitute.com/gmail-ai-organizer.html">
  <script src="js/theme-init.min.js"></script>
</head>
```

Page sections (all inside `<main id="main-content">`), in order:
1. **Page header** with breadcrumb `Home > Resources > Gmail AI Organizer`, h1 "Build a Free AI Email Organizer", subtitle.
2. **"What You'll Build"** — `section > container--narrow > card` with bullet list of features. Include a `notice` with cost comparison: "The Gemini API costs pennies per day for this kind of usage — typically under $1/month. Paid email organizer services that do the same thing charge $20/month or more."
3. **"Before You Start"** — `section--alt > container--narrow > card` with `checklist` of 4 prerequisites.
4. **Walkthrough** — `section > container--narrow` with 6 numbered cards. Each card has an h3 ("Step 1: Open Google Apps Script", etc.), instructions as a numbered list, and `callout` or `notice` elements for tips/warnings per the spec.
5. **Questionnaire** — `section--alt > container--narrow` with section header "Customize Your Email Organizer" and a `<form id="gao-questionnaire">` element. Leave the form body empty for Task 2.
6. **Output** — `section > container--narrow` with `id="gao-output"`, `hidden` attribute, and `aria-live="polite"`. Contains:
   ```html
   <div id="gao-output" hidden aria-live="polite">
     <div class="section-header"><h2>Your Custom Prompt</h2></div>
     <div id="gao-summary"></div>
     <div id="gao-prompt-block"></div>
     <div style="margin-top:var(--space-md);text-align:center">
       <button type="button" id="gao-copy-prompt" class="btn btn--primary btn--sm">Copy Prompt</button>
     </div>
   </div>
   ```
7. **FAQ** — `section--alt > container--narrow` with 5 cards per spec (permissions warning, nothing happened, changing categories, cost, Outlook/Yahoo).
8. **Footer** — same pattern as other pages: `<footer class="footer"><div class="container"><div class="footer__bottom"><span>&copy; 2026 The Executive Functioning Institute</span></div></div></footer>`
9. Scripts before `</body>`: `nav-auth.min.js` (defer), `gmail-ai-organizer.min.js` (defer), `main.min.js` (defer).

- [ ] **Step 2: Create a minimal placeholder `js/gmail-ai-organizer.js`**

```js
(function initGmailAiOrganizer() {
  'use strict';
  if (!document.getElementById('gao-questionnaire')) return;
  // Questionnaire logic added in Task 2
})();
```

- [ ] **Step 3: Build and verify**

Run: `python3 scripts/build_css.py && python3 scripts/minify_page_scripts.py`

Open the page in a browser and verify:
- Nav renders correctly with Resources highlighted
- Breadcrumb links work
- All 6 walkthrough steps render as cards
- FAQ cards render
- Dark theme toggle works
- Page is responsive on mobile widths

- [ ] **Step 4: Commit**

```bash
git add gmail-ai-organizer.html js/gmail-ai-organizer.js js/gmail-ai-organizer.min.js
git commit -m "feat: add Gmail AI Organizer page with walkthrough and FAQ"
```

---

### Task 2: Build the questionnaire form HTML

**Files:**
- Modify: `gmail-ai-organizer.html` (the `<form id="gao-questionnaire">` element)

Add all 12 questions as form fields inside the existing form element. Use inline styles matching `coaching-contact.html` pattern. Group into 4 fieldsets with legends.

- [ ] **Step 1: Add the questionnaire form fields**

Form input style pattern (reuse everywhere):
```
style="width:100%;padding:0.7rem;border:1px solid var(--color-border);border-radius:var(--border-radius);font-family:var(--font-body);font-size:0.95rem"
```

Label style pattern:
```
style="display:block;font-weight:600;font-size:0.9rem;margin-bottom:var(--space-xs)"
```

Checkbox/radio label style:
```
style="display:flex;align-items:flex-start;gap:var(--space-sm);font-size:0.95rem;cursor:pointer"
```

The 4 fieldsets:

**Fieldset A: Email Categories**
- Q1: "Which categories do you want?" — 9 preset checkboxes (School, Work, Bills/Finance, Family, Health, Shopping/Orders, Newsletters, Social Media, Promotions/Spam) each with `name="gao-categories"` and `value` matching the label. Plus a text input `id="gao-custom-categories"` with placeholder "Add custom categories (comma-separated)".
- Q2: "Create a catch-all 'Other' label for uncategorized email?" — 2 radio buttons `name="gao-catchall"`, values "yes" (checked by default) and "no".

**Fieldset B: Actions & Automation**
- Q3: "What should happen with low-priority emails (newsletters, promotions)?" — 4 radio buttons `name="gao-lowpri"`: "label" (Label only), "archive" (Label + archive out of inbox), "archive-read" (Label + archive + mark as read), "nothing" (Leave them alone).
- Q4: "Draft reply suggestions for which categories?" — Same 9 preset checkboxes as Q1 with `name="gao-drafts"`, plus a "None" checkbox with both `name="gao-drafts-none"` AND `id="gao-drafts-none"` that is checked by default.
- Q5: "What tone should draft replies use?" — 4 radio buttons `name="gao-tone"`: "formal", "friendly" (Friendly & brief), "casual", "match" (Match the sender's tone).

**Fieldset C: Daily Digest**
- Q6: "Send a daily digest email summarizing your inbox?" — 2 radio buttons `name="gao-digest"`, values "yes" and "no" (checked by default). The "yes" radio has an `onchange` handler (wired in JS) to show Q7+Q8.
- Q7 (wrapper `id="gao-digest-options"`, `hidden`): "What should the digest include?" — 4 checkboxes `name="gao-digest-include"`: "counts" (Count per category), "action" (List of action-required emails), "flagged" (Flagged sender highlights), "archived" (Summary of what was auto-archived).
- Q8 (inside same wrapper): "What time should the digest arrive?" — select dropdown `id="gao-digest-time"` with options: "morning" (Morning 7–9am), "midday" (Midday 12–1pm), "evening" (Evening 5–7pm), "custom". Below dropdown, add: `<input type="time" id="gao-digest-custom-time" hidden style="...">` (hidden by default, shown via JS when "custom" selected).

**Fieldset D: Schedule & Preferences**
- Q9: "How often should the bot run?" — 4 radio buttons `name="gao-frequency"`: "hourly" (Every hour), "6hours" (Every 6 hours), "daily" (Once daily), "twice" (Twice daily — morning + evening).
- Q10: "Which days should it run?" — 3 radio buttons `name="gao-days"`: "every" (Every day), "weekdays" (Weekdays only), "custom". (Note: spec says "checkboxes" but radio is correct since options are mutually exclusive.) If "custom" is selected, show a container with 7 day checkboxes:
   ```html
   <div id="gao-custom-days-container" hidden style="margin-top:var(--space-sm);margin-left:var(--space-lg)">
     <label style="..."><input type="checkbox" name="gao-custom-days" value="Monday"> Monday</label>
     <label style="..."><input type="checkbox" name="gao-custom-days" value="Tuesday"> Tuesday</label>
     <!-- ... through Sunday -->
   </div>
   ```
- Q11: "VIP senders — never auto-archive these" — textarea `id="gao-vip"` with placeholder "One email address per line, e.g.\nprincipal@school.edu\ndoctor@health.com".
- Q12: "Any additional instructions for your bot?" — textarea `id="gao-extra"` with placeholder "e.g., Flag anything from my kid's school as urgent".

Submit button: `<button type="submit" class="btn btn--primary btn--lg" style="width:100%;margin-top:var(--space-xl)">Generate My Prompt</button>`

Each fieldset gets: `<fieldset style="border:none;padding:0;margin:0 0 var(--space-xl)"><legend style="font-family:var(--font-heading);font-size:1.2rem;font-weight:700;margin-bottom:var(--space-md);color:var(--color-heading)">Section A: Email Categories</legend>...</fieldset>`

Each question group gets `margin-top:var(--space-md)`.

- [ ] **Step 2: Verify the form renders correctly**

Open page in browser, confirm:
- All 4 fieldsets with legends visible
- All 12 questions render with correct input types
- Checkboxes and radios are clickable
- Q7/Q8 hidden by default (via `hidden` attribute)
- Textareas resize vertically
- Looks correct in dark mode
- Responsive at mobile width (single column)

- [ ] **Step 3: Commit**

```bash
git add gmail-ai-organizer.html
git commit -m "feat: add 12-question customization questionnaire form"
```

---

### Task 3: Implement questionnaire JS — validation, conditional visibility, prompt generation

**Files:**
- Modify: `js/gmail-ai-organizer.js` (replace placeholder IIFE with full implementation)

This is the core logic. The IIFE handles:
- Digest options toggle (Q6 → Q7/Q8)
- Custom day picker toggle (Q10)
- Custom digest time toggle (Q8)
- "None" checkbox in Q4 unchecking other draft checkboxes
- Form validation
- Prompt string generation
- Plain-English summary generation
- Copy button

- [ ] **Step 1: Write the full IIFE**

```js
(function initGmailAiOrganizer() {
  'use strict';
  if (!document.getElementById('gao-questionnaire')) return;

  // ── DOM refs ──
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

  // ── Preset categories (used for Q1/Q4 intersection) ──
  var PRESET_CATEGORIES = [
    'School', 'Work', 'Bills/Finance', 'Family', 'Health',
    'Shopping/Orders', 'Newsletters', 'Social Media', 'Promotions/Spam'
  ];

  // ── Conditional visibility ──
  function toggleDigestOptions() {
    var checked = form.querySelector('input[name="gao-digest"]:checked');
    if (digestOptions) {
      digestOptions.hidden = !(checked && checked.value === 'yes');
    }
  }

  function toggleCustomDays() {
    var checked = form.querySelector('input[name="gao-days"]:checked');
    if (customDaysContainer) {
      customDaysContainer.hidden = !(checked && checked.value === 'custom');
    }
  }

  function toggleCustomDigestTime() {
    if (digestCustomTime) {
      digestCustomTime.hidden = !(digestTimeSelect && digestTimeSelect.value === 'custom');
    }
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

  // Wire up toggles
  digestRadios.forEach(function (r) { r.addEventListener('change', toggleDigestOptions); });
  daysRadios.forEach(function (r) { r.addEventListener('change', toggleCustomDays); });
  if (digestTimeSelect) digestTimeSelect.addEventListener('change', toggleCustomDigestTime);
  if (draftsNone) draftsNone.addEventListener('change', handleDraftsNone);
  draftCheckboxes.forEach(function (cb) { cb.addEventListener('change', handleDraftCategory); });

  // ── Helpers ──
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

  // ── Validation ──
  function validate() {
    clearErrors();
    var valid = true;
    var firstError = null;

    // Q1: at least one category
    var cats = getCheckedValues('gao-categories');
    var customCats = (document.getElementById('gao-custom-categories') || {}).value || '';
    if (cats.length === 0 && customCats.trim() === '') {
      var q1 = form.querySelector('input[name="gao-categories"]');
      var err = showError(q1.closest('fieldset').querySelector('legend'), 'Select at least one category or add a custom one.');
      if (!firstError) firstError = err;
      valid = false;
    }

    // Q3: radio required
    if (!getRadioValue('gao-lowpri')) {
      var q3legend = form.querySelectorAll('fieldset')[1].querySelector('legend');
      var err = showError(q3legend, 'Select how low-priority emails should be handled.');
      if (!firstError) firstError = err;
      valid = false;
    }

    // Q5: radio required
    if (!getRadioValue('gao-tone')) {
      var toneLabel = form.querySelector('input[name="gao-tone"]').closest('div');
      var err = showError(toneLabel, 'Select a reply tone.');
      if (!firstError) firstError = err;
      valid = false;
    }

    // Q9: radio required
    if (!getRadioValue('gao-frequency')) {
      var freqLabel = form.querySelector('input[name="gao-frequency"]').closest('div');
      var err = showError(freqLabel, 'Select how often the bot should run.');
      if (!firstError) firstError = err;
      valid = false;
    }

    // Q10: radio required + custom days validation
    var daysVal = getRadioValue('gao-days');
    if (!daysVal) {
      var daysLabel = form.querySelector('input[name="gao-days"]').closest('div');
      var err = showError(daysLabel, 'Select which days the bot should run.');
      if (!firstError) firstError = err;
      valid = false;
    } else if (daysVal === 'custom' && getCheckedValues('gao-custom-days').length === 0) {
      var customDaysEl = document.getElementById('gao-custom-days-container');
      var err = showError(customDaysEl, 'Select at least one day.');
      if (!firstError) firstError = err;
      valid = false;
    }

    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return valid;
  }

  // ── Read form state ──
  function readForm() {
    var cats = getCheckedValues('gao-categories');
    var customRaw = (document.getElementById('gao-custom-categories') || {}).value || '';
    var customCats = customRaw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var allCategories = cats.concat(customCats);

    var draftCats = getCheckedValues('gao-drafts');
    // Intersect with selected categories
    var activeDrafts = draftCats.filter(function (d) {
      return allCategories.indexOf(d) !== -1;
    });

    var digestEnabled = getRadioValue('gao-digest') === 'yes';
    var digestIncludes = digestEnabled ? getCheckedValues('gao-digest-include') : [];
    var digestTime = digestEnabled ? (digestTimeSelect ? digestTimeSelect.value : 'morning') : null;
    if (digestTime === 'custom') {
      var customEl = document.getElementById('gao-digest-custom-time');
      digestTime = customEl ? customEl.value : 'morning';
    }

    var days = getRadioValue('gao-days');
    if (days === 'custom') {
      days = getCheckedValues('gao-custom-days').join(', ');
    }

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

  // ── Prompt builder ──
  function buildPrompt(data) {
    var lines = [];
    lines.push('Build me a Google Apps Script that connects to the Gemini API to organize my Gmail inbox.');
    lines.push('Store the API key in Script Properties under the key "GEMINI_API_KEY".');
    lines.push('');

    // Sorting rules
    lines.push('SORTING RULES:');
    lines.push('- Create these Gmail labels and sort incoming unread emails into them: ' + data.categories.join(', '));
    if (data.catchall) {
      lines.push('- Anything that doesn\'t match a category goes to a label called "Other"');
    }
    lines.push('');

    // Automation
    lines.push('AUTOMATION:');
    var lowpriMap = {
      'label': 'Label only (do not archive)',
      'archive': 'Archive out of inbox',
      'archive-read': 'Archive out of inbox and mark as read',
      'nothing': 'Do not touch — leave in inbox as-is'
    };
    lines.push('- Low-priority emails (Newsletters, Promotions, Social Media): ' + (lowpriMap[data.lowpri] || data.lowpri));
    if (data.draftCategories.length > 0) {
      lines.push('- Draft reply suggestions for: ' + data.draftCategories.join(', '));
      var toneMap = { 'formal': 'formal', 'friendly': 'friendly and brief', 'casual': 'casual', 'match': 'match the sender\'s tone' };
      lines.push('- Reply tone: ' + (toneMap[data.tone] || data.tone));
    } else {
      lines.push('- Do not draft any replies');
    }
    lines.push('');

    // Digest
    if (data.digestEnabled) {
      lines.push('DAILY DIGEST:');
      var timeMap = { 'morning': 'every morning between 7-9am', 'midday': 'around midday (12-1pm)', 'evening': 'in the evening (5-7pm)' };
      lines.push('- Send me a summary email ' + (timeMap[data.digestTime] || 'at ' + data.digestTime));
      var includeMap = {
        'counts': 'count of emails per category',
        'action': 'list of action-required emails',
        'flagged': 'flagged sender highlights',
        'archived': 'summary of what was auto-archived'
      };
      var includes = data.digestIncludes.map(function (k) { return includeMap[k] || k; });
      if (includes.length > 0) {
        lines.push('- Include: ' + includes.join(', '));
      }
      lines.push('');
    }

    // Schedule
    lines.push('SCHEDULE:');
    var freqMap = { 'hourly': 'every hour', '6hours': 'every 6 hours', 'daily': 'once daily', 'twice': 'twice daily (morning and evening)' };
    lines.push('- Process unread emails ' + (freqMap[data.frequency] || data.frequency));
    lines.push('- Run on: ' + data.days);
    lines.push('');

    // VIP
    if (data.vip.trim()) {
      lines.push('VIP LIST (never auto-archive or auto-sort these senders):');
      data.vip.trim().split('\n').forEach(function (line) {
        var trimmed = line.trim();
        if (trimmed) lines.push('- ' + trimmed);
      });
      lines.push('');
    }

    // Extra
    if (data.extra.trim()) {
      lines.push('ADDITIONAL INSTRUCTIONS:');
      lines.push('- ' + data.extra.trim());
      lines.push('');
    }

    // Implementation footer
    lines.push('IMPLEMENTATION REQUIREMENTS:');
    lines.push('- Include a main function that processes unread emails using the Gemini API');
    if (data.digestEnabled) {
      lines.push('- Include a separate digest function that composes and sends the summary email');
    }
    lines.push('- Add clear comments explaining each section so a non-developer can modify it later');
    lines.push('- Add error handling that sends me an email notification if the script fails');
    lines.push('- Use GmailApp and UrlFetchApp (no external libraries)');

    return lines.join('\n');
  }

  // ── Summary builder ──
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

  // ── Copy handler ──
  function copyPrompt(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        if (copyBtn) copyBtn.textContent = 'Copied!';
        setTimeout(function () { if (copyBtn) copyBtn.textContent = 'Copy Prompt'; }, 2000);
      }).catch(function () {
        if (copyBtn) copyBtn.textContent = 'Copy failed — select and copy manually';
        setTimeout(function () { if (copyBtn) copyBtn.textContent = 'Copy Prompt'; }, 3000);
      });
    }
  }

  // ── Form submit ──
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    var data = readForm();
    var prompt = buildPrompt(data);
    var summary = buildSummary(data);

    // Render summary
    if (summaryEl) {
      summaryEl.textContent = summary;
      summaryEl.style.cssText = 'font-size:1.05rem;line-height:1.6;color:var(--color-text);margin-bottom:var(--space-lg);padding:var(--space-md);background:var(--color-bg-alt);border-radius:var(--border-radius);border-left:4px solid var(--module-3)';
    }

    // Render prompt
    if (promptBlockEl) {
      promptBlockEl.innerHTML = '';
      var pre = document.createElement('pre');
      pre.style.cssText = 'white-space:pre-wrap;word-wrap:break-word;background:var(--color-bg-alt);padding:var(--space-lg);border-radius:var(--border-radius);border:1px solid var(--color-border);font-size:0.88rem;line-height:1.6;max-height:500px;overflow-y:auto';
      pre.textContent = prompt;
      promptBlockEl.appendChild(pre);
    }

    // Show output and wire copy
    if (outputSection) outputSection.hidden = false;
    if (copyBtn) {
      copyBtn.onclick = function () { copyPrompt(prompt); };
    }

    // Scroll to output
    if (outputSection) {
      outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
})();
```

- [ ] **Step 2: Minify**

Run: `python3 scripts/minify_page_scripts.py`
Verify `js/gmail-ai-organizer.min.js` is created.

- [ ] **Step 3: Test the full flow in a browser**

1. Open `gmail-ai-organizer.html`
2. Try submitting with no selections — verify validation errors appear and page scrolls to first error
3. Select at least one category, fill required radios, submit — verify prompt and summary appear
4. Click "Copy Prompt" — verify clipboard contains the prompt text
5. Toggle digest yes/no — verify Q7/Q8 show/hide
6. Select "custom" days — verify day checkboxes appear
7. Check "None" in Q4 — verify other draft checkboxes uncheck
8. Test in dark mode
9. Test at mobile width

- [ ] **Step 4: Commit**

```bash
git add js/gmail-ai-organizer.js js/gmail-ai-organizer.min.js
git commit -m "feat: add questionnaire logic, prompt generation, and copy support"
```

---

### Task 4: Add link card to resources.html

**Files:**
- Modify: `resources.html` (add a card in the "Browser Tools & AI Workflow" accordion section, around line 728)

- [ ] **Step 1: Add a callout card inside the "Browser Tools & AI Workflow" accordion section**

In `resources.html`, find the accordion item whose button text is "Browser Tools & AI Workflow". Inside its `accordion__content` div, insert after the existing `<p><strong>Key insight:</strong> AI-powered planners represent the next frontier...` paragraph:

```html
<div class="card" style="margin-top:var(--space-lg);border-left:4px solid var(--module-3)">
  <h4 style="margin-top:0">Build Your Own: Free AI Email Organizer</h4>
  <p>EFI published a step-by-step guide to building a Gmail organizer powered by the Gemini API. A 12-question questionnaire generates a custom AI prompt — paste it into any chatbot and get a working script in minutes. Costs under $1/month.</p>
  <a href="gmail-ai-organizer.html" class="btn btn--primary btn--sm">Open the Guide</a>
</div>
```

- [ ] **Step 2: Verify the card renders in the accordion**

Open `resources.html`, expand "Browser Tools & AI Workflow" accordion, confirm the card appears at the bottom with the green left border.

- [ ] **Step 3: Commit**

```bash
git add resources.html
git commit -m "feat: link Gmail AI Organizer guide from resources page"
```

---

### Task 5: Final build, full test, push

**Files:**
- All files from Tasks 1–4

- [ ] **Step 1: Rebuild CSS and minify JS**

```bash
python3 scripts/build_css.py && python3 scripts/minify_page_scripts.py
```

- [ ] **Step 2: Run Playwright tests**

```bash
npx playwright test
```

Expected: all 19 tests pass (no regressions).

- [ ] **Step 3: Manual smoke test**

1. Navigate from `resources.html` → Browser Tools accordion → "Open the Guide" link → lands on `gmail-ai-organizer.html`
2. Read through walkthrough steps — all 6 cards render
3. Fill out questionnaire with a mix of selections
4. Generate prompt — verify output appears with summary + prompt
5. Copy prompt — verify clipboard
6. Check FAQ section renders 5 cards
7. Dark mode — all sections readable
8. Mobile — form is single-column and usable
9. Breadcrumb links work (Home, Resources)

- [ ] **Step 4: Push to main**

```bash
git push origin main
```
