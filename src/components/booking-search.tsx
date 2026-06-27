"use client";

import { useLocale } from "@/lib/locale-context";
import { DateRangePicker } from "./date-range-picker";
import { ZoneSelect } from "./zone-select";

type BookingSearchProps = {
  range: { start: Date; end: Date };
  onChange: (range: { start: Date; end: Date }) => void;
  onTimeNoteChange?: (note: string) => void;
  pickupZoneId: string;
  returnZoneId: string;
  onPickupZoneChange: (zoneId: string) => void;
  onReturnZoneChange: (zoneId: string) => void;
  onSubmit: () => void;
};

export function BookingSearch({
  range,
  onChange,
  onTimeNoteChange,
  pickupZoneId,
  returnZoneId,
  onPickupZoneChange,
  onReturnZoneChange,
  onSubmit,
}: BookingSearchProps) {
  const { t } = useLocale();

  return (
    <div
      className="relative z-20 w-full rounded-2xl p-4 text-left sm:p-5"
      style={{
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}
    >
      <div className="grid grid-cols-2 divide-x divide-[#e5e7eb] border-b border-[#e5e7eb]">
        <ZoneSelect
          label={t.search.pickupZone}
          value={pickupZoneId}
          onChange={(zoneId) => {
            onPickupZoneChange(zoneId);
            onReturnZoneChange(zoneId);
          }}
        />

        <ZoneSelect label={t.search.returnZone} value={returnZoneId} onChange={onReturnZoneChange} />
      </div>

      <div className="border-b border-[#e5e7eb]">
        <DateRangePicker range={range} onChange={onChange} onTimeNoteChange={onTimeNoteChange} />
      </div>

      <button
        type="button"
        onClick={onSubmit}
        className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-accent text-base font-semibold text-accent-foreground hover:bg-accent-hover cursor-pointer"
      >
        {t.search.submit}
      </button>
      <p className="mt-1.5 text-center text-xs text-foreground-faint">{t.search.cancelNote}</p>
    </div>
  );
}
