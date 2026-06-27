type LogoProps = {
  dark?: boolean;
  className?: string;
};

export function Logo({ dark = false, className = "" }: LogoProps) {
  const color = dark ? "#1C1C1E" : "#ffffff";

  return (
    <div
      className={`flex w-[110px] flex-col ${className}`}
      style={{ fontFamily: "var(--font-montserrat)" }}
    >
      <div
        className="leading-none transition-colors duration-300"
        style={{ fontWeight: 800, fontSize: "22px", letterSpacing: "0.15em", color }}
      >
        PHUKET
      </div>
      <div className="mt-0.5 flex items-center gap-1.5">
        <span
          className="h-[0.5px] flex-1 transition-colors duration-300"
          style={{ background: color, opacity: 0.7 }}
        />
        <span
          className="whitespace-nowrap transition-colors duration-300"
          style={{ fontWeight: 300, fontSize: "8px", letterSpacing: "0.35em", color }}
        >
          CAR RENTAL
        </span>
        <span
          className="h-[0.5px] flex-1 transition-colors duration-300"
          style={{ background: color, opacity: 0.7 }}
        />
      </div>
    </div>
  );
}
