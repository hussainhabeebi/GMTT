// Leads (full CRM table) + Lead profile modal

function Leads({ leads, onOpenLead, onStageChange, push }) {
  const [search, setSearch]   = React.useState('');
  const [fState, setFState]   = React.useState('all');
  const [fStage, setFStage]   = React.useState('all');
  const [fElig, setFElig]     = React.useState('all');
  const [fGulf, setFGulf]     = React.useState('all');
  const [fInvite, setFInvite] = React.useState('all');
  const [selected, setSelected] = React.useState(new Set());

  const filtered = leads.filter((l) => {
    if (search) {
      const s = search.toLowerCase();
      const hay = (l.name + ' ' + l.phone + ' ' + l.email + ' ' + l.state + ' ' + l.degree + ' ' + l.gulf).toLowerCase();
      if (!hay.includes(s)) return false;
    }
    if (fState !== 'all' && l.state !== fState) return false;
    if (fStage !== 'all' && l.stage !== fStage) return false;
    if (fElig !== 'all') {
      const wants = fElig === 'yes';
      if (l.eligible !== wants && !(fElig === 'pending' && l.eligible === null)) return false;
    }
    if (fGulf !== 'all') {
      const isGulf = !['-', 'Malta', 'Ireland'].includes(l.gulf);
      if (fGulf === 'gulf' && !isGulf) return false;
      if (fGulf === 'europe' && !['Malta', 'Ireland'].includes(l.gulf)) return false;
    }
    if (fInvite !== 'all') {
      if (fInvite === 'sent' && !l.inviteSent) return false;
      if (fInvite === 'pending' && l.inviteSent) return false;
    }
    return true;
  });

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(l => l.id)));
  };

  const Select = ({ value, onChange, options }) => (
    <select className="input" style={{ width: 'auto', minWidth: 110, height: 28, paddingRight: 24, fontSize: 12.5 }}
      value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
          {typeof o === 'string' ? o : o.label}
        </option>
      ))}
    </select>
  );

  return (
    <div>
      <PageHeader
        title="Leads"
        sub={`${filtered.length} of ${leads.length} candidates · live from Google Sheet`}
        right={[
          <button key="exp" className="btn btn--sm"><Icon name="download" size={12} /> Export CSV</button>,
          <button key="add" className="btn btn--sm btn--primary"><Icon name="plus" size={12} /> Add lead</button>,
        ]}
      />

      {/* Filters */}
      <div className="card mb-16" style={{ padding: 12 }}>
        <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
          <div className="row gap-6" style={{
            flex: 1, minWidth: 240,
            border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px', height: 32,
            background: 'var(--surface-2)',
          }}>
            <Icon name="search" size={13} style={{ color: 'var(--muted)' }} />
            <input
              placeholder="Search name, phone, email, state…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ border: 0, background: 'transparent', outline: 'none', flex: 1, fontSize: 13 }}
            />
          </div>
          <Select value={fStage} onChange={setFStage}
            options={[{ value: 'all', label: 'All stages' }, ...STAGES.map(s => ({ value: s.id, label: s.name }))]} />
          <Select value={fState} onChange={setFState}
            options={[{ value: 'all', label: 'All states' }, ...STATES.map(s => ({ value: s, label: s }))]} />
          <Select value={fElig} onChange={setFElig} options={[
            { value: 'all', label: 'Eligibility' },
            { value: 'yes', label: 'Eligible' },
            { value: 'no', label: 'Not eligible' },
            { value: 'pending', label: 'Pending' },
          ]} />
          <Select value={fGulf} onChange={setFGulf} options={[
            { value: 'all', label: 'All regions' },
            { value: 'gulf', label: 'Gulf only' },
            { value: 'europe', label: 'Europe only' },
          ]} />
          <Select value={fInvite} onChange={setFInvite} options={[
            { value: 'all', label: 'All invites' },
            { value: 'sent', label: 'Invite sent' },
            { value: 'pending', label: 'Invite pending' },
          ]} />
        </div>
        {selected.size > 0 && (
          <div className="row gap-8 mt-12" style={{
            paddingTop: 12, borderTop: '1px solid var(--border-subtle)',
          }}>
            <span className="text-sm" style={{ fontWeight: 500 }}>
              {selected.size} selected
            </span>
            <span className="muted text-xs">·</span>
            <button className="btn btn--sm"><Icon name="mail" size={12} /> Bulk invite</button>
            <button className="btn btn--sm"><Icon name="whatsapp" size={12} /> Bulk WhatsApp</button>
            <button className="btn btn--sm"><Icon name="download" size={12} /> Export selected</button>
            <button className="btn btn--sm btn--ghost btn--danger" onClick={() => setSelected(new Set())}>Clear</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 32, padding: '10px 8px 10px 14px' }}>
                  <input type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < filtered.length; }}
                    onChange={toggleAll} />
                </th>
                <th></th>
                <th>Name</th>
                <th>Phone</th>
                <th>State</th>
                <th>Degree</th>
                <th>Age</th>
                <th>English</th>
                <th>Off day</th>
                <th>Call time</th>
                <th>Eligible</th>
                <th>Region</th>
                <th>Stage</th>
                <th>Invite</th>
                <th>Last touch</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className={selected.has(l.id) ? 'selected' : ''}
                    onClick={() => onOpenLead(l)}>
                  <td onClick={(e) => e.stopPropagation()} style={{ paddingLeft: 14 }}>
                    <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggle(l.id)} />
                  </td>
                  <td onClick={(e) => { e.stopPropagation(); push(l.starred ? 'Unflagged' : 'Flagged for follow-up', { icon: 'star' }); }}
                      style={{ color: l.starred ? 'var(--accent-amber)' : 'var(--muted-2)' }}>
                    <Icon name={l.starred ? 'starFill' : 'star'} size={14} />
                  </td>
                  <td>
                    <div className="row gap-8">
                      <Avatar name={l.name} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{l.name}</div>
                        <div className="text-xs muted">{l.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="mono">{l.phone}</td>
                  <td>{l.state}</td>
                  <td>{l.degree}</td>
                  <td className="mono">{l.age}</td>
                  <td>{l.english}</td>
                  <td>{l.offDay}</td>
                  <td className="mono">{l.callTime}</td>
                  <td>
                    {l.eligible === true ? <span className="pill pill--ok pill--dot">Yes</span> :
                     l.eligible === false ? <span className="pill pill--danger pill--dot">No</span> :
                     <span className="pill pill--neutral pill--dot">Pending</span>}
                  </td>
                  <td>
                    <span className="text-xs">{l.gulf}</span>
                  </td>
                  <td>
                    <span className={'stage-tag stage-' + l.stage}>{STAGES.find(s => s.id === l.stage).name}</span>
                  </td>
                  <td>
                    {l.inviteSent
                      ? <span className="pill pill--ok pill--dot">Sent</span>
                      : <span className="pill pill--neutral">—</span>}
                  </td>
                  <td className="text-xs muted">{l.lastContact}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn--sm btn--icon btn--ghost"><Icon name="dots" size={13} /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={16} style={{ padding: 48, textAlign: 'center', color: 'var(--muted)' }}>
                    No leads match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Lead profile modal ────────────────────────────────────────────────────

function LeadModal({ lead, onClose, onStageChange, onJump, push }) {
  const [tab, setTab] = React.useState('profile');
  const [notes, setNotes] = React.useState(lead.notes);
  const [draftNote, setDraftNote] = React.useState('');
  if (!lead) return null;

  const stage = STAGES.find(s => s.id === lead.stage);

  const FieldRow = ({ label, value, mono, edit }) => (
    <div style={{
      display: 'grid', gridTemplateColumns: '120px 1fr auto',
      gap: 12, alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <span className="text-xs muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
        {label}
      </span>
      <span className={mono ? 'mono' : ''} style={{ fontSize: 13.5 }}>{value}</span>
      <button className="btn btn--sm btn--ghost btn--icon tt" data-tt="Edit"
              onClick={() => push('Edit mode (mock)', { icon: 'edit' })}>
        <Icon name="edit" size={12} />
      </button>
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 960 }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <Avatar name={lead.name} size="lg" />
          <div style={{ flex: 1 }}>
            <div className="row gap-8" style={{ alignItems: 'center' }}>
              <div style={{
                fontFamily: "'Instrument Serif', serif", fontSize: 26, lineHeight: 1.1,
                letterSpacing: '-0.01em',
              }}>{lead.name}</div>
              {lead.starred && <Icon name="starFill" size={14} style={{ color: 'var(--accent-amber)' }} />}
              <span className={'stage-tag stage-' + lead.stage}>{stage.name}</span>
            </div>
            <div className="muted text-sm row gap-8 mt-4">
              <span>{lead.id}</span>
              <span className="dim">·</span>
              <span>{lead.phone}</span>
              <span className="dim">·</span>
              <span>{lead.email}</span>
            </div>
          </div>
          <div className="row gap-6">
            <button className="btn btn--sm" onClick={() => { onJump('email'); onClose(); }}>
              <Icon name="mail" size={12} /> Email
            </button>
            <button className="btn btn--sm" onClick={() => { onJump('whatsapp'); onClose(); }}>
              <Icon name="whatsapp" size={12} /> WhatsApp
            </button>
            <button className="btn btn--sm">
              <Icon name="phone" size={12} /> Log call
            </button>
            <button className="topbar__icon-btn" onClick={onClose}>
              <Icon name="close" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: '0 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="row gap-4">
            {['profile', 'notes', 'calls', 'emails'].map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '10px 8px',
                border: 0, background: 'transparent',
                fontSize: 13, fontWeight: 500,
                color: tab === t ? 'var(--ink)' : 'var(--muted)',
                borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: -1,
                textTransform: 'capitalize',
              }}>
                {t === 'notes' ? `Notes (${notes.length})` :
                 t === 'calls' ? `Call log (${lead.callLog.length})` :
                 t === 'emails' ? `Email history (${lead.emailHistory.length})` : t}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: 'auto' }}>
          {tab === 'profile' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              <div>
                <div className="section-title">Candidate</div>
                <FieldRow label="State" value={lead.state} />
                <FieldRow label="Age" value={lead.age + ' years'} mono />
                <FieldRow label="Reg. year" value={lead.regYear} mono />
                <FieldRow label="English" value={lead.english} />
                <FieldRow label="Source" value={lead.source} />
              </div>
              <div>
                <div className="section-title">Pipeline</div>
                <FieldRow label="Off day" value={lead.offDay} />
                <FieldRow label="Call time" value={lead.callTime} mono />
                <FieldRow label="Eligible" value={
                  lead.eligible === true ? 'Yes' : lead.eligible === false ? 'No' : 'Pending review'
                } />
                <FieldRow label="Region" value={lead.gulf} />
                <FieldRow label="Stage" value={
                  <span className="row gap-8">
                    <span className={'stage-tag stage-' + lead.stage}>{stage.name}</span>
                  </span>
                } />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: 16 }}>
                <div className="section-title">Move to stage</div>
                <div className="row gap-6" style={{ flexWrap: 'wrap' }}>
                  {STAGES.map((s) => (
                    <button key={s.id}
                      onClick={() => { onStageChange(lead.id, s.id); push(`Stage → ${s.name}`, { icon: 'check' }); }}
                      style={{
                        border: '1px solid var(--border)',
                        background: lead.stage === s.id ? s.color : 'var(--surface)',
                        color: lead.stage === s.id ? 'white' : 'var(--ink)',
                        padding: '5px 12px', borderRadius: 7,
                        fontSize: 12, fontWeight: 500,
                        cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                      }}>
                      {lead.stage === s.id && <Icon name="check" size={11} />}
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'notes' && (
            <div>
              <div className="card-pad" style={{ background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Add a note about this conversation…"
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  style={{ resize: 'vertical', background: 'var(--surface)' }}
                />
                <div className="row spread mt-8">
                  <span className="muted text-xs">As Jaipal · syncs to Google Sheet</span>
                  <button className="btn btn--primary btn--sm" disabled={!draftNote.trim()}
                    onClick={() => {
                      setNotes([{ ts: 'just now', by: 'Jaipal', text: draftNote }, ...notes]);
                      setDraftNote('');
                      push('Note added', { icon: 'check' });
                    }}>
                    Save note
                  </button>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                {notes.map((n, i) => (
                  <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="row gap-8 mb-4">
                      <Avatar name={n.by} size="sm" />
                      <b style={{ fontSize: 13 }}>{n.by}</b>
                      <span className="muted text-xs">{n.ts}</span>
                    </div>
                    <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginLeft: 30 }}>{n.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'calls' && (
            <div>
              {lead.callLog.map((c, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '32px 1fr auto',
                  gap: 12, alignItems: 'center',
                  padding: '12px 0', borderBottom: '1px solid var(--border-subtle)',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--primary-soft)', color: 'var(--primary)',
                    display: 'grid', placeItems: 'center',
                  }}>
                    <Icon name="phone" size={12} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{c.outcome}</div>
                    <div className="muted text-xs">by {c.by}</div>
                  </div>
                  <span className="muted text-xs">{c.ts}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'emails' && (
            <div>
              {lead.emailHistory.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
                  No emails sent yet.
                  <div className="mt-8">
                    <button className="btn btn--sm btn--primary" onClick={() => { onJump('email'); onClose(); }}>
                      <Icon name="mail" size={12} /> Send invitation
                    </button>
                  </div>
                </div>
              ) : lead.emailHistory.map((e, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '32px 1fr auto',
                  gap: 12, alignItems: 'center',
                  padding: '12px 0', borderBottom: '1px solid var(--border-subtle)',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--primary-soft)', color: 'var(--primary)',
                    display: 'grid', placeItems: 'center',
                  }}>
                    <Icon name="mail" size={12} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{e.template}</div>
                    <div className="muted text-xs">{e.status}</div>
                  </div>
                  <span className="muted text-xs">{e.ts}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Leads, LeadModal });
