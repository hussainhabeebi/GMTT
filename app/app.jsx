// GMTT CRM — app.jsx — live data only, no sample fallback

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "warm",
  "density": "balanced"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak]            = useTweaks(TWEAK_DEFAULTS);
  const [view, setView]          = React.useState('today');
  const [leads, setLeads]        = React.useState([]);
  const [conversations, setConversations] = React.useState([]);
  const [modalLead, setModalLead]= React.useState(null);
  const [push, toastNode]        = useToasts();
  const [loading, setLoading]    = React.useState(true);
  const [error, setError]        = React.useState(null);
  const [lastSync, setLastSync]  = React.useState(null);

  const currentUser = window.GMTT_USER || { name: 'Counselor', role: 'Guiders Mission' };

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', t.theme);
  }, [t.theme]);

  // ── Load all live data ──────────────────────────────────────────────────
  const loadAll = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      // Load leads first (critical), conversations secondary
      let liveLeads = [];
      try {
        liveLeads = await window.loadLiveLeads();
        setLeads(liveLeads || []);
      } catch (e) {
        console.error('Leads load failed:', e);
        setError(`Could not load leads.

Check:
1. n8n workflow "GMTT 1 — Get Leads" is active
2. Webhook URL: n8n.aiingo.com/webhook/guiders-get-leads
3. Google Sheets credential is connected

Error: ${e.message}`);
        setLoading(false);
        return;
      }

      // Conversations — non-critical, fail silently
      try {
        const liveConvs = await window.loadLiveConversations('open');
        setConversations(liveConvs || []);
      } catch (e) {
        console.warn('Conversations load failed (non-critical):', e);
      }

      setLastSync(new Date());
    } catch (e) {
      console.error('Load failed:', e);
      setError(`Connection failed: ${e.message}`);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadAll();
    const iv = setInterval(() => loadAll(true), 120000);
    return () => clearInterval(iv);
  }, [loadAll]);

  // ── Stage change → GSheet ───────────────────────────────────────────────
  const onStageChange = React.useCallback((id, stage) => {
    const lead = leads.find(l => l.id === id);
    setLeads(prev => prev.map(l =>
      l.id === id ? { ...l, stage, inviteSent: l.inviteSent || ['invited','completed'].includes(stage) } : l
    ));
    if (modalLead?.id === id) setModalLead(prev => ({ ...prev, stage }));
    if (lead?.phone) {
      apiPost('/guiders-update-lead', { phone: lead.phone, updates: { Stage: stage } })
        .catch(() => {});
    }
    push(`Stage → ${stage}`, { icon: 'check' });
  }, [leads, modalLead]);

  const modalLeadLive = modalLead ? leads.find(l => l.id === modalLead.id) || modalLead : null;

  const counts = {
    new:    leads.filter(l => l.stage === 'new').length,
    leads:  leads.length,
    unread: conversations.reduce((s, c) => s + (c.unread || 0), 0),
  };

  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('.topbar__search input')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Loading screen ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', gap: 16,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'var(--accent)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#fff',
          fontFamily: "'Instrument Serif', serif", fontSize: 28,
        }}>G</div>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: 'var(--ink)' }}>
          Loading workspace…
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Connecting to Google Sheets & Chatwoot</div>
        <div style={{ width: 200, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
          <div style={{
            height: '100%', background: 'var(--accent)', borderRadius: 2,
            animation: 'loadbar 1.8s ease-in-out infinite',
          }} />
        </div>
        <style>{`
          @keyframes loadbar {
            0%   { width: 0%; margin-left: 0 }
            50%  { width: 60%; margin-left: 20% }
            100% { width: 0%; margin-left: 100% }
          }
        `}</style>
      </div>
    );
  }

  // ── Error screen ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 12,
      }}>
        <div style={{ fontSize: 32 }}>⚠️</div>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: 'var(--ink)' }}>
          Connection failed
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 340, textAlign: 'center' }}>
          {error}
        </div>
        <button className="btn btn--primary" style={{ marginTop: 8 }} onClick={() => loadAll()}>
          Retry
        </button>
      </div>
    );
  }

  // ── Main app ────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <Sidebar view={view} setView={setView} counts={counts} />
      <div className="main">
        <Topbar
          view={view} onJump={setView}
          syncing={false}
          lastSync={lastSync}
          onRefresh={() => loadAll(true)}
          currentUser={currentUser}
        />
        <div className="content">
          {view === 'today'         && <Today leads={leads} conversations={conversations} onOpenLead={setModalLead} onJump={setView} currentUser={currentUser} />}
          {view === 'pipeline'      && <Pipeline leads={leads} onOpenLead={setModalLead} onStageChange={onStageChange} push={push} />}
          {view === 'leads'         && <Leads leads={leads} onOpenLead={setModalLead} onStageChange={onStageChange} push={push} />}
          {view === 'conversations' && <Conversations leads={leads} conversations={conversations} setConversations={setConversations} onOpenLead={setModalLead} push={push} />}
          {view === 'email'         && <EmailComposer leads={leads} push={push} />}
          {view === 'whatsapp'      && <WhatsAppFollowup leads={leads} push={push} />}
          {view === 'templates'     && <Templates push={push} />}
          {view === 'analytics'     && <Analytics leads={leads} conversations={conversations} />}
          {view === 'payments'      && <Payments push={push} />}
          {view === 'settings'      && <Settings push={push} />}
        </div>
      </div>

      {modalLeadLive && (
        <LeadModal
          lead={modalLeadLive}
          onClose={() => setModalLead(null)}
          onStageChange={onStageChange}
          onJump={setView}
          push={push}
        />
      )}

      {toastNode}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme" />
        <TweakRadio label="Mode" value={t.theme}
          options={[
            { value: 'warm',  label: 'Warm'  },
            { value: 'light', label: 'Light' },
            { value: 'dark',  label: 'Dark'  },
          ]}
          onChange={(v) => setTweak('theme', v)} />
        <TweakSection label="Layout" />
        <TweakRadio label="Density" value={t.density}
          options={['compact','balanced','spacious']}
          onChange={(v) => setTweak('density', v)} />
        <TweakSection label="Account" />
        <div style={{ padding: '8px 14px' }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{currentUser.name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{currentUser.role}</div>
          <button
            className="btn btn--sm btn--ghost"
            style={{ marginTop: 10, width: '100%' }}
            onClick={() => { sessionStorage.removeItem('gmtt_user'); window.location.href = 'login.html'; }}
          >
            Sign out
          </button>
        </div>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
