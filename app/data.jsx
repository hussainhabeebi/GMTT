// Realistic GMTT sample data.
// Indian nurses, Kerala/Tamil Nadu states, Gulf countries + Europe (Malta).
// Stages: New, Collecting, Eligible, Invited, Completed, Ineligible.

const STAGES = [
  { id: 'new',         name: 'New',         color: 'var(--stage-new)' },
  { id: 'collecting',  name: 'Collecting',  color: 'var(--stage-collecting)' },
  { id: 'eligible',    name: 'Eligible',    color: 'var(--stage-eligible)' },
  { id: 'invited',     name: 'Invited',     color: 'var(--stage-invited)' },
  { id: 'completed',   name: 'Completed',   color: 'var(--stage-completed)' },
  { id: 'ineligible',  name: 'Ineligible',  color: 'var(--stage-ineligible)' },
];

const STATES = ['Kerala', 'Tamil Nadu', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Maharashtra'];
const DEGREES = ['B.Sc Nursing', 'GNM', 'ANM', 'M.Sc Nursing', 'Post Basic B.Sc'];
const COUNTRIES = ['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait', 'Bahrain', 'Malta', 'Ireland'];
const LANGUAGES = ['Malayalam', 'Tamil', 'English', 'Hindi', 'Kannada', 'Telugu'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Avatar colors keyed by first letter hash
const AVATAR_PALETTE = [
  '#0F4C5C', '#5C8A6E', '#B07A55', '#4A7B8E', '#D9A047',
  '#9A6B6B', '#B5754C', '#6A9B8A', '#C9627A', '#1A6677',
];
const avatarColor = (name) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
};
const initials = (name) => name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();

// Lead pool — 26 leads, spread across stages
const LEADS_RAW = [
  // [name, phone, email, state, degree, age, eng-level, off-day, call-time, eligible, country, stage, regYear]
  ['Anjali Menon',       '+91 98470 12345', 'anjali.menon@gmail.com',     'Kerala',        'B.Sc Nursing',      26, 'OET-B',   'Wed', '10:30 AM', true,  'UAE',          'invited',    2019],
  ['Priya Krishnan',     '+91 98841 33421', 'priya.k@yahoo.com',          'Tamil Nadu',    'GNM',               24, 'IELTS 6', 'Thu', '04:00 PM', true,  'Saudi Arabia', 'eligible',   2020],
  ['Sneha Pillai',       '+91 97447 99821', 'snehapillai@outlook.com',    'Kerala',        'B.Sc Nursing',      28, 'OET-B',   'Sun', '11:00 AM', true,  'Malta',        'completed',  2017],
  ['Reshma Thomas',      '+91 99950 21177', 'reshma.t@gmail.com',         'Kerala',        'M.Sc Nursing',      30, 'IELTS 7', 'Sat', '02:30 PM', true,  'Ireland',      'completed',  2015],
  ['Divya Suresh',       '+91 98863 54421', 'divya.suresh@gmail.com',     'Tamil Nadu',    'B.Sc Nursing',      25, 'IELTS 6', 'Mon', '03:00 PM', true,  'Qatar',        'invited',    2020],
  ['Lakshmi Nair',       '+91 97464 11203', 'lakshmi.nair@hotmail.com',   'Kerala',        'GNM',               27, 'OET-B',   'Wed', '09:30 AM', true,  'Oman',         'collecting', 2019],
  ['Bindu Raj',          '+91 99477 33289', 'bindu.r@gmail.com',          'Kerala',        'B.Sc Nursing',      29, 'IELTS 6', 'Sun', '05:00 PM', false, '-',            'ineligible', 2018],
  ['Meera Iyer',         '+91 98842 99031', 'meera.iyer@gmail.com',       'Tamil Nadu',    'B.Sc Nursing',      26, 'OET-B',   'Tue', '11:30 AM', true,  'UAE',          'eligible',   2021],
  ['Aiswarya Joseph',    '+91 97466 21188', 'aiswarya.j@gmail.com',       'Kerala',        'GNM',               24, '—',       'Thu', '10:00 AM', null,  '-',            'new',        2022],
  ['Reshmi Varghese',    '+91 99950 71204', 'reshmiv@gmail.com',          'Kerala',        'Post Basic B.Sc',   31, 'OET-B',   'Fri', '06:00 PM', true,  'Saudi Arabia', 'invited',    2014],
  ['Nimisha Babu',       '+91 98472 88341', 'nimisha.b@gmail.com',        'Kerala',        'B.Sc Nursing',      25, 'IELTS 5.5','Wed','02:00 PM', false, '-',            'ineligible', 2021],
  ['Sandhya Reddy',      '+91 99086 41267', 'sandhya.r@gmail.com',        'Andhra Pradesh','M.Sc Nursing',      32, 'OET-B',   'Sat', '11:00 AM', true,  'Malta',        'eligible',   2013],
  ['Kavitha Subramanian','+91 98841 71223', 'kavitha.s@yahoo.com',        'Tamil Nadu',    'B.Sc Nursing',      28, 'IELTS 7', 'Sun', '04:30 PM', true,  'Ireland',      'invited',    2018],
  ['Athira Suresh',      '+91 97447 21344', 'athira.s@gmail.com',         'Kerala',        'GNM',               23, '—',       'Mon', '10:30 AM', null,  '-',            'collecting', 2023],
  ['Jisha Mathew',       '+91 99950 11342', 'jisha.m@gmail.com',          'Kerala',        'B.Sc Nursing',      27, 'OET-B',   'Thu', '03:30 PM', true,  'Qatar',        'eligible',   2019],
  ['Greeshma Anil',      '+91 98472 19932', 'greeshma.a@gmail.com',       'Kerala',        'B.Sc Nursing',      24, '—',       'Wed', '12:00 PM', null,  '-',            'new',        2022],
  ['Pooja Ramesh',       '+91 98863 22107', 'pooja.r@hotmail.com',        'Karnataka',     'GNM',               29, 'IELTS 6', 'Tue', '05:30 PM', true,  'Saudi Arabia', 'collecting', 2017],
  ['Sruthi Mohan',       '+91 97466 88410', 'sruthi.mohan@gmail.com',     'Kerala',        'B.Sc Nursing',      26, 'OET-B',   'Sun', '01:00 PM', true,  'UAE',          'completed',  2019],
  ['Devika Pillai',      '+91 99477 99021', 'devika.p@gmail.com',         'Kerala',        'M.Sc Nursing',      33, 'IELTS 7.5','Sat','10:00 AM', true,  'Ireland',      'completed',  2012],
  ['Asha Kurian',        '+91 98472 31876', 'asha.k@yahoo.com',           'Kerala',        'B.Sc Nursing',      25, '—',       'Fri', '11:30 AM', null,  '-',            'collecting', 2022],
  ['Geetha Pradeep',     '+91 99086 78122', 'geetha.p@gmail.com',         'Telangana',     'GNM',               30, 'IELTS 6', 'Wed', '04:00 PM', true,  'Kuwait',       'invited',    2016],
  ['Manju Antony',       '+91 97447 31298', 'manju.antony@gmail.com',     'Kerala',        'B.Sc Nursing',      28, 'OET-B',   'Mon', '09:00 AM', true,  'Bahrain',      'eligible',   2018],
  ['Renju Joseph',       '+91 98472 65541', 'renju.j@gmail.com',          'Kerala',        'B.Sc Nursing',      27, 'IELTS 6.5','Thu','02:00 PM', true,  'Malta',        'invited',    2019],
  ['Shilpa Nair',        '+91 99950 33812', 'shilpa.nair@gmail.com',      'Kerala',        'GNM',               26, '—',       'Sat', '03:00 PM', null,  '-',            'new',        2022],
  ['Anita George',       '+91 98841 99312', 'anita.george@gmail.com',     'Tamil Nadu',    'B.Sc Nursing',      29, 'OET-B',   'Sun', '06:00 PM', true,  'Saudi Arabia', 'collecting', 2017],
  ['Roopa Krishnan',     '+91 97466 12087', 'roopa.k@gmail.com',          'Karnataka',     'B.Sc Nursing',      24, '—',       'Tue', '10:00 AM', null,  '-',            'new',        2023],
];

const LEADS = LEADS_RAW.map((r, i) => ({
  id: `L${1000 + i}`,
  name: r[0],
  phone: r[1],
  email: r[2],
  state: r[3],
  degree: r[4],
  age: r[5],
  english: r[6],
  offDay: r[7],
  callTime: r[8],
  eligible: r[9],
  gulf: r[10],
  stage: r[11],
  regYear: r[12],
  inviteSent: r[11] === 'invited' || r[11] === 'completed',
  // synthesised
  lastContact: ['2h ago', '1d ago', '3d ago', '5d ago', '1w ago', 'today', 'yesterday'][i % 7],
  starred: i % 7 === 0,
  source: ['Meta Ad', 'Referral', 'Walk-in', 'Instagram', 'Meta Ad', 'Website'][i % 6],
  notes: [
    { ts: '14 Apr · 11:20', by: 'Jaipal', text: 'Spoke with candidate — confirmed she has 4 years ICU experience. Wants Gulf. Will send OET docs Friday.' },
    { ts: '12 Apr · 09:00', by: 'Anu',    text: 'First call. Polite. Husband supportive. Asked about salary in AED.' },
  ].slice(0, (i % 3) + 1),
  callLog: [
    { ts: '15 Apr · 10:32', by: 'Jaipal', outcome: 'Answered · 7m 14s' },
    { ts: '12 Apr · 09:01', by: 'Anu',    outcome: 'Answered · 12m 03s' },
    { ts: '10 Apr · 17:45', by: 'Anu',    outcome: 'No answer' },
  ].slice(0, (i % 3) + 1),
  emailHistory: r[11] === 'invited' || r[11] === 'completed' ? [
    { ts: '13 Apr · 14:10', template: 'Call Invite',      status: 'opened' },
    { ts: '11 Apr · 09:30', template: 'Eligibility Check', status: 'replied' },
  ] : [],
}));

// ── Counselors / team ──────────────────────────────────────────────────────
const TEAM = [
  { id: 'jaipal', name: 'Jaipal Menon',  role: 'Lead Counselor',    color: '#0F4C5C', online: true },
  { id: 'anu',    name: 'Anu Krishnan',  role: 'Counselor',         color: '#B07A55', online: true },
  { id: 'rajesh', name: 'Rajesh Pillai', role: 'Counselor',         color: '#5C8A6E', online: false },
  { id: 'sara',   name: 'Sara Thomas',   role: 'Documentation',     color: '#4A7B8E', online: true },
  { id: 'biju',   name: 'Biju Varghese', role: 'Accounts',          color: '#B5754C', online: false },
];

// ── Conversations (Chatwoot-ish) ───────────────────────────────────────────
const CONVERSATIONS = [
  {
    id: 'C-7421', leadId: 'L1000', status: 'open', channel: 'whatsapp',
    unread: 2, lastTs: '10:42 AM', assigned: 'jaipal',
    preview: 'Yes sir, I will share my OET certificate today',
    messages: [
      { from: 'them', ts: 'Yesterday · 18:30', body: 'Hello sir, this is Anjali. I got your call invite email.' },
      { from: 'me',   ts: 'Yesterday · 18:45', body: 'Hi Anjali — yes, confirmed for Wed 10:30 AM. Please share OET certificate before the call.', author: 'Jaipal' },
      { from: 'them', ts: 'Yesterday · 19:10', body: 'Thank you sir 🙏' },
      { from: 'them', ts: '10:30 AM',          body: 'Sir good morning' },
      { from: 'them', ts: '10:42 AM',          body: 'Yes sir, I will share my OET certificate today' },
    ],
  },
  {
    id: 'C-7420', leadId: 'L1004', status: 'open', channel: 'whatsapp',
    unread: 1, lastTs: '10:18 AM', assigned: 'jaipal',
    preview: 'Sir, what about the visa processing time?',
    messages: [
      { from: 'them', ts: 'Mon · 14:00', body: 'Sir, my Qatar interview is confirmed?' },
      { from: 'me',   ts: 'Mon · 14:22', body: 'Yes Divya, interview slot booked for next Wednesday. Documents reviewed and OK.', author: 'Jaipal' },
      { from: 'them', ts: '10:18 AM',     body: 'Sir, what about the visa processing time?' },
    ],
  },
  {
    id: 'C-7419', leadId: 'L1005', status: 'pending', channel: 'whatsapp',
    unread: 0, lastTs: 'Yesterday', assigned: 'anu',
    preview: 'I will think and come back to you sir',
    messages: [
      { from: 'me', ts: 'Mon · 11:00', body: 'Hi Lakshmi — checking in about the Oman opportunity we discussed. Are you still interested?', author: 'Anu' },
      { from: 'them', ts: 'Yesterday', body: 'I will think and come back to you sir' },
    ],
  },
  {
    id: 'C-7418', leadId: 'L1008', status: 'open', channel: 'whatsapp',
    unread: 3, lastTs: '09:55 AM', assigned: null,
    preview: 'My GNM certificate is from 2022',
    messages: [
      { from: 'them', ts: '09:50 AM', body: 'Hi sir' },
      { from: 'them', ts: '09:52 AM', body: 'I saw the ad on Instagram' },
      { from: 'them', ts: '09:55 AM', body: 'My GNM certificate is from 2022' },
    ],
  },
  {
    id: 'C-7417', leadId: 'L1012', status: 'open', channel: 'whatsapp',
    unread: 0, lastTs: 'Tue', assigned: 'jaipal',
    preview: 'Thank you sir, I will be ready for the call',
    messages: [
      { from: 'me',   ts: 'Tue · 09:30', body: 'Hi Kavitha — quick reminder, call invite for Sunday 4:30 PM (Ireland).', author: 'Jaipal' },
      { from: 'them', ts: 'Tue · 12:00', body: 'Thank you sir, I will be ready for the call' },
    ],
  },
  {
    id: 'C-7416', leadId: 'L1020', status: 'resolved', channel: 'whatsapp',
    unread: 0, lastTs: 'Mon', assigned: 'anu',
    preview: '✓ Documents received — thank you',
    messages: [
      { from: 'them', ts: 'Mon · 10:00', body: 'Sir, sending OET certificate now' },
      { from: 'me',   ts: 'Mon · 10:05', body: '✓ Documents received — thank you', author: 'Anu' },
    ],
  },
  {
    id: 'C-7415', leadId: 'L1014', status: 'pending', channel: 'whatsapp',
    unread: 0, lastTs: 'Mon', assigned: 'jaipal',
    preview: 'OK sir',
    messages: [
      { from: 'me',   ts: 'Mon · 16:30', body: 'Hi Jisha — your Qatar profile is ready. Please confirm passport details.', author: 'Jaipal' },
      { from: 'them', ts: 'Mon · 18:00', body: 'OK sir' },
    ],
  },
  {
    id: 'C-7414', leadId: 'L1022', status: 'open', channel: 'whatsapp',
    unread: 0, lastTs: 'Mon', assigned: 'jaipal',
    preview: 'I have to ask my parents sir',
    messages: [
      { from: 'me',   ts: 'Mon · 11:00', body: 'Hi Manju — Bahrain opening for senior nurse. Salary 1100 BHD. Interested?', author: 'Jaipal' },
      { from: 'them', ts: 'Mon · 13:00', body: 'I have to ask my parents sir' },
    ],
  },
];

// ── Email templates ────────────────────────────────────────────────────────
const EMAIL_TEMPLATES = [
  {
    id: 'invite',
    icon: '📅',
    name: 'Call Invite',
    subject: 'Your call with Guiders Mission — {{call_time}}, {{off_day}}',
    body: `Dear {{first_name}},

Thank you for your interest in international nursing opportunities with Guiders Mission Tours and Travels.

Based on your profile ({{degree}}, registered {{state}} Nurses Council), we have shortlisted you for an opportunity in {{country}}.

**Call details**
• Date: {{off_day}}
• Time: {{call_time}}
• Indicative salary: {{salary_local}} ({{salary_inr}} INR equivalent)

Please keep your OET / IELTS certificate, registration certificate and passport copy handy for the call.

Warm regards,
{{counselor}}
Guiders Mission Tours and Travels`,
  },
  {
    id: 'congrats',
    icon: '🎉',
    name: 'Congratulations — Eligibility Confirmed',
    subject: 'Congratulations {{first_name}} — you\'re eligible for {{country}}',
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
    id: 'followup',
    icon: '🔔',
    name: 'Follow-up — Re-engage',
    subject: 'Still considering {{country}}, {{first_name}}?',
    body: `Dear {{first_name}},

It has been a few weeks since we last spoke about the {{country}} opening. We wanted to check in — are you still considering this opportunity?

The role is still open and the indicative salary remains {{salary_local}}.

If now is not the right time, no problem at all. Just reply with a quick note and we will pause your file.

Warm regards,
{{counselor}}`,
  },
  {
    id: 'rejection',
    icon: '🙏',
    name: 'Compassionate Rejection',
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

// ── WhatsApp Meta-approved templates ───────────────────────────────────────
const WA_TEMPLATES = [
  { id: 'wa-call-reminder', name: 'call_reminder_v3', category: 'UTILITY',     status: 'approved', updated: '2 days ago',
    body: 'Hi {{1}}, this is a friendly reminder about your call with Guiders Mission at {{2}} on {{3}}. Please keep your OET certificate ready. Reply 1 to confirm.' },
  { id: 'wa-doc-checklist', name: 'document_checklist', category: 'UTILITY',   status: 'approved', updated: '1 week ago',
    body: 'Hi {{1}}, please share the following documents:\n1. Passport (front + back)\n2. Nursing registration certificate\n3. Latest experience certificate\n4. OET/IELTS scorecard' },
  { id: 'wa-congrats',      name: 'congrats_eligible', category: 'UTILITY',   status: 'approved', updated: '3 weeks ago',
    body: 'Congratulations {{1}}! You are eligible for the {{2}} opening. Our counselor {{3}} will reach out shortly with next steps.' },
  { id: 'wa-reengage',      name: 'reengage_30d', category: 'MARKETING',      status: 'approved', updated: '1 month ago',
    body: 'Hi {{1}}, we have a new opening in {{2}} that matches your profile. Would you like to know more? Reply YES or NO.' },
  { id: 'wa-survey',        name: 'placement_feedback', category: 'UTILITY',  status: 'pending',  updated: '4 hours ago',
    body: 'Hi {{1}}, congratulations on your placement at {{2}}! We would love your feedback — would you spare 2 minutes?' },
  { id: 'wa-onboard',       name: 'onboarding_welcome', category: 'UTILITY',  status: 'approved', updated: '2 months ago',
    body: 'Welcome to Guiders Mission family, {{1}}! Your counselor is {{2}}. Save this number for all future communication.' },
  { id: 'wa-rejection',     name: 'kind_decline', category: 'UTILITY',        status: 'rejected', updated: '1 week ago',
    body: 'Dear {{1}}, after review, we are unable to proceed with your application. We wish you the best for your nursing career.' },
];

// ── Stripe-style invoices ──────────────────────────────────────────────────
const INVOICES = [
  { id: 'INV-2026-0042', desc: 'Aiingo Dashboard — Monthly',   amount: 15000, currency: 'INR', status: 'paid',    date: '01 May 2026', method: '•• 4242' },
  { id: 'INV-2026-0038', desc: 'Aiingo Retainer — April',      amount: 45000, currency: 'INR', status: 'paid',    date: '15 Apr 2026', method: '•• 4242' },
  { id: 'INV-2026-0031', desc: 'Setup — Chatwoot integration', amount: 12500, currency: 'INR', status: 'paid',    date: '02 Apr 2026', method: '•• 4242' },
  { id: 'INV-2026-0029', desc: 'Aiingo Dashboard — Monthly',   amount: 15000, currency: 'INR', status: 'paid',    date: '01 Apr 2026', method: '•• 4242' },
  { id: 'INV-2026-0021', desc: 'Aiingo Retainer — March',      amount: 45000, currency: 'INR', status: 'paid',    date: '15 Mar 2026', method: '•• 8821' },
  { id: 'INV-2026-0044', desc: 'Aiingo Dashboard — June',      amount: 15000, currency: 'INR', status: 'due',     date: '01 Jun 2026', method: '—'       },
];

// Make everything global to other Babel files
Object.assign(window, {
  STAGES, STATES, DEGREES, COUNTRIES, LANGUAGES, DAYS,
  LEADS, TEAM, CONVERSATIONS, EMAIL_TEMPLATES, WA_TEMPLATES, INVOICES,
  avatarColor, initials,
});
