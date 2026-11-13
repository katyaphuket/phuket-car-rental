import { amoFetch, FIELD, isAmoConfigured } from "@/lib/amocrm";
import { ZONES } from "@/lib/delivery-rules";
import type { Messenger } from "@/lib/offer";

// Поле-ссылка «🚗 Подобрать авто» в карточке сделки amoCRM. Сайт сам вписывает в него
// адрес /manager?lead=<id>, а страница менеджера по этому адресу заполняет даты и имя из сделки.

export const OFFER_LINK_FIELD_CODE = "KC_OFFER_LINK";
export const OFFER_LINK_FIELD_NAME = "🚗 Подобрать авто";
const FIELD_ID_TTL_MS = 60 * 60 * 1000;
const PHUKET_OFFSET_MS = 7 * 60 * 60 * 1000;
const AMO_TIMEOUT_MS = 8000;

// «Район получения» в amoCRM -> зона доставки на сайте (обратная таблица к DISTRICT_BY_ZONE в amocrm.ts)
const ZONE_BY_DISTRICT: Record<string, string> = {
  "Office (Kata)": "kata",
  Kata: "kata_noi",
  Karon: "karon",
  Chalong: "chalong",
  Rawai: "rawai",
  Patong: "patong",
  Kathu: "kathu",
  "Phuket Town": "phuket_town",
  Panwa: "panwa",
  Rassada: "rassada",
  Kamala: "kamala",
  BangTao: "bangtao",
  Surin: "surin",
  Thalang: "thalang",
  NaiThon: "naithon",
  NaiYang: "nai_yang",
  Airport: "airport",
  MaiKhao: "mai_khao",
};

export function managerLinkForLead(leadId: number | string) {
  const base = (process.env.OFFER_BASE_URL || "https://phuketrentcar.com").replace(/\/+$/, "");
  return `${base}/manager?lead=${leadId}`;
}

let cachedFieldId: { id: number | null; expiresAt: number } | null = null;

export async function findOfferLinkFieldId(signal: AbortSignal) {
  if (cachedFieldId && cachedFieldId.expiresAt > Date.now()) return cachedFieldId.id;
  let id: number | null = null;
  for (let page = 1; page <= 10 && id === null; page++) {
    const res = await amoFetch(`leads/custom_fields?limit=250&page=${page}`, signal);
    if (res.status === 204) break;
    const body: { _embedded?: { custom_fields?: { id: number; code?: string | null }[] }; _links?: { next?: unknown } } =
      await res.json();
    id = body._embedded?.custom_fields?.find((field) => field.code === OFFER_LINK_FIELD_CODE)?.id ?? null;
    if (!body._links?.next) break;
  }
  cachedFieldId = { id, expiresAt: Date.now() + FIELD_ID_TTL_MS };
  return id;
}

// Из вебхука amoCRM: сделки (новые и изменённые), у которых поле-ссылка ещё пустое.
// Вебхук присылает поля сделки, поэтому лишних запросов к amoCRM нет.
export function leadsWithoutOfferLink(form: FormData, fieldId: number) {
  const ids: string[] = [];
  for (const [key, value] of form.entries()) {
    const match = key.match(/^leads\[(add|update)\]\[(\d+)\]\[id\]$/);
    if (!match) continue;
    const prefix = `leads[${match[1]}][${match[2]}][custom_fields]`;
    const hasLink = [...form.entries()].some(
      ([fieldKey, fieldValue]) =>
        fieldKey.startsWith(prefix) && fieldKey.endsWith("[id]") && fieldValue === String(fieldId) &&
        Boolean(form.get(fieldKey.replace(/\[id\]$/, "[values][0][value]")) ?? form.get(fieldKey.replace(/\[id\]$/, "[values][0]")))
    );
    if (!hasLink) ids.push(String(value));
  }
  return [...new Set(ids)];
}

export async function fillOfferLinks(leadIds: string[], fieldId: number) {
  if (leadIds.length === 0) return;
  const signal = AbortSignal.timeout(20000);
  await amoFetch("leads", signal, {
    method: "PATCH",
    body: JSON.stringify(
      leadIds.map((id) => ({
        id: Number(id),
        custom_fields_values: [{ field_id: fieldId, values: [{ value: managerLinkForLead(id) }] }],
      }))
    ),
  });
}

// --- Заполнение страницы менеджера из сделки ------------------------------------

export type LeadPrefill = {
  leadId: number;
  leadUrl: string;
  start?: string; // "2026-12-12T10:00" для поля datetime-local
  end?: string;
  name?: string;
  pickupZoneId?: string;
  messenger?: Messenger; // где клиент переписывается с нами — туда и ведёт кнопка «Хочу эту машину»
};

