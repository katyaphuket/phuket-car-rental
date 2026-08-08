"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/locale-context";

const WHATSAPP_NUMBER = "66839852000";
const TELEGRAM_HANDLE = "katacars";
const MAX_URL = "https://max.ru/u/f9LHodD0cOJt1YlYSilFspYvmkZIByDO0iTUDQUBpOEe3ZkO277W_xDDwuo";

const RU_TIMEZONES = new Set([
  "Europe/Moscow",
  "Europe/Kaliningrad",
  "Europe/Samara",
  "Europe/Volgograd",
  "Europe/Saratov",
  "Europe/Astrakhan",
  "Europe/Ulyanovsk",
  "Europe/Kirov",
  "Asia/Yekaterinburg",
  "Asia/Omsk",
  "Asia/Novosibirsk",
  "Asia/Barnaul",
  "Asia/Tomsk",
  "Asia/Novokuznetsk",
  "Asia/Krasnoyarsk",
  "Asia/Irkutsk",
  "Asia/Chita",
  "Asia/Yakutsk",
  "Asia/Khandyga",
  "Asia/Vladivostok",
  "Asia/Ust-Nera",
  "Asia/Magadan",
  "Asia/Sakhalin",
  "Asia/Srednekolymsk",
  "Asia/Kamchatka",
  "Asia/Anadyr",
]);

function looksLikeRuUser() {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (RU_TIMEZONES.has(timeZone)) return true;
  } catch {
    // Intl unsupported — fall through to the language check
  }
  return navigator.language === "ru-RU";
}

export function useLooksLikeRuUser() {
  const [likely, setLikely] = useState(false);
  useEffect(() => {
    setLikely(looksLikeRuUser());
  }, []);
  return likely;
}

function ContactLinks({ compact }: { compact?: boolean }) {
  const { t } = useLocale();
  const copy = t.fleet.accessIssue;
  const prefillText = encodeURIComponent(copy.prefillMessage);

  const linkClass = compact
    ? "flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-muted"
    : "flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover";

  return (
    <div className={compact ? "flex flex-wrap gap-2" : "flex flex-col gap-2.5 sm:flex-row sm:justify-center"}>
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${prefillText}`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        <i className="ti ti-brand-whatsapp text-base" aria-hidden="true" />
        {copy.whatsapp}
      </a>
      <a
        href={`https://t.me/${TELEGRAM_HANDLE}?text=${prefillText}`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        <i className="ti ti-brand-telegram text-base" aria-hidden="true" />
        {copy.telegram}
      </a>
      <a href={MAX_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
        <i className="ti ti-message-circle text-base" aria-hidden="true" />
        {copy.max}
      </a>
    </div>
  );
}

export function RuAccessBanner() {
  const { t } = useLocale();
  const copy = t.fleet.accessIssue;

  return (
    <div className="mb-6 flex flex-col items-center gap-2 rounded-xl border border-border bg-surface-muted px-4 py-3 text-center sm:flex-row sm:justify-between sm:text-left">
      <p className="text-xs text-foreground-muted">{copy.bannerText}</p>
      <ContactLinks compact />
    </div>
  );
}

export function RuAccessFallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useLocale();
  const copy = t.fleet.accessIssue;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-10 text-center">
      <div>
        <p className="text-base font-semibold text-foreground">{copy.title}</p>
        <p className="mt-1 text-sm text-foreground-muted">{copy.subtitle}</p>
      </div>

      <ContactLinks />

      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted cursor-pointer"
      >
        {t.fleet.retry}
      </button>
    </div>
  );
}
