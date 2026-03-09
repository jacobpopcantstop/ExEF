(function () {
  'use strict';

  var statusEl = document.getElementById('full-profile-status');
  if (!statusEl) return;

  var resultsSection = document.getElementById('full-profile-results');
  var titleEl = document.getElementById('full-profile-title');
  var ledeEl = document.getElementById('full-profile-lede');
  var frameEl = document.getElementById('full-profile-frame');
  var corePatternEl = document.getElementById('full-profile-core-pattern');
  var leverageEl = document.getElementById('full-profile-leverage');
  var signalsEl = document.getElementById('full-profile-signals');
  var prioritiesEl = document.getElementById('full-profile-priorities');
  var strengthsEl = document.getElementById('full-profile-strengths');
  var planEl = document.getElementById('full-profile-plan');
  var copyBtn = document.getElementById('full-profile-copy');
  var exportBtn = document.getElementById('full-profile-export');
  var messageEl = document.getElementById('full-profile-message');

  var ESQR_KEY = 'efi_esqr_results';
  var TIME_KEY = 'efi_time_blindness_entries';
  var TASK_KEY = 'efi_task_friction_latest';
  var STORY_KEY = 'efi_ef_profile_story_latest';

  var mergedResult = null;

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (e) {
      return fallback;
    }
  }

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

  function exportText(text, fileName) {
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

  function computeTimeMetrics(entries) {
    if (!entries || !entries.length) return null;
    var deltas = [];
    var ratios = entries.map(function (entry) {
      var benchmark = Number(entry.benchmark || entry.actual || 0);
      var estimated = Number(entry.estimated || 0);
      if (!benchmark || !estimated) return null;
      deltas.push(estimated - benchmark);
      return benchmark / estimated;
    }).filter(function (ratio) {
      return Number.isFinite(ratio) && ratio > 0;
    });
    if (!ratios.length) return null;
    var mean = ratios.reduce(function (sum, ratio) { return sum + ratio; }, 0) / ratios.length;
    var averageDelta = deltas.reduce(function (sum, delta) { return sum + delta; }, 0) / deltas.length;
    var strongestBias = {};
    entries.forEach(function (entry) {
      var key = entry.categoryKey || 'general';
      var benchmark = Number(entry.benchmark || entry.actual || 0);
      var estimated = Number(entry.estimated || 0);
      var delta = Number(entry.delta);
      if (!Number.isFinite(delta)) {
        delta = estimated && benchmark ? (estimated - benchmark) : 0;
      }
      if (!strongestBias[key]) {
        strongestBias[key] = {
          label: entry.categoryLabel || 'General',
          totalDelta: 0,
          count: 0
        };
      }
      strongestBias[key].totalDelta += delta;
      strongestBias[key].count += 1;
    });
    var strongestBiasList = Object.keys(strongestBias).map(function (key) {
      var item = strongestBias[key];
      item.meanDelta = item.count ? item.totalDelta / item.count : 0;
      return item;
    }).sort(function (a, b) {
      return Math.abs(b.meanDelta) - Math.abs(a.meanDelta);
    });
    return {
      count: entries.length,
      meanFactor: Number(mean.toFixed(2)),
      plan30: Math.round(30 * mean),
      averageDelta: Math.round(averageDelta),
      strongestBiasLabel: strongestBiasList.length ? strongestBiasList[0].label : ''
    };
  }

  function uniqueList(items) {
    var seen = {};
    return items.filter(function (item) {
      var key = String(item || '').trim();
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function normalizedText(value) {
    return String(value || '').toLowerCase();
  }

  function makeSignalMap() {
    return {
      planning: 0,
      activation: 0,
      regulation: 0,
      environment: 0
    };
  }

  function rankedSignals(signalMap) {
    return Object.keys(signalMap).map(function (key) {
      return {
        key: key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        score: signalMap[key]
      };
    }).sort(function (a, b) {
      return b.score - a.score;
    });
  }

  function inferSynthesis(esqr, timeMetrics, task, story, hasTimeConfidence) {
    var signalMap = makeSignalMap();
    var primaryTheme = 'Executive functioning load is present, but the strongest combined pattern is still coming into focus.';
    var profileFrame = 'Emerging Pattern';
    var coachingFocus = 'Reduce friction on the first visible move and keep the daily planning loop small.';
    var leverage = 'Use one small planning rule consistently this week so the pattern becomes easier to see and trust.';

    var storyLabel = normalizedText(story && story.primaryDimensionLabel);
    var storyProfile = normalizedText(story && story.profile);
    var taskArchetype = normalizedText(task && task.archetype);
    var taskBlockers = Array.isArray(task && task.topBlockers) ? task.topBlockers.join(' ').toLowerCase() : '';
    var esqrGrowth = Array.isArray(esqr && esqr.growthAreas) ? esqr.growthAreas.map(function (item) {
      return normalizedText(item && item.name);
    }).join(' ') : '';
    var strongTimeFactor = !!(timeMetrics && hasTimeConfidence && (timeMetrics.meanFactor >= 1.25 || timeMetrics.meanFactor <= 0.8));

    if (
      storyLabel.indexOf('planning') !== -1 ||
      storyLabel.indexOf('time') !== -1 ||
      esqrGrowth.indexOf('planning') !== -1 ||
      esqrGrowth.indexOf('time') !== -1 ||
      strongTimeFactor
    ) {
      signalMap.planning += 2;
    }

    if (
      taskArchetype.indexOf('ambiguity') !== -1 ||
      taskArchetype.indexOf('activation') !== -1 ||
      taskBlockers.indexOf('first-step clarity') !== -1 ||
      taskBlockers.indexOf('task size pressure') !== -1 ||
      storyLabel.indexOf('activation') !== -1 ||
      storyProfile.indexOf('starter') !== -1
    ) {
      signalMap.activation += 2;
    }

    if (
      taskArchetype.indexOf('pressure') !== -1 ||
      taskArchetype.indexOf('perfectionistic') !== -1 ||
      taskBlockers.indexOf('emotional resistance') !== -1 ||
      esqrGrowth.indexOf('emotional') !== -1
    ) {
      signalMap.regulation += 2;
    }

    if (
      taskArchetype.indexOf('context drift') !== -1 ||
      taskBlockers.indexOf('environment pull') !== -1 ||
      storyLabel.indexOf('distraction') !== -1 ||
      esqrGrowth.indexOf('attention') !== -1
    ) {
      signalMap.environment += 2;
    }

    if (esqrGrowth.indexOf('organization') !== -1 || esqrGrowth.indexOf('metacognition') !== -1) {
      signalMap.planning += 1;
    }
    if (esqrGrowth.indexOf('task initiation') !== -1 || esqrGrowth.indexOf('goal-directed persistence') !== -1) {
      signalMap.activation += 1;
    }
    if (esqrGrowth.indexOf('emotional control') !== -1 || esqrGrowth.indexOf('stress tolerance') !== -1) {
      signalMap.regulation += 1;
    }
    if (taskBlockers.indexOf('environment') !== -1 || taskBlockers.indexOf('context') !== -1) {
      signalMap.environment += 1;
    }

    var signals = rankedSignals(signalMap).filter(function (item) {
      return item.score > 0;
    }).map(function (item) {
      return item.key;
    });

    if (signals.indexOf('planning') !== -1 && signals.indexOf('activation') !== -1) {
      profileFrame = 'Planning-to-Action Gap';
      primaryTheme = 'Your combined results point to a gap between knowing what matters and getting traction quickly enough to follow through.';
      coachingFocus = 'Translate plans into smaller visible starts and give every estimate a built-in buffer.';
      leverage = 'Pair one start ritual with one timing correction rule so planning and action reinforce each other.';
    } else if (signals.indexOf('emotional load') !== -1 && signals.indexOf('activation') !== -1) {
      profileFrame = 'Pressure-Sensitive Activation Pattern';
      primaryTheme = 'Once a task carries pressure or evaluation, your system is more likely to freeze, delay, or over-prepare instead of simply beginning.';
      coachingFocus = 'Lower task threat first, then ask for a very small visible action.';
      leverage = 'Use low-stakes first passes and short exposure sprints instead of waiting to feel settled.';
    } else if (signals.indexOf('environment') !== -1 && signals.indexOf('activation') !== -1) {
      profileFrame = 'Context-Dependent Follow-Through';
      primaryTheme = 'Your output appears to depend heavily on whether the environment supports a clean start or pulls you off course.';
      coachingFocus = 'Treat environment setup as part of the task, not as an optional extra.';
      leverage = 'Build one repeatable start zone and use it before high-friction tasks.';
    } else if (signals.indexOf('planning') !== -1) {
      profileFrame = 'Time Calibration Pattern';
      primaryTheme = 'The clearest combined signal is around time realism: your brain is likely compressing how long tasks and transitions actually take.';
      coachingFocus = 'Use benchmark-based planning and visible time buffers to reduce avoidable stress.';
      leverage = 'Apply the same correction factor to your first-draft estimates for one full week.';
    } else if (signals.indexOf('activation') !== -1) {
      profileFrame = 'Activation Friction Pattern';
      primaryTheme = 'The strongest combined signal is not ability, but startup friction: the first move is costing too much energy.';
      coachingFocus = 'Define smaller starts and remove one blocker before asking for momentum.';
      leverage = 'Measure success by clean starts, not by finishing everything in one push.';
    }

    return {
      modelName: 'EFI Cross-Signal Model',
      signals: uniqueList(signals),
      signalMap: signalMap,
      profileFrame: profileFrame,
      primaryTheme: primaryTheme,
      coachingFocus: coachingFocus,
      leverage: leverage
    };
  }

  function buildMergedProfile(esqr, timeMetrics, task, story, hasTimeConfidence) {
    var priorities = [];
    var strengths = [];
    var plan = [];
    var completed = [];
    var synthesis = inferSynthesis(esqr, timeMetrics, task, story, hasTimeConfidence);

    if (esqr) {
      completed.push('ESQ-R');
      if (esqr.growthAreas && esqr.growthAreas.length) {
        priorities.push('ESQ-R growth areas: ' + esqr.growthAreas.slice(0, 2).map(function (item) { return item.name; }).join(' + '));
      }
      if (esqr.strengths && esqr.strengths.length) {
        strengths.push('ESQ-R strengths: ' + esqr.strengths.slice(0, 3).map(function (item) { return item.name; }).join(', '));
      }
    }

    if (story) {
      completed.push('EF Profile Story');
      priorities.push('Narrative friction pattern: ' + story.primaryDimensionLabel + '.');
      strengths.push('Profile identity: ' + story.profile + '.');
      if (Array.isArray(story.experiment) && story.experiment.length) {
        plan.push('Story experiment: ' + (story.experiment[1] || story.experiment[0]));
      }
    }

    if (task) {
      completed.push('Task Start Friction');
      priorities.push('Start friction risk: ' + task.frictionPercent + '% (' + task.riskLabel + ').');
      if (task.archetype) {
        priorities.push('Start pattern: ' + task.archetype + '.');
      }
      if (Array.isArray(task.topBlockers) && task.topBlockers.length) {
        priorities.push('Top blockers: ' + task.topBlockers.join(' + ') + '.');
      }
      plan.push('Daily start protocol: ' + task.protocol);
      if (task.quickWin) {
        plan.push('Fastest activation move: ' + task.quickWin);
      }
    }

    if (timeMetrics && hasTimeConfidence) {
      completed.push('Time Blindness Calibrator');
      priorities.push('Time realism gap: plan with a ' + timeMetrics.meanFactor + 'x correction factor.');
      priorities.push('Time drift: your first guess is off by about ' + Math.abs(timeMetrics.averageDelta) + ' minutes on average.');
      if (timeMetrics.strongestBiasLabel) {
        priorities.push('Biggest timing drift shows up in ' + timeMetrics.strongestBiasLabel.toLowerCase() + ' tasks.');
      }
      strengths.push('Calibration data exists (' + timeMetrics.count + ' entries).');
      plan.push('For estimated 30-minute tasks, block about ' + timeMetrics.plan30 + ' minutes this week.');
    }

    priorities.unshift('Core pattern: ' + synthesis.primaryTheme);
    strengths.unshift('Best leverage point: ' + synthesis.leverage);
    plan.unshift('Main focus this week: ' + synthesis.coachingFocus);
    plan.push('Run one daily 5-minute review: choose tomorrow\'s first action and pre-stage materials.');
    plan = uniqueList(plan).slice(0, 5);
    priorities = uniqueList(priorities).slice(0, 5);
    strengths = uniqueList(strengths).slice(0, 5);

    return {
      title: (completed.length >= 4 ? 'Complete Multi-Diagnostic EF Profile' : 'Combined EF Profile (Partial)') + ': ' + synthesis.profileFrame,
      lede: 'Diagnostics completed: ' + completed.join(', ') + '. ' + synthesis.primaryTheme,
      modelName: synthesis.modelName,
      profileFrame: synthesis.profileFrame,
      corePattern: synthesis.primaryTheme,
      coachingFocus: synthesis.coachingFocus,
      leverage: synthesis.leverage,
      signals: synthesis.signals,
      signalMap: synthesis.signalMap,
      priorities: priorities,
      strengths: strengths,
      plan: plan
    };
  }

  function summaryText(result) {
    var lines = [];
    lines.push(result.modelName || 'EFI Cross-Signal Profile');
    lines.push('Generated: ' + new Date().toLocaleString());
    lines.push('');
    lines.push(result.title);
    lines.push(result.lede);
    if (result.profileFrame) {
      lines.push('');
      lines.push('Profile Frame: ' + result.profileFrame);
    }
    if (result.corePattern) {
      lines.push('Core Pattern: ' + result.corePattern);
    }
    if (result.coachingFocus) {
      lines.push('Coaching Focus: ' + result.coachingFocus);
    }
    if (result.leverage) {
      lines.push('Best Leverage Point: ' + result.leverage);
    }
    if (Array.isArray(result.signals) && result.signals.length) {
      lines.push('Cross-Tool Signals: ' + result.signals.join(', '));
    }
    if (result.signalMap) {
      lines.push('Signal Scores: planning ' + result.signalMap.planning + ', activation ' + result.signalMap.activation + ', regulation ' + result.signalMap.regulation + ', environment ' + result.signalMap.environment);
    }
    lines.push('');
    lines.push('Top Priorities:');
    result.priorities.forEach(function (item) { lines.push('- ' + item); });
    lines.push('');
    lines.push('Existing Strengths:');
    result.strengths.forEach(function (item) { lines.push('- ' + item); });
    lines.push('');
    lines.push('Unified 7-Day Plan:');
    result.plan.forEach(function (item, index) { lines.push((index + 1) + '. ' + item); });
    return lines.join('\n');
  }

  function renderStatus(completion, timeMetrics) {
    var timeLabel = 'Time Blindness Calibrator (3+ entries recommended)';
    if (timeMetrics && timeMetrics.count) {
      timeLabel += ' - current entries: ' + timeMetrics.count;
    }
    var items = [
      { name: 'ESQ-R free test', ok: completion.hasEsqr },
      { name: 'EF Profile Story quiz', ok: completion.hasStory },
      { name: 'Task Start Friction diagnostic', ok: completion.hasTask },
      { name: timeLabel, ok: completion.hasTime }
    ];
    statusEl.innerHTML = items.map(function (item) {
      return '<li>' + (item.ok ? 'Complete' : 'Pending') + ': ' + item.name + '</li>';
    }).join('');
  }

  function renderSignalMap(signalMap) {
    if (!signalsEl || !signalMap) return;
    var ranked = rankedSignals(signalMap);
    signalsEl.innerHTML = ranked.map(function (item) {
      var strength = item.score >= 4 ? 'High' : (item.score >= 2 ? 'Moderate' : (item.score > 0 ? 'Light' : 'Not detected yet'));
      return '<li><strong>' + item.label + ':</strong> ' + strength + ' signal (' + item.score + ')</li>';
    }).join('');
  }

  function init() {
    var esqr = readJson(ESQR_KEY, null);
    var story = readJson(STORY_KEY, null);
    var task = readJson(TASK_KEY, null);
    var timeEntries = readJson(TIME_KEY, []);
    var timeMetrics = computeTimeMetrics(timeEntries);

    var completion = {
      hasEsqr: !!esqr,
      hasStory: !!story,
      hasTask: !!task,
      hasTime: !!(timeMetrics && timeMetrics.count >= 3)
    };

    renderStatus(completion, timeMetrics);

    var completedCount = [completion.hasEsqr, completion.hasStory, completion.hasTask, completion.hasTime].filter(Boolean).length;
    if (completedCount < 2) {
      if (resultsSection) resultsSection.hidden = true;
      setMessage('Complete at least two diagnostics and EFI will stitch them into one combined profile.');
      return;
    }

    mergedResult = buildMergedProfile(esqr, timeMetrics, task, story, completion.hasTime);
    if (resultsSection) resultsSection.hidden = false;
    if (titleEl) titleEl.textContent = mergedResult.title;
    if (ledeEl) ledeEl.textContent = mergedResult.lede;
    if (frameEl) frameEl.textContent = mergedResult.profileFrame;
    if (corePatternEl) corePatternEl.textContent = mergedResult.corePattern;
    if (leverageEl) leverageEl.textContent = 'Best leverage point: ' + mergedResult.leverage;
    renderSignalMap(mergedResult.signalMap);
    if (prioritiesEl) prioritiesEl.innerHTML = mergedResult.priorities.map(function (item) { return '<li>' + item + '</li>'; }).join('');
    if (strengthsEl) strengthsEl.innerHTML = mergedResult.strengths.map(function (item) { return '<li>' + item + '</li>'; }).join('');
    if (planEl) planEl.innerHTML = mergedResult.plan.map(function (item) { return '<li>' + item + '</li>'; }).join('');
    setMessage('Your full profile is ready to copy or export.');
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      if (!mergedResult) {
        setMessage('Complete more diagnostics before copying the full profile.');
        return;
      }
      copyText(summaryText(mergedResult), function () {
        setMessage('Full profile copied.');
      });
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      if (!mergedResult) {
        setMessage('Complete more diagnostics before exporting.');
        return;
      }
      exportText(summaryText(mergedResult), 'efi-full-profile-' + new Date().toISOString().slice(0, 10) + '.txt');
      setMessage('Full profile exported.');
    });
  }

  init();
})();
