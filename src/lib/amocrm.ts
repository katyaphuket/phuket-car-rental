import { after } from "next/server";
import { type BookingPayload, mileageLabel, money, yesNo } from "@/lib/booking";

// amoCRM takes 1-3 seconds per request. The booking form gives up after 10 seconds,
// and the email still has to go out after this.
const AMO_TIMEOUT_MS = 7000;
const AMO_FOLLOW_UP_TIMEOUT_MS = 20000;
const CAR_OPTIONS_TTL_MS = 10 * 60 * 1000;

// Lead field ids from the KataCars amoCRM account.
const FIELD = {
  car: 1734239,
  startDate: 1734217,
  endDate: 1734219,
  days: 1734225,
  pricePerDay: 1734227,
  pickupMethod: 1734221,
  pickupDistrict: 1734241,
  pickupLocation: 1734223,
  pickupFee: 1734229,
  returnLocation: 1734251,
  returnFee: 1734253,
  wash: 1734377,
  deposit: 1734255,
  comment: 1734379,
};

const OFFICE_ZONE_ID = "kata";
const TEXT_FIELD_LIMIT = 256;
const PHUKET_UTC_OFFSET_HOURS = 7;

// Site zone id -> "Район получения" option in amoCRM. Kata Noi has no option of its own.
const DISTRICT_BY_ZONE: Record<string, string> = {
  kata: "Office (Kata)",
  kata_noi: "Kata",
  karon: "Karon",
  chalong: "Chalong",
  rawai: "Rawai",
  patong: "Patong",
  kathu: "Kathu",
  phuket_town: "Phuket Town",
  panwa: "Panwa",
  rassada: "Rassada",
  kamala: "Kamala",
  bangtao: "BangTao",
  surin: "Surin",
  thalang: "Thalang",
  naithon: "NaiThon",
  nai_yang: "NaiYang",
  airport: "Airport",
  mai_khao: "MaiKhao",
};

// RentProg car id -> "Авто" option, for cars that can't be matched by plate number.
const CAR_OPTION_BY_ID: Record<string, string> = {
  "70260": "Mazda2 brown #8050 (Эконом)",
  "83190": "MG5PRO black (Комфорт)",
  "68767": "Mitsubishi Mirage",
  "74245": "Toyota Yaris Cross (Комфорт)",
  "76383": "Toyota Veloz (Комфорт, 7 мест)",
};

type AmoPhoneField = {
  field_code?: string | null;
  values?: { value?: string | number }[];
};

type AmoContact = {
  id: number;
  custom_fields_values?: AmoPhoneField[] | null;
};

