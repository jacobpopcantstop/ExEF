(function () {
  'use strict';

  function buildToc() {
    if (window.innerWidth < 1280) return;

    // Collect targets: prefer section[id] > h2, then h2[id]
    var seen = Object.create(null);
    var targets = [];

    document.querySelectorAll('main section[id], main h2[id]').forEach(function (el) {
      var id, text, anchor;
      if (el.tagName === 'SECTION') {
        var h2 = el.querySelector('h2');
        if (!h2) return;
        id = el.id;
        text = h2.textContent.trim();
        anchor = el;
      } else {
        id = el.id;
        text = el.textContent.trim();
        anchor = el;
      }
      if (!seen[id]) {
        seen[id] = true;
        targets.push({ id: id, text: text, anchor: anchor });
      }
    });

    if (targets.length < 3) return;

    // Build DOM
    var toc = document.createElement('div');
    toc.id = 'page-toc';
    toc.className = 'page-toc';

    var minimized = sessionStorage.getItem('toc-minimized') === '1';
    if (minimized) toc.classList.add('page-toc--minimized');

    var header = document.createElement('div');
    header.className = 'page-toc__header';

    var title = document.createElement('span');
    title.className = 'page-toc__title';
    title.textContent = 'On this page';
    header.appendChild(title);

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'page-toc__toggle';
    toggle.setAttribute('aria-label', minimized ? 'Expand table of contents' : 'Minimize table of contents');
    toggle.textContent = minimized ? '+' : '−';
    header.appendChild(toggle);
    toc.appendChild(header);

    var nav = document.createElement('nav');
    nav.className = 'page-toc__nav';
    nav.setAttribute('aria-label', 'Page sections');

    var list = document.createElement('ul');
    list.className = 'page-toc__list';

    var links = [];
    targets.forEach(function (t) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.className = 'page-toc__link';
      a.href = '#' + t.id;
      a.textContent = t.text;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        t.anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', '#' + t.id);
      });
      li.appendChild(a);
      list.appendChild(li);
      links.push(a);
    });

    nav.appendChild(list);
    toc.appendChild(nav);
    document.body.appendChild(toc);

    // Minimize toggle
    toggle.addEventListener('click', function () {
      var isMin = toc.classList.toggle('page-toc--minimized');
      toggle.textContent = isMin ? '+' : '−';
      toggle.setAttribute('aria-label', isMin ? 'Expand table of contents' : 'Minimize table of contents');
      sessionStorage.setItem('toc-minimized', isMin ? '1' : '0');
    });

    // Active link via IntersectionObserver
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.id;
            links.forEach(function (a) {
              a.classList.toggle('page-toc__link--active', a.getAttribute('href') === '#' + id);
            });
          }
        });
      }, { rootMargin: '-15% 0px -70% 0px', threshold: 0 });

      targets.forEach(function (t) { io.observe(t.anchor); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildToc);
  } else {
    buildToc();
  }
}());
