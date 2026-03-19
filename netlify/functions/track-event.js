const crypto = require('crypto');
const { json, parseBody, fanout, log } = require('./_common');
const db = require('./_db');

const STORE_FUNNEL_EVENT_MAP = {
  store_purchase_intent_submitted: 'lead_submitted',
  store_purchase_intent_abandoned: 'lead_abandoned',
  store_embedded_checkout_opened: 'checkout_opened',
  store_checkout_form_started: 'form_started',
  store_checkout_offer_selected: 'offer_selected',
  store_lead_submit_started: 'lead_submit_started',
  store_lead_submit_error: 'lead_submit_error',
  store_checkout_launch_clicked: 'checkout_launch_clicked',
  store_checkout_session_created: 'checkout_session_created',
  store_checkout_mount_succeeded: 'checkout_mount_succeeded',
  store_checkout_modal_closed: 'checkout_modal_closed',
  store_checkout_launch_error: 'checkout_launch_error',
  store_checkout_abandoned: 'checkout_abandoned'
};

function firstHeader(event, names) {
  for (const name of names) {
    const value = event.headers && (event.headers[name] || event.headers[name.toLowerCase()] || event.headers[name.toUpperCase()]);
    if (value) return String(value);
  }
  return '';
}

function getPage(body, event) {
  const explicit = String(body.page || '').trim();
  if (explicit) return explicit;
  const referer = firstHeader(event, ['referer', 'referrer']);
  if (!referer) return '';
  try {
    return new URL(referer).pathname || '';
  } catch (err) {
    return '';
  }
}

function enrichProperties(name, properties) {
  const step = STORE_FUNNEL_EVENT_MAP[name];
  const next = Object.assign({}, properties || {});
  if (step) {
    next.funnel = 'store_checkout';
    next.funnel_step = step;
    if (!next.funnel_offer && next.offer) next.funnel_offer = next.offer;
    if (!next.offer && next.funnel_offer) next.offer = next.funnel_offer;
  }
  return next;
}

exports.handler = async function (event) {
  if (event.httpMethod === 'GET') {
    return json(200, {
      ok: true,
      status: 'ok',
      service: 'track-event',
      time: new Date().toISOString()
    });
  }

  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });
  const body = await parseBody(event);
  if (!body) return json(400, { ok: false, error: 'Invalid JSON body' });

  const name = String(body.event_name || '').trim();
  if (!name) return json(400, { ok: false, error: 'event_name is required' });
  const receivedAt = new Date().toISOString();
  const properties = enrichProperties(name, body.properties && typeof body.properties === 'object' ? body.properties : {});

  const evt = {
    event_id: 'evt_' + crypto.randomBytes(6).toString('hex'),
    at: receivedAt,
    event_name: name,
    page: getPage(body, event),
    source: String(body.source || '').trim() || (properties.funnel || ''),
    properties: properties,
    context: {
      user_agent: event.headers['user-agent'] || '',
      ip_hint: event.headers['x-forwarded-for'] || '',
      referer: firstHeader(event, ['referer', 'referrer']),
      request_id: 'req_' + crypto.randomBytes(5).toString('hex'),
      server_received_at: receivedAt
    }
  };

  const storage = await db.saveEvent(evt);
  const delivery = await fanout({ type: 'analytics_event', event: evt });
  log.info('event tracked', {
    name,
    funnel: evt.properties && evt.properties.funnel ? evt.properties.funnel : undefined,
    step: evt.properties && evt.properties.funnel_step ? evt.properties.funnel_step : undefined,
    offer: evt.properties && evt.properties.funnel_offer ? evt.properties.funnel_offer : undefined,
    email: evt.properties && evt.properties.email ? evt.properties.email : undefined
  });
  return json(200, { ok: true, event_id: evt.event_id, storage: storage.storage, delivery });
};
