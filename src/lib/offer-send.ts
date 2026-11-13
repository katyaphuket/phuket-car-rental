import { amoFetch, isAmoConfigured } from "@/lib/amocrm";
import { findLeadFieldIdByCode } from "@/lib/amo-offer-link";

// Автоотправка подборки клиенту в чат amoCRM (WhatsApp / Telegram через Wazzup, Instagram).
// Сайт кладёт текст сообщения в поле сделки «Сообщение подборки» и запускает Salesbot,
// у которого один шаг: «Отправить сообщение» с текстом {{lead.cf.<ID поля>}}.
// Бот пишет в последний чат клиента — туда, где он уже переписывается.

export const OFFER_MESSAGE_FIELD_CODE = "KC_OFFER_MESSAGE";
export const OFFER_MESSAGE_FIELD_NAME = "Сообщение подборки";
const MAX_MESSAGE_LENGTH = 3000;
const AMO_TIMEOUT_MS = 15000;

// ID бота Salesbot «Отправка подборки» (виден в адресе страницы бота в amoCRM).
function salesbotId() {
  return Number(process.env.OFFER_SALESBOT_ID || OFFER_SALESBOT_ID) || null;
}
const OFFER_SALESBOT_ID = "3178"; // бот «Отправка подборки» в amoCRM

export function isOfferSendConfigured() {
  return isAmoConfigured() && salesbotId() !== null;
}

export function validateOfferMessage(text: unknown) {
  if (typeof text !== "string") return "Пустое сообщение";
  const trimmed = text.trim();
  if (!trimmed) return "Пустое сообщение";
  if (trimmed.length > MAX_MESSAGE_LENGTH) return "Слишком длинное сообщение";
  if (!/\/o\/[\w-]+\.[\w-]+/.test(trimmed)) return "В сообщении нет ссылки на подборку";
  return null;
}

export async function sendOfferToChat(leadId: number, text: string) {
  const botId = salesbotId();
  if (!botId) throw new Error("Salesbot is not configured");
  const signal = AbortSignal.timeout(AMO_TIMEOUT_MS);

  const fieldId = await findLeadFieldIdByCode(OFFER_MESSAGE_FIELD_CODE, signal, OFFER_MESSAGE_FIELD_NAME);
  if (!fieldId) throw new Error(`amoCRM field ${OFFER_MESSAGE_FIELD_CODE} not found`);

  await amoFetch(`leads/${leadId}`, signal, {
    method: "PATCH",
    body: JSON.stringify({ custom_fields_values: [{ field_id: fieldId, values: [{ value: text.trim() }] }] }),
  });

  // Salesbot запускается через API v2.
  const baseUrl = process.env.AMOCRM_BASE_URL?.replace(/\/+$/, "");
  const res = await fetch(`${baseUrl}/api/v2/salesbot/run`, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${process.env.AMOCRM_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([{ bot_id: botId, entity_id: leadId, entity_type: 2 }]),
  });
  if (!res.ok) {
    const details = await res.text().catch(() => "");
    throw new Error(`amoCRM salesbot/run failed: ${res.status} ${details.slice(0, 300)}`);
  }
}
