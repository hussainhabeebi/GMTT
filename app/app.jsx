// GMTT CRM — app.jsx
// Strategy: show cached data instantly, refresh in background per-tab.
// localStorage persists across sessions — blank screen never happens after first load.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "warm",
  "density": "balanced"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak]          = useTweaks(TWEAK_DEFAULTS);
  const [view, setView]        = React.useState('today');
  const [leads, setLeads]      = React.useState(() => {
    // Restore from localStorage immediately — no blank screen
    const cached = window.LSCache.get(GMTT_CONFIG.LS_KEY_LEADS);
    return Array.isArray(cached) ? cached : [];
  });
  const [conversations, setConversations] = React.useState(() => {
    const cached = window.LSCache.get(GMTT_CONFIG.LS_KEY_CONVS);
    return Array.isArray(cached) ? cached : [];
  });
  const [modalLead, setModalLead]   = React.useState(null);
  const [push, toastNode]           = useToasts();
  const [syncState, setSyncState]   = React.useState('idle'); // idle | syncing | ok | error
  const [lastSync, setLastSync]     = React.useState(() => {
    const ts = window.LSCache.get(GMTT_CONFIG.LS_KEY_SYNC);
    return ts ? new Date(ts) : null;
  });

  const currentUser = window.GMTT_USER || { name: 'Counselor', role: 'Guiders Mission' };

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', t.theme);
  }, [t.theme]);

  // ── Fetch leads from n8n → update state + localStorage ─────────────────
  const fetchLeads = React.useCallback(async (silent = false) => {
    if (!silent) setSyncState('syncing');
    try {
      const liveLeads = await window.loadLiveLeads();
      if (liveLeads && liveLeads.length > 0) {
        setLeads(liveLeads);
        window.LSCache.set(GMTT_CONFIG.LS_KEY_LEADS, liveLeads);
      }
      const now = new Date();
      setLastSync(now);
      window.LSCache.set(GMTT_CONFIG.LS_KEY_SYNC, now.toISOString());
      setSyncState('ok');
    } catch(e) {
      console.warn('Leads fetch failed:', e.message);
      setSyncState('error');
      // Don't clear leads — keep showing cached data
    }
  }, []);

  // ── Fetch conversations ─────────────────────────────────────────────────
  const fetchConversations = React.useCallback(async () => {
    try {
      const liveConvs = await window.loadLiveConversations('open');
      if (liveConvs) {
        setConversations(liveConvs);
        window.LSCache.set(GMTT_CONFIG.LS_KEY_CONVS, liveConvs);
      }
    } catch(e) {
      console.warn('Conversations fetch failed (non-critical):', e.message);
    }
  }, []);

  // ── On mount: show cached instantly, then refresh in background ─────────
  React.useEffect(() => {
    // Small delay so UI renders first with cached data
    const t = setTimeout(() => {
      fetchLeads(true);   // silent = true → no spinner, just updates quietly
      fetchConversations();
    }, 300);
    return () => clearTimeout(t);
  }, []);

  // ── Per-tab refresh when user navigates to a tab ─────────────────────────
  const prevView = React.useRef(null);
  React.useEffect(() => {
    if (view === prevView.current) return;
    prevView.current = view;
    // Refresh data when switching to data-heavy tabs
    if (['today','pipeline','leads','analytics'].includes(view)) {
      fetchLeads(true);
    }
    if (view === 'conversations') {
      fetchConversations();
    }
  }, [view]);

  // ── Auto-refresh every 3 min ────────────────────────────────────────────
  React.useEffect(() => {
    const iv = setInterval(() => {
      fetchLeads(true);
      fetchConversations();
    }, 3 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  // ── Manual refresh ──────────────────────────────────────────────────────
  const handleRefresh = React.useCallback(() => {
    window.clearApiCache();
    setSyncState('syncing');
    fetchLeads(false);
    if (view === 'conversations') fetchConversations();
    push('Refreshing…', { icon: 'check' });
  }, [view, fetchLeads, fetchConversations]);

  // ── Stage change → optimistic update + persist to GSheet ────────────────
  const onStageChange = React.useCallback((id, stage) => {
    setLeads(prev => {
      const updated = prev.map(l =>
        l.id === id
          ? { ...l, stage, inviteSent: l.inviteSent || ['invited','completed'].includes(stage) }
          : l
      );
      window.LSCache.set(GMTT_CONFIG.LS_KEY_LEADS, updated); // persist immediately
      return updated;
    });
    if (modalLead?.id === id) setModalLead(prev => ({ ...prev, stage }));
    // Background persist to GSheet
    const lead = leads.find(l => l.id === id);
    if (lead?.phone) {
      apiPost('/guiders-update-lead', { phone: lead.phone, updates: { Stage: stage } })
        .catch(() => {});
    }
    push(`Stage → ${stage}`, { icon: 'check' });
  }, [leads, modalLead]);

  const modalLeadLive = modalLead
    ? leads.find(l => l.id === modalLead.id) || modalLead
    : null;

  const counts = {
    new:    leads.filter(l => l.stage === 'new').length,
    leads:  leads.length,
    unread: conversations.reduce((s, c) => s + (c.unread || 0), 0),
  };

  // Cmd+K
  React.useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('.topbar__search input')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app">
      <Sidebar view={view} setView={setView} counts={counts} />
      <div className="main">
        <Topbar
          view={view}
          onJump={setView}
          syncState={syncState}
          lastSync={lastSync}
          onRefresh={handleRefresh}
          currentUser={currentUser}
        />
        <div className="content">
          {view === 'today'         && <Today leads={leads} conversations={conversations} onOpenLead={setModalLead} onJump={setView} currentUser={currentUser} onRefresh={handleRefresh} />}
          {view === 'pipeline'      && <Pipeline leads={leads} onOpenLead={setModalLead} onStageChange={onStageChange} push={push} onRefresh={handleRefresh} />}
          {view === 'leads'         && <Leads leads={leads} onOpenLead={setModalLead} onStageChange={onStageChange} push={push} onRefresh={handleRefresh} />}
          {view === 'conversations' && <Conversations leads={leads} conversations={conversations} setConversations={setConversations} onOpenLead={setModalLead} push={push} onRefresh={fetchConversations} />}
          {view === 'email'         && <EmailComposer leads={leads} push={push} />}
          {view === 'whatsapp'      && <WhatsAppFollowup leads={leads} push={push} />}
          {view === 'templates'     && <Templates push={push} />}
          {view === 'analytics'     && <Analytics leads={leads} conversations={conversations} onRefresh={handleRefresh} />}
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
          onChange={v => setTweak('theme', v)} />
        <TweakSection label="Layout" />
        <TweakRadio label="Density" value={t.density}
          options={['compact','balanced','spacious']}
          onChange={v => setTweak('density', v)} />
        <TweakSection label="Cache" />
        <div style={{ padding: '4px 14px 10px' }}>
          <button className="btn btn--sm btn--ghost" style={{ width: '100%' }}
            onClick={() => {
              window.LSCache.clear(GMTT_CONFIG.LS_KEY_LEADS);
              window.LSCache.clear(GMTT_CONFIG.LS_KEY_CONVS);
              window.LSCache.clear(GMTT_CONFIG.LS_KEY_SYNC);
              window.clearApiCache();
              push('Cache cleared — refreshing…', { icon: 'check' });
              fetchLeads(false);
            }}>
            Clear cache & reload
          </button>
          {lastSync && (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, textAlign: 'center' }}>
              Last sync: {lastSync.toLocaleTimeString()}
            </div>
          )}
        </div>
        <TweakSection label="Account" />
        <div style={{ padding: '8px 14px' }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{currentUser.name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{currentUser.role}</div>
          <button className="btn btn--sm btn--ghost" style={{ marginTop: 10, width: '100%' }}
            onClick={() => {
              sessionStorage.removeItem('gmtt_user');
              window.location.href = 'login.html';
            }}>
            Sign out
          </button>
        </div>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
