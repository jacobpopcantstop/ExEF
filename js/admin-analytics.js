/**
 * Admin Analytics — Cohort Analytics Views  (#8)
 *
 * Aggregates data from localStorage keys written by the rest of the app:
 *   efi_assessment_events_v1   — telemetry events (page views, quiz passes, plan actions)
 *   efi_action_plans_v1        — generated practice plans
 *   efi_adherence_v1           — session completion log
 *   efi_intervention_v1        — intervention display/dismiss log
 *   efi_reflections_v1         — 48-hour reflection entries
 *
 * All rendering is client-side; no new API calls are needed.
 * Cross-session aggregation requires users to share the same browser, OR for
 * authenticated events to be pushed to the server (which now carry user_id
 * thanks to the #9 dedupe hardening in main.js).
 */

(function() {
  'use strict';

  // ── Data readers ────────────────────────────────────────────────────────────

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key)) || (key === 'efi_adherence_v1' ? { sessions: [] } : []); } catch (e) { return key === 'efi_adherence_v1' ? { sessions: [] } : []; }
  }

  function readEvents()       { return read('efi_assessment_events_v1'); }
  function readPlans()        { return read('efi_action_plans_v1'); }
  function readAdherence()    { return read('efi_adherence_v1'); }
  function readInterv()       { return read('efi_intervention_v1'); }
  function readReflections()  { return read('efi_reflections_v1'); }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function countByProp(arr, prop) {
    var counts = {};
    arr.forEach(function(item) {
      var val = item && item[prop] ? String(item[prop]) : 'unknown';
      counts[val] = (counts[val] || 0) + 1;
    });
    return counts;
  }

  function pct(num, denom) {
    if (!denom) return '—';
    return Math.round((num / denom) * 100) + '%';
  }

  function statRow(label, value) {
    return '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--color-border);">' +
      '<span>' + label + '</span>' +
      '<strong>' + value + '</strong>' +
      '</div>';
  }

  function sectionTitle(text) {
    return '<p style="font-weight:600;margin:var(--space-sm) 0 var(--space-xs) 0;font-size:0.9rem;">' + text + '</p>';
  }

  // ── Curriculum completion ───────────────────────────────────────────────────

  function buildCurriculumStats() {
    var events = readEvents();
    var plans = readPlans();

    // Page views per module page
    var pageViews = events.filter(function(e) { return e.event_name === 'page_view'; });
    var moduleViews = pageViews.filter(function(e) { return /^module-/.test(e.page || ''); });
    var viewsByModule = countByProp(moduleViews, 'page');

    // Quiz pass/fail derived from practice_plan_generated events (which carry module_id + passed implied by cadence)
    var planEvents = events.filter(function(e) { return e.event_name === 'practice_plan_generated'; });

    // Distinct modules with a plan generated = quiz was completed (passed or not)
    var completedModules = {};
    planEvents.forEach(function(e) {
      var mid = e.properties && e.properties.module_id ? e.properties.module_id : 'unknown';
      completedModules[mid] = (completedModules[mid] || 0) + 1;
    });

    // Plans with 7d cadence are passes; 72h are retake-needed
    var passes = plans.filter(function(p) { return p && p.recheck && p.recheck.cadence === '7d'; }).length;
    var retakes = plans.filter(function(p) { return p && p.recheck && p.recheck.cadence === '72h'; }).length;

    var html = sectionTitle('Quiz outcomes (this browser)');
    html += statRow('Total plans generated', plans.length);
    html += statRow('Passing results (7d cadence)', passes);
    html += statRow('Needs-retake results (72h cadence)', retakes);
    html += statRow('Pass rate', pct(passes, plans.length));

    html += sectionTitle('Module page views');
    var moduleKeys = Object.keys(viewsByModule).sort();
    if (moduleKeys.length) {
      moduleKeys.forEach(function(k) {
        html += statRow(k, viewsByModule[k] + ' view' + (viewsByModule[k] === 1 ? '' : 's'));
      });
    } else {
      html += '<p style="color:var(--color-text-muted);font-size:0.85rem;">No module page views recorded yet.</p>';
    }

    html += sectionTitle('Quiz completions by module');
    var completedKeys = Object.keys(completedModules).sort();
    if (completedKeys.length) {
      completedKeys.forEach(function(k) {
        html += statRow(k, completedModules[k] + ' quiz run' + (completedModules[k] === 1 ? '' : 's'));
      });
    } else {
      html += '<p style="color:var(--color-text-muted);font-size:0.85rem;">No quiz completions recorded yet.</p>';
    }

    return html;
  }

  // ── Coaching engagement ─────────────────────────────────────────────────────

  function buildCoachingStats() {
    var events = readEvents();
    var reflections = readReflections();

    var planStarts     = events.filter(function(e) { return e.event_name === 'practice_plan_started'; }).length;
    var checkins       = events.filter(function(e) { return e.event_name === 'practice_checkin_completed'; }).length;
    var transferLogs   = events.filter(function(e) { return e.event_name === 'behavior_transfer_logged'; }).length;
    var rechecksDue    = events.filter(function(e) { return e.event_name === 'spaced_recheck_due'; }).length;

    // Average self-rating from checkin events
    var ratings = [];
    events.forEach(function(e) {
      if (e.event_name === 'practice_checkin_completed' && e.properties && e.properties.self_rating) {
        ratings.push(Number(e.properties.self_rating));
      }
    });
    var avgRating = ratings.length ? (ratings.reduce(function(a, b) { return a + b; }, 0) / ratings.length).toFixed(1) : '—';

    var html = sectionTitle('Plan engagement');
    html += statRow('Plans started', planStarts);
    html += statRow('Check-ins completed', checkins);
    html += statRow('Transfer evidence logs', transferLogs);
    html += statRow('Spaced rechecks triggered', rechecksDue);
    html += statRow('Avg self-rating (1-5)', avgRating + (ratings.length ? ' (' + ratings.length + ' ratings)' : ''));

    html += sectionTitle('Reflections');
    html += statRow('Total reflections saved', reflections.length);

    // Reflections by source tool
    var bySource = countByProp(reflections, 'source_tool');
    Object.keys(bySource).sort().forEach(function(k) {
      html += statRow('  from ' + k, bySource[k]);
    });

    // Authenticated user breakdown (from events carrying user_id via #9)
    var authedEvents = events.filter(function(e) { return e.user_id; });
    var uniqueUsers = {};
    authedEvents.forEach(function(e) { uniqueUsers[e.user_id] = true; });
    var userCount = Object.keys(uniqueUsers).length;

    html += sectionTitle('User attribution');
    html += statRow('Events with user_id attached', authedEvents.length);
    html += statRow('Distinct authenticated users', userCount || '—');

    return html;
  }

  // ── Adherence & intervention signals ───────────────────────────────────────

  function buildAdherenceStats() {
    var adherenceData = readAdherence();
    var sessions = Array.isArray(adherenceData.sessions) ? adherenceData.sessions : [];
    var computed = adherenceData.computed || {};

    var totalSessions = sessions.length;
    var completedSessions = sessions.filter(function(s) { return s.completed; }).length;
    var recentSessions = sessions.slice(-10);
    var recentCompleted = recentSessions.filter(function(s) { return s.completed; }).length;

    var interv = readInterv();
    var intervMeta = (Array.isArray(interv) ? {} : interv) || {};

    var events = readEvents();
    var intervShown    = events.filter(function(e) { return e.event_name === 'low_adherence_intervention_shown'; }).length;
    var intervDismissed = events.filter(function(e) { return e.event_name === 'low_adherence_intervention_dismissed'; }).length;

    var html = sectionTitle('Session adherence');
    html += statRow('Total sessions recorded', totalSessions);
    html += statRow('Completed sessions', completedSessions);
    html += statRow('Overall completion rate', pct(completedSessions, totalSessions));
    html += statRow('Recent 10 sessions completed', recentCompleted + ' / ' + recentSessions.length);
    html += statRow('Current adherence level', computed.level ? computed.level.toUpperCase() : '—');
    html += statRow('Adherence score (0–1)', typeof computed.score === 'number' ? computed.score.toFixed(2) : '—');

    html += sectionTitle('Intervention history');
    html += statRow('Times intervention shown', intervShown);
    html += statRow('Times dismissed', intervDismissed);
    if (intervMeta.last_shown_at) {
      html += statRow('Last shown', new Date(intervMeta.last_shown_at).toLocaleString());
    }
    if (intervMeta.show_count) {
      html += statRow('Total show count (meta)', intervMeta.show_count);
    }

    html += sectionTitle('Module breakdown (last 20 sessions)');
    var byModule = countByProp(sessions.slice(-20), 'moduleId');
    var mkeys = Object.keys(byModule).sort();
    if (mkeys.length) {
      mkeys.forEach(function(k) {
        html += statRow(k || 'unknown', byModule[k] + ' session' + (byModule[k] === 1 ? '' : 's'));
      });
    } else {
      html += '<p style="color:var(--color-text-muted);font-size:0.85rem;">No session data yet.</p>';
    }

    return html;
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  function render() {
    var currEl  = document.getElementById('analytics-curriculum-body');
    var coachEl = document.getElementById('analytics-coaching-body');
    var adhrEl  = document.getElementById('analytics-adherence-body');
    var statusEl = document.getElementById('analytics-refresh-status');

    if (currEl)  currEl.innerHTML  = buildCurriculumStats();
    if (coachEl) coachEl.innerHTML = buildCoachingStats();
    if (adhrEl)  adhrEl.innerHTML  = buildAdherenceStats();
    if (statusEl) statusEl.textContent = 'Last refreshed: ' + new Date().toLocaleTimeString();
  }

  document.addEventListener('DOMContentLoaded', function() {
    // Only initialise on admin page
    if (!document.getElementById('analytics-curriculum-body')) return;

    render();

    var refreshBtn = document.getElementById('analytics-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function() { render(); });
    }
  });
})();
