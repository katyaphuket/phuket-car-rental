import { createHmac, timingSafeEqual } from "crypto";
import { readdirSync } from "fs";
import path from "path";

// Персональная подборка машин для клиента. Вся подборка (даты, машины, цены на момент
// отправки) лежит прямо в ссылке и подписана, поэтому базы данных не нужно, а клиент
// не может поменять цены в ссылке.

export const OFFER_VALID_DAYS = 3;
export const MANAGER_COOKIE = "kc_manager";
const MAX_CARS = 12;
const NAME_LIMIT = 40;

export type OfferLocale = "ru" | "en";
export type Messenger = "whatsapp" | "telegram" | "instagram" | "max";
export const MESSENGERS: Messenger[] = ["whatsapp", "telegram", "instagram", "max"];

// listPrice — цена RentProg, если менеджер поставил свою (pricePerDay);
// name — только для машин, которых нет в knowledge/cars.json
export type OfferCar = { id: number; pricePerDay: number; deposit: number; listPrice?: number; name?: string };
export type OfferZone = { id: string; fee: number };

export type Offer = {
  start: string; // "DD-MM-YYYY H:mm", как в RentProg, время Пхукета
  end: string;
  days: number;
  locale: OfferLocale;
  name: string;
  pickup?: OfferZone;
  dropoff?: OfferZone;
  messenger: Messenger;
  leadId?: number;
  createdAt: number; // unix, секунды
  cars: OfferCar[];
};

// Подборка в ссылке — одна строка с полями через «|», чтобы ссылка была короче:
// даты|дни|язык|имя|доставка|возврат|мессенджер|сделка|создана|машины
// дата "2612101000" = 10.12.2026 10:00; зона "airport:1000";
// машина "70264:950:6000[:цена RentProg, если менеджер поменял цену[:название]]"
const MESSENGER_CODES: Record<Messenger, string> = { whatsapp: "w", telegram: "t", instagram: "i", max: "m" };
const DATE_PATTERN = /^(\d{2})-(\d{2})-(\d{4}) (\d{1,2}):(\d{2})$/;

function packDate(value: string) {
  const match = value.match(DATE_PATTERN);
  if (!match) throw new Error(`bad date ${value}`);
  const [, day, month, year, hours, minutes] = match;
  return `${year.slice(2)}${month}${day}${hours.padStart(2, "0")}${minutes}`;
}

function unpackDate(value: string) {
  const match = value.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (!match) throw new Error(`bad packed date ${value}`);
  const [, year, month, day, hours, minutes] = match;
  return `${day}-${month}-20${year} ${Number(hours)}:${minutes}`;
}

// Убираем символы-разделители из текста, который кладём в ссылку.
function packText(value: string) {
  return value.replace(/[|:,]/g, " ").replace(/\s+/g, " ").trim();
}

function packZone(zone: OfferZone | undefined) {
  return zone ? `${zone.id}:${zone.fee}` : "";
}

function unpackZone(value: string): OfferZone | undefined {
  if (!value) return undefined;
  const [id, fee] = value.split(":");
  return { id, fee: Number(fee) || 0 };
}

function signingKey() {
  const base = process.env.OFFER_SECRET || process.env.RENTPROG_COMPANY_TOKEN;
  if (!base) throw new Error("OFFER_SECRET or RENTPROG_COMPANY_TOKEN must be set");
  return createHmac("sha256", base).update("katacars-offer-v1").digest();
}

