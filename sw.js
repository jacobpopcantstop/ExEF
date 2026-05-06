'use strict';

// Bump cache names when shared navigation or critical assets change so clients
// don't stay pinned to an older site shell after deploy.
var STATIC_CACHE = 'exef-static-v11';
var PAGE_CACHE = 'exef-pages-v9';
var ALL_CACHES = [STATIC_CACHE, PAGE_CACHE];

var CORE_PAGES = [
  '/',
  '/index.html',
  '/about.html',
  '/blog.html',
  '/resources.html',
  '/executive-functioning-iep-goal-bank.html',
  '/getting-started.html',
  '/free-executive-functioning-tests.html',
  '/search.html',
  '/win-page.html'
];

var SHARED_ASSETS = [
  '/css/styles.css',
  '/favicon.svg',
  '/images/exef-og-card.svg',
  '/images/jacob-headshot.jpg',
  '/images/jacob-headshot-640.jpg',
  '/images/jacob-headshot-960.jpg',
  '/js/main.min.js',
  '/js/main.bundle.min.js',
  '/js/homepage-ux.js',
  '/js/module-pages.bundle.min.js',
  '/js/nav-auth.min.js',
  '/js/search.min.js',
  '/data/search-index.json'
];

var CRITICAL_STATIC_ASSETS = [
  '/css/styles.css',
  '/js/main.min.js',
  '/js/main.bundle.min.js',
  '/js/nav-auth.min.js'
];

function normalizeUrl(url) {
  var parsed = new URL(url, self.location.origin);
  return parsed.pathname === '/' ? '/' : parsed.pathname;
}

function isSuccessful(response) {
  return !!response && (response.ok || response.type === 'opaque');
}

function shouldHandleHtml(request) {
  if (request.mode === 'navigate') return true;
  var accept = request.headers.get('accept') || '';
  return accept.indexOf('text/html') !== -1;
}

function shouldHandleStatic(request) {
  if (request.method !== 'GET') return false;
  var destination = request.destination || '';
  if (destination === 'style' || destination === 'script' || destination === 'image' || destination === 'font') {
    return true;
  }
  var pathname = normalizeUrl(request.url);
  return pathname.indexOf('/css/') === 0 ||
    pathname.indexOf('/js/') === 0 ||
    pathname.indexOf('/images/') === 0 ||
    pathname === '/favicon.svg';
}

async function warmCache(cacheName, urls) {
  var cache = await caches.open(cacheName);
  await Promise.allSettled(urls.map(async function (url) {
    var request = new Request(url, { cache: 'reload' });
    var response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response);
    }
  }));
}

self.addEventListener('install', function (event) {
  event.waitUntil((async function () {
    await Promise.all([
      warmCache(PAGE_CACHE, CORE_PAGES),
      warmCache(STATIC_CACHE, SHARED_ASSETS)
    ]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    var names = await caches.keys();
    await Promise.all(names.map(function (name) {
      if (ALL_CACHES.indexOf(name) === -1) {
        return caches.delete(name);
      }
      return Promise.resolve(false);
    }));
    await self.clients.claim();
  })());
});

async function networkFirstPage(request) {
  var cache = await caches.open(PAGE_CACHE);

  try {
    var response = await fetch(request);
    if (isSuccessful(response)) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    var cached = await cache.match(request);
    if (cached) return cached;

    var pathname = normalizeUrl(request.url);
    if (pathname !== request.url) {
      cached = await cache.match(pathname);
      if (cached) return cached;
    }

    return cache.match('/index.html');
  }
}

async function cacheFirstStatic(request) {
  var cache = await caches.open(STATIC_CACHE);
  var cached = await cache.match(request);
  if (cached) return cached;

  var response = await fetch(request);
  if (isSuccessful(response)) {
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstStatic(request) {
  var cache = await caches.open(STATIC_CACHE);

  try {
    var response = await fetch(request);
    if (isSuccessful(response)) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    var cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  if (shouldHandleHtml(request)) {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (shouldHandleStatic(request)) {
    var pathname = normalizeUrl(request.url);
    if (CRITICAL_STATIC_ASSETS.indexOf(pathname) !== -1) {
      event.respondWith(networkFirstStatic(request));
      return;
    }
    event.respondWith(cacheFirstStatic(request));
  }
});
