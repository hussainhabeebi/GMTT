// ── GMTT CRM — Live API Configuration ─────────────────────────────────────
window.GMTT_CONFIG = {
  N8N:            'https://n8n.aiingo.com/webhook',
  CHATWOOT_URL:   'https://app.aiingo.com',
  CHATWOOT_ACC:   6,
  CHATWOOT_TOKEN: 'vsBz2BHfdvU5eYifV3VvUBN3',
  CHATWOOT_PUB:   'https://app.aiingo.com/app/accounts/6',
  WA_PHONE_ID:    '1079935485214110',
  WA_WABA_ID:     '1703472947338466',
  WA_NUMBER:      '+91 77360 09983',
  GS_ID:          '1SuTrvOOtTL5t0xheioaXf-nlwyiPiutpfPTLa2WX8gA',
  STRIPE_PK:      'pk_live_51R1PadJWa5B2ayZg4ytt9Q9hI0b8j3Br1jXy7o1FVsiwBgPt6QGx4wYeWuonnkUyH82xRDNHB54xg95dK7wJkpG900cPYq5DuQ',
  STRIPE_TABLE:   'prctbl_1TaK2NJWa5B2ayZgqa6bHL33',
  CACHE_TTL:      90000,
};

// ── API helper ─────────────────────────────────────────────────────────────
window._cache = {};
window.apiGet = async (wh, opts = {}) => {
  const url = `${GMTT_CONFIG.N8N}${wh}`;
  const key = url + JSON.stringify(opts);
  const hit = window._cache[key];
  if (hit && Date.now() - hit.t < GMTT_CONFIG.CACHE_TTL) return hit.d;
  const r = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const d = await r.json();
  window._cache[key] = { d, t: Date.now() };
  return d;
};
window.apiPost = async (wh, body) => {
  const r = await fetch(`${GMTT_CONFIG.N8N}${wh}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
};
window.cwFetch = async (path, method = 'GET', body) => {
  const key = 'cw:' + path + method;
  if (method === 'GET') {
    const hit = window._cache[key];
    if (hit && Date.now() - hit.t < GMTT_CONFIG.CACHE_TTL) return hit.d;
  }
  const r = await fetch(`${GMTT_CONFIG.CHATWOOT_URL}/api/v1/accounts/${GMTT_CONFIG.CHATWOOT_ACC}${path}`, {
    method,
    headers: { 'api_access_token': GMTT_CONFIG.CHATWOOT_TOKEN, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const d = await r.json();
  if (method === 'GET') window._cache[key] = { d, t: Date.now() };
  return d;
};
window.clearApiCache = () => { window._cache = {}; };
