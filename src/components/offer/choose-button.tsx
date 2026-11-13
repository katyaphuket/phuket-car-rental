"use client";

type ChooseButtonProps = {
  href: string;
  label: string;
  token: string;
  carId: number;
};

// Открывает мессенджер с готовым сообщением и тихо сообщает сайту, какую машину выбрал клиент.
export function ChooseButton({ href, label, token, carId }: ChooseButtonProps) {
  function report() {
    const body = JSON.stringify({ token, carId });
    try {
      if (!navigator.sendBeacon?.("/api/offer/choose", new Blob([body], { type: "application/json" }))) {
        fetch("/api/offer/choose", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
      }
    } catch {
      // выбор всё равно уйдёт сообщением в мессенджер
    }
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={report}
      className="block w-full rounded-xl bg-accent px-4 py-3 text-center text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
    >
      {label}
    </a>
  );
}
