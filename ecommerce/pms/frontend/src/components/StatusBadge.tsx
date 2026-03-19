interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ACTIVE:   { label: "Aktif",   className: "badge-active" },
  DRAFT:    { label: "Taslak",  className: "badge-draft" },
  ARCHIVED: { label: "Arşiv",   className: "badge-archived" },
  MISSING:  { label: "Yok",     className: "badge-missing" },
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: "badge-missing" };
  return (
    <span className={`badge ${config.className} badge-${size}`}>
      {config.label}
    </span>
  );
}

interface TypeBadgeProps {
  type: string;
}

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  TUL:      { label: "Tül",      className: "type-tul" },
  FON:      { label: "Fon",      className: "type-fon" },
  BLACKOUT: { label: "Blackout", className: "type-blk" },
  STN:      { label: "Saten",    className: "type-stn" },
};

export function TypeBadge({ type }: TypeBadgeProps) {
  const config = TYPE_CONFIG[type] ?? { label: type, className: "type-fon" };
  return <span className={`badge type-badge ${config.className}`}>{config.label}</span>;
}
