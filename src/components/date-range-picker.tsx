"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/lib/locale-context";

type DateRangePickerProps = {
  range: { start: Date; end: Date };
  onChange: (range: { start: Date; end: Date }) => void;
  onTimeNoteChange?: (note: string) => void;
};

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function isBetween(date: Date, start: Date, end: Date) {
  return date.getTime() > start.getTime() && date.getTime() < end.getTime();
}

const TIME_OPTIONS = Array.from({ length: 19 }, (_, index) => {
  const totalMinutes = 9 * 60 + index * 30;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
});

const DEFAULT_TIME = "12:00";
const OTHER_TIME = "other";

function formatTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function withTime(date: Date, time: string) {
  const actualTime = time === OTHER_TIME ? DEFAULT_TIME : time;
  const [hours, minutes] = actualTime.split(":").map(Number);
  const copy = new Date(date);
  copy.setHours(hours, minutes, 0, 0);
  return copy;
}

function buildMonthGrid(year: number, month: number) {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: startWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month, day));
  }
  return cells;
}

export function formatDate(date: Date, locale: "ru" | "en", monthNames: readonly string[]) {
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  if (locale === "ru") return `${day} ${month.slice(0, 3)}`;
  return `${month.slice(0, 3)} ${day}`;
}

export function toUrlDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parseUrlDateTime(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function DateRangePicker({ range, onChange, onTimeNoteChange }: DateRangePickerProps) {
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(range);
  const [pickupTime, setPickupTime] = useState(() => formatTime(range.start) || DEFAULT_TIME);
  const [returnTime, setReturnTime] = useState(() => formatTime(range.end) || DEFAULT_TIME);
  const [selecting, setSelecting] = useState<"start" | "end">("start");
  const [viewYear, setViewYear] = useState(range.start.getFullYear());
  const [viewMonth, setViewMonth] = useState(range.start.getMonth());
  const containerRef = useRef<HTMLDivElement>(null);

  function openPicker(select: "start" | "end") {
    setDraft(range);
    setPickupTime(formatTime(range.start));
    setReturnTime(formatTime(range.end));
    setViewYear(range.start.getFullYear());
    setViewMonth(range.start.getMonth());
    setSelecting(select);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const today = useMemo(() => startOfDay(new Date()), []);
  const nights = Math.round(
    (startOfDay(draft.end).getTime() - startOfDay(draft.start).getTime()) / 86400000
  );

  function handlePickDay(day: Date) {
    if (day.getTime() < today.getTime()) return;
    if (selecting === "start") {
      setDraft({ start: day, end: addDays(day, Math.max(nights, 1)) });
      setSelecting("end");
    } else {
      if (day.getTime() <= draft.start.getTime()) {
        setDraft({ start: day, end: addDays(day, 1) });
        setSelecting("end");
      } else {
        setDraft((prev) => ({ ...prev, end: day }));
        setSelecting("start");
      }
    }
  }

  function handlePickupTimeChange(value: string) {
    setPickupTime(value);
    if (value === OTHER_TIME) onTimeNoteChange?.(t.search.otherTimeNote);
  }

  function handleReturnTimeChange(value: string) {
    setReturnTime(value);
    if (value === OTHER_TIME) onTimeNoteChange?.(t.search.otherTimeNote);
  }

  function handleApply() {
    onChange({
      start: withTime(draft.start, pickupTime),
      end: withTime(draft.end, returnTime),
    });
    setOpen(false);
  }

  function changeMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  const monthsToShow = [0, 1].map((offset) => {
    const date = new Date(viewYear, viewMonth + offset, 1);
    return { year: date.getFullYear(), month: date.getMonth() };
  });

  return (
    <div ref={containerRef} className="relative">
      <div className="grid grid-cols-2 divide-x divide-[#e5e7eb]">
        <button
          type="button"
          onClick={() => openPicker("start")}
          className="flex h-11 flex-col justify-center px-3 text-left"
        >
          <div className="text-[11px] text-foreground-faint">{t.search.pickup}</div>
          <div className="text-sm font-medium text-foreground">
            {formatDate(range.start, locale, t.calendar.months)}, {formatTime(range.start)}
          </div>
        </button>
        <button
          type="button"
          onClick={() => openPicker("end")}
          className="flex h-11 flex-col justify-center px-3 text-left"
        >
          <div className="text-[11px] text-foreground-faint">{t.search.return}</div>
          <div className="text-sm font-medium text-foreground">
            {formatDate(range.end, locale, t.calendar.months)}, {formatTime(range.end)}
          </div>
        </button>
      </div>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[200] max-h-[80vh] w-[min(560px,90vw)] overflow-y-auto rounded-xl border border-border bg-surface p-4 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="rounded-md p-1 text-foreground-muted hover:bg-surface-muted cursor-pointer"
              aria-label="Previous month"
            >
              <i className="ti ti-chevron-left" aria-hidden="true" />
            </button>
            <div className="text-sm font-medium text-foreground">{t.calendar.nights(nights)}</div>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="rounded-md p-1 text-foreground-muted hover:bg-surface-muted cursor-pointer"
              aria-label="Next month"
            >
              <i className="ti ti-chevron-right" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {monthsToShow.map(({ year, month }) => (
              <div key={`${year}-${month}`}>
                <div className="mb-2 text-center text-xs font-medium text-foreground-muted">
                  {t.calendar.months[month]} {year}
                </div>
                <div className="mb-1 grid grid-cols-7 text-center text-[10px] text-foreground-faint">
                  {t.calendar.weekdays.map((weekday) => (
                    <div key={weekday}>{weekday}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                  {buildMonthGrid(year, month).map((day, index) => {
                    if (!day) return <div key={index} />;
                    const disabled = day.getTime() < today.getTime();
                    const isStart = sameDay(day, draft.start);
                    const isEnd = sameDay(day, draft.end);
                    const inRange = isBetween(day, draft.start, draft.end);
                    return (
                      <button
                        key={index}
                        type="button"
                        disabled={disabled}
                        onClick={() => handlePickDay(day)}
                        className={[
                          "aspect-square w-full rounded-md transition-colors cursor-pointer",
                          disabled ? "text-foreground-faint/40 cursor-not-allowed" : "text-foreground hover:bg-surface-muted",
                          inRange ? "bg-surface-muted" : "",
                          isStart || isEnd ? "bg-accent text-accent-foreground hover:bg-accent" : "",
                        ].join(" ")}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
            <div>
              <label className="mb-1 block text-[11px] text-foreground-faint">{t.search.pickupTime}</label>
              <select
                value={pickupTime}
                onChange={(event) => handlePickupTimeChange(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
                <option value={OTHER_TIME}>{t.search.otherTime}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-foreground-faint">{t.search.returnTime}</label>
              <select
                value={returnTime}
                onChange={(event) => handleReturnTimeChange(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
                <option value={OTHER_TIME}>{t.search.otherTime}</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleApply}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover cursor-pointer"
            >
              {t.calendar.done}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
