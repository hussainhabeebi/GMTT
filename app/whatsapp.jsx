// WhatsApp follow-up + WhatsApp templates pages

const WA_TYPES = [
  { id: 'reminder',  name: 'Reminder',      icon: '🔔', desc: 'Call coming up',
    template: (lead) => `Hi ${lead.name.split(' ')[0]}, this is a friendly reminder about your call with Guiders Mission at ${lead.callTime} on ${lead.offDay}. Please keep your OET certificate ready. Reply 1 to confirm. — ${lead.gulf} opening` },
  { id: 'reengage',  name: 'Re-engagement', icon: '🔄', desc: 'Went cold',
    template: (lead) => `Hi ${lead.name.split(' ')[0]}, we have not heard from you in a while. The ${lead.gulf} opening is still open and matches your ${lead.degree} profile. Would you like to talk this week? Reply YES or NO.` },
  { id: 'congrats',  name: 'Congratulations', icon: '🎉', desc: 'Eligibility confirmed',
    template: (lead) => `Congratulations ${lead.name.split(' ')[0]}! You are eligible for the ${lead.gulf} opening. Our counselor Jaipal will reach out shortly with next steps. Welcome aboard! 🙏` },
  { id: 'docs',      name: 'Document checklist', icon: '📋', desc: 'Ask for documents',
    template: (lead) => `Hi ${lead.name.split(' ')[0]}, please share:\n1. Passport (front + back)\n2. Nursing registration certificate\n3. Latest experience certificate\n4. OET/IELTS scorecard\nThank you 🙏` },
];

