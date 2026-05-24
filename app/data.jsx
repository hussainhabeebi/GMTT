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

// ── GSheet row → lead object ───────────────────────────────────────────────
const rowToLead = (r, i) => {
  const phone = (r['Phone Number'] || '').trim();
  const eligible = r.Eligible === 'Yes' ? true : r.Eligible === 'No' ? false : null;
  const gulf = r.Is_Gulf === 'Yes';
  return {
    id:          phone ? 'L' + phone.replace(/\D/g,'').slice(-8) : `L${9000+i}`,
    name:        r.Name || 'Unknown',
    phone:       phone,
    email:       r['Email ID'] || '',
    state:       r.State || '',
    degree:      r.Degree || '',
    age:         r.Age ? parseInt(r.Age) : null,
    english:     r.English_Speaking || '—',
    offDay:      r['Off Day'] || '',
    callTime:    r['preferred call time'] || '',
    eligible,
    gulf:        gulf ? (r.State || 'Gulf') : '-',
    isGulf:      gulf,
    stage:       r.Stage || 'new',
    language:    r.Language || 'en',
    inviteSent:  r.Invite_Sent === 'Yes',
    // CRM fields (local state only, not in sheet yet)
    starred:     false,
    source:      'WhatsApp Bot',
    notes:       [],
    callLog:     [],
    emailHistory: r.Invite_Sent === 'Yes'
      ? [{ ts: 'Previously', template: 'Call Invite', status: 'sent' }]
      : [],
    lastContact: 'recently',
    regYear:     null,
  };
};

// ── Live loaders ───────────────────────────────────────────────────────────

window.loadLiveLeads = async () => {
  const raw = await apiPost('/guiders-get-leads', { action: 'get_all' });
  // Handle: flat array, {rows:[]}, {data:[]}, or single object
  let rows = [];
  if (Array.isArray(raw))            rows = raw;
  else if (Array.isArray(raw.rows))  rows = raw.rows;
  else if (Array.isArray(raw.data))  rows = raw.data;
  else if (raw && typeof raw === 'object' && raw['Phone Number']) rows = [raw];
  // Filter out empty rows (GSheets sometimes returns blank rows)
  rows = rows.filter(r => r && (r['Phone Number'] || r.Name));
  console.log('[GMTT] Loaded', rows.length, 'leads from GSheets');
  return rows.map(rowToLead);
};

window.loadLiveConversations = async (status = 'open') => {
  const data = await cwFetch(`/conversations?status=${status}&page=1`);
  const payload = data?.data?.payload || [];
  return payload.map(c => ({
    id:       'C-' + c.id,
    _cwId:    c.id,
    leadId:   null,
    status:   c.status || 'open',
    channel:  'whatsapp',
    unread:   c.unread_count || 0,
    lastTs:   c.last_activity_at
                ? new Date(c.last_activity_at * 1000)
                    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '',
    assigned: c.meta?.assignee?.name || null,
    preview:  c.last_non_activity_message?.content || '',
    _phone:   c.meta?.sender?.phone_number || '',
    _name:    c.meta?.sender?.name || 'Unknown',
    messages: [], // loaded on demand
  }));
};

window.loadConversationMessages = async (cwId) => {
  const data = await cwFetch(`/conversations/${cwId}/messages`);
  const msgs = data?.payload || [];
  return msgs
    .filter(m => m.content)
    .sort((a, b) => a.created_at - b.created_at)
    .map(m => ({
      from:   (m.message_type === 1 || m.message_type === 'outgoing') ? 'me' : 'them',
      ts:     new Date((m.created_at || 0) * 1000)
                .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      body:   m.content,
      author: m.sender?.name || '',
    }));
};

window.loadLiveTemplates = async () => {
  const data = await apiPost('/guiders-get-templates', {});
  return data?.templates || [];
};

