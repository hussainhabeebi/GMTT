// Email composer — lead picker, 4 templates, live HTML preview, edit mode, bulk send.

// SALARY loaded from data.jsx

const renderTemplate = (tmpl, lead, counselor = 'Jaipal Menon') => {
  const sal = (window.SALARY || {})[lead.gulf] || { local: '—', inr: '—' };
  const sub = {
    '{{first_name}}': lead.name.split(' ')[0],
    '{{call_time}}':  lead.callTime,
    '{{off_day}}':    lead.offDay,
    '{{degree}}':     lead.degree,
    '{{state}}':      lead.state,
    '{{country}}':    lead.gulf === '-' ? 'Saudi Arabia' : lead.gulf,
    '{{salary_local}}': sal.local,
    '{{salary_inr}}':   sal.inr,
    '{{counselor}}':  counselor,
  };
  let body = tmpl.body, subj = tmpl.subject;
  for (const [k, v] of Object.entries(sub)) {
    body = body.split(k).join(v); subj = subj.split(k).join(v);
  }
  return { subject: subj, body };
};

function EmailComposer({ leads, push }) {
  const eligiblePending = leads.filter(l => l.eligible === true && !l.inviteSent);
  const [poolFilter, setPoolFilter] = React.useState('invitePending');
  const [selectedId, setSelectedId] = React.useState(eligiblePending[0]?.id || leads[0]?.id);
  const [tmplId, setTmplId] = React.useState('invite');
  const [editMode, setEditMode] = React.useState(false);
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [bulkDelay, setBulkDelay] = React.useState(45);

  const pool = poolFilter === 'invitePending' ? eligiblePending
             : poolFilter === 'eligible'       ? leads.filter(l => l.eligible === true)
             :                                    leads;

  const lead = leads.find(l => l.id === selectedId) || pool[0];
  const tmpl = (window.EMAIL_TEMPLATES || []).find(t => t.id === tmplId);
  const rendered = lead && tmpl ? renderTemplate(tmpl, lead) : { subject: '', body: '' };

  const [draftSubj, setDraftSubj] = React.useState(rendered.subject);
  const [draftBody, setDraftBody] = React.useState(rendered.body);
  React.useEffect(() => {
    setDraftSubj(rendered.subject);
    setDraftBody(rendered.body);
  }, [tmplId, selectedId]);

  const send = async () => {
    if (!lead?.email) { push('No email on file for this lead', { icon: 'warn' }); return; }
    push(`Sending to ${lead.name}…`, { icon: 'send' });
    try {
      // Single send via SMTP endpoint + trigger send_invite automation for tracking
      await window.gmttPost(window.GMTT_API.EMAIL_SEND, {
        to:      lead.email,
        subject: draftSubj,
        body:    draftBody,
      });
      // Also trigger send_invite automation to update GSheet Invite_Sent flag
      window.gmttPost(window.GMTT_API.AUTOMATION, {
        name:    'send_invite',
        phone:   lead.phone,
        email:   lead.email,
        subject: draftSubj,
      }).catch(() => {});
      push(`✓ Email sent to ${lead.name}`, { icon: 'check' });
    } catch(e) {
      push(`Error: ${e.message}`, { icon: 'warn' });
    }
  };

  // Render the body as HTML preview (markdown-lite: ** bold)
  const renderBodyHtml = (text) => {
    return text
      .split('\n')
      .map((line) => {
        if (line.startsWith('**') && line.endsWith('**')) return `<p style="font-weight:600;margin:14px 0 6px">${line.slice(2, -2)}</p>`;
        if (line.startsWith('• ') || line.match(/^[0-9]+\./)) return `<p style="margin:2px 0">${line}</p>`;
        if (line.trim() === '') return '<p style="margin:8px 0"></p>';
        return `<p style="margin:8px 0">${line}</p>`;
      })
      .join('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        title="Email composer"
        sub="Personalised invitations — variables fill from each lead automatically."
        right={[
          <button key="bulk" className="btn btn--sm" onClick={() => setBulkOpen(!bulkOpen)}>
            <Icon name="send" size={12} /> Bulk send ({eligiblePending.length})
          </button>,
        ]}
      />

      {bulkOpen && (
        <div className="card mb-16" style={{ padding: 16, background: 'var(--surface-2)' }}>
          <div className="spread">
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                Bulk-send "{tmpl?.name}" to {eligiblePending.length} eligible-pending leads
              </div>
              <div className="text-xs muted">Each email is personalised with the lead's name, degree, country, off day, call time, and salary.</div>
            </div>
            <div className="row gap-8">
              <label className="row gap-6 text-sm">
                Delay between sends:
                <input type="number" value={bulkDelay} onChange={(e) => setBulkDelay(Number(e.target.value))}
                  className="input mono" style={{ width: 64, height: 28 }} />
                <span className="muted">sec</span>
              </label>
              <button className="btn btn--sm" onClick={() => setBulkOpen(false)}>Cancel</button>
              <button className="btn btn--primary btn--sm"
                onClick={async () => {
                  setBulkOpen(false);
                  push(`Queuing bulk invite for ${eligiblePending.length} leads…`, { icon: 'send' });
                  try {
                    // Use n8n automation trigger — handles rate limiting server-side
                    await window.gmttPost(window.GMTT_API.AUTOMATION, {
                      name: 'bulk_invite',
                      template_id: tmplId,
                      lead_ids: eligiblePending.map(l => l.phone),
                    });
                    push(`✓ Bulk invite queued — n8n will send ${eligiblePending.length} emails`, { icon: 'check' });
                  } catch(e) {
                    push('Automation trigger failed: ' + e.message, { icon: 'warn' });
                  }
                }}>
                Start sending
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        flex: 1, minHeight: 0,
        display: 'grid',
        gridTemplateColumns: '280px 1fr 1fr',
        gap: 14,
      }}>
        {/* Lead picker */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="card-hd">
            <h3>Leads</h3>
          </div>
          <div style={{ padding: 10, borderBottom: '1px solid var(--border-subtle)' }}>
            <SegTabs value={poolFilter} onChange={setPoolFilter} options={[
              { value: 'invitePending', label: 'Pending', count: eligiblePending.length },
              { value: 'eligible',      label: 'Eligible' },
              { value: 'all',           label: 'All' },
            ]} />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {pool.map((l) => (
              <div key={l.id} onClick={() => setSelectedId(l.id)} style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                background: l.id === selectedId ? 'var(--primary-soft)' : 'transparent',
                borderLeft: l.id === selectedId ? '3px solid var(--primary)' : '3px solid transparent',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <Avatar name={l.name} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</div>
                  <div className="muted text-xs">{l.gulf} · {l.offDay} {l.callTime}</div>
                </div>
                {l.inviteSent && <Icon name="check" size={12} style={{ color: 'var(--ok)' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Template + editor */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="card-hd">
            <h3>Template</h3>
            <SegTabs value={editMode ? 'edit' : 'guided'} onChange={(v) => setEditMode(v === 'edit')} options={[
              { value: 'guided', label: 'Variables' }, { value: 'edit', label: 'Edit HTML' },
            ]} />
          </div>
          <div style={{ padding: 14, borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="grid grid-cols-2" style={{ gap: 8 }}>
              {(window.EMAIL_TEMPLATES || []).map(t => (
                <button key={t.id} onClick={() => setTmplId(t.id)} style={{
                  textAlign: 'left',
                  padding: 10,
                  border: '1px solid var(--border)',
                  background: tmplId === t.id ? 'var(--primary-soft)' : 'var(--surface)',
                  borderColor: tmplId === t.id ? 'var(--primary)' : 'var(--border)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{t.icon}</span>
                  <div style={{ fontWeight: 600, fontSize: 12.5, color: tmplId === t.id ? 'var(--primary)' : 'var(--ink)' }}>
                    {t.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: 14, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div className="text-xs muted mb-4" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>To</div>
              <div className="row gap-8" style={{ padding: '6px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <Avatar name={lead?.name || '??'} size="sm" />
                <div style={{ fontWeight: 500, fontSize: 13 }}>{lead?.name}</div>
                <span className="muted text-xs">&lt;{lead?.email}&gt;</span>
              </div>
            </div>
            <div>
              <div className="text-xs muted mb-4" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Subject</div>
              <input className="input" value={draftSubj} onChange={(e) => setDraftSubj(e.target.value)} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="text-xs muted mb-4" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Body {!editMode && <span style={{ color: 'var(--primary)', textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>· auto-filled from lead profile</span>}
              </div>
              <textarea
                className="input mono"
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                style={{ flex: 1, fontSize: 12, lineHeight: 1.5, resize: 'none', minHeight: 200 }}
              />
            </div>
          </div>
          <div className="spread" style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)' }}>
            <span className="text-xs muted">Sent as <b style={{ color: 'var(--ink)' }}>jobs@gmttcochin.com</b></span>
            <button className="btn btn--primary" onClick={send}>
              <Icon name="send" size={13} /> Send invitation
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="card-hd">
            <h3>Live preview</h3>
            <span className="pill pill--neutral">Rendered HTML</span>
          </div>
          <div style={{
            flex: 1, overflowY: 'auto',
            padding: 20,
            background: 'var(--bg-sunken)',
          }}>
            <div style={{
              background: 'white',
              borderRadius: 10,
              padding: '24px 28px',
              maxWidth: 520, margin: '0 auto',
              boxShadow: 'var(--shadow-md)',
              color: '#1C2A2E',
              fontFamily: 'Georgia, serif',
              fontSize: 14, lineHeight: 1.6,
            }}>
              <div style={{
                borderBottom: '1px solid #E4DBC9',
                paddingBottom: 14, marginBottom: 18,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: 'linear-gradient(135deg, #0F4C5C, #1A6677)',
                  color: 'white', display: 'grid', placeItems: 'center',
                  fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: 20,
                }}>G</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, fontFamily: 'system-ui' }}>Guiders Mission Tours and Travels</div>
                  <div style={{ fontSize: 11, color: '#6B7575', fontFamily: 'system-ui' }}>True guidance · sincere service</div>
                </div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, fontFamily: 'system-ui' }}>{draftSubj}</div>
              <div dangerouslySetInnerHTML={{ __html: renderBodyHtml(draftBody) }} style={{ fontFamily: 'system-ui' }} />
              <div style={{
                marginTop: 24, paddingTop: 14, borderTop: '1px solid #E4DBC9',
                fontSize: 11, color: '#6B7575', fontFamily: 'system-ui',
              }}>
                39/4747 A 2nd floor, Susandya, Old Thevara road, Ernakulam, Kochi, Kerala 682016<br />
                +91 484 2374292 · jobs@gmttcochin.com
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EmailComposer, renderTemplate });
