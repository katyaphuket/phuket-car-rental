import { amoFetch, FIELD } from "@/lib/amocrm";
import { money } from "@/lib/booking";

const AMO_TIMEOUT_MS = 45000;
const TELEGRAM_TIMEOUT_MS = 10000;
const NOTIFY_TAG = "Сайт";

// The old site (katacars.info) emails its leads, and amoCRM turns them into "Неразобранное".
const UNSORTED_STATUS_ID = 26442328;
const OLD_SITE_MAIL_FROM = "help@katacars.info";
const MAIL_LOOKUP_ATTEMPTS = 4;
const MAIL_LOOKUP_DELAY_MS = 5000;
const OLD_SITE_LABELS: Record<string, string> = {
  "Имя": "Имя",
  "Телефон": "Телефон",
  "Дата начала": "Получение",
  "Дата возврата": "Возврат",
  "Выбранная машина": "Машина",
};
const OLD_SITE_SUMMARY_SPLIT =
  /(Имя|Телефон|Дата начала|Дата возврата|Выбранная машина|Страница откуда заявки поступила):/;

type AmoFieldValue = {
  field_id?: number;
  field_code?: string | null;
  values?: { value?: string | number }[];
};

type AmoLead = {
  id: number;
  name: string;
  status_id?: number;
  price?: number;
  custom_fields_values?: AmoFieldValue[] | null;
  _embedded?: {
    tags?: { name: string }[];
    contacts?: { id: number; is_main?: boolean }[];
  };
};

type AmoUnsortedMail = {
  metadata?: { from?: { email?: string }; content_summary?: string };
  _embedded?: { leads?: { id: number }[] };
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
    leadUrl(lead.id),
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function leadUrl(leadId: number) {
  return `${process.env.AMOCRM_BASE_URL?.replace(/\/+$/, "")}/leads/detail/${leadId}`;
}

// amoCRM may add the lead a moment before its "Неразобранное" entry can be read.
async function findMail(leadId: number, signal: AbortSignal) {
  for (let attempt = 0; attempt < MAIL_LOOKUP_ATTEMPTS; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, MAIL_LOOKUP_DELAY_MS));

    const res = await amoFetch("leads/unsorted?filter[category][]=mail&limit=50", signal);
    if (res.status === 204) continue;

    const body: { _embedded?: { unsorted?: AmoUnsortedMail[] } } = await res.json();
    const mail = body._embedded?.unsorted?.find((item) =>
      item._embedded?.leads?.some((lead) => lead.id === leadId)
    );
    if (mail) return mail;
  }
  return undefined;
}

function buildOldSiteMessage(leadId: number, summary: string) {
  const parts = summary.split(OLD_SITE_SUMMARY_SPLIT);
  const lines: string[] = [];
  for (let i = 1; i < parts.length - 1; i += 2) {
    const label = OLD_SITE_LABELS[parts[i]];
    const value = parts[i + 1].trim();
    if (label && value) lines.push(`${label}: ${value}`);
  }

  return [
    "🚗 Новая заявка с katacars.info",
    "",
    ...(lines.length > 0 ? lines : [summary.trim()]),
    "",
    leadUrl(leadId),
  ].join("\n");
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

  if (lead.status_id === UNSORTED_STATUS_ID) {
    const mail = await findMail(lead.id, signal);
    if (mail?.metadata?.from?.email === OLD_SITE_MAIL_FROM) {
      await sendToTelegram(buildOldSiteMessage(lead.id, mail.metadata.content_summary ?? ""));
    }
    return;
  }

  if (!lead._embedded?.tags?.some((tag) => tag.name === NOTIFY_TAG)) return;

  // A missing phone is no reason to stay silent: the link still leads to the client.
  const phone = await findPhone(lead, signal).catch((error) => {
    console.error("amoCRM contact for notification failed:", error);
    return undefined;
  });
  await sendToTelegram(buildMessage(lead, phone));
}
