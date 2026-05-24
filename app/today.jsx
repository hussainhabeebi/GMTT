// Today (dashboard home) + Pipeline (kanban)

function Today({ leads, conversations, onOpenLead, onJump }) {
  const todayCallList = leads
    .filter((l) => ['eligible', 'invited', 'collecting'].includes(l.stage))
    .slice(0, 6);

  const newLast24h = leads.filter((l) => l.stage === 'new');

  const pipelineCounts = STAGES.map((s) => ({
    ...s,
    count: leads.filter((l) => l.stage === s.id).length,
  }));

  const overdue = leads.filter((l) => l.stage === 'collecting').slice(0, 3);

  const todayUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div>
      <PageHeader
        eyebrow={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        title="Good morning,"
        accent="Jaipal"
        sub="Here's what needs your attention today."
        right={[
          <span key="syncing" className="pill pill--ok pill--dot">Sheet synced · 2m ago</span>,
        ]}
      />

      {/* Pipeline summary row */}
      <div className="grid mb-24" style={{ gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
        {pipelineCounts.map((s) => (
          <button
            key={s.id}
            onClick={() => onJump('pipeline')}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderLeft: `3px solid ${s.color}`,
              borderRadius: 'var(--radius)',
              padding: '12px 14px',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
              {s.name}
            </div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, lineHeight: 1, marginTop: 4 }}>
              {s.count}
            </div>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
        {/* Today's call list */}
        <div className="card">
          <div className="card-hd">
            <h3>Today's call list <span className="muted" style={{ fontWeight: 400 }}>· {todayCallList.length}</span></h3>
            <div className="row gap-8">
              <span className="muted text-xs">Sorted by off day + call time</span>
              <button className="btn btn--sm btn--ghost" onClick={() => onJump('leads')}>
                View all <Icon name="arrowRight" size={12} />
              </button>
            </div>
          </div>
          <div>
            {todayCallList.map((lead, i) => (
              <div
                key={lead.id}
                onClick={() => onOpenLead(lead)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr auto auto auto',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 18px',
                  borderTop: i === 0 ? 0 : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Avatar name={lead.name} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{lead.name}</div>
                  <div className="muted text-xs row gap-6">
                    <span>{lead.degree}</span><span className="dim">·</span>
                    <span>{lead.state}</span><span className="dim">·</span>
                    <span>{lead.gulf}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="text-xs muted">Off day</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{lead.offDay}</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 80 }}>
                  <div className="text-xs muted">Call time</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{lead.callTime}</div>
                </div>
                <div className="row gap-4">
                  <button className="btn btn--sm btn--icon tt" data-tt="Call" onClick={(e) => e.stopPropagation()}>
                    <Icon name="phone" size={13} />
                  </button>
                  <button className="btn btn--sm btn--icon tt" data-tt="WhatsApp" onClick={(e) => e.stopPropagation()}>
                    <Icon name="whatsapp" size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side column */}
        <div className="col-flex" style={{ gap: 18 }}>
          {/* New leads */}
          <div className="card">
            <div className="card-hd">
              <h3>New leads <span style={{
                marginLeft: 6, fontSize: 11, padding: '1px 6px', borderRadius: 5,
                background: 'var(--accent-coral)', color: 'white', fontWeight: 600,
              }}>{newLast24h.length} new</span></h3>
              <span className="muted text-xs">Last 24h</span>
            </div>
            <div>
              {newLast24h.slice(0, 4).map((l, i) => (
                <div key={l.id} onClick={() => onOpenLead(l)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 18px', borderTop: i === 0 ? 0 : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}>
                  <Avatar name={l.name} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</div>
                    <div className="muted text-xs">{l.source} · {l.state}</div>
                  </div>
                  <span className="text-xs muted">{l.lastContact}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue follow-ups */}
          <div className="card">
            <div className="card-hd">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="warn" size={14} style={{ color: 'var(--accent-coral)' }} />
                Overdue follow-ups
              </h3>
              <span className="muted text-xs">{overdue.length}</span>
            </div>
            <div>
              {overdue.map((l, i) => (
                <div key={l.id} onClick={() => onOpenLead(l)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 18px', borderTop: i === 0 ? 0 : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}>
                  <Avatar name={l.name} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>{l.name}</div>
                    <div className="muted text-xs">Last touched {l.lastContact}</div>
                  </div>
                  <span className="pill pill--warn">Nudge</span>
                </div>
              ))}
            </div>
          </div>

          {/* Open chats */}
          <div className="card card-pad">
            <div className="spread">
              <div>
                <div className="text-xs muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Inbox
                </div>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, lineHeight: 1, marginTop: 4 }}>
                  {todayUnread} unread
                </div>
                <div className="muted text-xs mt-4">across {conversations.filter(c => c.status === 'open').length} open conversations</div>
              </div>
              <button className="btn btn--primary btn--sm" onClick={() => onJump('conversations')}>
                Open inbox <Icon name="arrowRight" size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pipeline (kanban) ──────────────────────────────────────────────────────

function Pipeline({ leads, onOpenLead, onStageChange, push }) {
  const [filter, setFilter] = React.useState('all');

  const visible = filter === 'all' ? leads :
                  filter === 'gulf' ? leads.filter(l => l.gulf !== '-' && !['Malta', 'Ireland'].includes(l.gulf)) :
                  filter === 'europe' ? leads.filter(l => ['Malta', 'Ireland'].includes(l.gulf)) :
                  leads;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        title="Pipeline"
        sub="Drag cards across stages — changes sync to Google Sheet live."
        right={[
          <SegTabs key="seg" value={filter} onChange={setFilter} options={[
            { value: 'all', label: 'All' },
            { value: 'gulf', label: 'Gulf' },
            { value: 'europe', label: 'Europe' },
          ]} />,
          <button key="filter" className="btn btn--sm"><Icon name="filter" size={12} /> Filter</button>,
          <button key="add" className="btn btn--sm btn--primary"><Icon name="plus" size={12} /> Add lead</button>,
        ]}
      />
      <div className="kanban" style={{ flex: 1, minHeight: 0 }}>
        {STAGES.map((stage) => {
          const colLeads = visible.filter((l) => l.stage === stage.id);
          return (
            <div key={stage.id} className="col">
              <div className="col-hd">
                <div className="col-hd__bar" style={{ background: stage.color }} />
                <div className="col-hd__name" style={{ color: stage.color }}>{stage.name}</div>
                <div className="col-hd__count">{colLeads.length}</div>
                <button className="topbar__icon-btn" style={{ width: 22, height: 22 }}>
                  <Icon name="plus" size={12} />
                </button>
              </div>
              <div className="col-body">
                {colLeads.map((lead) => (
                  <PipelineCard key={lead.id} lead={lead} onOpen={() => onOpenLead(lead)} onStageChange={onStageChange} push={push} />
                ))}
                {colLeads.length === 0 && (
                  <div style={{
                    padding: '24px 12px', textAlign: 'center', color: 'var(--muted-2)', fontSize: 12,
                    border: '1px dashed var(--border)', borderRadius: 8,
                  }}>
                    Drop leads here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PipelineCard({ lead, onOpen, onStageChange, push }) {
  const [menu, setMenu] = React.useState(false);
  const stage = STAGES.find(s => s.id === lead.stage);
  return (
    <div className="lead-card" onClick={onOpen}>
      <div className="lead-card__name">
        {lead.starred && <Icon name="starFill" size={12} style={{ color: 'var(--accent-amber)' }} />}
        {lead.name}
      </div>
      <div className="lead-card__meta">
        <span>{lead.state}</span><span className="sep" />
        <span>{lead.degree}</span><span className="sep" />
        <span>{lead.gulf}</span>
      </div>
      <div className="lead-card__row">
        <span className="pill pill--neutral pill--dot" style={{ color: 'var(--muted)' }}>
          <Icon name="clock" size={11} /> {lead.offDay} · {lead.callTime}
        </span>
        <div className="lead-card__actions">
          <button className="tt" data-tt="Quick email" onClick={(e) => { e.stopPropagation(); push('Email composer opened', { icon: 'mail' }); }}>
            <Icon name="mail" size={12} />
          </button>
          <button className="tt" data-tt="WhatsApp" onClick={(e) => { e.stopPropagation(); push('WhatsApp opened', { icon: 'whatsapp' }); }}>
            <Icon name="whatsapp" size={12} />
          </button>
          <button className="tt" data-tt="Change stage" onClick={(e) => { e.stopPropagation(); setMenu(!menu); }}>
            <Icon name="dots" size={12} />
          </button>
        </div>
      </div>
      {menu && (
        <div style={{
          position: 'absolute',
          marginTop: 4, background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 8, boxShadow: 'var(--shadow-lg)', padding: 4, zIndex: 10,
          minWidth: 140,
        }} onClick={(e) => e.stopPropagation()}>
          <div className="text-xs muted" style={{ padding: '4px 8px' }}>Move to…</div>
          {STAGES.filter(s => s.id !== lead.stage).map((s) => (
            <button
              key={s.id}
              onClick={() => { onStageChange(lead.id, s.id); setMenu(false); push(`${lead.name.split(' ')[0]} → ${s.name}`, { icon: 'check' }); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', textAlign: 'left',
                border: 0, background: 'transparent',
                padding: '6px 8px', borderRadius: 6, fontSize: 12.5,
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Today, Pipeline });
