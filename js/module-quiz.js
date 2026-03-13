/**
 * Module Quiz System
 * Saves module mastery test results into the learner account progress state.
 */

(function() {
  'use strict';

  var PASSING_SCORE = 80;
  var ACTION_PLAN_STORAGE_KEY = 'efi_action_plans_v1';
  var REFLECTION_STORAGE_KEY = 'efi_reflections_v1';
  var currentQuiz = null;
  var userAnswers = {};
  var quizData = null;
  var lastSavedResult = null;
  var statusMessage = '';

  function loadQuizData() {
    fetch('/data/module-quizzes.json')
      .then(function(response) {
        if (!response.ok) throw new Error('Failed to load quiz data');
        return response.json();
      })
      .then(function(data) {
        quizData = data;
        var moduleId = getModuleIdFromPage();
        if (moduleId && quizData.quizzes[moduleId]) {
          initializeQuiz(moduleId);
        }
      })
      .catch(function(error) {
        console.warn('[Module Quiz] Could not load quiz data:', error);
      });
  }

  function trackAssessmentEvent(eventName, properties) {
    if (window.EFI && window.EFI.Analytics && typeof window.EFI.Analytics.track === 'function') {
      window.EFI.Analytics.track(eventName, properties || {});
    }
  }

  function readActionPlans() {
    try {
      return JSON.parse(localStorage.getItem(ACTION_PLAN_STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function writeActionPlans(plans) {
    localStorage.setItem(ACTION_PLAN_STORAGE_KEY, JSON.stringify((plans || []).slice(-50)));
  }

  function getAdaptiveCadence(baselineCadence) {
    var plans = readActionPlans();
    var active = plans.filter(function(p) { return p && p.state && p.state.status !== 'expired'; });
    if (!active.length) return baselineCadence;
    var engaged = active.filter(function(p) {
      var s = p.state.status;
      return s === 'started' || s === 'checkin_completed' || s === 'completed';
    }).length;
    var rate = engaged / active.length;
    if (rate >= 0.8) return baselineCadence;
    if (rate >= 0.5) return baselineCadence === '7d' ? '72h' : baselineCadence;
    return '24h';
  }

  function updatePlanStatus(planId, status) {
    var plans = readActionPlans();
    var updated = false;
    plans.forEach(function(plan) {
      if (plan && plan.plan_id === planId) {
        plan.state = plan.state || {};
        plan.state.status = status;
        plan.state.updated_at = new Date().toISOString();
        updated = true;
      }
    });
    if (updated) writeActionPlans(plans);
  }

  function completePlanCheckin(planId, payload) {
    var plans = readActionPlans();
    var updated = false;
    var checkinAt = new Date().toISOString();
    plans.forEach(function(plan) {
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

  function getTopMisconceptionTag(missedQuestions, remediationMap) {
    if (!missedQuestions || !missedQuestions.length) {
      if (remediationMap.planning_without_transfer) return 'planning_without_transfer';
      var fallbackKeys = Object.keys(remediationMap || {});
      return fallbackKeys.length ? fallbackKeys[0] : '';
    }

    var counts = {};
    missedQuestions.forEach(function(question) {
      var key = question.misconception_primary || question.misconception_secondary;
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });

    var ranked = Object.keys(counts).sort(function(a, b) { return counts[b] - counts[a]; });
    return ranked.length ? ranked[0] : '';
  }

  function buildActionPlanPayload(summary) {
    var remediationMap = (quizData && quizData.remediation_map) ? quizData.remediation_map : {};
    var missedQuestions = currentQuiz.data.questions.filter(function(question) {
      return userAnswers[question.id] !== question.correct;
    });
    var focusKey = getTopMisconceptionTag(missedQuestions, remediationMap);
    var remediation = remediationMap[focusKey] || {
      title: summary.passed ? 'Retention and Transfer Reinforcement' : 'Concept Reinforcement Plan',
      summary: summary.passed
        ? 'You passed. Use this short plan to reinforce and transfer mastery into real tasks.'
        : 'Use this plan to reinforce weak concepts and retest with better transfer.',
      default_actions: [
        'Review one concept summary and convert it into one practical behavior for this week.',
        'Run one short recheck after implementation and log what changed.'
      ],
      module_targets: [{ module: currentQuiz.id, label: 'Review this module', href: currentQuiz.id + '.html' }]
    };

    var planId = 'plan_' + String(currentQuiz.id || 'module') + '_' + Date.now();
    var now = new Date();
    var cadence = getAdaptiveCadence(summary.passed ? '7d' : '72h');
    var dueMs = cadence === '24h' ? 24 * 60 * 60 * 1000 : (cadence === '72h' ? 72 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000);

    return {
      schema_version: '1.0',
      plan_id: planId,
      source_tool: 'module_quiz',
      source_context: {
        module_id: currentQuiz.id,
        question_ids: missedQuestions.map(function(question) { return question.id; }),
        misconception_primary: focusKey,
        misconception_secondary: missedQuestions.length && missedQuestions[0] ? missedQuestions[0].misconception_secondary || '' : ''
      },
      focus: {
        title: remediation.title,
        summary: remediation.summary,
        confidence: missedQuestions.length >= 3 ? 'high' : (missedQuestions.length >= 1 ? 'medium' : 'low')
      },
      actions: {
        today: [String((remediation.default_actions || [])[0] || 'Review one missed concept and rehearse one practical step.')],
        this_week: [String((remediation.default_actions || [])[1] || 'Complete one recheck and record what improved.')],
        evidence_prompt: 'What changed in your ability to execute this concept in a real task this week?'
      },
      recheck: {
        cadence: cadence,
        due_at: new Date(now.getTime() + dueMs).toISOString(),
        metric_type: 'score_delta',
        success_threshold: {
          type: 'numeric_or_state',
          value: summary.passed ? 0 : 1
        }
      },
      remediation_links: (remediation.module_targets || []).map(function(target) {
        return { label: target.label, href: target.href };
      }).slice(0, 3),
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

  function renderActionPlanCard(container, plan) {
    if (!container || !plan) return;

    var card = document.createElement('section');
    card.className = 'card';
    card.style.marginTop = 'var(--space-lg)';
    card.style.borderLeft = '4px solid var(--color-primary)';

    var dueLabel = plan.recheck && plan.recheck.due_at ? new Date(plan.recheck.due_at).toLocaleString() : 'upcoming';
    var linksHtml = (plan.remediation_links || []).map(function(link) {
      return '<li><a href="' + link.href + '">' + link.label + '</a></li>';
    }).join('');

    card.innerHTML =
      '<h5 style="margin-top:0;">Next Action Plan</h5>' +
      '<p style="margin-bottom:var(--space-sm);"><strong>' + plan.focus.title + '</strong></p>' +
      '<p style="margin-top:0;color:var(--color-text-light);">' + plan.focus.summary + '</p>' +
      '<p><strong>Do today:</strong> ' + (plan.actions.today[0] || '') + '</p>' +
      '<p><strong>Do this week:</strong> ' + (plan.actions.this_week[0] || '') + '</p>' +
      '<p><strong>Re-check:</strong> ' + dueLabel + ' (' + plan.recheck.cadence + ')</p>' +
      '<p style="color:var(--color-text-light);"><strong>Evidence prompt:</strong> ' + plan.actions.evidence_prompt + '</p>' +
      (linksHtml ? '<p style="margin-bottom:var(--space-xs);"><strong>Targeted review links</strong></p><ul class="checklist" style="margin-top:0;">' + linksHtml + '</ul>' : '');

    var buttonRow = document.createElement('div');
    buttonRow.className = 'button-group';
    buttonRow.style.marginTop = 'var(--space-md)';

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
    status.style.color = 'var(--color-text-light)';
    status.style.fontSize = '0.9rem';

    var checkinWrap = document.createElement('div');
    checkinWrap.style.marginTop = 'var(--space-sm)';
    checkinWrap.innerHTML =
      '<p style="margin:0 0 var(--space-xs) 0;"><strong>Quick check-in</strong> (captures transfer evidence)</p>' +
      '<div style="display:flex;gap:var(--space-sm);flex-wrap:wrap;align-items:end;">' +
      '<label style="display:flex;flex-direction:column;gap:4px;min-width:140px;">Self-rating (1-5)<select class="quiz-plan-checkin-rating"><option value="">Select</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></label>' +
      '<label style="display:flex;flex-direction:column;gap:4px;min-width:220px;">Observable metric<input class="quiz-plan-checkin-metric" type="text" placeholder="ex: started within 10 min 3/4 days"></label>' +
      '</div>';
    var checkinBtn = document.createElement('button');
    checkinBtn.type = 'button';
    checkinBtn.className = 'btn btn--secondary btn--sm';
    checkinBtn.style.marginTop = 'var(--space-xs)';
    checkinBtn.textContent = 'Complete Check-In';

    startBtn.addEventListener('click', function() {
      if (startBtn.disabled) return;
      startBtn.disabled = true;
      startBtn.textContent = 'Plan Started';
      status.textContent = 'Plan started. Recheck is scheduled and will appear in your learning flow.';
      updatePlanStatus(plan.plan_id, 'started');
      trackAssessmentEvent('practice_plan_started', {
        plan_id: plan.plan_id,
        source_tool: 'module_quiz',
        module_id: currentQuiz.id,
        started_at: new Date().toISOString()
      });
    });

    copyBtn.addEventListener('click', function() {
      var text = 'Focus: ' + plan.focus.title + '\n' +
        'Do today: ' + (plan.actions.today[0] || '') + '\n' +
        'Do this week: ' + (plan.actions.this_week[0] || '') + '\n' +
        'Re-check: ' + dueLabel;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
          status.textContent = 'Plan copied.';
        }).catch(function() {
          status.textContent = 'Copy unavailable on this browser.';
        });
      } else {
        status.textContent = 'Copy unavailable on this browser.';
      }
    });

    checkinBtn.addEventListener('click', function() {
      var ratingEl = checkinWrap.querySelector('.quiz-plan-checkin-rating');
      var metricEl = checkinWrap.querySelector('.quiz-plan-checkin-metric');
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
      status.textContent = 'Check-in saved. Keep iterating and recheck on schedule.';
      trackAssessmentEvent('practice_checkin_completed', {
        plan_id: plan.plan_id,
        source_tool: 'module_quiz',
        module_id: currentQuiz.id,
        self_rating: rating,
        metric_label: plan.recheck && plan.recheck.metric_type ? plan.recheck.metric_type : 'self_report',
        metric_value: metric,
        completed_at: checkinAt
      });
    });

    buttonRow.appendChild(startBtn);
    buttonRow.appendChild(copyBtn);
    card.appendChild(buttonRow);
    card.appendChild(checkinWrap);
    card.appendChild(checkinBtn);
    card.appendChild(status);
    container.appendChild(card);
  }


  function renderGroupedRemediation(container) {
    if (!container || !currentQuiz || !quizData || !quizData.remediation_map) return;

    var missedQuestions = currentQuiz.data.questions.filter(function(question) {
      return userAnswers[question.id] !== question.correct;
    });
    if (!missedQuestions.length) return;

    var remediationMap = quizData.remediation_map || {};
    var grouped = {};

    missedQuestions.forEach(function(question) {
      var key = question.misconception_primary || question.misconception_secondary;
      if (!key || !remediationMap[key]) return;
      if (!grouped[key]) {
        grouped[key] = {
          count: 0,
          sampleQuestion: question,
          remediation: remediationMap[key]
        };
      }
      grouped[key].count += 1;
    });

    var rankedKeys = Object.keys(grouped).sort(function(a, b) {
      return grouped[b].count - grouped[a].count;
    });
    if (!rankedKeys.length) return;

    var wrap = document.createElement('section');
    wrap.className = 'card';
    wrap.style.marginTop = 'var(--space-lg)';
    wrap.style.borderLeft = '4px solid var(--color-accent)';

    var html = '<h5 style="margin-top:0;">Targeted Remediation</h5>' +
      '<p style="color:var(--color-text-light);">Your missed items cluster around the patterns below. Review these first, then retake.</p>';

    rankedKeys.slice(0, 2).forEach(function(key) {
      var item = grouped[key];
      var rem = item.remediation;
      var actions = rem.default_actions || [];
      var links = (rem.module_targets || []).slice(0, 2).map(function(target) {
        return '<li><a href="' + target.href + '">' + target.label + '</a></li>';
      }).join('');

      html += '<div style="margin-top:var(--space-md);padding-top:var(--space-sm);border-top:1px solid var(--color-border);">' +
        '<p style="margin:0 0 var(--space-xs) 0;"><strong>' + rem.title + '</strong> <span style="color:var(--color-text-muted);font-size:0.9rem;">(' + item.count + ' missed)</span></p>' +
        '<p style="margin:0 0 var(--space-xs) 0;color:var(--color-text-light);">' + rem.summary + '</p>' +
        (actions[0] ? '<p style="margin:0 0 var(--space-xs) 0;"><strong>Try next:</strong> ' + actions[0] + '</p>' : '') +
        (links ? '<ul class="checklist" style="margin-top:0;">' + links + '</ul>' : '') +
      '</div>';
    });

    wrap.innerHTML = html;
    container.appendChild(wrap);
  }


  function saveReflectionEntry(entry) {
    var items = [];
    try { items = JSON.parse(localStorage.getItem(REFLECTION_STORAGE_KEY)) || []; } catch (e) { items = []; }
    items.push(entry);
    localStorage.setItem(REFLECTION_STORAGE_KEY, JSON.stringify(items.slice(-100)));
  }

  function buildReflectionPrefill(plan) {
    if (!plan) return '';
    var lines = [];
    var focusTitle = plan.focus && plan.focus.title ? plan.focus.title : '';
    var todayAction = plan.actions && plan.actions.today && plan.actions.today[0] ? plan.actions.today[0] : '';
    var evidencePrompt = plan.actions && plan.actions.evidence_prompt ? plan.actions.evidence_prompt : '';
    var checkins = plan.state && Array.isArray(plan.state.checkins) ? plan.state.checkins : [];
    var lastCheckin = checkins.length > 0 ? checkins[checkins.length - 1] : null;

    if (focusTitle) { lines.push('Testing: ' + focusTitle); lines.push(''); }
    if (lastCheckin && lastCheckin.metric_value) {
      lines.push('Yesterday: ' + lastCheckin.metric_value);
    } else {
      lines.push('Yesterday: first attempt');
    }
    if (todayAction) { lines.push("Today I\u2019ll: " + todayAction); }
    if (evidencePrompt) { lines.push("I\u2019ll know it worked when: " + evidencePrompt); }
    return lines.join('\n');
  }

  function renderReflectionPrompt(container, context) {
    if (!container || !context) return;
    var plan = context.plan || null;
    if (!plan && context.plan_id) {
      var allPlans = readActionPlans();
      for (var i = 0; i < allPlans.length; i++) {
        if (allPlans[i] && allPlans[i].plan_id === context.plan_id) { plan = allPlans[i]; break; }
      }
    }
    var prefill = buildReflectionPrefill(plan);

    var card = document.createElement('section');
    card.className = 'card';
    card.style.marginTop = 'var(--space-md)';
    card.style.borderLeft = '4px solid var(--color-accent)';

    var html =
      '<h5 style="margin-top:0;">48-Hour Reflection Prompt</h5>' +
      '<p style="color:var(--color-text-light);">Edit or replace the starter text below, then save your commitment.</p>' +
      '<textarea id="quiz-reflection-input" rows="5" style="width:100%;padding:var(--space-sm);border:1px solid var(--color-border);border-radius:var(--border-radius);"></textarea>' +
      '<div class="button-group" style="margin-top:var(--space-sm);">' +
      '<button type="button" id="quiz-reflection-save" class="btn btn--secondary btn--sm">Save Reflection</button>' +
      '</div>' +
      '<p id="quiz-reflection-status" style="margin-top:var(--space-xs);font-size:0.9rem;color:var(--color-text-light);"></p>';
    card.innerHTML = html;
    container.appendChild(card);

    var input = card.querySelector('#quiz-reflection-input');
    if (input && prefill) { input.value = prefill; }
    var saveBtn = card.querySelector('#quiz-reflection-save');
    var status = card.querySelector('#quiz-reflection-status');
    if (!input || !saveBtn || !status) return;

    saveBtn.addEventListener('click', function () {
      var text = String(input.value || '').trim();
      if (!text) {
        status.textContent = 'Write one testable action before saving.';
        return;
      }
      var payload = {
        id: 'refl_' + Date.now(),
        source_tool: context.source_tool,
        plan_id: context.plan_id,
        module_id: context.module_id || '',
        reflection_48h: text,
        at: new Date().toISOString()
      };
      saveReflectionEntry(payload);
      trackAssessmentEvent('behavior_transfer_logged', {
        plan_id: context.plan_id,
        source_tool: context.source_tool,
        module_id: context.module_id || '',
        transfer_type: 'self_report',
        transfer_value: text,
        logged_at: payload.at
      });
      status.textContent = 'Reflection saved.';
    });
  }

  function getModuleIdFromPage() {
    var pathname = window.location.pathname;
    var match = pathname.match(/(module-\d+|module-[a-z-]+)/);
    if (match) return match[1];

    var container = document.getElementById('module-quiz');
    if (container && container.getAttribute('data-module-id')) {
      return container.getAttribute('data-module-id');
    }

    return null;
  }

  function getModuleNumber(moduleId) {
    var match = String(moduleId || '').match(/module-(\d+)/);
    return match ? match[1] : String(moduleId || '');
  }

  function isLoggedIn() {
    return !!(window.EFI && window.EFI.Auth && typeof window.EFI.Auth.isLoggedIn === 'function' && window.EFI.Auth.isLoggedIn());
  }

  function hydrateSavedAssessment(moduleId) {
    lastSavedResult = null;
    statusMessage = '';
    if (!window.EFI || !window.EFI.Auth || typeof window.EFI.Auth.getModuleAssessment !== 'function') return;
    lastSavedResult = window.EFI.Auth.getModuleAssessment(getModuleNumber(moduleId));
  }

  function initializeQuiz(moduleId) {
    if (!quizData || !quizData.quizzes[moduleId]) return;

    currentQuiz = {
      id: moduleId,
      data: quizData.quizzes[moduleId],
      currentQuestion: 0
    };

    hydrateSavedAssessment(moduleId);
    renderQuizInterface();
    renderQuestion(0);
  }

  function renderSavedStatus(container) {
    if (!container) return;

    var box = document.createElement('div');
    box.id = 'quiz-save-status';
    box.style.marginTop = 'var(--space-md)';
    box.style.padding = 'var(--space-md)';
    box.style.borderRadius = 'var(--border-radius)';
    box.style.background = 'var(--color-bg-alt)';
    box.style.fontSize = '0.92rem';
    box.style.color = 'var(--color-text-light)';

    var message = '';
    if (lastSavedResult && typeof lastSavedResult.score === 'number') {
      var completedAt = lastSavedResult.completedAt ? new Date(lastSavedResult.completedAt).toLocaleString() : 'recently';
      message = (lastSavedResult.passed ? 'Saved pass' : 'Saved attempt') +
        ': ' + lastSavedResult.score + '% recorded on ' + completedAt + '.';
    } else if (isLoggedIn()) {
      message = 'Finish the test to save your score into this account and update course progress.';
    } else {
      message = 'Log in before finishing if you want this module result saved to your dashboard.';
    }

    if (statusMessage) {
      message += ' ' + statusMessage;
    }

    box.textContent = message;
    container.appendChild(box);
  }

  function updateSavedStatus() {
    var container = document.getElementById('module-quiz');
    if (!container) return;
    var existing = document.getElementById('quiz-save-status');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    renderSavedStatus(container);
  }

  function renderQuizInterface() {
    var container = document.getElementById('module-quiz');
    if (!container) return;

    container.innerHTML = '';

    var header = document.createElement('div');
    header.className = 'module-quiz__header';
    header.innerHTML = '<h3 style="margin-bottom:var(--space-sm);">Module Mastery Test</h3>' +
      '<p style="margin:0;color:var(--color-text-light);font-size:0.9rem;">' +
      'Finish this assessment to check for module mastery. Scores of ' + PASSING_SCORE + '% or higher ' +
      'save as passed progress when you are logged in.' +
      '</p>';
    container.appendChild(header);
    renderSavedStatus(container);

    var questionsWrapper = document.createElement('div');
    questionsWrapper.className = 'module-quiz__questions';
    questionsWrapper.id = 'quiz-questions';
    container.appendChild(questionsWrapper);

    var controls = document.createElement('div');
    controls.className = 'module-quiz__controls';
    controls.style.marginTop = 'var(--space-xl)';
    controls.style.display = 'flex';
    controls.style.gap = 'var(--space-md)';
    controls.style.justifyContent = 'space-between';
    controls.style.flexWrap = 'wrap';

    var prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.id = 'quiz-prev-btn';
    prevBtn.className = 'btn btn--secondary btn--sm';
    prevBtn.textContent = '← Previous';
    prevBtn.addEventListener('click', function() { previousQuestion(); });
    controls.appendChild(prevBtn);

    var progress = document.createElement('span');
    progress.id = 'quiz-progress';
    progress.style.alignSelf = 'center';
    progress.style.color = 'var(--color-text-muted)';
    progress.style.fontSize = '0.9rem';
    controls.appendChild(progress);

    var nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.id = 'quiz-next-btn';
    nextBtn.className = 'btn btn--primary btn--sm';
    nextBtn.textContent = 'Next →';
    nextBtn.addEventListener('click', function() { nextQuestion(); });
    controls.appendChild(nextBtn);

    container.appendChild(controls);

    var resultsSection = document.createElement('div');
    resultsSection.id = 'quiz-results';
    resultsSection.style.display = 'none';
    resultsSection.className = 'module-quiz__results';
    resultsSection.style.marginTop = 'var(--space-xl)';
    resultsSection.style.padding = 'var(--space-lg)';
    resultsSection.style.background = 'var(--color-bg-alt)';
    resultsSection.style.borderRadius = 'var(--border-radius)';
    container.appendChild(resultsSection);
  }

  function renderQuestion(index) {
    if (!currentQuiz || !currentQuiz.data.questions[index]) return;

    var question = currentQuiz.data.questions[index];
    var container = document.getElementById('quiz-questions');
    if (!container) return;

    container.innerHTML = '';

    var questionDiv = document.createElement('div');
    questionDiv.className = 'module-quiz__question';
    questionDiv.style.marginBottom = 'var(--space-xl)';

    var questionText = document.createElement('p');
    questionText.style.fontSize = '1.05rem';
    questionText.style.fontWeight = '600';
    questionText.style.marginBottom = 'var(--space-lg)';
    questionText.textContent = (index + 1) + '. ' + question.question;
    questionDiv.appendChild(questionText);

    var optionsDiv = document.createElement('div');
    optionsDiv.className = 'module-quiz__options';
    optionsDiv.style.display = 'flex';
    optionsDiv.style.flexDirection = 'column';
    optionsDiv.style.gap = 'var(--space-sm)';

    question.options.forEach(function(option, optionIndex) {
      var label = document.createElement('label');
      label.style.display = 'flex';
      label.style.gap = 'var(--space-sm)';
      label.style.padding = 'var(--space-sm) var(--space-md)';
      label.style.background = userAnswers[question.id] === optionIndex ? 'var(--color-accent-light)' : 'transparent';
      label.style.borderRadius = 'var(--border-radius)';
      label.style.cursor = 'pointer';
      label.style.transition = 'background 0.2s ease';

      var input = document.createElement('input');
      input.type = 'radio';
      input.name = 'question-' + question.id;
      input.value = optionIndex;
      input.checked = userAnswers[question.id] === optionIndex;
      input.addEventListener('change', function() {
        recordAnswer(question.id, optionIndex);
        Array.from(optionsDiv.querySelectorAll('label')).forEach(function(lbl, idx) {
          lbl.style.background = idx === optionIndex ? 'var(--color-accent-light)' : 'transparent';
        });
      });
      label.appendChild(input);

      var span = document.createElement('span');
      span.textContent = option;
      label.appendChild(span);

      optionsDiv.appendChild(label);
    });

    questionDiv.appendChild(optionsDiv);

    if (userAnswers[question.id] !== undefined) {
      var explanationDiv = document.createElement('div');
      explanationDiv.className = 'module-quiz__explanation';
      explanationDiv.style.marginTop = 'var(--space-lg)';
      explanationDiv.style.padding = 'var(--space-md)';
      explanationDiv.style.background = userAnswers[question.id] === question.correct ?
        'rgba(76, 175, 80, 0.1)' : 'rgba(33, 150, 243, 0.1)';
      explanationDiv.style.borderLeft = '4px solid ' +
        (userAnswers[question.id] === question.correct ? '#4CAF50' : '#2196F3');
      explanationDiv.style.borderRadius = 'var(--border-radius)';

      var isCorrect = userAnswers[question.id] === question.correct;
      var label = document.createElement('strong');
      label.style.display = 'block';
      label.style.marginBottom = 'var(--space-xs)';
      label.textContent = isCorrect ? '✓ Correct!' : 'Learn More:';
      label.style.color = isCorrect ? '#4CAF50' : '#2196F3';
      explanationDiv.appendChild(label);

      var text = document.createElement('p');
      text.style.margin = '0';
      text.style.fontSize = '0.95rem';
      text.style.lineHeight = '1.5';
      text.textContent = question.explanation;
      explanationDiv.appendChild(text);

      questionDiv.appendChild(explanationDiv);
    }

    container.appendChild(questionDiv);
    updateControls();
    updateProgress();
  }

  function recordAnswer(questionId, optionIndex) {
    userAnswers[questionId] = optionIndex;
  }

  function nextQuestion() {
    if (!currentQuiz) return;
    if (currentQuiz.currentQuestion < currentQuiz.data.questions.length - 1) {
      currentQuiz.currentQuestion++;
      renderQuestion(currentQuiz.currentQuestion);
    } else {
      showResults();
    }
  }

  function previousQuestion() {
    if (!currentQuiz) return;
    if (currentQuiz.currentQuestion > 0) {
      currentQuiz.currentQuestion--;
      renderQuestion(currentQuiz.currentQuestion);
    }
  }

  function updateControls() {
    if (!currentQuiz) return;
    var prevBtn = document.getElementById('quiz-prev-btn');
    var nextBtn = document.getElementById('quiz-next-btn');

    if (prevBtn) prevBtn.disabled = currentQuiz.currentQuestion === 0;
    if (nextBtn) {
      nextBtn.textContent = currentQuiz.currentQuestion === currentQuiz.data.questions.length - 1
        ? 'Show Results'
        : 'Next →';
    }
  }

  function updateProgress() {
    if (!currentQuiz) return;
    var progress = document.getElementById('quiz-progress');
    if (progress) {
      progress.textContent = (currentQuiz.currentQuestion + 1) + ' of ' + currentQuiz.data.questions.length;
    }
  }

  function persistResults(result) {
    statusMessage = '';
    if (!isLoggedIn()) {
      updateSavedStatus();
      return;
    }
    if (!window.EFI || !window.EFI.Auth || typeof window.EFI.Auth.recordModuleAssessment !== 'function') {
      updateSavedStatus();
      return;
    }

    var saved = window.EFI.Auth.recordModuleAssessment(getModuleNumber(result.moduleId), result);
    if (saved && saved.ok) {
      lastSavedResult = saved.assessment;
      statusMessage = result.passed
        ? 'Dashboard progress has been updated.'
        : 'Your dashboard now reflects this saved attempt.';
    } else if (saved && saved.error) {
      statusMessage = saved.error;
    }
    updateSavedStatus();
  }

  function showResults() {
    if (!currentQuiz) return;

    var correct = 0;
    currentQuiz.data.questions.forEach(function(question) {
      if (userAnswers[question.id] === question.correct) {
        correct++;
      }
    });

    var total = currentQuiz.data.questions.length;
    var percentage = Math.round((correct / total) * 100);
    var passed = percentage >= PASSING_SCORE;

    persistResults({
      moduleId: currentQuiz.id,
      correct: correct,
      total: total,
      score: percentage,
      passed: passed
    });

    var resultsDiv = document.getElementById('quiz-results');
    if (!resultsDiv) return;

    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = '';

    var title = document.createElement('h4');
    title.style.marginBottom = 'var(--space-md)';
    title.textContent = 'Test Results';
    resultsDiv.appendChild(title);

    var scoreDiv = document.createElement('div');
    scoreDiv.style.fontSize = '1.1rem';
    scoreDiv.style.marginBottom = 'var(--space-md)';
    scoreDiv.style.lineHeight = '1.8';
    scoreDiv.innerHTML = '<strong>Score:</strong> ' + correct + ' of ' + total + ' (' + percentage + '%)<br>' +
      '<strong>Status:</strong> ' + (passed ? 'Passed' : 'Needs Retake') + '<br>' +
      '<strong>Feedback:</strong> ' + getResultsMessage(percentage);
    resultsDiv.appendChild(scoreDiv);

    var note = document.createElement('p');
    note.style.fontSize = '0.9rem';
    note.style.color = 'var(--color-text-light)';
    note.style.marginBottom = 'var(--space-md)';
    if (isLoggedIn()) {
      note.textContent = passed
        ? 'This passing score was saved to your account and now counts toward course completion.'
        : 'This attempt was saved to your account. Retake the test until you reach the passing score.';
    } else {
      note.textContent = 'This result was not saved because you are not logged in. Log in and retake the test to store progress.';
    }
    resultsDiv.appendChild(note);

    renderGroupedRemediation(resultsDiv);

    var plan = buildActionPlanPayload({
      moduleId: currentQuiz.id,
      correct: correct,
      total: total,
      score: percentage,
      passed: passed
    });
    var plans = readActionPlans();
    plans.push(plan);
    writeActionPlans(plans);
    trackAssessmentEvent('practice_plan_generated', {
      plan_id: plan.plan_id,
      source_tool: 'module_quiz',
      module_id: currentQuiz.id,
      source_context: plan.source_context,
      focus_key: plan.source_context.misconception_primary || 'general_reinforcement',
      cadence: plan.recheck.cadence,
      generated_at: plan.state.created_at
    });
    renderActionPlanCard(resultsDiv, plan);
    renderReflectionPrompt(resultsDiv, {
      source_tool: 'module_quiz',
      plan_id: plan.plan_id,
      module_id: currentQuiz.id
    });

    var resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'btn btn--secondary btn--sm';
    resetBtn.textContent = 'Retake Test';
    resetBtn.addEventListener('click', function() { resetQuiz(); });
    resultsDiv.appendChild(resetBtn);

    var controls = document.querySelector('.module-quiz__controls');
    if (controls) controls.style.display = 'none';

    document.getElementById('quiz-questions').style.display = 'none';
  }

  function getResultsMessage(percentage) {
    if (percentage === 100) return 'Perfect! You have mastered this module.';
    if (percentage >= PASSING_SCORE) return 'Great work! You understand the key concepts and have passed this module test.';
    if (percentage >= 60) return 'Good effort. Review the explanations above to solidify your understanding.';
    return 'Keep studying. Read through the module again and retake the test.';
  }

  function resetQuiz() {
    userAnswers = {};
    currentQuiz.currentQuestion = 0;
    document.getElementById('quiz-results').style.display = 'none';
    document.getElementById('quiz-questions').style.display = 'block';
    document.querySelector('.module-quiz__controls').style.display = 'flex';
    renderQuestion(0);
  }

  document.addEventListener('DOMContentLoaded', function() {
    var container = document.getElementById('module-quiz');
    if (container) {
      loadQuizData();
    }
  });

  window.ModuleQuiz = {
    getScore: function() {
      if (!currentQuiz) return null;
      var correct = 0;
      currentQuiz.data.questions.forEach(function(question) {
        if (userAnswers[question.id] === question.correct) {
          correct++;
        }
      });
      return { correct: correct, total: currentQuiz.data.questions.length };
    },
    getPassingScore: function() {
      return PASSING_SCORE;
    }
  };
})();
