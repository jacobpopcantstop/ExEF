/* ============================================
   ESQ-R Interactive Assessment
   Config-driven scoring, chart, and recommendations
   ============================================ */

(function () {
  'use strict';

  var form = document.getElementById('esqr-form');
  if (!form) return;

  var progressFill = document.getElementById('progress-fill');
  var progressText = document.getElementById('progress-text');
  var errorMsg = document.getElementById('esqr-error');
  var resultsSection = document.getElementById('esqr-results');
  var downloadPngBtn = document.getElementById('esqr-download-png-btn');
  var downloadPdfBtn = document.getElementById('esqr-download-pdf-btn');
  var shareBtn = document.getElementById('esqr-share-btn');
  var shareStatus = document.getElementById('esqr-share-status');
  var historyEl = document.getElementById('esqr-history');
  var leadForm = document.getElementById('esqr-lead-form');
  var leadStatus = document.getElementById('esqr-lead-status');
  var leadOfferPreview = document.getElementById('esqr-offer-preview');

  var HISTORY_KEY = 'efi_esqr_history';
  var RESULT_KEY = 'efi_esqr_results';
  var SKILLS = [];
  var STRATEGIES = {};
  var totalQuestions = 36;
  var lastResultsPayload = null;
  var ACTION_PLAN_STORAGE_KEY = 'efi_action_plans_v1';
  var REFLECTION_STORAGE_KEY = 'efi_reflections_v1';

  function setShareStatus(message) {
    if (shareStatus) shareStatus.textContent = message;
  }

  function setLeadStatus(message) {
    if (leadStatus) leadStatus.textContent = message;
  }

  function deriveOffer(bottomSkills) {
    var primary = bottomSkills && bottomSkills.length ? String(bottomSkills[0].id || '') : '';
    var bySkill = {
      'task-initiation': { code: 'START40', focus: 'starting tasks consistently' },
      'planning': { code: 'PLAN40', focus: 'planning and sequencing' },
      'time-management': { code: 'TIME40', focus: 'time management systems' },
      'organization': { code: 'ORDER40', focus: 'organization workflows' },
      'sustained-attention': { code: 'FOCUS40', focus: 'attention support' },
      'emotional-control': { code: 'CALM40', focus: 'emotional regulation under load' },
      'goal-directed-persistence': { code: 'MOMENTUM40', focus: 'follow-through and consistency' }
    };
    var selected = bySkill[primary] || { code: 'ESQR40', focus: 'executive function coaching support' };
    return {
      code: selected.code,
      focus: selected.focus,
      discountPercent: 40
    };
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
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.defer = true;
      s.setAttribute('data-src', src);
      s.onload = function () {
        s.setAttribute('data-loaded', '1');
        resolve();
      };
      s.onerror = function () { reject(new Error('Failed loading ' + src)); };
      document.head.appendChild(s);
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
        if (!res.ok) throw new Error('Unable to load ESQ-R config.');
        return res.json();
      })
      .then(function (cfg) {
        SKILLS = Array.isArray(cfg.skills) ? cfg.skills : [];
        STRATEGIES = cfg.strategies && typeof cfg.strategies === 'object' ? cfg.strategies : {};
        if (!SKILLS.length) throw new Error('ESQ-R skills configuration missing.');
      });
  }

  function renderHistory() {
    if (!historyEl) return;
    var history = [];
    try { history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch (e) { history = []; }
    if (!history.length) {
      historyEl.style.display = 'none';
      return;
    }
    var html = '<h4 style="margin-bottom:var(--space-sm);">Recent ESQ-R Snapshots</h4><ul class="checklist">';
    history.slice(-5).reverse().forEach(function (entry) {
      html += '<li>' + new Date(entry.generatedAt).toLocaleString() + ' &mdash; Top strengths: ' + entry.strengths.map(function (s) { return s.name; }).join(', ') + '</li>';
    });
    html += '</ul>';
    historyEl.innerHTML = html;
    historyEl.style.display = 'block';
  }

  function updateProgress() {
    var answered = form.querySelectorAll('input[type="radio"]:checked').length;
    var pct = Math.round((answered / totalQuestions) * 100);
    progressFill.style.width = pct + '%';
    progressText.textContent = answered + ' of ' + totalQuestions + ' answered';
    var bar = progressFill.closest('.esqr-progress');
    if (bar) bar.setAttribute('aria-valuenow', answered);
  }

  function getScores() {
    var scores = {};
    SKILLS.forEach(function (skill) {
      var sum = 0;
      var count = 0;
      skill.questions.forEach(function (qName) {
        var checked = form.querySelector('input[name="' + qName + '"]:checked');
        if (checked) {
          sum += parseInt(checked.value, 10);
          count++;
        }
      });
      scores[skill.id] = count > 0 ? +(sum / count).toFixed(1) : 0;
    });
    return scores;
  }

  function isComplete() {
    for (var i = 1; i <= totalQuestions; i++) {
      if (!form.querySelector('input[name="q' + i + '"]:checked')) return false;
    }
    return true;
  }

  function renderChart(scores) {
    var container = document.getElementById('esqr-chart');
    container.innerHTML = '';

    var maxScore = 7;
    var thinkingSkills = SKILLS.filter(function (s) { return s.domain === 'thinking'; })
      .sort(function (a, b) { return scores[b.id] - scores[a.id]; });
    var doingSkills = SKILLS.filter(function (s) { return s.domain === 'doing'; })
      .sort(function (a, b) { return scores[b.id] - scores[a.id]; });

    var html = '<div class="esqr-bars">';

    html += '<div class="esqr-domain-group"><div class="esqr-domain-label esqr-domain-label--thinking">Thinking</div><div class="esqr-domain-bars">';
    thinkingSkills.forEach(function (skill) {
      var score = scores[skill.id];
      var pct = (score / maxScore) * 100;
      html += '<div class="esqr-bar-group"><div class="esqr-bar-wrapper">';
      html += '<div class="esqr-bar esqr-bar--thinking" style="height:' + pct + '%;" title="' + skill.name + ': ' + score + '/7">';
      html += '<span class="esqr-bar__value">' + score + '</span></div></div>';
      html += '<div class="esqr-bar__label">' + skill.name + '</div></div>';
    });
    html += '</div></div>';

    html += '<div class="esqr-domain-group"><div class="esqr-domain-label esqr-domain-label--doing">Doing</div><div class="esqr-domain-bars">';
    doingSkills.forEach(function (skill) {
      var score = scores[skill.id];
      var pct = (score / maxScore) * 100;
      html += '<div class="esqr-bar-group"><div class="esqr-bar-wrapper">';
      html += '<div class="esqr-bar esqr-bar--doing" style="height:' + pct + '%;" title="' + skill.name + ': ' + score + '/7">';
      html += '<span class="esqr-bar__value">' + score + '</span></div></div>';
      html += '<div class="esqr-bar__label">' + skill.name + '</div></div>';
    });
    html += '</div></div></div>';

    html += '<div class="esqr-chart-legend">';
    html += '<span class="esqr-legend-item"><span class="esqr-legend-dot" style="background:var(--color-primary-light);"></span> Thinking</span>';
    html += '<span class="esqr-legend-item"><span class="esqr-legend-dot" style="background:var(--color-accent);"></span> Doing</span>';
    html += '</div>';

    container.innerHTML = html;
  }

  function renderResults(scores) {
    var sorted = SKILLS.map(function (skill) {
      return { id: skill.id, name: skill.name, domain: skill.domain, score: scores[skill.id] };
    }).sort(function (a, b) { return b.score - a.score; });

    var top3 = sorted.slice(0, 3);
    var bottom3 = sorted.slice(-3).reverse();

    var strengthsHtml = '';
    top3.forEach(function (s) {
      strengthsHtml += '<div class="esqr-result-card esqr-result-card--strength">';
      strengthsHtml += '<div class="esqr-result-card__header"><strong>' + s.name + '</strong><span class="esqr-result-card__score">' + s.score + '/7</span></div>';
      strengthsHtml += '<span class="esqr-result-card__domain">' + s.domain + '</span></div>';
    });
    document.getElementById('strengths-list').innerHTML = strengthsHtml;

    var weakHtml = '';
    bottom3.forEach(function (s) {
      var strat = STRATEGIES[s.id] || { summary: 'No strategy profile available.', strategies: [] };
      weakHtml += '<div class="esqr-result-card esqr-result-card--weakness">';
      weakHtml += '<div class="esqr-result-card__header"><strong>' + s.name + '</strong><span class="esqr-result-card__score">' + s.score + '/7</span></div>';
      weakHtml += '<span class="esqr-result-card__domain">' + s.domain + '</span>';
      weakHtml += '<p class="esqr-result-card__summary">' + strat.summary + '</p><h5>Recommended Strategies:</h5><ul class="esqr-result-card__strategies">';
      (strat.strategies || []).forEach(function (str) { weakHtml += '<li>' + str + '</li>'; });
      weakHtml += '</ul></div>';
    });
    document.getElementById('weaknesses-list').innerHTML = weakHtml;

    var thinkingSkills = SKILLS.filter(function (s) { return s.domain === 'thinking'; });
    var doingSkills = SKILLS.filter(function (s) { return s.domain === 'doing'; });
    var thinkingAvg = thinkingSkills.reduce(function (sum, s) { return sum + scores[s.id]; }, 0) / thinkingSkills.length;
    var doingAvg = doingSkills.reduce(function (sum, s) { return sum + scores[s.id]; }, 0) / doingSkills.length;

    document.getElementById('thinking-avg').textContent = thinkingAvg.toFixed(1) + ' / 7';
    document.getElementById('doing-avg').textContent = doingAvg.toFixed(1) + ' / 7';

    lastResultsPayload = {
      generatedAt: new Date().toISOString(),
      strengths: top3,
      growthAreas: bottom3,
      domainAverages: {
        thinking: Number(thinkingAvg.toFixed(2)),
        doing: Number(doingAvg.toFixed(2))
      },
      allScores: scores,
      offer: deriveOffer(bottom3)
    };

    if (leadOfferPreview) {
      leadOfferPreview.hidden = false;
      leadOfferPreview.textContent = 'Recommended offer: ' + lastResultsPayload.offer.code + ' (' + lastResultsPayload.offer.discountPercent + '% off) for ' + lastResultsPayload.offer.focus + '. Enter your email below and we will send the details.';
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

    localStorage.setItem(RESULT_KEY, JSON.stringify(lastResultsPayload));
    var history = [];
    try { history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch (e) { history = []; }
    history.push(lastResultsPayload);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-20)));
    renderHistory();
  }

  function buildShareText() {
    if (!lastResultsPayload) return '';
    var strengths = lastResultsPayload.strengths.map(function (s) { return s.name + ' (' + s.score + '/7)'; }).join(', ');
    var growth = lastResultsPayload.growthAreas.map(function (s) { return s.name + ' (' + s.score + '/7)'; }).join(', ');
    return 'My EFI ESQ-R summary\nStrengths: ' + strengths + '\nGrowth areas: ' + growth + '\nThinking avg: ' + lastResultsPayload.domainAverages.thinking + '/7\nDoing avg: ' + lastResultsPayload.domainAverages.doing + '/7';
  }

  function renderResultsImageBlob() {
    if (!resultsSection || resultsSection.hidden) {
      return Promise.reject(new Error('Generate your profile first, then export.'));
    }
    return ensureCanvasEngine().then(function () {
      return window.html2canvas(resultsSection, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });
    }).then(function (canvas) {
      return new Promise(function (resolve) {
        canvas.toBlob(function (blob) {
          resolve({ blob: blob, canvas: canvas });
        }, 'image/png');
      });
    });
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function bindActions() {
    form.addEventListener('change', updateProgress);

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
            var pageWidth = 210;
            var pageHeight = 297;
            var margin = 10;
            var contentWidth = pageWidth - (margin * 2);
            var contentHeight = (result.canvas.height * contentWidth) / result.canvas.width;
            var pdf = new jsPDF('p', 'mm', 'a4');
            var imageData = result.canvas.toDataURL('image/png');
            var y = margin;
            var heightLeft = contentHeight;

            pdf.addImage(imageData, 'PNG', margin, y, contentWidth, contentHeight);
            heightLeft -= (pageHeight - margin * 2);

            while (heightLeft > 0) {
              y = heightLeft - contentHeight + margin;
              pdf.addPage();
              pdf.addImage(imageData, 'PNG', margin, y, contentWidth, contentHeight);
              heightLeft -= (pageHeight - margin * 2);
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
        var text = buildShareText();
        if (!text) {
          setShareStatus('Generate your profile first, then share.');
          return;
        }

        renderResultsImageBlob().then(function (result) {
          if (navigator.canShare && navigator.share && result.blob) {
            var file = new File([result.blob], 'efi-esqr-results.png', { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
              return navigator.share({
                title: 'My EFI ESQ-R Results',
                text: text,
                files: [file]
              }).then(function () {
                setShareStatus('Results snapshot shared successfully.');
                return;
              });
            }
          }

          if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text).then(function () {
              setShareStatus('Device does not support file sharing here. Summary copied to clipboard instead.');
            });
          }
          throw new Error('Sharing is not supported on this browser.');
        }).catch(function (err) {
          setShareStatus(err.message || 'Unable to share results.');
        });
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!isComplete()) {
        errorMsg.hidden = false;
        errorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      errorMsg.hidden = true;
      var scores = getScores();
      renderChart(scores);
      renderResults(scores);
      resultsSection.hidden = false;
      resultsSection.scrollIntoView({ behavior: 'smooth' });
    });

    if (leadForm) {
      leadForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var nameEl = document.getElementById('esqr-lead-name');
        var emailEl = document.getElementById('esqr-lead-email');
        var consentEl = document.getElementById('esqr-lead-consent');
        var submitBtn = leadForm.querySelector('button[type="submit"]');
        var email = emailEl ? String(emailEl.value || '').trim() : '';
        var name = nameEl ? String(nameEl.value || '').trim() : '';
        var consent = !!(consentEl && consentEl.checked);

        if (!lastResultsPayload) {
          setLeadStatus('Generate your ESQ-R profile first so we can save the right result set.');
          return;
        }
        if (!email || email.indexOf('@') === -1) {
          setLeadStatus('Enter a valid email to save your results.');
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
              strengths: lastResultsPayload.strengths.map(function (s) { return s.id; }),
              growth_areas: lastResultsPayload.growthAreas.map(function (s) { return s.id; }),
              thinking_avg: lastResultsPayload.domainAverages.thinking,
              doing_avg: lastResultsPayload.domainAverages.doing
            }
          })
        }).then(function (res) {
          return res.json().then(function (body) {
            if (!res.ok || !body.ok) throw new Error((body && body.error) || 'Unable to save right now.');
            return body;
          });
        }).then(function (body) {
          var sentCode = body.offer_code || lastResultsPayload.offer.code;
          setLeadStatus('Saved. Check your inbox for your ' + sentCode + ' discount code and next-step tools.');
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

  loadConfig()
    .then(function () {
      bindActions();
      updateProgress();
      renderHistory();
    })
    .catch(function (err) {
      if (errorMsg) {
        errorMsg.hidden = false;
        errorMsg.textContent = err.message || 'Unable to initialize ESQ-R right now.';
      }
    });
})();
