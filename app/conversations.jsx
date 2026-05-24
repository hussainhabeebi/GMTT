// Conversations — Chatwoot-style inbox with fast reply UX.
// Three-column: list → thread → lead context. Enter to send. Reply persists locally.
// Bottom-bar quick-replies. "Open in Chatwoot" button always visible.

const CHATWOOT_BASE = 'https://app.aiingo.com/app/accounts/6';

function Conversations({ leads, conversations: initial, onOpenLead, push }) {
  const [tab, setTab] = React.useState('open');
  const [activeId, setActiveId] = React.useState(initial.find(c => c.status === 'open')?.id);
  const [convos, setConvos] = React.useState(initial);
  const [search, setSearch] = React.useState('');
  const [draft, setDraft] = React.useState('');
  const draftRef = React.useRef(null);
  const threadRef = React.useRef(null);

  const filtered = convos
    .filter(c => c.status === tab)
    .filter(c => {
      if (!search) return true;
      const lead = leads.find(l => l.id === c.leadId);
      return (lead?.name + ' ' + (c.preview || '')).toLowerCase().includes(search.toLowerCase());
    });

  // Auto-pick first item when tab changes / nothing selected
  React.useEffect(() => {
    if (!filtered.find(c => c.id === activeId)) {
      setActiveId(filtered[0]?.id);
    }
  }, [tab, convos.length]);

  const active = convos.find(c => c.id === activeId);
  const activeLead = active ? leads.find(l => l.id === active.leadId) : null;

  // Scroll thread to bottom on conversation switch or new message
  React.useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [activeId, active?.messages?.length]);

  // Counts per status (for tab badges)
  const counts = {
    open:     convos.filter(c => c.status === 'open').length,
    pending:  convos.filter(c => c.status === 'pending').length,
    resolved: convos.filter(c => c.status === 'resolved').length,
  };
  const unreadCount = convos.filter(c => c.status === 'open').reduce((s, c) => s + c.unread, 0);

  const send = () => {
    const body = draft.trim();
    if (!body || !active) return;
    setConvos(convos.map(c =>
      c.id === active.id
        ? { ...c, lastTs: 'just now', preview: body,
            messages: [...c.messages, { from: 'me', ts: 'just now', body, author: 'Jaipal' }] }
        : c
    ));
    setDraft('');
    push('Reply sent', { icon: 'send' });
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const resolve = () => {
    setConvos(convos.map(c => c.id === active.id ? { ...c, status: 'resolved' } : c));
    push(`${activeLead?.name.split(' ')[0]} resolved`, { icon: 'check' });
  };
  const reopen = () => {
    setConvos(convos.map(c => c.id === active.id ? { ...c, status: 'open' } : c));
  };
  const markRead = (id) => {
    setConvos(convos.map(c => c.id === id ? { ...c, unread: 0 } : c));
  };

  const QUICK_REPLIES = [
    { id: 'greet',   label: 'Greet',   text: 'Hello! Thank you for reaching out to Guiders Mission. How can I help you today?' },
    { id: 'docs',    label: 'Send doc checklist', text: 'Please share:\n1. Passport (front + back)\n2. Nursing registration certificate\n3. Latest experience certificate\n4. OET/IELTS scorecard' },
    { id: 'confirm', label: 'Confirm call', text: `Confirmed. Your call is scheduled for ${activeLead?.callTime || ''} on ${activeLead?.offDay || ''}. Talk soon!` },
    { id: 'thanks',  label: 'Thanks',  text: 'Thank you for the quick response — we will be in touch shortly.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        title="Conversations"
        sub={`${unreadCount} unread · synced with Chatwoot inbox #7`}
        right={[
          <SegTabs key="tabs" value={tab} onChange={setTab} options={[
            { value: 'open', label: 'Open', count: counts.open },
            { value: 'pending', label: 'Pending', count: counts.pending },
            { value: 'resolved', label: 'Resolved', count: counts.resolved },
          ]} />,
          <a key="cw" href={CHATWOOT_BASE} target="_blank" rel="noopener" className="btn btn--sm">
            <Icon name="external" size={12} /> Open in Chatwoot
          </a>,
        ]}
      />

      <div style={{
        flex: 1, minHeight: 0,
        display: 'grid',
        gridTemplateColumns: '320px 1fr 300px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}>
        {/* List */}
        <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="row gap-6" style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '4px 10px', height: 30,
            }}>
              <Icon name="search" size={13} style={{ color: 'var(--muted)' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations…"
                style={{ border: 0, background: 'transparent', outline: 'none', flex: 1, fontSize: 13 }} />
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map((c) => {
              const lead = leads.find(l => l.id === c.leadId);
              const isActive = c.id === activeId;
              return (
                <div key={c.id}
                  onClick={() => { setActiveId(c.id); markRead(c.id); }}
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: isActive ? 'var(--primary-soft)' : c.unread > 0 ? 'var(--surface-2)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                    position: 'relative',
                  }}>
                  <div className="row gap-10" style={{ alignItems: 'flex-start' }}>
                    <div style={{ position: 'relative' }}>
                      <Avatar name={lead?.name || '??'} />
                      <span style={{
                        position: 'absolute', bottom: -2, right: -2,
                        width: 14, height: 14, borderRadius: '50%',
                        background: '#25D366',
                        border: '2px solid var(--surface)',
                        display: 'grid', placeItems: 'center',
                      }}>
                        <Icon name="whatsapp" size={8} style={{ color: 'white' }} />
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="spread">
                        <b style={{
                          fontSize: 13.5,
                          fontWeight: c.unread > 0 ? 700 : 600,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{lead?.name}</b>
                        <span className="text-xs muted">{c.lastTs}</span>
                      </div>
                      <div style={{
                        fontSize: 12.5,
                        color: c.unread > 0 ? 'var(--ink)' : 'var(--muted)',
                        fontWeight: c.unread > 0 ? 500 : 400,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        marginTop: 2,
                      }}>{c.preview}</div>
                      <div className="row gap-6 mt-4">
                        {lead && (
                          <span className={'stage-tag stage-' + lead.stage} style={{ fontSize: 10 }}>
                            {STAGES.find(s => s.id === lead.stage)?.name}
                          </span>
                        )}
                        {c.assigned && (
                          <span className="text-xs muted">{TEAM.find(t => t.id === c.assigned)?.name.split(' ')[0]}</span>
                        )}
                        {!c.assigned && <span className="pill pill--warn text-xs">Unassigned</span>}
                      </div>
                    </div>
                    {c.unread > 0 && (
                      <span style={{
                        background: 'var(--accent-coral)', color: 'white',
                        fontSize: 10.5, fontWeight: 700,
                        minWidth: 18, height: 18, borderRadius: 9,
                        display: 'grid', placeItems: 'center',
                        padding: '0 5px',
                      }}>{c.unread}</span>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                No {tab} conversations.
              </div>
            )}
          </div>
        </div>

        {/* Thread */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--surface-2)' }}>
          {!active ? (
            <div style={{
              flex: 1, display: 'grid', placeItems: 'center',
              color: 'var(--muted)', flexDirection: 'column',
            }}>
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Icon name="inbox" size={32} style={{ color: 'var(--muted-2)', marginBottom: 12 }} />
                <div className="text-lg" style={{ fontFamily: "'Instrument Serif', serif", marginBottom: 4 }}>
                  Select a conversation
                </div>
                <div className="text-xs muted">Press <span className="topbar__kbd">↑</span> <span className="topbar__kbd">↓</span> to navigate, <span className="topbar__kbd">Enter</span> to reply.</div>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div style={{
                padding: '12px 18px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--surface)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{activeLead?.name}</div>
                  <div className="text-xs muted row gap-6">
                    <span>{activeLead?.phone}</span>
                    <span className="dim">·</span>
                    <span>{active.id}</span>
                  </div>
                </div>
                <div style={{ flex: 1 }} />
                {active.assigned ? (
                  <div className="row gap-6 text-xs muted">
                    <Avatar name={TEAM.find(t => t.id === active.assigned)?.name || '??'} size="sm" />
                    <span>Assigned to {TEAM.find(t => t.id === active.assigned)?.name}</span>
                  </div>
                ) : (
                  <button className="btn btn--sm">
                    <Icon name="user" size={12} /> Assign to me
                  </button>
                )}
                {active.status === 'resolved' ? (
                  <button className="btn btn--sm" onClick={reopen}>
                    <Icon name="refresh" size={12} /> Reopen
                  </button>
                ) : (
                  <button className="btn btn--sm" onClick={resolve}>
                    <Icon name="check" size={12} /> Resolve
                  </button>
                )}
                <a href={`${CHATWOOT_BASE}/conversations/${active.id.replace('C-', '')}`} target="_blank" rel="noopener"
                   className="btn btn--sm btn--ghost tt" data-tt="Open in Chatwoot">
                  <Icon name="external" size={12} />
                </a>
              </div>

              {/* Messages */}
              <div ref={threadRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                {active.messages.map((m, i) => {
                  const mine = m.from === 'me';
                  const showAvatar = i === 0 || active.messages[i - 1].from !== m.from;
                  return (
                    <div key={i} style={{
                      display: 'flex',
                      gap: 8,
                      marginBottom: 4,
                      marginTop: showAvatar && i > 0 ? 16 : 0,
                      justifyContent: mine ? 'flex-end' : 'flex-start',
                    }}>
                      {!mine && (
                        <div style={{ width: 28, flexShrink: 0 }}>
                          {showAvatar && <Avatar name={activeLead?.name || '??'} size="sm" />}
                        </div>
                      )}
                      <div style={{ maxWidth: '70%' }}>
                        {showAvatar && (
                          <div className="text-xs muted" style={{
                            marginBottom: 4,
                            textAlign: mine ? 'right' : 'left',
                          }}>
                            {mine ? (m.author || 'Jaipal') : activeLead?.name?.split(' ')[0]} · {m.ts}
                          </div>
                        )}
                        <div style={{
                          padding: '8px 12px',
                          borderRadius: 12,
                          fontSize: 13.5,
                          lineHeight: 1.45,
                          background: mine ? 'var(--primary)' : 'var(--surface)',
                          color: mine ? 'white' : 'var(--ink)',
                          borderTopLeftRadius: mine ? 12 : showAvatar ? 4 : 12,
                          borderTopRightRadius: mine ? (showAvatar ? 4 : 12) : 12,
                          border: mine ? 'none' : '1px solid var(--border)',
                          boxShadow: 'var(--shadow-sm)',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}>{m.body}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Composer */}
              <div style={{
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--surface)',
                padding: 14,
              }}>
                {/* Quick replies */}
                <div className="row gap-6 mb-8" style={{ flexWrap: 'wrap' }}>
                  <span className="text-xs muted" style={{ fontWeight: 500 }}>Quick:</span>
                  {QUICK_REPLIES.map(q => (
                    <button key={q.id} onClick={() => setDraft(q.text)}
                      style={{
                        background: 'var(--bg-sunken)',
                        border: '1px solid var(--border)',
                        color: 'var(--ink-soft)',
                        padding: '3px 9px',
                        fontSize: 11.5,
                        borderRadius: 6,
                        fontWeight: 500,
                      }}>
                      {q.label}
                    </button>
                  ))}
                  <button style={{
                    background: 'transparent', border: 0, color: 'var(--muted)',
                    fontSize: 11.5, padding: '3px 5px', display: 'inline-flex', alignItems: 'center', gap: 3,
                  }}>
                    <Icon name="templates" size={11} /> Templates
                  </button>
                </div>
                <div style={{
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  background: 'var(--surface)',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <textarea
                    ref={draftRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onKey}
                    placeholder={`Reply to ${activeLead?.name?.split(' ')[0]}…  (Enter to send, Shift+Enter for new line)`}
                    rows={2}
                    style={{
                      border: 0, outline: 'none', resize: 'none',
                      padding: '10px 12px', fontSize: 13.5,
                      background: 'transparent', minHeight: 50, fontFamily: 'inherit',
                    }}
                  />
                  <div className="spread" style={{ padding: '6px 8px 6px 12px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div className="row gap-4">
                      <button className="topbar__icon-btn tt" data-tt="Attach"><Icon name="paperclip" size={14} /></button>
                      <button className="topbar__icon-btn tt" data-tt="Templates"><Icon name="templates" size={14} /></button>
                      <span className="text-xs muted" style={{ marginLeft: 4 }}>
                        Sending via WhatsApp Cloud · WABA 1703…8466
                      </span>
                    </div>
                    <div className="row gap-6">
                      <span className="text-xs muted">
                        <span className="topbar__kbd">Enter</span> to send
                      </span>
                      <button className="btn btn--primary btn--sm" onClick={send} disabled={!draft.trim()}>
                        <Icon name="send" size={12} /> Reply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Lead context panel */}
        <div style={{
          borderLeft: '1px solid var(--border)',
          background: 'var(--surface)',
          overflowY: 'auto',
        }}>
          {activeLead && (
            <div style={{ padding: 18 }}>
              <div style={{ textAlign: 'center', paddingBottom: 18, borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'inline-block', marginBottom: 10 }}>
                  <Avatar name={activeLead.name} size="lg" />
                </div>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, lineHeight: 1.1 }}>
                  {activeLead.name}
                </div>
                <div className="muted text-xs mt-4">{activeLead.degree} · {activeLead.state}</div>
                <div className="row gap-4 mt-8" style={{ justifyContent: 'center' }}>
                  <span className={'stage-tag stage-' + activeLead.stage}>
                    {STAGES.find(s => s.id === activeLead.stage)?.name}
                  </span>
                  {activeLead.eligible === true && <span className="pill pill--ok pill--dot">Eligible</span>}
                  {activeLead.eligible === false && <span className="pill pill--danger pill--dot">Not eligible</span>}
                </div>
              </div>

              <div style={{ paddingTop: 14 }}>
                <div className="section-title">Profile</div>
                {[
                  ['Phone', activeLead.phone, 'mono'],
                  ['Region', activeLead.gulf],
                  ['English', activeLead.english],
                  ['Off day', activeLead.offDay],
                  ['Call time', activeLead.callTime, 'mono'],
                  ['Reg. year', activeLead.regYear, 'mono'],
                  ['Source', activeLead.source],
                ].map(([k, v, mono]) => (
                  <div key={k} className="spread" style={{ padding: '7px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span className="text-xs muted" style={{ fontWeight: 500 }}>{k}</span>
                    <span className={mono ? 'mono text-sm' : 'text-sm'} style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>

              <div className="mt-16 col-flex gap-8">
                <button className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => onOpenLead(activeLead)}>
                  Full profile <Icon name="arrowRight" size={12} />
                </button>
                <button className="btn" style={{ width: '100%', justifyContent: 'center' }}>
                  <Icon name="mail" size={12} /> Send email
                </button>
                <button className="btn" style={{ width: '100%', justifyContent: 'center' }}>
                  <Icon name="phone" size={12} /> Log call
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Conversations });
