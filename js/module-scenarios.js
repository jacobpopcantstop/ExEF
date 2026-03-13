/**
 * Module Scenario Simulations
 * Branching coaching-decision scenarios for Modules 2, 3, and 4.
 */
(function () {
  'use strict';

  var SCENARIO_DATA_URL = '/data/module-scenarios.json';
  var SCENARIO_STORAGE_KEY = 'efi_module_scenarios_v1';

  function getModuleId() {
    var container = document.getElementById('module-scenario');
    if (container && container.getAttribute('data-module-id')) {
      return container.getAttribute('data-module-id');
    }
    var match = window.location.pathname.match(/(module-\d+)/);
    return match ? match[1] : null;
  }

  function readScenarioHistory() {
    try { return JSON.parse(localStorage.getItem(SCENARIO_STORAGE_KEY)) || []; } catch (e) { return []; }
  }

  function saveScenarioResult(result) {
    var history = readScenarioHistory();
    history.push(result);
    try { localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(history.slice(-100))); } catch (e) {}
  }

  function trackEvent(name, props) {
    if (window.EFI && window.EFI.Analytics && typeof window.EFI.Analytics.track === 'function') {
      window.EFI.Analytics.track(name, props || {});
    }
  }

  function qualityLabel(quality) {
    if (quality === 'best') return '\u2714 Best approach';
    if (quality === 'acceptable') return '\u26a0 Acceptable\u2014but read why';
    return '\u2716 Incorrect\u2014see the principle';
  }

  function qualityColor(quality) {
    if (quality === 'best') return 'var(--color-success, #2e7d32)';
    if (quality === 'acceptable') return 'var(--color-warning, #e65100)';
    return 'var(--color-error, #c62828)';
  }

  function renderScenario(container, scenario, moduleId, index, total) {
    var card = document.createElement('div');
    card.className = 'card';
    card.style.marginTop = index > 0 ? 'var(--space-lg)' : '0';
    card.style.borderLeft = '4px solid var(--color-accent)';

    var progressText = 'Scenario ' + (index + 1) + ' of ' + total;

    var html =
      '<p style="margin:0 0 var(--space-xs) 0;font-size:0.85rem;color:var(--color-text-muted);">' + progressText + '</p>' +
      '<h5 style="margin-top:0;">Situation</h5>' +
      '<p>' + scenario.situation + '</p>' +
      '<p style="margin-top:var(--space-md);"><strong>' + scenario.question + '</strong></p>' +
      '<div id="scenario-branches-' + scenario.id + '" style="display:flex;flex-direction:column;gap:var(--space-sm);margin-top:var(--space-sm);">';

    scenario.branches.forEach(function (branch, bi) {
      html += '<button type="button" class="btn btn--secondary btn--sm" ' +
        'data-scenario-id="' + scenario.id + '" ' +
        'data-branch-index="' + bi + '" ' +
        'style="text-align:left;white-space:normal;">' +
        branch.label + '</button>';
    });

    html += '</div>' +
      '<div id="scenario-outcome-' + scenario.id + '" hidden style="margin-top:var(--space-md);"></div>';

    card.innerHTML = html;
    container.appendChild(card);

    var branchesDiv = card.querySelector('#scenario-branches-' + scenario.id);
    var outcomeDiv = card.querySelector('#scenario-outcome-' + scenario.id);

    branchesDiv.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-branch-index]');
      if (!btn) return;
      var bi = parseInt(btn.getAttribute('data-branch-index'), 10);
      var branch = scenario.branches[bi];
      if (!branch) return;

      Array.from(branchesDiv.querySelectorAll('button')).forEach(function (b) {
        b.disabled = true;
        b.style.opacity = '0.5';
      });
      btn.style.opacity = '1';
      btn.style.fontWeight = '600';

      var outcomeHtml =
        '<p style="margin:0 0 var(--space-xs) 0;font-weight:700;color:' + qualityColor(branch.quality) + ';">' +
          qualityLabel(branch.quality) +
        '</p>' +
        '<p style="margin:0 0 var(--space-xs) 0;">' + branch.outcome + '</p>' +
        '<p style="margin:0 0 var(--space-xs) 0;"><strong>Practice move:</strong> ' + branch.action + '</p>' +
        '<hr style="margin:var(--space-sm) 0;border:none;border-top:1px solid var(--color-border);">' +
        '<p style="margin:0;font-style:italic;color:var(--color-text-light);">' + scenario.reflection + '</p>';

      outcomeDiv.innerHTML = outcomeHtml;
      outcomeDiv.hidden = false;

      saveScenarioResult({
        scenario_id: scenario.id,
        module_id: moduleId,
        branch_index: bi,
        quality: branch.quality,
        at: new Date().toISOString()
      });
      trackEvent('scenario_branch_selected', {
        module_id: moduleId,
        scenario_id: scenario.id,
        branch_index: bi,
        quality: branch.quality
      });
    });
  }

  function renderModuleScenarios(container, moduleData, moduleId) {
    container.innerHTML = '';

    var header = document.createElement('div');
    header.innerHTML =
      '<h4 style="margin-top:0;">' + moduleData.title + '</h4>' +
      '<p style="color:var(--color-text-light);margin-bottom:var(--space-md);">' + moduleData.description + '</p>';
    container.appendChild(header);

    var scenarios = moduleData.scenarios || [];
    scenarios.forEach(function (scenario, i) {
      renderScenario(container, scenario, moduleId, i, scenarios.length);
    });
  }

  function init() {
    var moduleId = getModuleId();
    if (!moduleId) return;

    var container = document.getElementById('module-scenario');
    if (!container) return;

    fetch(SCENARIO_DATA_URL)
      .then(function (r) {
        if (!r.ok) throw new Error('scenario data unavailable');
        return r.json();
      })
      .then(function (data) {
        var moduleData = data[moduleId];
        if (!moduleData) return;
        renderModuleScenarios(container, moduleData, moduleId);
      })
      .catch(function () {
        container.innerHTML = '<p style="color:var(--color-text-muted);">Scenario simulations could not load. Refresh to try again.</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
