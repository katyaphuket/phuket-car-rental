// Pure payroll rules: who shares a deal, how much is accrued, how answers are parsed.

export const RATE = 0.05;
export const OWNER = "Владелец";

const FIELD_START = 1734217;
const FIELD_END = 1734219;
const FIELD_CAR = 1734239;
const FIELD_MANAGER = 1738813;

export const STATUS_BOOKED = [
  { pipeline: 2538268, status: 7669282 }, // Продажи
  { pipeline: 8187810, status: 70107330 }, // Повторные продажи
];
export const STATUS_ISSUED = { pipeline: 2538268, status: 70178258 };
export const STATUS_FINISHED = [
  { pipeline: 2538268, status: 70178266 }, // Аренда завершена
  { pipeline: 2538268, status: 142 },
  { pipeline: 8187810, status: 142 },
];
export const STATUS_REJECTED = 143;

export const SHARES = {
  o: { label: "Ольга", option: "Ольга", split: { "Ольга": 1 } },
  n: { label: "Наталья", option: "Наталья", split: { "Наталья": 1 } },
  s: { label: "50/50 Наталья и Ольга", option: "50/50 Наталья/Ольга", split: { "Наталья": 0.5, "Ольга": 0.5 } },
  f: { label: "Офис", option: "Офис", split: { "Офис": 1 } },
  no: { label: "50/50 Наталья и офис", option: "50/50 Наталья/офис", split: { "Наталья": 0.5, "Офис": 0.5 } },
  oo: { label: "50/50 Ольга и офис", option: "50/50 Ольга/офис", split: { "Ольга": 0.5, "Офис": 0.5 } },
  d: { label: "Екатерина/Дмитрий", option: "Екатерина/Дмитрий", split: { "Екатерина/Дмитрий": 1 } },
} as const satisfies Record<string, { label: string; option: string; split: Record<string, number> }>;

export type ShareKey = keyof typeof SHARES;
export const SHARE_KEYS = Object.keys(SHARES) as ShareKey[];
export const PERSON_NAMES = ["Ольга", "Наталья", "Офис", "Екатерина/Дмитрий"];

export function isShareKey(value: string): value is ShareKey {
  return Object.hasOwn(SHARES, value);
}

export type DealState = "asked_whose" | "booked" | "asked_issue" | "in_rent" | "asked_pay" | "asked_end" | "finished" | "no_show" | "cancelled";

export const STATE_LABEL: Record<DealState, string> = {
  asked_whose: "Ждём решение владелицы: чья заявка",
  booked: "Забронирована",
  asked_issue: "Ждём ответ: выдача",
  in_rent: "В аренде",
  asked_pay: "Ждём ответ: оплата за месяц",
  asked_end: "Ждём ответ: сдача",
  finished: "Завершена",
  no_show: "Клиент не приехал",
  cancelled: "Отказ",
};

export type SentMessage = { chat: number; msg: number };

export type Deal = {
  leadId: number;
  name: string;
  car: string;
  start: string; // YYYY-MM-DD, Phuket calendar day
  end: string;
  rent: number; // the amoCRM budget, which holds rent only: no wash, delivery or deposit
  share: ShareKey | "";
  state: DealState;
  manual: boolean; // the bot or the owner corrected this deal, so amoCRM must not overwrite it
  lastAsked: string;
  blockKey: string; // the evening list this deal is in, like "i:2026-12-05"
  note: string; // how the question in that list was answered
  monthlySum: number; // above zero when a long rental is paid month by month
  nextPay: string; // the day the next monthly payment is due
  messages: SentMessage[];
};

export type Accrual = {
  date: string;
  leadId: number;
  car: string;
  type: string;
  base: number;
  person: string;
  fraction: number;
  amount: number;
  key: string;
};

export type Person = { chat: number; name: string };

export type AmoLeadRaw = {
  id: number;
  name?: string;
  status_id?: number;
  price?: number;
  custom_fields_values?: { field_id?: number; values?: { value?: string | number }[] }[] | null;
};

const PHUKET_OFFSET_MS = 7 * 3600 * 1000;

export function phuketDay(ms: number) {
  return new Date(ms + PHUKET_OFFSET_MS).toISOString().slice(0, 10);
}

function values(lead: AmoLeadRaw, fieldId: number) {
  return lead.custom_fields_values?.find((f) => f.field_id === fieldId)?.values ?? [];
}

function numberField(lead: AmoLeadRaw, fieldId: number) {
  const n = Number(values(lead, fieldId)[0]?.value);
  return Number.isFinite(n) ? n : 0;
}

function dayField(lead: AmoLeadRaw, fieldId: number) {
  const seconds = numberField(lead, fieldId);
  return seconds > 0 ? phuketDay(seconds * 1000) : "";
}

// Exactly one known option gives an answer. Combinations like "Другое + Ольга" do not say
// how the money is split, so those stay unknown and the bot has to ask.
export function shareFromOptions(options: string[]): ShareKey | "" {
  if (options.length !== 1) return "";
  const found = (Object.keys(SHARES) as ShareKey[]).find((key) => SHARES[key].option === options[0]);
  return found ?? "";
}

export type LeadFields = Pick<Deal, "leadId" | "name" | "car" | "start" | "end" | "rent" | "share">;

export function fieldsFromLead(lead: AmoLeadRaw): LeadFields | null {
  const start = dayField(lead, FIELD_START);
  const end = dayField(lead, FIELD_END);
  if (!start || !end) return null;

  return {
    leadId: lead.id,
    name: lead.name ?? "",
    car: String(values(lead, FIELD_CAR)[0]?.value ?? "машина не указана"),
    start,
    end,
    rent: lead.price ?? 0,
    share: shareFromOptions(values(lead, FIELD_MANAGER).map((v) => String(v.value))),
  };
}

