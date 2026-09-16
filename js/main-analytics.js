(function () {
  'use strict';

  window.EFI = window.EFI || {};

  var register = window.EFI.registerMainModule || function (fn) {
    window.EFI._pendingMainModules = window.EFI._pendingMainModules || [];
    window.EFI._pendingMainModules.push(fn);
  };

  register(function (shared) {
    var EFI = window.EFI || {};
    var localSafeSet = shared && typeof shared.safeSetLocalStorage === 'function'
      ? shared.safeSetLocalStorage
      : function (key, value) {
          try {
            localStorage.setItem(key, value);
            return true;
          } catch (e) {
            return false;
          }
        };
    var canPostTracking = shared && typeof shared.canPostTracking === 'function'
      ? shared.canPostTracking
      : function () {
          return !!window.fetch;
        };

    function getCurrentPage() {
      return window.location.pathname.split('/').pop() || 'index.html';
    }

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
        localSafeSet(KEY, JSON.stringify(list.slice(-50)));
      }

      function log(type, payload) {
        var list = read();
        var item = { type: type, payload: payload, at: new Date().toISOString(), page: window.location.pathname };
        list.push(item);
        write(list);
        post({
          event_name: 'client_error',
          page: getCurrentPage(),
          source: 'telemetry',
          properties: item
        });
      }

      EFI.Telemetry = {
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
      var SENT_EVENT_IDS_KEY = 'efi_sent_event_ids_v1';

      function generateEventId() {
        return 'ev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
      }

      function markEventSent(eventId) {
        var sent = {};
        try { sent = JSON.parse(localStorage.getItem(SENT_EVENT_IDS_KEY)) || {}; } catch (e) {}
        if (sent[eventId]) return false;
        sent[eventId] = Date.now();
        var cutoff = Date.now() - (48 * 60 * 60 * 1000);
        Object.keys(sent).forEach(function (key) {
          if (sent[key] < cutoff) delete sent[key];
        });
        localSafeSet(SENT_EVENT_IDS_KEY, JSON.stringify(sent));
        return true;
      }

      function getAuthUserId() {
        try {
          if (EFI && EFI.Auth && typeof EFI.Auth.getUser === 'function') {
            var user = EFI.Auth.getUser();
            return user && user.id ? String(user.id) : null;
          }
        } catch (e) {}
        return null;
      }

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
        localSafeSet(ASSESSMENT_EVENTS_KEY, JSON.stringify((events || []).slice(-300)));
      }

      function getAuthContext() {
        try {
          if (EFI && EFI.Auth && typeof EFI.Auth.isLoggedIn === 'function') {
            var session = EFI.Auth.getSession ? EFI.Auth.getSession() : null;
            return {
              authenticated: EFI.Auth.isLoggedIn(),
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
        if (payload.event_name === 'practice_plan_generated' && planId) {
          var alreadyStored = list.some(function (event) {
            return event && event.event_name === 'practice_plan_generated' &&
              event.properties && event.properties.plan_id === planId;
          });
          if (alreadyStored) return;
        }

        var auth = getAuthContext();
        list.push({
          event_id: payload.event_id,
          event_name: payload.event_name,
          page: payload.page,
          source: payload.source,
          user_id: payload.user_id || null,
          properties: payload.properties || {},
          authenticated: auth.authenticated,
          auth_mode: auth.auth_mode,
          recorded_at: new Date().toISOString()
        });
        writeAssessmentEvents(list);
      }

      // --- GA4 bridge ---------------------------------------------------
      // Tracked events used to post only to /api/track-event, so GA4 saw
      // nothing but automatic page views and reported zero key events.
      // Every event below is mirrored into gtag so the conversions that
      // matter (tool completions, lead submits, booking clicks, resource
      // downloads) can be marked as Key Events in the GA4 admin.

      // Names GA4 collects itself; re-sending them would double-count.
      var GA_RESERVED_EVENTS = {
        page_view: true,
        first_visit: true,
        session_start: true,
        user_engagement: true
      };

      // GA4 allows [a-z0-9_], must start with a letter, 40 chars max.
      function gaSafeName(name) {
        return String(name == null ? '' : name)
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_')
          .replace(/^[^a-z]+/, '')
          .slice(0, 40);
      }

      // GA4 takes up to 25 scalar params per event, 100 chars per value.
      function gaSafeParams(properties, page, source) {
        var params = {
          page_slug: String(page || '').slice(0, 100),
          traffic_source: String(source || 'direct').slice(0, 100)
        };
        var keys = Object.keys(properties || {});
        for (var i = 0; i < keys.length && Object.keys(params).length < 25; i++) {
          var value = properties[keys[i]];
          if (value === null || value === undefined) continue;
          if (typeof value === 'object') continue;
          var key = gaSafeName(keys[i]);
          if (!key || params[key] !== undefined) continue;
          params[key] = typeof value === 'string' ? value.slice(0, 100) : value;
        }
        return params;
      }

      function sendToGa4(eventName, properties, page, source) {
        if (!canPostTracking()) return;
        if (typeof window.gtag !== 'function') return;
        var name = gaSafeName(eventName);
        if (!name || GA_RESERVED_EVENTS[name]) return;
        try {
          window.gtag('event', name, gaSafeParams(properties, page, source));
        } catch (e) {}
      }

      function track(eventName, properties) {
        var page = getCurrentPage();
        var params = new URLSearchParams(window.location.search || '');
        var source = params.get('utm_source') || params.get('source') || document.referrer || 'direct';
        var eventId = generateEventId();
        var userId = getAuthUserId();
        var payload = {
          event_id: eventId,
          event_name: eventName,
          page: page,
          source: source,
          user_id: userId,
          properties: properties || {}
        };

        storeAssessmentEvent(payload);
        if (markEventSent(eventId)) {
          sendToGa4(eventName, payload.properties, page, source);
          return post(payload);
        }
        return Promise.resolve();
      }

      EFI.Analytics = {
        track: track,
        getAssessmentEvents: readAssessmentEvents
      };

      // Page scripts load before this bundle finishes, so anything they
      // tracked in the meantime is queued on EFI._pendingAnalyticsEvents.
      var queued = Array.isArray(EFI._pendingAnalyticsEvents) ? EFI._pendingAnalyticsEvents : [];
      // Leave a push-through sink behind rather than clearing the queue: a
      // script that read the queue before this ran would otherwise push into
      // an array nothing drains again.
      EFI._pendingAnalyticsEvents = {
        push: function (item) {
          if (item && item[0]) track(item[0], item[1] || {});
        }
      };
      queued.forEach(function (item) {
        if (item && item[0]) track(item[0], item[1] || {});
      });

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

      // Downloading a PDF is a successful visit, but it adds no second page
      // view, so those sessions were counted as bounces. Name the event
      // resource_download rather than GA4's built-in file_download so it
      // cannot double-count against enhanced measurement.
      var DOWNLOADABLE = /\.(pdf|docx?|xlsx?|pptx?|csv|zip|txt)(?:[?#]|$)/i;

      function decodeFileName(value) {
        try {
          return decodeURIComponent(value);
        } catch (e) {
          return value;
        }
      }

      document.addEventListener('click', function (e) {
        if (!e.target || !e.target.closest) return;
        // Already covered by the data-analytics-event handler above.
        if (e.target.closest('[data-analytics-event]')) return;
        var link = e.target.closest('a[href]');
        if (!link) return;
        var href = link.getAttribute('href') || '';
        if (!DOWNLOADABLE.test(href) && !link.hasAttribute('download')) return;
        var fileName = href.split(/[?#]/)[0].split('/').pop() || href;
        var extMatch = fileName.match(/\.([a-z0-9]+)$/i);
        track('resource_download', {
          file_name: decodeFileName(fileName).slice(0, 100),
          file_extension: extMatch ? extMatch[1].toLowerCase() : 'unknown',
          link_text: (link.textContent || '').trim().slice(0, 80)
        });
      });
    })();
  });
})();
