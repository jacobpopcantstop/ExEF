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

  function clearNode(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function appendParagraph(container, text, styles) {
    var p = document.createElement('p');
    if (styles) Object.keys(styles).forEach(function (key) { p.style[key] = styles[key]; });
    p.textContent = text;
    container.appendChild(p);
    return p;
  }

  function renderScenario(container, scenario, moduleId, index, total) {
    var card = document.createElement('div');
    card.className = 'card';
    card.style.marginTop = index > 0 ? 'var(--space-lg)' : '0';
    card.style.borderLeft = '4px solid var(--color-accent)';

    var progressText = 'Scenario ' + (index + 1) + ' of ' + total;
    appendParagraph(card, progressText, {
      margin: '0 0 var(--space-xs) 0',
      fontSize: '0.85rem',
      color: 'var(--color-text-muted)'
    });

    var title = document.createElement('h5');
    title.style.marginTop = '0';
    title.textContent = 'Situation';
    card.appendChild(title);

    appendParagraph(card, scenario.situation);

    var questionP = document.createElement('p');
    questionP.style.marginTop = 'var(--space-md)';
    var questionStrong = document.createElement('strong');
    questionStrong.textContent = scenario.question;
    questionP.appendChild(questionStrong);
    card.appendChild(questionP);

    var branchesDiv = document.createElement('div');
    branchesDiv.id = 'scenario-branches-' + scenario.id;
    branchesDiv.style.display = 'flex';
    branchesDiv.style.flexDirection = 'column';
    branchesDiv.style.gap = 'var(--space-sm)';
    branchesDiv.style.marginTop = 'var(--space-sm)';
    scenario.branches.forEach(function (branch, bi) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn--secondary btn--sm';
      button.setAttribute('data-scenario-id', scenario.id);
      button.setAttribute('data-branch-index', String(bi));
      button.style.textAlign = 'left';
      button.style.whiteSpace = 'normal';
      button.textContent = branch.label;
      branchesDiv.appendChild(button);
    });
    card.appendChild(branchesDiv);

    var outcomeDiv = document.createElement('div');
    outcomeDiv.id = 'scenario-outcome-' + scenario.id;
    outcomeDiv.hidden = true;
    outcomeDiv.style.marginTop = 'var(--space-md)';
    card.appendChild(outcomeDiv);
    container.appendChild(card);

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

      clearNode(outcomeDiv);
      appendParagraph(outcomeDiv, qualityLabel(branch.quality), {
        margin: '0 0 var(--space-xs) 0',
        fontWeight: '700',
        color: qualityColor(branch.quality)
      });
      appendParagraph(outcomeDiv, branch.outcome, {
        margin: '0 0 var(--space-xs) 0'
      });
      var actionP = document.createElement('p');
      actionP.style.margin = '0 0 var(--space-xs) 0';
      var actionStrong = document.createElement('strong');
      actionStrong.textContent = 'Practice move:';
      actionP.appendChild(actionStrong);
      actionP.appendChild(document.createTextNode(' ' + branch.action));
      outcomeDiv.appendChild(actionP);
      var divider = document.createElement('hr');
      divider.style.margin = 'var(--space-sm) 0';
      divider.style.border = 'none';
      divider.style.borderTop = '1px solid var(--color-border)';
      outcomeDiv.appendChild(divider);
      appendParagraph(outcomeDiv, scenario.reflection, {
        margin: '0',
        fontStyle: 'italic',
        color: 'var(--color-text-light)'
      });
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
    clearNode(container);

    var header = document.createElement('div');
    var heading = document.createElement('h4');
    heading.style.marginTop = '0';
    heading.textContent = moduleData.title;
    header.appendChild(heading);
    appendParagraph(header, moduleData.description, {
      color: 'var(--color-text-light)',
      marginBottom: 'var(--space-md)'
    });
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
        clearNode(container);
        appendParagraph(container, 'Scenario simulations could not load. Refresh to try again.', {
          color: 'var(--color-text-muted)'
        });
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
