/**
 * Cohort Analytics Views
 * Operator / Curriculum / Coaching KPI slices for the admin workspace.
 */
(function () {
  'use strict';

  var PLANS_KEY = 'efi_action_plans_v1';
  var EVENTS_KEY = 'efi_assessment_events_v1';
  var REFLECTIONS_KEY = 'efi_reflections_v1';

  var TOOL_LABELS = {
    module_quiz: 'Module Quiz',
    esqr: 'ESQ-R',
    time_calibrator: 'Time Calibrator',
    task_friction: 'Task Friction',
    ef_story: 'EF Profile Story',
    full_profile: 'Full Profile'
  };

  var MODULE_LABELS = {
    'module-1': 'Module 1: Neuropsychology',
    'module-2': 'Module 2: Assessment',
    'module-3': 'Module 3: Coaching Architecture',
    'module-4': 'Module 4: Applied Methods',
    'module-5': 'Module 5: Special Populations',
    'module-6': 'Module 6: Ethics'
  };

  function readAll() {
    function parse(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; } }
    return {
      plans: parse(PLANS_KEY),
      events: parse(EVENTS_KEY),
      reflections: parse(REFLECTIONS_KEY)
    };
  }

  function pct(n, d) {
    if (!d) return '\u2014';
    return Math.round((n / d) * 100) + '%';
  }

  function kpiFor(plans, events, reflections) {
    var generated = events.filter(function (e) { return e && e.event_name === 'practice_plan_generated'; }).length;
    var started = events.filter(function (e) { return e && e.event_name === 'practice_plan_started'; }).length;
    var checkins = events.filter(function (e) { return e && e.event_name === 'practice_checkin_completed'; }).length;
    var rechecksDone = events.filter(function (e) { return e && e.event_name === 'spaced_recheck_completed'; }).length;
    var transferEvents = events.filter(function (e) { return e && e.event_name === 'behavior_transfer_logged'; }).length;
    var masteryEvents = events.filter(function (e) { return e && e.event_name === 'mastery_verified'; }).length;

    var activePlans = plans.filter(function (p) {
      return p && p.state && p.state.status !== 'expired';
    });
    var recheckDue = activePlans.filter(function (p) { return p.recheck && p.recheck.due_at; }).length;

    var reflPlanIds = new Set(reflections.map(function (r) { return r && r.plan_id ? r.plan_id : ''; }).filter(Boolean));

    return {
      generated: generated,
      activation: pct(started, generated),
      adherence: pct(checkins, started),
      recheck: pct(rechecksDone, recheckDue),
      transfer: pct(reflPlanIds.size, activePlans.length),
      mastery: pct(masteryEvents, started)
    };
  }

  function kpiRow(label, k) {
    return '<tr>' +
      '<td><strong>' + label + '</strong></td>' +
      '<td>' + k.generated + '</td>' +
      '<td>' + k.activation + '</td>' +
      '<td>' + k.adherence + '</td>' +
      '<td>' + k.recheck + '</td>' +
      '<td>' + k.transfer + '</td>' +
      '<td>' + k.mastery + '</td>' +
      '</tr>';
  }

  function tableWrap(rows, caption) {
    if (!rows.length) return '<p style="color:var(--color-text-muted);">No data recorded yet.</p>';
    return '<p style="color:var(--color-text-light);font-size:0.85rem;margin-bottom:var(--space-sm);">' + caption + '</p>' +
      '<div class="table-wrapper">' +
      '<table>' +
      '<thead><tr>' +
      '<th>Slice</th><th>Plans</th>' +
      '<th>Activation</th><th>Adherence</th>' +
      '<th>Recheck</th><th>Transfer</th><th>Mastery</th>' +
      '</tr></thead>' +
      '<tbody>' + rows.join('') + '</tbody>' +
      '</table>' +
      '</div>';
  }

  function operatorSlice(data) {
    var allKpi = kpiFor(data.plans, data.events, data.reflections);
    var tools = Object.keys(TOOL_LABELS);
    var rows = [];

    // Auth-state slice
    ['authenticated', 'anonymous'].forEach(function (authState) {
      var isAuth = authState === 'authenticated';
      var authEvents = data.events.filter(function (e) { return e && e.authenticated === isAuth; });
      if (!authEvents.length) return;
      var authPlanIds = new Set(authEvents.map(function (e) {
        return e.properties && e.properties.plan_id ? e.properties.plan_id : '';
      }).filter(Boolean));
      var authPlans = data.plans.filter(function (p) { return p && authPlanIds.has(p.plan_id); });
      var authReflections = data.reflections.filter(function (r) {
        return r && authPlanIds.has(r.plan_id || '');
      });
      rows.push(kpiRow((isAuth ? '\u{1F512} Authenticated' : '\u{1F310} Anonymous'), kpiFor(authPlans, authEvents, authReflections)));
    });

    tools.forEach(function (tool) {
      var toolPlans = data.plans.filter(function (p) { return p && p.source_tool === tool; });
      if (!toolPlans.length) return;
      var toolEvents = data.events.filter(function (e) {
        return e && e.properties && e.properties.source_tool === tool;
      });
      var toolReflections = data.reflections.filter(function (r) { return r && r.source_tool === tool; });
      rows.push(kpiRow(TOOL_LABELS[tool] || tool, kpiFor(toolPlans, toolEvents, toolReflections)));
    });

    rows.push('<tr style="border-top:2px solid var(--color-border);">' +
      '<td><strong>All tools</strong></td>' +
      '<td>' + allKpi.generated + '</td>' +
      '<td>' + allKpi.activation + '</td>' +
      '<td>' + allKpi.adherence + '</td>' +
      '<td>' + allKpi.recheck + '</td>' +
      '<td>' + allKpi.transfer + '</td>' +
      '<td>' + allKpi.mastery + '</td>' +
      '</tr>');

    return tableWrap(rows.filter(function (r) { return !r.includes('All tools'); }).length ? rows : [],
      'KPIs by source tool. Activation = plans started / plans generated. Adherence = check-ins / plans started.');
  }

  function curriculumSlice(data) {
    var modules = Object.keys(MODULE_LABELS);
    var rows = [];

    modules.forEach(function (moduleId) {
      var modPlans = data.plans.filter(function (p) {
        return p && p.source_context && p.source_context.module_id === moduleId;
      });
      if (!modPlans.length) return;
      var modEvents = data.events.filter(function (e) {
        return e && e.properties && (e.properties.module_id === moduleId || e.properties.source_tool === 'module_quiz');
      });
      var modReflections = data.reflections.filter(function (r) { return r && r.module_id === moduleId; });
      rows.push(kpiRow(MODULE_LABELS[moduleId] || moduleId, kpiFor(modPlans, modEvents, modReflections)));
    });

    return tableWrap(rows,
      'KPIs by module. Only module_quiz plans are tagged with a specific module_id.');
  }

  function coachingSlice(data) {
    var coachingTools = ['esqr', 'module_quiz'];
    var rows = [];

    var adhStates = ['Strong adherence', 'Building consistency', 'Needs support'];
    adhStates.forEach(function (label) {
      var statePlans = data.plans.filter(function (p) {
        if (!p || !p.state) return false;
        var checkins = Array.isArray(p.state.checkins) ? p.state.checkins : [];
        var active = p.state.status !== 'expired';
        var engaged = p.state.status === 'started' || p.state.status === 'checkin_completed' || p.state.status === 'completed';
        if (!active) return false;
        // categorise by individual plan's check-in rate as proxy for adherence label
        if (label === 'Strong adherence') return engaged && checkins.length >= 3;
        if (label === 'Building consistency') return engaged && checkins.length >= 1 && checkins.length < 3;
        return !engaged || checkins.length === 0;
      });
      if (!statePlans.length) return;
      var planIds = new Set(statePlans.map(function (p) { return p.plan_id; }));
      var stateEvents = data.events.filter(function (e) {
        return e && e.properties && e.properties.plan_id && planIds.has(e.properties.plan_id);
      });
      var stateReflections = data.reflections.filter(function (r) { return r && r.plan_id && planIds.has(r.plan_id); });
      rows.push(kpiRow(label, kpiFor(statePlans, stateEvents, stateReflections)));
    });

    // Also show coaching-tool breakdown
    coachingTools.forEach(function (tool) {
      var toolPlans = data.plans.filter(function (p) { return p && p.source_tool === tool; });
      if (!toolPlans.length) return;
      var toolEvents = data.events.filter(function (e) {
        return e && e.properties && e.properties.source_tool === tool;
      });
      var toolReflections = data.reflections.filter(function (r) { return r && r.source_tool === tool; });
      rows.push(kpiRow((TOOL_LABELS[tool] || tool) + ' (tool)', kpiFor(toolPlans, toolEvents, toolReflections)));
    });

    return tableWrap(rows,
      'Adherence-state rows classify individual plans by check-in count. Tool rows show coaching-tool KPIs directly.');
  }

  function renderTabs(container, data) {
    var tabs = [
      { id: 'operator', label: 'Operator', content: operatorSlice(data) },
      { id: 'curriculum', label: 'Curriculum', content: curriculumSlice(data) },
      { id: 'coaching', label: 'Coaching', content: coachingSlice(data) }
    ];

    var tabBtnHtml = tabs.map(function (t, i) {
      return '<button type="button" class="btn btn--secondary btn--sm" ' +
        'id="cohort-tab-btn-' + t.id + '" ' +
        'aria-selected="' + (i === 0 ? 'true' : 'false') + '" ' +
        'style="' + (i === 0 ? 'font-weight:700;' : '') + '">' +
        t.label + '</button>';
    }).join('');

    var tabPanelHtml = tabs.map(function (t, i) {
      return '<div id="cohort-panel-' + t.id + '" role="tabpanel" ' +
        (i === 0 ? '' : 'hidden') + ' style="margin-top:var(--space-md);">' +
        t.content +
        '</div>';
    }).join('');

    container.innerHTML =
      '<h2 style="margin-top:0;">Cohort Analytics</h2>' +
      '<p style="color:var(--color-text-light);">KPI views aggregated from local assessment event and plan data. ' +
      'Values reflect the data in this browser session. Production cohort analytics require server-side aggregation.</p>' +
      '<div class="button-group" style="margin-bottom:var(--space-md);" role="tablist">' + tabBtnHtml + '</div>' +
      tabPanelHtml;

    tabs.forEach(function (t) {
      var btn = container.querySelector('#cohort-tab-btn-' + t.id);
      if (!btn) return;
      btn.addEventListener('click', function () {
        tabs.forEach(function (other) {
          var ob = container.querySelector('#cohort-tab-btn-' + other.id);
          var op = container.querySelector('#cohort-panel-' + other.id);
          if (ob) { ob.removeAttribute('aria-selected'); ob.style.fontWeight = ''; }
          if (op) op.hidden = true;
        });
        btn.setAttribute('aria-selected', 'true');
        btn.style.fontWeight = '700';
        var panel = container.querySelector('#cohort-panel-' + t.id);
        if (panel) panel.hidden = false;
      });
    });
  }

  function init() {
    var container = document.getElementById('cohort-analytics-container');
    if (!container) return;
    var data = readAll();
    renderTabs(container, data);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
