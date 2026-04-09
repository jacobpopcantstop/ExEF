(function () {
  'use strict';

  var form = document.getElementById('environment-quiz-form');
  if (!form) return;

  var DRAFT_KEY = 'efi_environment_quiz_draft_v1';
  var RESULT_KEY = 'efi_environment_quiz_result_v1';

  var groupsWrap = document.getElementById('environment-question-groups');
  var progressFill = document.getElementById('environment-progress-fill');
  var progressText = document.getElementById('environment-progress-text');
  var draftStatus = document.getElementById('environment-draft-status');
  var errorMsg = document.getElementById('environment-quiz-error');
  var resultsSection = document.getElementById('environment-results');
  var titleEl = document.getElementById('environment-result-title');
  var ledeEl = document.getElementById('environment-result-lede');
  var totalScoreEl = document.getElementById('environment-total-score');
  var totalBandEl = document.getElementById('environment-total-band');
  var totalSummaryEl = document.getElementById('environment-total-summary');
  var fastReadEl = document.getElementById('environment-fast-read');
  var scorecardsEl = document.getElementById('environment-domain-scorecards');
  var prioritiesEl = document.getElementById('environment-priority-domains');
  var strengthsEl = document.getElementById('environment-strength-domains');
  var quickWinsEl = document.getElementById('environment-quick-wins');
  var actionPlanEl = document.getElementById('environment-action-plan');
  var reflectionEl = document.getElementById('environment-reflection-prompts');
  var resetBtn = document.getElementById('environment-reset-btn');
  var copyBtn = document.getElementById('environment-copy-btn');
  var exportBtn = document.getElementById('environment-export-btn');
  var shareStatus = document.getElementById('environment-share-status');

  var domains = [
    {
      id: 'sensory',
      title: 'Sensory Safety',
      accentClass: 'thinking',
      intro: 'Can your nervous system find the right level of stimulation for focus or recovery?',
      overview: 'Low sensory safety can quietly drain attention, ' + term('working memory', 'Your brain\'s short-term holding space for what you are doing, remembering, or trying not to lose track of.') + ', and emotional regulation before the real task even begins.',
      items: [
        'I have at least one place where I can work or recover with lower noise, fewer interruptions, and less visual clutter.',
        'I can adjust lighting, sound, temperature, or seating without major difficulty.',
        'Background noise, movement, or brightness do not regularly hijack my attention.',
        'Tools that help me regulate sensory input are easy to access.',
        'My environment includes both higher-stimulation and lower-stimulation options depending on what I need.'
      ],
      quickWins: [
        'Create one lower-stimulation zone you can reliably use for focus or recovery.',
        'Change one sensory variable today: softer light, headphones, brown noise, or a simpler visual field.',
        'Keep regulation tools where you actually work instead of where you think they should live.'
      ],
      sabotage: 'When this domain is weak, even simple tasks can feel disproportionately hard because your brain is spending energy filtering the room instead of doing the work.'
    },
    {
      id: 'visibility',
      title: 'Visual Clarity And Object Visibility',
      accentClass: 'doing',
      intro: 'Can you see what matters without drowning in clutter?',
      overview: 'This domain measures how well your environment supports ' + term('working memory', 'Your brain\'s short-term holding space for what you are doing, remembering, or trying not to lose track of.') + ', recall, and “where did that thing go?” stability.',
      items: [
        'Important items are visible, labeled, or easy to find.',
        'Keys, wallet, bag, medications, chargers, and paperwork have fixed landing spots.',
        'My storage systems help me remember what I own instead of hiding it from me.',
        'I can quickly see what matters now, what is waiting, and what is finished.',
        'My surfaces mostly hold active items, not mysterious piles I avoid.'
      ],
      quickWins: [
        'Set up one visible landing pad near the place where items already get dropped.',
        'Replace one opaque storage container with a clear or open one.',
        'Make one visible Now / Next / Later board for the current week.'
      ],
      sabotage: 'When this domain is weak, your environment turns into a memory tax.'
    },
    {
      id: 'initiation',
      title: 'Task Initiation And Friction',
      accentClass: 'doing',
      intro: 'How many unnecessary steps stand between you and starting?',
      overview: 'This domain measures startup friction. Executive dysfunction gets worse when tasks require setup, hunting, or hidden decisions before the real work can begin.',
      items: [
        'Starting common tasks takes very few steps.',
        'I do not have to search for supplies, passwords, instructions, or tools before I can begin.',
        'Big tasks are broken into clear first steps.',
        'Frequently used items live where I actually use them.',
        'My systems fit the way I naturally move and think instead of forcing an unrealistic ideal.'
      ],
      quickWins: [
        'Break one recurring task into a checklist that starts with an absurdly small first step.',
        'Create one ready-to-go starter kit for a routine you avoid.',
        'Move tools to the point of performance so setup stops being part of the obstacle.'
      ],
      sabotage: 'When this domain is weak, “I should do this” does not translate into “I can begin now.”'
    },
    {
      id: 'pacing',
      title: 'Time, Energy, And Pacing',
      accentClass: 'thinking',
      intro: 'Does your schedule match your actual brain state or an imaginary ideal self?',
      overview: 'This domain measures whether your environment respects energy variability, transition costs, and ' + term('time blindness', 'Difficulty sensing how much time has passed, how long something will take, or when it is time to switch tasks.') + '.',
      items: [
        'My schedule reflects my energy patterns, not just deadlines.',
        'I know which tasks are high-energy, medium-energy, and low-energy.',
        'On low-capacity days, I have meaningful low-demand tasks I can still complete.',
        'My day includes buffer time for transitions, setup, and recovery.',
        'I have a clear way to see now, next, and later.'
      ],
      quickWins: [
        'Sort your current tasks into high-, medium-, and low-energy buckets.',
        'Add at least one 10-minute transition buffer into your day.',
        'Ask “What can my brain do right now?” before deciding what to tackle.'
      ],
      sabotage: 'When this domain is weak, planning turns into self-judgment because the schedule assumes a nervous system you do not actually have.'
    },
    {
      id: 'digital',
      title: 'Digital Environment',
      accentClass: 'thinking',
      intro: 'Are your devices acting like tools or like ambient chaos machines?',
      overview: 'This domain measures whether your digital setup preserves attention or constantly fragments it.',
      items: [
        'Most nonessential notifications are turned off.',
        'My inbox, desktop, tabs, and files are organized enough that I can find what I need.',
        'I have one trusted place to capture tasks, ideas, and reminders.',
        'My phone and computer support focus more often than they fragment it.',
        'I use digital tools to reduce ' + term('executive load', 'The amount of planning, remembering, switching, and self-management your brain has to do.') + ', not increase it.'
      ],
      quickWins: [
        'Turn off nonessential notifications for one full day and see what changes.',
        'Choose one task capture system and stop scattering reminders across multiple places.',
        'Before focused work, close surplus tabs and start from one clean task surface.'
      ],
      sabotage: 'When this domain is weak, your nervous system never gets a clean signal about what matters now.'
    },
    {
      id: 'social',
      title: 'Social Support And Communication',
      accentClass: 'doing',
      intro: 'Do the people around you reduce ambiguity or increase it?',
      overview: 'This domain measures whether expectations, communication, and accountability structures support follow-through without triggering shame.',
      items: [
        'I can ask for clarification, accommodations, or extra structure without feeling ashamed.',
        'I have access to ' + term('body doubling', 'Doing a task in the presence of another person so their steady presence helps you start and stay with it.') + ', co-working, or gentle accountability when I need it.',
        'Expectations are communicated clearly and preferably in writing or visually.',
        'The people around me are more collaborative than critical.',
        'I can use communication methods that work for my brain.'
      ],
      quickWins: [
        'Ask for written instructions instead of relying on verbal memory alone.',
        'Schedule one body-double or co-working session this week.',
        'Turn one vague expectation into a concrete agreement with a defined next step.'
      ],
      sabotage: 'When this domain is weak, uncertainty and shame consume the energy that should be available for execution.'
    },
    {
      id: 'recovery',
      title: 'Recovery, Regulation, And Dopamine Support',
      accentClass: 'doing',
      intro: 'Can your environment help you recover before you hit shutdown or burnout?',
      overview: 'This domain measures whether you can regulate, restore energy, and access nourishing stimulation without relying on last-minute desperation.',
      items: [
        'I have quick regulation tools I can use when I feel stuck, overwhelmed, or under-stimulated.',
        'Rest is built into my life before I hit burnout.',
        'Healthy ' + term('dopamine', 'A brain chemical involved in motivation, reward, and getting enough activation to start or stay with a task.') + ' options are easy to start.',
        'My environment supports recovery without making me feel lazy or guilty.',
        'Food, water, meds, movement, and rest are easy to access.'
      ],
      quickWins: [
        'Make a simple dopamine menu with quick, medium, and deeper reset options.',
        'Put water, snacks, meds, and simple regulation tools where you already spend time.',
        'Add one guilt-free reset block before the point where you usually crash.'
      ],
      sabotage: 'When this domain is weak, every demand feels bigger because your environment never really helps your nervous system come back online.'
    },
    {
      id: 'autonomy',
      title: 'Autonomy, Flexibility, And Demand Load',
      accentClass: 'thinking',
      intro: 'Can your systems bend with your brain, or do they punish any deviation?',
      overview: 'This domain measures how much flexibility and permission your environment gives you to function in realistic ways.',
      items: [
        'My routines are flexible enough to still work on hard days.',
        'I am allowed to do things in ways that fit my brain.',
        'My environment supports autonomy more than pressure.',
        'I can reduce demands when overloaded without everything collapsing.',
        'Success is defined by functioning and well-being, not just by looking organized.'
      ],
      quickWins: [
        'Define the minimum viable version of one routine instead of using an all-or-nothing standard.',
        'Name one demand you can reduce this week without real cost.',
        'Replace one rigid rule with a flexible support that still protects the outcome.'
      ],
      sabotage: 'When this domain is weak, your environment becomes a source of chronic threat instead of a scaffold.'
    }
  ];

  var totalQuestions = domains.reduce(function (sum, domain) {
    return sum + domain.items.length;
  }, 0);

  if (resultsSection) {
    resultsSection.setAttribute('role', 'region');
    resultsSection.setAttribute('aria-live', 'polite');
    resultsSection.setAttribute('aria-labelledby', 'environment-result-title');
    resultsSection.tabIndex = -1;
  }

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (err) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function clearNode(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function term(label, description) {
    var safeLabel = escapeHtml(label);
    var safeDescription = escapeHtml(description);
    return '<button type="button" class="environment-term" data-tooltip="' + safeDescription + '" title="' + safeDescription + '" aria-label="' + safeLabel + ': ' + safeDescription + '">' + safeLabel + '</button>';
  }

  function setShareStatus(message) {
    if (shareStatus) shareStatus.textContent = message;
  }

  function escapeCsvValue(value) {
    var text = String(value == null ? '' : value);
    if (text.indexOf('"') !== -1 || text.indexOf(',') !== -1 || text.indexOf('\n') !== -1) {
      return '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
  }

  function appendParagraph(container, text, className) {
    var p = document.createElement('p');
    if (className) p.className = className;
    p.textContent = text;
    container.appendChild(p);
    return p;
  }

  function appendLabeledParagraph(container, label, value) {
    var p = document.createElement('p');
    var strong = document.createElement('strong');
    strong.textContent = label;
    p.appendChild(strong);
    p.appendChild(document.createTextNode(' ' + value));
    container.appendChild(p);
    return p;
  }

  function scrollToResults() {
    if (!resultsSection) return;
    resultsSection.hidden = false;
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (typeof resultsSection.focus === 'function') resultsSection.focus({ preventScroll: true });
  }

  function getQuestionName(domainId, index) {
    return 'env_' + domainId + '_' + index;
  }

  function renderQuiz() {
    clearNode(groupsWrap);
    domains.forEach(function (domain) {
      var fieldset = document.createElement('fieldset');
      fieldset.className = 'esqr-skill-group environment-group';

      var legend = document.createElement('legend');
      legend.className = 'esqr-skill-group__legend';
      legend.textContent = domain.title;
      fieldset.appendChild(legend);

      var domainTag = document.createElement('span');
      domainTag.className = 'esqr-skill-group__domain esqr-skill-group__domain--' + domain.accentClass;
      domainTag.textContent = domain.accentClass === 'thinking' ? 'Cognitive Scaffold' : 'Action Scaffold';
      fieldset.appendChild(domainTag);

      var intro = document.createElement('p');
      intro.className = 'esqr-area-intro';
      intro.innerHTML = domain.intro + ' ' + domain.overview;
      fieldset.appendChild(intro);

      domain.items.forEach(function (text, itemIndex) {
        var item = document.createElement('div');
        item.className = 'esqr-item environment-item';

        var prompt = document.createElement('p');
        prompt.className = 'esqr-item__text';
        prompt.innerHTML = '<span class="esqr-item__number">' + (itemIndex + 1) + '.</span> ' + text;
        item.appendChild(prompt);

        var rating = document.createElement('div');
        rating.className = 'esqr-rating environment-rating';
        rating.setAttribute('role', 'radiogroup');
        rating.setAttribute('aria-label', domain.title + ' item ' + (itemIndex + 1));

        var lowLabel = document.createElement('span');
        lowLabel.className = 'esqr-rating__label environment-rating__label environment-rating__label--low';
        lowLabel.textContent = 'Never true';
        rating.appendChild(lowLabel);

        var scale = document.createElement('div');
        scale.className = 'environment-rating__scale';

        ['0', '1', '2', '3', '4'].forEach(function (value) {
          var label = document.createElement('label');
          label.className = 'esqr-rating__option';

          var input = document.createElement('input');
          input.type = 'radio';
          input.name = getQuestionName(domain.id, itemIndex);
          input.value = value;
          input.setAttribute('data-domain-id', domain.id);
          input.setAttribute('data-question-index', String(itemIndex));

          var bubble = document.createElement('span');
          bubble.textContent = value;

          label.appendChild(input);
          label.appendChild(bubble);
          scale.appendChild(label);
        });

        rating.appendChild(scale);

        var highLabel = document.createElement('span');
        highLabel.className = 'esqr-rating__label environment-rating__label environment-rating__label--high';
        highLabel.textContent = 'Consistently true';
        rating.appendChild(highLabel);

        item.appendChild(rating);
        fieldset.appendChild(item);
      });

      groupsWrap.appendChild(fieldset);
    });
  }

  function getAnsweredCount() {
    var count = 0;
    domains.forEach(function (domain) {
      domain.items.forEach(function (_, index) {
        var checked = form.querySelector('input[name="' + getQuestionName(domain.id, index) + '"]:checked');
        if (checked) count += 1;
      });
    });
    return count;
  }

  function updateProgress() {
    var answered = getAnsweredCount();
    var percent = Math.round((answered / totalQuestions) * 100);
    if (progressFill) progressFill.style.width = percent + '%';
    if (progressText) progressText.textContent = answered + ' of ' + totalQuestions + ' answered';
    var progress = progressFill && progressFill.parentNode && progressFill.parentNode.parentNode;
    if (progress) progress.setAttribute('aria-valuenow', String(answered));
  }

  function saveDraft() {
    var answers = {};
    domains.forEach(function (domain) {
      answers[domain.id] = [];
      domain.items.forEach(function (_, index) {
        var checked = form.querySelector('input[name="' + getQuestionName(domain.id, index) + '"]:checked');
        answers[domain.id].push(checked ? Number(checked.value) : null);
      });
    });
    writeJson(DRAFT_KEY, answers);
    if (draftStatus) {
      draftStatus.hidden = false;
      draftStatus.textContent = 'Draft saved in this browser. You can leave and come back later.';
    }
  }

  function hydrateDraft() {
    var draft = readJson(DRAFT_KEY, null);
    if (!draft) return;
    domains.forEach(function (domain) {
      var values = Array.isArray(draft[domain.id]) ? draft[domain.id] : [];
      domain.items.forEach(function (_, index) {
        var value = values[index];
        if (value == null) return;
        var input = form.querySelector('input[name="' + getQuestionName(domain.id, index) + '"][value="' + value + '"]');
        if (input) input.checked = true;
      });
    });
    if (draftStatus) {
      draftStatus.hidden = false;
      draftStatus.textContent = 'Draft restored from this browser.';
    }
  }

  function scoreBandForDomain(score) {
    if (score <= 7) return { label: 'High-friction zone', tone: 'high-friction' };
    if (score <= 13) return { label: 'Inconsistent support', tone: 'mixed' };
    if (score <= 17) return { label: 'Supportive enough', tone: 'supportive' };
    return { label: 'Strong scaffold', tone: 'strong' };
  }

  function scoreBandForTotal(score) {
    if (score <= 55) return {
      label: 'Your environment is actively draining executive function.',
      summary: 'Right now the setup around you is probably costing attention, energy, and recovery every day. The good news is that a few environmental changes can create disproportionate relief.'
    };
    if (score <= 95) return {
      label: 'Your environment has some supports, but hidden friction is costing you energy.',
      summary: 'You are not starting from zero, but your systems are inconsistent. One or two environmental bottlenecks are likely forcing you to compensate with effort.'
    };
    if (score <= 125) return {
      label: 'Your environment is somewhat supportive, with a few major choke points.',
      summary: 'Most of the setup is usable, but one weak layer is likely creating avoidable drag. Tightening the lowest domains should improve daily functioning quickly.'
    };
    return {
      label: 'Your environment is strongly supportive.',
      summary: 'You already have real scaffolds in place. The main opportunity now is refining weak spots and protecting the systems that are already working.'
    };
  }

  function buildPriorityInterpretation(priorityDomains) {
    if (!priorityDomains.length) {
      return 'Your environment looks broadly supportive across all major domains.';
    }
    if (priorityDomains.length === 1) {
      return 'Your main environmental bottleneck is ' + priorityDomains[0].title.toLowerCase() + '.';
    }
    return 'Your main environmental bottlenecks are ' +
      priorityDomains[0].title.toLowerCase() + ' and ' + priorityDomains[1].title.toLowerCase() + '.';
  }

  function computeResults() {
    var domainScores = domains.map(function (domain) {
      var answers = [];
      domain.items.forEach(function (_, index) {
        var checked = form.querySelector('input[name="' + getQuestionName(domain.id, index) + '"]:checked');
        answers.push(checked ? Number(checked.value) : null);
      });
      var score = answers.reduce(function (sum, value) {
        return sum + Number(value || 0);
      }, 0);
      return {
        id: domain.id,
        title: domain.title,
        accentClass: domain.accentClass,
        score: score,
        max: 20,
        answers: answers,
        band: scoreBandForDomain(score),
        quickWins: domain.quickWins.slice(),
        sabotage: domain.sabotage,
        overview: domain.overview
      };
    });

    var totalScore = domainScores.reduce(function (sum, domainScore) {
      return sum + domainScore.score;
    }, 0);

    var sortedByNeed = domainScores.slice().sort(function (a, b) {
      return a.score - b.score;
    });
    var sortedByStrength = domainScores.slice().sort(function (a, b) {
      return b.score - a.score;
    });

    return {
      totalScore: totalScore,
      totalBand: scoreBandForTotal(totalScore),
      domainScores: domainScores,
      priorityDomains: sortedByNeed.slice(0, 2),
      strengthDomains: sortedByStrength.slice(0, 2),
      quickWins: sortedByNeed.slice(0, 3).reduce(function (list, domainScore) {
        domainScore.quickWins.forEach(function (item) {
          if (list.length < 3) {
            list.push({ domain: domainScore.title, text: item });
          }
        });
        return list;
      }, []),
      generatedAt: new Date().toISOString()
    };
  }

  function renderFastRead(results) {
    clearNode(fastReadEl);
    appendParagraph(fastReadEl, buildPriorityInterpretation(results.priorityDomains));
    appendParagraph(fastReadEl, results.totalBand.summary, 'environment-result-muted');
    if (results.priorityDomains[0]) {
      appendLabeledParagraph(fastReadEl, 'Most likely energy leak:', results.priorityDomains[0].title + ' (' + results.priorityDomains[0].score + '/20)');
    }
    if (results.strengthDomains[0]) {
      appendLabeledParagraph(fastReadEl, 'Most stable scaffold:', results.strengthDomains[0].title + ' (' + results.strengthDomains[0].score + '/20)');
    }
  }

  function renderScorecards(results) {
    clearNode(scorecardsEl);
    results.domainScores.forEach(function (domainScore) {
      var card = document.createElement('article');
      card.className = 'environment-scorecard';

      var header = document.createElement('div');
      header.className = 'environment-scorecard__header';

      var title = document.createElement('h4');
      title.className = 'environment-scorecard__title';
      title.textContent = domainScore.title;

      var score = document.createElement('div');
      score.className = 'environment-scorecard__score';
      score.textContent = domainScore.score + ' / 20';

      header.appendChild(title);
      header.appendChild(score);
      card.appendChild(header);

      var band = document.createElement('p');
      band.className = 'environment-scorecard__band environment-scorecard__band--' + domainScore.band.tone;
      band.textContent = domainScore.band.label;
      card.appendChild(band);

      var track = document.createElement('div');
      track.className = 'environment-scorecard__track';
      var fill = document.createElement('div');
      fill.className = 'environment-scorecard__fill environment-scorecard__fill--' + domainScore.accentClass;
      fill.style.width = Math.round((domainScore.score / domainScore.max) * 100) + '%';
      track.appendChild(fill);
      card.appendChild(track);

      var note = document.createElement('p');
      note.className = 'environment-scorecard__note';
      note.textContent = domainScore.sabotage;
      card.appendChild(note);

      scorecardsEl.appendChild(card);
    });
  }

  function renderDomainPanel(target, domainScore, label) {
    var card = document.createElement('article');
    card.className = 'environment-domain-panel';

    var heading = document.createElement('h4');
    heading.style.marginTop = '0';
    heading.textContent = label + ': ' + domainScore.title;
    card.appendChild(heading);

    appendLabeledParagraph(card, 'Score:', domainScore.score + ' / 20');
    appendLabeledParagraph(card, 'Read:', domainScore.band.label);
    appendParagraph(card, domainScore.sabotage, 'environment-result-muted');

    var list = document.createElement('ul');
    list.className = 'checklist';
    domainScore.quickWins.slice(0, 2).forEach(function (item) {
      var li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });
    card.appendChild(list);

    target.appendChild(card);
  }

  function renderQuickWins(results) {
    clearNode(quickWinsEl);
    results.quickWins.forEach(function (item, index) {
      var card = document.createElement('article');
      card.className = 'environment-quick-win';

      var step = document.createElement('p');
      step.className = 'environment-quick-win__step';
      step.textContent = 'Quick Win ' + (index + 1);
      card.appendChild(step);

      var domain = document.createElement('h4');
      domain.className = 'environment-quick-win__domain';
      domain.textContent = item.domain;
      card.appendChild(domain);

      var text = document.createElement('p');
      text.textContent = item.text;
      card.appendChild(text);

      quickWinsEl.appendChild(card);
    });
  }

  function renderActionPlan(results) {
    clearNode(actionPlanEl);
    var primary = results.priorityDomains[0] || null;
    var secondary = results.priorityDomains[1] || null;

    var prompts = [
      primary ? 'Make one part of ' + primary.title.toLowerCase() + ' easier in the next 24 hours.' : 'Choose one friction point to improve in the next 24 hours.',
      secondary ? 'Reduce one unnecessary step in ' + secondary.title.toLowerCase() + ' this week.' : 'Reduce one unnecessary step in a recurring task this week.',
      'Protect one support that already works so you do not accidentally remove it while trying to optimize everything.'
    ];

    var list = document.createElement('ol');
    list.className = 'environment-action-list';
    prompts.forEach(function (prompt) {
      var li = document.createElement('li');
      li.textContent = prompt;
      list.appendChild(li);
    });
    actionPlanEl.appendChild(list);

    if (primary) {
      appendParagraph(actionPlanEl, 'Start with the lowest-scoring domain first. One environmental fix in the right place is usually more valuable than trying to “try harder” across the board.', 'environment-result-muted');
    }
  }

  function renderReflection(results) {
    clearNode(reflectionEl);
    var primary = results.priorityDomains[0] ? results.priorityDomains[0].title.toLowerCase() : 'your environment';
    var strength = results.strengthDomains[0] ? results.strengthDomains[0].title.toLowerCase() : 'your strongest support zone';

    var prompts = [
      'My environment helps me most when:',
      'My environment hurts me most when:',
      'The biggest source of friction right now is ' + primary + ' because:',
      'The easiest fix with the highest payoff is:',
      'The support I need but rarely ask for is:',
      'The part of my setup I should protect because it is already working is ' + strength + '.'
    ];

    var list = document.createElement('ul');
    list.className = 'environment-reflection-list';
    prompts.forEach(function (prompt) {
      var li = document.createElement('li');
      li.textContent = prompt;
      list.appendChild(li);
    });
    reflectionEl.appendChild(list);
  }

  function renderResults(results) {
    if (!resultsSection) return;
    resultsSection.hidden = false;
    if (titleEl) titleEl.textContent = 'Your environment report';
    if (ledeEl) {
      ledeEl.textContent = 'This report estimates how much your current environment is acting like an external scaffold for executive functioning versus how much it is silently adding friction.';
    }
    if (totalScoreEl) totalScoreEl.textContent = results.totalScore + ' / 160';
    if (totalBandEl) totalBandEl.textContent = results.totalBand.label;
    if (totalSummaryEl) totalSummaryEl.textContent = results.totalBand.summary;

    renderFastRead(results);
    renderScorecards(results);

    clearNode(prioritiesEl);
    results.priorityDomains.forEach(function (domainScore, index) {
      renderDomainPanel(prioritiesEl, domainScore, index === 0 ? 'Priority 1' : 'Priority 2');
    });

    clearNode(strengthsEl);
    results.strengthDomains.forEach(function (domainScore, index) {
      renderDomainPanel(strengthsEl, domainScore, index === 0 ? 'Strongest domain' : 'Second strongest');
    });

    renderQuickWins(results);
    renderActionPlan(results);
    renderReflection(results);
  }

  function buildSummaryText(results) {
    var lines = [];
    lines.push('EFI Executive Functioning Environment Quiz');
    lines.push('');
    lines.push('Overall score: ' + results.totalScore + ' / 160');
    lines.push('Interpretation: ' + results.totalBand.label);
    lines.push(results.totalBand.summary);
    lines.push('');
    lines.push('Priority domains:');
    results.priorityDomains.forEach(function (domainScore) {
      lines.push('- ' + domainScore.title + ': ' + domainScore.score + '/20 (' + domainScore.band.label + ')');
    });
    lines.push('');
    lines.push('Strongest domains:');
    results.strengthDomains.forEach(function (domainScore) {
      lines.push('- ' + domainScore.title + ': ' + domainScore.score + '/20 (' + domainScore.band.label + ')');
    });
    lines.push('');
    lines.push('Top quick wins:');
    results.quickWins.forEach(function (item) {
      lines.push('- [' + item.domain + '] ' + item.text);
    });
    lines.push('');
    lines.push('10-minute action plan:');
    var actionItems = actionPlanEl ? actionPlanEl.querySelectorAll('li') : [];
    Array.prototype.forEach.call(actionItems, function (item) {
      lines.push('- ' + item.textContent);
    });
    lines.push('');
    lines.push('Reflection prompts:');
    var reflectionItems = reflectionEl ? reflectionEl.querySelectorAll('li') : [];
    Array.prototype.forEach.call(reflectionItems, function (item) {
      lines.push('- ' + item.textContent);
    });
    return lines.join('\n');
  }

  function exportText(results) {
    var text = buildSummaryText(results);
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'efi-environment-quiz-report.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportCsv(results) {
    var rows = [['Domain', 'Score', 'Band']];
    results.domainScores.forEach(function (domainScore) {
      rows.push([domainScore.title, String(domainScore.score), domainScore.band.label]);
    });
    var csv = rows.map(function (row) {
      return row.map(escapeCsvValue).join(',');
    }).join('\n');
    return csv;
  }

  function resetQuiz() {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(RESULT_KEY);
    form.reset();
    updateProgress();
    if (draftStatus) {
      draftStatus.hidden = true;
      draftStatus.textContent = '';
    }
    if (errorMsg) errorMsg.hidden = true;
    if (resultsSection) resultsSection.hidden = true;
    setShareStatus('');
  }

  renderQuiz();
  hydrateDraft();
  updateProgress();

  form.addEventListener('change', function () {
    updateProgress();
    saveDraft();
    if (errorMsg) errorMsg.hidden = true;
    setShareStatus('');
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (getAnsweredCount() !== totalQuestions) {
      if (errorMsg) errorMsg.hidden = false;
      setShareStatus('');
      return;
    }
    var results = computeResults();
    writeJson(RESULT_KEY, results);
    renderResults(results);
    scrollToResults();
    setShareStatus('Environment report generated.');
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      resetQuiz();
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var results = readJson(RESULT_KEY, null);
      if (!results) {
        setShareStatus('Generate a report first.');
        return;
      }
      var text = buildSummaryText(results);
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
        setShareStatus('Clipboard is not available in this browser.');
        return;
      }
      navigator.clipboard.writeText(text).then(function () {
        setShareStatus('Summary copied.');
      }).catch(function () {
        setShareStatus('Could not copy summary.');
      });
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      var results = readJson(RESULT_KEY, null);
      if (!results) {
        setShareStatus('Generate a report first.');
        return;
      }
      exportText(results);
      setShareStatus('Text report downloaded.');
    });
  }

  var savedResult = readJson(RESULT_KEY, null);
  if (savedResult) {
    renderResults(savedResult);
  }

  window.EFI = window.EFI || {};
  window.EFI.EnvironmentQuiz = {
    exportCsv: function () {
      var results = readJson(RESULT_KEY, null);
      return results ? exportCsv(results) : '';
    }
  };
})();
