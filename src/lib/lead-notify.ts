import { amoFetch, FIELD } from "@/lib/amocrm";
import { money } from "@/lib/booking";

const AMO_TIMEOUT_MS = 20000;
const TELEGRAM_TIMEOUT_MS = 10000;
const NOTIFY_TAG = "Сайт";

type AmoFieldValue = {
  field_id?: number;
  field_code?: string | null;
  values?: { value?: string | number }[];
};

type AmoLead = {
  id: number;
  name: string;
  price?: number;
  custom_fields_values?: AmoFieldValue[] | null;
  _embedded?: {
    tags?: { name: string }[];
    contacts?: { id: number; is_main?: boolean }[];
  };
};

export function isLeadNotifyConfigured() {
  return Boolean(process.env.AMO_NOTIFY_TELEGRAM_TOKEN && process.env.AMO_NOTIFY_TELEGRAM_CHAT_ID);
}

// amoCRM posts a form with keys like leads[add][0][id].
export function newLeadIds(form: FormData) {
  return [...form.entries()]
    .filter(([key]) => /^leads\[add\]\[\d+\]\[id\]$/.test(key))
    .map(([, value]) => String(value));
}

function fieldValue(fields: AmoFieldValue[] | null | undefined, fieldId: number) {
  return fields?.find((field) => field.field_id === fieldId)?.values?.[0]?.value;
}

function formatDate(timestamp: string | number | undefined) {
  if (timestamp === undefined) return undefined;
  return new Date(Number(timestamp) * 1000).toLocaleString("ru-RU", {
    timeZone: "Asia/Bangkok",
    dateStyle: "short",
    timeStyle: "short",
  });
}

async function findPhone(lead: AmoLead, signal: AbortSignal) {
  const contacts = lead._embedded?.contacts ?? [];
  const contact = contacts.find((item) => item.is_main) ?? contacts[0];
  if (!contact) return undefined;

  const res = await amoFetch(`contacts/${contact.id}`, signal);
  const body: { custom_fields_values?: AmoFieldValue[] | null } = await res.json();
  return body.custom_fields_values?.find((field) => field.field_code === "PHONE")?.values?.[0]?.value;
}

function buildMessage(lead: AmoLead, phone: string | number | undefined) {
  const baseUrl = process.env.AMOCRM_BASE_URL?.replace(/\/+$/, "");
  const start = formatDate(fieldValue(lead.custom_fields_values, FIELD.startDate));
  const end = formatDate(fieldValue(lead.custom_fields_values, FIELD.endDate));

  return [
    "🚗 Новая заявка с сайта",
    "",
    lead.name,
    phone ? `Телефон: ${phone}` : null,
    start ? `Получение: ${start}` : null,
    end ? `Возврат: ${end}` : null,
    lead.price ? `Сумма: ${money(lead.price)}` : null,
    "",
    `${baseUrl}/leads/detail/${lead.id}`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

async function sendToTelegram(text: string) {
  const res = await fetch(
    `https://api.telegram.org/bot${process.env.AMO_NOTIFY_TELEGRAM_TOKEN}/sendMessage`,
    {
      method: "POST",
      signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.AMO_NOTIFY_TELEGRAM_CHAT_ID,
        text,
        link_preview_options: { is_disabled: true },
      }),
    }
  );

  if (!res.ok) {
    const details = await res.text().catch(() => "");
    throw new Error(`Telegram sendMessage failed: ${res.status} ${details.slice(0, 300)}`);
  }
}

export async function notifyNewLead(leadId: string) {
  const signal = AbortSignal.timeout(AMO_TIMEOUT_MS);
  const res = await amoFetch(`leads/${leadId}?with=contacts`, signal);
  const lead: AmoLead = await res.json();

  if (!lead._embedded?.tags?.some((tag) => tag.name === NOTIFY_TAG)) return;

  // A missing phone is no reason to stay silent: the link still leads to the client.
  const phone = await findPhone(lead, signal).catch((error) => {
    console.error("amoCRM contact for notification failed:", error);
    return undefined;
  });
  await sendToTelegram(buildMessage(lead, phone));
}
