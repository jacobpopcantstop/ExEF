(function () {
  'use strict';

  window.EFI = window.EFI || {};
  if (typeof window.EFI.registerMainModule !== 'function') {
    window.EFI.registerMainModule = function (fn) {
      window.EFI._pendingMainModules = window.EFI._pendingMainModules || [];
      window.EFI._pendingMainModules.push(fn);
    };
  }

  window.EFI.registerMainModule(function (shared) {
    var ACTION_PLAN_KEY = 'efi_action_plans_v1';

    function track(eventName, properties) {
      if (window.EFI && window.EFI.Analytics && typeof window.EFI.Analytics.track === 'function') {
        window.EFI.Analytics.track(eventName, properties || {});
      }
    }

    function readPlans() {
      try { return JSON.parse(localStorage.getItem(ACTION_PLAN_KEY)) || []; } catch (e) { return []; }
    }

    function syncLearningLoopState() {
      if (window.EFI && window.EFI.Auth && typeof window.EFI.Auth.syncLearningLoopState === 'function') {
        window.EFI.Auth.syncLearningLoopState();
      }
    }

    function writePlans(plans) {
      shared.safeSetLocalStorage(ACTION_PLAN_KEY, JSON.stringify((plans || []).slice(-50)));
      syncLearningLoopState();
    }

    function readReflections() {
      try { return JSON.parse(localStorage.getItem('efi_reflections_v1')) || []; } catch (e) { return []; }
    }

    function readAssessmentEvents() {
      if (window.EFI && window.EFI.Analytics && typeof window.EFI.Analytics.getAssessmentEvents === 'function') {
        return window.EFI.Analytics.getAssessmentEvents();
      }
      try { return JSON.parse(localStorage.getItem('efi_assessment_events_v1')) || []; } catch (e) { return []; }
    }

    function isDue(plan) {
      if (!plan || !plan.recheck || !plan.recheck.due_at) return false;
      var due = Date.parse(plan.recheck.due_at);
      if (!Number.isFinite(due)) return false;
      var status = plan.state && plan.state.status ? plan.state.status : 'generated';
      if (status === 'completed' || status === 'expired') return false;
      return Date.now() >= due;
    }

    function processDueLifecycle() {
      var plans = readPlans();
      var changed = false;
      plans.forEach(function (plan) {
        if (!isDue(plan)) return;
        plan.state = plan.state || {};
        var currentCadence = plan.recheck && plan.recheck.cadence ? plan.recheck.cadence : '';
        if (!plan.state.recheck_due_emitted_at || plan.state.recheck_due_emitted_cadence !== currentCadence) {
          plan.state.recheck_due_emitted_at = new Date().toISOString();
          plan.state.recheck_due_emitted_cadence = currentCadence;
          plan.state.updated_at = plan.state.recheck_due_emitted_at;
          changed = true;
          track('spaced_recheck_due', {
            plan_id: plan.plan_id,
            source_tool: plan.source_tool || 'unknown',
            cadence: currentCadence,
            due_at: plan.recheck && plan.recheck.due_at ? plan.recheck.due_at : ''
          });
        }
      });
      if (changed) writePlans(plans);
      return plans;
    }

    function appendCardHeading(card, title, description) {
      var heading = document.createElement('h3');
      heading.style.marginTop = '0';
      heading.textContent = title;
      card.appendChild(heading);

      var intro = document.createElement('p');
      intro.style.color = 'var(--color-text-light)';
      intro.textContent = description;
      card.appendChild(intro);
    }

    function appendStatLine(container, label, value, color) {
      var line = document.createElement('p');
      line.style.margin = '0';
      if (color) line.style.color = color;
      var strong = document.createElement('strong');
      strong.textContent = label;
      line.appendChild(strong);
      line.appendChild(document.createTextNode(' ' + value));
      container.appendChild(line);
      return line;
    }

    function appendWarningIcon(container) {
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('width', '16');
      svg.setAttribute('height', '16');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', '#c62828');
      svg.setAttribute('stroke-width', '2');
      svg.style.display = 'inline-block';
      svg.style.verticalAlign = 'middle';
      svg.style.marginRight = '4px';

      function appendSvgNode(tag, attrs) {
        var node = document.createElementNS('http://www.w3.org/2000/svg', tag);
        Object.keys(attrs).forEach(function (key) {
          node.setAttribute(key, attrs[key]);
        });
        svg.appendChild(node);
      }

      appendSvgNode('path', { d: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' });
      appendSvgNode('line', { x1: '12', y1: '9', x2: '12', y2: '13' });
      appendSvgNode('line', { x1: '12', y1: '17', x2: '12.01', y2: '17' });
      container.appendChild(svg);
    }

    function renderDashboardRecheckCard(plans) {
      var page = window.location.pathname.split('/').pop() || 'index.html';
      if (page !== 'dashboard.html') return;
      var duePlans = (plans || []).filter(isDue);
      if (!duePlans.length) return;

      var anchor = document.querySelector('main .container') || document.querySelector('main');
      if (!anchor || document.getElementById('dashboard-recheck-reminders')) return;

      var card = document.createElement('section');
      card.id = 'dashboard-recheck-reminders';
      card.className = 'card';
      card.style.borderLeft = '4px solid var(--color-accent)';
      card.style.marginBottom = 'var(--space-lg)';
      appendCardHeading(card, 'Recheck Reminders', 'You have spaced rechecks due. Complete them to keep your learning loop active.');

      duePlans.slice(0, 5).forEach(function (plan) {
        var dueLabel = plan.recheck && plan.recheck.due_at ? new Date(plan.recheck.due_at).toLocaleString() : 'due now';
        var focus = plan.focus && plan.focus.title ? plan.focus.title : 'Practice recheck';
        var row = document.createElement('div');
        row.style.padding = 'var(--space-sm) 0';
        row.style.borderTop = '1px solid var(--color-border)';

        var title = document.createElement('p');
        title.style.margin = '0 0 var(--space-xs) 0';
        var strong = document.createElement('strong');
        strong.textContent = focus;
        title.appendChild(strong);
        row.appendChild(title);

        var meta = document.createElement('p');
        meta.style.margin = '0 0 var(--space-xs) 0';
        meta.style.color = 'var(--color-text-light)';
        meta.textContent = 'Source: ' + (plan.source_tool || 'assessment') + ' · Due: ' + dueLabel;
        row.appendChild(meta);

        var buttonWrap = document.createElement('div');
        buttonWrap.style.display = 'flex';
        buttonWrap.style.gap = 'var(--space-xs)';
        buttonWrap.style.flexWrap = 'wrap';

        var startBtn = document.createElement('button');
        startBtn.type = 'button';
        startBtn.className = 'btn btn--primary btn--sm';
        startBtn.setAttribute('data-recheck-start-plan-id', plan.plan_id || '');
        startBtn.textContent = 'Start Recheck Now';
        buttonWrap.appendChild(startBtn);

        var completeBtn = document.createElement('button');
        completeBtn.type = 'button';
        completeBtn.className = 'btn btn--secondary btn--sm';
        completeBtn.setAttribute('data-recheck-complete-plan-id', plan.plan_id || '');
        completeBtn.textContent = 'Mark Recheck Complete';
        buttonWrap.appendChild(completeBtn);

        row.appendChild(buttonWrap);
        card.appendChild(row);
      });

      var statusEl = document.createElement('p');
      statusEl.id = 'dashboard-recheck-status';
      statusEl.style.marginTop = 'var(--space-sm)';
      statusEl.style.fontSize = '0.9rem';
      statusEl.style.color = 'var(--color-text-light)';
      card.appendChild(statusEl);
      anchor.insertAdjacentElement('afterbegin', card);

      var status = card.querySelector('#dashboard-recheck-status');
      card.querySelectorAll('button[data-recheck-start-plan-id]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var planId = btn.getAttribute('data-recheck-start-plan-id');
          if (!planId) return;
          var allPlans = readPlans();
          var plan = allPlans.find(function (item) { return item && item.plan_id === planId; });
          if (!plan) return;
          plan.state = plan.state || {};
          var startedAt = new Date().toISOString();
          if (!plan.state.started_at) plan.state.started_at = startedAt;
          plan.state.recheck_started_at = startedAt;
          if (plan.state.status === 'generated' || plan.state.status === 'checkin_completed') plan.state.status = 'started';
          plan.state.updated_at = startedAt;
          writePlans(allPlans);
          btn.disabled = true;
          btn.textContent = 'Recheck Started';
          if (status) status.textContent = 'Recheck started. Complete it when finished.';
          track('practice_plan_started', {
            plan_id: planId,
            source_tool: plan.source_tool || 'unknown',
            started_at: startedAt,
            started_from: 'dashboard_recheck_reminder'
          });
        });
      });

      card.querySelectorAll('button[data-recheck-complete-plan-id]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var planId = btn.getAttribute('data-recheck-complete-plan-id');
          if (!planId) return;
          var allPlans = readPlans();
          var plan = allPlans.find(function (item) { return item && item.plan_id === planId; });
          if (!plan) return;
          plan.state = plan.state || {};
          plan.state.status = 'completed';
          plan.state.recheck_completed_at = new Date().toISOString();
          plan.state.updated_at = plan.state.recheck_completed_at;
          writePlans(allPlans);
          btn.disabled = true;
          btn.textContent = 'Recheck Completed';
          if (status) status.textContent = 'Recheck completion saved.';
          track('spaced_recheck_completed', {
            plan_id: planId,
            source_tool: plan.source_tool || 'unknown',
            completed_at: plan.state.recheck_completed_at,
            score_before: null,
            score_after: null,
            retention_delta: null
          });
        });
      });
    }

    function toDayKey(iso) {
      var d = iso ? new Date(iso) : null;
      if (!d || Number.isNaN(d.getTime())) return '';
      return d.toISOString().slice(0, 10);
    }

    function dayDiff(aDayKey, bDayKey) {
      if (!aDayKey || !bDayKey) return 999;
      var a = Date.parse(aDayKey + 'T00:00:00Z');
      var b = Date.parse(bDayKey + 'T00:00:00Z');
      if (!Number.isFinite(a) || !Number.isFinite(b)) return 999;
      return Math.round((a - b) / 86400000);
    }

    function computePracticeAdherence(plans) {
      var list = Array.isArray(plans) ? plans : [];
      var active = list.filter(function (plan) {
        if (!plan) return false;
        var status = plan.state && plan.state.status ? plan.state.status : 'generated';
        return status !== 'expired';
      });
      if (!active.length) {
        return {
          activePlans: 0,
          engagedPlans: 0,
          adherenceRate: 0,
          recentCheckins: 0,
          streakDays: 0,
          stateLabel: 'Not started',
          recoveryPrompt: 'Generate your first plan and complete one quick check-in to begin your streak.'
        };
      }

      var engagedPlans = active.filter(function (plan) {
        var status = plan.state && plan.state.status ? plan.state.status : 'generated';
        return status === 'started' || status === 'checkin_completed' || status === 'completed';
      }).length;

      var now = Date.now();
      var checkinDates = [];
      active.forEach(function (plan) {
        var checkins = plan.state && Array.isArray(plan.state.checkins) ? plan.state.checkins : [];
        checkins.forEach(function (item) {
          if (!item || !item.at) return;
          checkinDates.push(item.at);
        });
      });

      var recentCheckins = checkinDates.filter(function (iso) {
        var t = Date.parse(iso);
        if (!Number.isFinite(t)) return false;
        return (now - t) <= (7 * 24 * 60 * 60 * 1000);
      }).length;

      var uniqueDays = Array.from(new Set(checkinDates.map(toDayKey).filter(Boolean))).sort().reverse();
      var streakDays = 0;
      if (uniqueDays.length) {
        var todayKey = new Date().toISOString().slice(0, 10);
        var firstGap = dayDiff(todayKey, uniqueDays[0]);
        if (firstGap === 0 || firstGap === 1) {
          streakDays = 1;
          for (var i = 1; i < uniqueDays.length; i++) {
            var gap = dayDiff(uniqueDays[i - 1], uniqueDays[i]);
            if (gap === 1) streakDays += 1;
            else break;
          }
        }
      }

      var adherenceRate = engagedPlans / active.length;
      var stateLabel = adherenceRate >= 0.8 ? 'Strong adherence' : (adherenceRate >= 0.5 ? 'Building consistency' : 'Needs support');
      var recoveryPrompt = adherenceRate >= 0.5
        ? 'Keep momentum: complete one more check-in before your next recheck due date.'
        : 'Recovery move: pick one active plan and log a 2-minute check-in today to restart consistency.';

      return {
        activePlans: active.length,
        engagedPlans: engagedPlans,
        adherenceRate: adherenceRate,
        recentCheckins: recentCheckins,
        streakDays: streakDays,
        stateLabel: stateLabel,
        recoveryPrompt: recoveryPrompt
      };
    }

    function getLeastEngagedPlan(plans) {
      var active = (plans || []).filter(function (p) {
        return p && p.state && p.state.status !== 'expired' && p.state.status !== 'completed';
      });
      if (!active.length) return null;
      return active.slice().sort(function (a, b) {
        var ac = (a.state && Array.isArray(a.state.checkins)) ? a.state.checkins.length : 0;
        var bc = (b.state && Array.isArray(b.state.checkins)) ? b.state.checkins.length : 0;
        return ac - bc;
      })[0];
    }

    function renderDashboardPracticeCard(plans) {
      var page = window.location.pathname.split('/').pop() || 'index.html';
      if (page !== 'dashboard.html') return;
      var anchor = document.querySelector('main .container') || document.querySelector('main');
      if (!anchor) return;
      var existing = document.getElementById('dashboard-practice-adherence');
      if (existing) existing.remove();

      var summary = computePracticeAdherence(plans);
      var adherencePercent = Math.round(summary.adherenceRate * 100);
      var isLowAdherence = summary.stateLabel === 'Needs support';
      var borderColor = isLowAdherence ? '#c62828' : 'var(--color-primary)';
      var statusColor = isLowAdherence ? '#c62828' : 'inherit';

      var card = document.createElement('section');
      card.id = 'dashboard-practice-adherence';
      card.className = 'card';
      card.style.borderLeft = '4px solid ' + borderColor;
      card.style.marginBottom = 'var(--space-lg)';
      appendCardHeading(card, 'Practice Adherence', 'Track consistency across active plans and recover quickly when momentum drops.');

      var statsWrap = document.createElement('div');
      statsWrap.style.display = 'flex';
      statsWrap.style.flexWrap = 'wrap';
      statsWrap.style.gap = 'var(--space-md)';
      appendStatLine(statsWrap, 'Streak:', summary.streakDays + ' day' + (summary.streakDays === 1 ? '' : 's'));
      appendStatLine(statsWrap, 'Adherence:', adherencePercent + '% (' + summary.engagedPlans + '/' + summary.activePlans + ' active plans)');
      appendStatLine(statsWrap, 'Last 7 days check-ins:', String(summary.recentCheckins));
      card.appendChild(statsWrap);

      var statusLine = document.createElement('p');
      statusLine.style.margin = 'var(--space-sm) 0 0';
      statusLine.style.color = statusColor;
      if (isLowAdherence) appendWarningIcon(statusLine);
      var statusStrong = document.createElement('strong');
      statusStrong.textContent = 'Status:';
      statusLine.appendChild(statusStrong);
      statusLine.appendChild(document.createTextNode(' ' + summary.stateLabel));
      card.appendChild(statusLine);

      var recovery = document.createElement('p');
      recovery.style.margin = 'var(--space-xs) 0 0';
      recovery.style.color = 'var(--color-text-light)';
      recovery.textContent = summary.recoveryPrompt;
      card.appendChild(recovery);

      if (isLowAdherence) {
        var laggingPlan = getLeastEngagedPlan(plans);
        var planLabel = laggingPlan && laggingPlan.focus && laggingPlan.focus.title ? laggingPlan.focus.title : 'your least-active plan';
        var intervention = document.createElement('div');
        intervention.style.marginTop = 'var(--space-md)';
        intervention.style.padding = 'var(--space-sm)';
        intervention.style.background = 'rgba(198,40,40,0.06)';
        intervention.style.borderRadius = 'var(--border-radius)';

        var interventionTitle = document.createElement('p');
        interventionTitle.style.margin = '0 0 var(--space-xs) 0';
        interventionTitle.style.fontWeight = '700';
        interventionTitle.style.color = '#c62828';
        interventionTitle.textContent = 'Intervention recommended';
        intervention.appendChild(interventionTitle);

        var interventionText = document.createElement('p');
        interventionText.style.margin = '0 0 var(--space-sm) 0';
        interventionText.appendChild(document.createTextNode('Log a 2-minute check-in on '));
        var emphasis = document.createElement('em');
        emphasis.textContent = planLabel;
        interventionText.appendChild(emphasis);
        interventionText.appendChild(document.createTextNode(' to restart your consistency streak.'));
        intervention.appendChild(interventionText);

        var interventionLink = document.createElement('a');
        interventionLink.href = 'dashboard.html#learning-queue';
        interventionLink.className = 'btn btn--sm btn--secondary';
        interventionLink.textContent = 'Go to Learning Queue';
        intervention.appendChild(interventionLink);
        card.appendChild(intervention);
      }

      anchor.insertAdjacentElement('afterbegin', card);
    }

    function summarizeEducationKpis(plans, events, reflections) {
      var planList = Array.isArray(plans) ? plans : [];
      var eventList = Array.isArray(events) ? events : [];
      var reflectionList = Array.isArray(reflections) ? reflections : [];
      var generatedCount = eventList.filter(function (evt) { return evt && evt.event_name === 'practice_plan_generated'; }).length;
      var startedCount = eventList.filter(function (evt) { return evt && evt.event_name === 'practice_plan_started'; }).length;
      var recheckCompletedCount = eventList.filter(function (evt) { return evt && evt.event_name === 'spaced_recheck_completed'; }).length;
      var checkinCount = eventList.filter(function (evt) { return evt && evt.event_name === 'practice_checkin_completed'; }).length;
      var masteryEvents = eventList.filter(function (evt) { return evt && evt.event_name === 'mastery_verified'; });
      var masteryEventPlanIds = new Set(masteryEvents.map(function (evt) {
        return evt && evt.properties && evt.properties.plan_id ? evt.properties.plan_id : '';
      }).filter(Boolean));
      var masteryPlans = planList.filter(function (plan) {
        if (!plan || !plan.plan_id) return false;
        return masteryEventPlanIds.has(plan.plan_id) || !!(plan.state && plan.state.mastery_verified_at);
      });
      var activePlans = planList.filter(function (plan) {
        if (!plan) return false;
        var status = plan.state && plan.state.status ? plan.state.status : 'generated';
        return status !== 'expired';
      });
      var retentionDue = activePlans.filter(function (plan) { return plan && plan.recheck && plan.recheck.due_at; }).length;
      var reflectionPlanIds = new Set(reflectionList.map(function (item) {
        return item && item.plan_id ? item.plan_id : '';
      }).filter(Boolean));
      var transferPlanCount = new Set(Array.from(reflectionPlanIds)).size;

      return {
        generatedCount: generatedCount,
        activationRate: generatedCount ? (startedCount / generatedCount) : 0,
        adherenceRate: startedCount ? (checkinCount / startedCount) : 0,
        retentionRate: retentionDue ? (recheckCompletedCount / retentionDue) : 0,
        transferRate: activePlans.length ? (transferPlanCount / activePlans.length) : 0,
        masteryQualityRate: startedCount ? (masteryPlans.length / startedCount) : 0,
        masteryVerifiedPlans: masteryPlans.length
      };
    }

    function renderEducationKpiCard(plans, reflections) {
      var page = window.location.pathname.split('/').pop() || 'index.html';
      if (page !== 'dashboard.html') return;
      var anchor = document.querySelector('main .container') || document.querySelector('main');
      if (!anchor) return;
      var existing = document.getElementById('dashboard-education-kpis');
      if (existing) existing.remove();

      var events = readAssessmentEvents();
      var summary = summarizeEducationKpis(plans, events, reflections);
      var sampleSize = summary.generatedCount;
      var sampleNote = sampleSize ? ('Sample: ' + sampleSize + ' generated plans') : 'Sample: no tracked plans yet';

      var card = document.createElement('section');
      card.id = 'dashboard-education-kpis';
      card.className = 'card';
      card.style.borderLeft = '4px solid var(--module-6)';
      card.style.marginBottom = 'var(--space-lg)';
      appendCardHeading(card, 'Education KPI Snapshot', 'Activation, adherence, retention, transfer, and mastery quality from the v1 assessment loop.');

      var grid = document.createElement('div');
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = 'repeat(auto-fit,minmax(220px,1fr))';
      grid.style.gap = 'var(--space-sm)';
      appendStatLine(grid, 'Activation:', Math.round(summary.activationRate * 100) + '%');
      appendStatLine(grid, 'Adherence:', Math.round(summary.adherenceRate * 100) + '%');
      appendStatLine(grid, 'Retention:', Math.round(summary.retentionRate * 100) + '%');
      appendStatLine(grid, 'Transfer:', Math.round(summary.transferRate * 100) + '%');
      appendStatLine(grid, 'Mastery quality:', Math.round(summary.masteryQualityRate * 100) + '%');
      card.appendChild(grid);

      var sampleLine = document.createElement('p');
      sampleLine.style.margin = 'var(--space-sm) 0 0';
      sampleLine.style.color = 'var(--color-text-light)';
      sampleLine.textContent = sampleNote + ' · Mastery verified plans: ' + summary.masteryVerifiedPlans + '.';
      card.appendChild(sampleLine);
      anchor.insertAdjacentElement('afterbegin', card);
    }

    function buildLearningQueue(plans) {
      var list = Array.isArray(plans) ? plans : [];
      var now = Date.now();
      return list.map(function (plan) {
        if (!plan) return null;
        var status = plan.state && plan.state.status ? plan.state.status : 'generated';
        if (status === 'completed' || status === 'expired') return null;
        var dueAt = plan.recheck && plan.recheck.due_at ? Date.parse(plan.recheck.due_at) : NaN;
        var isPlanDue = Number.isFinite(dueAt) ? dueAt <= now : false;
        var priority = 10;
        var reason = 'Keep momentum with your active plan.';
        if (isPlanDue) {
          priority += 100;
          reason = 'Recheck is due now.';
        }
        if (status === 'generated') {
          priority += 60;
          reason = 'Plan is generated but not started yet.';
        } else if (status === 'started') {
          priority += 45;
          reason = 'Plan is started; complete a check-in to lock transfer evidence.';
        } else if (status === 'checkin_completed') {
          priority += 25;
          reason = 'Check-in logged; finish recheck cycle to verify retention.';
        }
        var checkins = plan.state && Array.isArray(plan.state.checkins) ? plan.state.checkins : [];
        if (!checkins.length && status !== 'generated') priority += 10;
        var recencyPenalty = 0;
        if (checkins.length) {
          var latest = Date.parse(checkins[checkins.length - 1].at || '');
          if (Number.isFinite(latest)) {
            var days = (now - latest) / 86400000;
            recencyPenalty = Math.max(0, 7 - Math.round(days));
          }
        }
        var focus = plan.focus && plan.focus.title ? plan.focus.title : 'Active learning plan';
        var source = plan.source_tool || 'assessment';
        var dueLabel = Number.isFinite(dueAt) ? new Date(dueAt).toLocaleString() : 'no due date';
        return {
          planId: plan.plan_id,
          focus: focus,
          source: source,
          status: status,
          dueLabel: dueLabel,
          reason: reason,
          priority: priority - recencyPenalty
        };
      }).filter(Boolean).sort(function (a, b) { return b.priority - a.priority; });
    }

    function verifyMasteryLifecycle(plans) {
      var list = Array.isArray(plans) ? plans : [];
      var reflections = readReflections();
      var changed = false;

      list.forEach(function (plan) {
        if (!plan) return;
        plan.state = plan.state || {};
        if (plan.state.mastery_verified_at) return;

        var hasCompletedRecheck = !!plan.state.recheck_completed_at;
        var hasCheckin = Array.isArray(plan.state.checkins) && plan.state.checkins.length > 0;
        var hasTransferEvidence = reflections.some(function (item) {
          return item && item.plan_id && plan.plan_id && item.plan_id === plan.plan_id && item.reflection_48h;
        });
        if (!(hasCompletedRecheck && hasCheckin && hasTransferEvidence)) return;

        var verifiedAt = new Date().toISOString();
        plan.state.mastery_verified_at = verifiedAt;
        plan.state.mastery_rule = 'v1_knowledge_recheck_transfer';
        plan.state.updated_at = verifiedAt;
        changed = true;
        track('mastery_verified', {
          plan_id: plan.plan_id,
          source_tool: plan.source_tool || 'unknown',
          verified_at: verifiedAt,
          verification_rule: 'v1_knowledge_recheck_transfer',
          has_checkin: true,
          has_transfer_evidence: true,
          has_recheck_completion: true
        });
      });

      if (changed) writePlans(list);
      return list;
    }

    function renderDashboardMasteryCard(plans) {
      var page = window.location.pathname.split('/').pop() || 'index.html';
      if (page !== 'dashboard.html') return;
      var anchor = document.querySelector('main .container') || document.querySelector('main');
      if (!anchor) return;
      var existing = document.getElementById('dashboard-mastery-verification');
      if (existing) existing.remove();

      var list = Array.isArray(plans) ? plans : [];
      var active = list.filter(function (plan) {
        if (!plan) return false;
        var status = plan.state && plan.state.status ? plan.state.status : 'generated';
        return status !== 'expired';
      });
      var verified = active.filter(function (plan) {
        return !!(plan.state && plan.state.mastery_verified_at);
      });
      var pending = active.length - verified.length;

      var card = document.createElement('section');
      card.id = 'dashboard-mastery-verification';
      card.className = 'card';
      card.style.borderLeft = '4px solid var(--module-6)';
      card.style.marginBottom = 'var(--space-lg)';
      appendCardHeading(card, 'Mastery Verification', 'Mastery is verified when practice includes check-in evidence, delayed recheck completion, and transfer reflection.');

      var masteryStats = document.createElement('div');
      masteryStats.style.display = 'flex';
      masteryStats.style.flexWrap = 'wrap';
      masteryStats.style.gap = 'var(--space-md)';
      appendStatLine(masteryStats, 'Verified:', String(verified.length));
      appendStatLine(masteryStats, 'Pending:', String(pending));
      card.appendChild(masteryStats);

      var ruleLine = document.createElement('p');
      ruleLine.style.margin = 'var(--space-sm) 0 0';
      ruleLine.style.color = 'var(--color-text-light)';
      var ruleStrong = document.createElement('strong');
      ruleStrong.textContent = 'Rule:';
      ruleLine.appendChild(ruleStrong);
      ruleLine.appendChild(document.createTextNode(' v1_knowledge_recheck_transfer'));
      card.appendChild(ruleLine);
      anchor.insertAdjacentElement('afterbegin', card);
    }

    function renderDashboardLearningQueue(plans) {
      var page = window.location.pathname.split('/').pop() || 'index.html';
      if (page !== 'dashboard.html') return;
      var anchor = document.querySelector('main .container') || document.querySelector('main');
      if (!anchor) return;
      var existing = document.getElementById('dashboard-learning-queue');
      if (existing) existing.remove();

      var queue = buildLearningQueue(plans);
      var card = document.createElement('section');
      card.id = 'dashboard-learning-queue';
      card.className = 'card';
      card.style.borderLeft = '4px solid var(--color-accent)';
      card.style.marginBottom = 'var(--space-lg)';
      appendCardHeading(card, 'Learning Queue', 'Ranked next-best actions across all active tools.');

      if (queue.length) {
        var listEl = document.createElement('ol');
        listEl.style.margin = '0';
        listEl.style.paddingLeft = 'var(--space-lg)';
        queue.slice(0, 5).forEach(function (item, index) {
          var li = document.createElement('li');
          li.style.marginBottom = 'var(--space-sm)';
          var title = document.createElement('strong');
          title.textContent = '#' + (index + 1) + ' ' + item.focus;
          li.appendChild(title);
          var meta = document.createElement('span');
          meta.style.color = 'var(--color-text-muted)';
          meta.textContent = ' (' + item.source + ' · ' + item.status + ')';
          li.appendChild(meta);
          li.appendChild(document.createElement('br'));
          var reason = document.createElement('span');
          reason.style.color = 'var(--color-text-light)';
          reason.textContent = item.reason + ' Due: ' + item.dueLabel + '.';
          li.appendChild(reason);
          listEl.appendChild(li);
        });
        card.appendChild(listEl);
      } else {
        var empty = document.createElement('p');
        empty.style.margin = '0';
        empty.style.color = 'var(--color-text-light)';
        empty.textContent = 'No active plans yet. Generate a plan from any assessment to start your queue.';
        card.appendChild(empty);
      }
      anchor.insertAdjacentElement('afterbegin', card);
    }

    var updatedPlans = processDueLifecycle();
    updatedPlans = verifyMasteryLifecycle(updatedPlans);
    var reflections = readReflections();
    renderEducationKpiCard(updatedPlans, reflections);
    renderDashboardMasteryCard(updatedPlans);
    renderDashboardLearningQueue(updatedPlans);
    renderDashboardPracticeCard(updatedPlans);
    renderDashboardRecheckCard(updatedPlans);
  });
})();
