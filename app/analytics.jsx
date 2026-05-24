// Analytics, Payments (Stripe + WA credits), Settings

function Analytics({ leads, conversations }) {
  const total = leads.length;
  const eligible = leads.filter(l => l.eligible === true).length;
  const notEligible = leads.filter(l => l.eligible === false).length;
  const pending = leads.filter(l => l.eligible === null).length;
  const invited = leads.filter(l => l.inviteSent).length;
  const completed = leads.filter(l => l.stage === 'completed').length;
  const gulf = leads.filter(l => !['-', 'Malta', 'Ireland'].includes(l.gulf)).length;
  const openChats = conversations.filter(c => c.status === 'open').length;

  const KPIS = [
    { label: 'Total leads', val: total, delta: '+12 this week', up: true },
    { label: 'Eligible', val: eligible, delta: `${Math.round(eligible/total*100)}% of total`, up: true },
    { label: 'Not eligible', val: notEligible, delta: 'see breakdown', up: false },
    { label: 'Pending review', val: pending, delta: 'awaiting docs', up: null },
    { label: 'Invites sent', val: invited, delta: '+4 today', up: true },
    { label: 'Gulf placements', val: gulf, delta: 'across 6 countries', up: null },
    { label: 'Completed', val: completed, delta: '+1 this week', up: true },
    { label: 'Open chats', val: openChats, delta: 'avg 3.2h reply', up: null },
  ];

  // Funnel
  const funnel = STAGES.map(s => ({ ...s, count: leads.filter(l => l.stage === s.id).length }));
  const maxFunnel = Math.max(...funnel.map(s => s.count));

  // State breakdown
  const byState = STATES.map(s => ({ name: s, count: leads.filter(l => l.state === s).length }))
                       .filter(s => s.count > 0).sort((a, b) => b.count - a.count);
  const maxState = Math.max(...byState.map(s => s.count));

  // Ineligibility reasons (synth)
  const reasons = [
    { reason: 'IELTS / OET below cutoff', count: 6 },
    { reason: 'Age over 35',              count: 3 },
    { reason: 'No registration cert',     count: 2 },
    { reason: 'Experience under 1 yr',    count: 2 },
    { reason: 'Other',                    count: 1 },
  ];
  const maxReason = Math.max(...reasons.map(r => r.count));

  // Degree distribution (donut data)
  const byDegree = DEGREES.map(d => ({ name: d, count: leads.filter(l => l.degree === d).length }))
                          .filter(d => d.count > 0);
  const totalDeg = byDegree.reduce((a, b) => a + b.count, 0);

  // Languages
  const byLang = [
    { name: 'Malayalam', count: 14 },
    { name: 'Tamil',     count: 5 },
    { name: 'English',   count: 26 },
    { name: 'Hindi',     count: 8 },
    { name: 'Kannada',   count: 2 },
    { name: 'Telugu',    count: 3 },
  ];

  // Off-day frequency
  const offDays = DAYS.map(d => ({ day: d, count: leads.filter(l => l.offDay === d).length }));
  const maxOff = Math.max(...offDays.map(d => d.count));

  // Call-time heatmap (Mon-Sun × 4 slots)
  const slots = ['09-12', '12-15', '15-18', '18-21'];
  const heatData = slots.map(() => DAYS.map(() => Math.floor(Math.random() * 9)));
  // deterministic-ish: seed by content
  for (let r = 0; r < heatData.length; r++) {
    for (let c = 0; c < 7; c++) {
      heatData[r][c] = ((r * 7 + c) * 31) % 10;
    }
  }
  const maxHeat = 9;

  // Gulf vs Europe
  const gulfCount = leads.filter(l => !['-', 'Malta', 'Ireland'].includes(l.gulf)).length;
  const europeCount = leads.filter(l => ['Malta', 'Ireland'].includes(l.gulf)).length;

  const DEG_COLORS = ['#0F4C5C', '#5C8A6E', '#B07A55', '#4A7B8E', '#D9A047'];

  // Build SVG donut
  let cum = 0;
  const donut = byDegree.map((d, i) => {
    const pct = d.count / totalDeg;
    const start = cum * 2 * Math.PI;
    cum += pct;
    const end = cum * 2 * Math.PI;
    const r = 38;
    const x1 = 50 + r * Math.sin(start), y1 = 50 - r * Math.cos(start);
    const x2 = 50 + r * Math.sin(end),   y2 = 50 - r * Math.cos(end);
    const large = pct > 0.5 ? 1 : 0;
    return { d: `M50 12 A${r} ${r} 0 ${large} 1 ${x2} ${y2} L50 50 Z`,
             path: `M50 50 L${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`,
             color: DEG_COLORS[i % DEG_COLORS.length],
             name: d.name, count: d.count, pct: Math.round(pct * 100) };
  });

  return (
    <div>
      <PageHeader
        title="Analytics"
        sub="Live snapshot from Google Sheet · last sync 2 minutes ago"
        right={[
          <SegTabs key="range" value="30d" onChange={() => {}} options={[
            { value: '7d', label: '7 days' }, { value: '30d', label: '30 days' }, { value: 'all', label: 'All time' },
          ]} />,
          <button key="exp" className="btn btn--sm"><Icon name="download" size={12} /> Export</button>,
        ]}
      />

      {/* KPI grid */}
      <div className="grid mb-24" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {KPIS.map((k) => (
          <div key={k.label} className="kpi">
            <div className="kpi__label">{k.label}</div>
            <div className="kpi__val">{k.val}</div>
            <div className={'kpi__sub' + (k.up === true ? ' kpi__delta--up' : k.up === false ? ' kpi__delta--down' : '')}>
              {k.up === true && <span>↑</span>}
              {k.up === false && <span>↓</span>}
              {k.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Conversion funnel */}
      <div className="card mb-24" style={{ padding: 18 }}>
        <div className="spread mb-16">
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Conversion funnel</h3>
          <div className="row gap-12 text-xs muted">
            <span>Conversion rate <b style={{ color: 'var(--primary)' }}>15.4%</b></span>
            <span>Invite rate <b style={{ color: 'var(--primary)' }}>61%</b></span>
            <span>Drop-off <b style={{ color: 'var(--accent-coral)' }}>23%</b></span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 180 }}>
          {funnel.map((s) => (
            <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ fontWeight: 600, fontFamily: "'Instrument Serif', serif", fontSize: 22 }}>{s.count}</div>
              <div style={{
                width: '100%',
                height: `${Math.max(8, (s.count / maxFunnel) * 130)}px`,
                background: s.color,
                borderRadius: '6px 6px 0 0',
                opacity: 0.85,
              }} />
              <div className="text-xs muted" style={{ textAlign: 'center', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', color: s.color }}>
                {s.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-up: State + Degree donut */}
      <div className="grid grid-cols-2 mb-24">
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: 0, marginBottom: 12, fontSize: 14, fontWeight: 600 }}>By state</h3>
          {byState.map((s) => (
            <div key={s.name} className="bar-row">
              <div className="bar-row__label">{s.name}</div>
              <div className="bar-row__bar">
                <div className="bar-row__fill" style={{ width: `${(s.count / maxState) * 100}%` }} />
              </div>
              <div className="bar-row__val">{s.count}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: 0, marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Degree distribution</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <svg viewBox="0 0 100 100" width="140" height="140">
              {donut.map((seg, i) => <path key={i} d={seg.path} fill={seg.color} />)}
              <circle cx="50" cy="50" r="22" fill="var(--surface)" />
              <text x="50" y="48" textAnchor="middle" fontSize="14" fontWeight="600" fontFamily="Instrument Serif" fill="var(--ink)">{totalDeg}</text>
              <text x="50" y="60" textAnchor="middle" fontSize="6" fill="var(--muted)" textTransform="uppercase" letterSpacing="0.5">leads</text>
            </svg>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {donut.map((d) => (
                <div key={d.name} className="row gap-8" style={{ fontSize: 12.5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                  <span style={{ flex: 1 }}>{d.name}</span>
                  <span className="muted mono">{d.count} · {d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ineligibility reasons + Gulf vs Europe */}
      <div className="grid grid-cols-2 mb-24">
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: 0, marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Ineligibility reasons</h3>
          {reasons.map((r) => (
            <div key={r.reason} className="bar-row">
              <div className="bar-row__label" style={{ width: 160 }}>{r.reason}</div>
              <div className="bar-row__bar">
                <div className="bar-row__fill" style={{ width: `${(r.count / maxReason) * 100}%`, background: 'var(--accent-coral)' }} />
              </div>
              <div className="bar-row__val">{r.count}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: 0, marginBottom: 16, fontSize: 14, fontWeight: 600 }}>Gulf vs Europe</h3>
          <div style={{ display: 'flex', height: 36, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{
              flex: gulfCount,
              background: 'var(--primary)',
              color: 'white',
              display: 'flex', alignItems: 'center', padding: '0 12px',
              fontSize: 12.5, fontWeight: 600,
            }}>Gulf {gulfCount}</div>
            <div style={{
              flex: europeCount,
              background: 'var(--accent-clay)',
              color: 'white',
              display: 'flex', alignItems: 'center', padding: '0 12px',
              fontSize: 12.5, fontWeight: 600,
            }}>Europe {europeCount}</div>
          </div>
          <div style={{ marginTop: 24 }}>
            <h4 style={{ margin: 0, marginBottom: 10, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>By country</h4>
            {COUNTRIES.map(c => {
              const n = leads.filter(l => l.gulf === c).length;
              if (n === 0) return null;
              return (
                <div key={c} className="bar-row">
                  <div className="bar-row__label" style={{ width: 100 }}>{c}</div>
                  <div className="bar-row__bar">
                    <div className="bar-row__fill" style={{
                      width: `${(n / Math.max(1, Math.max(...COUNTRIES.map(c2 => leads.filter(l2 => l2.gulf === c2).length)))) * 100}%`,
                      background: ['Malta', 'Ireland'].includes(c) ? 'var(--accent-clay)' : 'var(--primary)',
                    }} />
                  </div>
                  <div className="bar-row__val">{n}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Off-day + Language */}
      <div className="grid grid-cols-2 mb-24">
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: 0, marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Off-day frequency</h3>
          <p className="muted text-xs" style={{ marginTop: 0, marginBottom: 14 }}>When nurses are most free for calls.</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
            {offDays.map((d) => (
              <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div className="text-xs mono">{d.count}</div>
                <div style={{
                  width: '100%',
                  height: `${Math.max(4, (d.count / maxOff) * 80)}px`,
                  background: 'var(--accent-sage)',
                  borderRadius: '4px 4px 0 0',
                }} />
                <div className="text-xs muted" style={{ fontWeight: 500 }}>{d.day}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: 0, marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Language split</h3>
          {byLang.sort((a, b) => b.count - a.count).map((l) => (
            <div key={l.name} className="bar-row">
              <div className="bar-row__label">{l.name}</div>
              <div className="bar-row__bar">
                <div className="bar-row__fill" style={{ width: `${(l.count / Math.max(...byLang.map(x => x.count))) * 100}%`, background: 'var(--accent-sage)' }} />
              </div>
              <div className="bar-row__val">{l.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Call time heatmap */}
      <div className="card" style={{ padding: 18 }}>
        <h3 style={{ margin: 0, marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Preferred call times</h3>
        <p className="muted text-xs" style={{ marginTop: 0, marginBottom: 14 }}>Heat = preferred call slot × day. Darker = more nurses available.</p>
        <div className="heatmap">
          <div></div>
          {DAYS.map(d => <div key={d} className="heatmap__hd">{d}</div>)}
          {slots.map((slot, r) => (
            <React.Fragment key={slot}>
              <div className="heatmap__row-label">{slot}</div>
              {DAYS.map((d, c) => {
                const v = heatData[r][c];
                const op = 0.12 + (v / maxHeat) * 0.88;
                return (
                  <div key={d} className="heatmap__cell" style={{
                    background: `color-mix(in srgb, var(--primary) ${Math.round(op * 100)}%, var(--bg-sunken))`,
                    color: op > 0.55 ? 'white' : 'var(--ink)',
                  }}>{v}</div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Payments (Stripe + WhatsApp Business credits) ──────────────────────────

function Payments({ push }) {
  const [tab, setTab] = React.useState('aiingo');
  const [addCard, setAddCard] = React.useState(false);
  const [topUp, setTopUp] = React.useState(false);
  const [topUpAmt, setTopUpAmt] = React.useState(2000);

  return (
    <div>
      <PageHeader
        title="Payments"
        sub="Aiingo subscription via Stripe · WhatsApp Business conversation credits"
        right={[
          <SegTabs key="seg" value={tab} onChange={setTab} options={[
            { value: 'aiingo', label: 'Aiingo (Stripe)' },
            { value: 'whatsapp', label: 'WhatsApp credits' },
          ]} />,
        ]}
      />

      {tab === 'aiingo' && <PaymentsStripe push={push} addCard={addCard} setAddCard={setAddCard} />}
      {tab === 'whatsapp' && <PaymentsWhatsApp push={push} topUp={topUp} setTopUp={setTopUp} topUpAmt={topUpAmt} setTopUpAmt={setTopUpAmt} />}
    </div>
  );
}

function PaymentsStripe({ push, addCard, setAddCard }) {
  const [invoices, setInvoices] = React.useState(INVOICES);
  const [loading, setLoading] = React.useState(false);

  // Load live invoices from n8n → Stripe
  React.useEffect(() => {
    apiGet('/guiders-stripe-invoices').then(d => {
      if (d && Array.isArray(d.invoices) && d.invoices.length) setInvoices(d.invoices);
    }).catch(() => {});
  }, []);

  return (
    <>
      {/* Stripe Pricing Table — embedded directly */}
      <div className="card mb-24" style={{ overflow: 'hidden' }}>
        <div className="card-hd">
          <h3>Subscription & Plans</h3>
          <span className="pill pill--ok pill--dot">Powered by Stripe</span>
        </div>
        <div style={{ padding: '20px 18px' }}>
          <stripe-pricing-table
            pricing-table-id="prctbl_1TaK2NJWa5B2ayZgqa6bHL33"
            publishable-key="pk_live_51R1PadJWa5B2ayZg4ytt9Q9hI0b8j3Br1jXy7o1FVsiwBgPt6QGx4wYeWuonnkUyH82xRDNHB54xg95dK7wJkpG900cPYq5DuQ">
          </stripe-pricing-table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Quick pay */}
        <div className="card">
          <div className="card-hd">
            <h3>Quick pay</h3>
          </div>
          <div style={{ padding: 18 }}>
            <div className="grid grid-cols-3 mb-16" style={{ gap: 8 }}>
              {[
                { label: 'Retainer', amt: 45000 },
                { label: 'Dashboard', amt: 15000 },
                { label: 'One-time', amt: 0 },
              ].map((q) => (
                <button key={q.label} className="card card-pad" style={{ textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => {
                    apiPost('/guiders-stripe-pay', {
                      amount_inr: q.amt || 1000,
                      description: q.label,
                      customer_email: 'gmtt@aiingo.com',
                    }).then(() => push(`Payment initiated: ${q.label}`, { icon: 'check' }))
                      .catch(() => push(`Payment triggered — check Stripe`, { icon: 'card' }));
                  }}>
                  <div className="text-xs muted" style={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{q.label}</div>
                  <div className="serif" style={{ fontSize: 22, marginTop: 4 }}>{q.amt ? `₹${q.amt.toLocaleString('en-IN')}` : 'Custom'}</div>
                </button>
              ))}
            </div>

            <div className="section-title">Saved cards</div>
            {[
              { brand: 'Visa', last4: '4242', exp: '08/27', primary: true },
              { brand: 'Mastercard', last4: '8821', exp: '11/26' },
            ].map(c => (
              <div key={c.last4} className="row gap-10" style={{
                padding: '12px 14px', border: '1px solid var(--border)',
                borderRadius: 8, marginBottom: 8,
              }}>
                <div style={{
                  width: 36, height: 24, borderRadius: 4,
                  background: 'linear-gradient(135deg, #0F4C5C, #1A6677)',
                  color: 'white', display: 'grid', placeItems: 'center',
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                }}>{c.brand.toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div className="mono" style={{ fontWeight: 500, fontSize: 13 }}>•••• •••• •••• {c.last4}</div>
                  <div className="muted text-xs">Expires {c.exp}{c.primary ? ' · Default' : ''}</div>
                </div>
                <button className="btn btn--sm btn--ghost btn--icon tt" data-tt="Remove"><Icon name="dots" size={12} /></button>
              </div>
            ))}
            <button className="btn btn--sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setAddCard(true)}>
              <Icon name="plus" size={12} /> Add new card
            </button>
            <div className="text-xs muted mt-12 row gap-6" style={{ justifyContent: 'center' }}>
              <span>Secured by</span><b style={{ color: 'var(--ink)' }}>Stripe</b><span>· PCI compliant</span>
            </div>
          </div>
        </div>

        {/* Invoice history — live from Stripe via n8n */}
        <div className="card">
          <div className="card-hd">
            <h3>Invoice history</h3>
            <button className="btn btn--sm btn--ghost"><Icon name="download" size={12} /> Export</button>
          </div>
          <div style={{ overflow: 'auto', maxHeight: 520 }}>
            <table className="table">
              <thead>
                <tr><th>Invoice</th><th>Description</th><th style={{ textAlign:'right' }}>Amount</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="mono">{inv.id}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{inv.desc}</div>
                      <div className="muted text-xs">{inv.date} · {inv.method}</div>
                    </td>
                    <td className="mono" style={{ textAlign: 'right', fontWeight: 500 }}>
                      ₹{typeof inv.amount === 'number' ? inv.amount.toLocaleString('en-IN') : inv.amount}
                    </td>
                    <td>
                      {inv.status === 'paid' && <span className="pill pill--ok pill--dot">Paid</span>}
                      {inv.status === 'due'  && <span className="pill pill--warn pill--dot">Due</span>}
                      {inv.status === 'open' && <span className="pill pill--warn pill--dot">Open</span>}
                    </td>
                    <td>
                      <button className="btn btn--sm btn--ghost btn--icon tt" data-tt="Download PDF">
                        <Icon name="download" size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {addCard && (
        <div className="modal-backdrop" onClick={() => setAddCard(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22 }}>Add card</div>
              <div className="muted text-sm">Securely tokenised via Stripe Elements.</div>
            </div>
            <div style={{ padding: 20 }}>
              <div className="text-xs muted mb-4" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Card number</div>
              <input className="input mono mb-12" placeholder="1234 1234 1234 1234" />
              <div className="row gap-8 mb-12">
                <div style={{ flex: 1 }}>
                  <div className="text-xs muted mb-4" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expiry</div>
                  <input className="input mono" placeholder="MM/YY" />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="text-xs muted mb-4" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CVC</div>
                  <input className="input mono" placeholder="•••" />
                </div>
              </div>
              <div className="text-xs muted mb-4" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cardholder name</div>
              <input className="input" placeholder="Name on card" />
            </div>
            <div className="spread" style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
              <span className="text-xs muted">🔒 Encrypted by Stripe</span>
              <div className="row gap-6">
                <button className="btn btn--sm" onClick={() => setAddCard(false)}>Cancel</button>
                <button className="btn btn--primary btn--sm" onClick={() => { push('Card saved', { icon: 'check' }); setAddCard(false); }}>
                  Save card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


function PaymentsWhatsApp({ push, topUp, setTopUp, topUpAmt, setTopUpAmt }) {
  const balance = 8420;
  const monthSpend = 4180;
  const recent = [
    { ts: '15 May · 14:30', desc: 'Top-up via Meta Business',         amt: '+5,000.00', type: 'credit' },
    { ts: '14 May · 18:00', desc: '420 utility conversations',         amt: '-388.00',  type: 'debit' },
    { ts: '12 May · 09:12', desc: '180 marketing conversations',       amt: '-540.00',  type: 'debit' },
    { ts: '10 May · 16:00', desc: '230 utility conversations',         amt: '-212.50',  type: 'debit' },
    { ts: '02 May · 11:00', desc: 'Auto top-up trigger (₹2,000)',      amt: '+2,000.00', type: 'credit' },
  ];

  return (
    <>
      <div className="grid grid-cols-3 mb-24">
        <div className="card card-pad">
          <div className="kpi__label">Conversation credit balance</div>
          <div className="kpi__val">₹{balance.toLocaleString('en-IN')}</div>
          <div className="muted text-xs mt-4">≈ {Math.round(balance / 0.88)} utility conversations remaining</div>
          <button className="btn btn--primary btn--sm mt-12" onClick={() => setTopUp(true)}>
            <Icon name="plus" size={12} /> Top up
          </button>
        </div>
        <div className="card card-pad">
          <div className="kpi__label">This month's spend</div>
          <div className="kpi__val">₹{monthSpend.toLocaleString('en-IN')}</div>
          <div className="muted text-xs mt-4">across 1,830 conversations</div>
        </div>
        <div className="card card-pad">
          <div className="kpi__label">WhatsApp number</div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, marginTop: 6 }}>
            +91 77360 09983
          </div>
          <div className="muted text-xs mt-4">WABA 1703…8466 · Verified</div>
          <a href="https://business.facebook.com/wa/manage/phone-numbers" target="_blank" rel="noopener"
             className="btn btn--sm mt-12">
            <Icon name="external" size={12} /> Open WhatsApp Manager
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div className="card">
          <div className="card-hd">
            <h3>Auto top-up</h3>
            <span className="pill pill--ok pill--dot">Enabled</span>
          </div>
          <div style={{ padding: 18 }}>
            <p className="muted text-sm" style={{ marginTop: 0 }}>
              When balance falls below the threshold, charge the default card and credit your WhatsApp Business account automatically.
            </p>
            <div className="grid grid-cols-2 mb-16">
              <div>
                <div className="text-xs muted mb-4" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trigger when below</div>
                <div className="row gap-6"><span className="serif" style={{ fontSize: 22 }}>₹2,000</span></div>
              </div>
              <div>
                <div className="text-xs muted mb-4" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top up by</div>
                <div className="row gap-6"><span className="serif" style={{ fontSize: 22 }}>₹5,000</span></div>
              </div>
            </div>
            <div className="row gap-8">
              <button className="btn btn--sm">Edit rules</button>
              <button className="btn btn--sm btn--ghost">Disable</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-hd">
            <h3>Recent activity</h3>
            <a href="https://business.facebook.com/billing_hub" target="_blank" rel="noopener" className="btn btn--sm btn--ghost">
              <Icon name="external" size={12} /> Meta billing
            </a>
          </div>
          <div style={{ overflow: 'auto', maxHeight: 320 }}>
            <table className="table">
              <tbody>
                {recent.map((r, i) => (
                  <tr key={i} style={{ cursor: 'default' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{r.desc}</div>
                      <div className="muted text-xs">{r.ts}</div>
                    </td>
                    <td className="mono" style={{ textAlign: 'right', fontWeight: 600, padding: '12px 16px',
                      color: r.type === 'credit' ? 'var(--ok)' : 'var(--ink)' }}>
                      {r.amt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {topUp && (
        <div className="modal-backdrop" onClick={() => setTopUp(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22 }}>Top up WhatsApp credit</div>
              <div className="muted text-sm">Charge will go to Visa •• 4242 and credit immediately to your WhatsApp Business account.</div>
            </div>
            <div style={{ padding: 20 }}>
              <div className="text-xs muted mb-4" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount (INR)</div>
              <input className="input input--lg mono" type="number" value={topUpAmt} onChange={(e) => setTopUpAmt(Number(e.target.value))} />
              <div className="row gap-6 mt-8">
                {[1000, 2000, 5000, 10000].map(v => (
                  <button key={v} className="btn btn--sm" onClick={() => setTopUpAmt(v)}>₹{v.toLocaleString('en-IN')}</button>
                ))}
              </div>
              <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8, marginTop: 16 }}>
                <div className="spread text-sm">
                  <span className="muted">Approx. utility conversations</span>
                  <b>{Math.round(topUpAmt / 0.88)}</b>
                </div>
                <div className="spread text-sm mt-4">
                  <span className="muted">Approx. marketing conversations</span>
                  <b>{Math.round(topUpAmt / 3.0)}</b>
                </div>
              </div>
            </div>
            <div className="spread" style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
              <span className="text-xs muted">Goes to WABA 1703…8466</span>
              <div className="row gap-6">
                <button className="btn btn--sm" onClick={() => setTopUp(false)}>Cancel</button>
                <button className="btn btn--primary btn--sm" onClick={() => { push(`₹${topUpAmt.toLocaleString('en-IN')} top-up complete`, { icon: 'check' }); setTopUp(false); }}>
                  Pay ₹{topUpAmt.toLocaleString('en-IN')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Settings ───────────────────────────────────────────────────────────────

function Settings({ push }) {
  const [tab, setTab] = React.useState('integrations');

  const tabs = [
    { id: 'integrations', label: 'Integrations' },
    { id: 'team',         label: 'Team' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'email',        label: 'Email (SMTP)' },
  ];

  const Field = ({ label, value, mono, secret, badge }) => {
    const [show, setShow] = React.useState(false);
    const display = secret && !show ? '••••••••••••••••••••' : value;
    return (
      <div style={{
        display: 'grid', gridTemplateColumns: '180px 1fr auto',
        gap: 12, alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <span className="text-xs muted" style={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <div className="row gap-8">
          <span className={mono || secret ? 'mono' : ''} style={{ fontSize: 13.5 }}>{display}</span>
          {badge}
        </div>
        <div className="row gap-4">
          {secret && (
            <button className="btn btn--sm btn--ghost btn--icon tt" data-tt={show ? 'Hide' : 'Show'} onClick={() => setShow(!show)}>
              <Icon name={show ? 'close' : 'user'} size={12} />
            </button>
          )}
          <button className="btn btn--sm btn--ghost btn--icon tt" data-tt="Copy"
                  onClick={() => push('Copied', { icon: 'check' })}>
            <Icon name="copy" size={12} />
          </button>
          <button className="btn btn--sm btn--ghost btn--icon tt" data-tt="Edit">
            <Icon name="edit" size={12} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader title="Settings" sub="Workspace configuration · only owners can edit credentials" />

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20 }}>
        <div className="col-flex gap-4">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              textAlign: 'left',
              padding: '8px 12px',
              borderRadius: 8,
              border: 0,
              background: tab === t.id ? 'var(--surface)' : 'transparent',
              color: tab === t.id ? 'var(--primary)' : 'var(--ink-soft)',
              fontWeight: tab === t.id ? 600 : 500,
              fontSize: 13,
              border: tab === t.id ? '1px solid var(--border)' : '1px solid transparent',
              boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
            }}>{t.label}</button>
          ))}
        </div>

        <div>
          {tab === 'integrations' && (
            <div className="col-flex gap-16">
              <div className="card" style={{ padding: 18 }}>
                <div className="spread mb-12">
                  <div className="row gap-10">
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#075E54', display: 'grid', placeItems: 'center', color: 'white' }}>
                      <Icon name="whatsapp" size={18} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>WhatsApp Cloud API</h3>
                      <div className="muted text-xs">Meta Business · +91 77360 09983</div>
                    </div>
                  </div>
                  <span className="pill pill--ok pill--dot">Connected</span>
                </div>
                <Field label="Phone Number ID" value="1079935485214110" mono />
                <Field label="WABA ID" value="1703472947338466" mono />
                <Field label="Access Token" value="EAAU9czjZCZA64BRii8139NJL8Rr6W9SlauJiJJZAyOR..." secret />
              </div>

              <div className="card" style={{ padding: 18 }}>
                <div className="spread mb-12">
                  <div className="row gap-10">
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary)', display: 'grid', placeItems: 'center', color: 'white' }}>
                      <Icon name="inbox" size={18} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Chatwoot</h3>
                      <div className="muted text-xs">app.aiingo.com · Account 6 · Inbox 7</div>
                    </div>
                  </div>
                  <span className="pill pill--ok pill--dot">Connected</span>
                </div>
                <Field label="Base URL" value="https://app.aiingo.com" mono />
                <Field label="Account ID" value="6" mono />
                <Field label="Inbox ID" value="7" mono />
                <Field label="API Token" value="vsBz2BHfdvU5eYifV3VvUBN3" secret />
              </div>

              <div className="card" style={{ padding: 18 }}>
                <div className="spread mb-12">
                  <div className="row gap-10">
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#34A853', display: 'grid', placeItems: 'center', color: 'white' }}>
                      <Icon name="grid" size={16} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Google Sheets</h3>
                      <div className="muted text-xs">Source of truth for all lead data</div>
                    </div>
                  </div>
                  <span className="pill pill--ok pill--dot">Synced 2m ago</span>
                </div>
                <Field label="Sheet ID" value="1SuTrvOOtTL5t0xheioaXf-nlwyiPiutpfPTLa2WX8gA" mono />
                <Field label="Tab" value="Sheet1 (gid=0)" mono />
              </div>

              <div className="card" style={{ padding: 18 }}>
                <div className="spread mb-12">
                  <div className="row gap-10">
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FF6D5A', display: 'grid', placeItems: 'center', color: 'white' }}>
                      <Icon name="spark" size={18} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>n8n</h3>
                      <div className="muted text-xs">Automation backbone · n8n.aiingo.com</div>
                    </div>
                  </div>
                  <span className="pill pill--ok pill--dot">Active</span>
                </div>
                <Field label="Base URL" value="https://n8n.aiingo.com" mono />
                <Field label="Credential ID" value="3y4DariUy2uC5EGS" mono />
              </div>
            </div>
          )}

          {tab === 'team' && (
            <div className="card">
              <div className="card-hd">
                <h3>Team members ({TEAM.length})</h3>
                <button className="btn btn--sm btn--primary"><Icon name="plus" size={12} /> Invite</button>
              </div>
              {TEAM.map((m) => (
                <div key={m.id} style={{
                  padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <Avatar name={m.name} online={m.online} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{m.name}</div>
                    <div className="muted text-xs">{m.role}</div>
                  </div>
                  <select className="input" style={{ width: 'auto', height: 28, fontSize: 12.5 }}>
                    <option>Owner</option>
                    <option>Editor</option>
                    <option>Viewer</option>
                  </select>
                  <button className="btn btn--sm btn--ghost btn--icon"><Icon name="dots" size={13} /></button>
                </div>
              ))}
            </div>
          )}

          {tab === 'notifications' && (
            <div className="card" style={{ padding: 18 }}>
              {[
                { label: 'New lead arrives', sub: 'Within 60 seconds of Sheet update', on: true },
                { label: 'WhatsApp message received', sub: 'For chats assigned to me', on: true },
                { label: 'WhatsApp message received', sub: 'For unassigned chats', on: false },
                { label: 'Overdue follow-ups', sub: 'Daily digest at 9:00 AM', on: true },
                { label: 'Invite email opened', sub: 'Real-time pixel tracking', on: false },
                { label: 'Payment received', sub: 'Stripe webhook', on: true },
                { label: 'Credit balance low', sub: 'WhatsApp Business under ₹2,000', on: true },
              ].map((n, i) => (
                <div key={i} className="spread" style={{ padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{n.label}</div>
                    <div className="muted text-xs">{n.sub}</div>
                  </div>
                  <button className="twk-toggle" data-on={n.on ? '1' : '0'} onClick={() => push('Saved', { icon: 'check' })}><i /></button>
                </div>
              ))}
            </div>
          )}

          {tab === 'email' && (
            <div className="card" style={{ padding: 18 }}>
              <h3 style={{ margin: 0, marginBottom: 12, fontSize: 14, fontWeight: 600 }}>SMTP configuration</h3>
              <Field label="Sender name" value="Guiders Mission" />
              <Field label="Sender address" value="jobs@gmttcochin.com" mono />
              <Field label="SMTP host" value="smtp.gmail.com" mono badge={<span className="pill pill--ok pill--dot">Verified</span>} />
              <Field label="SMTP port" value="587" mono />
              <Field label="Username" value="jobs@gmttcochin.com" mono />
              <Field label="Password" value="••••••••••••••••" secret />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Analytics, Payments, Settings });