function sign(value: string) {
  return createHmac("sha256", signingKey()).update(value).digest("base64url").slice(0, 16);
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function cleanName(value: string | undefined) {
  return (value ?? "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, NAME_LIMIT);
}

export function encodeOffer(offer: Offer) {
  const cars = offer.cars
    .slice(0, MAX_CARS)
    .map((car) => {
      const parts: (string | number)[] = [car.id, car.pricePerDay, car.deposit];
      if (car.listPrice || car.name) parts.push(car.listPrice ?? "");
      if (car.name) parts.push(packText(car.name));
      return parts.join(":");
    })
    .join(",");
  const fields = [
    packDate(offer.start),
    packDate(offer.end),
    offer.days,
    offer.locale === "en" ? "e" : "r",
    packText(cleanName(offer.name)),
    packZone(offer.pickup),
    packZone(offer.dropoff),
    MESSENGER_CODES[offer.messenger],
    offer.leadId ?? "",
    offer.createdAt.toString(36),
    cars,
  ];
  const body = Buffer.from(fields.join("|")).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeOffer(token: string): Offer | null {
  const [body, signature] = token.split(".");
  if (!body || !signature || !safeEqual(signature, sign(body))) return null;

  try {
    const fields = Buffer.from(body, "base64url").toString("utf8").split("|");
    if (fields.length !== 11) return null;
    const [start, end, days, locale, name, pickup, dropoff, messengerCode, leadId, createdAt, cars] = fields;
    const messenger = MESSENGERS.find((item) => MESSENGER_CODES[item] === messengerCode) ?? "whatsapp";
    const parsedCars = cars
      .split(",")
      .filter(Boolean)
      .map((item) => {
        const [id, pricePerDay, deposit, listPrice, carName] = item.split(":");
        return {
          id: Number(id),
          pricePerDay: Number(pricePerDay),
          deposit: Number(deposit),
          listPrice: Number(listPrice) || undefined,
          name: carName || undefined,
        };
      });
    if (parsedCars.length === 0) return null;
    return {
      start: unpackDate(start),
      end: unpackDate(end),
      days: Number(days),
      locale: locale === "e" ? "en" : "ru",
      name,
      pickup: unpackZone(pickup),
      dropoff: unpackZone(dropoff),
      messenger,
      leadId: Number(leadId) || undefined,
      createdAt: parseInt(createdAt, 36),
      cars: parsedCars,
    };
  } catch {
    return null;
  }
}

export function isOfferExpired(offer: Offer, now = Date.now()) {
  if (now > offer.createdAt * 1000 + OFFER_VALID_DAYS * 86400000) return true;
  const start = parseRentProgDate(offer.start);
  return start ? start.getTime() < now : false;
}

// "DD-MM-YYYY H:mm" (время Пхукета, UTC+7) -> Date
export function parseRentProgDate(value: string) {
  const match = value.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const [day, month, year, hours, minutes] = match.slice(1).map(Number);
  return new Date(Date.UTC(year, month - 1, day, hours - 7, minutes));
}

const MONTHS: Record<OfferLocale, string[]> = {
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

function dateParts(value: string) {
  const match = value.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return { day: Number(match[1]), month: Number(match[2]) - 1, year: Number(match[3]), time: `${match[4]}:${match[5]}` };
}

// "12 декабря" / "12 Dec"
export function formatDay(value: string, locale: OfferLocale) {
  const parts = dateParts(value);
  if (!parts) return value;
  return `${parts.day} ${MONTHS[locale][parts.month]}`;
}

// "12–20 декабря" или "28 декабря – 5 января"
export function formatRange(start: string, end: string, locale: OfferLocale) {
  const a = dateParts(start);
  const b = dateParts(end);
  if (!a || !b) return `${start} – ${end}`;
  if (a.month === b.month && a.year === b.year) {
    return `${a.day}–${b.day} ${MONTHS[locale][a.month]}`;
  }
  return `${formatDay(start, locale)} – ${formatDay(end, locale)}`;
}

export function formatTime(value: string) {
  return dateParts(value)?.time ?? "";
}

// Фото машины: public/cars/<id>/1.webp, 2.webp… (папка = ID в RentProg)
export function listCarPhotos(carId: number) {
  try {
    const dir = path.join(process.cwd(), "public", "cars", String(carId));
    return readdirSync(dir)
      .filter((file) => /^\d+\.(webp|png|jpe?g)$/i.test(file))
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((file) => `/cars/${carId}/${file}`);
  } catch {
    return [];
  }
}

// --- Вход для менеджеров -------------------------------------------------------

export function isManagerPasswordSet() {
  return Boolean(process.env.MANAGER_PASSWORD);
}

export function managerCookieValue() {
  const password = process.env.MANAGER_PASSWORD;
  if (!password) return null;
  return createHmac("sha256", signingKey()).update(`manager:${password}`).digest("base64url");
}

export function checkManagerPassword(input: string) {
  const password = process.env.MANAGER_PASSWORD;
  return Boolean(password) && safeEqual(input, password!);
}

export function isManagerCookieValid(value: string | undefined) {
  const expected = managerCookieValue();
  return Boolean(expected && value && safeEqual(value, expected));
}

// --- Куда клиент ответит ---------------------------------------------------------

const WHATSAPP_NUMBER = "66839852000";
const TELEGRAM_HANDLE = "katacars";
const INSTAGRAM_HANDLE = "katacars";
const MAX_URL = "https://max.ru/u/f9LHodD0cOJt1YlYSilFspYvmkZIByDO0iTUDQUBpOEe3ZkO277W_xDDwuo";

export function messengerLink(messenger: Messenger, text: string) {
  const encoded = encodeURIComponent(text);
  switch (messenger) {
    case "telegram":
      return `https://t.me/${TELEGRAM_HANDLE}?text=${encoded}`;
    case "instagram":
      return `https://ig.me/m/${INSTAGRAM_HANDLE}`;
    case "max":
      return MAX_URL;
    default:
      return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
  }
}

// Адрес, с которого клиенты открывают подборку. Только свой домен: *.vercel.app в России блокируют.
export function offerBaseUrl(requestOrigin: string) {
  if (process.env.OFFER_BASE_URL) return process.env.OFFER_BASE_URL.replace(/\/+$/, "");
  return process.env.NODE_ENV === "production" ? "https://phuketrentcar.com" : requestOrigin;
}
