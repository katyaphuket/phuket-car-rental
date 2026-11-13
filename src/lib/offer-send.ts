import { amoFetch, isAmoConfigured } from "@/lib/amocrm";
import { findLeadFieldIdByCode } from "@/lib/amo-offer-link";
import type { Messenger } from "@/lib/offer";

// Автоотправка подборки клиенту в чат amoCRM.
// Сайт кладёт текст сообщения в поле сделки «Сообщение подборки» и запускает Salesbot,
// у которого один шаг: «Отправить сообщение» с текстом {{lead.cf.<ID поля>}}.
// Бот с «Каналы связи: Все» пишет во ВСЕ мессенджеры клиента, поэтому на каждый мессенджер
// свой бот с одним каналом. Сайт находит их по названию.

export const OFFER_MESSAGE_FIELD_CODE = "KC_OFFER_MESSAGE";
export const OFFER_MESSAGE_FIELD_NAME = "Сообщение подборки";
const MAX_MESSAGE_LENGTH = 3000;
const AMO_TIMEOUT_MS = 15000;
const BOTS_TTL_MS = 10 * 60 * 1000;

export const BOT_NAME_BY_MESSENGER: Record<Messenger, string> = {
  whatsapp: "Подборка WhatsApp",
  telegram: "Подборка Telegram",
  instagram: "Подборка Instagram",
  max: "Подборка MAX",
};

let cachedBots: { ids: Partial<Record<Messenger, number>>; expiresAt: number } | null = null;

function normalize(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

// Боты-отправщики по мессенджерам: { telegram: 3201, whatsapp: 3202, … }
export async function findOfferBots(): Promise<Partial<Record<Messenger, number>>> {
  if (!isAmoConfigured()) return {};
  if (cachedBots && cachedBots.expiresAt > Date.now()) return cachedBots.ids;
  try {
    const res = await amoFetch("bots?limit=250", AbortSignal.timeout(AMO_TIMEOUT_MS));
    const body: { _embedded?: { items?: { id: number; name: string; settings?: { active?: boolean } }[] } } =
      res.status === 204 ? {} : await res.json();
    const bots = (body._embedded?.items ?? []).filter((bot) => bot.settings?.active !== false);
    const ids: Partial<Record<Messenger, number>> = {};
    for (const [messenger, name] of Object.entries(BOT_NAME_BY_MESSENGER) as [Messenger, string][]) {
      const bot = bots.find((item) => normalize(item.name) === normalize(name));
      if (bot) ids[messenger] = bot.id;
    }
    // Пока ботов нет, не запоминаем надолго — их как раз могут создавать.
    cachedBots = { ids, expiresAt: Date.now() + (Object.keys(ids).length > 0 ? BOTS_TTL_MS : 30000) };
    return ids;
  } catch (error) {
    console.error("Offer send: amoCRM bots list failed:", error);
    return cachedBots?.ids ?? {};
  }
}

export function validateOfferMessage(text: unknown) {
  if (typeof text !== "string") return "Пустое сообщение";
  const trimmed = text.trim();
  if (!trimmed) return "Пустое сообщение";
  if (trimmed.length > MAX_MESSAGE_LENGTH) return "Слишком длинное сообщение";
  if (!/\/o\/[\w-]+\.[\w-]+/.test(trimmed)) return "В сообщении нет ссылки на подборку";
  return null;
}

export async function sendOfferToChat(leadId: number, text: string, botId: number) {
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
