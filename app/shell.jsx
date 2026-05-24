// Shell — sidebar + topbar + page header

function Avatar({ name, size, online }) {
  const cls = 'avatar' + (size === 'sm' ? ' avatar--sm' : size === 'lg' ? ' avatar--lg' : '');
  return (
    <div className={cls} style={{ background: avatarColor(name), position: 'relative' }} title={name}>
      {initials(name)}
      {online && (
        <span style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--ok)', border: '2px solid var(--surface)',
        }} />
      )}
    </div>
  );
}

function Sidebar({ view, setView, counts }) {
  const NAV_GROUPS = [
    {
      label: 'Workspace',
      items: [
        { id: 'today',         icon: 'today',     label: 'Today',          notify: counts.new > 0 },
        { id: 'pipeline',      icon: 'pipeline',  label: 'Pipeline' },
        { id: 'leads',         icon: 'leads',     label: 'Leads', count: counts.leads },
        { id: 'conversations', icon: 'inbox',     label: 'Conversations',  count: counts.unread, badge: 'live' },
      ],
    },
    {
      label: 'Outreach',
      items: [
        { id: 'email',         icon: 'mail',      label: 'Email composer' },
        { id: 'whatsapp',      icon: 'whatsapp',  label: 'WhatsApp follow-up' },
        { id: 'templates',     icon: 'templates', label: 'WA templates' },
      ],
    },
    {
      label: 'Insights',
      items: [
        { id: 'analytics',     icon: 'chart',     label: 'Analytics' },
        { id: 'payments',      icon: 'card',      label: 'Payments' },
        { id: 'settings',      icon: 'settings',  label: 'Settings' },
      ],
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__mark">G</div>
        <div className="sidebar__name">
          <b>GMTT</b>
          <span>Counselor workspace</span>
        </div>
      </div>

      {NAV_GROUPS.map((group) => (
        <React.Fragment key={group.label}>
          <div className="sidebar__section">{group.label}</div>
          {group.items.map((item) => (
            <div
              key={item.id}
              className={'nav' + (view === item.id ? ' active' : '')}
              onClick={() => setView(item.id)}
            >
              <Icon name={item.icon} className="nav__icon" />
              <span>{item.label}</span>
              {item.count != null && <span className="nav__count">{item.count}</span>}
              {item.notify && item.count == null && <span className="nav__dot" />}
            </div>
          ))}
        </React.Fragment>
      ))}

      <div className="sidebar__footer">
        <Avatar name="Jaipal Menon" online />
        <div className="user-meta">
          <b>Jaipal M.</b>
          <span>Lead counselor</span>
        </div>
        <div style={{ marginLeft: 'auto', color: 'var(--muted)' }}>
          <Icon name="chevDown" />
        </div>
      </div>
    </aside>
  );
}

function Topbar({ view, onOpenSearch, onJump, syncState, lastSync, onRefresh, currentUser }) {
  const titles = {
    today: 'Today',
    pipeline: 'Pipeline',
    leads: 'Leads',
    conversations: 'Conversations',
    email: 'Email composer',
    whatsapp: 'WhatsApp follow-up',
    templates: 'WhatsApp templates',
    analytics: 'Analytics',
    payments: 'Payments',
    settings: 'Settings',
  };
  return (
    <div className="topbar">
      <div className="topbar__crumb">
        <span>Workspace</span>
        <Icon name="chev" size={12} />
        <b>{titles[view]}</b>
      </div>
      <div className="topbar__search">
        <Icon name="search" size={14} />
        <input placeholder="Search leads, conversations, templates…" onFocus={onOpenSearch} />
        <span className="topbar__kbd">⌘K</span>
      </div>
      <button className="topbar__icon-btn tt" data-tt="Notifications">
        <Icon name="bell" />
        <span className="badge" />
      </button>
      {/* Sync status indicator */}
      <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
        {syncState === 'syncing' && (
          <><span style={{ width: 7, height: 7, borderRadius: '50%', border: '1.5px solid currentColor', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin .7s linear infinite' }} />Syncing</>
        )}
        {syncState === 'ok' && lastSync && (
          <span style={{ color: 'var(--ok)' }}>✓ {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        )}
        {syncState === 'error' && (
          <span style={{ color: '#e06c1a' }}>⚠ Cached</span>
        )}
      </div>
      <button className="topbar__icon-btn tt" data-tt="Refresh data" onClick={onRefresh}
        style={{ ...(syncState === 'syncing' ? { animation: 'spin .7s linear infinite' } : {}) }}>
        <Icon name="refresh" />
      </button>
      <button className="btn btn--primary" onClick={() => onJump('email')}>
        <Icon name="plus" size={13} />
        New invite
      </button>
    </div>
  );
}

function PageHeader({ eyebrow, title, accent, sub, right }) {
  return (
    <div className="spread mb-24" style={{ alignItems: 'flex-end' }}>
      <div>
        {eyebrow && <div className="section-title">{eyebrow}</div>}
        <h1 className="page-title">{title}{accent && <span className="accent"> {accent}</span>}</h1>
        {sub && <p className="page-sub" style={{ marginBottom: 0 }}>{sub}</p>}
      </div>
      {right && <div className="row gap-8">{right}</div>}
    </div>
  );
}

// Small SegTabs control used by several views
function SegTabs({ value, onChange, options }) {
  return (
    <div style={{
      display: 'inline-flex',
      padding: 3,
      gap: 2,
      background: 'var(--bg-sunken)',
      border: '1px solid var(--border)',
      borderRadius: 9,
    }}>
      {options.map((o) => {
        const active = value === (typeof o === 'string' ? o : o.value);
        const label = typeof o === 'string' ? o : o.label;
        const count = typeof o === 'object' ? o.count : null;
        return (
          <button
            key={typeof o === 'string' ? o : o.value}
            onClick={() => onChange(typeof o === 'string' ? o : o.value)}
            style={{
              border: 0,
              background: active ? 'var(--surface)' : 'transparent',
              color: active ? 'var(--ink)' : 'var(--muted)',
              fontSize: 12.5,
              fontWeight: 500,
              padding: '5px 11px',
              borderRadius: 7,
              boxShadow: active ? 'var(--shadow-sm)' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {label}
            {count != null && (
              <span style={{
                fontSize: 10.5,
                background: active ? 'var(--primary-soft)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--muted-2)',
                padding: '0 5px',
                borderRadius: 4,
              }}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Tiny toast manager
function useToasts() {
  const [list, setList] = React.useState([]);
  const push = React.useCallback((msg, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    setList((l) => [...l, { id, msg, ...opts }]);
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), opts.duration || 2400);
  }, []);
  const node = (
    <div className="toast-stack">
      {list.map((t) => (
        <div key={t.id} className="toast">
          {t.icon && <Icon name={t.icon} size={14} />}
          {t.msg}
        </div>
      ))}
    </div>
  );
  return [push, node];
}

Object.assign(window, { Avatar, Sidebar, Topbar, PageHeader, SegTabs, useToasts });
