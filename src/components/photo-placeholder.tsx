type PhotoPlaceholderProps = {
  icon?: string;
  label?: string;
  className?: string;
};

export function PhotoPlaceholder({ icon = "ti-photo", label, className = "" }: PhotoPlaceholderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 bg-[repeating-linear-gradient(135deg,var(--color-surface-muted)_0px,var(--color-surface-muted)_10px,var(--color-surface)_10px,var(--color-surface)_20px)] text-foreground-faint ${className}`}
    >
      <i className={`ti ${icon} text-3xl`} aria-hidden="true" />
      {label && <span className="text-[10px] uppercase tracking-wide">{label}</span>}
    </div>
  );
}