// ── Email templates (content only — no fake lead data) ────────────────────
const EMAIL_TEMPLATES = [
  {
    id: 'invite', icon: '📅', name: 'Call Invite',
    subject: 'Your call with Guiders Mission — {{call_time}}, {{off_day}}',
    body: `Dear {{first_name}},

Thank you for your interest in international nursing opportunities with Guiders Mission Tours and Travels.

Based on your profile ({{degree}}, registered {{state}} Nurses Council), we have shortlisted you for an opportunity in {{country}}.

*Call details*
• Date: {{off_day}}
• Time: {{call_time}}
• Indicative salary: {{salary_local}} ({{salary_inr}} INR equivalent)

Please keep your OET / IELTS certificate, registration certificate and passport copy handy for the call.

Warm regards,
{{counselor}}
Guiders Mission Tours and Travels`,
  },
  {
    id: 'congrats', icon: '🎉', name: 'Congratulations — Eligibility Confirmed',
    subject: "Congratulations {{first_name}} — you're eligible for {{country}}",
    body: `Dear {{first_name}},

Wonderful news — based on our call and document review, you are eligible for the {{country}} nursing opportunity.

Next steps:
1. Submit attested mark lists and registration certificate
2. We will initiate Dataflow verification
3. Prometric / OET coaching schedule will be shared

Welcome aboard. We will be with you through every step.

Warm regards,
{{counselor}}
Guiders Mission`,
  },
  {
    id: 'followup', icon: '🔔', name: 'Follow-up — Re-engage',
    subject: 'Still considering {{country}}, {{first_name}}?',
    body: `Dear {{first_name}},

It has been a few weeks since we last spoke about the {{country}} opening. We wanted to check in — are you still considering this opportunity?

The role is still open and the indicative salary remains {{salary_local}}.

If now is not the right time, no problem at all. Just reply with a quick note and we will pause your file.

Warm regards,
{{counselor}}`,
  },
  {
    id: 'rejection', icon: '🙏', name: 'Compassionate Rejection',
    subject: 'Update on your application — Guiders Mission',
    body: `Dear {{first_name}},

Thank you sincerely for the time you spent with our team and the documents you shared.

After careful review against the current {{country}} requirements, we are unable to proceed with your file at this time. This is in no way a reflection on your capability — recruitment requirements vary by employer and country.

We will keep your profile on file, and reach out the moment a suitable opportunity opens.

Wishing you every success in your nursing career.

Warm regards,
{{counselor}}
Guiders Mission`,
  },
];

// ── WA follow-up message generators (content only) ─────────────────────────
const WA_TYPES = [
  { id: 'reminder',  name: 'Reminder',          icon: '🔔', desc: 'Call coming up',
    template: (l) => `Hi ${l.name.split(' ')[0]}, this is a friendly reminder about your call with Guiders Mission at ${l.callTime} on ${l.offDay}. Please keep your OET certificate ready. Reply 1 to confirm.` },
  { id: 'reengage',  name: 'Re-engagement',      icon: '🔄', desc: 'Went cold',
    template: (l) => `Hi ${l.name.split(' ')[0]}, we have not heard from you in a while. The ${l.gulf !== '-' ? l.gulf : 'international'} opening is still available and matches your ${l.degree} profile. Would you like to talk this week? Reply YES or NO.` },
  { id: 'congrats',  name: 'Congratulations',    icon: '🎉', desc: 'Eligibility confirmed',
    template: (l) => `Congratulations ${l.name.split(' ')[0]}! You are eligible for the nursing opportunity. Our counselor will reach out shortly with next steps. Welcome aboard! 🙏` },
  { id: 'docs',      name: 'Document checklist', icon: '📋', desc: 'Ask for documents',
    template: (l) => `Hi ${l.name.split(' ')[0]}, please share:\n1. Passport (front + back)\n2. Nursing registration certificate\n3. Latest experience certificate\n4. OET/IELTS scorecard\nThank you 🙏` },
];

// ── Salary map per country ─────────────────────────────────────────────────
const SALARY = {
  'Saudi Arabia': { local: '4,500 SAR/mo', inr: '₹1,00,000' },
  'UAE':          { local: '6,500 AED/mo', inr: '₹1,47,000' },
  'Qatar':        { local: '7,000 QAR/mo', inr: '₹1,60,000' },
  'Oman':         { local: '600 OMR/mo',   inr: '₹1,30,000' },
  'Kuwait':       { local: '500 KWD/mo',   inr: '₹1,35,000' },
  'Bahrain':      { local: '450 BHD/mo',   inr: '₹99,000'   },
  'Malta':        { local: '€2,049/mo',    inr: '₹1,85,000' },
  'Ireland':      { local: '€3,200/mo',    inr: '₹2,88,000' },
};

// ── Empty state defaults (used before live data loads) ────────────────────
const LEADS         = [];
const CONVERSATIONS = [];
const INVOICES      = [];

// ── Expose globals ─────────────────────────────────────────────────────────
Object.assign(window, {
  STAGES, DAYS, COUNTRIES,
  LEADS, CONVERSATIONS, INVOICES,
  EMAIL_TEMPLATES, WA_TYPES, SALARY,
  avatarColor, initials, rowToLead,
});
