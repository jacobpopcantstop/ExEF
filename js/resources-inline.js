// Extracted from resources.html so it runs under the site CSP (script-src 'self').
(function () {
  var resourceAnchors = {
    'workflow-tools': true,
    tools: true,
    toolkits: true,
    printables: true,
    forms: true,
    reading: true,
    books: true,
    video: true,
    library: true,
    links: true,
    'source-access': true
  };
  var anchorTargets = {
    tools: 'workflow-tools',
    forms: 'printables',
    books: 'reading',
    video: 'reading',
    links: 'library'
  };

  function settleResourceHash() {
    if (!window.location.hash) return;
    var id = decodeURIComponent(window.location.hash.slice(1));
    if (!resourceAnchors[id]) return;
    var target = document.getElementById(anchorTargets[id] || id);
    if (!target) return;
    window.requestAnimationFrame(function () {
      target.scrollIntoView({ block: 'start' });
    });
  }

  window.addEventListener('load', settleResourceHash);
  window.addEventListener('hashchange', settleResourceHash);
  if (window.location.hash) {
    window.setTimeout(settleResourceHash, 150);
    window.setTimeout(settleResourceHash, 600);
    window.setTimeout(settleResourceHash, 1200);
  }
}());
