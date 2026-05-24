// ── GMTT CRM — Config + Cache + API ───────────────────────────────────────
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
  CACHE_TTL:      5 * 60 * 1000,   // 5 min in-memory
  LS_KEY_LEADS:   'gmtt_leads_v1',
  LS_KEY_CONVS:   'gmtt_convs_v1',
  LS_KEY_SYNC:    'gmtt_last_sync',
};

// ── Persistent cache (localStorage — survives page reload + new sessions) ──
window.LSCache = {
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch(e) { return null; }
  },
  set(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
  },
  clear(key) {
    try { localStorage.removeItem(key); } catch(e) {}
  },
};

// ── In-memory cache (fast, current session) ────────────────────────────────
window._memCache = {};
window.clearApiCache = () => { window._memCache = {}; };

// ── n8n POST ───────────────────────────────────────────────────────────────
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

// ── Chatwoot ───────────────────────────────────────────────────────────────
window.cwFetch = async (path, method = 'GET', body) => {
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
  return r.json();
};
