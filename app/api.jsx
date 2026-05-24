// n8n API client.
// Reads config from localStorage. Every method tries the live endpoint and
// falls back to the sample data baked into data.jsx if the call fails / times
// out / is not configured. The fallback keeps the UI demoable even when n8n
// is unreachable, and exposes an "online/offline" status via subscribe().

const LS_KEY = 'gmtt_n8n_config';
const FETCH_TIMEOUT_MS = 8000;

// Default config — user pastes their own webhook URLs into Settings → Integrations.
// Each endpoint can be a full https:// URL OR a path that's joined onto baseUrl.
// The blank defaults intentionally force the fallback until the user wires real URLs.
const DEFAULT_CONFIG = {
  baseUrl: 'https://n8n.aiingo.com',
  authHeader: '',          // optional bearer token / shared secret
  authHeaderName: 'X-GMTT-Token',
  endpoints: {
    leadsList:        '',  // GET  → [{id, name, ...}]
    leadsUpdate:      '',  // POST {id, fields:{stage,...}}
    conversationsList:'',  // GET  → [{id, leadId, messages, ...}]
    whatsappSend:     '',  // POST {to, leadId, body, templateName?, params?}
    emailSend:        '',  // POST {to, subject, body, leadId, template?, vars?}
    emailThreads:     '',  // GET  → [{id, leadId, subject, ...}]
    analytics:        '',  // GET  → { totals, byStage, ... }
    automationTrigger:'',  // POST {name, leadId, payload?}
  },
};

const loadConfig = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      endpoints: { ...DEFAULT_CONFIG.endpoints, ...(parsed.endpoints || {}) },
    };
  } catch (e) {
    return { ...DEFAULT_CONFIG };
  }
};

const saveConfig = (cfg) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(cfg)); } catch (e) {}
};

let _config = loadConfig();
let _status = { online: null, lastSync: null, lastError: null, lastEndpoint: null };
const _listeners = new Set();
const emit = () => _listeners.forEach((fn) => { try { fn(_status, _config); } catch (e) {} });

