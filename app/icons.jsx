// Inline SVG icon set — single source so we don't sprinkle paths everywhere.
// All icons stroked 1.6, 16x16 viewbox, currentColor.

const Icon = ({ name, size = 16, style, className }) => {
  const paths = ICONS[name];
  if (!paths) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
};

const ICONS = {
  today:   <>
    <rect x="2.5" y="3" width="11" height="10.5" rx="1.5" />
    <path d="M2.5 6.5h11M5.5 2v2M10.5 2v2" />
  </>,
  pipeline: <>
    <rect x="2" y="3" width="3" height="10" rx="1" />
    <rect x="6.5" y="3" width="3" height="6" rx="1" />
    <rect x="11" y="3" width="3" height="8" rx="1" />
  </>,
  leads:   <>
    <circle cx="6" cy="6" r="2.5" />
    <path d="M2 13c.5-2.5 2-4 4-4s3.5 1.5 4 4" />
    <circle cx="11.5" cy="5" r="1.8" />
    <path d="M11.5 8.5c1.5 0 2.7 1 3 2.5" />
  </>,
  inbox:   <>
    <path d="M2.5 9.5L4 3h8l1.5 6.5v3a1 1 0 01-1 1h-9a1 1 0 01-1-1v-3z" />
    <path d="M2.5 9.5h3l.7 1.5h3.6l.7-1.5h3" />
  </>,
  mail:    <>
    <rect x="2" y="3.5" width="12" height="9" rx="1.5" />
    <path d="M2.5 5l5.5 4 5.5-4" />
  </>,
  whatsapp:<>
    <path d="M3 13.5L4 11a5 5 0 11 2 2L3 13.5z" />
    <path d="M6 8.5c.5 1 1.5 2 2.5 2.5l1-.7c1 .3 1.5.3 2 .2v-1c-.5-.2-1-.4-1.5-.3l-.5.3c-.7-.3-1.3-.9-1.6-1.6l.3-.5c.1-.5-.1-1-.3-1.5h-1c-.1.5-.1 1 .2 2z" />
  </>,
  templates:<>
    <rect x="2.5" y="2.5" width="5" height="5" rx="1" />
    <rect x="8.5" y="2.5" width="5" height="5" rx="1" />
    <rect x="2.5" y="8.5" width="5" height="5" rx="1" />
    <rect x="8.5" y="8.5" width="5" height="5" rx="1" />
  </>,
  chart:   <>
    <path d="M2 13h12" />
    <path d="M4 11V7M7.5 11V4M11 11V8.5" />
  </>,
  card:    <>
    <rect x="2" y="4" width="12" height="9" rx="1.5" />
    <path d="M2 7h12M4.5 10.5h2" />
  </>,
  settings:<>
    <circle cx="8" cy="8" r="2" />
    <path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8L3.4 3.4" />
  </>,
  search:  <>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5L14 14" />
  </>,
  bell:    <>
    <path d="M4 7a4 4 0 018 0v3l1 1.5H3L4 10V7z" />
    <path d="M6.5 13a1.5 1.5 0 003 0" />
  </>,
  plus:    <path d="M8 3v10M3 8h10" />,
  filter:  <>
    <path d="M2 4h12l-4.5 5.5V13l-3-1.5V9.5L2 4z" />
  </>,
  star:    <path d="M8 2l1.8 3.7L14 6.3l-3 2.9.7 4.1L8 11.4l-3.7 2L5 9.2 2 6.3l4.2-.6L8 2z" />,
  starFill: <path d="M8 2l1.8 3.7L14 6.3l-3 2.9.7 4.1L8 11.4l-3.7 2L5 9.2 2 6.3l4.2-.6L8 2z" fill="currentColor" />,
  phone:   <path d="M3.5 3.5h2l1 3-1.5 1c.5 2 2 3.5 4 4l1-1.5 3 1v2c0 .8-.7 1.5-1.5 1.5C5.5 14.5 1.5 10.5 1.5 5c0-.8.7-1.5 1.5-1.5z" />,
  send:    <path d="M2 8L14 2l-3 12-3-5-6-1z" />,
  chev:    <path d="M6 4l4 4-4 4" />,
  chevDown:<path d="M4 6l4 4 4-4" />,
  close:   <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />,
  check:   <path d="M3 8l3.5 3.5L13 5" />,
  edit:    <>
    <path d="M2.5 13.5h11" />
    <path d="M11.5 2.5l2 2-7 7H4.5v-2l7-7z" />
  </>,
  copy:    <>
    <rect x="5" y="5" width="8" height="9" rx="1" />
    <path d="M3 11V3a1 1 0 011-1h6" />
  </>,
  dots:    <>
    <circle cx="3.5" cy="8" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="8" cy="8" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="12.5" cy="8" r="1.1" fill="currentColor" stroke="none" />
  </>,
  download: <>
    <path d="M8 2v9" />
    <path d="M4.5 7.5L8 11l3.5-3.5" />
    <path d="M2.5 13.5h11" />
  </>,
  upload: <>
    <path d="M8 11V2" />
    <path d="M4.5 5.5L8 2l3.5 3.5" />
    <path d="M2.5 13.5h11" />
  </>,
  external: <>
    <path d="M9 2.5h4.5V7" />
    <path d="M13 3L7.5 8.5" />
    <path d="M11.5 9v3.5a1 1 0 01-1 1h-7a1 1 0 01-1-1v-7a1 1 0 011-1H7" />
  </>,
  clock:   <>
    <circle cx="8" cy="8" r="5.5" />
    <path d="M8 5v3l2 1.5" />
  </>,
  flag:    <>
    <path d="M3.5 14V2.5M3.5 3h7l-1 2.5 1 2.5h-7" />
  </>,
  warn:    <>
    <path d="M8 2.5L14 13H2L8 2.5z" />
    <path d="M8 6.5v3M8 11.5v.01" />
  </>,
  trash:   <>
    <path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9c0 .6.5 1 1 1h4.6c.5 0 1-.4 1-1L12 4" />
  </>,
  attach:  <path d="M11 4.5L5.5 10a2 2 0 102.8 2.8L13.5 7a3.5 3.5 0 00-5-5L3 7.5a5 5 0 007 7l5-5" />,
  paperclip: <path d="M11 4.5L5.5 10a2 2 0 102.8 2.8L13.5 7a3.5 3.5 0 00-5-5L3 7.5a5 5 0 007 7l5-5" />,
  reply:   <>
    <path d="M5 4.5L2 7.5l3 3" />
    <path d="M2 7.5h7.5a4 4 0 014 4v1" />
  </>,
  refresh: <>
    <path d="M13.5 8a5.5 5.5 0 11-1.8-4" />
    <path d="M13.5 2v3.5h-3.5" />
  </>,
  user:    <>
    <circle cx="8" cy="6" r="2.5" />
    <path d="M3 13.5c.7-2.5 2.5-4 5-4s4.3 1.5 5 4" />
  </>,
  globe:   <>
    <circle cx="8" cy="8" r="5.5" />
    <path d="M2.5 8h11M8 2.5c2 2 2 9 0 11M8 2.5c-2 2-2 9 0 11" />
  </>,
  briefcase: <>
    <rect x="2" y="5" width="12" height="8" rx="1.5" />
    <path d="M6 5V3.5h4V5M2 9h12" />
  </>,
  grid:    <>
    <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1" />
    <rect x="9" y="2.5" width="4.5" height="4.5" rx="1" />
    <rect x="2.5" y="9" width="4.5" height="4.5" rx="1" />
    <rect x="9" y="9" width="4.5" height="4.5" rx="1" />
  </>,
  spark:   <>
    <path d="M8 2v3M8 11v3M2 8h3M11 8h3M3.5 3.5l2 2M10.5 10.5l2 2M3.5 12.5l2-2M10.5 5.5l2-2" />
  </>,
  arrowRight: <>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </>,
};

Object.assign(window, { Icon });
