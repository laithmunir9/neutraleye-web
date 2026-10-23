/* Toolbar icons, 18px line drawings from the dashboard mockup. */

function Icon({ children }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const DraftsIcon = () => (
  <Icon>
    <rect x="4" y="4" width="6" height="6" rx="1" />
    <rect x="14" y="4" width="6" height="6" rx="1" />
    <rect x="4" y="14" width="6" height="6" rx="1" />
    <rect x="14" y="14" width="6" height="6" rx="1" />
  </Icon>
);
export const UndoIcon = () => (
  <Icon>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
  </Icon>
);
export const RedoIcon = () => (
  <Icon>
    <path d="m15 14 5-5-5-5" />
    <path d="M20 9H10a6 6 0 0 0 0 12h3" />
  </Icon>
);
export const BoldIcon = () => (
  <Icon>
    <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7z" />
    <path d="M7 12h7a3.5 3.5 0 0 1 0 7H7z" />
  </Icon>
);
export const ItalicIcon = () => (
  <Icon>
    <path d="M14 5h-4" />
    <path d="M14 19h-4" />
    <path d="M14 5 10 19" />
    <path d="M18 5h-4M10 19H6" />
  </Icon>
);
export const UnderlineIcon = () => (
  <Icon>
    <path d="M7 4v7a5 5 0 0 0 10 0V4" />
    <path d="M5 20h14" />
  </Icon>
);
export const AlignLeftIcon = () => (
  <Icon>
    <path d="M4 6h16M4 10h10M4 14h16M4 18h10" />
  </Icon>
);
export const AlignCenterIcon = () => (
  <Icon>
    <path d="M4 6h16M7 10h10M4 14h16M7 18h10" />
  </Icon>
);
export const AlignRightIcon = () => (
  <Icon>
    <path d="M4 6h16M10 10h10M4 14h16M10 18h10" />
  </Icon>
);
export const PanelIcon = () => (
  <Icon>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M15 4v16" />
  </Icon>
);