export function isAmoConfigured() {
  return Boolean(process.env.AMOCRM_BASE_URL && process.env.AMOCRM_ACCESS_TOKEN);
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function optionalNumber(value: string | undefined) {
  const parsed = Number(value);
  return value && Number.isInteger(parsed) ? parsed : undefined;
}

async function amoFetch(path: string, signal: AbortSignal, init?: RequestInit) {
  const baseUrl = process.env.AMOCRM_BASE_URL?.replace(/\/+$/, "");
  const res = await fetch(`${baseUrl}/api/v4/${path}`, {
    ...init,
    signal,
    headers: {
      Authorization: `Bearer ${process.env.AMOCRM_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const details = await res.text().catch(() => "");
    throw new Error(`amoCRM ${path} failed: ${res.status} ${details.slice(0, 300)}`);
  }
  return res;
}

// amoCRM search is full-text, so a hit is only trusted when the whole number matches.
async function findContactIdByPhone(phone: string, signal: AbortSignal) {
  const digits = digitsOnly(phone);
  if (!digits) return null;

  const res = await amoFetch(`contacts?query=${digits}&limit=25`, signal);
  if (res.status === 204) return null;

  const body: { _embedded?: { contacts?: AmoContact[] } } = await res.json();
  const match = body._embedded?.contacts?.find((contact) =>
    contact.custom_fields_values?.some(
      (field) =>
        field.field_code === "PHONE" &&
        field.values?.some((item) => digitsOnly(String(item.value ?? "")) === digits)
    )
  );
  return match?.id ?? null;
}

let cachedCarOptions: { values: string[]; expiresAt: number } | null = null;

async function getCarOptions(signal: AbortSignal) {
  if (cachedCarOptions && cachedCarOptions.expiresAt > Date.now()) {
    return cachedCarOptions.values;
  }
  const res = await amoFetch(`leads/custom_fields/${FIELD.car}`, signal);
  const field: { enums?: { value: string }[] | null } = await res.json();
  const values = (field.enums ?? []).map((option) => option.value);
  cachedCarOptions = { values, expiresAt: Date.now() + CAR_OPTIONS_TTL_MS };
  return values;
}

function findOptionByNumber(options: string[], number: string | undefined) {
  const digits = number?.replace(/\D/g, "");
  if (!digits) return undefined;
  const pattern = new RegExp(`(?<!\\d)${digits}(?!\\d)`);
  const matches = options.filter((option) => pattern.test(option));
  return matches.length === 1 ? matches[0] : undefined;
}

// Options change as the fleet changes, so a new option with the plate number is found on its own.
function findCarOption(options: string[], data: BookingPayload) {
  const fromTable = data.carId ? CAR_OPTION_BY_ID[data.carId] : undefined;
  if (fromTable && options.includes(fromTable)) return fromTable;

  const numberInName = data.carName.match(/#(\d+)/)?.[1];
  return (
    findOptionByNumber(options, data.carNumber) ??
    findOptionByNumber(options, numberInName) ??
    options.find((option) => option.trim() === data.carName.trim())
  );
}

// The site sends the date as picked on the form, which is Phuket time.
function toTimestamp(value: string) {
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4}) (\d{1,2}):(\d{2})$/);
  if (!match) return undefined;
  const [day, month, year, hours, minutes] = match.slice(1).map(Number);
  return Date.UTC(year, month - 1, day, hours - PHUKET_UTC_OFFSET_HOURS, minutes) / 1000;
}

function buildCustomFields(data: BookingPayload) {
  const fields: { field_id: number; values: { value: string | number }[] }[] = [];
  const add = (fieldId: number, value: string | number | undefined) => {
    if (value !== undefined && value !== "") fields.push({ field_id: fieldId, values: [{ value }] });
  };

  add(FIELD.startDate, toTimestamp(data.pickupDateTime));
  add(FIELD.endDate, toTimestamp(data.returnDateTime));
  add(FIELD.days, data.days);
  add(FIELD.pricePerDay, data.days > 0 ? Math.round(data.rent / data.days) : undefined);
  add(FIELD.pickupMethod, data.pickupZoneId === OFFICE_ZONE_ID ? "Самовывоз" : data.pickupZoneId && "Доставка");
  add(FIELD.pickupDistrict, data.pickupZoneId ? DISTRICT_BY_ZONE[data.pickupZoneId] : undefined);
  add(FIELD.pickupLocation, data.pickupZoneName?.slice(0, TEXT_FIELD_LIMIT));
  add(FIELD.pickupFee, data.pickupFee);
  add(FIELD.returnLocation, data.returnZoneName?.slice(0, TEXT_FIELD_LIMIT));
  add(FIELD.returnFee, data.returnFee);
  add(FIELD.wash, data.washFee);
  add(FIELD.deposit, data.deposit);
  add(FIELD.comment, data.comment?.trim().slice(0, TEXT_FIELD_LIMIT));
  return fields;
}

function buildNoteText(data: BookingPayload) {
  return [
    "ЗАЯВКА С САЙТА",
    "",
    `Машина: ${data.carName} (${data.carClass}, ${data.transmission})`,
    `Номер машины: ${data.carNumber || "не указан в RentProg"}`,
    `Получение: ${data.pickupZoneName} · ${data.pickupDateTime}`,
    `Возврат: ${data.returnZoneName} · ${data.returnDateTime}`,
    `Срок: ${data.days} дней`,
    "",
    `Имя: ${data.name}`,
    `Телефон: ${data.phone}`,
    `Мессенджер: ${data.messenger}`,
    `Комментарий: ${data.comment || "Нет"}`,
    "",
    `Детское автокресло: ${yesNo(data.childSeat)}`,
    `Бустер: ${yesNo(data.booster)}`,
    `Держатель для телефона: ${yesNo(data.phoneHolder)}`,
    `Мойка при возврате: ${data.washFee > 0 ? money(data.washFee) : "Нет"}`,
    `Пробег: ${mileageLabel(data.days)}`,
    "",
    `Аренда: ${money(data.rent)}`,
    `Доставка при получении: ${money(data.pickupFee)}`,
    `Возврат: ${money(data.returnFee)}`,
    `ИТОГО: ${money(data.total)}`,
    `Депозит (возвращается): ${money(data.deposit)}`,
  ].join("\n");
}

export async function createAmoLead(data: BookingPayload) {
  const signal = AbortSignal.timeout(AMO_TIMEOUT_MS);

  // A failed lookup must not lose the lead: the worst case is a duplicate contact.
  const contactId = await findContactIdByPhone(data.phone, signal).catch((error) => {
    console.error("amoCRM contact lookup failed:", error);
    return null;
  });

  const contact = contactId
    ? { id: contactId }
    : {
        name: data.name,
        custom_fields_values: [
          { field_code: "PHONE", values: [{ value: data.phone, enum_code: "WORK" }] },
        ],
      };

  const postLead = (customFields?: ReturnType<typeof buildCustomFields>) =>
    amoFetch("leads/complex", signal, {
      method: "POST",
      body: JSON.stringify([
        {
          name: `${data.name} — ${data.carName} — ${data.pickupDateTime}`,
          price: Math.round(data.total),
          pipeline_id: optionalNumber(process.env.AMOCRM_PIPELINE_ID),
          status_id: optionalNumber(process.env.AMOCRM_STATUS_ID),
          tags_to_add: [{ name: "Сайт" }],
          custom_fields_values: customFields,
          _embedded: { contacts: [contact] },
        },
      ]),
    });

  // A renamed option or deleted field must not lose the lead: retry without the extra fields.
  const res = await postLead(buildCustomFields(data)).catch((error) => {
    console.error("amoCRM lead with fields failed, retrying without them:", error);
    return postLead();
  });
  const [lead]: { id: number }[] = await res.json();

  // The slow part runs after the client has its answer. The lead already exists
  // and the email carries the same details, so a failure here only gets logged.
  after(() =>
    completeLead(lead.id, data).catch((error) => {
      console.error("amoCRM lead follow-up failed:", error);
    })
  );
}

async function completeLead(leadId: number, data: BookingPayload) {
  const signal = AbortSignal.timeout(AMO_FOLLOW_UP_TIMEOUT_MS);

  await amoFetch(`leads/${leadId}/notes`, signal, {
    method: "POST",
    body: JSON.stringify([{ note_type: "common", params: { text: buildNoteText(data) } }]),
  });

  const carOption = findCarOption(await getCarOptions(signal), data);
  if (!carOption) return;

  await amoFetch(`leads/${leadId}`, signal, {
    method: "PATCH",
    body: JSON.stringify({
      custom_fields_values: [{ field_id: FIELD.car, values: [{ value: carOption }] }],
    }),
  });
}
