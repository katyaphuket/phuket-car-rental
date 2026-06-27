"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { ZONES, type Zone } from "@/lib/delivery-rules";

type ZoneSelectProps = {
  label: string;
  value: string;
  onChange: (zoneId: string) => void;
};

function zoneName(zone: Zone, locale: "ru" | "en") {
  return zone.name[locale];
}

export function ZoneSelect({ label, value, onChange }: ZoneSelectProps) {
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedZone = ZONES.find((zone) => zone.id === value);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    const matches = (zone: Zone) =>
      search.length === 0 || zoneName(zone, locale).toLowerCase().includes(search);

    const popular = ZONES.filter((zone) => zone.popular && matches(zone));
    const rest = ZONES.filter((zone) => !zone.popular && matches(zone)).sort((a, b) =>
      zoneName(a, locale).localeCompare(zoneName(b, locale))
    );

    return { popular, rest };
  }, [query, locale]);

  function handleSelect(zoneId: string) {
    onChange(zoneId);
    setOpen(false);
    setQuery("");
  }

  function renderRow(zone: Zone) {
    const isSelected = zone.id === value;
    return (
      <button
        key={zone.id}
        type="button"
        onClick={() => handleSelect(zone.id)}
        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm cursor-pointer hover:bg-surface-muted ${
          isSelected ? "bg-accent-soft text-accent-soft-foreground" : "text-foreground"
        }`}
      >
        <span>{zoneName(zone, locale)}</span>
        <span className="text-xs text-foreground-faint">
          {zone.price === 0 ? t.zoneSelect.free : `+฿${zone.price.toLocaleString("ru-RU")}`}
        </span>
      </button>
    );
  }

  const hasResults = filtered.popular.length > 0 || filtered.rest.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="flex h-11 w-full items-center justify-between px-3 text-left cursor-pointer"
      >
        <span>
          <span className="block text-[11px] text-foreground-faint">{label}</span>
          <span className="flex items-center gap-1 text-sm font-medium text-foreground">
            <i className="ti ti-map-pin text-accent" aria-hidden="true" />
            {selectedZone ? zoneName(selectedZone, locale) : ""}
          </span>
        </span>
        <i
          className={`ti ti-chevron-down text-foreground-faint transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[200] w-[min(320px,90vw)] rounded-xl border border-border bg-surface p-2 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.zoneSelect.searchPlaceholder}
            className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />

          <div className="max-h-72 overflow-y-auto">
            {!hasResults && (
              <p className="px-3 py-4 text-center text-sm text-foreground-faint">
                {t.zoneSelect.noResults}
              </p>
            )}

            {filtered.popular.length > 0 && (
              <div className="mb-1">
                <div className="px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-foreground-faint">
                  {t.zoneSelect.popular}
                </div>
                {filtered.popular.map(renderRow)}
              </div>
            )}

            {filtered.popular.length > 0 && filtered.rest.length > 0 && (
              <div className="my-1 h-px bg-border" />
            )}

            {filtered.rest.length > 0 && (
              <div>
                <div className="px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-foreground-faint">
                  {t.zoneSelect.allZones}
                </div>
                {filtered.rest.map(renderRow)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