// Whole baht per person's share, in satang precision so 50/50 of an odd sum stays exact.
export function accrualsFor(deal: Pick<Deal, "leadId" | "car">, base: number, share: ShareKey, type: string, date: string, key: string): Accrual[] {
  return Object.entries(SHARES[share].split).map(([person, fraction]) => ({
    date,
    leadId: deal.leadId,
    car: deal.car,
    type,
    base,
    person,
    fraction,
    amount: Math.round(base * RATE * fraction * 100) / 100,
    key,
  }));
}

export function parseSum(text: string): number | null {
  const cleaned = text.replace(/[\s,฿]/g, "").replace(/(бат|baht|thb)\.?$/i, "");
  if (!/^\d{1,8}$/.test(cleaned)) return null;
  return Number(cleaned);
}

// "25.12" takes the nearest such date that is not long past; "25.12.2026" is taken as written.
export function parseDay(text: string, today: string): string | null {
  const m = text.trim().match(/^(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?$/);
  if (!m) return null;
  const day = m[1].padStart(2, "0");
  const month = m[2].padStart(2, "0");
  const build = (year: number) => `${year}-${month}-${day}`;
  const valid = (iso: string) => {
    const t = Date.parse(iso);
    return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === iso;
  };

  if (m[3]) {
    const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return valid(build(year)) ? build(year) : null;
  }

  const year = Number(today.slice(0, 4));
  const candidate = build(year);
  if (!valid(candidate)) return valid(build(year + 1)) ? build(year + 1) : null;
  const longPast = Date.parse(today) - Date.parse(candidate) > 60 * 86400000;
  return longPast ? build(year + 1) : candidate;
}

export function parseDateRange(text: string, today: string): { start: string; end: string } | null {
  const parts = text.trim().split(/[\s–—-]+/).filter(Boolean);
  if (parts.length !== 2) return null;
  const start = parseDay(parts[0], today);
  const end = parseDay(parts[1], today);
  if (!start || !end || end <= start) return null;
  return { start, end };
}

export function parseExtension(text: string, today: string): { end: string; sum: number } | null {
  const parts = text.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const end = parseDay(parts[0], today);
  const sum = parseSum(parts.slice(1).join(""));
  if (!end || sum === null) return null;
  return { end, sum };
}

export function money(value: number) {
  const rounded = Math.round(value * 100) / 100;
  return `${rounded.toLocaleString("ru-RU")} ฿`;
}

export function shortDay(iso: string) {
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
}

// A retried or double-pressed answer writes the same key, and it must count once.
export function uniqueAccruals(rows: Accrual[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const id = `${row.key}|${row.person}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

// A booking that exists only in RentProg has no amoCRM deal, so its id is stored negative.
export const rentprogDealId = (bookingId: number) => -bookingId;
export const isRentprogDeal = (dealId: number) => dealId < 0;

export type RpBooking = {
  id: number;
  car: string;
  plate: string;
  phone: string;
  start: string;
  end: string;
  rent: number;
  createdDay: string; // Phuket calendar day
  finished: boolean;
  inRent: boolean;
  draft: boolean; // a site request nobody has confirmed yet
  failed: boolean;
};

export type AmoPairCandidate = { leadId: number; status: number; plate: string; phones: string[]; start: string };

const PAIR_MAX_DAYS_APART = 3;

export const phoneKey = (value: unknown) => String(value ?? "").replace(/\D/g, "").slice(-9);
export const plateFrom = (value: unknown) => String(value ?? "").match(/\d{3,4}/g)?.pop() ?? "";

// The phone comes first: it is always in RentProg. Not every amoCRM deal has one, though, so
// the car and date catch the rest.
export function findAmoPair(booking: RpBooking, candidates: AmoPairCandidate[]) {
  const close = candidates.filter((c) => c.start && Math.abs(Date.parse(c.start) - Date.parse(booking.start)) <= PAIR_MAX_DAYS_APART * 86400000);
  return (
    close.find((c) => booking.phone && c.phones.includes(booking.phone)) ??
    close.find((c) => booking.plate && c.plate === booking.plate) ??
    null
  );
}

// Longer than this, a rental may be paid in full or month by month, so the manager is asked.
const LONG_RENTAL_DAYS = 31;

export function isLongRental(deal: Pick<Deal, "start" | "end">) {
  return (Date.parse(deal.end) - Date.parse(deal.start)) / 86400000 > LONG_RENTAL_DAYS;
}

// The same day next month, or the month's last day when it is shorter (31 Jan -> 28 Feb).
export function addMonths(day: string, months: number) {
  const [year, month, date] = day.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month - 1 + months + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month - 1 + months, Math.min(date, lastDay))).toISOString().slice(0, 10);
}

// The first monthly payment still to come: one month after the start, or for a rental that
// began before the launch, the first one on or after the launch. The last month needs no ask
// when it would fall on or after the return day.
export function firstMonthlyPayment(start: string, end: string, startDate: string) {
  let months = 1;
  while (addMonths(start, months) < startDate) months++;
  const due = addMonths(start, months);
  return due < end ? due : "";
}

export function nextMonthlyPayment(start: string, current: string, end: string) {
  let months = 1;
  while (addMonths(start, months) <= current) months++;
  const due = addMonths(start, months);
  return due < end ? due : "";
}
