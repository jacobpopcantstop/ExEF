/* ============================================
   The Executive Functioning Institute
   Main JavaScript
   ============================================ */

/* Apply saved theme immediately to prevent flash */
(function () {
  var saved = null;
  try {
    saved = localStorage.getItem('efi_theme');
  } catch (e) {
    saved = null;
  }
  if (saved) document.documentElement.setAttribute('data-theme', saved);
})();

document.addEventListener('DOMContentLoaded', function () {
  var host = window.location.hostname || '';
  var TRACKING_ENABLED = !/github\.io$/i.test(host) && !/^(localhost|127\.0\.0\.1)$/i.test(host) && window.location.protocol !== 'file:';

  function revealStaticContent() {
    document.querySelectorAll('.fade-in, .stagger > *').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // Critical page sections should not depend on later JS branches to become visible.
  revealStaticContent();

  function safeSetLocalStorage(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  }

  function canPostTracking() {
    return TRACKING_ENABLED && !!window.fetch;
  }


  function highlightActiveNavLinks() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav__link').forEach(function (link) {
      link.classList.remove('nav__link--active');
      link.removeAttribute('aria-current');

      var href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('nav__link--active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  window.EFI = window.EFI || {};
  window.EFI.highlightActiveNavLinks = highlightActiveNavLinks;

  (function initTelemetry() {
    var KEY = 'efi_client_errors';
    function post(payload) {
      if (!canPostTracking()) return Promise.resolve();
      return fetch('/api/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function () {});
    }
    function read() {
      try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
    }
    function write(list) {
      safeSetLocalStorage(KEY, JSON.stringify(list.slice(-50)));
    }
    function log(type, payload) {
      var list = read();
      var item = { type: type, payload: payload, at: new Date().toISOString(), page: window.location.pathname };
      list.push(item);
      write(list);
      post({
        event_name: 'client_error',
        page: window.location.pathname.split('/').pop() || 'index.html',
        source: 'telemetry',
        properties: item
      });
    }
    window.EFI.Telemetry = {
      getErrors: read,
      clearErrors: function () { localStorage.removeItem(KEY); },
      log: log
    };
    window.addEventListener('error', function (e) {
      log('error', { message: e.message, source: e.filename, line: e.lineno, col: e.colno });
    });
    window.addEventListener('unhandledrejection', function (e) {
      log('promise_rejection', { reason: String(e.reason) });
    });
  })();

  (function initAnalytics() {
    var ASSESSMENT_EVENTS_KEY = 'efi_assessment_events_v1';

    function post(payload) {
      if (!canPostTracking()) return Promise.resolve();
      return fetch('/api/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function () {});
    }

    function readAssessmentEvents() {
      try { return JSON.parse(localStorage.getItem(ASSESSMENT_EVENTS_KEY)) || []; } catch (e) { return []; }
    }

    function writeAssessmentEvents(events) {
      safeSetLocalStorage(ASSESSMENT_EVENTS_KEY, JSON.stringify((events || []).slice(-300)));
    }

    function getAuthContext() {
      try {
        if (window.EFI && window.EFI.Auth && typeof window.EFI.Auth.isLoggedIn === 'function') {
          var session = window.EFI.Auth.getSession ? window.EFI.Auth.getSession() : null;
          return {
            authenticated: window.EFI.Auth.isLoggedIn(),
            auth_mode: session ? (session.mode || 'prototype') : 'guest'
          };
        }
      } catch (e) {}
      return { authenticated: false, auth_mode: 'guest' };
    }

    function storeAssessmentEvent(payload) {
      if (!payload || !payload.event_name) return;
      var list = readAssessmentEvents();
      var planId = payload.properties && payload.properties.plan_id ? payload.properties.plan_id : null;

      // Dedupe: practice_plan_generated fires at most once per plan_id
      if (payload.event_name === 'practice_plan_generated' && planId) {
        var alreadyStored = list.some(function (e) {
          return e && e.event_name === 'practice_plan_generated' &&
            e.properties && e.properties.plan_id === planId;
        });
        if (alreadyStored) return;
      }

      var auth = getAuthContext();
      list.push({
        event_name: payload.event_name,
        page: payload.page,
        source: payload.source,
        properties: payload.properties || {},
        authenticated: auth.authenticated,
        auth_mode: auth.auth_mode,
        recorded_at: new Date().toISOString()
      });
      writeAssessmentEvents(list);
    }

    function track(eventName, properties) {
      var page = window.location.pathname.split('/').pop() || 'index.html';
      var params = new URLSearchParams(window.location.search || '');
      var source = params.get('utm_source') || params.get('source') || document.referrer || 'direct';
      var payload = {
        event_name: eventName,
        page: page,
        source: source,
        properties: properties || {}
      };
      storeAssessmentEvent(payload);
      return post(payload);
    }

    window.EFI.Analytics = {
      track: track,
      getAssessmentEvents: readAssessmentEvents
    };

    track('page_view', {
      title: document.title
    });

    document.addEventListener('click', function (e) {
      var el = e.target && e.target.closest ? e.target.closest('[data-analytics-event]') : null;
      if (!el) return;
      track(el.getAttribute('data-analytics-event'), {
        label: el.getAttribute('data-analytics-label') || el.textContent.trim().slice(0, 80)
      });
    });
  })();

  (function initSpacedRecheckEngine() {
    var ACTION_PLAN_KEY = 'efi_action_plans_v1';

    function track(eventName, properties) {
      if (window.EFI && window.EFI.Analytics && typeof window.EFI.Analytics.track === 'function') {
        window.EFI.Analytics.track(eventName, properties || {});
      }
    }

    function readPlans() {
      try { return JSON.parse(localStorage.getItem(ACTION_PLAN_KEY)) || []; } catch (e) { return []; }
    }

    function writePlans(plans) {
      safeSetLocalStorage(ACTION_PLAN_KEY, JSON.stringify((plans || []).slice(-50)));
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
      plans.forEach(function(plan) {
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

      var listHtml = '';
      duePlans.slice(0, 5).forEach(function(plan, idx) {
        var dueLabel = plan.recheck && plan.recheck.due_at ? new Date(plan.recheck.due_at).toLocaleString() : 'due now';
        var focus = plan.focus && plan.focus.title ? plan.focus.title : 'Practice recheck';
        var completeId = 'recheck-complete-' + idx;
        var startId = 'recheck-start-' + idx;
        listHtml +=
          '<div style="padding:var(--space-sm) 0;border-top:1px solid var(--color-border);">' +
            '<p style="margin:0 0 var(--space-xs) 0;"><strong>' + focus + '</strong></p>' +
            '<p style="margin:0 0 var(--space-xs) 0;color:var(--color-text-light);">Source: ' + (plan.source_tool || 'assessment') + ' · Due: ' + dueLabel + '</p>' +
            '<div style="display:flex;gap:var(--space-xs);flex-wrap:wrap;">' +
              '<button type="button" class="btn btn--primary btn--sm" data-recheck-start-plan-id="' + plan.plan_id + '" id="' + startId + '">Start Recheck Now</button>' +
              '<button type="button" class="btn btn--secondary btn--sm" data-recheck-complete-plan-id="' + plan.plan_id + '" id="' + completeId + '">Mark Recheck Complete</button>' +
            '</div>' +
          '</div>';
      });

      card.innerHTML =
        '<h3 style="margin-top:0;">Recheck Reminders</h3>' +
        '<p style="color:var(--color-text-light);">You have spaced rechecks due. Complete them to keep your learning loop active.</p>' +
        listHtml +
        '<p id="dashboard-recheck-status" style="margin-top:var(--space-sm);font-size:0.9rem;color:var(--color-text-light);"></p>';

      anchor.insertAdjacentElement('afterbegin', card);

      var status = document.getElementById('dashboard-recheck-status');

      card.querySelectorAll('button[data-recheck-start-plan-id]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var planId = btn.getAttribute('data-recheck-start-plan-id');
          if (!planId) return;
          var allPlans = readPlans();
          var plan = allPlans.find(function(item) { return item && item.plan_id === planId; });
          if (!plan) return;
          plan.state = plan.state || {};
          var startedAt = new Date().toISOString();
          if (!plan.state.started_at) plan.state.started_at = startedAt;
          plan.state.recheck_started_at = startedAt;
          if (plan.state.status === 'generated' || plan.state.status === 'checkin_completed') {
            plan.state.status = 'started';
          }
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

      card.querySelectorAll('button[data-recheck-complete-plan-id]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var planId = btn.getAttribute('data-recheck-complete-plan-id');
          if (!planId) return;
          var allPlans = readPlans();
          var plan = allPlans.find(function(item) { return item && item.plan_id === planId; });
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
      var active = list.filter(function(plan) {
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

      var engagedPlans = active.filter(function(plan) {
        var status = plan.state && plan.state.status ? plan.state.status : 'generated';
        return status === 'started' || status === 'checkin_completed' || status === 'completed';
      }).length;

      var now = Date.now();
      var checkinDates = [];
      active.forEach(function(plan) {
        var checkins = plan.state && Array.isArray(plan.state.checkins) ? plan.state.checkins : [];
        checkins.forEach(function(item) {
          if (!item || !item.at) return;
          checkinDates.push(item.at);
        });
      });

      var recentCheckins = checkinDates.filter(function(iso) {
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

    function renderDashboardPracticeCard(plans) {
      var page = window.location.pathname.split('/').pop() || 'index.html';
      if (page !== 'dashboard.html') return;
      var anchor = document.querySelector('main .container') || document.querySelector('main');
      if (!anchor) return;
      var existing = document.getElementById('dashboard-practice-adherence');
      if (existing) existing.remove();

      var summary = computePracticeAdherence(plans);
      var adherencePercent = Math.round(summary.adherenceRate * 100);

      var card = document.createElement('section');
      card.id = 'dashboard-practice-adherence';
      card.className = 'card';
      card.style.borderLeft = '4px solid var(--color-primary)';
      card.style.marginBottom = 'var(--space-lg)';
      card.innerHTML =
        '<h3 style="margin-top:0;">Practice Adherence</h3>' +
        '<p style="color:var(--color-text-light);">Track consistency across active plans and recover quickly when momentum drops.</p>' +
        '<div style="display:flex;flex-wrap:wrap;gap:var(--space-md);">' +
          '<p style="margin:0;"><strong>Streak:</strong> ' + summary.streakDays + ' day' + (summary.streakDays === 1 ? '' : 's') + '</p>' +
          '<p style="margin:0;"><strong>Adherence:</strong> ' + adherencePercent + '% (' + summary.engagedPlans + '/' + summary.activePlans + ' active plans)</p>' +
          '<p style="margin:0;"><strong>Last 7 days check-ins:</strong> ' + summary.recentCheckins + '</p>' +
        '</div>' +
        '<p style="margin:var(--space-sm) 0 0;"><strong>Status:</strong> ' + summary.stateLabel + '</p>' +
        '<p style="margin:var(--space-xs) 0 0;color:var(--color-text-light);"><strong>Recovery prompt:</strong> ' + summary.recoveryPrompt + '</p>';

      anchor.insertAdjacentElement('afterbegin', card);
    }

    function summarizeEducationKpis(plans, events, reflections) {
      var planList = Array.isArray(plans) ? plans : [];
      var eventList = Array.isArray(events) ? events : [];
      var reflectionList = Array.isArray(reflections) ? reflections : [];

      var generatedCount = eventList.filter(function(evt) { return evt && evt.event_name === 'practice_plan_generated'; }).length;
      var startedCount = eventList.filter(function(evt) { return evt && evt.event_name === 'practice_plan_started'; }).length;
      var recheckCompletedCount = eventList.filter(function(evt) { return evt && evt.event_name === 'spaced_recheck_completed'; }).length;
      var checkinCount = eventList.filter(function(evt) { return evt && evt.event_name === 'practice_checkin_completed'; }).length;
      var transferCount = eventList.filter(function(evt) { return evt && evt.event_name === 'behavior_transfer_logged'; }).length;
      var masteryEvents = eventList.filter(function(evt) { return evt && evt.event_name === 'mastery_verified'; });
      var masteryEventPlanIds = new Set(masteryEvents.map(function(evt) {
        return evt && evt.properties && evt.properties.plan_id ? evt.properties.plan_id : '';
      }).filter(Boolean));

      var masteryPlans = planList.filter(function(plan) {
        if (!plan || !plan.plan_id) return false;
        return masteryEventPlanIds.has(plan.plan_id) || !!(plan.state && plan.state.mastery_verified_at);
      });

      var activePlans = planList.filter(function(plan) {
        if (!plan) return false;
        var status = plan.state && plan.state.status ? plan.state.status : 'generated';
        return status !== 'expired';
      });

      var retentionDue = activePlans.filter(function(plan) {
        return plan && plan.recheck && plan.recheck.due_at;
      }).length;

      var reflectionPlanIds = new Set(reflectionList.map(function(item) {
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
      card.innerHTML =
        '<h3 style="margin-top:0;">Education KPI Snapshot</h3>' +
        '<p style="color:var(--color-text-light);">Activation, adherence, retention, transfer, and mastery quality from the v1 assessment loop.</p>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--space-sm);">' +
          '<p style="margin:0;"><strong>Activation:</strong> ' + Math.round(summary.activationRate * 100) + '%</p>' +
          '<p style="margin:0;"><strong>Adherence:</strong> ' + Math.round(summary.adherenceRate * 100) + '%</p>' +
          '<p style="margin:0;"><strong>Retention:</strong> ' + Math.round(summary.retentionRate * 100) + '%</p>' +
          '<p style="margin:0;"><strong>Transfer:</strong> ' + Math.round(summary.transferRate * 100) + '%</p>' +
          '<p style="margin:0;"><strong>Mastery quality:</strong> ' + Math.round(summary.masteryQualityRate * 100) + '%</p>' +
        '</div>' +
        '<p style="margin:var(--space-sm) 0 0;color:var(--color-text-light);">' + sampleNote + ' · Mastery verified plans: ' + summary.masteryVerifiedPlans + '.</p>';

      anchor.insertAdjacentElement('afterbegin', card);
    }

    function buildLearningQueue(plans) {
      var list = Array.isArray(plans) ? plans : [];
      var now = Date.now();
      return list.map(function(plan) {
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
      }).filter(Boolean).sort(function(a, b) { return b.priority - a.priority; });
    }

    function verifyMasteryLifecycle(plans) {
      var list = Array.isArray(plans) ? plans : [];
      var reflections = readReflections();
      var changed = false;

      list.forEach(function(plan) {
        if (!plan) return;
        plan.state = plan.state || {};
        if (plan.state.mastery_verified_at) return;

        var hasCompletedRecheck = !!plan.state.recheck_completed_at;
        var hasCheckin = Array.isArray(plan.state.checkins) && plan.state.checkins.length > 0;
        var hasTransferEvidence = reflections.some(function(item) {
          return item && item.plan_id && plan.plan_id && item.plan_id === plan.plan_id && item.reflection_48h;
        });

        var criteriaMet = hasCompletedRecheck && hasCheckin && hasTransferEvidence;
        if (!criteriaMet) return;

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
      var active = list.filter(function(plan) {
        if (!plan) return false;
        var status = plan.state && plan.state.status ? plan.state.status : 'generated';
        return status !== 'expired';
      });
      var verified = active.filter(function(plan) {
        return !!(plan.state && plan.state.mastery_verified_at);
      });
      var pending = active.length - verified.length;

      var card = document.createElement('section');
      card.id = 'dashboard-mastery-verification';
      card.className = 'card';
      card.style.borderLeft = '4px solid var(--module-6)';
      card.style.marginBottom = 'var(--space-lg)';
      card.innerHTML =
        '<h3 style="margin-top:0;">Mastery Verification</h3>' +
        '<p style="color:var(--color-text-light);">Mastery is verified when practice includes check-in evidence, delayed recheck completion, and transfer reflection.</p>' +
        '<div style="display:flex;flex-wrap:wrap;gap:var(--space-md);">' +
          '<p style="margin:0;"><strong>Verified:</strong> ' + verified.length + '</p>' +
          '<p style="margin:0;"><strong>Pending:</strong> ' + pending + '</p>' +
        '</div>' +
        '<p style="margin:var(--space-sm) 0 0;color:var(--color-text-light);"><strong>Rule:</strong> v1_knowledge_recheck_transfer</p>';

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

      var itemsHtml = queue.slice(0, 5).map(function(item, index) {
        return '<li style="margin-bottom:var(--space-sm);">' +
          '<strong>#' + (index + 1) + ' ' + item.focus + '</strong> ' +
          '<span style="color:var(--color-text-muted);">(' + item.source + ' · ' + item.status + ')</span>' +
          '<br><span style="color:var(--color-text-light);">' + item.reason + ' Due: ' + item.dueLabel + '.</span>' +
        '</li>';
      }).join('');

      card.innerHTML =
        '<h3 style="margin-top:0;">Learning Queue</h3>' +
        '<p style="color:var(--color-text-light);">Ranked next-best actions across all active tools.</p>' +
        (itemsHtml
          ? '<ol style="margin:0;padding-left:var(--space-lg);">' + itemsHtml + '</ol>'
          : '<p style="margin:0;color:var(--color-text-light);">No active plans yet. Generate a plan from any assessment to start your queue.</p>');

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
  })();

  (function normalizeInstitutionFooter() {
    var footer = document.querySelector('.footer');
    if (!footer) return;
    var container = footer.querySelector('.container');
    if (!container) return;

    container.innerHTML =
      '<div class="footer__grid footer__grid--institutional">' +
        '<div class="footer__brand footer__brand--institutional">' +
          '<p class="footer__eyebrow">Route Before You Buy</p>' +
          '<a href="index.html" class="nav__logo" style="color:var(--color-white);">' +
            '<div class="nav__logo-icon">EFI</div><span>Executive Functioning Institute</span>' +
          '</a>' +
          '<p>EFI is structured as a decision tree. Visitors should identify their role, use one free tool or route page first, and only move to paid review when the next step is already obvious.</p>' +
          '<ul class="footer__dossier">' +
            '<li><span>Step 1</span><strong>Choose a role: parent, educator, or practitioner</strong></li>' +
            '<li><span>Step 2</span><strong>Use the free layer: assessments, toolkits, curriculum, and public standards</strong></li>' +
            '<li><span>Step 3</span><strong>Use reviewed services only when the route and scope are already clear</strong></li>' +
          '</ul>' +
        '</div>' +
        '<div>' +
          '<h4>Audience Routes</h4>' +
          '<ul class="footer__links">' +
            '<li><a href="coaching-home.html">Parents and Families</a></li>' +
            '<li><a href="teacher-to-coach.html">Educators in Transition</a></li>' +
            '<li><a href="certification.html">Professionals and Practitioners</a></li>' +
            '<li><a href="index.html#start-paths">Homepage Router</a></li>' +
          '</ul>' +
        '</div>' +
        '<div>' +
          '<h4>Free Layer</h4>' +
          '<ul class="footer__links">' +
            '<li><a href="resources.html#assessments">Assessments and Tools</a></li>' +
            '<li><a href="resources.html#toolkits">Role-Based Toolkits</a></li>' +
            '<li><a href="curriculum.html">Open Curriculum</a></li>' +
            '<li><a href="resources.html#library">Reference Library</a></li>' +
          '</ul>' +
        '</div>' +
        '<div>' +
          '<h4>Reviewed Next Steps</h4>' +
          '<ul class="footer__links">' +
            '<li><a href="certification.html">Certification Standards</a></li>' +
            '<li><a href="store.html">Reviewed Services and Pricing</a></li>' +
            '<li><a href="coaching-contact.html">Start an Intake Conversation</a></li>' +
            '<li><a href="store.html#paid-path">Free vs Paid Boundary</a></li>' +
          '</ul>' +
        '</div>' +
        '<div>' +
          '<h4>Evidence</h4>' +
          '<ul class="footer__links">' +
            '<li><a href="EFI-Capstone-Transparency-Rubric.pdf" target="_blank" rel="noopener">Capstone Rubric PDF</a></li>' +
            '<li><a href="EFI-Competency-Crosswalk-Map.pdf" target="_blank" rel="noopener">Competency Crosswalk</a></li>' +
            '<li><a href="verify.html">Credential Verification</a></li>' +
            '<li><a href="resources.html#source-access">Source Access Notes</a></li>' +
            '<li><a href="https://github.com/jacobpopcantstop/TheExecutiveFunctioningInstitute" target="_blank" rel="noopener">GitHub Repository</a></li>' +
          '</ul>' +
        '</div>' +
      '</div>' +
      '<div class="footer__bottom">' +
        '<span class="footer__status">Built around Barkley, Brown, Dawson &amp; Guare, and Ward with public routing, standards, and review artifacts.</span>' +
      '</div>';
  })();

  (function injectFooterLegalLinks() {
    var footers = document.querySelectorAll('.footer__bottom');
    if (!footers.length) return;
    footers.forEach(function (footerBottom) {
      if (footerBottom.querySelector('.footer__legal')) return;
      var legal = document.createElement('span');
      legal.className = 'footer__legal';
      legal.innerHTML = '<a href="privacy.html">Privacy</a> &middot; <a href="terms.html">Terms</a> &middot; <a href="verify.html">Verify Certificate</a>';
      footerBottom.appendChild(legal);
    });
  })();

  /* Topic cluster navigation — planned feature, not yet enabled */

  (function normalizePrimaryNav() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage === 'admin.html') return;

    var primaryLinks = [
      { href: 'index.html', label: 'Home' },
      { href: 'curriculum.html', label: 'Curriculum' },
      { href: 'resources.html', label: 'Resources' },
      { href: 'certification.html', label: 'Certification' }
    ];

    var audienceLinks = [
      { href: 'coaching-home.html', label: 'Parents' },
      { href: 'teacher-to-coach.html', label: 'Educators' },
      { href: 'certification.html', label: 'Professionals' }
    ];

    document.querySelectorAll('.nav__links').forEach(function (links) {
      var existingAuth = links.querySelector('.nav__auth');
      var authHtml = existingAuth ? existingAuth.innerHTML : '';
      var html = '<div class="nav__cluster">' +
        '<p class="nav__eyebrow">Explore</p>';

      primaryLinks.forEach(function (item) {
        html += '<a href="' + item.href + '" class="nav__link">' + item.label + '</a>';
      });

      html += '</div><div class="nav__cluster nav__cluster--support">' +
        '<p class="nav__eyebrow">By Audience</p>';

      audienceLinks.forEach(function (item) {
        html += '<a href="' + item.href + '" class="nav__link">' + item.label + '</a>';
      });

      html += '<span class="nav__auth">' + authHtml + '</span>' +
        '<a href="index.html#start-paths" class="nav__link nav__link--cta">Choose Route</a>' +
        '</div>';
      links.innerHTML = html;
    });
  })();

  /* Store visibility injection — planned feature, not yet enabled */

  (function injectFloatingStoreCTA() {
    if (!document.body.hasAttribute('data-enable-floating-store')) return;
    if (window.location.pathname.split('/').pop() === 'store.html') return;
    if (window.location.pathname.split('/').pop() === 'checkout.html') return;
    if (document.querySelector('.floating-store-cta')) return;
    var cta = document.createElement('a');
    cta.href = 'store.html';
    cta.className = 'floating-store-cta';
    cta.textContent = 'Reviewed Services';
    cta.setAttribute('data-analytics-event', 'floating_store_click');
    document.body.appendChild(cta);
  })();

  (function injectSourceAccessReminder() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var sourceHeavy = [
      'module-1.html',
      'module-4.html',
      'module-5.html',
      'barkley-model-guide.html',
      'barkley-vs-brown.html',
      'brown-clusters-tool.html',
      'ward-360-thinking.html'
    ];
    if (sourceHeavy.indexOf(currentPage) === -1) return;
    if (document.querySelector('.source-access-reminder')) return;
    var anchor = document.querySelector('main .sources-block') || document.querySelector('main section:last-of-type .container');
    if (!anchor) return;
    var node = document.createElement('p');
    node.className = 'source-access-reminder';
    node.style.fontSize = '0.9rem';
    node.style.color = 'var(--color-text-muted)';
    node.style.marginTop = 'var(--space-md)';
    node.innerHTML = 'If a source link is unavailable, check <a href="resources.html#source-access">resource access notes</a> for legitimate acquisition paths.';
    anchor.appendChild(node);
  })();

  (function injectGettingStartedPrompts() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage === 'index.html') return;
    if (['resources.html', 'curriculum.html'].indexOf(currentPage) === -1) return;
    if (document.getElementById('getting-started-guide-card')) return;
    var headerContainer = document.querySelector('.page-header .container');
    if (!headerContainer) return;
    var card = document.createElement('div');
    card.id = 'getting-started-guide-card';
    card.className = 'card';
    card.style.marginTop = 'var(--space-xl)';
    card.innerHTML =
      '<h3 style="margin-top:0;">New to EFI?</h3>' +
      '<p style="color:var(--color-text-light);">Use the homepage start paths for parents, educators, and professionals to find the right starting sequence in under 30 minutes.</p>' +
      '<div class="button-group" style="margin-top:var(--space-md);">' +
      '<a href="index.html#start-paths" class="btn btn--primary btn--sm">Open Start Paths</a>' +
      '<a href="esqr.html" class="btn btn--secondary btn--sm">Take Free ESQ-R</a>' +
      '</div>';
    headerContainer.appendChild(card);
  })();

  (function injectSiteGuide() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage !== 'getting-started.html') return;
    // Getting Started already includes a native path selector in the page body.
    // Avoid duplicating it in the header, which can create hover/scroll jitter.
    return;
  })();

  /* Roadmap hub links — planned feature, not yet enabled */

  (function loadAssessmentTools() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (['time-blindness-calibrator.html', 'task-start-friction.html'].indexOf(currentPage) === -1) return;
    if (document.querySelector('script[data-src="js/assessment-tools.js"]')) return;
    var s = document.createElement('script');
    s.src = 'js/assessment-tools.js';
    s.defer = true;
    s.setAttribute('data-src', 'js/assessment-tools.js');
    document.head.appendChild(s);
  })();

  (function loadModuleEnhancements() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var isModulePage = /^module-(1|2|3|4|5|6|a-neuroscience|b-pedagogy|c-interventions)\.html$/.test(currentPage);
    if (!isModulePage && currentPage !== 'curriculum.html') return;
    if (document.querySelector('script[data-src="js/module-enhancements.js"]')) return;
    var s = document.createElement('script');
    s.src = 'js/module-enhancements.js';
    s.defer = true;
    s.setAttribute('data-src', 'js/module-enhancements.js');
    document.head.appendChild(s);
  })();

  (function reduceEnrollButtons() {
    return;
  })();

  (function enforceCtaGovernance() {
    return;
  })();

  (function injectBrokenLinkReportButtons() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (['404.html', 'resources.html'].indexOf(currentPage) === -1) return;
    if (document.getElementById('report-broken-link-btn')) return;

    var anchor = document.querySelector('.page-header .container') || document.querySelector('main .container');
    if (!anchor) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'report-broken-link-btn';
    btn.className = 'btn btn--secondary btn--sm';
    btn.style.marginTop = 'var(--space-md)';
    btn.textContent = 'Report Broken Link';
    anchor.appendChild(btn);

    var status = document.createElement('p');
    status.id = 'report-broken-link-status';
    status.style.marginTop = 'var(--space-sm)';
    status.style.color = 'var(--color-text-muted)';
    anchor.appendChild(status);

    btn.addEventListener('click', function () {
      btn.disabled = true;
      var payload = {
        event_name: 'broken_link_report',
        page: currentPage,
        source: 'manual_report',
        properties: {
          referrer: document.referrer || '',
          location: window.location.href
        }
      };
      if (!canPostTracking()) {
        status.textContent = 'Tracking is unavailable on this host. Please report the issue directly.';
        btn.disabled = false;
        return;
      }
      fetch('/api/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function () {
        status.textContent = 'Thanks. The broken link report was submitted.';
      }).catch(function () {
        status.textContent = 'Could not send report right now. Please try again.';
      }).finally(function () {
        btn.disabled = false;
      });
    });
  })();


  /* --- Dark Mode Toggle --- */
  (function () {
    var THEME_KEY = 'efi_theme';

    // Create toggle button in nav
    var navInner = document.querySelector('.nav__inner');
    if (navInner) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dark-toggle';
      btn.setAttribute('aria-label', 'Toggle dark mode');
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      btn.textContent = isDark ? '\u2600' : '\u263E';
      btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';

      btn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme');
        var next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        safeSetLocalStorage(THEME_KEY, next);
        btn.textContent = next === 'dark' ? '\u2600' : '\u263E';
        btn.title = next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
      });

      // Insert before the mobile toggle button
      var mobileToggle = navInner.querySelector('.nav__toggle');
      if (mobileToggle) {
        navInner.insertBefore(btn, mobileToggle);
      } else {
        navInner.appendChild(btn);
      }
    }
  })();

  /* --- SVG Icon Templates --- */
  var hamburgerSVG = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
  var closeSVG = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  /* --- Mobile Navigation Toggle --- */
  var navToggle = document.querySelector('.nav__toggle');
  var navLinks = document.querySelector('.nav__links');

  function closeNav() {
    if (navToggle && navLinks) {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.innerHTML = hamburgerSVG;
    }
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.contains('open');
      if (isOpen) {
        closeNav();
      } else {
        navLinks.classList.add('open');
        navToggle.setAttribute('aria-expanded', 'true');
        navToggle.innerHTML = closeSVG;
      }
    });

    // Close nav when clicking a link
    navLinks.querySelectorAll('.nav__link').forEach(function (link) {
      link.addEventListener('click', function () {
        closeNav();
      });
    });

    // Close nav on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        closeNav();
        navToggle.focus();
      }
    });

    // Close nav when clicking outside
    document.addEventListener('click', function (e) {
      if (!navLinks.classList.contains('open')) return;
      if (navLinks.contains(e.target) || navToggle.contains(e.target)) return;
      closeNav();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900 && navLinks.classList.contains('open')) {
        closeNav();
      }
    });

    window.addEventListener('scroll', function () {
      if (navLinks.classList.contains('open')) {
        closeNav();
      }
    }, { passive: true });
  }

  (function initLogoWave() {
    var logo = document.querySelector('.nav .nav__logo');
    if (!logo) return;

    logo.addEventListener('click', function (e) {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      var href = logo.getAttribute('href');
      if (!href) return;

      var rect = logo.getBoundingClientRect();
      var wave = document.createElement('span');
      wave.className = 'nav-pixel-wave';
      var centerX = Math.round(rect.left + rect.width / 2);
      var centerY = Math.round(rect.top + rect.height / 2);
      wave.style.setProperty('--wave-x', centerX + 'px');
      wave.style.setProperty('--wave-y', centerY + 'px');
      var savedDir = localStorage.getItem('efi_wave_direction');
      var direction = savedDir === '-1' ? -1 : 1;
      safeSetLocalStorage('efi_wave_direction', String(direction));
      var count = 20;
      var baseRadius = 10;
      var travel = 56;
      for (var i = 0; i < count; i += 1) {
        var px = document.createElement('span');
        px.className = 'nav-pixel';
        var theta = (Math.PI * 2 * i / count) * direction;
        var dx = Math.cos(theta) * travel;
        var dy = Math.sin(theta) * travel;
        var startX = Math.cos(theta) * baseRadius;
        var startY = Math.sin(theta) * baseRadius;
        px.style.left = (centerX + startX) + 'px';
        px.style.top = (centerY + startY) + 'px';
        px.style.setProperty('--dx', dx + 'px');
        px.style.setProperty('--dy', dy + 'px');
        px.style.setProperty('--burst-delay', (i % 5) * 14 + 'ms');
        wave.appendChild(px);
      }
      document.body.appendChild(wave);

      var currentPage = window.location.pathname.split('/').pop() || 'index.html';
      if (currentPage !== href) {
        e.preventDefault();
        setTimeout(function () {
          window.location.href = href;
        }, 210);
      }

      setTimeout(function () { wave.remove(); }, 760);
    });
  })();

  /* --- Sticky Nav Shadow + Back-to-Top (single throttled scroll handler) --- */
  var nav = document.querySelector('.nav');
  var backToTop = document.querySelector('.back-to-top');
  var ticking = false;

  function onScroll() {
    if (nav) {
      nav.classList.toggle('scrolled', window.scrollY > 10);
    }
    if (backToTop) {
      backToTop.classList.toggle('visible', window.scrollY > 500);
    }
    ticking = false;
  }

  if (nav || backToTop) {
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });
  }

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* --- Page Transitions --- */
  (function initPageTransitions() {
    if (!document.body) return;
    var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    var leaveTimer = null;

    requestAnimationFrame(function () {
      document.body.classList.add('page-ready');
    });

    window.addEventListener('pageshow', function () {
      if (leaveTimer) {
        window.clearTimeout(leaveTimer);
        leaveTimer = null;
      }
      document.body.classList.remove('page-is-leaving');
      document.body.classList.add('page-ready');
    });

    document.addEventListener('click', function (e) {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      var link = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!link) return;
      if (link.hasAttribute('download')) return;
      if ((link.getAttribute('target') || '').toLowerCase() === '_blank') return;
      if (link.classList.contains('btn')) return;
      if (link.closest('.accordion__content, form, .tool-panel, .resources-assessment-layout, .resources-role-layout')) return;

      var rawHref = link.getAttribute('href');
      if (!rawHref || rawHref.charAt(0) === '#') return;
      if (/^(mailto:|tel:|javascript:)/i.test(rawHref)) return;

      var url;
      try {
        url = new URL(link.href, window.location.href);
      } catch (err) {
        return;
      }

      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;

      e.preventDefault();
      document.body.classList.add('page-is-leaving');
      if (leaveTimer) window.clearTimeout(leaveTimer);
      leaveTimer = window.setTimeout(function () {
        document.body.classList.remove('page-is-leaving');
      }, 900);

      window.setTimeout(function () {
        window.location.href = url.href;
      }, 180);
    });
  })();

  /* --- Accordion --- */
  document.querySelectorAll('.accordion').forEach(function (accordion) {
    var headers = accordion.querySelectorAll('.accordion__header');

    headers.forEach(function (header, index) {
      // Ensure ARIA attributes
      var item = header.closest('.accordion__item');
      var body = item ? item.querySelector('.accordion__body') : null;
      if (!body) return;

      // Generate IDs if missing
      if (!header.id) header.id = 'accordion-header-' + Math.random().toString(36).substr(2, 6);
      if (!body.id) body.id = 'accordion-panel-' + Math.random().toString(36).substr(2, 6);

      header.setAttribute('role', 'button');
      header.setAttribute('aria-controls', body.id);
      header.setAttribute('tabindex', '0');
      body.setAttribute('role', 'region');
      body.setAttribute('aria-labelledby', header.id);

      var isActive = item.classList.contains('active');
      header.setAttribute('aria-expanded', isActive ? 'true' : 'false');

      function toggleAccordion() {
        var isCurrentlyActive = item.classList.contains('active');
        var content = item.querySelector('.accordion__content');

        // Close all others in the same accordion
        accordion.querySelectorAll('.accordion__item').forEach(function (otherItem) {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            var otherBody = otherItem.querySelector('.accordion__body');
            var otherHeader = otherItem.querySelector('.accordion__header');
            if (otherBody) otherBody.style.maxHeight = '0';
            if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle current
        if (isCurrentlyActive) {
          item.classList.remove('active');
          body.style.maxHeight = '0';
          header.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('active');
          body.style.maxHeight = (content ? content.scrollHeight : body.scrollHeight) + 'px';
          header.setAttribute('aria-expanded', 'true');
        }
      }

      header.addEventListener('click', toggleAccordion);
      header.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleAccordion();
        }
        // Arrow key navigation between accordion headers
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          var nextIndex = e.key === 'ArrowDown'
            ? (index + 1) % headers.length
            : (index - 1 + headers.length) % headers.length;
          headers[nextIndex].focus();
        }
        if (e.key === 'Home') {
          e.preventDefault();
          headers[0].focus();
        }
        if (e.key === 'End') {
          e.preventDefault();
          headers[headers.length - 1].focus();
        }
      });
    });
  });

  /* --- Tabs --- */
  document.querySelectorAll('.tabs').forEach(function (tabGroup) {
    var tabList = tabGroup.querySelector('.tabs__list');
    var buttons = tabGroup.querySelectorAll('.tabs__btn');
    var panels = tabGroup.querySelectorAll('.tabs__panel');

    if (!tabList || buttons.length === 0) return;

    // Set ARIA roles
    tabList.setAttribute('role', 'tablist');

    buttons.forEach(function (btn, index) {
      var target = btn.getAttribute('data-tab');
      var panel = tabGroup.querySelector('[data-panel="' + target + '"]');

      // Generate IDs if missing
      if (!btn.id) btn.id = 'tab-' + Math.random().toString(36).substr(2, 6);
      if (panel && !panel.id) panel.id = 'tabpanel-' + Math.random().toString(36).substr(2, 6);

      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-controls', panel ? panel.id : '');
      if (panel) {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', btn.id);
        panel.setAttribute('tabindex', '0');
      }

      var isActive = btn.classList.contains('active');
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      btn.setAttribute('tabindex', isActive ? '0' : '-1');

      btn.addEventListener('click', function () {
        activateTab(tabGroup, buttons, panels, index);
      });

      btn.addEventListener('keydown', function (e) {
        var nextIndex;
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          nextIndex = (index + 1) % buttons.length;
          activateTab(tabGroup, buttons, panels, nextIndex);
          buttons[nextIndex].focus();
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          nextIndex = (index - 1 + buttons.length) % buttons.length;
          activateTab(tabGroup, buttons, panels, nextIndex);
          buttons[nextIndex].focus();
        }
        if (e.key === 'Home') {
          e.preventDefault();
          activateTab(tabGroup, buttons, panels, 0);
          buttons[0].focus();
        }
        if (e.key === 'End') {
          e.preventDefault();
          var last = buttons.length - 1;
          activateTab(tabGroup, buttons, panels, last);
          buttons[last].focus();
        }
      });
    });
  });

  function activateTab(tabGroup, buttons, panels, activeIndex) {
    buttons.forEach(function (b, i) {
      var isActive = i === activeIndex;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      b.setAttribute('tabindex', isActive ? '0' : '-1');
    });
    panels.forEach(function (p) {
      p.classList.remove('active');
    });
    var target = buttons[activeIndex].getAttribute('data-tab');
    var panel = tabGroup.querySelector('[data-panel="' + target + '"]');
    if (panel) panel.classList.add('active');
  }

  /* --- Scroll Reveal Animation --- */
  if ('IntersectionObserver' in window) {
    var observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    var fadeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(function (el) {
      fadeObserver.observe(el);
    });

    // Stagger children
    var staggerObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var children = entry.target.children;
          Array.from(children).forEach(function (child, i) {
            setTimeout(function () {
              child.classList.add('visible');
            }, i * 100);
          });
          staggerObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.stagger').forEach(function (el) {
      staggerObserver.observe(el);
    });
  } else {
    // Fallback: show everything immediately
    document.querySelectorAll('.fade-in, .stagger > *').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* --- Active nav link highlighting --- */
  highlightActiveNavLinks();

  /* --- Enrollment / Contact Form Handler --- */
  var form = document.getElementById('contact-form') || document.getElementById('enroll-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"], .btn');
      if (!btn) return;
      var originalText = btn.textContent;
      btn.textContent = 'Submitted! Thank you.';
      btn.disabled = true;
      setTimeout(function () {
        btn.textContent = originalText;
        btn.disabled = false;
        form.reset();
      }, 3000);
    });
  }

});