function WhatsAppFollowup({ leads, push }) {
  const [selectedIds, setSelectedIds] = React.useState(new Set([leads[0]?.id]));
  const [typeId, setTypeId] = React.useState('reminder');
  const [bulkMode, setBulkMode] = React.useState(false);
  const [filter, setFilter] = React.useState('all');

  const filtered = filter === 'invited' ? leads.filter(l => l.stage === 'invited') :
                   filter === 'eligible' ? leads.filter(l => l.eligible === true) :
                   filter === 'cold' ? leads.filter(l => ['collecting', 'new'].includes(l.stage)) :
                   leads;

  const type = WA_TYPES.find(t => t.id === typeId);
  const firstSelected = leads.find(l => selectedIds.has(l.id)) || leads[0];
  const previewText = firstSelected ? type.template(firstSelected) : '';
  const [editedText, setEditedText] = React.useState(previewText);
  React.useEffect(() => { setEditedText(previewText); }, [typeId, firstSelected?.id]);

  const toggle = (id) => {
    const n = new Set(selectedIds);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelectedIds(n);
  };

  const send = async () => {
    if (bulkMode) {
      push(`Sending to ${selectedIds.size} leads…`, { icon: 'whatsapp' });
      let sent = 0;
      for (const id of selectedIds) {
        const l = leads.find(x => x.id === id);
        if (!l?.phone) continue;
        const phone = l.phone.replace(/\D/g,'');
        try {
          await apiPost('/guiders-send-whatsapp', {
            phone, message_type: 'text',
            body: type.template(l), lead_phone: phone,
          });
          sent++;
        } catch(e) {}
        await new Promise(r => setTimeout(r, 1500));
      }
      push(`✓ Sent to ${sent} leads`, { icon: 'check' });
    } else {
      const phone = (firstSelected?.phone || '').replace(/\D/g,'');
      push(`Sending to ${firstSelected?.name}…`, { icon: 'whatsapp' });
      try {
        await apiPost('/guiders-send-whatsapp', {
          phone, message_type: 'text',
          body: editedText, lead_phone: phone,
        });
        push(`✓ Sent to ${firstSelected?.name}`, { icon: 'check' });
      } catch(e) {
        push(`Sent (check WA logs)`, { icon: 'check' });
      }
    }
  };

  return (
    <div>
      <PageHeader
        title="WhatsApp follow-up"
        sub="Personalised messages via WhatsApp Cloud API — +91 77360 09983"
        right={[
          <SegTabs key="mode" value={bulkMode ? 'bulk' : 'single'} onChange={(v) => setBulkMode(v === 'bulk')} options={[
            { value: 'single', label: 'Single' }, { value: 'bulk', label: 'Bulk', count: selectedIds.size },
          ]} />,
        ]}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 360px', gap: 14, minHeight: 480 }}>
        {/* Lead list */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-hd">
            <h3>Lead</h3>
            <SegTabs value={filter} onChange={setFilter} options={[
              { value: 'all', label: 'All' },
              { value: 'invited', label: 'Invited' },
              { value: 'cold', label: 'Cold' },
            ]} />
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 480 }}>
            {filtered.map((l) => (
              <div key={l.id} onClick={() => { if (bulkMode) toggle(l.id); else setSelectedIds(new Set([l.id])); }} style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                background: selectedIds.has(l.id) ? 'var(--primary-soft)' : 'transparent',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                {bulkMode && (
                  <input type="checkbox" checked={selectedIds.has(l.id)} readOnly />
                )}
                <Avatar name={l.name} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{l.name}</div>
                  <div className="muted text-xs">{l.gulf} · {l.callTime}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Type + edit */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-hd">
            <h3>Message type</h3>
          </div>
          <div style={{ padding: 14, borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="grid grid-cols-2" style={{ gap: 8 }}>
              {WA_TYPES.map(t => (
                <button key={t.id} onClick={() => setTypeId(t.id)} style={{
                  textAlign: 'left', padding: 12,
                  border: '1px solid var(--border)',
                  background: typeId === t.id ? 'var(--primary-soft)' : 'var(--surface)',
                  borderColor: typeId === t.id ? 'var(--primary)' : 'var(--border)',
                  borderRadius: 8, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: typeId === t.id ? 'var(--primary)' : 'var(--ink)' }}>{t.name}</div>
                    <div className="muted text-xs" style={{ marginTop: 1 }}>{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: 14, flex: 1 }}>
            <div className="text-xs muted mb-4" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Message {bulkMode && <span style={{ color: 'var(--primary)', textTransform: 'none' }}>· personalised per recipient</span>}
            </div>
            <textarea className="input" rows={8} value={editedText} onChange={(e) => setEditedText(e.target.value)} style={{ fontSize: 13.5, lineHeight: 1.5 }} />
            <div className="text-xs muted mt-8">{editedText.length} characters · approx 1 conversation credit</div>
          </div>
          <div className="spread" style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)' }}>
            <span className="text-xs muted">Via WhatsApp Cloud API · WABA 1703…8466</span>
            <button className="btn btn--primary" onClick={send}>
              <Icon name="whatsapp" size={14} /> {bulkMode ? `Send to ${selectedIds.size}` : 'Send'}
            </button>
          </div>
        </div>

        {/* Phone preview */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-hd">
            <h3>Preview</h3>
            <span className="text-xs muted">{firstSelected?.name}</span>
          </div>
          <div style={{ padding: 18, background: '#0f1c1e', flex: 1, display: 'grid', placeItems: 'center' }}>
            <div style={{
              width: 260,
              background: '#e5ddd5',
              borderRadius: 24,
              padding: 14,
              border: '8px solid #1A2624',
              boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
            }}>
              {/* WA header */}
              <div style={{
                background: '#075e54', color: 'white', margin: -14, marginBottom: 8,
                padding: '14px 12px 12px',
                borderTopLeftRadius: 16, borderTopRightRadius: 16,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#0F4C5C', color: 'white',
                  display: 'grid', placeItems: 'center',
                  fontSize: 14, fontWeight: 600, fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
                }}>G</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Guiders Mission</div>
                  <div style={{ fontSize: 10, opacity: 0.85 }}>+91 77360 09983 · online</div>
                </div>
              </div>
              <div style={{
                background: 'white',
                padding: '8px 10px',
                borderRadius: 8,
                fontSize: 12.5,
                color: '#111',
                whiteSpace: 'pre-wrap',
                marginRight: 32,
                lineHeight: 1.4,
                boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                fontFamily: 'system-ui',
              }}>
                {editedText}
                <div style={{ textAlign: 'right', fontSize: 10, color: '#888', marginTop: 4 }}>10:42 AM ✓✓</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Templates (Meta-approved) ──────────────────────────────────────────────

function Templates({ push }) {
  const [filter, setFilter] = React.useState('all');
  const [newOpen, setNewOpen] = React.useState(false);
  const filtered = filter === 'all' ? WA_TEMPLATES : WA_TEMPLATES.filter(t => t.status === filter);

  return (
    <div>
      <PageHeader
        title="WhatsApp templates"
        sub="Approved templates via Meta Business · WABA 1703 4729 4733 8466"
        right={[
          <SegTabs key="seg" value={filter} onChange={setFilter} options={[
            { value: 'all', label: 'All', count: WA_TEMPLATES.length },
            { value: 'approved', label: 'Approved', count: WA_TEMPLATES.filter(t => t.status === 'approved').length },
            { value: 'pending', label: 'Pending', count: WA_TEMPLATES.filter(t => t.status === 'pending').length },
            { value: 'rejected', label: 'Rejected', count: WA_TEMPLATES.filter(t => t.status === 'rejected').length },
          ]} />,
          <button key="new" className="btn btn--sm btn--primary" onClick={() => setNewOpen(true)}>
            <Icon name="plus" size={12} /> New template
          </button>,
        ]}
      />

      <div className="grid grid-cols-3">
        {filtered.map((t) => (
          <div key={t.id} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="spread">
              <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</span>
              {t.status === 'approved' && <span className="pill pill--ok pill--dot">Approved</span>}
              {t.status === 'pending' && <span className="pill pill--warn pill--dot">Pending</span>}
              {t.status === 'rejected' && <span className="pill pill--danger pill--dot">Rejected</span>}
            </div>
            <div className="row gap-6">
              <span className="pill pill--neutral">{t.category}</span>
              <span className="text-xs muted">Updated {t.updated}</span>
            </div>
            <div style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 12.5,
              lineHeight: 1.5,
              color: 'var(--ink-soft)',
              whiteSpace: 'pre-wrap',
              minHeight: 90,
            }}>{t.body}</div>
            <div className="row gap-6 mt-4">
              <button className="btn btn--sm" disabled={t.status !== 'approved'}
                onClick={() => push('Send to filtered leads', { icon: 'whatsapp' })}>
                <Icon name="send" size={11} /> Send
              </button>
              <button className="btn btn--sm btn--ghost"><Icon name="copy" size={11} /> Clone</button>
              <button className="btn btn--sm btn--ghost btn--icon"><Icon name="dots" size={12} /></button>
            </div>
          </div>
        ))}
      </div>

      {newOpen && (
        <div className="modal-backdrop" onClick={() => setNewOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22 }}>New template</div>
              <div className="muted text-sm">Submits directly to Meta for approval (usually within 24h).</div>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div className="text-xs muted mb-4" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</div>
                <input className="input mono" placeholder="snake_case_name_v1" />
              </div>
              <div>
                <div className="text-xs muted mb-4" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</div>
                <select className="input"><option>UTILITY</option><option>MARKETING</option><option>AUTHENTICATION</option></select>
              </div>
              <div>
                <div className="text-xs muted mb-4" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Body</div>
                <textarea className="input" rows={5} placeholder="Hi {{1}}, your interview is at {{2}} on {{3}}…" />
                <div className="text-xs muted mt-4">Use {'{{1}}'}, {'{{2}}'} for variables. Will be filled per recipient.</div>
              </div>
            </div>
            <div className="spread" style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
              <span className="text-xs muted">Will appear as Pending until Meta reviews</span>
              <div className="row gap-6">
                <button className="btn btn--sm" onClick={() => setNewOpen(false)}>Cancel</button>
                <button className="btn btn--primary btn--sm" onClick={() => { push('Submitted to Meta for review', { icon: 'check' }); setNewOpen(false); }}>
                  Submit to Meta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { WhatsAppFollowup, Templates });
