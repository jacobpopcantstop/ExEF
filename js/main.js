/* ============================================
   The Executive Functioning Institute
   Main JavaScript
   ============================================ */

/* Apply saved theme immediately to prevent flash */
(function () {
  var saved = localStorage.getItem('efi_theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
})();

document.addEventListener('DOMContentLoaded', function () {

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
      if (!window.fetch) return Promise.resolve();
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
      localStorage.setItem(KEY, JSON.stringify(list.slice(-50)));
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
    function post(payload) {
      if (!window.fetch) return Promise.resolve();
      return fetch('/api/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function () {});
    }

    function track(eventName, properties) {
      var page = window.location.pathname.split('/').pop() || 'index.html';
      var params = new URLSearchParams(window.location.search || '');
      var source = params.get('utm_source') || params.get('source') || document.referrer || 'direct';
      return post({
        event_name: eventName,
        page: page,
        source: source,
        properties: properties || {}
      });
    }

    window.EFI.Analytics = {
      track: track
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
      { href: 'about.html', label: 'About' },
      { href: 'curriculum.html', label: 'Curriculum' },
      { href: 'resources.html', label: 'Resources' },
      { href: 'coaching-home.html', label: 'Coaching' },
      { href: 'store.html', label: 'Store' },
      { href: 'certification.html', label: 'Certification' }
    ];

    document.querySelectorAll('.nav__links').forEach(function (links) {
      var existingAuth = links.querySelector('.nav__auth');
      var authHtml = existingAuth ? existingAuth.innerHTML : '';
      var html = '';

      primaryLinks.forEach(function (item) {
        html += '<a href="' + item.href + '" class="nav__link">' + item.label + '</a>';
      });

      html += '<span class="nav__auth">' + authHtml + '</span>';
      html += '<a href="store.html" class="nav__link nav__link--cta">View Store</a>';
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
    cta.textContent = 'Open Store';
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

  (function initResourceInteractiveTools() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage !== 'resources.html') return;

    var TIME_KEY = 'efi_time_blindness_entries';
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

    function renderTimeCalibrator() {
      var entries = readEntries();
      if (!tbBody || !tbMessage) return;
      if (!entries.length) {
        tbBody.innerHTML = '<tr><td colspan="4">No rows yet</td></tr>';
        tbMessage.textContent = 'No entries yet. Try 3 to 5 tasks and the tool will start showing how your internal timing tends to drift.';
        if (tbPattern) tbPattern.textContent = 'Your timing pattern will start to show after the first entry.';
        if (tbConfidence) tbConfidence.textContent = 'Confidence: unavailable (add entries)';
        if (tbSummary) tbSummary.textContent = 'Your planning summary will appear here once you have data.';
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
    }

    function copyText(text, onDone) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(onDone).catch(onDone);
      } else {
        onDone();
      }
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
        topBlocker: top[0].label
      });
      writeTaskHistory(history);
      recurringTheme = buildRecurringTheme(readTaskHistory());
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
      if (tfMessage) tfMessage.textContent = 'Your start script is ready. Copy it if you want it beside you while you begin.';
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

    if (tfScenario) {
      tfScenario.addEventListener('change', function () {
        renderTaskFrictionPrompts();
        lastProtocol = '';
        localStorage.removeItem(TASK_FRICTION_KEY);
        if (tfResult) tfResult.textContent = 'Rate each friction layer and EFI will build a tailored start script for this situation.';
        if (tfMessage) tfMessage.textContent = 'Situation updated. Run the tool again to get a new start script.';
      });
    }

    renderTaskFrictionPrompts();
    renderTimeCalibrator();
  })();

  (function reduceEnrollButtons() {
    return;
  })();

  (function enforceCtaGovernance() {
    return;
  })();

  (function injectSectionCitationFootnotes() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (!/^module-(1|2|3|4|5|6)\.html$/.test(currentPage)) return;

    var citationsByPage = {
      'module-1.html': {
        'the neuropsychology of self-regulation': 'Citations: Barkley (1997), Barkley EF/SR Fact Sheet, Brown EF model summaries.',
        'the prefrontal cortex: the brain\'s ceo': 'Citations: Barkley (2012), Center on the Developing Child EF resources.'
      },
      'module-2.html': {
        'assessment protocols': 'Citations: ESQ-R psychometrics, Brown EF/A overview materials.',
        'the intake simulation': 'Citations: ICF competency language, scope-of-practice guardrails.'
      },
      'module-3.html': {
        'the coaching architecture': 'Citations: Dawson & Guare intervention logic, ICF core competency framework.',
        'ethics and boundaries': 'Citations: ICF Code of Ethics, EFI Scope of Practice policy.'
      },
      'module-4.html': {
        'applied methodologies': 'Citations: Ward/Jacobsen 360 Thinking resources, GDD implementation materials.',
        'time systems': 'Citations: Barkley time blindness education segments and temporal discounting literature.'
      },
      'module-5.html': {
        'time management: curing "time blindness"': 'Citations: Barkley temporal model, Ward visual time strategies.',
        'task initiation: overcoming the "wall of awful"': 'Citations: initiation-friction coaching literature and applied ADHD practice frameworks.'
      },
      'module-6.html': {
        'professional ethics': 'Citations: ICF ethics code, EFI terms and scope policies.',
        'practice management': 'Citations: coaching operations templates and credential quality-control standards.'
      }
    };

    var map = citationsByPage[currentPage] || {};
    if (!Object.keys(map).length) return;

    function normalize(text) {
      return String(text || '').trim().toLowerCase().replace(/\s+/g, ' ');
    }

    document.querySelectorAll('main section').forEach(function (section) {
      if (section.querySelector('.section-cite')) return;
      var heading = section.querySelector('h2');
      if (!heading) return;
      var key = normalize(heading.textContent);
      var note = map[key];
      if (!note) return;
      var cite = document.createElement('p');
      cite.className = 'section-cite';
      cite.textContent = note;
      heading.insertAdjacentElement('afterend', cite);
    });
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

  (function injectModuleReadingPanel() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var readingByModule = {
      'module-1.html': [
        { title: 'Barkley (2012): Executive Functions, What They Are', url: 'https://www.routledge.com/Executive-Functions-What-They-Are-How-They-Work-and-Why-They-Evolved/Barkley/p/book/9781462506965' },
        { title: 'Harvard Center on the Developing Child: InBrief', url: 'https://developingchild.harvard.edu/resources/inbrief-executive-function/' }
      ],
      'module-2.html': [
        { title: 'Dawson & Guare ESQ-R materials', url: 'resources.html#assessments' },
        { title: 'BRIEF-2 overview', url: 'https://www.parinc.com/Products/Pkey/39' }
      ],
      'module-3.html': [
        { title: 'Dawson & Guare coaching framework excerpts', url: 'resources.html#reading' },
        { title: 'ICF Core Competencies', url: 'https://coachingfederation.org/credentials-and-standards/core-competencies' }
      ],
      'module-4.html': [
        { title: 'Sarah Ward 360 Thinking tools', url: 'resources.html#tools' },
        { title: 'Time blindness and scaffolding talk', url: 'resources.html#video' }
      ],
      'module-5.html': [
        { title: 'Harvard EF skill-building guide', url: 'https://developingchild.harvard.edu/resource-guides/guide-executive-function/' },
        { title: 'Enhancing & Practicing EF Skills (paper)', url: 'Enhancing-and-Practicing-Executive-Function-Skills-with-Children-from-Infancy-to-Adolescence-1.pdf' }
      ],
      'module-6.html': [
        { title: 'ICF Code of Ethics', url: 'https://coachingfederation.org/ethics/code-of-ethics' },
        { title: 'Certification requirements and rubric', url: 'certification.html' }
      ]
    };

    var requiredReadings = readingByModule[currentPage];
    if (!requiredReadings) return;

    var moduleContainer = document.querySelector('main .container');
    var anchorSection = document.querySelector('main .cta-section') || document.querySelector('main section:last-of-type');
    if (!moduleContainer || !anchorSection || document.getElementById('module-reading-highlight')) return;

    var card = document.createElement('div');
    card.id = 'module-reading-highlight';
    card.className = 'card module-reading-highlight';
    var html = '<div class="module-reading-highlight__title"><h3 style="margin-bottom:0;">Required Further Reading</h3><span class="module-reading-highlight__badge">Required</span></div>';
    html += '<p style="margin-top:var(--space-sm);color:var(--color-text-light);">Complete these references before marking this module done. They are used by rubric-based grading and capstone evaluation.</p>';
    html += '<ul class="checklist" style="margin-top:var(--space-md);">';
    requiredReadings.forEach(function (reading) {
      var external = /^https?:/.test(reading.url);
      html += '<li><a href="' + reading.url + '"' + (external ? ' target="_blank" rel="noopener"' : '') + '>' + reading.title + '</a></li>';
    });
    html += '</ul>';
    html += '<a href="resources.html#reading" class="btn btn--secondary btn--sm" style="margin-top:var(--space-md);">Open Complete Reading Packet</a>';
    card.innerHTML = html;

    anchorSection.parentNode.insertBefore(card, anchorSection);
  })();

  (function injectModuleCitationPanel() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var citationByModule = {
      'module-1.html': ['Barkley (2012)', 'Brown (2013)', 'Harvard Center on the Developing Child'],
      'module-2.html': ['Dawson & Guare ESQ-R', 'BRIEF-2 Technical Manual', 'Barkley Point-of-Performance principle'],
      'module-3.html': ['Dawson & Guare intervention framework', 'ICF Core Competencies'],
      'module-4.html': ['Ward & Jacobsen 360 Thinking', 'Temporal management literature'],
      'module-5.html': ['Harvard EF activities guide', 'ADHD/ASD coaching adaptations literature'],
      'module-6.html': ['ICF Code of Ethics', 'NBEFC guidance', 'Scope of practice resources']
    };
    var citations = citationByModule[currentPage];
    if (!citations || document.getElementById('module-citation-panel')) return;
    var anchorSection = document.querySelector('main .cta-section') || document.querySelector('main section:last-of-type');
    if (!anchorSection || !anchorSection.parentNode) return;
    var panel = document.createElement('div');
    panel.id = 'module-citation-panel';
    panel.className = 'card module-reading-highlight';
    var html = '<div class="module-reading-highlight__title"><h3 style="margin-bottom:0;">Evidence & Citation Check</h3><span class="module-reading-highlight__badge">Reviewed</span></div>';
    html += '<p style="margin-top:var(--space-sm);color:var(--color-text-light);">This module currently maps to the following foundational references:</p><ul class="checklist" style="margin-top:var(--space-md);">';
    citations.forEach(function (item) { html += '<li>' + item + '</li>'; });
    html += '</ul><a href="resources.html#reading" class="btn btn--secondary btn--sm" style="margin-top:var(--space-md);">Open Reading Citations</a>';
    panel.innerHTML = html;
    anchorSection.parentNode.insertBefore(panel, anchorSection);
  })();

  (function injectModuleAssessmentPreview() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var previewByModule = {
      'module-1.html': { test: 'Unit Test 1: Inhibition + Time Blindness', assignment: 'Assignment 1.1 Temporal Horizon Analysis' },
      'module-2.html': { test: 'Unit Test 2: Intake + Assessment Interpretation', assignment: 'Assignment 2.1 Intake Simulation Packet' },
      'module-3.html': { test: 'Unit Test 3: Coaching Architecture + Ethics', assignment: 'Assignment 3.1 Ethics & Competency Portfolio' },
      'module-4.html': { test: 'Unit Test 4: 360 Thinking + Time Systems', assignment: 'Assignment 4.1 Applied Method Integration' },
      'module-5.html': { test: 'Unit Test 5: Special Population Strategy Design', assignment: 'Assignment 5.1 Intervention Design Project' },
      'module-6.html': { test: 'Unit Test 6: Practice Ops + Credential Standards', assignment: 'Assignment 6.1 Launch Kit Capstone' }
    };

    var item = previewByModule[currentPage];
    if (!item || document.getElementById('module-assessment-preview')) return;
    var anchorSection = document.querySelector('main .cta-section') || document.querySelector('main section:last-of-type');
    if (!anchorSection || !anchorSection.parentNode) return;

    var panel = document.createElement('div');
    panel.id = 'module-assessment-preview';
    panel.className = 'card module-reading-highlight';
    panel.innerHTML =
      '<div class="module-reading-highlight__title"><h3 style="margin-bottom:0;">Tests + Assignments Preview</h3><span class="module-reading-highlight__badge">Enrollment Required</span></div>' +
      '<p style="margin-top:var(--space-sm);color:var(--color-text-light);">This module includes one graded unit test and one applied assignment. Public pages show the framework; full assessment tools, scoring, and credential feedback unlock after paid enrollment.</p>' +
      '<ul class="checklist" style="margin-top:var(--space-md);">' +
      '<li><strong>Test Preview:</strong> ' + item.test + '</li>' +
      '<li><strong>Assignment Preview:</strong> ' + item.assignment + '</li>' +
      '</ul>' +
      '<div class="button-group" style="margin-top:var(--space-md);">' +
      '<a href="store.html" class="btn btn--primary btn--sm">View Paid Path</a>' +
      '<a href="store.html" class="btn btn--secondary btn--sm">View Certification Pricing</a>' +
      '</div>';
    anchorSection.parentNode.insertBefore(panel, anchorSection);
  })();

  (function injectModuleKnowledgeCheck() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var checks = {
      'module-1.html': {
        question: 'A learner can explain a plan but fails under time pressure and emotional friction. Which mechanism is MOST likely failing first in Barkley\'s sequence?',
        options: ['Lexical retrieval', 'Response inhibition under load', 'Long-term semantic memory', 'Phonological decoding'],
        answer: 1,
        rationale: 'In Barkley\'s model, inhibition failure under load prevents downstream use of self-talk, future simulation, and emotional modulation.'
      },
      'module-2.html': {
        question: 'Which intake interpretation best distinguishes skill deficit from performance variability?',
        options: ['One low homework grade proves a global skill deficit', 'High-interest success with low-interest collapse suggests context-dependent performance failure', 'High IQ eliminates EF concerns', 'Parent report alone should override all other data'],
        answer: 1,
        rationale: 'Performance swings by context indicate regulation/load mismatch, not necessarily absent underlying skill knowledge.'
      },
      'module-3.html': {
        question: 'Which session design best reflects EF coaching rather than tutoring?',
        options: ['Content reteach -> worksheet correction -> score review', 'Goal definition -> execution plan -> friction review -> transfer rep in a second context', 'Lecture on motivation -> homework reminder', 'Open discussion with no measurable next action'],
        answer: 2,
        rationale: 'Coaching architecture emphasizes execution systems, monitoring, and transfer, not only content accuracy.'
      },
      'module-4.html': {
        question: 'In Ward\'s framework, which sequence produces stronger prospective planning accuracy?',
        options: ['Get Ready -> Do -> Done', 'Do -> Done -> Reflect', 'Done -> Do -> Get Ready', 'Do -> Get Ready -> Done'],
        answer: 1,
        rationale: 'Done-first planning forces future-state representation before task sequencing and material prep.'
      },
      'module-5.html': {
        question: 'A client underestimates task duration by ~2.5x across four weeks. What is the strongest intervention next step?',
        options: ['Ask for more effort and confidence', 'Apply a personalized correction factor to planning and validate with timed reps', 'Remove all timers to reduce anxiety', 'Switch goals weekly to maintain novelty'],
        answer: 1,
        rationale: 'Prediction-vs-actual data should directly calibrate future planning via correction multipliers and repeated measurement.'
      },
      'module-6.html': {
        question: 'Which practice is most defensible in an ethics audit?',
        options: ['Promise diagnostic conclusions after ESQ-R review', 'Guarantee specific symptom outcomes in writing', 'Document scope boundaries, refer when risk exceeds coaching remit, and preserve consent records', 'Share full session content with parents without client agreement'],
        answer: 2,
        rationale: 'Ethical reliability depends on scope clarity, referral discipline, and documented consent/confidentiality controls.'
      },
      'curriculum.html': {
        question: 'What unlocks graded tests, assignment review, and credential workflows?',
        options: ['Reading a single free article', 'Paid enrollment in certification services', 'Visiting the home page twice', 'Creating a community comment'],
        answer: 1,
        rationale: 'Core information is open, while graded assessments and credential review are part of paid certification services.'
      }
    };

    var check = checks[currentPage];
    if (!check || document.getElementById('module-knowledge-check')) return;

    var anchor = document.getElementById('module-knowledge-check-anchor') || document.getElementById('module-assessment-preview');
    if (!anchor) {
      var sections = Array.prototype.slice.call(document.querySelectorAll('main section'));
      anchor = sections.find(function (section) {
        return /module navigation/i.test(section.textContent || '') || !!section.querySelector('a[href^="module-"]');
      }) || document.querySelector('main .cta-section') || document.querySelector('main section:last-of-type');
    }
    if (!anchor || !anchor.parentNode) return;

    var wrap = document.createElement('div');
    wrap.id = 'module-knowledge-check';
    wrap.className = 'card module-quiz';

    var optionsHtml = '';
    check.options.forEach(function (option, index) {
      optionsHtml +=
        '<label class="module-quiz__option">' +
          '<input type="radio" name="knowledge-check" value="' + index + '">' +
          '<span>' + option + '</span>' +
        '</label>';
    });

    wrap.innerHTML =
      '<div class="module-reading-highlight__title">' +
        '<h3 style="margin-bottom:0;">Quick Knowledge Check</h3>' +
        '<span class="module-reading-highlight__badge">1 Question</span>' +
      '</div>' +
      '<p class="module-quiz__question">' + check.question + '</p>' +
      '<div class="module-quiz__options">' + optionsHtml + '</div>' +
      '<div class="button-group" style="margin-top:var(--space-md);">' +
        '<button type="button" class="btn btn--secondary btn--sm" id="knowledge-check-submit">Check Answer</button>' +
        '<a href="store.html" class="btn btn--primary btn--sm">View Graded Path</a>' +
      '</div>' +
      '<div id="knowledge-check-result" aria-live="polite"></div>';

    anchor.parentNode.insertBefore(wrap, anchor);

    var submit = document.getElementById('knowledge-check-submit');
    var result = document.getElementById('knowledge-check-result');
    if (!submit || !result) return;

    submit.addEventListener('click', function () {
      var selected = wrap.querySelector('input[name="knowledge-check"]:checked');
      if (!selected) {
        result.className = 'module-quiz__result module-quiz__result--no';
        result.textContent = 'Choose an option first, then submit.';
        return;
      }
      var chosen = Number(selected.value);
      var correct = chosen === check.answer;
      result.className = 'module-quiz__result ' + (correct ? 'module-quiz__result--ok' : 'module-quiz__result--no');
      result.textContent = (correct ? 'Correct. ' : 'Not quite. ') + check.rationale;
      try {
        localStorage.setItem('efi_quiz_' + currentPage, JSON.stringify({
          correct: correct,
          selected: chosen,
          at: new Date().toISOString()
        }));
      } catch (e) {}
    });
  })();

  (function injectLearnMorePanels() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (!/^module-|^curriculum\.html$/.test(currentPage)) return;
    var deepDives = {
      'module-b-pedagogy.html': [
        { match: ['planning'], text: 'Planning-first protocols reduce cognitive switching cost and make error sources visible before execution starts.', links: [{ href: 'module-4.html', label: 'Applied Methods' }, { href: 'https://www.smartbutscatteredkids.com/resources/esq-r-self-report-assessment-tool/', label: 'ESQ-R Framework' }] },
        { match: ['reflection'], text: 'Prompted reflection is a metacognitive training loop: identify breakdown point, isolate friction variable, and define the next behavior test.', links: [{ href: 'module-3.html', label: 'Coaching Framework' }, { href: 'https://coachingfederation.org/credentials-and-standards/core-competencies', label: 'ICF Core Competencies' }] },
        { match: ['transfer'], text: 'Transfer fails when success is context-bound. Second-context reps with reduced prompting are required to build independent execution.', links: [{ href: 'module-4.html', label: 'Applied Methodologies' }, { href: 'open-ef-resources-directory.html#citations', label: 'Citations' }] },
        { match: ['template'], text: 'Session templates are decision scaffolds: fixed block timing reduces drift and preserves coaching focus on execution rather than topic drift.', links: [{ href: 'resources.html#forms', label: 'Template Library' }, { href: 'module-6.html', label: 'Professional Practice' }] },
        { match: ['implementation'], text: 'Wrapping content tutoring inside pre-plan and post-adaptation loops converts one-time compliance into repeatable self-management.', links: [{ href: 'scope-of-practice.html', label: 'Scope Guidance' }, { href: 'certification.html', label: 'Certification Standards' }] }
      ],
      'module-c-interventions.html': [
        { match: ['backward'], text: 'Backward planning improves reliability by externalizing dependency chains and exposing hidden prep work before deadline pressure spikes.', links: [{ href: 'module-4.html', label: 'Time Systems' }, { href: 'resources.html#forms', label: 'Planning Templates' }] },
        { match: ['time blindness'], text: 'Time blindness interventions work best when elapsed time is made visible and correction factors are rehearsed against real task data.', links: [{ href: 'module-5.html', label: 'Prediction Calibration' }, { href: 'open-ef-resources-directory.html#citations', label: 'Cited Sources' }] },
        { match: ['metacognitive'], text: 'Metacognitive prompts should target plan quality, derail detection, and recovery procedure rather than general encouragement.', links: [{ href: 'module-3.html', label: 'Coaching Prompts' }, { href: 'resources.html#reading', label: 'Prompt References' }] }
      ],
      'module-1.html': [
        { match: ['inhibition'], text: 'Inhibition enables temporal self-control by delaying immediate response so working memory and self-directed speech can engage.', links: [{ href: 'https://pubmed.ncbi.nlm.nih.gov/9000892/', label: 'Barkley 1997' }, { href: 'barkley-model-guide.html', label: 'Model Guide' }] },
        { match: ['time blindness'], text: 'Temporal discounting compresses future consequence salience, which is why near-term cues dominate behavior under EF strain.', links: [{ href: 'https://www.youtube.com/watch?v=wmV8HQUuPEk', label: 'Barkley Time Blindness Segment' }, { href: 'module-5.html', label: 'Applied Interventions' }] },
        { match: ['prefrontal'], text: 'PFC development is prolonged, so environmental supports are compensatory design features, not shortcuts.', links: [{ href: 'module-1.html', label: 'Module 1' }, { href: 'open-ef-resources-directory.html#citations', label: 'Citations' }] }
      ],
      'module-2.html': [
        { match: ['intake'], text: 'A strong intake triangulates self-report, collateral patterns, and context variance to avoid over- or under-identification.', links: [{ href: 'resources.html#assessment', label: 'Assessment Tools' }, { href: 'brown-clusters-tool.html', label: 'Brown Clusters Tool' }] },
        { match: ['esq-r'], text: 'ESQ-R profiles are most actionable when translated into two-week behavior targets with observable completion criteria.', links: [{ href: 'Conv17-305-dawson-executive-skills-questionnaire.pdf', label: 'ESQ-R PDF' }, { href: 'dashboard.html', label: 'Dashboard Tracking' }] },
        { match: ['brief'], text: 'Rating-scale interpretation should prioritize cross-setting discrepancies and function-level bottlenecks, not single-score labels.', links: [{ href: 'resources.html#reading', label: 'Reading Packets' }, { href: 'module-3.html', label: 'Coaching Architecture' }] }
      ],
      'module-3.html': [
        { match: ['alliance'], text: 'Alliance quality predicts adherence: collaboratively framed goals outperform directive compliance-based planning.', links: [{ href: 'scope-of-practice.html', label: 'Scope + Alliance Boundaries' }, { href: 'https://coachingfederation.org/credentials-and-standards/core-competencies', label: 'ICF Core Competencies' }] },
        { match: ['goals'], text: 'Goal quality improves when targets are behavior-specific, time-bounded, and tied to environmental trigger design.', links: [{ href: 'teacher-to-coach.html', label: 'Educator Path' }, { href: 'resources.html#forms', label: 'Template Forms' }] },
        { match: ['ethics'], text: 'Scope-safe coaching requires explicit referral thresholds and documentation discipline in every high-risk context.', links: [{ href: 'module-6.html', label: 'Professional Practice' }, { href: 'terms.html', label: 'Terms + Delivery Model' }] }
      ],
      'module-4.html': [
        { match: ['get ready'], text: 'GDD is a prospective sequencing scaffold: define final-state fidelity first, then derive execution operations and setup constraints.', links: [{ href: 'https://www.efpractice.com/getreadydodone', label: 'Get Ready Do Done' }, { href: 'ward-360-thinking.html', label: 'Ward 360 Thinking' }] },
        { match: ['clock'], text: 'Analog visual time cues convert abstract duration into spatial volume, reducing temporal estimation error.', links: [{ href: 'module-5.html', label: 'Time Correction Practice' }, { href: 'resources.html#forms', label: 'Visual Clock Tools' }] },
        { match: ['offload'], text: 'Cognitive offloading should be placed at point-of-performance to reduce working-memory leakage during transitions.', links: [{ href: 'module-4.html', label: 'Applied Methods' }, { href: 'resources.html#forms', label: 'Offloading Templates' }] }
      ],
      'module-5.html': [
        { match: ['task initiation'], text: 'Initiation breakdown is often affective friction, so treatment should lower activation energy before demanding persistence.', links: [{ href: 'module-3.html', label: 'Coaching Framework' }, { href: 'resources.html#reading', label: 'Applied Readings' }] },
        { match: ['prediction'], text: 'Prediction-error tracking yields individualized correction factors that materially improve planning realism.', links: [{ href: 'images/time-correction-chart.svg', label: 'Time Correction Chart' }, { href: 'module-4.html', label: 'Method Foundations' }] },
        { match: ['special populations'], text: 'Population adaptations should preserve EF principles while adjusting pacing, language, and sensory/context load.', links: [{ href: 'resources.html', label: 'Resource Hub' }, { href: 'scope-of-practice.html', label: 'Scope Boundaries' }] }
      ],
      'module-6.html': [
        { match: ['ethics'], text: 'Ethics implementation depends on process reliability: consent capture, documentation quality, and repeatable referral standards.', links: [{ href: 'certification.html', label: 'Certification QA' }, { href: 'terms.html', label: 'Terms' }] },
        { match: ['practice'], text: 'Practice systems should separate delivery quality metrics from commercial metrics to avoid scope drift and over-promising.', links: [{ href: 'teacher-to-coach.html', label: 'Business Path' }, { href: 'accreditation.html', label: 'Alignment Status' }] },
        { match: ['launch'], text: 'Launch readiness is demonstrated by operational consistency: intake-to-feedback workflow, retention plan, and policy hygiene.', links: [{ href: 'launch-plan.html', label: '90-Day Launch Plan' }, { href: 'dashboard.html', label: 'Dashboard Workflow' }] }
      ],
      'curriculum.html': [
        { match: ['module 1'], text: 'Module sequence is dependency-aware: theory precedes assessment, then coaching architecture, then interventions and professional operations.', links: [{ href: 'module-1.html', label: 'Module 1' }, { href: 'module-2.html', label: 'Module 2' }] },
        { match: ['assignment'], text: 'Assignments are designed as skill transfer tests, not content recitation: plan quality and execution consistency are weighted heavily.', links: [{ href: 'certification.html', label: 'Rubrics + Capstone' }, { href: 'store.html', label: 'Graded Services' }] },
        { match: ['free'], text: 'Open information reduces access barriers, while paid layers fund grading, credential verification, and reviewed performance feedback.', links: [{ href: 'resources.html', label: 'Free Resources' }, { href: 'index.html#start-paths', label: 'Homepage Start Paths' }] }
      ],
      'module-a-neuroscience.html': [
        { match: ['prefrontal'], text: 'PFC-dependent regulation is highly load-sensitive, which is why performance drops under stress despite intact conceptual understanding.', links: [{ href: 'https://pubmed.ncbi.nlm.nih.gov/9000892/', label: 'Barkley 1997' }, { href: 'open-ef-resources-directory.html#citations', label: 'Source Hub' }] },
        { match: ['inhibition'], text: 'Inhibition operates as a gating process that protects future-oriented goal models from interference by immediate cues.', links: [{ href: 'https://www.russellbarkley.org/factsheets/ADHD_EF_and_SR.pdf', label: 'Barkley EF/SR Fact Sheet' }, { href: 'barkley-model-guide.html', label: 'Barkley Guide' }] },
        { match: ['coaching'], text: 'Coaching translates neuroscience by externalizing planning and memory demands so execution does not depend on internal load alone.', links: [{ href: 'module-3.html', label: 'Coaching Architecture' }, { href: 'module-4.html', label: 'Applied Methods' }] }
      ]
    };

    var fallback = {
      text: 'Deeper technical note: map each tactic to mechanism (inhibition, working memory, emotional regulation, or prospective sequencing) before applying it in practice.',
      links: [{ href: 'open-ef-resources-directory.html#citations', label: 'Citations' }, { href: 'certification.html', label: 'Rubric Standards' }]
    };

    var sectionDeepDives = {
      'module-1.html': {
        'the neurobiology of the "air traffic control" system': {
          text: 'Action step: in your next intake, ask the client to identify one recurring "air traffic jam" moment each day, then map it to a specific control-tower support (visual cue, timer, checklist, or pre-commitment).',
          links: [{ href: 'module-1.html', label: 'Module 1' }, { href: 'resources.html#forms', label: 'Implementation Forms' }]
        },
        'the barkley model: inhibition as the keystone': {
          text: 'Action step: require every intervention to name the inhibition bottleneck first ("what impulse is winning?"), then pair one external brake with one follow-through cue.',
          links: [{ href: 'barkley-model-guide.html', label: 'Barkley Guide' }, { href: 'certification.html#transparency-rubric', label: 'Rubric Standards' }]
        },
        'the brown model: six clusters of cognitive management': {
          text: 'Action step: use one cluster label per week in client language (Activation, Focus, Effort, Emotion, Memory, Action) and collect one real-world example to normalize variability.',
          links: [{ href: 'brown-clusters-tool.html', label: 'Brown Clusters Tool' }, { href: 'open-ef-resources-directory.html#citations', label: 'Primary Sources' }]
        },
        'module 1 assignment': {
          text: 'Action step: draft the three interventions first, then write the analysis around them. This prevents theory-only submissions and increases pass reliability.',
          links: [{ href: 'certification.html#transparency-rubric', label: 'Pass Criteria' }, { href: 'resources.html#forms', label: 'Templates' }]
        }
      },
      'module-2.html': {
        'the intake architecture': {
          text: 'Action step: run intake in three passes: (1) presenting pain point, (2) context map by setting/time, (3) first 2-week behavior target with observable completion criteria.',
          links: [{ href: 'resources.html#assessment', label: 'Assessment Toolkit' }, { href: 'module-3.html', label: 'Coaching Architecture' }]
        },
        'the executive skills questionnaire (esq-r)': {
          text: 'Action step: convert top-2 weak ESQ domains into one "start behavior" each (under 3 minutes) and one weekly review metric in dashboard.',
          links: [{ href: 'esqr.html', label: 'Interactive ESQ-R' }, { href: 'dashboard.html', label: 'Progress Dashboard' }]
        },
        'the "point of performance" audit': {
          text: 'Action step: photograph or sketch the real execution environment and mark friction points in order of failure frequency before assigning new skills.',
          links: [{ href: 'module-4.html', label: 'Applied Methods' }, { href: 'resources.html#forms', label: 'Audit Templates' }]
        },
        'module 2 assignment': {
          text: 'Action step: include one discrepancy paragraph (self-report vs observer report) and the exact follow-up question you would use to resolve it.',
          links: [{ href: 'certification.html#transparency-rubric', label: 'Rubric Expectations' }, { href: 'scope-of-practice.html', label: 'Scope Guardrails' }]
        }
      },
      'module-3.html': {
        'the two-tiered intervention logic': {
          text: 'Action step: always deploy one environment change before any motivation coaching. If behavior improves, you found a design issue not a character issue.',
          links: [{ href: 'module-4.html', label: 'Applied Methods' }, { href: 'resources.html#forms', label: 'Environment Tools' }]
        },
        'the coach as "external frontal lobe"': {
          text: 'Action step: use a fade plan from day one: full prompts -> partial prompts -> self-prompt script -> independent check-in.',
          links: [{ href: 'module-6.html', label: 'Practice Ops' }, { href: 'certification.html', label: 'Certification Workflow' }]
        },
        'the coaching cycle & smart goals': {
          text: 'Action step: every SMART goal should include a trigger ("when X happens"), a start behavior, and a recovery behavior if derailed.',
          links: [{ href: 'resources.html#forms', label: 'Goal Templates' }, { href: 'teacher-to-coach.html', label: 'Educator Path' }]
        },
        'module 3 assignment': {
          text: 'Action step: include one explicit referral threshold sentence in your submission to show scope discipline under risk.',
          links: [{ href: 'scope-of-practice.html', label: 'Referral Boundaries' }, { href: 'terms.html', label: 'Service Terms' }]
        }
      },
      'module-4.html': {
        '360 thinking: "get ready, do, done"': {
          text: 'Action step: require clients to show the "Done" artifact first (photo, checklist, sample output) before planning steps.',
          links: [{ href: 'ward-360-thinking.html', label: '360 Thinking Hub' }, { href: 'resources.html#forms', label: 'Planning Mats' }]
        },
        'temporal management: curing "time blindness"': {
          text: 'Action step: capture predicted time vs actual time for 5 similar tasks; set correction factor and apply it to next week\'s calendar blocks.',
          links: [{ href: 'images/time-correction-chart.svg', label: 'Correction Chart' }, { href: 'module-5.html', label: 'Applied Calibration' }]
        },
        'cognitive offloading': {
          text: 'Action step: place offload tools where failure happens (doorway, desk, phone lock screen), not where planning happens.',
          links: [{ href: 'module-4.html', label: 'Applied Methods' }, { href: 'resources.html#forms', label: 'Offload Tools' }]
        },
        'unit summary': {
          text: 'Action step: choose one tool from each bucket (planning, timing, offload) and run a 14-day implementation sprint with weekly review notes.',
          links: [{ href: 'dashboard.html', label: 'Track Outcomes' }, { href: 'certification.html', label: 'Submission Pipeline' }]
        }
      },
      'module-6.html': {
        'professional ethics & scope of practice': {
          text: 'Action step: include a standing script for "this is outside coaching scope" and document referral pathways before client load grows.',
          links: [{ href: 'scope-of-practice.html', label: 'Scope Policy' }, { href: 'accreditation.html', label: 'Standards Status' }]
        },
        'building your coaching business': {
          text: 'Action step: separate service delivery SOPs from sales SOPs so quality controls are not compromised by revenue pressure.',
          links: [{ href: 'teacher-to-coach.html', label: 'Business Path' }, { href: 'store.html', label: 'Service Structure' }]
        },
        'legal & administrative infrastructure': {
          text: 'Action step: finalize refund language, consent capture, and documentation retention workflow before onboarding paid clients.',
          links: [{ href: 'terms.html', label: 'Terms' }, { href: 'privacy.html', label: 'Privacy' }]
        },
        'your professional toolkit': {
          text: 'Action step: customize the launch kit docs with your actual niche and session cadence, then run one pilot client from intake to review.',
          links: [{ href: 'curriculum.html', label: 'Launch Kit Preview' }, { href: 'store.html', label: 'Paid Path' }]
        }
      },
      'curriculum.html': {
        'complete curriculum overview': {
          text: 'Action step: treat modules as dependencies, not electives. Complete in order to prevent intervention planning before mechanism mastery.',
          links: [{ href: 'module-1.html', label: 'Module 1' }, { href: 'module-2.html', label: 'Module 2' }]
        },
        'what you actually receive in the launch kit': {
          text: 'Action step: use the file list as a build checklist; mark each asset as drafted, tested, and production-ready before certification submission.',
          links: [{ href: 'certification.html', label: 'Capstone + Rubric' }, { href: 'resources.html#forms', label: 'Forms Library' }]
        },
        'theoretical models at a glance': {
          text: 'Action step: choose Barkley for mechanism explanation, Brown for symptom variability explanation, Dawson/Guare for intervention targeting.',
          links: [{ href: 'barkley-vs-brown.html', label: 'Model Comparison' }, { href: 'about.html#models', label: 'Model Foundations' }]
        }
      },
      'module-5.html': {
        'time management: curing "time blindness"': {
          text: 'Time systems should be treated as measurement systems. Prediction error data drives correction factors that improve planning validity.',
          links: [{ href: 'images/time-correction-chart.svg', label: 'Time Correction Chart' }, { href: 'resources.html#forms', label: 'Time Tools' }]
        },
        'task initiation: overcoming the "wall of awful"': {
          text: 'Initiation interventions should reduce threat and lower friction in the first 90 seconds of task contact. Start behavior beats motivation talk.',
          links: [{ href: 'module-3.html', label: 'Coaching Scripts' }, { href: 'module-4.html', label: 'Applied Methods' }]
        },
        'special populations & transitions': {
          text: 'Adapt delivery surface, not core mechanism. Preserve EF principles while tuning language, structure, and sensory/context load.',
          links: [{ href: 'scope-of-practice.html', label: 'Scope & Referral' }, { href: 'resources.html', label: 'Resource Hub' }]
        }
      }
    };

    function normalizeHeading(value) {
      return (value || '').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    function pickSectionModel(el, currentPage) {
      var byPage = sectionDeepDives[currentPage];
      if (!byPage) return null;
      var section = el.closest ? el.closest('section') : null;
      if (!section) return null;
      var headingEl = section.querySelector('h2, h3');
      var key = normalizeHeading(headingEl ? headingEl.textContent : '');
      return byPage[key] || null;
    }

  function pickModel(el, pageModels, index) {
    if (!pageModels || !pageModels.length) return fallback;
    var text = (el.textContent || '').toLowerCase();
    var matched = pageModels.find(function (entry) {
      return (entry.match || []).some(function (token) { return text.indexOf(token) >= 0; });
    });
    return matched || pageModels[index % pageModels.length] || fallback;
  }

  function buildLearnMoreLabel(el, model) {
    var localHeading = el.querySelector('h3, h4');
    var headingText = localHeading ? String(localHeading.textContent || '').replace(/\s+/g, ' ').trim() : '';
    if (headingText) {
      if (headingText.length > 28) headingText = headingText.slice(0, 25).trim() + '...';
      return 'See ' + headingText + ' Note';
    }
    if (model && typeof model.text === 'string' && model.text.indexOf('Action step:') === 0) {
      return 'See Action Step';
    }
    if (model && model.links && model.links[0] && model.links[0].label) {
      return 'See ' + model.links[0].label;
    }
    return 'See Supporting Note';
  }

    var targets = document.querySelectorAll('.card, .callout, .hub-card');
    var limit = 16;
    var count = 0;
    targets.forEach(function (el) {
      if (count >= limit) return;
      if (el.querySelector('.learn-more-toggle')) return;
      if ((el.textContent || '').trim().length < 140) return;
      count += 1;
      var model = pickSectionModel(el, currentPage) || pickModel(el, deepDives[currentPage], count);

      var panelId = 'learn-more-' + Math.random().toString(36).slice(2, 8);
      var links = model.links.map(function (item) {
        var external = /^https?:\/\//.test(item.href);
        return '<a href="' + item.href + '"' + (external ? ' target="_blank" rel="noopener"' : '') + '>' + item.label + '</a>';
      }).join(' &bull; ');

      var wrap = document.createElement('div');
      wrap.style.marginTop = 'var(--space-sm)';
      wrap.innerHTML =
        '<button type="button" class="btn btn--secondary btn--sm learn-more-toggle" aria-expanded="false" aria-controls="' + panelId + '">' + buildLearnMoreLabel(el, model) + '</button>' +
        '<div id="' + panelId + '" class="notice" style="display:none;margin-top:var(--space-sm);">' +
          '<p style="margin-bottom:var(--space-sm);">' + model.text + '</p>' +
          '<p style="margin-bottom:0;font-size:0.86rem;">Sources: ' + links + '</p>' +
        '</div>';
      el.appendChild(wrap);

      var toggle = wrap.querySelector('.learn-more-toggle');
      var panel = wrap.querySelector('#' + panelId);
      if (!toggle || !panel) return;
      toggle.addEventListener('click', function () {
        var open = panel.style.display !== 'none';
        panel.style.display = open ? 'none' : 'block';
        toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    });
  })();

  (function injectModuleToc() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (!/^module-(1|2|3|4|5|6|a-neuroscience|b-pedagogy|c-interventions)\.html$/.test(currentPage)) return;
    if (document.querySelector('.module-toc')) return;
    var main = document.querySelector('main');
    if (!main) return;

    var sections = Array.prototype.slice.call(main.querySelectorAll('section'));
    var targets = [];
    sections.forEach(function (section, idx) {
      var heading = section.querySelector('h2');
      if (!heading) return;
      var text = (heading.textContent || '').trim();
      if (!text) return;
      if (!section.id) section.id = 'section-' + (idx + 1);
      targets.push({ id: section.id, label: text });
    });
    if (targets.length < 3) return;

    var wrap = document.createElement('div');
    wrap.className = 'module-layout';
    var toc = document.createElement('aside');
    toc.className = 'module-toc';
    toc.setAttribute('aria-label', 'Table of contents');
    var list = '<h3>On This Page</h3><ul>';
    targets.forEach(function (item) {
      list += '<li><a href="#' + item.id + '">' + item.label + '</a></li>';
    });
    list += '</ul>';
    toc.innerHTML = list;

    var content = document.createElement('div');
    content.className = 'module-main';
    while (main.firstChild) content.appendChild(main.firstChild);
    wrap.appendChild(content);
    wrap.appendChild(toc);
    main.appendChild(wrap);
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
        localStorage.setItem(THEME_KEY, next);
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
      localStorage.setItem('efi_wave_direction', String(direction));
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
