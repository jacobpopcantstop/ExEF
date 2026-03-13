(function () {
  'use strict';

  var form = document.getElementById('esqr-form');
  if (!form) return;

  var questionsWrap = document.getElementById('esqr-question-groups');
  var progressFill = document.getElementById('progress-fill');
  var progressText = document.getElementById('progress-text');
  var draftStatus = document.getElementById('esqr-draft-status');
  var errorMsg = document.getElementById('esqr-error');
  var resultsSection = document.getElementById('esqr-results');
  var titleEl = document.getElementById('esqr-result-title');
  var ledeEl = document.getElementById('esqr-result-lede');
  var summaryEl = document.getElementById('esqr-summary');
  var signalSummaryEl = document.getElementById('esqr-signal-summary');
  var strengthsEl = document.getElementById('strengths-list');
  var growthEl = document.getElementById('weaknesses-list');
  var nextToolsEl = document.getElementById('esqr-next-tools');
  var shareStatus = document.getElementById('esqr-share-status');
  var historyEl = document.getElementById('esqr-history');
  var leadForm = document.getElementById('esqr-lead-form');
  var leadStatus = document.getElementById('esqr-lead-status');
  var leadOfferPreview = document.getElementById('esqr-offer-preview');
  var resetBtn = document.getElementById('esqr-reset-btn');
  var copyBtn = document.getElementById('esqr-copy-btn');
  var exportBtn = document.getElementById('esqr-export-btn');
  var downloadPngBtn = document.getElementById('esqr-download-png-btn');
  var downloadPdfBtn = document.getElementById('esqr-download-pdf-btn');
  var shareBtn = document.getElementById('esqr-share-btn');

  var HISTORY_KEY = 'efi_esqr_history';
  var RESULT_KEY = 'efi_esqr_results';
  var DRAFT_KEY = 'efi_esqr_draft_v2';
  var MAX_HISTORY = 20;

  var config = null;
  var lastResultsPayload = null;
  var ACTION_PLAN_STORAGE_KEY = 'efi_action_plans_v1';
  var REFLECTION_STORAGE_KEY = 'efi_reflections_v1';

  function setShareStatus(message) {
    if (shareStatus) shareStatus.textContent = message;
  }

  function setLeadStatus(message) {
    if (leadStatus) leadStatus.textContent = message;
  }

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
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

  function updatePlanStatus(planId, status) {
    var plans = readActionPlans();
    var changed = false;
    plans.forEach(function (plan) {
      if (plan && plan.plan_id === planId) {
        plan.state = plan.state || {};
        plan.state.status = status;
        plan.state.updated_at = new Date().toISOString();
        changed = true;
      }
    });
    if (changed) writeActionPlans(plans);
  }

  function completePlanCheckin(planId, payload) {
    var plans = readActionPlans();
    var changed = false;
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
        changed = true;
      }
    });
    if (changed) writeActionPlans(plans);
    return checkinAt;
  }

  function buildEsqrActionPlan(payload) {
    if (!payload) return null;
    var growth = Array.isArray(payload.growthAreas) ? payload.growthAreas : [];
    var focus = growth.length ? growth[0] : { id: 'general', name: 'General EF reinforcement', score: 0 };
    var offerFocus = payload.offer && payload.offer.focus ? payload.offer.focus : 'executive function consistency';
    var now = new Date();
    var dueAt = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString();
    var planId = 'plan_esqr_' + Date.now();

    return {
      schema_version: '1.0',
      plan_id: planId,
      source_tool: 'esqr',
      source_context: {
        module_id: 'esqr',
        question_ids: [],
        misconception_primary: focus.id || 'general_reinforcement',
        misconception_secondary: ''
      },
      focus: {
        title: 'ESQ-R Growth Focus: ' + (focus.name || 'Executive skills'),
        summary: 'Prioritize one growth area this week and apply a repeatable strategy in real contexts.',
        confidence: 'medium'
      },
      actions: {
        today: ['Choose one high-friction context and apply one support for ' + offerFocus + '.'],
        this_week: ['Run the same support at least 3 times and log what changed in execution consistency.'],
        evidence_prompt: 'What measurable shift did you observe in this growth area over the week?'
      },
      recheck: {
        cadence: '7d',
        due_at: dueAt,
        metric_type: 'self_rating',
        success_threshold: { type: 'numeric_or_state', value: 1 }
      },
      remediation_links: [
        { label: 'Revisit growth strategies', href: 'esqr.html#esqr-results' },
        { label: 'Run task-start diagnostic', href: 'task-start-friction.html' },
        { label: 'Calibrate planning realism', href: 'time-blindness-calibrator.html' }
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

  function renderEsqrActionPlanCard(plan) {
    if (!resultsSection || !plan) return;
    var existing = document.getElementById('esqr-action-plan-card');
    if (existing) existing.remove();

    var card = document.createElement('section');
    card.id = 'esqr-action-plan-card';
    card.className = 'card';
    card.style.marginTop = 'var(--space-lg)';
    card.style.borderLeft = '4px solid var(--color-primary)';

    var dueLabel = plan.recheck && plan.recheck.due_at ? new Date(plan.recheck.due_at).toLocaleString() : 'upcoming';
    var links = (plan.remediation_links || []).map(function (link) {
      return '<li><a href="' + link.href + '">' + link.label + '</a></li>';
    }).join('');

    card.innerHTML =
      '<h4 style="margin-top:0;">Your 7-Day Action Plan</h4>' +
      '<p style="margin-bottom:var(--space-sm);"><strong>' + plan.focus.title + '</strong></p>' +
      '<p style="color:var(--color-text-light);">' + plan.focus.summary + '</p>' +
      '<p><strong>Do today:</strong> ' + (plan.actions.today[0] || '') + '</p>' +
      '<p><strong>Do this week:</strong> ' + (plan.actions.this_week[0] || '') + '</p>' +
      '<p><strong>Re-check by:</strong> ' + dueLabel + ' (' + plan.recheck.cadence + ')</p>' +
      '<p style="color:var(--color-text-light);"><strong>Evidence prompt:</strong> ' + plan.actions.evidence_prompt + '</p>' +
      (links ? '<ul class="checklist">' + links + '</ul>' : '');

    var row = document.createElement('div');
    row.className = 'button-group';
    row.style.marginTop = 'var(--space-md)';

    var startBtn = document.createElement('button');
    startBtn.type = 'button';
    startBtn.className = 'btn btn--primary btn--sm';
    startBtn.textContent = 'Start Plan';

    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn btn--secondary btn--sm';
    copyBtn.textContent = 'Copy Plan';

    var status = document.createElement('p');
    status.style.marginTop = 'var(--space-sm)';
    status.style.fontSize = '0.9rem';
    status.style.color = 'var(--color-text-light)';

    var checkinWrap = document.createElement('div');
    checkinWrap.style.marginTop = 'var(--space-sm)';
    checkinWrap.innerHTML =
      '<p style="margin:0 0 var(--space-xs) 0;"><strong>Quick check-in</strong> (capture transfer evidence)</p>' +
      '<div style="display:flex;gap:var(--space-sm);flex-wrap:wrap;align-items:end;">' +
      '<label style="display:flex;flex-direction:column;gap:4px;min-width:140px;">Self-rating (1-5)<select class="esqr-plan-checkin-rating"><option value="">Select</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></label>' +
      '<label style="display:flex;flex-direction:column;gap:4px;min-width:220px;">Observable metric<input class="esqr-plan-checkin-metric" type="text" placeholder="ex: used support 3/5 days"></label>' +
      '</div>';
    var checkinBtn = document.createElement('button');
    checkinBtn.type = 'button';
    checkinBtn.className = 'btn btn--secondary btn--sm';
    checkinBtn.style.marginTop = 'var(--space-xs)';
    checkinBtn.textContent = 'Complete Check-In';

    startBtn.addEventListener('click', function () {
      if (startBtn.disabled) return;
      startBtn.disabled = true;
      startBtn.textContent = 'Plan Started';
      status.textContent = 'Plan started. Recheck reminder has been queued.';
      updatePlanStatus(plan.plan_id, 'started');
      trackAssessmentEvent('practice_plan_started', {
        plan_id: plan.plan_id,
        source_tool: 'esqr',
        module_id: 'esqr',
        started_at: new Date().toISOString()
      });
    });

    copyBtn.addEventListener('click', function () {
      var text = 'Focus: ' + plan.focus.title + '\n' +
        'Do today: ' + (plan.actions.today[0] || '') + '\n' +
        'Do this week: ' + (plan.actions.this_week[0] || '') + '\n' +
        'Re-check by: ' + dueLabel;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          status.textContent = 'Plan copied.';
        }).catch(function () {
          status.textContent = 'Copy unavailable on this browser.';
        });
      } else {
        status.textContent = 'Copy unavailable on this browser.';
      }
    });

    checkinBtn.addEventListener('click', function () {
      var ratingEl = checkinWrap.querySelector('.esqr-plan-checkin-rating');
      var metricEl = checkinWrap.querySelector('.esqr-plan-checkin-metric');
      var rating = Number(ratingEl && ratingEl.value ? ratingEl.value : 0);
      var metric = String(metricEl && metricEl.value || '').trim();
      if (!rating || !metric) {
        status.textContent = 'Add a 1-5 rating and one observable metric to complete the check-in.';
        return;
      }
      var checkinAt = completePlanCheckin(plan.plan_id, {
        self_rating: rating,
        metric_label: plan.recheck && plan.recheck.metric_type ? plan.recheck.metric_type : 'self_report',
        metric_value: metric
      });
      status.textContent = 'Check-in saved. Keep running this support and recheck next week.';
      trackAssessmentEvent('practice_checkin_completed', {
        plan_id: plan.plan_id,
        source_tool: 'esqr',
        module_id: 'esqr',
        self_rating: rating,
        metric_label: plan.recheck && plan.recheck.metric_type ? plan.recheck.metric_type : 'self_report',
        metric_value: metric,
        completed_at: checkinAt
      });
    });

    row.appendChild(startBtn);
    row.appendChild(copyBtn);
    card.appendChild(row);
    card.appendChild(checkinWrap);
    card.appendChild(checkinBtn);
    card.appendChild(status);
    resultsSection.appendChild(card);
  }


  function saveReflectionEntry(entry) {
    var list = [];
    try { list = JSON.parse(localStorage.getItem(REFLECTION_STORAGE_KEY)) || []; } catch (e) { list = []; }
    list.push(entry);
    localStorage.setItem(REFLECTION_STORAGE_KEY, JSON.stringify(list.slice(-100)));
  }

  function renderEsqrReflectionPrompt(plan) {
    if (!resultsSection || !plan) return;
    var existing = document.getElementById('esqr-reflection-card');
    if (existing) existing.remove();

    var card = document.createElement('section');
    card.id = 'esqr-reflection-card';
    card.className = 'card';
    card.style.marginTop = 'var(--space-md)';
    card.style.borderLeft = '4px solid var(--color-accent)';
    card.innerHTML =
      '<h4 style="margin-top:0;">48-Hour Reflection Prompt</h4>' +
      '<p style="color:var(--color-text-light);">What will you test in the next 48 hours to improve this ESQ-R growth area?</p>' +
      '<textarea id="esqr-reflection-input" rows="3" style="width:100%;padding:var(--space-sm);border:1px solid var(--color-border);border-radius:var(--border-radius);"></textarea>' +
      '<div class="button-group" style="margin-top:var(--space-sm);">' +
      '<button type="button" id="esqr-reflection-save" class="btn btn--secondary btn--sm">Save Reflection</button>' +
      '</div>' +
      '<p id="esqr-reflection-status" style="margin-top:var(--space-xs);font-size:0.9rem;color:var(--color-text-light);"></p>';

    resultsSection.appendChild(card);

    var input = card.querySelector('#esqr-reflection-input');
    var save = card.querySelector('#esqr-reflection-save');
    var status = card.querySelector('#esqr-reflection-status');
    if (!input || !save || !status) return;

    save.addEventListener('click', function () {
      var text = String(input.value || '').trim();
      if (!text) {
        status.textContent = 'Write one testable action before saving.';
        return;
      }
      var payload = {
        id: 'refl_' + Date.now(),
        source_tool: 'esqr',
        plan_id: plan.plan_id,
        module_id: 'esqr',
        reflection_48h: text,
        at: new Date().toISOString()
      };
      saveReflectionEntry(payload);
      trackAssessmentEvent('behavior_transfer_logged', {
        plan_id: plan.plan_id,
        source_tool: 'esqr',
        module_id: 'esqr',
        transfer_type: 'self_report',
        transfer_value: text,
        logged_at: payload.at
      });
      status.textContent = 'Reflection saved.';
    });
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-src="' + src + '"]');
      if (existing) {
        if (existing.getAttribute('data-loaded') === '1') {
          resolve();
        } else {
          existing.addEventListener('load', function () { resolve(); }, { once: true });
          existing.addEventListener('error', function () { reject(new Error('Failed loading ' + src)); }, { once: true });
        }
        return;
      }
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-src', src);
      script.onload = function () {
        script.setAttribute('data-loaded', '1');
        resolve();
      };
      script.onerror = function () {
        reject(new Error('Failed loading ' + src));
      };
      document.head.appendChild(script);
    });
  }

  function ensureCanvasEngine() {
    if (window.html2canvas) return Promise.resolve();
    return loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
  }

  function ensurePdfEngine() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve();
    return loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
  }

  function loadConfig() {
    return fetch('data/esqr-config.json', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('Unable to load the ESQ-R configuration.');
        return res.json();
      })
      .then(function (payload) {
        if (!payload || !Array.isArray(payload.areas) || !Array.isArray(payload.questions)) {
          throw new Error('The ESQ-R configuration is incomplete.');
        }
        config = payload;
      });
  }

  function areaMap() {
    var map = {};
    config.areas.forEach(function (area) {
      map[area.id] = area;
    });
    return map;
  }

  function getScale() {
    var scale = config.scale || {};
    return {
      min: Number(scale.min) || 1,
      max: Number(scale.max) || 5,
      labels: Array.isArray(scale.labels) && scale.labels.length ? scale.labels : ['Rarely true', 'Sometimes true', 'Mixed', 'Usually true', 'Consistently true']
    };
  }

  function renderQuestions() {
    if (!questionsWrap || !config) return;
    var scale = getScale();
    var areasById = areaMap();
    var grouped = {};
    config.questions.forEach(function (question) {
      if (!grouped[question.areaId]) grouped[question.areaId] = [];
      grouped[question.areaId].push(question);
    });

    var html = '';
    config.areas.forEach(function (area, areaIndex) {
      var questions = grouped[area.id] || [];
      html += '<fieldset class="esqr-skill-group fade-in visible" data-area="' + area.id + '">';
      html += '<legend class="esqr-skill-group__legend">' + area.name + '</legend>';
      html += '<p class="esqr-area-intro">' + area.intro + '</p>';
      questions.forEach(function (question, questionIndex) {
        var itemNumber = areaIndex * 5 + questionIndex + 1;
        html += '<div class="esqr-item">';
        html += '<p class="esqr-item__text"><span class="esqr-item__number">' + itemNumber + '.</span> ' + question.prompt + '</p>';
        html += '<div class="esqr-rating" role="radiogroup" aria-label="Rating for question ' + itemNumber + '">';
        html += '<span class="esqr-rating__label">' + scale.labels[0] + '</span>';
        for (var value = scale.min; value <= scale.max; value++) {
          html += '<label class="esqr-rating__option">';
          html += '<input type="radio" name="' + question.id + '" value="' + value + '" required>';
          html += '<span>' + value + '</span>';
          html += '</label>';
        }
        html += '<span class="esqr-rating__label">' + scale.labels[scale.labels.length - 1] + '</span>';
        html += '</div>';
        html += '</div>';
      });
      html += '</fieldset>';
    });
    questionsWrap.innerHTML = html;
  }

  function applyDraft() {
    var draft = readJson(DRAFT_KEY, null);
    if (!draft || !draft.answers) return;
    Object.keys(draft.answers).forEach(function (questionId) {
      var value = String(draft.answers[questionId]);
      var input = form.querySelector('input[name="' + questionId + '"][value="' + value + '"]');
      if (input) input.checked = true;
    });
    if (draftStatus) {
      var timestamp = draft.savedAt ? new Date(draft.savedAt).toLocaleString() : 'recently';
      draftStatus.hidden = false;
      draftStatus.textContent = 'Saved progress restored from ' + timestamp + '.';
    }
  }

  function getAnswers() {
    var answers = {};
    config.questions.forEach(function (question) {
      var checked = form.querySelector('input[name="' + question.id + '"]:checked');
      if (checked) answers[question.id] = Number(checked.value);
    });
    return answers;
  }

  function saveDraft() {
    var answers = getAnswers();
    if (!Object.keys(answers).length) return;
    writeJson(DRAFT_KEY, {
      savedAt: new Date().toISOString(),
      answers: answers
    });
    if (draftStatus) {
      draftStatus.hidden = false;
      draftStatus.textContent = 'Progress saved on this device.';
    }
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    if (draftStatus) {
      draftStatus.hidden = true;
      draftStatus.textContent = '';
    }
  }

  function updateProgress() {
    if (!config) return;
    var answered = form.querySelectorAll('input[type="radio"]:checked').length;
    var total = config.questions.length;
    var pct = total ? Math.round((answered / total) * 100) : 0;
    if (progressFill) progressFill.style.width = pct + '%';
    if (progressText) progressText.textContent = answered + ' of ' + total + ' answered';
    var bar = progressFill && progressFill.closest('.esqr-progress');
    if (bar) {
      bar.setAttribute('aria-valuenow', answered);
      bar.setAttribute('aria-valuemax', total);
    }
  }

  function isComplete() {
    return config.questions.every(function (question) {
      return !!form.querySelector('input[name="' + question.id + '"]:checked');
    });
  }

  function scoreBand(score) {
    if (score >= 4.2) return 'Clear strength';
    if (score >= 3.4) return 'Stable capacity';
    if (score >= 2.6) return 'Mixed signal';
    return 'Support needed';
  }

  function computeResults() {
    var answers = getAnswers();
    var groupedQuestions = {};
    config.questions.forEach(function (question) {
      if (!groupedQuestions[question.areaId]) groupedQuestions[question.areaId] = [];
      groupedQuestions[question.areaId].push(question);
    });

    var areas = config.areas.map(function (area) {
      var questions = groupedQuestions[area.id] || [];
      var values = questions.map(function (question) {
        return Number(answers[question.id] || 0);
      });
      var total = values.reduce(function (sum, value) { return sum + value; }, 0);
      var average = values.length ? (total / values.length) : 0;
      return {
        id: area.id,
        name: area.name,
        signal: area.signal,
        intro: area.intro,
        score: Number(average.toFixed(2)),
        band: scoreBand(average),
        strengthSummary: area.strengthSummary,
        growthSummary: area.growthSummary,
        strategies: area.strategies || [],
        items: questions.map(function (question) {
          return {
            id: question.id,
            prompt: question.prompt,
            score: Number(answers[question.id] || 0)
          };
        })
      };
    }).sort(function (a, b) {
      return b.score - a.score;
    });

    var overallScore = areas.reduce(function (sum, area) { return sum + area.score; }, 0) / Math.max(1, areas.length);
    var strengths = areas.slice(0, 2);
    var growthAreas = areas.slice(-2).reverse();
    var signalPressure = {
      planning: 0,
      activation: 0,
      regulation: 0,
      environment: 0
    };

    growthAreas.forEach(function (area, index) {
      if (signalPressure[area.signal] !== undefined) {
        signalPressure[area.signal] += index === 0 ? 2 : 1;
      }
    });

    return {
      answers: answers,
      areas: areas,
      strengths: strengths,
      growthAreas: growthAreas,
      overallScore: Number(overallScore.toFixed(2)),
      signalPressure: signalPressure
    };
  }

  function deriveOffer(growthAreas) {
    var primary = growthAreas && growthAreas.length ? String(growthAreas[0].id || '') : '';
    var byArea = {
      'planning-time': { code: 'PLAN40', focus: 'planning and time management' },
      'initiation-follow-through': { code: 'START40', focus: 'task initiation and follow-through' },
      'attention-working-memory': { code: 'FOCUS40', focus: 'focus and working memory support' },
      'organization-monitoring': { code: 'ORDER40', focus: 'organization and self-monitoring systems' },
      'regulation-flexibility': { code: 'CALM40', focus: 'regulation and flexible recovery' }
    };
    var selected = byArea[primary] || { code: 'ESQR40', focus: 'executive functioning coaching support' };
    return {
      code: selected.code,
      focus: selected.focus,
      discountPercent: 40
    };
  }

  function buildNarrative(result) {
    var top = result.strengths[0];
    var growth = result.growthAreas[0];
    var overallBand = scoreBand(result.overallScore);
    var narrative = 'Your strongest current base looks like ' + top.name.toLowerCase() + ', while the biggest drag appears in ' + growth.name.toLowerCase() + '. ';
    if (result.overallScore >= 4) {
      narrative += 'Overall, this profile reads like a solid system with a few pressure points worth tightening.';
    } else if (result.overallScore >= 3) {
      narrative += 'Overall, this profile looks workable but uneven. Stronger days probably depend on setup and conditions more than outsiders realize.';
    } else {
      narrative += 'Overall, this profile suggests that daily demands may be outrunning your current support systems, which makes external scaffolding especially important right now.';
    }
    return {
      title: overallBand + ': ' + growth.name + ' is the main leverage point',
      lede: narrative
    };
  }

  function buildSignalSummary(result) {
    var ranked = Object.keys(result.signalPressure).map(function (key) {
      return { key: key, score: result.signalPressure[key] };
    }).sort(function (a, b) {
      return b.score - a.score;
    }).filter(function (item) {
      return item.score > 0;
    });

    if (!ranked.length) {
      return 'No major cross-signal pressure stands out yet. Use the other EFI tools to see where friction becomes situational rather than trait-like.';
    }

    var labelMap = {
      planning: 'planning',
      activation: 'activation',
      regulation: 'regulation',
      environment: 'environment and focus'
    };

    return 'Cross-signal read: the strongest pressure appears in ' + labelMap[ranked[0].key] + '. Pair this result with another EFI diagnostic to confirm whether the pattern is structural, situational, or both.';
  }

  function buildNextTools(result) {
    var primarySignal = result.growthAreas.length ? result.growthAreas[0].signal : '';
    var suggestionsBySignal = {
      planning: [
        { href: 'time-blindness-calibrator.html', label: 'Time Blindness Calibrator', copy: 'Check whether your schedule is compressing task length and transitions.' },
        { href: 'full-ef-profile.html', label: 'Cross-Signal Profile', copy: 'Combine timing drift with the rest of your EFI data.' }
      ],
      activation: [
        { href: 'task-start-friction.html', label: 'Task Start Friction', copy: 'Turn startup resistance into a concrete first-step protocol.' },
        { href: 'full-ef-profile.html', label: 'Cross-Signal Profile', copy: 'See whether your pattern is activation-only or activation-plus-planning.' }
      ],
      environment: [
        { href: 'ef-profile-story.html', label: 'EF Profile Story', copy: 'Add narrative detail around distraction, overload, and recovery.' },
        { href: 'full-ef-profile.html', label: 'Cross-Signal Profile', copy: 'Merge attention patterns with the rest of the EFI tool stack.' }
      ],
      regulation: [
        { href: 'ef-profile-story.html', label: 'EF Profile Story', copy: 'Add emotional-load context and a short experiment plan.' },
        { href: 'task-start-friction.html', label: 'Task Start Friction', copy: 'Map where pressure and dread are blocking execution.' }
      ]
    };

    return suggestionsBySignal[primarySignal] || [
      { href: 'ef-profile-story.html', label: 'EF Profile Story', copy: 'Add narrative detail to this intake snapshot.' },
      { href: 'full-ef-profile.html', label: 'Cross-Signal Profile', copy: 'Combine multiple EFI tools into one synthesis.' }
    ];
  }

  function renderChart(result) {
    var container = document.getElementById('esqr-chart');
    if (!container) return;
    var html = '<div class="esqr-bars esqr-bars--single">';
    result.areas.slice().reverse().forEach(function (area) {
      var pct = (area.score / 5) * 100;
      var barClass = area.signal === 'regulation' ? 'esqr-bar--doing' : 'esqr-bar--thinking';
      html += '<div class="esqr-bar-group">';
      html += '<div class="esqr-bar-wrapper">';
      html += '<div class="esqr-bar ' + barClass + '" style="height:' + pct + '%;" title="' + area.name + ': ' + area.score + '/5">';
      html += '<span class="esqr-bar__value">' + area.score.toFixed(1) + '</span>';
      html += '</div>';
      html += '</div>';
      html += '<div class="esqr-bar__label">' + area.name + '</div>';
      html += '</div>';
    });
    html += '</div>';
    html += '<div class="esqr-chart-legend">';
    html += '<span class="esqr-legend-item"><span class="esqr-legend-dot" style="background:var(--color-primary-light);"></span> Planning, activation, and attention systems</span>';
    html += '<span class="esqr-legend-item"><span class="esqr-legend-dot" style="background:var(--color-accent);"></span> Regulation and flexibility</span>';
    html += '</div>';
    container.innerHTML = html;
  }

  function renderAreaCards(items, type) {
    return items.map(function (area) {
      var cardClass = type === 'strength' ? 'esqr-result-card--strength' : 'esqr-result-card--weakness';
      var summary = type === 'strength' ? area.strengthSummary : area.growthSummary;
      var html = '<div class="esqr-result-card ' + cardClass + '">';
      html += '<div class="esqr-result-card__header"><strong>' + area.name + '</strong><span class="esqr-result-card__score">' + area.score.toFixed(1) + '/5</span></div>';
      html += '<span class="esqr-result-card__domain">' + area.band + '</span>';
      html += '<p class="esqr-result-card__summary">' + summary + '</p>';
      if (Array.isArray(area.strategies) && area.strategies.length) {
        html += '<ul class="esqr-result-card__strategies">';
        area.strategies.forEach(function (strategy) {
          html += '<li>' + strategy + '</li>';
        });
        html += '</ul>';
      }
      html += '</div>';
      return html;
    }).join('');
  }

  function renderHistory() {
    if (!historyEl) return;
    var history = readJson(HISTORY_KEY, []);
    if (!history.length) {
      historyEl.style.display = 'none';
      historyEl.innerHTML = '';
      return;
    }
    var html = '<h3 style="margin-top:0;">Recent ESQ-R snapshots</h3><ul class="checklist">';
    history.slice(-5).reverse().forEach(function (entry) {
      var growth = Array.isArray(entry.growthAreas) && entry.growthAreas.length ? entry.growthAreas[0].name : 'No growth area';
      var strength = Array.isArray(entry.strengths) && entry.strengths.length ? entry.strengths[0].name : 'No strength';
      html += '<li>' + new Date(entry.generatedAt).toLocaleString() + ' - strongest: ' + strength + '; main leverage point: ' + growth + '.</li>';
    });
    html += '</ul>';
    historyEl.innerHTML = html;
    historyEl.style.display = 'block';
  }

  function buildSummaryText() {
    if (!lastResultsPayload) return '';
    var lines = [];
    lines.push('EFI ESQ-R Interactive Intake');
    lines.push('Generated: ' + new Date(lastResultsPayload.generatedAt).toLocaleString());
    lines.push('');
    lines.push(lastResultsPayload.profileTitle);
    lines.push(lastResultsPayload.profileNarrative);
    lines.push('');
    lines.push('Overall score: ' + lastResultsPayload.overallScore.toFixed(1) + '/5');
    lines.push('Cross-signal note: ' + lastResultsPayload.signalSummary);
    lines.push('');
    lines.push('Current strengths:');
    lastResultsPayload.strengths.forEach(function (area) {
      lines.push('- ' + area.name + ': ' + area.score.toFixed(1) + '/5');
    });
    lines.push('');
    lines.push('Main leverage points:');
    lastResultsPayload.growthAreas.forEach(function (area) {
      lines.push('- ' + area.name + ': ' + area.score.toFixed(1) + '/5');
      (area.strategies || []).slice(0, 2).forEach(function (strategy) {
        lines.push('  Strategy: ' + strategy);
      });
    });
    lines.push('');
    lines.push('Suggested next tools:');
    lastResultsPayload.nextTools.forEach(function (tool) {
      lines.push('- ' + tool.label + ': ' + tool.copy);
    });
    return lines.join('\n');
  }

  function downloadText(text, fileName) {
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function copyText(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(done);
      return;
    }
    done();
  }

  function renderResults() {
    var result = computeResults();
    var narrative = buildNarrative(result);
    var signalSummary = buildSignalSummary(result);
    var nextTools = buildNextTools(result);
    var offer = deriveOffer(result.growthAreas);

    lastResultsPayload = {
      generatedAt: new Date().toISOString(),
      modelVersion: config.version,
      overallScore: result.overallScore,
      areas: result.areas,
      strengths: result.strengths,
      growthAreas: result.growthAreas,
      signalPressure: result.signalPressure,
      signalSummary: signalSummary,
      profileTitle: narrative.title,
      profileNarrative: narrative.lede,
      nextTools: nextTools,
      offer: offer
    };

    if (titleEl) titleEl.textContent = narrative.title;
    if (ledeEl) ledeEl.textContent = narrative.lede;
    if (summaryEl) {
      summaryEl.innerHTML =
        '<p><strong>Overall score:</strong> ' + result.overallScore.toFixed(1) + '/5</p>' +
        '<p><strong>Strongest current base:</strong> ' + result.strengths[0].name + '</p>' +
        '<p style="margin-bottom:0;"><strong>Main leverage point:</strong> ' + result.growthAreas[0].name + '</p>';
    }
    if (signalSummaryEl) signalSummaryEl.textContent = signalSummary;
    if (strengthsEl) strengthsEl.innerHTML = renderAreaCards(result.strengths, 'strength');
    if (growthEl) growthEl.innerHTML = renderAreaCards(result.growthAreas, 'growth');
    if (nextToolsEl) {
      nextToolsEl.innerHTML = nextTools.map(function (tool) {
        return '<li><strong><a href="' + tool.href + '">' + tool.label + '</a>:</strong> ' + tool.copy + '</li>';
      }).join('');
    }
    if (leadOfferPreview) {
      leadOfferPreview.hidden = false;
      leadOfferPreview.textContent = 'Recommended EFI follow-up: ' + offer.code + ' (' + offer.discountPercent + '% off) for ' + offer.focus + '.';
    }

    var plan = buildEsqrActionPlan(lastResultsPayload);
    if (plan) {
      var plans = readActionPlans();
      plans.push(plan);
      writeActionPlans(plans);
      trackAssessmentEvent('practice_plan_generated', {
        plan_id: plan.plan_id,
        source_tool: 'esqr',
        module_id: 'esqr',
        source_context: plan.source_context,
        focus_key: plan.source_context.misconception_primary || 'general_reinforcement',
        cadence: plan.recheck.cadence,
        generated_at: plan.state.created_at
      });
      renderEsqrActionPlanCard(plan);
      renderEsqrReflectionPrompt(plan);
    }

    renderChart(result);
    writeJson(RESULT_KEY, lastResultsPayload);
    var history = readJson(HISTORY_KEY, []);
    history.push(lastResultsPayload);
    writeJson(HISTORY_KEY, history.slice(-MAX_HISTORY));
    renderHistory();
    clearDraft();
    if (resultsSection) resultsSection.hidden = false;
    if (resultsSection) resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setShareStatus('Result ready. Copy, export, save, or continue into the next tool.');
  }

  function renderResultsImageBlob() {
    if (!resultsSection || resultsSection.hidden) {
      return Promise.reject(new Error('Generate your profile first, then export.'));
    }
    return ensureCanvasEngine()
      .then(function () {
        return window.html2canvas(resultsSection, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false
        });
      })
      .then(function (canvas) {
        return new Promise(function (resolve) {
          canvas.toBlob(function (blob) {
            resolve({ blob: blob, canvas: canvas });
          }, 'image/png');
        });
      });
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function bindActions() {
    form.addEventListener('change', function () {
      updateProgress();
      saveDraft();
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!isComplete()) {
        if (errorMsg) {
          errorMsg.hidden = false;
          errorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      if (errorMsg) errorMsg.hidden = true;
      renderResults();
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        form.reset();
        clearDraft();
        localStorage.removeItem(RESULT_KEY);
        if (resultsSection) resultsSection.hidden = true;
        lastResultsPayload = null;
        updateProgress();
        setShareStatus('Questionnaire reset.');
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var text = buildSummaryText();
        if (!text) {
          setShareStatus('Generate your profile first, then copy the summary.');
          return;
        }
        copyText(text, function () {
          setShareStatus('Summary copied.');
        });
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        var text = buildSummaryText();
        if (!text) {
          setShareStatus('Generate your profile first, then export the summary.');
          return;
        }
        downloadText(text, 'efi-esqr-summary-' + new Date().toISOString().slice(0, 10) + '.txt');
        setShareStatus('Text summary exported.');
      });
    }

    if (downloadPngBtn) {
      downloadPngBtn.addEventListener('click', function () {
        renderResultsImageBlob().then(function (result) {
          if (!result.blob) throw new Error('Unable to render PNG export.');
          downloadBlob(result.blob, 'efi-esqr-results-' + new Date().toISOString().slice(0, 10) + '.png');
          setShareStatus('PNG downloaded.');
        }).catch(function (err) {
          setShareStatus(err.message || 'Unable to export PNG.');
        });
      });
    }

    if (downloadPdfBtn) {
      downloadPdfBtn.addEventListener('click', function () {
        renderResultsImageBlob().then(function (result) {
          return ensurePdfEngine().then(function () {
            var jsPDF = window.jspdf.jsPDF;
            var pdf = new jsPDF('p', 'mm', 'a4');
            var imageData = result.canvas.toDataURL('image/png');
            var pageWidth = 210;
            var pageHeight = 297;
            var margin = 10;
            var contentWidth = pageWidth - (margin * 2);
            var contentHeight = (result.canvas.height * contentWidth) / result.canvas.width;
            var y = margin;
            var heightLeft = contentHeight;

            pdf.addImage(imageData, 'PNG', margin, y, contentWidth, contentHeight);
            heightLeft -= (pageHeight - (margin * 2));

            while (heightLeft > 0) {
              y = heightLeft - contentHeight + margin;
              pdf.addPage();
              pdf.addImage(imageData, 'PNG', margin, y, contentWidth, contentHeight);
              heightLeft -= (pageHeight - (margin * 2));
            }

            pdf.save('efi-esqr-results-' + new Date().toISOString().slice(0, 10) + '.pdf');
            setShareStatus('PDF downloaded.');
          });
        }).catch(function (err) {
          setShareStatus(err.message || 'Unable to export PDF.');
        });
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', function () {
        var text = buildSummaryText();
        if (!text) {
          setShareStatus('Generate your profile first, then share.');
          return;
        }
        renderResultsImageBlob().then(function (result) {
          if (navigator.canShare && navigator.share && result.blob) {
            var file = new File([result.blob], 'efi-esqr-results.png', { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
              return navigator.share({
                title: 'EFI ESQ-R Interactive Intake',
                text: text,
                files: [file]
              }).then(function () {
                setShareStatus('Results shared successfully.');
              });
            }
          }
          copyText(text, function () {
            setShareStatus('File sharing is not available here. Summary copied instead.');
          });
        }).catch(function (err) {
          setShareStatus(err.message || 'Unable to share results.');
        });
      });
    }

    if (leadForm) {
      leadForm.addEventListener('submit', function (event) {
        event.preventDefault();
        var nameEl = document.getElementById('esqr-lead-name');
        var emailEl = document.getElementById('esqr-lead-email');
        var consentEl = document.getElementById('esqr-lead-consent');
        var submitBtn = leadForm.querySelector('button[type="submit"]');
        var email = emailEl ? String(emailEl.value || '').trim() : '';
        var name = nameEl ? String(nameEl.value || '').trim() : '';
        var consent = !!(consentEl && consentEl.checked);

        if (!lastResultsPayload) {
          setLeadStatus('Generate your ESQ-R result first so EFI can save the right profile.');
          return;
        }
        if (!email || email.indexOf('@') === -1) {
          setLeadStatus('Enter a valid email to save your result.');
          return;
        }
        if (!consent) {
          setLeadStatus('Consent is required to subscribe.');
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Saving...';
        }
        setLeadStatus('Saving...');

        fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name,
            email: email,
            consent: true,
            lead_type: 'esqr_results',
            source: 'esqr_assessment',
            offer_code: lastResultsPayload.offer.code,
            discount_percent: lastResultsPayload.offer.discountPercent,
            metadata: {
              overall_score: lastResultsPayload.overallScore,
              strengths: lastResultsPayload.strengths.map(function (area) { return area.id; }),
              growth_areas: lastResultsPayload.growthAreas.map(function (area) { return area.id; }),
              signal_pressure: lastResultsPayload.signalPressure
            }
          })
        }).then(function (res) {
          return res.json().then(function (body) {
            if (!res.ok || !body.ok) throw new Error((body && body.error) || 'Unable to save right now.');
            return body;
          });
        }).then(function (body) {
          var sentCode = body.offer_code || lastResultsPayload.offer.code;
          setLeadStatus('Saved. Check your inbox for your ' + sentCode + ' follow-up tools.');
          if (window.EFI && EFI.Analytics && EFI.Analytics.track) {
            EFI.Analytics.track('esqr_lead_capture', {
              source: 'esqr_assessment',
              offer_code: sentCode
            });
          }
        }).catch(function (err) {
          setLeadStatus(err.message || 'Unable to save right now.');
        }).finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save + Subscribe';
          }
        });
      });
    }
  }

  loadConfig().then(function () {
    renderQuestions();
    applyDraft();
    bindActions();
    updateProgress();
    renderHistory();
  }).catch(function (err) {
    if (errorMsg) {
      errorMsg.hidden = false;
      errorMsg.textContent = err.message || 'Unable to initialize the ESQ-R tool right now.';
    }
  });
})();
