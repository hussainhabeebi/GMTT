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
        <SidebarUserMenu />
      </div>
    </aside>
  );
}

function SidebarUserMenu() {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const email = localStorage.getItem('gmtt_user') || sessionStorage.getItem('gmtt_user') || '';

  React.useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const signOut = () => {
    localStorage.removeItem('gmtt_auth');
    localStorage.removeItem('gmtt_user');
    sessionStorage.removeItem('gmtt_auth');
    sessionStorage.removeItem('gmtt_user');
    location.replace('login.html');
  };

  return (
    <div ref={ref} style={{ marginLeft: 'auto', position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        title="Account"
        style={{
          border: 0, background: 'transparent', color: 'var(--muted)',
          padding: 4, cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
        }}
      >
        <Icon name="chevDown" />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, bottom: '100%', marginBottom: 8,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, boxShadow: 'var(--shadow-lg)',
          padding: 6, minWidth: 200, zIndex: 50,
        }}>
          {email && (
            <div style={{
              padding: '8px 10px 10px',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: 11.5, color: 'var(--muted)',
            }}>
              Signed in as<br />
              <b style={{ color: 'var(--ink)', fontSize: 12.5 }}>{email}</b>
            </div>
          )}
          <button
            onClick={signOut}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', textAlign: 'left',
              border: 0, background: 'transparent',
              padding: '8px 10px', borderRadius: 6,
              fontSize: 13, color: 'var(--accent-coral)',
              cursor: 'pointer', marginTop: 4,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Icon name="close" size={13} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function Topbar({ view, onOpenSearch, onJump, onRefresh, refreshing, status }) {
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
  // Connection pill: null = never tried, true = live, false = offline / falling back
  const online = status?.online;
  const pillCls = online === true ? 'pill pill--ok pill--dot'
                : online === false ? 'pill pill--warn pill--dot'
                : 'pill pill--neutral pill--dot';
  const pillText = online === true ? 'Live · n8n'
                 : online === false ? 'Offline · sample data'
                 : 'Sample data';
  const tooltip = status?.lastError ? 'Last error: ' + status.lastError
                : status?.lastSync ? 'Last sync ' + new Date(status.lastSync).toLocaleTimeString()
                : 'Wire n8n endpoints in Settings → Integrations';
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
      <span className={pillCls + ' tt'} data-tt={tooltip}
            onClick={() => onJump('settings')}
            style={{ cursor: 'pointer' }}>
        {pillText}
      </span>
      <button className="topbar__icon-btn tt" data-tt="Notifications">
        <Icon name="bell" />
        <span className="badge" />
      </button>
      <button className="topbar__icon-btn tt" data-tt={refreshing ? 'Refreshing…' : 'Refresh from n8n'}
              onClick={onRefresh} disabled={refreshing}
              style={refreshing ? { animation: 'spin 1s linear infinite' } : null}>
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

Object.assign(window, { Avatar, Sidebar, SidebarUserMenu, Topbar, PageHeader, SegTabs, useToasts });