const resolveUrl = (endpointKey) => {
  const ep = _config.endpoints[endpointKey] || '';
  if (!ep) return null;
  if (/^https?:\/\//i.test(ep)) return ep;
  const base = (_config.baseUrl || '').replace(/\/+$/, '');
  return base + (ep.startsWith('/') ? ep : '/' + ep);
};

const withTimeout = (promise, ms) => Promise.race([
  promise,
  new Promise((_, rej) => setTimeout(() => rej(new Error('timeout after ' + ms + 'ms')), ms)),
]);

async function rawCall(endpointKey, { method = 'GET', body, query } = {}) {
  const url = resolveUrl(endpointKey);
  if (!url) throw new Error('endpoint not configured: ' + endpointKey);
  const u = new URL(url);
  if (query) Object.entries(query).forEach(([k, v]) => v != null && u.searchParams.set(k, v));
  const headers = { 'Accept': 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (_config.authHeader && _config.authHeaderName) headers[_config.authHeaderName] = _config.authHeader;

  const res = await withTimeout(fetch(u.toString(), {
    method, headers, body: body ? JSON.stringify(body) : undefined, mode: 'cors',
  }), FETCH_TIMEOUT_MS);
  if (!res.ok) throw new Error('HTTP ' + res.status + ' from ' + endpointKey);
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch (e) { return text; }
}

// Wrapper that updates status + falls back. `fallback` is a function returning
// the sample-data value; we only call it if the live call fails.
async function call(endpointKey, opts, fallback) {
  try {
    const data = await rawCall(endpointKey, opts);
    _status = { online: true, lastSync: new Date().toISOString(), lastError: null, lastEndpoint: endpointKey };
    emit();
    return { data, live: true };
  } catch (err) {
    _status = { online: false, lastSync: _status.lastSync, lastError: String(err.message || err), lastEndpoint: endpointKey };
    emit();
    return { data: fallback ? fallback() : null, live: false, error: err };
  }
}

// ── Public API ────────────────────────────────────────────────────────────
const api = {
  // Config
  getConfig: () => ({ ..._config, endpoints: { ..._config.endpoints } }),
  setConfig: (next) => {
    _config = {
      ..._config, ...next,
      endpoints: { ..._config.endpoints, ...(next.endpoints || {}) },
    };
    saveConfig(_config);
    emit();
  },
  resetConfig: () => { _config = { ...DEFAULT_CONFIG }; saveConfig(_config); emit(); },
  getStatus: () => ({ ..._status }),
  subscribe: (fn) => { _listeners.add(fn); return () => _listeners.delete(fn); },

  // Read
  leads:         () => call('leadsList',         { method: 'GET' }, () => window.LEADS),
  conversations: () => call('conversationsList', { method: 'GET' }, () => window.CONVERSATIONS),
  emailThreads:  () => call('emailThreads',      { method: 'GET' }, () => []),
  analytics:     () => call('analytics',         { method: 'GET' }, () => null),

  // Write
  updateLead:        (id, fields)         => call('leadsUpdate',       { method: 'POST', body: { id, fields } }, () => ({ ok: false, offline: true })),
  sendWhatsApp:      (payload)            => call('whatsappSend',      { method: 'POST', body: payload },         () => ({ ok: false, offline: true })),
  sendEmail:         (payload)            => call('emailSend',         { method: 'POST', body: payload },         () => ({ ok: false, offline: true })),
  triggerAutomation: (name, leadId, data) => call('automationTrigger', { method: 'POST', body: { name, leadId, payload: data || {} } }, () => ({ ok: false, offline: true })),

  // Test ping — used by Settings "Test connection" button
  async testConnection() {
    // Hit any configured GET endpoint; try leadsList → conversationsList → analytics → baseUrl/healthz
    for (const key of ['leadsList', 'conversationsList', 'analytics']) {
      try {
        if (!resolveUrl(key)) continue;
        await rawCall(key, { method: 'GET' });
        return { ok: true, via: key };
      } catch (e) {}
    }
    // Last resort: HEAD the base URL just to see if anything answers
    try {
      const base = (_config.baseUrl || '').replace(/\/+$/, '');
      if (!base) return { ok: false, error: 'no base URL configured' };
      const res = await withTimeout(fetch(base + '/healthz', { mode: 'no-cors' }), 4000);
      return { ok: res.type !== 'error', via: 'baseUrl' };
    } catch (e) {
      return { ok: false, error: String(e.message || e) };
    }
  },
};

// React hook — re-renders consumer when status changes
function useApiStatus() {
  const [st, setSt] = React.useState(api.getStatus());
  React.useEffect(() => api.subscribe((s) => setSt({ ...s })), []);
  return st;
}

Object.assign(window, { api, useApiStatus });

// ── Settings card: live editor for n8n endpoints ─────────────────────────
const ENDPOINT_DEFS = [
  { key: 'leadsList',         label: 'Leads · list',          method: 'GET',  desc: 'GET → array of leads from Google Sheets' },
  { key: 'leadsUpdate',       label: 'Leads · update',        method: 'POST', desc: 'POST {id, fields} → update sheet row' },
  { key: 'conversationsList', label: 'Conversations · list',  method: 'GET',  desc: 'GET → WhatsApp threads (Chatwoot or Meta)' },
  { key: 'whatsappSend',      label: 'WhatsApp · send',       method: 'POST', desc: 'POST {to, body, leadId, ...} → Meta Cloud API' },
  { key: 'emailSend',         label: 'Email · send',          method: 'POST', desc: 'POST {to, subject, body, ...} → SMTP' },
  { key: 'emailThreads',      label: 'Email · threads',       method: 'GET',  desc: 'GET → IMAP thread summaries' },
  { key: 'analytics',         label: 'Analytics · metrics',   method: 'GET',  desc: 'GET → aggregated KPIs' },
  { key: 'automationTrigger', label: 'Automation · trigger',  method: 'POST', desc: 'POST {name, leadId, payload} → fire a flow' },
];

function N8nEndpointsCard({ push, onRefresh }) {
  const [cfg, setCfg] = React.useState(api.getConfig());
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState(null);
  const status = useApiStatus();

  const update = (patch) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
  };
  const updateEndpoint = (key, value) => {
    setCfg({ ...cfg, endpoints: { ...cfg.endpoints, [key]: value } });
  };
  const save = () => {
    api.setConfig(cfg);
    push('n8n config saved', { icon: 'check' });
    if (onRefresh) onRefresh();
  };
  const reset = () => {
    api.resetConfig();
    setCfg(api.getConfig());
    push('Reset to defaults', { icon: 'warn' });
  };
  const test = async () => {
    setTesting(true);
    setTestResult(null);
    api.setConfig(cfg); // make sure latest values are used
    const r = await api.testConnection();
    setTestResult(r);
    setTesting(false);
    push(r.ok ? 'n8n reachable' : 'n8n unreachable', { icon: r.ok ? 'check' : 'warn' });
  };

  const online = status?.online;
  const pillCls = online === true ? 'pill pill--ok pill--dot'
                : online === false ? 'pill pill--warn pill--dot'
                : 'pill pill--neutral pill--dot';
  const pillText = online === true ? 'Live'
                 : online === false ? 'Offline · fallback'
                 : 'Not yet tested';

  const inputStyle = {
    width: '100%',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    borderRadius: 6,
    padding: '6px 9px',
    fontSize: 12.5,
    fontFamily: 'Geist Mono, ui-monospace, monospace',
    color: 'var(--ink)',
  };

  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="spread mb-12">
        <div className="row gap-10">
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FF6D5A', display: 'grid', placeItems: 'center', color: 'white' }}>
            <Icon name="spark" size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>n8n endpoints</h3>
            <div className="muted text-xs">Paste each workflow's webhook URL. Empty = sample data.</div>
          </div>
        </div>
        <span className={pillCls}>{pillText}</span>
      </div>

      {/* Base URL + auth */}
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <span className="text-xs muted" style={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Base URL</span>
        <input style={inputStyle} value={cfg.baseUrl} onChange={(e) => update({ baseUrl: e.target.value })}
               placeholder="https://n8n.aiingo.com" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <span className="text-xs muted" style={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Shared secret
          <div className="muted" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 10.5, fontWeight: 400 }}>Sent on every request</div>
        </span>
        <input style={{ ...inputStyle, maxWidth: 140 }} value={cfg.authHeaderName}
               onChange={(e) => update({ authHeaderName: e.target.value })}
               placeholder="X-GMTT-Token" />
        <input style={inputStyle} value={cfg.authHeader} type="password"
               onChange={(e) => update({ authHeader: e.target.value })}
               placeholder="optional — leave blank for URL-only auth" />
      </div>

      {/* Endpoint rows */}
      <div style={{ marginTop: 6 }}>
        {ENDPOINT_DEFS.map((def) => (
          <div key={def.key} style={{
            display: 'grid', gridTemplateColumns: '180px 1fr',
            gap: 12, alignItems: 'center', padding: '10px 0',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>
                <span style={{
                  display: 'inline-block', fontFamily: 'Geist Mono, monospace',
                  fontSize: 10, padding: '1px 5px', borderRadius: 4,
                  background: def.method === 'POST' ? 'var(--accent-coral)' : 'var(--primary-soft)',
                  color: def.method === 'POST' ? 'white' : 'var(--primary)',
                  marginRight: 6, verticalAlign: 1,
                }}>{def.method}</span>
                {def.label}
              </div>
              <div className="muted text-xs">{def.desc}</div>
            </div>
            <input style={inputStyle} value={cfg.endpoints[def.key] || ''}
                   onChange={(e) => updateEndpoint(def.key, e.target.value)}
                   placeholder={`/webhook/<random-id>/${def.key}`} />
          </div>
        ))}
      </div>

      <div className="row gap-8" style={{ marginTop: 14, justifyContent: 'space-between' }}>
        <div className="muted text-xs">
          {testResult && (
            <span style={{ color: testResult.ok ? 'var(--ok)' : 'var(--accent-coral)' }}>
              {testResult.ok ? `✓ Reachable via ${testResult.via}` : `✗ ${testResult.error || 'No endpoint responded'}`}
            </span>
          )}
        </div>
        <div className="row gap-6">
          <button className="btn btn--sm btn--ghost" onClick={reset}>Reset</button>
          <button className="btn btn--sm" onClick={test} disabled={testing}>
            {testing ? 'Testing…' : 'Test connection'}
          </button>
          <button className="btn btn--sm btn--primary" onClick={save}>
            Save & refresh
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { N8nEndpointsCard });
