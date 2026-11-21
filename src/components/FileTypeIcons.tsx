// Little file icons for the formats each package includes.

const COLORS: Record<string, string> = {
  JPG: "#c600d5",
  PNG: "#14b8a6",
  EPS: "#f97316",
  SVG: "#6f07e5",
  AI: "#1c0640",
};

function FileIcon({ label, color }: { label: string; color: string }) {
  return (
    <svg viewBox="0 0 44 52" className="h-12 w-11" aria-hidden>
      <path d="M6 2 h22 l12 12 v32 a4 4 0 0 1 -4 4 h-30 a4 4 0 0 1 -4 -4 v-40 a4 4 0 0 1 4 -4 z" fill="#fff" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M28 2 v12 h12" fill="none" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="0" y="24" width="36" height="16" rx="4" fill={color} />
      <text x="18" y="36" textAnchor="middle" fontSize={label.length > 2 ? 11 : 12} fontWeight="900" fontStyle="italic" fill="#fff" fontFamily="var(--font-display), sans-serif">
        {label}
      </text>
    </svg>
  );
}

function BrandSheetIcon() {
  return (
    <svg viewBox="0 0 44 52" className="h-12 w-11" aria-hidden>
      <rect x="3" y="2" width="38" height="48" rx="4" fill="#fff" stroke="#000" strokeWidth="2.5" />
      <circle cx="14" cy="15" r="6" fill="#6f07e5" />
      <circle cx="30" cy="15" r="6" fill="#c600d5" />
      <circle cx="14" cy="30" r="6" fill="#fcdef9" stroke="#000" strokeWidth="1.5" />
      <circle cx="30" cy="30" r="6" fill="#1c0640" />
      <path d="M10 42 h24" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** A row of file icons, one per format, plus a brand sheet when included. */
export default function FileTypeIcons({ formats, brandSheet = false }: { formats: string[]; brandSheet?: boolean }) {
  const label = [...formats, ...(brandSheet ? ["brand sheet"] : [])].join(", ");
  return (
    <div className="flex flex-wrap gap-1.5" role="img" aria-label={`Includes ${label}`}>
      {formats.map((f) => (
        <FileIcon key={f} label={f} color={COLORS[f] ?? "#000"} />
      ))}
      {brandSheet && <BrandSheetIcon />}
    </div>
  );
}
