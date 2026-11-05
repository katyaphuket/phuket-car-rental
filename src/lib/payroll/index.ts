import { amoFetch } from "@/lib/amocrm";
import { type Amo, type Button, createEngine, type RentProg, type Telegram } from "@/lib/payroll/engine";
import { type AmoLeadRaw, type AmoPairCandidate, phoneKey, phuketDay, plateFrom, STATUS_BOOKED, STATUS_FINISHED, STATUS_ISSUED } from "@/lib/payroll/logic";
import { fetchAllBookings, type RentProgBooking } from "@/lib/rentprog";
import { isSheetsConfigured, sheetsStore } from "@/lib/payroll/sheets-store";

const TIMEOUT_MS = 20000;
const PAGE_SIZE = 250;
const ID_CHUNK = 50;

export function isPayrollConfigured() {
  return Boolean(
    process.env.PAYROLL_TELEGRAM_TOKEN &&
      process.env.PAYROLL_TELEGRAM_SECRET &&
      process.env.PAYROLL_OWNER_CODE &&
      process.env.PAYROLL_START_DATE &&
      process.env.CRON_SECRET &&
      isSheetsConfigured()
  );
}

export async function telegramApi(method: string, payload: unknown) {
  const res = await fetch(`https://api.telegram.org/bot${process.env.PAYROLL_TELEGRAM_TOKEN}/${method}`, {
    method: "POST",
    signal: AbortSignal.timeout(10000),
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body: { ok: boolean; result?: { message_id?: number }; description?: string } = await res.json().catch(() => ({ ok: false }));
  if (!body.ok) throw new Error(`Telegram ${method} failed: ${res.status} ${body.description ?? ""}`);
  return body.result;
}

function inlineKeyboard(buttons: Button[][]) {
  return { inline_keyboard: buttons.map((row) => row.map((b) => ({ text: b.text, callback_data: b.data }))) };
}

const telegram: Telegram = {
  async send(chat, text, options) {
    let reply_markup: unknown;
    if (options?.buttons) {
      reply_markup = inlineKeyboard(options.buttons);
    } else if (options?.forceReply) {
      reply_markup = { force_reply: true };
    } else if (options?.menu) {
      reply_markup = { keyboard: [options.menu.map((text) => ({ text }))], resize_keyboard: true };
    }
    const result = await telegramApi("sendMessage", {
      chat_id: chat,
      text,
      link_preview_options: { is_disabled: true },
      ...(reply_markup ? { reply_markup } : {}),
    });
    return result?.message_id ?? 0;
  },
  async edit(chat, msg, text, buttons) {
    await telegramApi("editMessageText", {
      chat_id: chat,
      message_id: msg,
      text,
      link_preview_options: { is_disabled: true },
      reply_markup: inlineKeyboard(buttons ?? []),
    });
  },
  async answer(callbackId, text) {
    await telegramApi("answerCallbackQuery", { callback_query_id: callbackId, ...(text ? { text } : {}) });
  },
};

const signal = () => AbortSignal.timeout(TIMEOUT_MS);

async function leadsFrom(path: string): Promise<AmoLeadRaw[]> {
  const res = await amoFetch(path, signal());
  if (res.status === 204) return [];
  const body: { _embedded?: { leads?: AmoLeadRaw[] } } = await res.json();
  return body._embedded?.leads ?? [];
}

// The lead's title is usually a car and dates, so the client's name comes from its contact.
async function withClientNames(leads: LeadWithContacts[]) {
  const ids = [...new Set(leads.map(mainContact).filter((id): id is number => Boolean(id)))];
  const names = new Map<number, string>();
  for (let i = 0; i < ids.length; i += CONTACT_CHUNK) {
    const query = ids.slice(i, i + CONTACT_CHUNK).map((id) => `filter[id][]=${id}`).join("&");
    const res = await amoFetch(`contacts?limit=${PAGE_SIZE}&${query}`, signal());
    if (res.status === 204) continue;
    const body: { _embedded?: { contacts?: { id: number; name?: string }[] } } = await res.json();
    for (const contact of body._embedded?.contacts ?? []) names.set(contact.id, contact.name ?? "");
  }
  return leads.map((lead) => {
    const contact = mainContact(lead);
    return { ...lead, clientName: (contact && names.get(contact)) || undefined };
  });
}

const FIELD_START = 1734217;
const FIELD_END = 1734219;
const FIELD_CAR = 1734239;
const PAIR_LOOKBACK_DAYS = 120;
const CONTACT_CHUNK = 50;

type LeadWithContacts = AmoLeadRaw & { _embedded?: { contacts?: { id: number; is_main?: boolean }[] } };

function mainContact(lead: LeadWithContacts) {
  const contacts = lead._embedded?.contacts ?? [];
  return (contacts.find((c) => c.is_main) ?? contacts[0])?.id;
}

function cellValue(lead: AmoLeadRaw, fieldId: number) {
  return lead.custom_fields_values?.find((f) => f.field_id === fieldId)?.values?.[0]?.value;
}

async function allPages(query: string) {
  const found: LeadWithContacts[] = [];
  for (let page = 1; ; page++) {
    const list: LeadWithContacts[] = await leadsFrom(`leads?limit=${PAGE_SIZE}&page=${page}&with=contacts&${query}`);
    found.push(...list);
    if (list.length < PAGE_SIZE) return found;
  }
}

async function contactPhones(ids: number[]) {
  const phones = new Map<number, string[]>();
  for (let i = 0; i < ids.length; i += CONTACT_CHUNK) {
    const query = ids.slice(i, i + CONTACT_CHUNK).map((id) => `filter[id][]=${id}`).join("&");
    const res = await amoFetch(`contacts?limit=${PAGE_SIZE}&${query}`, signal());
    if (res.status === 204) continue;
    const body: { _embedded?: { contacts?: { id: number; custom_fields_values?: { field_code?: string | null; values?: { value?: string | number }[] }[] | null }[] } } = await res.json();
    for (const contact of body._embedded?.contacts ?? []) {
      const values = contact.custom_fields_values?.find((f) => f.field_code === "PHONE")?.values ?? [];
      phones.set(contact.id, values.map((v) => phoneKey(v.value)).filter(Boolean));
    }
  }
  return phones;
}

export const amo: Amo = {
  async leadsByIds(ids) {
    const found: AmoLeadRaw[] = [];
    for (let i = 0; i < ids.length; i += ID_CHUNK) {
      const query = ids.slice(i, i + ID_CHUNK).map((id) => `filter[id][]=${id}`).join("&");
      found.push(...(await leadsFrom(`leads?limit=${PAGE_SIZE}&with=contacts&${query}`)));
    }
    return withClientNames(found);
  },
  async leadsInStatus(pipeline, status) {
    const found: AmoLeadRaw[] = [];
    for (let page = 1; ; page++) {
      const list = await leadsFrom(
        `leads?limit=${PAGE_SIZE}&page=${page}&with=contacts&filter[statuses][0][pipeline_id]=${pipeline}&filter[statuses][0][status_id]=${status}`
      );
      found.push(...list);
      if (list.length < PAGE_SIZE) return withClientNames(found);
    }
  },
  // Working stages in full, since a booking can be months ahead; finished ones only when recent,
  // because that list holds years of rentals.
  async pairCandidates() {
    const leads = new Map<number, LeadWithContacts>();
    const since = Math.floor(Date.now() / 1000) - PAIR_LOOKBACK_DAYS * 86400;
    for (const { pipeline, status } of [...STATUS_BOOKED, STATUS_ISSUED]) {
      for (const lead of await allPages(`filter[statuses][0][pipeline_id]=${pipeline}&filter[statuses][0][status_id]=${status}`)) leads.set(lead.id, lead);
    }
    for (const { pipeline, status } of STATUS_FINISHED) {
      for (const lead of await allPages(`filter[statuses][0][pipeline_id]=${pipeline}&filter[statuses][0][status_id]=${status}&filter[updated_at][from]=${since}`)) leads.set(lead.id, lead);
    }

    const phones = await contactPhones([...new Set([...leads.values()].map(mainContact).filter((id): id is number => Boolean(id)))]);
    return [...leads.values()].map((lead): AmoPairCandidate => {
      const start = Number(cellValue(lead, FIELD_START) ?? 0);
      const end = Number(cellValue(lead, FIELD_END) ?? 0);
      const contact = mainContact(lead);
      return {
        leadId: lead.id,
        status: lead.status_id ?? 0,
        plate: plateFrom(cellValue(lead, FIELD_CAR)),
        phones: (contact && phones.get(contact)) || [],
        start: start ? phuketDay(start * 1000) : "",
        end: end ? phuketDay(end * 1000) : "",
        car: String(cellValue(lead, FIELD_CAR) ?? ""),
        price: lead.price ?? 0,
      };
    });
  },
};

const RENTPROG_NEW = "Новая";
const RENTPROG_FINISHED = "Отъездила";

function rentprogDay(value: string) {
  const m = value.match(/^(\d{2})-(\d{2})-(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
}

export const rentprog: RentProg = {
  async bookings() {
    const list: RentProgBooking[] = await fetchAllBookings();
    return list
      .filter((b) => !b.technical && !b.repair && rentprogDay(b.start_date) && rentprogDay(b.end_date))
      .map((b) => ({
        id: b.id,
        car: b.car_name ?? "машина не указана",
        client: [b.first_name, b.last_name].filter(Boolean).join(" "),
        plate: plateFrom(b.car?.number) || plateFrom(b.car_code) || plateFrom(b.car_name),
        phone: phoneKey(b.client?.phone),
        start: rentprogDay(b.start_date),
        end: rentprogDay(b.end_date),
        rent: b.rental_cost ?? 0,
        createdDay: phuketDay(Date.parse(b.created_at)),
        finished: b.state === RENTPROG_FINISHED,
        inRent: Boolean(b.in_rent),
        draft: b.state === RENTPROG_NEW,
        failed: Boolean(b.failure),
      }));
  },
};

export function payrollEngine() {
  return createEngine({
    store: sheetsStore,
    tg: telegram,
    amo,
    rentprog,
    now: () => Date.now(),
    leadUrl: (id) => `${process.env.AMOCRM_BASE_URL?.replace(/\/+$/, "")}/leads/detail/${id}`,
    startDate: process.env.PAYROLL_START_DATE ?? "",
    ownerCode: process.env.PAYROLL_OWNER_CODE ?? "",
  });
}
