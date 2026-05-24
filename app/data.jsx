// GMTT CRM — data.jsx
// NO fake leads, NO fake conversations, NO fake WA templates, NO fake invoices.
// Only constants + helpers + live loaders.

// ── Stage definitions (UI only) ────────────────────────────────────────────
const STAGES = [
  { id: 'new',        name: 'New',        color: 'var(--stage-new)'        },
  { id: 'collecting', name: 'Collecting', color: 'var(--stage-collecting)' },
  { id: 'eligible',   name: 'Eligible',   color: 'var(--stage-eligible)'   },
  { id: 'invited',    name: 'Invited',    color: 'var(--stage-invited)'    },
  { id: 'completed',  name: 'Completed',  color: 'var(--stage-completed)'  },
  { id: 'ineligible', name: 'Ineligible', color: 'var(--stage-ineligible)' },
];

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const COUNTRIES = ['Saudi Arabia','UAE','Qatar','Oman','Kuwait','Bahrain','Malta','Ireland'];

// ── Avatar helpers ─────────────────────────────────────────────────────────
const AVATAR_PALETTE = [
  '#0F4C5C','#5C8A6E','#B07A55','#4A7B8E','#D9A047',
  '#9A6B6B','#B5754C','#6A9B8A','#C9627A','#1A6677',
];
const avatarColor = (name='?') => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
};
const initials = (name='?') => name.split(' ').slice(0,2).map(p=>p[0]).join('').toUpperCase();

// ── GSheet row → lead object (columns match workflow schema exactly) ────────
const rowToLead = (r, i) => {
  const phone    = String(r['Phone Number'] || r.phone || '').trim();
  const eligible = r.Eligible === 'Yes' ? true : r.Eligible === 'No' ? false : null;
  const gulf     = r.Is_Gulf === 'Yes' || r.isGulf === true;
  const stage    = r.Stage || r.stage || 'new';
  return {
    id:          phone ? 'L' + phone.replace(/\D/g,'').slice(-8) : `L${9000+i}`,
    name:        r.Name       || r.name       || 'Unknown',
    phone,
    email:       r['Email ID'] || r.email     || '',
    state:       r.State      || r.state      || '',
    degree:      r.Degree     || r.degree     || '',
    age:         r.Age        ? parseInt(r.Age) : null,
    english:     r.English_Speaking || r.english || '—',
    offDay:      r['Off Day'] || r.offDay     || '',
    callTime:    r['preferred call time'] || r.callTime || '',
    eligible,
    gulf:        gulf ? (r.State || r.state || 'Gulf') : '-',
    isGulf:      gulf,
    stage,
    language:    r.Language   || r.language   || 'en',
    inviteSent:  r.Invite_Sent === 'Yes' || r.inviteSent === true,
    verified:    r.Verified   || '',
    slNo:        r['SL NO']   || r.id         || '',
    starred:     false,
    source:      'WhatsApp Bot',
    notes:       [],
    callLog:     [],
    emailHistory: (r.Invite_Sent === 'Yes')
      ? [{ ts: 'Previously', template: 'Call Invite', status: 'sent' }]
      : [],
    lastContact: 'recently',
    regYear:     null,
  };
};
// Expose globally so index-dashboard.html inline script can use it before Babel finishes
if (typeof window !== 'undefined') window.rowToLead = rowToLead;

// ── Live loaders ───────────────────────────────────────────────────────────

// Live loaders defined in index-dashboard.html <script> block