// Метка канала переписки в amoCRM (Wazzup) -> мессенджер.
// Проверено на переписках KataCars: com.wazzup24-1 — Telegram, com.wazzup24.wz — WhatsApp.
const MESSENGER_BY_ORIGIN: Record<string, Messenger> = {
  "com.wazzup24-1": "telegram",
  "com.wazzup24.wz": "whatsapp",
  "com.wazzap24": "whatsapp",
  instagram_business: "instagram",
};

type AmoTalk = { origin?: string; entity_id?: number | null; updated_at?: number };

// Мессенджер последней переписки по этой сделке (или с этим контактом).
export function pickMessenger(talks: AmoTalk[], leadId: number): Messenger | undefined {
  const known = talks.filter((talk) => talk.origin && MESSENGER_BY_ORIGIN[talk.origin]);
  const forLead = known.filter((talk) => talk.entity_id === leadId);
  const latest = (forLead.length > 0 ? forLead : known).sort((a, b) => (b.updated_at ?? 0) - (a.updated_at ?? 0))[0];
  return latest ? MESSENGER_BY_ORIGIN[latest.origin!] : undefined;
}

async function findMessenger(contactId: number, leadId: number, signal: AbortSignal) {
  const res = await amoFetch(`talks?filter[contact_id]=${contactId}&limit=50`, signal);
  if (res.status === 204) return undefined;
  const body: { _embedded?: { talks?: AmoTalk[] } } = await res.json();
  return pickMessenger(body._embedded?.talks ?? [], leadId);
}

type AmoField = { field_id?: number; values?: { value?: string | number }[] };

function fieldValue(fields: AmoField[] | null | undefined, fieldId: number) {
  return fields?.find((field) => field.field_id === fieldId)?.values?.[0]?.value;
}

function toLocalInput(timestamp: string | number | undefined) {
  const seconds = Number(timestamp);
  if (!seconds) return undefined;
  return new Date(seconds * 1000 + PHUKET_OFFSET_MS).toISOString().slice(0, 16);
}

// Имя контакта годится, только если это имя, а не телефон или «Контакт 123».
function cleanContactName(name: string | undefined) {
  const trimmed = name?.trim();
  if (!trimmed || !/\p{L}/u.test(trimmed) || /^(контакт|contact|новый контакт)\b/i.test(trimmed)) return undefined;
  return trimmed.replace(/[+\d()\-\s]{6,}/g, " ").trim().slice(0, 40) || undefined;
}

export async function loadLeadPrefill(leadIdRaw: string | undefined): Promise<LeadPrefill | null> {
  const leadId = Number(leadIdRaw);
  if (!Number.isInteger(leadId) || leadId <= 0 || !isAmoConfigured()) return null;

  const signal = AbortSignal.timeout(AMO_TIMEOUT_MS);
  const leadUrl = `${process.env.AMOCRM_BASE_URL?.replace(/\/+$/, "")}/leads/detail/${leadId}`;
  try {
    const res = await amoFetch(`leads/${leadId}?with=contacts`, signal);
    const lead: {
      custom_fields_values?: AmoField[] | null;
      _embedded?: { contacts?: { id: number; is_main?: boolean }[] };
    } = await res.json();

    const fields = lead.custom_fields_values;
    const district = fieldValue(fields, FIELD.pickupDistrict);
    const pickupZoneId = district ? ZONE_BY_DISTRICT[String(district)] : undefined;

    const contacts = lead._embedded?.contacts ?? [];
    const contactId = (contacts.find((contact) => contact.is_main) ?? contacts[0])?.id;
    let name: string | undefined;
    let messenger: Messenger | undefined;
    if (contactId) {
      messenger = await findMessenger(contactId, leadId, signal).catch((error) => {
        console.error(`Offer prefill: amoCRM talks for lead ${leadId} failed:`, error);
        return undefined;
      });
      const contactRes = await amoFetch(`contacts/${contactId}`, signal).catch(() => null);
      const contact: { name?: string } | null = contactRes ? await contactRes.json().catch(() => null) : null;
      name = cleanContactName(contact?.name);
    }

    return {
      leadId,
      leadUrl,
      start: toLocalInput(fieldValue(fields, FIELD.startDate)),
      end: toLocalInput(fieldValue(fields, FIELD.endDate)),
      name,
      messenger,
      pickupZoneId: pickupZoneId && ZONES.some((zone) => zone.id === pickupZoneId) ? pickupZoneId : undefined,
    };
  } catch (error) {
    console.error(`Offer prefill: amoCRM lead ${leadId} failed:`, error);
    // Даже без данных сделка привяжется к подборке.
    return { leadId, leadUrl };
  }
}
