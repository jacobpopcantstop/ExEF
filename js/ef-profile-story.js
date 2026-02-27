(function () {
  'use strict';

  var form = document.getElementById('ef-story-form');
  if (!form) return;

  var questionsWrap = document.getElementById('ef-story-questions');
  var progressFill = document.getElementById('ef-story-progress-fill');
  var progressText = document.getElementById('ef-story-progress-text');
  var errorEl = document.getElementById('ef-story-error');
  var resultsSection = document.getElementById('ef-story-results');
  var titleEl = document.getElementById('ef-story-title');
  var ledeEl = document.getElementById('ef-story-lede');
  var narrativeEl = document.getElementById('ef-story-narrative');
  var stuckEl = document.getElementById('ef-story-stuck');
  var worksEl = document.getElementById('ef-story-works');
  var experimentEl = document.getElementById('ef-story-experiment');
  var dimensionsEl = document.getElementById('ef-story-dimensions');
  var copyBtn = document.getElementById('ef-story-copy');
  var exportBtn = document.getElementById('ef-story-export');
  var resetBtn = document.getElementById('ef-story-reset');
  var messageEl = document.getElementById('ef-story-message');
  var historyEl = document.getElementById('ef-story-history');

  var HISTORY_KEY = 'efi_ef_profile_story_history';
  var RESULT_KEY = 'efi_ef_profile_story_latest';
  var MAX_HISTORY = 15;
  var config = null;
  var lastResult = null;

  var DIMENSION_COPY = {
    initiation_friction: {
      stuck: 'Getting started takes more effort than it looks like from the outside, especially before urgency kicks in.',
      works: 'When the first step is visible, you can build momentum quickly.',
      experiment: 'Before work, name one clear first action and do only that for 8 minutes.'
    },
    time_realism: {
      stuck: 'Your plans can assume best-case timing, so normal interruptions throw the day off.',
      works: 'You recalibrate well once you compare estimate vs. actual.',
      experiment: 'This week, multiply each estimate by 1.5 before you schedule it.'
    },
    overwhelm_sensitivity: {
      stuck: 'Big or ambiguous tasks can trigger freeze before execution starts.',
      works: 'Smaller visible steps lower stress and create traction.',
      experiment: 'Break each major task into three micro-steps, then start step one only.'
    },
    emotional_reactivity: {
      stuck: 'Uncertainty or sharp feedback can quickly knock productivity off course.',
      works: 'You recover faster when you name the feeling before picking the next action.',
      experiment: 'Use a 90-second reset: name what you feel, then choose one concrete next move.'
    },
    environment_dependence: {
      stuck: 'Noise, clutter, and notifications affect your consistency more than most people realize.',
      works: 'You work better when your space is staged for one task.',
      experiment: 'Try a 7-day environment reset: clear desk, silence alerts, and stage materials ahead of time.'
    },
    recovery_speed: {
      stuck: 'Interruptions can create longer restart delays than expected.',
      works: 'A short restart script helps you re-enter much faster.',
      experiment: 'After interruptions, use a 3-line restart card: where I was, next step, 10-minute timer.'
    },
    planning_depth: {
      stuck: 'You may jump into execution before milestones and done-criteria are fully clear.',
      works: 'Your output improves when the done-state is explicit.',
      experiment: 'Define done-state plus two checkpoints before starting any multi-step task.'
    },
    follow_through: {
      stuck: 'You can launch strongly but lose continuity from one day to the next.',
      works: 'A brief daily review restores direction quickly.',
      experiment: 'End each workday with a two-minute bridge note for tomorrow\'s first action.'
    }
  };

  var PROFILE_RULES = [
    {
      id: 'activation-time',
      name: 'Deadline Activated Sprinter',
      lede: 'You show up strongest when stakes are high, and we can make starts feel easier before the deadline crunch.',
      needs: ['initiation_friction', 'time_realism'],
      narrative: 'You are not short on commitment. The challenge is the gap between intention and ignition. Work can start late and then compress into high-pressure bursts.'
    },
    {
      id: 'overload-fragility',
      name: 'Overload Sensitive Builder',
      lede: 'You care deeply and can do hard things, and we can reduce the overload moments that interrupt consistency.',
      needs: ['overwhelm_sensitivity', 'emotional_reactivity'],
      narrative: 'You can do complex work, but capacity drops when uncertainty, criticism, or competing demands pile up. This is a load-tolerance pattern, not an effort problem.'
    },
    {
      id: 'context-switcher',
      name: 'Context-Dependent Executor',
      lede: 'Your performance responds strongly to context, and small environment shifts can unlock better flow fast.',
      needs: ['environment_dependence', 'recovery_speed'],
      narrative: 'Your output quality tracks context more than motivation. You do best when conditions are staged and transitions are handled on purpose.'
    },
    {
      id: 'planning-persistence',
      name: 'Stop-Start Strategist',
      lede: 'You think strategically, and a little more completion structure can help your plans stick.',
      needs: ['planning_depth', 'follow_through'],
      narrative: 'You can map good ideas, but plans can stay conceptual and momentum may leak between days. Reliability improves when handoffs are explicit.'
    }
  ];

  function setMessage(message) {
    if (messageEl) messageEl.textContent = message;
  }

  function copyText(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(done);
      return;
    }
    done();
  }

  function downloadText(text, fileName) {
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function getDimensionLabel(key) {
    return (config && config.dimensions && config.dimensions[key]) || key;
  }

  function renderHistory() {
    if (!historyEl) return;
    var history = [];
    try {
      history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch (e) {
      history = [];
    }
    if (!history.length) {
      historyEl.hidden = true;
      historyEl.innerHTML = '';
      return;
    }
    var html = '<h3 style="margin-top:0;">Recent EF Profile Stories</h3><ul class="checklist">';
    history.slice(-5).reverse().forEach(function (entry) {
      html += '<li>' + new Date(entry.generatedAt).toLocaleString() + ' &mdash; ' + entry.profile + ' (' + entry.primaryDimensionLabel + ' highest friction)</li>';
    });
    html += '</ul>';
    historyEl.innerHTML = html;
    historyEl.hidden = false;
  }

  function updateProgress() {
    if (!config) return;
    var total = Array.isArray(config.questions) ? config.questions.length : 0;
    var answered = form.querySelectorAll('input[type="radio"]:checked').length;
    var pct = total ? Math.round((answered / total) * 100) : 0;
    if (progressFill) progressFill.style.width = pct + '%';
    if (progressText) progressText.textContent = answered + ' of ' + total + ' answered';
    var bar = progressFill && progressFill.closest('.esqr-progress');
    if (bar) {
      bar.setAttribute('aria-valuenow', answered);
      bar.setAttribute('aria-valuemax', total);
    }
  }

  function renderQuestions() {
    if (!config || !questionsWrap) return;
    var labels = (config.scale && config.scale.labels) || ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];
    var min = Number(config.scale && config.scale.min) || 1;
    var max = Number(config.scale && config.scale.max) || 5;
    var html = '';
    config.questions.forEach(function (question, idx) {
      html += '<fieldset class="esqr-skill-group fade-in" style="margin-bottom:var(--space-md);">';
      html += '<legend class="esqr-skill-group__legend">Question ' + (idx + 1) + '</legend>';
      html += '<div class="esqr-item">';
      html += '<p class="esqr-item__text">' + question.prompt + '</p>';
      html += '<div class="esqr-rating" role="radiogroup" aria-label="Rating for question ' + (idx + 1) + '">';
      html += '<span class="esqr-rating__label">' + labels[0] + '</span>';
      for (var value = min; value <= max; value++) {
        html += '<label class="esqr-rating__option"><input type="radio" name="' + question.id + '" value="' + value + '" required><span>' + value + '</span></label>';
      }
      html += '<span class="esqr-rating__label">' + labels[labels.length - 1] + '</span>';
      html += '</div></div></fieldset>';
    });
    questionsWrap.innerHTML = html;
  }

  function allAnswered() {
    for (var i = 0; i < config.questions.length; i++) {
      var q = config.questions[i];
      if (!form.querySelector('input[name="' + q.id + '"]:checked')) return false;
    }
    return true;
  }

  function computeDimensionScores() {
    var min = Number(config.scale && config.scale.min) || 1;
    var max = Number(config.scale && config.scale.max) || 5;
    var buckets = {};
    Object.keys(config.dimensions || {}).forEach(function (key) {
      buckets[key] = [];
    });

    config.questions.forEach(function (q) {
      var checked = form.querySelector('input[name="' + q.id + '"]:checked');
      if (!checked) return;
      if (!buckets[q.dimension]) buckets[q.dimension] = [];
      buckets[q.dimension].push(Number(checked.value));
    });

    var dimensions = Object.keys(buckets).map(function (key) {
      var values = buckets[key];
      var avg = values.length ? (values.reduce(function (sum, value) { return sum + value; }, 0) / values.length) : min;
      var normalized = ((avg - min) / Math.max(1, (max - min))) * 100;
      return {
        key: key,
        label: getDimensionLabel(key),
        average: Number(avg.toFixed(2)),
        friction: Math.round(normalized)
      };
    });

    return dimensions.sort(function (a, b) { return b.friction - a.friction; });
  }

  function chooseProfile(sortedDimensions) {
    var byKey = {};
    sortedDimensions.forEach(function (item) {
      byKey[item.key] = item.friction;
    });
    var winner = PROFILE_RULES[0];
    var winnerScore = -Infinity;
    PROFILE_RULES.forEach(function (rule) {
      var score = rule.needs.reduce(function (sum, need) {
        var friction = Number(byKey[need] || 0);
        var bonus = friction >= 75 ? 12 : (friction >= 60 ? 6 : 0);
        return sum + friction + bonus;
      }, 0);
      if (score > winnerScore) {
        winnerScore = score;
        winner = rule;
      }
    });
    return winner;
  }

  function severityLabel(friction) {
    if (friction >= 75) return 'high';
    if (friction >= 55) return 'moderate';
    return 'emerging';
  }

  function buildNarrative(profile, topDimension, secondDimension, lowDimension) {
    var intensity = severityLabel(topDimension.friction);
    return 'Your current pattern lines up with "' + profile.name + '". ' +
      profile.narrative + ' ' +
      'Right now, the strongest friction shows up in ' + topDimension.label.toLowerCase() + ' (' + topDimension.friction + '/100, ' + intensity + ') and ' +
      secondDimension.label.toLowerCase() + ' (' + secondDimension.friction + '/100). ' +
      'Your best leverage this week is ' + lowDimension.label.toLowerCase() + ' (' + lowDimension.friction + '/100), which can anchor consistency while you reduce the top friction areas.';
  }

  function buildExperiment(topTwo) {
    var primary = topTwo[0];
    var secondary = topTwo[1] || topTwo[0];
    var steps = [];
    steps.push('Day 1: Baseline check. Track one task start-to-finish and mark where the first stall happens.');
    steps.push('Day 2-3: Primary focus (' + primary.label + '). ' + DIMENSION_COPY[primary.key].experiment);
    steps.push('Day 4-5: Secondary focus (' + secondary.label + '). ' + DIMENSION_COPY[secondary.key].experiment);
    steps.push('Day 6: Combine both protocols on one real task and note what changed in start speed and completion quality.');
    steps.push('Day 7: Quick review. Keep the highest-impact step and schedule it as your default for next week.');
    return steps;
  }

  function buildSummary(result) {
    var lines = [];
    lines.push('EF Profile Story');
    lines.push('Generated: ' + new Date(result.generatedAt).toLocaleString());
    lines.push('Profile: ' + result.profile);
    lines.push('Lede: ' + result.lede);
    lines.push('');
    lines.push('Narrative:');
    lines.push(result.narrative);
    lines.push('');
    lines.push('Where You Get Stuck:');
    result.stuck.forEach(function (item) { lines.push('- ' + item); });
    lines.push('');
    lines.push('What Already Works:');
    result.works.forEach(function (item) { lines.push('- ' + item); });
    lines.push('');
    lines.push('7-Day Experiment:');
    result.experiment.forEach(function (item, index) { lines.push((index + 1) + '. ' + item); });
    lines.push('');
    lines.push('Dimension Scores:');
    result.dimensions.forEach(function (item) {
      lines.push('- ' + item.label + ': ' + item.friction + '/100');
    });
    return lines.join('\n');
  }

  function renderResult(result) {
    if (!resultsSection) return;
    resultsSection.hidden = false;
    if (titleEl) titleEl.textContent = result.profile;
    if (ledeEl) ledeEl.textContent = result.lede;
    if (narrativeEl) narrativeEl.textContent = result.narrative;
    if (stuckEl) stuckEl.innerHTML = result.stuck.map(function (item) { return '<li>' + item + '</li>'; }).join('');
    if (worksEl) worksEl.innerHTML = result.works.map(function (item) { return '<li>' + item + '</li>'; }).join('');
    if (experimentEl) experimentEl.innerHTML = result.experiment.map(function (item) { return '<li>' + item + '</li>'; }).join('');

    if (dimensionsEl) {
      var html = '<div style="display:grid;gap:var(--space-sm);">';
      result.dimensions.forEach(function (dimension) {
        html += '<div>';
        html += '<div style="display:flex;justify-content:space-between;font-size:0.9rem;margin-bottom:4px;">';
        html += '<span>' + dimension.label + '</span><strong>' + dimension.friction + '/100</strong></div>';
        html += '<div style="height:10px;background:var(--color-border);border-radius:999px;overflow:hidden;">';
        html += '<div style="height:100%;width:' + dimension.friction + '%;background:var(--color-accent);"></div>';
        html += '</div></div>';
      });
      html += '</div>';
      dimensionsEl.innerHTML = html;
    }
  }

  function saveHistory(result) {
    var history = [];
    try {
      history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch (e) {
      history = [];
    }
    history.push(result);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-MAX_HISTORY)));
    renderHistory();
  }

  function generate() {
    if (errorEl) errorEl.textContent = '';
    if (!allAnswered()) {
      if (errorEl) errorEl.textContent = 'Please answer every question before generating your profile.';
      return;
    }

    var dimensions = computeDimensionScores();
    var top = dimensions[0];
    var second = dimensions[1] || dimensions[0];
    var third = dimensions[2] || dimensions[0];
    var lowest = dimensions[dimensions.length - 1] || dimensions[0];
    var lowSecond = dimensions[dimensions.length - 2] || lowest;
    var profile = chooseProfile(dimensions);

    var stuck = [
      DIMENSION_COPY[top.key].stuck + ' (' + top.friction + '/100)',
      DIMENSION_COPY[second.key].stuck + ' (' + second.friction + '/100)',
      DIMENSION_COPY[third.key].stuck + ' (' + third.friction + '/100)'
    ];
    var works = [
      DIMENSION_COPY[lowest.key].works + ' (' + lowest.friction + '/100)',
      DIMENSION_COPY[lowSecond.key].works + ' (' + lowSecond.friction + '/100)'
    ];
    var experiment = buildExperiment([top, second]);
    var narrative = buildNarrative(profile, top, second, lowest);

    lastResult = {
      generatedAt: new Date().toISOString(),
      profile: profile.name,
      lede: profile.lede,
      narrative: narrative,
      primaryDimension: top.key,
      primaryDimensionLabel: top.label,
      stuck: stuck,
      works: works,
      experiment: experiment,
      dimensions: dimensions
    };

    localStorage.setItem(RESULT_KEY, JSON.stringify(lastResult));
    renderResult(lastResult);
    saveHistory(lastResult);
    setMessage('Profile generated: ' + profile.name + '. Copy or export when ready.');
  }

  function bindActions() {
    form.addEventListener('change', updateProgress);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      generate();
    });
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        form.reset();
        lastResult = null;
        if (resultsSection) resultsSection.hidden = true;
        if (errorEl) errorEl.textContent = '';
        updateProgress();
        setMessage('Form reset.');
      });
    }
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        if (!lastResult) {
          setMessage('Generate a profile first.');
          return;
        }
        copyText(buildSummary(lastResult), function () {
          setMessage('Summary copied.');
        });
      });
    }
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        if (!lastResult) {
          setMessage('Generate a profile first.');
          return;
        }
        downloadText(buildSummary(lastResult), 'efi-ef-profile-story-' + new Date().toISOString().slice(0, 10) + '.txt');
        setMessage('Text export downloaded.');
      });
    }
  }

  function init() {
    fetch('data/ef-profile-story-config.json', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('Unable to load EF Profile Story configuration.');
        return res.json();
      })
      .then(function (cfg) {
        config = cfg;
        renderQuestions();
        bindActions();
        updateProgress();
        renderHistory();
      })
      .catch(function (err) {
        if (errorEl) errorEl.textContent = err.message || 'Unable to load this tool right now.';
      });
  }

  init();
})();
