// Main app — view router, modal state, theme, live data loading.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "warm",
  "density": "balanced",
  "showTeam": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = React.useState('today');
  const [leads, setLeads] = React.useState(LEADS); // start with sample
  const [conversations, setConversations] = React.useState(CONVERSATIONS);
  const [modalLead, setModalLead] = React.useState(null);
  const [push, toastNode] = useToasts();
  const [syncing, setSyncing] = React.useState(true);

  // Get logged-in user
  const currentUser = window.GMTT_USER || { name: 'Jaipal Menon', role: 'Lead Counselor' };

  // Apply theme
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', t.theme);
  }, [t.theme]);

  // Load live data on mount
  React.useEffect(() => {
    const loadData = async () => {
      setSyncing(true);
      try {
        // Load leads from Google Sheet
        const liveLeads = await window.loadLiveLeads();
        if (liveLeads && liveLeads.length > 0) {
          setLeads(liveLeads);
        }

        // Load open conversations from Chatwoot
        const cwData = await cwFetch('/conversations?status=open&page=1');
        const cwConvs = cwData?.data?.payload;
        if (cwConvs && cwConvs.length) {
          const mapped = cwConvs.slice(0, 20).map(c => ({
            id: 'C-' + c.id,
            _cwId: c.id,
            leadId: null,
            status: c.status || 'open',
            channel: 'whatsapp',
            unread: c.unread_count || 0,
            lastTs: c.last_activity_at ? new Date(c.last_activity_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            assigned: c.meta?.assignee?.name || null,
            preview: c.last_non_activity_message?.content || '',
            _phone: c.meta?.sender?.phone_number || '',
            _name:  c.meta?.sender?.name || 'Unknown',
            messages: [],
          }));
          setConversations(mapped);
        }
      } catch(e) {
        console.warn('Live data load failed, sample data active');
      }
      setSyncing(false);
    };

    loadData();
    // Auto-refresh every 2 min
    const interval = setInterval(loadData, 120000);
    return () => clearInterval(interval);
  }, []);

  // Stage change — updates local state + persists to GSheet
  const onStageChange = React.useCallback((id, stage) => {
    setLeads((prev) => prev.map((l) => l.id === id
      ? { ...l, stage, inviteSent: l.inviteSent || stage === 'invited' || stage === 'completed' }
      : l));
    if (modalLead && modalLead.id === id) {
      setModalLead({ ...modalLead, stage });
    }
    // Persist to Google Sheet
    const lead = leads.find(l => l.id === id);
    if (lead?.phone) {
      apiPost('/guiders-update-lead', { phone: lead.phone, updates: { Stage: stage } })
        .catch(() => {});
    }
    push(`Stage → ${stage}`, { icon: 'check' });
  }, [modalLead, leads]);

  // Keep modalLead in sync
  const modalLeadLive = modalLead ? leads.find(l => l.id === modalLead.id) || modalLead : null;

  // Counts for sidebar
  const counts = {
    new: leads.filter(l => l.stage === 'new').length,
    leads: leads.length,
    unread: conversations.reduce((s, c) => s + (c.unread || 0), 0),
  };

  // Cmd+K search focus
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
        <Topbar view={view} onJump={setView} syncing={syncing} currentUser={currentUser} />
        <div className="content">
          {view === 'today'         && <Today leads={leads} conversations={conversations} onOpenLead={setModalLead} onJump={setView} currentUser={currentUser} />}
          {view === 'pipeline'      && <Pipeline leads={leads} onOpenLead={setModalLead} onStageChange={onStageChange} push={push} />}
          {view === 'leads'         && <Leads leads={leads} onOpenLead={setModalLead} onStageChange={onStageChange} push={push} />}
          {view === 'conversations' && <Conversations leads={leads} conversations={conversations} onOpenLead={setModalLead} push={push} />}
          {view === 'email'         && <EmailComposer leads={leads} push={push} />}
          {view === 'whatsapp'      && <WhatsAppFollowup leads={leads} push={push} />}
          {view === 'templates'     && <Templates push={push} />}
          {view === 'analytics'     && <Analytics leads={leads} conversations={conversations} />}
          {view === 'payments'      && <Payments push={push} />}
          {view === 'settings'      && <Settings push={push} />}
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
        <TweakSection label="Account" />
        <div style={{ padding: '8px 14px' }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{currentUser.name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{currentUser.role}</div>
          <button className="btn btn--sm btn--ghost" style={{ marginTop: 10, width: '100%' }}
            onClick={() => { sessionStorage.removeItem('gmtt_user'); window.location.href = 'login.html'; }}>
            Sign out
          </button>
        </div>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
