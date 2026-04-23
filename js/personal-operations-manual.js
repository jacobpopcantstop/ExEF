(function () {
  'use strict';

  var form = document.getElementById('pom-form');
  if (!form) return;

  var DRAFT_KEY = 'efi_pom_builder_draft_v1';
  var sectionsWrap = document.getElementById('pom-sections');
  var previewShell = document.getElementById('pom-preview-shell');
  var draftStatus = document.getElementById('pom-draft-status');
  var progressTitle = document.getElementById('pom-progress-title');
  var progressText = document.getElementById('pom-progress-text');
  var progressBar = document.getElementById('pom-progress-bar');
  var progressFill = document.getElementById('pom-progress-fill');
  var shareStatus = document.getElementById('pom-share-status');
  var downloadHtmlBtn = document.getElementById('pom-download-html');
  var downloadTextBtn = document.getElementById('pom-download-text');
  var copyTextBtn = document.getElementById('pom-copy-text');
  var clearDraftBtn = document.getElementById('pom-clear-draft');
  var photoInput = document.getElementById('pom-photo');
  var photoPreview = document.getElementById('pom-photo-preview');
  var photoImage = document.getElementById('pom-photo-image');
  var removePhotoBtn = document.getElementById('pom-remove-photo');

  var profileFields = [
    { id: 'pom-name', label: 'Your name' },
    { id: 'pom-role', label: 'Role' },
    { id: 'pom-team', label: 'Team or org' },
    { id: 'pom-pronouns', label: 'Pronouns' },
    { id: 'pom-timezone', label: 'Primary time zone' },
    { id: 'pom-location', label: 'Location or work context' },
    { id: 'pom-photo-caption', label: 'Photo caption' }
  ];

  var photoDataUrl = '';

  var sections = [
    {
      id: 'about',
      title: 'About Me',
      lede: 'Introduce yourself and give teammates enough context to understand who you are beyond your job title.',
      choicesLegend: 'Quick descriptors',
      choicesHint: 'Use these as shorthand if they fit, then add nuance in your own words below.',
      choices: ['Direct', 'Warm', 'Quiet thinker', 'Humor-friendly', 'Big-picture', 'Detail-oriented'],
      prompts: [
        { id: 'intro', label: 'Introduce yourself to your coworkers.', span: 'full' },
        { id: 'photo-note', label: 'What should people know about the picture or profile you are using?' },
        { id: 'job', label: 'How would you describe your job to someone who does not know anything about it?', span: 'full' }
      ]
    },
    {
      id: 'schedule',
      title: 'My Work Schedule',
      lede: 'Clarify your working hours, response windows, and after-hours expectations so people do not guess wrong.',
      choicesLegend: 'Helpful schedule signals',
      choicesHint: 'Check what teammates should assume by default.',
      choices: ['Morning deep work', 'Midday collaboration', 'Async-friendly', 'Protects evenings', 'Flexible midday breaks', 'Hybrid schedule'],
      prompts: [
        { id: 'availability', label: 'When are you normally available or unavailable? Are there specific times you do not check work messages?', span: 'full' },
        { id: 'zones', label: 'What time zone or time zones do you work in?' },
        { id: 'after-hours', label: 'What are your expectations around after-hours communication?', span: 'full' }
      ]
    },
    {
      id: 'contact',
      title: 'How To Contact Me',
      lede: 'Make your communication defaults explicit so urgent and non-urgent issues reach you the right way.',
      choicesLegend: 'Best default channels',
      choicesHint: 'These shortcuts help teammates choose the right tool before they reach out.',
      choices: ['Chat first', 'Email first', 'Text only if urgent', 'Calendar invite for complex topics', 'Phone calls are easy to miss', 'Tag a backup person if needed'],
      prompts: [
        { id: 'best-tool', label: 'What tool is best to reach you? Do you prefer messages, email, or something else?', span: 'full' },
        { id: 'urgent', label: 'How do you prefer to be contacted when something urgent is happening?', span: 'full' },
        { id: 'backup', label: 'Who can people contact if you are unavailable?' }
      ]
    },
    {
      id: 'communication',
      title: 'My Communication Style',
      lede: 'Explain how you write, speak, interpret tone, and process information so people can collaborate with less friction.',
      choicesLegend: 'Communication defaults',
      choicesHint: 'Select the defaults that most often help people understand how to work with you.',
      choices: ['Very direct', 'Humor shows up often', 'Shy at first', 'Prefers written follow-up', 'Camera optional', 'Likes live brainstorming'],
      prompts: [
        { id: 'style', label: 'What do you want people to know about how you communicate?', span: 'full' },
        { id: 'misunderstandings', label: 'What should people know to help prevent misunderstandings?', span: 'full' },
        { id: 'preferred-input', label: 'How do you prefer to be communicated with? For example, do you like things written down?', span: 'full' },
        { id: 'video', label: 'Do you prefer video on in calls, or voice only?' },
        { id: 'help', label: 'What do you want help with? For example, do you want people to tell you if you are being long-winded?', span: 'full' }
      ]
    },
    {
      id: 'wellbeing',
      title: 'My Well-Being',
      lede: 'Give teammates a humane map for how stress shows up and what support is actually useful.',
      choicesLegend: 'Support patterns',
      choicesHint: 'Use these if they match your experience, then add more detail in your answers.',
      choices: ['Needs quiet reset time', 'Benefits from clear priorities', 'Appreciates gentle check-ins', 'Needs meeting buffers', 'Movement breaks help', 'Silence can mean overload'],
      prompts: [
        { id: 'out-of-balance', label: 'What are signs that you are starting to feel out of balance?', span: 'full' },
        { id: 'help-stressed', label: 'How can coworkers help if you are feeling stressed or burned out?', span: 'full' },
        { id: 'stress-management', label: 'How do you manage stress?', span: 'full' },
        { id: 'relax', label: 'How do you like to relax?' }
      ]
    },
    {
      id: 'interests',
      title: 'My Interests And Hobbies',
      lede: 'Include the human details that make starting conversations and building connection easier.',
      choicesLegend: 'Conversation starters',
      choicesHint: 'Check whatever feels true enough to get people talking to you like a person, not just a role.',
      choices: ['Books', 'Music', 'Movies and TV', 'Sports', 'Travel', 'Food', 'Pets', 'Games'],
      prompts: [
        { id: 'fun', label: 'What do you do for fun outside of work?', span: 'full' },
        { id: 'media', label: 'What shows, movies, music, art, books, or sports do you enjoy?', span: 'full' },
        { id: 'pets', label: 'Do you have pets? What are their names?' },
        { id: 'foods', label: 'What are your favorite foods?' },
        { id: 'chat-about', label: 'Do you like discussing your interests with coworkers? If so, what can people chat with you about?', span: 'full' }
      ]
    },
    {
      id: 'balance',
      title: 'My Work-Life Balance',
      lede: 'Set context around home responsibilities, commuting, and the real-world constraints people should not ignore.',
      choicesLegend: 'Context coworkers should respect',
      choicesHint: 'Check only what you want colleagues to normalize when they work with you.',
      choices: ['Caregiving responsibilities', 'Shared home workspace', 'Noise constraints for calls', 'Commute-bound timing', 'School pickup or drop-off', 'Variable home schedule'],
      prompts: [
        { id: 'caregiving', label: 'Do you have caregiving responsibilities your coworkers should know about?', span: 'full' },
        { id: 'home-life', label: 'Are there aspects of your home life coworkers should be aware of?', span: 'full' },
        { id: 'commute', label: 'Do you have a commute that requires you to arrive or leave at particular times?', span: 'full' }
      ]
    },
    {
      id: 'growth',
      title: 'My Growth',
      lede: 'Help teammates and managers support your development in ways that actually work for you.',
      choicesLegend: 'Feedback and growth preferences',
      choicesHint: 'These are shortcuts. Use the prompts to explain nuance and exceptions.',
      choices: ['Private corrective feedback', 'Public appreciation is welcome', 'Stretch work is motivating', 'Examples help', 'Clear deadlines help', 'Mentoring others is energizing'],
      prompts: [
        { id: 'learn', label: 'What are things you would like to learn about or get better at?', span: 'full' },
        { id: 'negative-feedback', label: 'How do you prefer to receive negative feedback?', span: 'full' },
        { id: 'positive-feedback', label: 'How do you prefer to receive positive feedback?', span: 'full' },
        { id: 'fun-challenge', label: 'What kinds of things at work are the most fun for you? What are the most challenging?', span: 'full' },
        { id: 'fall-behind', label: 'What can cause you to fall behind or struggle at work? How can coworkers help?', span: 'full' }
      ]
    },
    {
      id: 'patience',
      title: 'What I Do Not Have Patience For',
      lede: 'This section prevents avoidable friction. Use it to name patterns, not to attack people.',
      choicesLegend: 'Common friction points',
      choicesHint: 'Select the patterns that tend to create unnecessary friction around you.',
      choices: ['Last-minute changes', 'Vague asks', 'Long meetings without purpose', 'Loud spaces', 'Interruptions during focus time', 'Poorly documented decisions'],
      prompts: [
        { id: 'peeves', label: 'Do you have any pet peeves?', span: 'full' },
        { id: 'avoid', label: 'What do you prefer people avoid doing around you?', span: 'full' },
        { id: 'environment', label: 'What bothers you about your working environment?', span: 'full' }
      ]
    },
    {
      id: 'strengths',
      title: 'My Strengths',
      lede: 'Finish with the skills and topics people can reliably come to you for.',
      choicesLegend: 'Strength areas',
      choicesHint: 'Check the kinds of work you want coworkers to think of you for first.',
      choices: ['Systems thinking', 'Writing', 'Execution', 'Troubleshooting', 'Relationship building', 'Research', 'Planning', 'Teaching'],
      prompts: [
        { id: 'skills', label: 'What job skills are you most proud of?', span: 'full' },
        { id: 'help-topics', label: 'What kinds of topics can coworkers ask you for help about?', span: 'full' }
      ]
    }
  ];

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function readDraft() {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_KEY)) || {};
    } catch (err) {
      return {};
    }
  }

  function writeDraft(nextDraft) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(nextDraft));
  }

  function setStatus(message) {
    shareStatus.textContent = message || '';
  }

  function setDraftStatus(message) {
    if (!message) {
      draftStatus.hidden = true;
      draftStatus.textContent = '';
      return;
    }
    draftStatus.hidden = false;
    draftStatus.textContent = message;
  }

  function downloadFile(fileName, content, type) {
    var blob = new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function buildFileStem(state) {
    var raw = normalizeProfile(state).name || 'personal-operating-manual';
    var cleaned = raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return cleaned || 'personal-operating-manual';
  }

  function renderSections() {
    sectionsWrap.innerHTML = sections.map(function (section, sectionIndex) {
      return '' +
        '<section class="pom-section" data-section="' + escapeHtml(section.id) + '">' +
          '<div class="pom-section__header">' +
            '<div>' +
              '<p class="pom-kicker">Section ' + String(sectionIndex + 1).padStart(2, '0') + '</p>' +
              '<h2>' + escapeHtml(section.title) + '</h2>' +
            '</div>' +
            '<span class="pom-section__count" id="count-' + escapeHtml(section.id) + '">0 answered</span>' +
          '</div>' +
          '<p class="pom-section__lede">' + escapeHtml(section.lede) + '</p>' +
          '<div class="pom-section__fields">' +
            '<fieldset class="pom-choice-panel">' +
              '<legend>' + escapeHtml(section.choicesLegend) + '</legend>' +
              '<p>' + escapeHtml(section.choicesHint) + '</p>' +
              '<div class="pom-choice-grid">' +
                section.choices.map(function (choice, choiceIndex) {
                  var id = 'choice-' + section.id + '-' + choiceIndex;
                  return '' +
                    '<label class="pom-choice" for="' + escapeHtml(id) + '">' +
                      '<input type="checkbox" id="' + escapeHtml(id) + '" name="' + escapeHtml(id) + '" data-choice-section="' + escapeHtml(section.id) + '" value="' + escapeHtml(choice) + '">' +
                      '<span>' + escapeHtml(choice) + '</span>' +
                    '</label>';
                }).join('') +
              '</div>' +
            '</fieldset>' +
            section.prompts.map(function (prompt) {
              var promptId = section.id + '-' + prompt.id;
              return '' +
                '<label' + (prompt.span === 'full' ? ' data-span="full"' : '') + ' for="' + escapeHtml(promptId) + '">' +
                  '<span>' + escapeHtml(prompt.label) + '</span>' +
                  '<textarea class="form-control" rows="' + (prompt.span === 'full' ? 4 : 3) + '" id="' + escapeHtml(promptId) + '" name="' + escapeHtml(promptId) + '" placeholder="Write whatever feels useful."></textarea>' +
                '</label>';
            }).join('') +
          '</div>' +
        '</section>';
    }).join('');
  }

  function collectState() {
    var state = {
      profile: {},
      sections: {}
    };

    profileFields.forEach(function (field) {
      var node = document.getElementById(field.id);
      state.profile[field.id] = node ? node.value.trim() : '';
    });

    sections.forEach(function (section) {
      var nextSection = { choices: [], prompts: {} };
      var checkedChoices = form.querySelectorAll('[data-choice-section="' + section.id + '"]:checked');
      checkedChoices.forEach(function (input) {
        nextSection.choices.push(input.value);
      });
      section.prompts.forEach(function (prompt) {
        var node = document.getElementById(section.id + '-' + prompt.id);
        nextSection.prompts[prompt.id] = node ? node.value.trim() : '';
      });
      state.sections[section.id] = nextSection;
    });

    return state;
  }

  function applyState(state) {
    if (!state) return;

    profileFields.forEach(function (field) {
      var node = document.getElementById(field.id);
      if (node && state.profile && typeof state.profile[field.id] === 'string') {
        node.value = state.profile[field.id];
      }
    });

    sections.forEach(function (section) {
      var sectionState = state.sections && state.sections[section.id] ? state.sections[section.id] : { choices: [], prompts: {} };
      var selected = Array.isArray(sectionState.choices) ? sectionState.choices : [];
      form.querySelectorAll('[data-choice-section="' + section.id + '"]').forEach(function (input) {
        input.checked = selected.indexOf(input.value) !== -1;
      });
      section.prompts.forEach(function (prompt) {
        var node = document.getElementById(section.id + '-' + prompt.id);
        if (node && sectionState.prompts && typeof sectionState.prompts[prompt.id] === 'string') {
          node.value = sectionState.prompts[prompt.id];
        }
      });
    });
  }

  function computeProgress(state) {
    var total = 0;
    var done = 0;
    var sectionProgress = {};

    profileFields.forEach(function (field) {
      total += 1;
      if ((state.profile[field.id] || '').trim()) done += 1;
    });

    sections.forEach(function (section) {
      var sectionDone = 0;
      total += 1;
      if ((state.sections[section.id].choices || []).length) {
        done += 1;
        sectionDone += 1;
      }
      section.prompts.forEach(function (prompt) {
        total += 1;
        if ((state.sections[section.id].prompts[prompt.id] || '').trim()) {
          done += 1;
          sectionDone += 1;
        }
      });
      sectionProgress[section.id] = sectionDone;
    });

    return { done: done, total: total, sectionProgress: sectionProgress };
  }

  function updateProgress(state) {
    var progress = computeProgress(state);
    var pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
    progressTitle.textContent = progress.done + ' of ' + progress.total + ' prompts completed';
    progressText.textContent = pct < 35
      ? 'Start with the sections you actually want coworkers to know.'
      : pct < 75
        ? 'You have enough material for a strong first draft.'
        : 'This is ready to export and share whenever you are.';
    progressFill.style.width = pct + '%';
    progressBar.setAttribute('aria-valuenow', String(progress.done));

    sections.forEach(function (section) {
      var counter = document.getElementById('count-' + section.id);
      if (counter) {
        var possible = section.prompts.length + 1;
        counter.textContent = progress.sectionProgress[section.id] + ' of ' + possible + ' answered';
      }
    });
  }

  function normalizeProfile(state) {
    return {
      name: state.profile['pom-name'] || 'Your Name',
      role: state.profile['pom-role'] || '',
      team: state.profile['pom-team'] || '',
      pronouns: state.profile['pom-pronouns'] || '',
      timezone: state.profile['pom-timezone'] || '',
      location: state.profile['pom-location'] || '',
      photoCaption: state.profile['pom-photo-caption'] || ''
    };
  }

  function buildPreviewMarkup(state) {
    var profile = normalizeProfile(state);
    var metaItems = [profile.role, profile.team, profile.pronouns, profile.timezone, profile.location].filter(Boolean);
    var hasContent = false;

    var sectionsHtml = sections.map(function (section) {
      var sectionState = state.sections[section.id];
      var answers = section.prompts
        .map(function (prompt) {
          var value = (sectionState.prompts[prompt.id] || '').trim();
          if (!value) return '';
          return '' +
            '<div class="pom-preview-answer">' +
              '<strong>' + escapeHtml(prompt.label) + '</strong>' +
              '<p>' + escapeHtml(value).replace(/\n/g, '<br>') + '</p>' +
            '</div>';
        })
        .filter(Boolean)
        .join('');

      var tags = (sectionState.choices || []).map(function (choice) {
        return '<span class="pom-preview-tag">' + escapeHtml(choice) + '</span>';
      }).join('');

      if (!answers && !tags) return '';
      hasContent = true;

      return '' +
        '<section class="pom-preview-section">' +
          '<h3>' + escapeHtml(section.title) + '</h3>' +
          (tags ? '<div class="pom-preview-tags">' + tags + '</div>' : '') +
          (answers ? '<div class="pom-preview-answers">' + answers + '</div>' : '') +
        '</section>';
    }).join('');

    if (!hasContent) {
      return '<div class="pom-empty-state">Your preview will populate here as soon as you add a few answers.</div>';
    }

    return '' +
      '<article class="pom-preview-card">' +
        '<header class="pom-preview-header">' +
          '<div>' +
            '<p class="pom-kicker">Personal Operating Manual</p>' +
            '<h2>' + escapeHtml(profile.name) + '</h2>' +
            '<p>A practical guide for teammates, collaborators, and managers who want to work with this person more smoothly.</p>' +
            (metaItems.length ? '<div class="pom-preview-meta">' + metaItems.map(function (item) {
              return '<span class="pom-preview-pill">' + escapeHtml(item) + '</span>';
            }).join('') + '</div>' : '') +
          '</div>' +
          (photoDataUrl ? '<img src="' + photoDataUrl + '" alt="' + escapeHtml(profile.photoCaption || profile.name) + '">' : '') +
        '</header>' +
        sectionsHtml +
      '</article>';
  }

  function buildPlainText(state) {
    var profile = normalizeProfile(state);
    var lines = ['Personal Operating Manual', ''];
    lines.push('Name: ' + profile.name);
    if (profile.role) lines.push('Role: ' + profile.role);
    if (profile.team) lines.push('Team or org: ' + profile.team);
    if (profile.pronouns) lines.push('Pronouns: ' + profile.pronouns);
    if (profile.timezone) lines.push('Primary time zone: ' + profile.timezone);
    if (profile.location) lines.push('Location or work context: ' + profile.location);
    lines.push('');

    sections.forEach(function (section) {
      var sectionState = state.sections[section.id];
      var hasChoices = sectionState.choices && sectionState.choices.length;
      var promptLines = section.prompts
        .map(function (prompt) {
          var value = (sectionState.prompts[prompt.id] || '').trim();
          return value ? prompt.label + '\n' + value : '';
        })
        .filter(Boolean);

      if (!hasChoices && !promptLines.length) return;
      lines.push(section.title);
      lines.push('-'.repeat(section.title.length));
      if (hasChoices) lines.push('Quick descriptors: ' + sectionState.choices.join(', '));
      promptLines.forEach(function (entry) {
        lines.push(entry);
        lines.push('');
      });
      lines.push('');
    });

    lines.push('Shared from ExEF Personal Operating Manual Builder');
    return lines.join('\n').replace(/\n{3,}/g, '\n\n');
  }

  function buildExportHtml(state) {
    var profile = normalizeProfile(state);
    var headerMeta = [profile.role, profile.team, profile.pronouns, profile.timezone, profile.location].filter(Boolean);
    var content = sections.map(function (section) {
      var sectionState = state.sections[section.id];
      var tags = (sectionState.choices || []).map(function (choice) {
        return '<span class="tag">' + escapeHtml(choice) + '</span>';
      }).join('');
      var answers = section.prompts.map(function (prompt) {
        var value = (sectionState.prompts[prompt.id] || '').trim();
        if (!value) return '';
        return '<div class="answer"><strong>' + escapeHtml(prompt.label) + '</strong><p>' + escapeHtml(value).replace(/\n/g, '<br>') + '</p></div>';
      }).filter(Boolean).join('');
      if (!tags && !answers) return '';
      return '<section><h2>' + escapeHtml(section.title) + '</h2>' + (tags ? '<div class="tags">' + tags + '</div>' : '') + answers + '</section>';
    }).filter(Boolean).join('');

    return '<!DOCTYPE html>' +
      '<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>' + escapeHtml(profile.name) + ' Personal Operating Manual</title>' +
      '<style>' +
        'body{font-family:Arial,sans-serif;background:#f5f1e8;color:#243543;line-height:1.65;margin:0;padding:40px;}' +
        '.sheet{max-width:920px;margin:0 auto;background:#fff;border:1px solid #d7cfc2;border-radius:16px;overflow:hidden;box-shadow:0 12px 32px rgba(22,43,60,.08);}' +
        'header{padding:40px;background:linear-gradient(160deg,#f6efe1,#ebe4d7);border-bottom:1px solid #d7cfc2;display:grid;grid-template-columns:1fr auto;gap:24px;align-items:start;}' +
        'header img{width:112px;height:112px;border-radius:20px;object-fit:cover;border:1px solid #c9c0b1;}' +
        'h1,h2{font-family:Georgia,serif;color:#162b3c;margin:0 0 12px;}' +
        'h1{font-size:2.2rem;}h2{font-size:1.35rem;margin-top:0;}' +
        '.meta,.tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}' +
        '.pill,.tag{display:inline-flex;padding:6px 12px;border-radius:999px;background:#eef2f5;border:1px solid #d0dae2;font-size:.9rem;font-weight:600;color:#274960;}' +
        'section{padding:28px 40px;border-top:1px solid #e5ddd0;}' +
        '.answer{margin-top:14px;padding-left:14px;border-left:2px solid #c7ab83;}' +
        '.answer strong{display:block;margin-bottom:4px;color:#162b3c;}' +
        '.answer p{margin:0;}' +
        'footer{padding:24px 40px;background:#faf7f0;border-top:1px solid #e5ddd0;color:#575f5a;font-size:.92rem;}' +
        '@media print{body{padding:0;background:#fff;}.sheet{box-shadow:none;border:0;border-radius:0;}section{break-inside:avoid;}}' +
      '</style></head><body><article class="sheet"><header><div><p style="margin:0 0 8px;font-size:.82rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#7c5a2b;">Personal Operating Manual</p><h1>' + escapeHtml(profile.name) + '</h1>' + (headerMeta.length ? '<div class="meta">' + headerMeta.map(function (item) {
        return '<span class="pill">' + escapeHtml(item) + '</span>';
      }).join('') + '</div>' : '') + '</div>' + (photoDataUrl ? '<img src="' + photoDataUrl + '" alt="' + escapeHtml(profile.photoCaption || profile.name) + '">' : '') + '</header>' + content + '<footer>Created with the ExEF Personal Operating Manual Builder.</footer></article></body></html>';
  }

  function refresh() {
    var state = collectState();
    writeDraft(state);
    setDraftStatus('Draft saved in this browser.');
    updateProgress(state);
    previewShell.innerHTML = buildPreviewMarkup(state);
  }

  function restore() {
    var draft = readDraft();
    if (draft && (draft.profile || draft.sections)) {
      applyState(draft);
      setDraftStatus('Restored your last saved draft.');
    }
    updateProgress(collectState());
    previewShell.innerHTML = buildPreviewMarkup(collectState());
  }

  function clearAll() {
    localStorage.removeItem(DRAFT_KEY);
    form.reset();
    photoDataUrl = '';
    photoPreview.hidden = true;
    photoImage.removeAttribute('src');
    setDraftStatus('Draft cleared.');
    setStatus('Draft cleared.');
    updateProgress(collectState());
    previewShell.innerHTML = buildPreviewMarkup(collectState());
  }

  renderSections();
  restore();

  form.addEventListener('input', function () {
    refresh();
  });

  form.addEventListener('change', function () {
    refresh();
  });

  if (photoInput) {
    photoInput.addEventListener('change', function () {
      var file = photoInput.files && photoInput.files[0];
      if (!file) {
        photoDataUrl = '';
        photoPreview.hidden = true;
        previewShell.innerHTML = buildPreviewMarkup(collectState());
        return;
      }

      var reader = new FileReader();
      reader.onload = function (event) {
        photoDataUrl = String(event.target.result || '');
        photoImage.src = photoDataUrl;
        photoPreview.hidden = !photoDataUrl;
        previewShell.innerHTML = buildPreviewMarkup(collectState());
      };
      reader.readAsDataURL(file);
    });
  }

  if (removePhotoBtn) {
    removePhotoBtn.addEventListener('click', function () {
      photoDataUrl = '';
      if (photoInput) photoInput.value = '';
      photoPreview.hidden = true;
      photoImage.removeAttribute('src');
      previewShell.innerHTML = buildPreviewMarkup(collectState());
      setStatus('Photo removed from this session.');
    });
  }

  downloadTextBtn.addEventListener('click', function () {
    var state = collectState();
    downloadFile(buildFileStem(state) + '-personal-operating-manual.txt', buildPlainText(state), 'text/plain;charset=utf-8');
    setStatus('Downloaded a plain-text version of your manual.');
  });

  downloadHtmlBtn.addEventListener('click', function () {
    var state = collectState();
    downloadFile(buildFileStem(state) + '-personal-operating-manual.html', buildExportHtml(state), 'text/html;charset=utf-8');
    setStatus('Downloaded a formatted HTML version of your manual.');
  });

  copyTextBtn.addEventListener('click', function () {
    var state = collectState();
    var text = buildPlainText(state);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        setStatus('Copied the manual text to your clipboard.');
      }).catch(function () {
        setStatus('Could not copy automatically. Use the downloaded text file instead.');
      });
      return;
    }
    setStatus('Clipboard copy is not supported in this browser. Use the download buttons instead.');
  });

  clearDraftBtn.addEventListener('click', function () {
    clearAll();
  });
})();
