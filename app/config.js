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

// ── Cache ──────────────────────────────────────────────────────────────────
window._cache = {};
window.clearApiCache = () => { window._cache = {}; };

// ── POST to n8n webhook ────────────────────────────────────────────────────
window.apiPost = async (path, body) => {
  const url = GMTT_CONFIG.N8N + path;
  const r = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body || {}),
  });
  if (!r.ok) throw new Error(`n8n ${path} → HTTP ${r.status}`);
  const text = await r.text();
  if (!text) return {};
  return JSON.parse(text);
};

// ── GET n8n webhook (also via POST for CORS simplicity) ──────────────────
window.apiGet = async (path) => {
  const key = path;
  const hit = window._cache[key];
  if (hit && Date.now() - hit.t < GMTT_CONFIG.CACHE_TTL) return hit.d;
  const d = await apiPost(path, {});
  window._cache[key] = { d, t: Date.now() };
  return d;
};

// ── Chatwoot API ───────────────────────────────────────────────────────────
window.cwFetch = async (path, method = 'GET', body) => {
  const cacheKey = 'cw:' + method + path;
  if (method === 'GET') {
    const hit = window._cache[cacheKey];
    if (hit && Date.now() - hit.t < GMTT_CONFIG.CACHE_TTL) return hit.d;
  }
  const opts = {
    method,
    headers: {
      'api_access_token': GMTT_CONFIG.CHATWOOT_TOKEN,
      'Content-Type':     'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(
    `${GMTT_CONFIG.CHATWOOT_URL}/api/v1/accounts/${GMTT_CONFIG.CHATWOOT_ACC}${path}`,
    opts
  );
  if (!r.ok) throw new Error(`Chatwoot ${path} → HTTP ${r.status}`);
  const d = await r.json();
  if (method === 'GET') window._cache[cacheKey] = { d, t: Date.now() };
  return d;
};
