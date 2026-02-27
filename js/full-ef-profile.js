(function () {
  'use strict';

  var statusEl = document.getElementById('full-profile-status');
  if (!statusEl) return;

  var resultsSection = document.getElementById('full-profile-results');
  var titleEl = document.getElementById('full-profile-title');
  var ledeEl = document.getElementById('full-profile-lede');
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
    var ratios = entries.map(function (entry) {
      return Number(entry.actual) / Number(entry.estimated);
    }).filter(function (ratio) {
      return Number.isFinite(ratio) && ratio > 0;
    });
    if (!ratios.length) return null;
    var mean = ratios.reduce(function (sum, ratio) { return sum + ratio; }, 0) / ratios.length;
    return {
      count: entries.length,
      meanFactor: Number(mean.toFixed(2)),
      plan30: Math.round(30 * mean)
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

  function buildMergedProfile(esqr, timeMetrics, task, story, hasTimeConfidence) {
    var priorities = [];
    var strengths = [];
    var plan = [];
    var completed = [];

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
      if (Array.isArray(task.topBlockers) && task.topBlockers.length) {
        priorities.push('Top blockers: ' + task.topBlockers.join(' + ') + '.');
      }
      plan.push('Daily start protocol: ' + task.protocol);
    }

    if (timeMetrics && hasTimeConfidence) {
      completed.push('Time Blindness Calibrator');
      priorities.push('Time realism gap: plan with a ' + timeMetrics.meanFactor + 'x correction factor.');
      strengths.push('Calibration data exists (' + timeMetrics.count + ' entries).');
      plan.push('For estimated 30-minute tasks, block about ' + timeMetrics.plan30 + ' minutes this week.');
    }

    plan.push('Run one daily 5-minute review: choose tomorrow\'s first action and pre-stage materials.');
    plan = uniqueList(plan).slice(0, 5);
    priorities = uniqueList(priorities).slice(0, 5);
    strengths = uniqueList(strengths).slice(0, 5);

    return {
      title: completed.length >= 4 ? 'Complete Multi-Diagnostic EF Profile' : 'Combined EF Profile (Partial)',
      lede: 'Diagnostics completed: ' + completed.join(', ') + '. This view merges your strongest signals into one weekly execution plan.',
      priorities: priorities,
      strengths: strengths,
      plan: plan
    };
  }

  function summaryText(result) {
    var lines = [];
    lines.push('Full Executive Functioning Profile');
    lines.push('Generated: ' + new Date().toLocaleString());
    lines.push('');
    lines.push(result.title);
    lines.push(result.lede);
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
      setMessage('Complete at least two diagnostics to unlock a full combined profile.');
      return;
    }

    mergedResult = buildMergedProfile(esqr, timeMetrics, task, story, completion.hasTime);
    if (resultsSection) resultsSection.hidden = false;
    if (titleEl) titleEl.textContent = mergedResult.title;
    if (ledeEl) ledeEl.textContent = mergedResult.lede;
    if (prioritiesEl) prioritiesEl.innerHTML = mergedResult.priorities.map(function (item) { return '<li>' + item + '</li>'; }).join('');
    if (strengthsEl) strengthsEl.innerHTML = mergedResult.strengths.map(function (item) { return '<li>' + item + '</li>'; }).join('');
    if (planEl) planEl.innerHTML = mergedResult.plan.map(function (item) { return '<li>' + item + '</li>'; }).join('');
    setMessage('Full profile is ready to copy or export.');
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
