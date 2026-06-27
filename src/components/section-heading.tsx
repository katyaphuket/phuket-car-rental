type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  align?: "left" | "center";
  variant?: "light" | "dark";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  align = "left",
  variant = "light",
  className = "",
}: SectionHeadingProps) {
  const titleColor = variant === "dark" ? "text-on-dark" : "text-foreground";

  return (
    <div className={`mb-8 ${align === "center" ? "text-center" : ""} ${className}`}>
      {eyebrow && (
        <div
          className={`mb-2.5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-accent ${
            align === "center" ? "justify-center" : ""
          }`}
        >
          <span className="h-px w-5 bg-accent" />
          {eyebrow}
        </div>
      )}
      <h2 className={`font-display text-2xl tracking-tight sm:text-3xl ${titleColor}`}>{title}</h2>
    </div>
  );
}
