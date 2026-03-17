'use strict';

var STATIC_CACHE = 'efi-static-v1';
var PAGE_CACHE = 'efi-pages-v1';
var ALL_CACHES = [STATIC_CACHE, PAGE_CACHE];

var CORE_PAGES = [
  '/',
  '/index.html',
  '/about.html',
  '/curriculum.html',
  '/resources.html',
  '/getting-started.html',
  '/free-executive-functioning-tests.html',
  '/search.html',
  '/certification.html'
];

var SHARED_ASSETS = [
  '/css/styles.css',
  '/favicon.svg',
  '/images/og-image.svg',
  '/js/main.js',
  '/js/main.bundle.min.js',
  '/js/main.bundle.js',
  '/js/main-analytics.js',
  '/js/main-learning-loop.js',
  '/js/main-ui.js',
  '/js/search.js',
  '/data/search-index.json'
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

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  if (shouldHandleHtml(request)) {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (shouldHandleStatic(request)) {
    event.respondWith(cacheFirstStatic(request));
  }
});
