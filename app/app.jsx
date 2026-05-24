// Main app — view router, modal state, theme, tweaks panel, live n8n data.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "warm",
  "density": "balanced",
  "showTeam": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = React.useState('today');
  const [leads, setLeads] = React.useState(LEADS);
  const [conversations, setConversations] = React.useState(CONVERSATIONS);
  const [modalLead, setModalLead] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [push, toastNode] = useToasts();
  const status = useApiStatus();

  // Apply theme
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', t.theme);
  }, [t.theme]);

  // ── Live data refresh ────────────────────────────────────────────────
  const refresh = React.useCallback(async (opts = {}) => {
    setLoading(true);
    const results = await Promise.all([api.leads(), api.conversations()]);
    const [leadsRes, convRes] = results;
    if (leadsRes.data && Array.isArray(leadsRes.data) && leadsRes.data.length) {
      setLeads(leadsRes.data);
    }
    if (convRes.data && Array.isArray(convRes.data) && convRes.data.length) {
      setConversations(convRes.data);
    }
    setLoading(false);

    if (opts.toast) {
      const anyLive = results.some(r => r.live);
      const anyOffline = results.some(r => !r.live && r.error);
      if (anyLive) push('Synced from n8n', { icon: 'check' });
      else if (anyOffline) push('n8n unreachable — showing cached data', { icon: 'warn' });
      else push('No endpoints configured yet', { icon: 'warn' });
    }
  }, [push]);

  // Initial load — fire once, no toast (silent fallback)
  React.useEffect(() => { refresh(); }, []);  // eslint-disable-line

  // ── Stage change — optimistic UI + POST to n8n ─────────────────────
  const onStageChange = React.useCallback(async (id, stage) => {
    setLeads((prev) => prev.map((l) => l.id === id
      ? { ...l, stage, inviteSent: l.inviteSent || stage === 'invited' || stage === 'completed' }
      : l));
    if (modalLead && modalLead.id === id) {
      setModalLead({ ...modalLead, stage });
    }
    const res = await api.updateLead(id, { stage });
    if (!res.live && res.error) {
      push('Stage saved locally — n8n offline', { icon: 'warn' });
    }
  }, [modalLead, push]);

  // Keep modalLead in sync if the underlying leads change
  const modalLeadLive = modalLead ? leads.find(l => l.id === modalLead.id) || modalLead : null;

  // Counts for sidebar
  const counts = {
    new: leads.filter(l => l.stage === 'new').length,
    leads: leads.length,
    unread: conversations.reduce((s, c) => s + (c.unread || 0), 0),
  };

  // Cmd+K (visual only — focuses search) + Cmd+R style refresh shortcut
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

  return (
    <div className="app">
      <Sidebar view={view} setView={setView} counts={counts} />
      <div className="main">
        <Topbar view={view} onJump={setView}
                onRefresh={() => refresh({ toast: true })}
                refreshing={loading}
                status={status} />
        <div className="content">
          {view === 'today' && <Today leads={leads} conversations={conversations} status={status} onOpenLead={setModalLead} onJump={setView} />}
          {view === 'pipeline' && <Pipeline leads={leads} onOpenLead={setModalLead} onStageChange={onStageChange} push={push} />}
          {view === 'leads' && <Leads leads={leads} onOpenLead={setModalLead} onStageChange={onStageChange} push={push} />}
          {view === 'conversations' && <Conversations leads={leads} conversations={conversations} onOpenLead={setModalLead} push={push} />}
          {view === 'email' && <EmailComposer leads={leads} push={push} />}
          {view === 'whatsapp' && <WhatsAppFollowup leads={leads} push={push} />}
          {view === 'templates' && <Templates push={push} />}
          {view === 'analytics' && <Analytics leads={leads} conversations={conversations} />}
          {view === 'payments' && <Payments push={push} />}
          {view === 'settings' && <Settings push={push} onRefresh={() => refresh({ toast: true })} />}
        </div>
      </div>

      {modalLeadLive && (
        <LeadModal lead={modalLeadLive} onClose={() => setModalLead(null)}
                   onStageChange={onStageChange} onJump={setView} push={push} />
      )}

      {toastNode}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme" />
        <TweakRadio label="Mode" value={t.theme}
          options={[
            { value: 'warm',  label: 'Warm' },
            { value: 'light', label: 'Light' },
            { value: 'dark',  label: 'Dark' },
          ]}
          onChange={(v) => setTweak('theme', v)} />
        <TweakSection label="Layout" />
        <TweakRadio label="Density" value={t.density}
          options={['compact', 'balanced', 'spacious']}
          onChange={(v) => setTweak('density', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
