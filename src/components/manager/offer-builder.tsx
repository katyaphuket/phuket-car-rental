"use client";

import { useEffect, useMemo, useState } from "react";
import type { Car } from "@/lib/cars";
import { getCarFeatures } from "@/lib/car-features";
import { canDeliver, ZONES } from "@/lib/delivery-rules";
import { CarPhoto } from "@/components/car-photo";
import type { LeadPrefill } from "@/lib/amo-offer-link";

type Messenger = "whatsapp" | "telegram" | "instagram" | "max";

const MESSENGER_LABELS: Record<Messenger, string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  instagram: "Instagram",
  max: "MAX",
};

const MESSENGER_STORAGE_KEY = "kc-offer-messenger";
const LIST_TIMEOUT_MS = 30000;

// "2026-12-12T10:00" -> "12-12-2026 10:00" (формат RentProg)
function toRentProgDate(value: string) {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-");
  const [hours, minutes] = time.split(":");
  return `${day}-${month}-${year} ${Number(hours)}:${minutes}`;
}

function toUtc(value: string) {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return Date.UTC(year, month - 1, day, hours, minutes);
}

// Так же, как считает сайт.
function daysBetween(start: string, end: string) {
  return Math.max(Math.round((toUtc(end) - toUtc(start)) / 86400000), 1);
}

function money(value: number) {
  return `${value.toLocaleString("ru-RU")} ฿`;
}

function dayWord(days: number) {
  const mod10 = days % 10;
  const mod100 = days % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дня";
  return "дней";
}

function buildMessage(url: string, name: string, locale: "ru" | "en", rangeText: string) {
  if (locale === "en") {
    return `${name ? `Hi ${name}!` : "Hi!"} Here are the cars we've picked for you for ${rangeText}. Photos, prices and terms are on this page:\n${url}`;
  }
  return `${name ? `${name}, здравствуйте!` : "Здравствуйте!"} Подобрали для вас машины на ${rangeText}. Фото, цены и условия — по ссылке:\n${url}`;
}

const MONTHS_RU = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function rangeLabel(start: string, end: string, locale: "ru" | "en") {
  const months = locale === "en" ? MONTHS_EN : MONTHS_RU;
  const [, m1, d1] = start.split("T")[0].split("-").map(Number);
  const [, m2, d2] = end.split("T")[0].split("-").map(Number);
  if (m1 === m2) return `${d1}–${d2} ${months[m1 - 1]}`;
  return `${d1} ${months[m1 - 1]} – ${d2} ${months[m2 - 1]}`;
}

