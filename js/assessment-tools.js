(function initAssessmentTools() {
    var hasTimeTool = !!document.getElementById('tb-estimated');
    var hasTaskTool = !!document.getElementById('tf-scenario');
    if (!hasTimeTool && !hasTaskTool) return;

    var TIME_KEY = 'efi_time_blindness_entries';
    var ACTION_PLAN_STORAGE_KEY = 'efi_action_plans_v1';
    var REFLECTION_STORAGE_KEY = 'efi_reflections_v1';
    var TIME_BENCHMARKS = [
      {
        key: 'school',
        label: 'School',
        tasks: [
          { key: 'essay-start', label: 'Set up and begin a school writing assignment', benchmark: 28, setup: 6, execution: 22, range: '20-35 min' },
          { key: 'study-block', label: 'Start a focused 30-minute study block', benchmark: 38, setup: 8, execution: 30, range: '30-45 min' },
          { key: 'school-form', label: 'Fill out one school form', benchmark: 15, setup: 3, execution: 12, range: '10-20 min' }
        ]
      },
      {
        key: 'work',
        label: 'Work',
        tasks: [
          { key: 'reply-email', label: 'Reply to one important email', benchmark: 12, setup: 2, execution: 10, range: '8-15 min' },
          { key: 'weekly-plan', label: 'Map out one work week in your planner', benchmark: 25, setup: 5, execution: 20, range: '20-30 min' },
          { key: 'prep-call', label: 'Prepare for one short work call or meeting', benchmark: 18, setup: 5, execution: 13, range: '12-22 min' }
        ]
      },
      {
        key: 'home',
        label: 'Home',
        tasks: [
          { key: 'laundry', label: 'Start and switch one laundry load', benchmark: 18, setup: 4, execution: 14, range: '12-20 min' },
          { key: 'grocery-list', label: 'Make a grocery list for the week', benchmark: 14, setup: 3, execution: 11, range: '10-18 min' },
          { key: 'bedroom-reset', label: 'Reset one bedroom or workspace', benchmark: 22, setup: 4, execution: 18, range: '15-30 min' }
        ]
      },
      {
        key: 'communication',
        label: 'Communication',
        tasks: [
          { key: 'return-text', label: 'Reply to a message you have delayed', benchmark: 9, setup: 2, execution: 7, range: '5-12 min' },
          { key: 'schedule-appointment', label: 'Schedule one appointment', benchmark: 16, setup: 5, execution: 11, range: '10-20 min' },
          { key: 'morning-routine', label: 'Get out the door for a normal morning', benchmark: 35, setup: 10, execution: 25, range: '25-45 min' }
        ]
      }
    ];
    var TIME_COMPLEXITY = {
      simple: { label: 'A little simpler', factor: 0.85 },
      typical: { label: 'About typical', factor: 1 },
      complex: { label: 'More complex than usual', factor: 1.25 }
    };
    var tbEstimated = document.getElementById('tb-estimated');
    var tbCategory = document.getElementById('tb-category');
    var tbTask = document.getElementById('tb-task');
    var tbComplexity = document.getElementById('tb-complexity');
    var tbEstimateConfidence = document.getElementById('tb-confidence-select');
    var tbAdd = document.getElementById('tb-add-entry');
    var tbReset = document.getElementById('tb-reset');
    var tbCopySummary = document.getElementById('tb-copy-summary');
    var tbExportText = document.getElementById('tb-export-text');
    var tbExportCsv = document.getElementById('tb-export-csv');
    var tbBody = document.getElementById('tb-entries-body');
    var tbMessage = document.getElementById('tb-message');
    var tbPattern = document.getElementById('tb-pattern');
    var tbConfidence = document.getElementById('tb-confidence');
    var tbSummary = document.getElementById('tb-summary');
    var tbBenchmarkNote = document.getElementById('tb-benchmark-note');

    function readEntries() {
      try { return JSON.parse(localStorage.getItem(TIME_KEY)) || []; } catch (e) { return []; }
    }

    function writeEntries(entries) {
      localStorage.setItem(TIME_KEY, JSON.stringify(entries.slice(-25)));
    }

    function findCategory(categoryKey) {
      return TIME_BENCHMARKS.find(function (item) { return item.key === categoryKey; }) || null;
    }

    function findBenchmark(categoryKey, taskKey) {
      var category = findCategory(categoryKey);
      if (!category || !Array.isArray(category.tasks)) return null;
      return category.tasks.find(function (item) { return item.key === taskKey; }) || null;
    }

    function adjustedBenchmark(benchmark, complexityKey) {
      if (complexityKey === 'easy') complexityKey = 'simple';
      if (complexityKey === 'hard') complexityKey = 'complex';
      var modifier = TIME_COMPLEXITY[complexityKey] || TIME_COMPLEXITY.typical;
      if (!benchmark) return 0;
      return Math.round(benchmark.benchmark * modifier.factor);
    }

    function populateTimeCategories() {
      if (!tbCategory) return;
      var html = '<option value="">Choose a context...</option>';
      TIME_BENCHMARKS.forEach(function (item) {
        html += '<option value="' + item.key + '">' + item.label + '</option>';
      });
      tbCategory.innerHTML = html;
    }

    function populateTimeBenchmarks() {
      if (!tbTask) return;
      var category = findCategory(tbCategory ? tbCategory.value : '');
      if (!category) {
        tbTask.innerHTML = '<option value="">Choose a context first...</option>';
        return;
      }
      var html = '<option value="">Choose a common task...</option>';
      category.tasks.forEach(function (item) {
        html += '<option value="' + item.key + '">' + item.label + '</option>';
      });
      tbTask.innerHTML = html;
    }

    function describeSelectedBenchmark() {
      if (!tbBenchmarkNote || !tbTask) return;
      var benchmark = findBenchmark(tbCategory ? tbCategory.value : '', tbTask.value);
      var complexityKey = tbComplexity && tbComplexity.value ? tbComplexity.value : 'typical';
      if (!benchmark) {
        tbBenchmarkNote.textContent = 'Choose a context and task to see EFI\'s typical time benchmark.';
        return;
      }
      tbBenchmarkNote.textContent =
        'EFI typical baseline: about ' + adjustedBenchmark(benchmark, complexityKey) +
        ' minutes (' + benchmark.range + '). That usually includes about ' + benchmark.setup + ' minutes of setup and ' + benchmark.execution + ' minutes of actual doing.';
    }

    function standardDeviation(values) {
      if (!values.length) return 0;
      var mean = values.reduce(function (sum, value) { return sum + value; }, 0) / values.length;
      var variance = values.reduce(function (sum, value) {
        var diff = value - mean;
        return sum + diff * diff;
      }, 0) / values.length;
      return Math.sqrt(variance);
    }

    function categoryStats(entries) {
      var grouped = {};
      entries.forEach(function (entry) {
        var key = entry.categoryKey || 'uncategorized';
        if (!grouped[key]) {
          grouped[key] = {
            key: key,
            label: entry.categoryLabel || 'General',
            totalDelta: 0,
            count: 0
          };
        }
        grouped[key].totalDelta += Number(entry.delta || 0);
        grouped[key].count += 1;
      });
      return Object.keys(grouped).map(function (key) {
        var item = grouped[key];
        item.meanDelta = item.count ? item.totalDelta / item.count : 0;
        return item;
      });
    }

    function computeTimeMetrics(entries) {
      if (!entries.length) return null;
      var ratios = [];
      var deltas = [];
      var absoluteDeltas = [];
      var certaintyMatches = [];
      var benchmarkAverage = 0;
      var estimateAverage = 0;
      var validCount = 0;
      entries.forEach(function (entry) {
        var benchmark = Number(entry.benchmark || entry.actual || 0);
        var estimated = Number(entry.estimated || 0);
        if (!benchmark || !estimated) return;
        ratios.push(estimated / benchmark);
        var delta = estimated - benchmark;
        deltas.push(delta);
        absoluteDeltas.push(Math.abs(delta));
        benchmarkAverage += benchmark;
        estimateAverage += estimated;
        validCount += 1;
        var confidence = Number(entry.confidence || 0);
        if (confidence) {
          var accurate = Math.abs(delta) <= Math.max(5, benchmark * 0.2);
          certaintyMatches.push((confidence === 3 && accurate) || (confidence === 1 && !accurate) ? 1 : 0);
        }
      });
      if (!ratios.length) return null;
      var meanRatio = ratios.reduce(function (sum, ratio) { return sum + ratio; }, 0) / ratios.length;
      var meanDelta = deltas.reduce(function (sum, delta) { return sum + delta; }, 0) / deltas.length;
      var correctionFactor = meanRatio > 0 ? (1 / meanRatio) : 1;
      var drift = Math.abs(meanDelta);
      var volatility = standardDeviation(deltas);
      var categoryBreakdown = categoryStats(entries).sort(function (a, b) {
        return Math.abs(b.meanDelta) - Math.abs(a.meanDelta);
      });
      var strongestBias = categoryBreakdown[0] || null;
      var steadiestCategory = categoryBreakdown.slice().sort(function (a, b) {
        return Math.abs(a.meanDelta) - Math.abs(b.meanDelta);
      })[0] || null;
      return {
        entries: validCount,
        meanRatio: meanRatio,
        meanDelta: meanDelta,
        correctionFactor: correctionFactor,
        meanAbsoluteDelta: absoluteDeltas.reduce(function (sum, value) { return sum + value; }, 0) / absoluteDeltas.length,
        averageBenchmark: benchmarkAverage / validCount,
        averageEstimate: estimateAverage / validCount,
        volatility: volatility,
        biasDirection: meanDelta < 0 ? 'underestimate' : (meanDelta > 0 ? 'overestimate' : 'land right on target'),
        stabilityLabel: volatility <= 6 ? 'steady' : (volatility <= 14 ? 'mixed' : 'inconsistent'),
        confidenceBand: drift <= 5 ? 'tight' : (drift <= 12 ? 'usable' : 'wide'),
        strongestBias: strongestBias,
        steadiestCategory: steadiestCategory,
        selfAwareness: certaintyMatches.length ? (certaintyMatches.reduce(function (sum, value) { return sum + value; }, 0) / certaintyMatches.length) : null
      };
    }

    function buildTimeSummary(metrics) {
      if (!metrics) return 'Add a few entries to get a usable time-planning pattern.';
      var deltaValue = Math.abs(Math.round(metrics.meanDelta));
      var categoryNote = metrics.strongestBias ? (' The biggest drift shows up in ' + metrics.strongestBias.label.toLowerCase() + ' tasks.') : '';
      return (
        'Time Blindness Calibrator: ' +
        metrics.entries + ' entries, ' +
        'you usually ' + metrics.biasDirection + ' by about ' + deltaValue + ' minutes, ' +
        'your pattern is ' + metrics.stabilityLabel + ', ' +
        'and your first-draft estimates should be adjusted by about ' + metrics.correctionFactor.toFixed(2) + 'x.' +
        categoryNote
      );
    }

    function confidenceLabel(count) {
      if (count >= 8) return 'high';
      if (count >= 3) return 'medium';
      if (count >= 1) return 'low';
      return 'unavailable';
    }

    function renderTimeBeforeAfterPanel(entries) {
      if (!tbSummary) return;
      var existing = document.getElementById('time-before-after-panel');
      if (existing) existing.remove();
      if (!Array.isArray(entries) || entries.length < 2) return;

      var midpoint = Math.floor(entries.length / 2);
      if (midpoint < 1 || entries.length - midpoint < 1) return;

      var early = computeTimeMetrics(entries.slice(0, midpoint));
      var recent = computeTimeMetrics(entries.slice(midpoint));
      if (!early || !recent) return;

      var earlyAbs = Math.abs(early.meanDelta);
      var recentAbs = Math.abs(recent.meanDelta);
      var improvement = Math.round(earlyAbs - recentAbs);
      var direction = improvement > 0 ? 'improved' : (improvement < 0 ? 'drifted' : 'held steady');

      var card = document.createElement('section');
      card.id = 'time-before-after-panel';
      card.className = 'card';
      card.style.marginTop = 'var(--space-md)';
      card.style.borderLeft = '4px solid var(--color-accent)';
      card.innerHTML =
        '<h5 style="margin-top:0;">What Changed (Before/After)</h5>' +
        '<p style="margin:0 0 var(--space-xs) 0;">Early entries (first ' + midpoint + ') were off by about <strong>' + Math.round(earlyAbs) + ' min</strong>. ' +
        'Recent entries (last ' + (entries.length - midpoint) + ') are off by about <strong>' + Math.round(recentAbs) + ' min</strong>.</p>' +
        '<p style="margin:0;color:var(--color-text-light);">Interpretation: your timing accuracy has <strong>' + direction + '</strong>' +
        (improvement !== 0 ? ' by about ' + Math.abs(improvement) + ' minutes.' : '.') + '</p>';
      tbSummary.insertAdjacentElement('afterend', card);
    }

    function renderTimeCalibrator() {
      var entries = readEntries();
      if (!tbBody || !tbMessage) return;
      if (!entries.length) {
        tbBody.innerHTML = '<tr><td colspan="4">No rows yet</td></tr>';
        tbMessage.textContent = 'No entries yet. Try 3 to 5 tasks and the tool will start showing how your internal timing tends to drift.';
        if (tbPattern) tbPattern.textContent = 'Your timing pattern will start to show after the first entry.';
        if (tbConfidence) tbConfidence.textContent = 'Confidence: unavailable (add entries)';
        if (tbSummary) tbSummary.textContent = 'Your planning summary will appear here once you have data.';
        renderTimeBeforeAfterPanel([]);
        return;
      }

      var html = '';
      entries.forEach(function (entry) {
        var benchmark = Number(entry.benchmark || entry.actual || 0);
        var delta = Number(entry.delta);
        if (!Number.isFinite(delta)) delta = Number(entry.estimated || 0) - benchmark;
        html += '<tr>' +
          '<td>' + (entry.taskLabel || 'Saved task') + '</td>' +
          '<td>' + Number(entry.estimated).toFixed(0) + ' min</td>' +
          '<td>' + benchmark.toFixed(0) + ' min</td>' +
          '<td>' + (delta === 0 ? 'On target' : ((delta > 0 ? '+' : '') + Math.round(delta) + ' min')) + '</td>' +
        '</tr>';
      });
      tbBody.innerHTML = html;

      var metrics = computeTimeMetrics(entries);
      if (!metrics) {
        tbMessage.textContent = 'Saved entries are incomplete. Add one fresh benchmark check and the pattern will rebuild.';
        if (tbPattern) tbPattern.textContent = 'A usable pattern needs at least one valid benchmark entry.';
        if (tbConfidence) tbConfidence.textContent = 'Confidence: unavailable (add valid entries)';
        if (tbSummary) tbSummary.textContent = 'Your planning summary will return once valid entries are saved.';
        renderTimeBeforeAfterPanel([]);
        return;
      }
      var latestEntry = entries[entries.length - 1];
      tbMessage.textContent =
        'Most recent check: you expected ' + (latestEntry.taskLabel || 'this task') + ' to take ' + Number(latestEntry.estimated).toFixed(0) +
        ' minutes, while EFI would plan it closer to ' + Number(latestEntry.benchmark || latestEntry.actual || 0).toFixed(0) +
        ' minutes. For now, treat your first guess like a draft and adjust by about ' + metrics.correctionFactor.toFixed(2) + 'x.';
      if (tbPattern) {
        var patternParts = [
          'You usually ' + metrics.biasDirection + ' by about ' + Math.abs(Math.round(metrics.meanDelta)) + ' minutes.',
          'Your estimate pattern looks ' + metrics.stabilityLabel + ' right now.'
        ];
        if (metrics.strongestBias) {
          patternParts.push('The biggest drift shows up in ' + metrics.strongestBias.label.toLowerCase() + ' tasks (' + Math.round(metrics.strongestBias.meanDelta) + ' min).');
        }
        if (metrics.steadiestCategory) {
          patternParts.push('Your steadiest category right now is ' + metrics.steadiestCategory.label.toLowerCase() + '.');
        }
        tbPattern.textContent = patternParts.join(' ');
      }
      if (tbConfidence) {
        var confidenceText = 'Confidence: ' + confidenceLabel(metrics.entries) + ' (' + metrics.entries + ' entries), ' +
          metrics.confidenceBand + ' pattern band, ' + metrics.stabilityLabel + ' estimates';
        if (metrics.selfAwareness !== null) {
          confidenceText += ', self-read accuracy ' + Math.round(metrics.selfAwareness * 100) + '%';
        }
        tbConfidence.textContent = confidenceText;
      }
      if (tbSummary) tbSummary.textContent = buildTimeSummary(metrics);
      renderTimeBeforeAfterPanel(entries);
    }



    function saveReflectionEntry(entry) {
      var items = [];
      try { items = JSON.parse(localStorage.getItem(REFLECTION_STORAGE_KEY)) || []; } catch (e) { items = []; }
      items.push(entry);
      localStorage.setItem(REFLECTION_STORAGE_KEY, JSON.stringify(items.slice(-100)));
    }

    function trackAssessmentEvent(eventName, properties) {
      if (window.EFI && window.EFI.Analytics && typeof window.EFI.Analytics.track === 'function') {
        window.EFI.Analytics.track(eventName, properties || {});
      }
    }

    function readActionPlans() {
      try { return JSON.parse(localStorage.getItem(ACTION_PLAN_STORAGE_KEY)) || []; } catch (e) { return []; }
    }

    function writeActionPlans(plans) {
      localStorage.setItem(ACTION_PLAN_STORAGE_KEY, JSON.stringify((plans || []).slice(-50)));
    }

    function updateActionPlanStatus(planId, status) {
      var plans = readActionPlans();
      var updated = false;
      plans.forEach(function (plan) {
        if (plan && plan.plan_id === planId) {
          plan.state = plan.state || {};
          plan.state.status = status;
          plan.state.updated_at = new Date().toISOString();
          updated = true;
        }
      });
      if (updated) writeActionPlans(plans);
    }

    function completeActionPlanCheckin(planId, payload) {
      var plans = readActionPlans();
      var updated = false;
      var checkinAt = new Date().toISOString();
      plans.forEach(function (plan) {
        if (plan && plan.plan_id === planId) {
          plan.state = plan.state || {};
          plan.state.checkins = Array.isArray(plan.state.checkins) ? plan.state.checkins : [];
          plan.state.checkins.push({
            at: checkinAt,
            self_rating: payload.self_rating,
            metric_label: payload.metric_label,
            metric_value: payload.metric_value
          });
          plan.state.last_checkin_at = checkinAt;
          plan.state.status = 'checkin_completed';
          plan.state.updated_at = checkinAt;
          updated = true;
        }
      });
      if (updated) writeActionPlans(plans);
      return checkinAt;
    }

    function renderActionPlanCard(anchorEl, plan, sourceLabel) {
      if (!anchorEl || !plan) return;
      var existing = document.getElementById('assessment-action-plan-' + sourceLabel);
      if (existing) existing.remove();

      var card = document.createElement('section');
      card.id = 'assessment-action-plan-' + sourceLabel;
      card.className = 'card';
      card.style.marginTop = 'var(--space-md)';
      card.style.borderLeft = '4px solid var(--color-primary)';

      var dueLabel = plan.recheck && plan.recheck.due_at ? new Date(plan.recheck.due_at).toLocaleString() : 'upcoming';
      var linksHtml = (plan.remediation_links || []).map(function (link) {
        return '<li><a href="' + link.href + '">' + link.label + '</a></li>';
      }).join('');

      card.innerHTML =
        '<h5 style="margin-top:0;">Action Plan</h5>' +
        '<p style="margin-bottom:var(--space-xs);"><strong>' + plan.focus.title + '</strong></p>' +
        '<p style="color:var(--color-text-light);">' + plan.focus.summary + '</p>' +
        '<p><strong>Do today:</strong> ' + (plan.actions.today[0] || '') + '</p>' +
        '<p><strong>Do this week:</strong> ' + (plan.actions.this_week[0] || '') + '</p>' +
        '<p><strong>Re-check by:</strong> ' + dueLabel + ' (' + plan.recheck.cadence + ')</p>' +
        '<p style="color:var(--color-text-light);"><strong>Evidence prompt:</strong> ' + plan.actions.evidence_prompt + '</p>' +
        (linksHtml ? '<ul class="checklist">' + linksHtml + '</ul>' : '') +
        '<p style="margin-top:var(--space-sm);"><strong>48-hour reflection:</strong> What will you test in the next 48 hours?</p>' +
        '<textarea class="assessment-reflection-input" rows="2" style="width:100%;padding:var(--space-sm);border:1px solid var(--color-border);border-radius:var(--border-radius);"></textarea>';

      var row = document.createElement('div');
      row.className = 'button-group';
      row.style.marginTop = 'var(--space-sm)';

      var startBtn = document.createElement('button');
      startBtn.type = 'button';
      startBtn.className = 'btn btn--primary btn--sm';
      startBtn.textContent = 'Start Plan';

      var copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'btn btn--secondary btn--sm';
      copyBtn.textContent = 'Copy Plan';

      var status = document.createElement('p');
      status.style.marginTop = 'var(--space-xs)';
      status.style.fontSize = '0.9rem';
      status.style.color = 'var(--color-text-light)';

      var reflectionInput = card.querySelector('.assessment-reflection-input');
      var reflectionBtn = document.createElement('button');
      reflectionBtn.type = 'button';
      reflectionBtn.className = 'btn btn--secondary btn--sm';
      reflectionBtn.textContent = 'Save Reflection';

      var checkinWrap = document.createElement('div');
      checkinWrap.style.marginTop = 'var(--space-sm)';
      checkinWrap.innerHTML =
        '<p style="margin:0 0 var(--space-xs) 0;"><strong>Quick check-in</strong> (capture transfer evidence)</p>' +
        '<div style="display:flex;gap:var(--space-sm);flex-wrap:wrap;align-items:end;">' +
        '<label style="display:flex;flex-direction:column;gap:4px;min-width:140px;">Self-rating (1-5)<select class="assessment-plan-checkin-rating"><option value="">Select</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></label>' +
        '<label style="display:flex;flex-direction:column;gap:4px;min-width:220px;">Observable metric<input class="assessment-plan-checkin-metric" type="text" placeholder="ex: started within 5 min on 2/3 tries"></label>' +
        '</div>';
      var checkinBtn = document.createElement('button');
      checkinBtn.type = 'button';
      checkinBtn.className = 'btn btn--secondary btn--sm';
      checkinBtn.textContent = 'Complete Check-In';

      startBtn.addEventListener('click', function () {
        if (startBtn.disabled) return;
        startBtn.disabled = true;
        startBtn.textContent = 'Plan Started';
        updateActionPlanStatus(plan.plan_id, 'started');
        status.textContent = 'Plan started. Recheck reminder is queued.';
        trackAssessmentEvent('practice_plan_started', {
          plan_id: plan.plan_id,
          source_tool: sourceLabel,
          started_at: new Date().toISOString()
        });
      });

      copyBtn.addEventListener('click', function () {
        var text = 'Focus: ' + plan.focus.title + '\n' +
          'Do today: ' + (plan.actions.today[0] || '') + '\n' +
          'Do this week: ' + (plan.actions.this_week[0] || '') + '\n' +
          'Re-check by: ' + dueLabel;
        copyText(text, function () {
          status.textContent = 'Plan copied.';
        });
      });

      reflectionBtn.addEventListener('click', function () {
        var reflection = String(reflectionInput && reflectionInput.value || '').trim();
        if (!reflection) {
          status.textContent = 'Write one testable action before saving.';
          return;
        }
        var payload = {
          id: 'refl_' + Date.now(),
          source_tool: sourceLabel,
          plan_id: plan.plan_id,
          module_id: plan.source_context && plan.source_context.module_id ? plan.source_context.module_id : sourceLabel,
          reflection_48h: reflection,
          at: new Date().toISOString()
        };
        saveReflectionEntry(payload);
        trackAssessmentEvent('behavior_transfer_logged', {
          plan_id: plan.plan_id,
          source_tool: sourceLabel,
          module_id: payload.module_id,
          transfer_type: 'self_report',
          transfer_value: reflection,
          logged_at: payload.at
        });
        status.textContent = 'Reflection saved.';
      });

      checkinBtn.addEventListener('click', function () {
        var ratingEl = checkinWrap.querySelector('.assessment-plan-checkin-rating');
        var metricEl = checkinWrap.querySelector('.assessment-plan-checkin-metric');
        var rating = Number(ratingEl && ratingEl.value ? ratingEl.value : 0);
        var metric = String(metricEl && metricEl.value || '').trim();
        if (!rating || !metric) {
          status.textContent = 'Add a 1-5 rating and one observable metric to complete the check-in.';
          return;
        }
        var checkinAt = completeActionPlanCheckin(plan.plan_id, {
          self_rating: rating,
          metric_label: plan.recheck && plan.recheck.metric_type ? plan.recheck.metric_type : 'self_report',
          metric_value: metric
        });
        status.textContent = 'Check-in saved. Keep iterating and compare progress next cycle.';
        trackAssessmentEvent('practice_checkin_completed', {
          plan_id: plan.plan_id,
          source_tool: sourceLabel,
          module_id: plan.source_context && plan.source_context.module_id ? plan.source_context.module_id : sourceLabel,
          self_rating: rating,
          metric_label: plan.recheck && plan.recheck.metric_type ? plan.recheck.metric_type : 'self_report',
          metric_value: metric,
          completed_at: checkinAt
        });
      });

      row.appendChild(startBtn);
      row.appendChild(copyBtn);
      row.appendChild(reflectionBtn);
      card.appendChild(row);
      card.appendChild(checkinWrap);
      card.appendChild(checkinBtn);
      card.appendChild(status);
      anchorEl.insertAdjacentElement('afterend', card);
    }

    function persistAndEmitActionPlan(plan, sourceTool) {
      if (!plan) return;
      var plans = readActionPlans();
      plans.push(plan);
      writeActionPlans(plans);
      trackAssessmentEvent('practice_plan_generated', {
        plan_id: plan.plan_id,
        source_tool: sourceTool,
        source_context: plan.source_context,
        focus_key: plan.source_context.misconception_primary || 'general_reinforcement',
        cadence: plan.recheck.cadence,
        generated_at: plan.state.created_at
      });
    }

    function buildTimeCalibratorPlan(metrics, latestEntry) {
      if (!metrics || !latestEntry) return null;
      var now = new Date();
      return {
        schema_version: '1.0',
        plan_id: 'plan_time_' + Date.now(),
        source_tool: 'time_calibrator',
        source_context: {
          module_id: 'time-calibrator',
          question_ids: [],
          misconception_primary: 'planning_without_transfer',
          misconception_secondary: 'willpower_over_protocol'
        },
        focus: {
          title: 'Time Calibration Reinforcement',
          summary: 'Use your correction factor to turn estimates into realistic plans this week.',
          confidence: metrics.entries >= 8 ? 'high' : (metrics.entries >= 3 ? 'medium' : 'low')
        },
        actions: {
          today: ['Apply a ' + metrics.correctionFactor.toFixed(2) + 'x correction to your next two estimates.'],
          this_week: ['Log at least 3 new estimate-vs-benchmark entries and compare drift.'],
          evidence_prompt: 'How much did your average delta change after using the correction factor?'
        },
        recheck: {
          cadence: '7d',
          due_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          metric_type: 'score_delta',
          success_threshold: { type: 'numeric_or_state', value: 1 }
        },
        remediation_links: [
          { label: 'Time Blindness Calibrator', href: 'time-blindness-calibrator.html' },
          { label: 'Module 5 interventions', href: 'module-5.html' }
        ],
        analytics: {
          plan_generated_event: 'practice_plan_generated',
          plan_started_event: 'practice_plan_started',
          checkin_completed_event: 'practice_checkin_completed'
        },
        state: {
          status: 'generated',
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        }
      };
    }

    function buildTaskFrictionPlan(latestResult) {
      if (!latestResult) return null;
      var now = new Date();
      return {
        schema_version: '1.0',
        plan_id: 'plan_task_' + Date.now(),
        source_tool: 'task_friction',
        source_context: {
          module_id: 'task-friction',
          question_ids: [],
          misconception_primary: 'willpower_over_protocol',
          misconception_secondary: 'planning_without_transfer'
        },
        focus: {
          title: 'Task Start Friction Reduction',
          summary: 'Run your start script repeatedly to reduce startup resistance and improve consistency.',
          confidence: latestResult.frictionPercent >= 70 ? 'high' : 'medium'
        },
        actions: {
          today: ['Run your first 10-minute start script once in the next hour.'],
          this_week: ['Repeat the same start script for 3 sessions and log completion.'],
          evidence_prompt: 'Did startup delay shrink after repeated use of the script?'
        },
        recheck: {
          cadence: '72h',
          due_at: new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString(),
          metric_type: 'self_rating',
          success_threshold: { type: 'numeric_or_state', value: 1 }
        },
        remediation_links: [
          { label: 'Task Start Friction tool', href: 'task-start-friction.html' },
          { label: 'Module 3 coaching architecture', href: 'module-3.html' }
        ],
        analytics: {
          plan_generated_event: 'practice_plan_generated',
          plan_started_event: 'practice_plan_started',
          checkin_completed_event: 'practice_checkin_completed'
        },
        state: {
          status: 'generated',
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        }
      };
    }

    function copyText(text, onDone) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(onDone).catch(onDone);
      } else {
        onDone();
      }
    }

    function downloadText(text, filename) {
      var blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    function exportTimeEntriesCsv() {
      var entries = readEntries();
        if (!entries.length) {
          if (tbMessage) tbMessage.textContent = 'Add at least one row before exporting CSV.';
          return;
      }
      var rows = ['category,task,estimated_minutes,benchmark_minutes,delta_minutes,complexity,estimate_confidence,timestamp'];
      entries.forEach(function (entry) {
        var benchmark = Number(entry.benchmark || entry.actual || 0);
        var delta = Number(entry.delta);
        if (!Number.isFinite(delta)) delta = Number(entry.estimated || 0) - benchmark;
        rows.push(
          [
            '"' + String(entry.categoryLabel || 'General').replace(/"/g, '""') + '"',
            '"' + String(entry.taskLabel || 'Saved task').replace(/"/g, '""') + '"',
            entry.estimated,
            benchmark,
            Math.round(delta),
            '"' + String(entry.complexityLabel || 'About typical').replace(/"/g, '""') + '"',
            entry.confidence || '',
            entry.at || ''
          ].join(',')
        );
      });
      var blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'efi-time-blindness-calibrator.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (tbMessage) tbMessage.textContent = 'CSV exported with ' + entries.length + ' entries.';
    }

    if (tbAdd) {
      tbAdd.addEventListener('click', function () {
        var estimated = Number(tbEstimated && tbEstimated.value ? tbEstimated.value : 0);
        var category = findCategory(tbCategory ? tbCategory.value : '');
        var benchmark = findBenchmark(tbCategory ? tbCategory.value : '', tbTask ? tbTask.value : '');
        var complexityKey = tbComplexity && tbComplexity.value ? tbComplexity.value : 'typical';
        var adjusted = adjustedBenchmark(benchmark, complexityKey);
        if (!benchmark) {
          if (tbMessage) tbMessage.textContent = 'Choose a context and task first so the comparison is meaningful.';
          return;
        }
        if (estimated <= 0) {
          if (tbMessage) tbMessage.textContent = 'Enter a time estimate in minutes.';
          return;
        }
        if (estimated > 2000) {
          if (tbMessage) tbMessage.textContent = 'Use minute values below 2000 for cleaner calibration.';
          return;
        }
        var entries = readEntries();
        var delta = estimated - adjusted;
        entries.push({
          categoryKey: category ? category.key : '',
          categoryLabel: category ? category.label : 'General',
          taskKey: benchmark.key,
          taskLabel: benchmark.label,
          estimated: estimated,
          benchmark: adjusted,
          benchmarkBase: benchmark.benchmark,
          complexityKey: complexityKey,
          complexityLabel: (TIME_COMPLEXITY[complexityKey] || TIME_COMPLEXITY.typical).label,
          confidence: Number(tbEstimateConfidence && tbEstimateConfidence.value ? tbEstimateConfidence.value : 0),
          delta: delta,
          at: new Date().toISOString()
        });
        writeEntries(entries);
        if (tbEstimated) tbEstimated.value = '';
        if (tbMessage) {
          tbMessage.textContent =
            'You guessed ' + estimated + ' minutes. EFI would plan this closer to ' + adjusted + ' minutes, so your current instinct is ' +
            (delta === 0 ? 'right on target.' : (delta > 0 ? 'running long by ' + Math.abs(Math.round(delta)) + ' minutes.' : 'running short by ' + Math.abs(Math.round(delta)) + ' minutes.'));
        }
        renderTimeCalibrator();
        var metrics = computeTimeMetrics(readEntries());
        var latest = readEntries().slice(-1)[0];
        var timePlan = buildTimeCalibratorPlan(metrics, latest);
        if (timePlan) {
          persistAndEmitActionPlan(timePlan, 'time_calibrator');
          if (tbSummary) renderActionPlanCard(tbSummary, timePlan, 'time_calibrator');
        }
      });
    }

    if (tbReset) {
      tbReset.addEventListener('click', function () {
        localStorage.removeItem(TIME_KEY);
        if (tbEstimated) tbEstimated.value = '';
        if (tbCategory) tbCategory.value = '';
        if (tbComplexity) tbComplexity.value = 'typical';
        if (tbEstimateConfidence) tbEstimateConfidence.value = '2';
        populateTimeBenchmarks();
        renderTimeCalibrator();
        describeSelectedBenchmark();
      });
    }

    if (tbCopySummary) {
      tbCopySummary.addEventListener('click', function () {
        var summary = buildTimeSummary(computeTimeMetrics(readEntries()));
      copyText(summary, function () {
        if (tbMessage) tbMessage.textContent = 'Summary copied.';
      });
      });
    }

    if (tbExportCsv) {
      tbExportCsv.addEventListener('click', exportTimeEntriesCsv);
    }

    if (tbExportText) {
      tbExportText.addEventListener('click', function () {
        var metrics = computeTimeMetrics(readEntries());
        if (!metrics) {
          if (tbMessage) tbMessage.textContent = 'Add valid entries before exporting a summary.';
          return;
        }
        var summary = buildTimeSummary(metrics);
        downloadText(summary, 'efi-time-blindness-summary-' + new Date().toISOString().slice(0, 10) + '.txt');
        if (tbMessage) tbMessage.textContent = 'Summary exported.';
      });
    }

    if (tbCategory) {
      tbCategory.addEventListener('change', function () {
        populateTimeBenchmarks();
        describeSelectedBenchmark();
      });
    }

    if (tbTask) {
      tbTask.addEventListener('change', describeSelectedBenchmark);
    }

    if (tbComplexity) {
      tbComplexity.addEventListener('change', describeSelectedBenchmark);
    }

    populateTimeCategories();
    populateTimeBenchmarks();
    describeSelectedBenchmark();

    var TASK_FRICTION_KEY = 'efi_task_friction_latest';
    var TASK_FRICTION_HISTORY_KEY = 'efi_task_friction_history';
    var TF_BASE_DIMENSIONS = [
      {
        key: 'clarity',
        label: 'First-step clarity',
        defaultPrompt: 'How fuzzy does the very first step feel right now?',
        defaultAction: 'Write one tiny visible first move before you do anything else.'
      },
      {
        key: 'energy',
        label: 'Body energy',
        defaultPrompt: 'How much does your body feel like it wants to avoid this?',
        defaultAction: 'Shrink the entry point to a five-minute warm start.'
      },
      {
        key: 'overwhelm',
        label: 'Task size pressure',
        defaultPrompt: 'How big, heavy, or endless does this task feel in your head?',
        defaultAction: 'Break the task into three micro-steps and only commit to step one.'
      },
      {
        key: 'environment',
        label: 'Environment pull',
        defaultPrompt: 'How likely is your space, device, or notifications to pull you away?',
        defaultAction: 'Remove one distraction and stage only the materials for the next step.'
      },
      {
        key: 'emotion',
        label: 'Emotional resistance',
        defaultPrompt: 'How much dread, shame, or tension is attached to starting?',
        defaultAction: 'Name the feeling out loud, then pair the task with one low-pressure action.'
      }
    ];
    var TF_SCENARIOS = {
      'report-due': {
        label: 'a report due tomorrow',
        note: 'A deadline is close, the task matters, and you still have not started in a clean focused way.',
        firstStep: 'Open the document, write the title, and draft the first rough sentence before you do anything else.',
        context: 'school',
        prompts: {
          clarity: 'How unclear does the opening move feel when the report is due tomorrow?',
          energy: 'How much does your body want to avoid opening the document at all?',
          overwhelm: 'How big does the whole report feel compared to the time left?',
          environment: 'How likely are your tabs, phone, or room to pull you off track once you begin?',
          emotion: 'How much pressure, dread, or shame is attached to this report right now?'
        },
        actions: {
          clarity: 'Write a three-line outline: title, first section, first sentence.',
          energy: 'Give yourself a five-minute bad-first-draft start instead of trying to do it well.',
          overwhelm: 'Reduce the mission to: outline first, paragraph second, clean-up last.',
          environment: 'Close extra tabs and keep only the source material you need for the first section.',
          emotion: 'Say "this only needs to be started, not finished perfectly" before you type.'
        },
        extraDimensions: [
          {
            key: 'deadline-panic',
            label: 'Deadline panic',
            prompt: 'How much is the deadline itself making you freeze instead of start?',
            action: 'Convert panic into one clocked sprint: 12 minutes to make visible progress.'
          },
          {
            key: 'fear-bad-draft',
            label: 'Fear of a bad draft',
            prompt: 'How much are you resisting because the first version might look bad?',
            action: 'Make the first pass intentionally rough and ugly, then improve it later.'
          }
        ]
      },
      'study-test': {
        label: 'studying for a test you have been putting off',
        note: 'The task is important but vague, so your brain keeps postponing the first serious study block.',
        firstStep: 'Open your materials and spend two minutes making a tiny study map: topic one, topic two, practice set.',
        context: 'school',
        prompts: {
          clarity: 'How unclear is the first study move you should make?',
          energy: 'How much does your body want to avoid sitting down with the material?',
          overwhelm: 'How huge does the whole test feel in your head?',
          environment: 'How easy would it be to slide into your phone or another tab instead of studying?',
          emotion: 'How much stress or dread is attached to proving you know this?'
        },
        actions: {
          clarity: 'Pick one chapter or one problem set, not the whole course.',
          energy: 'Tell yourself you only need a 10-minute entry block, not a full study marathon.',
          overwhelm: 'Study by chunks: review, practice, check, stop.',
          environment: 'Put only the needed material on the desk and move the phone out of reach.',
          emotion: 'Focus on exposure first; confidence usually follows contact.'
        },
        extraDimensions: [
          {
            key: 'unclear-priority',
            label: 'What matters first',
            prompt: 'How hard is it to tell which topic actually deserves your first attention?',
            action: 'Start with the topic most likely to be on the test or the one you miss most often.'
          }
        ]
      },
      'missing-assignment': {
        label: 'dealing with a missing assignment',
        note: 'The task has both logistics and emotion attached, which is why even checking it can feel loaded.',
        firstStep: 'Open the grade portal or assignment list and identify the exact missing item before doing anything else.',
        context: 'school',
        prompts: {
          clarity: 'How hard is it to tell what the actual first fix is?',
          energy: 'How much does your body want to avoid even looking at the missing assignment?',
          overwhelm: 'How much bigger does this feel because it is already late?',
          environment: 'How likely is it that other tabs, messages, or noise will derail you once you open the portal?',
          emotion: 'How much shame is attached to touching this task?'
        },
        actions: {
          clarity: 'Name the exact missing item, due date, and next required move.',
          energy: 'Commit to checking only, not solving everything in one shot.',
          overwhelm: 'Separate the recovery plan into three moves: identify, contact, submit.',
          environment: 'Use one clean tab for the portal and one for the assignment only.',
          emotion: 'Shift from self-judgment to recovery mode: the job is repair, not replay.'
        },
        extraDimensions: [
          {
            key: 'repair-conversation',
            label: 'Repair conversation',
            prompt: 'How much friction is there around telling someone you are behind?',
            action: 'Use one plain sentence: "I am behind on this, and here is my next step."'
          }
        ]
      },
      'email-teacher': {
        label: 'an important email you need to send',
        note: 'The message is short, but social friction is making the task feel heavier than it should.',
        firstStep: 'Open the email draft and write only the greeting plus one plain-language sentence about why you are writing.',
        context: 'communication',
        prompts: {
          clarity: 'How hard is it to decide what the first sentence of the email should be?',
          energy: 'How much does your body want to avoid opening your inbox?',
          overwhelm: 'How much does this small task feel bigger than it should?',
          environment: 'How likely is your inbox, phone, or notifications to distract you once you open it?',
          emotion: 'How much awkwardness, fear, or shame is attached to sending this message?'
        },
        actions: {
          clarity: 'Use a simple script: greeting, one-sentence purpose, one clear ask.',
          energy: 'Commit to drafting only, not sending, for the first two minutes.',
          overwhelm: 'Treat it like a three-sentence task, not a big communication problem.',
          environment: 'Open a clean compose window before checking any new messages.',
          emotion: 'Write the awkward version first; you can soften it after it exists.'
        },
        extraDimensions: [
          {
            key: 'wording-uncertainty',
            label: 'Wording uncertainty',
            prompt: 'How much are you stuck because you want the message to sound exactly right?',
            action: 'Aim for clear and respectful, not perfectly phrased.'
          },
          {
            key: 'social-exposure',
            label: 'Social exposure',
            prompt: 'How much does the possibility of judgment make you hesitate?',
            action: 'Keep the ask concrete and short so the message feels manageable to send.'
          }
        ]
      },
      'proposal-start': {
        label: 'starting a proposal, project plan, or presentation',
        note: 'This is a high-ambiguity task, so your brain may keep postponing it because the shape is not obvious yet.',
        firstStep: 'Open a blank page and write the working title plus three bullet headings.',
        context: 'work',
        prompts: {
          clarity: 'How unclear is the structure of the first pass?',
          energy: 'How much does your body resist opening a blank page for this?',
          overwhelm: 'How big does the whole deliverable feel right now?',
          environment: 'How likely is it that tabs, messages, or meetings interrupt the start?',
          emotion: 'How much performance pressure is attached to getting this right?'
        },
        actions: {
          clarity: 'Make a rough scaffold first: title, sections, next question.',
          energy: 'Treat the first pass like set-up, not performance.',
          overwhelm: 'Shrink the mission to producing structure, not polished content.',
          environment: 'Use one uninterrupted window with notifications off for the first 10 minutes.',
          emotion: 'Let version one be a map, not a final answer.'
        },
        extraDimensions: [
          {
            key: 'blank-page',
            label: 'Blank page pressure',
            prompt: 'How much does the empty document itself create freeze?',
            action: 'Start by filling the page with placeholders so it stops feeling empty.'
          }
        ]
      },
      'hard-call': {
        label: 'making a call you do not want to make',
        note: 'This is usually a low-duration task with high anticipatory stress, which makes avoidance feel larger than the task.',
        firstStep: 'Write the phone number, your opening line, and one sentence about the goal before dialing.',
        context: 'communication',
        prompts: {
          clarity: 'How unclear is your first sentence once someone answers?',
          energy: 'How much does your body want to postpone the call?',
          overwhelm: 'How much bigger does the call feel than the actual time it will take?',
          environment: 'How likely is it that you will drift into other tasks instead of pressing call?',
          emotion: 'How much dread is attached to the conversation itself?'
        },
        actions: {
          clarity: 'Use a tiny script: who you are, why you are calling, what you need.',
          energy: 'Count down and dial before your brain starts negotiating.',
          overwhelm: 'Frame it as one short contact, not a giant event.',
          environment: 'Have the number open and the phone already in your hand.',
          emotion: 'Expect discomfort for the first 20 seconds; it usually drops once the call begins.'
        },
        extraDimensions: [
          {
            key: 'anticipation',
            label: 'Anticipation spiral',
            prompt: 'How much is your brain running bad future scenarios before the call even starts?',
            action: 'Anchor to one goal for the call instead of replaying every possible outcome.'
          }
        ]
      },
      'messy-room': {
        label: 'resetting a messy room or workspace',
        note: 'The visual clutter is creating friction before the real work even begins.',
        firstStep: 'Set a 10-minute timer and clear only the most visible surface first.',
        context: 'home',
        prompts: {
          clarity: 'How unclear is the first place to begin in the mess?',
          energy: 'How much does your body resist starting a reset right now?',
          overwhelm: 'How much does the whole room feel too big to tackle?',
          environment: 'How much is the clutter itself making it harder to stay focused?',
          emotion: 'How much frustration, guilt, or embarrassment is attached to the mess?'
        },
        actions: {
          clarity: 'Pick one zone only: desk, bed, floor, or counter.',
          energy: 'Start with one easy reset move like trash or dishes only.',
          overwhelm: 'Think in zones, not clean the whole room.',
          environment: 'Stage one trash bag or laundry basket before you begin.',
          emotion: 'Talk to yourself like a reset coach, not a critic.'
        },
        extraDimensions: [
          {
            key: 'visual-overload',
            label: 'Visual overload',
            prompt: 'How much is the amount of stuff itself making it hard to choose a starting point?',
            action: 'Reduce the visual field by facing one small zone and ignoring the rest.'
          }
        ]
      },
      'pay-bill': {
        label: 'paying a bill or handling a money admin task',
        note: 'This is usually a small administrative task, but avoidance grows fast when money stress is layered on top.',
        firstStep: 'Open the bill, confirm the due date and amount, and move straight to the payment screen.',
        context: 'home',
        prompts: {
          clarity: 'How unclear is the first concrete move to make this happen?',
          energy: 'How much does your body want to avoid opening the bill at all?',
          overwhelm: 'How much bigger does this feel than the actual steps involved?',
          environment: 'How likely is it that you will drift away once you log in?',
          emotion: 'How much stress, shame, or money tension is attached to this?'
        },
        actions: {
          clarity: 'Reduce it to: open, confirm, pay.',
          energy: 'Tell yourself the job is only to get to the payment page.',
          overwhelm: 'Treat it as a tiny admin sprint, not a whole financial life problem.',
          environment: 'Have the bill and payment method ready before you log in.',
          emotion: 'Handle the immediate step first; financial analysis can come later.'
        },
        extraDimensions: [
          {
            key: 'money-stress',
            label: 'Money stress',
            prompt: 'How much is financial anxiety making this harder to start?',
            action: 'Separate the payment step from the bigger financial feelings so one clear action can happen.'
          }
        ]
      },
      'make-appointment': {
        label: 'booking an appointment you have delayed',
        note: 'The task is short, but scheduling friction and social uncertainty can make it oddly sticky.',
        firstStep: 'Open the scheduling page or contact method and identify the first available slot before you choose anything.',
        context: 'life admin',
        prompts: {
          clarity: 'How unclear is the first move for actually booking this?',
          energy: 'How much does your body want to push this to later?',
          overwhelm: 'How much bigger does this feel than the actual task?',
          environment: 'How likely are you to bounce away from the tab or message before finishing?',
          emotion: 'How much stress is attached to the interaction or the appointment itself?'
        },
        actions: {
          clarity: 'Reduce the task to one tiny move: find the booking page or contact line.',
          energy: 'Commit to opening the scheduler before deciding anything else.',
          overwhelm: 'Keep the goal small: pick a slot, not solve your whole schedule.',
          environment: 'Block two distraction-free minutes just to finish the booking.',
          emotion: 'Focus on booking first; emotional reactions usually come after action, not before.'
        },
        extraDimensions: [
          {
            key: 'decision-fatigue',
            label: 'Decision fatigue',
            prompt: 'How much do all the possible times or options make you stall out?',
            action: 'Take the earliest workable slot instead of optimizing the whole calendar.'
          }
        ]
      },
      'application-form': {
        label: 'a form or application you have been avoiding',
        note: 'It is finite, but uncertainty and decision fatigue are making it feel sticky.',
        firstStep: 'Open the form and complete only the easiest factual field first.',
        context: 'life admin',
        prompts: {
          clarity: 'How unclear is the very first field or section you should tackle?',
          energy: 'How much does your body want to put this off for later?',
          overwhelm: 'How much does the form feel heavier than its actual size?',
          environment: 'How likely is context switching to break your focus once you open it?',
          emotion: 'How much anxiety or perfectionism is tied to filling this out correctly?'
        },
        actions: {
          clarity: 'Start with the easiest factual boxes before any complex responses.',
          energy: 'Tell yourself you are only opening and filling one field to start.',
          overwhelm: 'Split it into sections and define done one chunk at a time.',
          environment: 'Gather required info first so you are not hunting while filling it out.',
          emotion: 'Aim for complete first, polished second.'
        },
        extraDimensions: [
          {
            key: 'decision-fatigue',
            label: 'Decision fatigue',
            prompt: 'How much are too many little decisions slowing you down?',
            action: 'Make one decision at a time and keep moving forward instead of optimizing every field.'
          },
          {
            key: 'correctness-pressure',
            label: 'Correctness pressure',
            prompt: 'How much are you stuck because you want every answer to be exactly right before moving on?',
            action: 'Use a first-pass fill, then do one quick review instead of perfecting each box.'
          }
        ]
      }
    };
    var tfRun = document.getElementById('tf-run');
    var tfReset = document.getElementById('tf-reset');
    var tfCopy = document.getElementById('tf-copy');
    var tfExport = document.getElementById('tf-export');
    var tfResult = document.getElementById('tf-result');
    var tfMessage = document.getElementById('tf-message');
    var tfScenario = document.getElementById('tf-scenario');
    var tfScenarioNote = document.getElementById('tf-scenario-note');
    var tfGuidedList = document.getElementById('tf-guided-list');
    var lastProtocol = '';

    function readTaskHistory() {
      try { return JSON.parse(localStorage.getItem(TASK_FRICTION_HISTORY_KEY)) || []; } catch (e) { return []; }
    }

    function writeTaskHistory(history) {
      localStorage.setItem(TASK_FRICTION_HISTORY_KEY, JSON.stringify(history.slice(-8)));
    }

    function getActiveScenario() {
      var key = tfScenario && tfScenario.value ? tfScenario.value : 'report-due';
      return TF_SCENARIOS[key] || TF_SCENARIOS['report-due'];
    }

    function getActiveScenarioKey() {
      return tfScenario && tfScenario.value ? tfScenario.value : 'report-due';
    }

    function getScenarioDimensions() {
      var scenario = getActiveScenario();
      return TF_BASE_DIMENSIONS.concat(Array.isArray(scenario.extraDimensions) ? scenario.extraDimensions : []);
    }

    function renderTaskFrictionPrompts() {
      if (!tfGuidedList) return;
      var scenario = getActiveScenario();
      if (tfScenarioNote) tfScenarioNote.textContent = scenario.note;
      var html = '';
      getScenarioDimensions().forEach(function (item, index) {
        var prompt = (scenario.prompts && scenario.prompts[item.key]) || item.defaultPrompt;
        html += '<div class="guided-diagnostic-card">';
        html += '<span class="guided-diagnostic-card__title">' + (index + 1) + '. ' + item.label + '</span>';
        html += '<p class="guided-diagnostic-card__hint">' + prompt + '</p>';
        html += '<div class="esqr-rating" role="radiogroup" aria-label="' + item.label + '">';
        html += '<span class="esqr-rating__label">Not at all</span>';
        for (var value = 1; value <= 5; value++) {
          html += '<label class="esqr-rating__option"><input type="radio" name="tf-' + item.key + '" value="' + value + '"' + (value === 3 ? ' checked' : '') + '><span>' + value + '</span></label>';
        }
        html += '<span class="esqr-rating__label">Very much</span>';
        html += '</div></div>';
      });
      tfGuidedList.innerHTML = html;
    }

    function getTaskFrictionScores() {
      var scenario = getActiveScenario();
      return getScenarioDimensions().map(function (item) {
        var checked = document.querySelector('input[name="tf-' + item.key + '"]:checked');
        return {
          key: item.key,
          label: item.label,
          friction: Number(checked ? checked.value : 3),
          action: (scenario.actions && scenario.actions[item.key]) || item.defaultAction
        };
      });
    }

    function buildArchetype(scores) {
      var ranked = scores.slice().sort(function (a, b) { return b.friction - a.friction; });
      var top = ranked[0];
      var second = ranked[1];
      var keyA = top ? top.key : '';
      var keyB = second ? second.key : '';
      var has = function (key) { return keyA === key || keyB === key; };

      if (has('clarity') && (has('overwhelm') || has('blank-page') || has('unclear-priority'))) {
        return {
          title: 'Avoidance Through Ambiguity',
          why: 'The task is not feeling fully real yet because the opening move is still fuzzy. When the shape is unclear, your brain keeps delaying commitment.',
          quickWin: 'Define the first visible move so the task stops feeling abstract.',
          tenMinute: 'Build a tiny scaffold: heading, first move, and one concrete next action.',
          avoid: 'Do not wait to feel ready before naming the first step.'
        };
      }
      if (has('emotion') && (has('deadline-panic') || has('fear-bad-draft') || has('money-stress') || has('anticipation'))) {
        return {
          title: 'Pressure Freeze',
          why: 'The task is carrying too much emotional charge, so urgency is making your system lock up instead of mobilize.',
          quickWin: 'Lower the threat level and do one safe contact step immediately.',
          tenMinute: 'Run one timed exposure sprint so the task becomes active instead of imagined.',
          avoid: 'Do not use thinking-about-it as a substitute for first contact.'
        };
      }
      if (has('emotion') && (has('correctness-pressure') || has('wording-uncertainty') || has('fear-bad-draft'))) {
        return {
          title: 'Perfectionistic Delay',
          why: 'You are trying to avoid a messy or imperfect first pass, which makes starting feel more dangerous than it needs to be.',
          quickWin: 'Give yourself permission to make an intentionally rough version first.',
          tenMinute: 'Produce a clearly imperfect draft, outline, or script before revising anything.',
          avoid: 'Do not edit before something concrete exists.'
        };
      }
      if (has('environment') || has('visual-overload')) {
        return {
          title: 'Context Drift',
          why: 'Your surroundings are stronger than your starting signal right now. Even small distractions can pull the task apart before it gets traction.',
          quickWin: 'Strip the environment down to only what supports the next move.',
          tenMinute: 'Set up one clean zone and do one uninterrupted start block there.',
          avoid: 'Do not begin in the same context that usually pulls you away.'
        };
      }
      if (has('energy') && (has('overwhelm') || has('decision-fatigue'))) {
        return {
          title: 'Activation Drain',
          why: 'Your system is reading the task as too costly to initiate, so even simple moves feel heavier than they are.',
          quickWin: 'Shrink the entry point until it feels almost too easy to refuse.',
          tenMinute: 'Do a warm-start block focused only on momentum, not completion.',
          avoid: 'Do not make the first move as large as the whole task.'
        };
      }
      return {
        title: 'Mixed Start Friction',
        why: 'More than one friction layer is active, so the task feels sticky in a blended way rather than for one single reason.',
        quickWin: 'Remove the strongest blocker and then start the smallest visible move.',
        tenMinute: 'Use one short structured sprint to lower the total friction load.',
        avoid: 'Do not try to solve every blocker before you begin.'
      };
    }

    function buildBranchingScript(archetype, topScores, scenario) {
      var first = topScores[0];
      var second = topScores[1];
      var third = topScores[2];
      var quickWin = first ? first.action : archetype.quickWin;
      var tenMinuteMove = second ? second.action : (scenario.firstStep || archetype.tenMinute);
      var firstStep = scenario.firstStep || (third ? third.action : archetype.tenMinute);
      var avoidLine = archetype.avoid;

      if (first && first.key === 'clarity') {
        quickWin = 'Name the first physical move in plain language, then do only that. ' + first.action;
      } else if (first && (first.key === 'emotion' || first.key === 'deadline-panic' || first.key === 'anticipation')) {
        quickWin = 'Lower the threat first, then begin. ' + first.action;
      } else if (first && (first.key === 'overwhelm' || first.key === 'decision-fatigue')) {
        quickWin = 'Make the task smaller before you ask yourself to start. ' + first.action;
      } else if (first && (first.key === 'environment' || first.key === 'visual-overload')) {
        quickWin = 'Fix the context before you ask for focus. ' + first.action;
      }

      if (second && second.key === 'clarity') {
        tenMinuteMove = 'Use the next 10 minutes to create structure, not quality. ' + second.action;
      } else if (second && second.key === 'emotion') {
        tenMinuteMove = 'Use the next 10 minutes as exposure, not evaluation. ' + second.action;
      } else if (second) {
        tenMinuteMove = second.action;
      }

      return {
        quickWin: quickWin,
        tenMinuteMove: tenMinuteMove,
        firstStep: firstStep,
        avoidLine: avoidLine
      };
    }

    function buildRecurringTheme(history) {
      if (!history.length) return '';
      var archetypes = {};
      history.forEach(function (entry) {
        var key = entry.archetype || 'Mixed Start Friction';
        archetypes[key] = (archetypes[key] || 0) + 1;
      });
      var topArchetype = Object.keys(archetypes).sort(function (a, b) {
        return archetypes[b] - archetypes[a];
      })[0];
      if (!topArchetype || history.length < 2) return '';
      return 'Across your last ' + history.length + ' start stories, the same friction theme keeps returning: ' + topArchetype + '.';
    }

    function renderTaskFrictionBeforeAfterPanel(history) {
      if (!tfResult) return;
      var existing = document.getElementById('task-friction-before-after-panel');
      if (existing) existing.remove();
      if (!Array.isArray(history) || history.length < 2) return;

      var withScores = history.filter(function (entry) {
        return entry && Number.isFinite(Number(entry.frictionPercent));
      });
      if (withScores.length < 2) return;

      var midpoint = Math.floor(withScores.length / 2);
      if (midpoint < 1 || withScores.length - midpoint < 1) return;

      function avg(list) {
        if (!list.length) return 0;
        return list.reduce(function (sum, item) { return sum + Number(item.frictionPercent || 0); }, 0) / list.length;
      }

      var earlyAvg = avg(withScores.slice(0, midpoint));
      var recentAvg = avg(withScores.slice(midpoint));
      var delta = Math.round(earlyAvg - recentAvg);
      var direction = delta > 0 ? 'improved' : (delta < 0 ? 'increased' : 'held steady');

      var earlyTheme = withScores[0] && withScores[0].archetype ? withScores[0].archetype : 'N/A';
      var recentTheme = withScores[withScores.length - 1] && withScores[withScores.length - 1].archetype ? withScores[withScores.length - 1].archetype : 'N/A';

      var card = document.createElement('section');
      card.id = 'task-friction-before-after-panel';
      card.className = 'card';
      card.style.marginTop = 'var(--space-md)';
      card.style.borderLeft = '4px solid var(--color-accent)';
      card.innerHTML =
        '<h5 style="margin-top:0;">What Changed (Before/After)</h5>' +
        '<p style="margin:0 0 var(--space-xs) 0;">Early friction average: <strong>' + Math.round(earlyAvg) + '%</strong>. ' +
        'Recent friction average: <strong>' + Math.round(recentAvg) + '%</strong>.</p>' +
        '<p style="margin:0 0 var(--space-xs) 0;color:var(--color-text-light);">Interpretation: start friction has <strong>' + direction + '</strong>' +
        (delta !== 0 ? ' by about ' + Math.abs(delta) + ' percentage points.' : '.') + '</p>' +
        '<p style="margin:0;color:var(--color-text-light);">Theme shift: <strong>' + earlyTheme + '</strong> → <strong>' + recentTheme + '</strong>.</p>';
      tfResult.insertAdjacentElement('afterend', card);
    }

    function runFrictionDiagnostic() {
      if (!tfResult) return;
      var scenario = getActiveScenario();
      var scenarioKey = getActiveScenarioKey();
      var taskName = scenario.label;
      var scores = getTaskFrictionScores();

      var total = scores.reduce(function (sum, s) { return sum + s.friction; }, 0);
      var frictionPercent = Math.round((total / (scores.length * 5)) * 100);
      var ranked = scores.slice().sort(function (a, b) { return b.friction - a.friction; });
      var top = ranked.slice(0, 3);
      var riskLabel = frictionPercent >= 70 ? 'High' : (frictionPercent >= 45 ? 'Moderate' : 'Low');
      var archetype = buildArchetype(scores);
      var script = buildBranchingScript(archetype, top, scenario);
      var recurringTheme = buildRecurringTheme(readTaskHistory());
      lastProtocol =
        'Starting ' + taskName + ' looks like a ' + frictionPercent + '% friction task (' + riskLabel + ') with the pattern "' + archetype.title + '." ' +
        'The biggest drag points are ' + top[0].label + ', ' + top[1].label + ', and ' + top[2].label + '. ' +
        'Start plan: 1) ' + script.quickWin + ' 2) ' + script.tenMinuteMove + ' 3) ' + script.firstStep + ' Do not do this: ' + script.avoidLine +
        (recurringTheme ? ' ' + recurringTheme : '');

      var latestResult = {
        generatedAt: new Date().toISOString(),
        scenarioKey: scenarioKey,
        taskName: taskName,
        frictionPercent: frictionPercent,
        riskLabel: riskLabel,
        topBlockers: [top[0].label, top[1].label, top[2].label],
        archetype: archetype.title,
        quickWin: script.quickWin,
        tenMinuteMove: script.tenMinuteMove,
        avoidLine: script.avoidLine,
        recurringTheme: recurringTheme,
        protocol: lastProtocol
      };
      localStorage.setItem(TASK_FRICTION_KEY, JSON.stringify(latestResult));
      var history = readTaskHistory();
      history.push({
        generatedAt: latestResult.generatedAt,
        scenarioKey: scenarioKey,
        archetype: archetype.title,
        topBlocker: top[0].label,
        frictionPercent: frictionPercent,
        riskLabel: riskLabel
      });
      writeTaskHistory(history);
      var savedHistory = readTaskHistory();
      recurringTheme = buildRecurringTheme(savedHistory);
      if (recurringTheme && latestResult.recurringTheme !== recurringTheme) {
        latestResult.recurringTheme = recurringTheme;
        latestResult.protocol = lastProtocol + ' ' + recurringTheme;
        localStorage.setItem(TASK_FRICTION_KEY, JSON.stringify(latestResult));
        lastProtocol = latestResult.protocol;
      }

      tfResult.innerHTML =
        '<strong>Start story for ' + taskName + ': ' + frictionPercent + '% friction (' + riskLabel + ')</strong>' +
        '<p style="margin:var(--space-sm) 0 0;"><strong>Pattern:</strong> ' + archetype.title + '</p>' +
        '<p style="margin:var(--space-sm) 0 0;">' + archetype.why + '</p>' +
        '<p style="margin:var(--space-sm) 0 0;">The heaviest pressure points right now are <strong>' + top[0].label + '</strong>, <strong>' + top[1].label + '</strong>, and <strong>' + top[2].label + '</strong>.</p>' +
        '<ul style="margin:var(--space-sm) 0 0;padding-left:var(--space-lg);">' +
          '<li><strong>First 2-minute move:</strong> ' + script.quickWin + '</li>' +
          '<li><strong>10-minute move:</strong> ' + script.tenMinuteMove + '</li>' +
          '<li><strong>Start script:</strong> ' + script.firstStep + '</li>' +
          '<li><strong>Do not do this:</strong> ' + script.avoidLine + '</li>' +
        '</ul>';
      if (recurringTheme) {
        tfResult.innerHTML += '<p style="margin:var(--space-sm) 0 0;"><strong>Recurring pattern:</strong> ' + recurringTheme + '</p>';
      }
      renderTaskFrictionBeforeAfterPanel(savedHistory);
      if (tfMessage) tfMessage.textContent = 'Your start script is ready. Copy it if you want it beside you while you begin.';

      var frictionPlan = buildTaskFrictionPlan(latestResult);
      if (frictionPlan) {
        persistAndEmitActionPlan(frictionPlan, 'task_friction');
        if (tfResult) renderActionPlanCard(tfResult, frictionPlan, 'task_friction');
      }
    }

    if (tfRun) tfRun.addEventListener('click', runFrictionDiagnostic);
    if (tfReset) {
      tfReset.addEventListener('click', function () {
        if (tfScenario) tfScenario.value = 'report-due';
        renderTaskFrictionPrompts();
        document.querySelectorAll('input[name^="tf-"]').forEach(function (input) {
          input.checked = input.value === '3';
        });
        lastProtocol = '';
        localStorage.removeItem(TASK_FRICTION_KEY);
        if (tfResult) tfResult.textContent = 'Rate each friction layer and EFI will build a tailored start script for this situation.';
        renderTaskFrictionBeforeAfterPanel([]);
        if (tfMessage) tfMessage.textContent = 'No protocol copied yet.';
      });
    }

    if (tfCopy) {
      tfCopy.addEventListener('click', function () {
        if (!lastProtocol) {
          if (tfMessage) tfMessage.textContent = 'Run analysis first, then copy the protocol.';
          return;
        }
        copyText(lastProtocol, function () {
          if (tfMessage) tfMessage.textContent = 'Protocol copied.';
        });
      });
    }

    if (tfExport) {
      tfExport.addEventListener('click', function () {
        if (!lastProtocol) {
          if (tfMessage) tfMessage.textContent = 'Run analysis first, then export the protocol.';
          return;
        }
        downloadText(lastProtocol, 'efi-task-start-friction-' + new Date().toISOString().slice(0, 10) + '.txt');
        if (tfMessage) tfMessage.textContent = 'Protocol exported.';
      });
    }

    if (tfScenario) {
      tfScenario.addEventListener('change', function () {
        renderTaskFrictionPrompts();
        lastProtocol = '';
        localStorage.removeItem(TASK_FRICTION_KEY);
        if (tfResult) tfResult.textContent = 'Rate each friction layer and EFI will build a tailored start script for this situation.';
        renderTaskFrictionBeforeAfterPanel([]);
        if (tfMessage) tfMessage.textContent = 'Situation updated. Run the tool again to get a new start script.';
      });
    }

    if (hasTaskTool) renderTaskFrictionPrompts();
    if (hasTimeTool) renderTimeCalibrator();
})();