function defaultDate(offsetDays: number) {
  const date = new Date(Date.now() + offsetDays * 86400000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T10:00`;
}

export function OfferBuilder({ prefill }: { prefill?: LeadPrefill | null }) {
  const [start, setStart] = useState(() => prefill?.start ?? defaultDate(1));
  const [end, setEnd] = useState(() => prefill?.end ?? defaultDate(8));
  const [name, setName] = useState(prefill?.name ?? "");
  const [locale, setLocale] = useState<"ru" | "en">("ru");
  const [pickupZoneId, setPickupZoneId] = useState(prefill?.pickupZoneId ?? "");
  const [returnZoneId, setReturnZoneId] = useState("");
  const [messenger, setMessenger] = useState<Messenger>("whatsapp");
  const [lead, setLead] = useState(prefill?.leadUrl ?? "");

  const [cars, setCars] = useState<Car[] | null>(null);
  const [searchedFor, setSearchedFor] = useState<{ start: string; end: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // своя цена за день по ID машины; пусто — цена RentProg
  const [prices, setPrices] = useState<Record<string, string>>({});

  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ url: string; message: string; missing: number } | null>(null);
  const [copied, setCopied] = useState<"" | "message" | "link">("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MESSENGER_STORAGE_KEY) as Messenger | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the manager's last choice after mount
      if (saved && saved in MESSENGER_LABELS) setMessenger(saved);
    } catch {
      // localStorage недоступен — ничего страшного
    }
  }, []);

  function changeMessenger(value: Messenger) {
    setMessenger(value);
    try {
      localStorage.setItem(MESSENGER_STORAGE_KEY, value);
    } catch {
      // ignore
    }
  }

  const datesValid = Boolean(start && end && toUtc(end) > toUtc(start));
  const days = datesValid ? daysBetween(start, end) : 0;
  const datesChanged = searchedFor && (searchedFor.start !== start || searchedFor.end !== end);
  const pickupZone = ZONES.find((zone) => zone.id === pickupZoneId);
  const returnZone = ZONES.find((zone) => zone.id === (returnZoneId || pickupZoneId));

  async function search(event?: React.FormEvent) {
    event?.preventDefault();
    if (!datesValid) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSelected(new Set());
    setPrices({});
    const params = new URLSearchParams({
      start_date: toRentProgDate(start),
      end_date: toRentProgDate(end),
      days: String(days),
    });
    try {
      const res = await fetch(`/api/cars?${params}`, { signal: AbortSignal.timeout(LIST_TIMEOUT_MS) });
      if (!res.ok) throw new Error();
      const list: Car[] = await res.json();
      list.sort((a, b) => a.pricePerDayThb - b.pricePerDayThb);
      setCars(list);
      setSearchedFor({ start, end });
    } catch {
      setError("RentProg не ответил. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    setResult(null);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function changePrice(id: string, value: string) {
    setResult(null);
    setPrices((current) => ({ ...current, [id]: value.replace(/[^\d]/g, "") }));
  }

  async function createOffer() {
    if (!searchedFor || selected.size === 0) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: toRentProgDate(searchedFor.start),
          end: toRentProgDate(searchedFor.end),
          days: daysBetween(searchedFor.start, searchedFor.end),
          name,
          locale,
          pickupZoneId: pickupZoneId || undefined,
          returnZoneId: returnZoneId || pickupZoneId || undefined,
          messenger,
          lead,
          // в том порядке, в каком машины стоят в списке
          carIds: (cars ?? []).filter((car) => selected.has(car.id)).map((car) => car.id),
          prices: Object.fromEntries(
            Object.entries(prices).filter(([id, value]) => selected.has(id) && Number(value) > 0)
          ),
        }),
      });
      if (res.status === 401) {
        window.location.reload();
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const message = buildMessage(data.url, name.trim(), locale, rangeLabel(searchedFor.start, searchedFor.end, locale));
      setResult({ url: data.url, message, missing: data.missing ?? 0 });
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Не получилось создать ссылку");
    } finally {
      setCreating(false);
    }
  }

  async function copy(text: string, kind: "message" | "link") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      window.prompt("Скопируйте вручную:", text);
    }
  }

  const visibleCars = useMemo(() => cars ?? [], [cars]);

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";
  const labelClass = "mb-1 block text-xs font-medium text-foreground-muted";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-40 pt-6">
      <h1 className="text-xl font-semibold text-foreground">Подборка для клиента</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Даты → «Найти» → отметьте машины → «Создать ссылку» → вставьте сообщение клиенту в чат.
      </p>

      {prefill && (
        <p className="mt-4 rounded-lg bg-accent-soft px-4 py-2.5 text-sm text-accent-soft-foreground">
          Открыто из сделки{" "}
          <a href={prefill.leadUrl} target="_blank" rel="noopener noreferrer" className="font-medium underline">
            №{prefill.leadId}
          </a>
          {prefill.start && prefill.end
            ? ": даты, имя и район подставлены из сделки — проверьте и нажмите «Найти»."
            : ": в сделке не заполнены даты — укажите их ниже."}
        </p>
      )}

      <form onSubmit={search} className="mt-5 grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={labelClass}>Получение</label>
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Возврат</label>
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Доставка: получение</label>
          <select value={pickupZoneId} onChange={(e) => { setPickupZoneId(e.target.value); setResult(null); }} className={inputClass}>
            <option value="">Не указывать</option>
            {ZONES.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name.ru} — {zone.price ? money(zone.price) : "бесплатно"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Доставка: возврат</label>
          <select value={returnZoneId} onChange={(e) => { setReturnZoneId(e.target.value); setResult(null); }} className={inputClass}>
            <option value="">{pickupZone ? `Там же (${pickupZone.name.ru})` : "Не указывать"}</option>
            {ZONES.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name.ru} — {zone.price ? money(zone.price) : "бесплатно"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Имя клиента (необязательно)</label>
          <input value={name} onChange={(e) => { setName(e.target.value); setResult(null); }} placeholder="Анна" maxLength={40} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Язык подборки</label>
          <div className="flex gap-2">
            {(["ru", "en"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => { setLocale(value); setResult(null); }}
                className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                  locale === value ? "border-accent bg-accent-soft text-accent-soft-foreground" : "border-border text-foreground"
                }`}
              >
                {value === "ru" ? "Русский" : "English"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass}>Клиент ответит в</label>
          <select value={messenger} onChange={(e) => { changeMessenger(e.target.value as Messenger); setResult(null); }} className={inputClass}>
            {(Object.keys(MESSENGER_LABELS) as Messenger[]).map((value) => (
              <option key={value} value={value}>{MESSENGER_LABELS[value]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Ссылка на сделку amoCRM (необязательно)</label>
          <input value={lead} onChange={(e) => { setLead(e.target.value); setResult(null); }} placeholder="https://…amocrm.ru/leads/detail/…" className={inputClass} />
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            disabled={!datesValid || loading}
            className="cursor-pointer rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? "Ищу свободные машины…" : "Найти свободные машины"}
          </button>
          {datesValid ? (
            <span className="text-sm text-foreground-muted">{days} {dayWord(days)}</span>
          ) : (
            <span className="text-sm text-red-600">Возврат должен быть позже получения</span>
          )}
          {datesChanged && <span className="text-sm text-amber-700">Даты изменились — нажмите «Найти» ещё раз</span>}
        </div>
      </form>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {cars && !loading && (
        <>
          <p className="mt-6 text-sm text-foreground-muted">
            Свободно: {visibleCars.length}. Нажмите на машину, чтобы добавить её в подборку.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCars.map((car) => {
              const features = getCarFeatures(Number(car.id), car.name);
              const isSelected = selected.has(car.id);
              const zoneForCheck = pickupZone?.id ?? "kata";
              const startDate = new Date(toUtc(searchedFor!.start));
              const searchedDays = daysBetween(searchedFor!.start, searchedFor!.end);
              const deliveryCheck = canDeliver(Number(car.id), car.name, zoneForCheck, searchedDays, startDate);
              const returnCheck = returnZone && returnZone.id !== zoneForCheck
                ? canDeliver(Number(car.id), car.name, returnZone.id, searchedDays, startDate)
                : { available: true as const, reason: undefined };
              const warning = deliveryCheck.reason ?? returnCheck.reason;
              const customValue = prices[car.id] ?? "";
              const customPrice = Number(customValue);
              const hasCustom = customValue !== "" && customPrice > 0 && customPrice !== car.pricePerDayThb;
              return (
                <div
                  key={car.id}
                  className={`rounded-xl border-2 bg-surface transition-colors ${
                    isSelected ? "border-accent bg-accent-soft/40" : "border-transparent hover:border-border"
                  }`}
                >
                  <button type="button" onClick={() => toggle(car.id)} className="flex w-full cursor-pointer gap-3 p-2.5 text-left">
                    <CarPhoto carId={car.id} alt={features.displayName} className="h-20 w-28 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{features.displayName}</p>
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                            isSelected ? "border-accent bg-accent text-accent-foreground" : "border-border"
                          }`}
                        >
                          {isSelected ? "✓" : ""}
                        </span>
                      </div>
                      <p className="text-xs text-foreground-muted">
                        {features.carClass} · {features.year}{car.number ? ` · #${car.number}` : ""}
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        <b className={hasCustom ? "font-normal text-foreground-muted line-through" : ""}>{money(car.pricePerDayThb)}</b>/день · {money(car.pricePerPeriodThb)}
                      </p>
                      <p className="text-xs text-foreground-muted">Депозит {money(car.depositThb)}</p>
                      {warning && <p className="mt-1 text-xs text-amber-700">⚠ {warning}</p>}
                    </div>
                  </button>
                  {isSelected && (
                    <div className="flex flex-wrap items-center gap-2 border-t border-accent/30 px-2.5 py-2 text-xs text-foreground-muted">
                      <label htmlFor={`price-${car.id}`}>Своя цена за день:</label>
                      <input
                        id={`price-${car.id}`}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        step={10}
                        value={customValue}
                        onChange={(e) => changePrice(car.id, e.target.value)}
                        placeholder={String(car.pricePerDayThb)}
                        className="w-24 rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-accent"
                      />
                      <span>฿</span>
                      {hasCustom && (
                        <>
                          <span className="font-medium text-foreground">= {money(customPrice * searchedDays)} за {searchedDays} {dayWord(searchedDays)}</span>
                          <button type="button" onClick={() => changePrice(car.id, "")} className="cursor-pointer text-accent underline">
                            вернуть цену RentProg
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {cars && selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">
          <div className="mx-auto max-w-5xl">
            {result ? (
              <div className="flex flex-col gap-2">
                <textarea readOnly value={result.message} rows={3} className={`${inputClass} resize-none text-xs`} />
                {result.missing > 0 && (
                  <p className="text-xs text-amber-700">
                    {result.missing} маш. не попали в подборку: RentProg не отдал цену. Можно создать ссылку ещё раз.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copy(result.message, "message")}
                    className="cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
                  >
                    {copied === "message" ? "Скопировано ✓" : "Скопировать сообщение"}
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(result.url, "link")}
                    className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-surface-muted"
                  >
                    {copied === "link" ? "Скопировано ✓" : "Только ссылку"}
                  </button>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-surface-muted"
                  >
                    Посмотреть как клиент
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-foreground">Выбрано машин: <b>{selected.size}</b></span>
                <button
                  type="button"
                  onClick={createOffer}
                  disabled={creating || Boolean(datesChanged)}
                  className="cursor-pointer rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
                >
                  {creating ? "Создаю…" : "Создать ссылку"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
