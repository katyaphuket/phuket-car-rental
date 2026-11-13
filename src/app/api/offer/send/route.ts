import { NextRequest, NextResponse } from "next/server";
import { isManagerCookieValid, MANAGER_COOKIE, MESSENGERS, type Messenger } from "@/lib/offer";
import { BOT_NAME_BY_MESSENGER, findOfferBots, sendOfferToChat, validateOfferMessage } from "@/lib/offer-send";

// Менеджер нажал «Отправить клиенту»: сообщение уходит в чат сделки через бота этого мессенджера.
export async function POST(request: NextRequest) {
  if (!isManagerCookieValid(request.cookies.get(MANAGER_COOKIE)?.value)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { leadId, text, messenger } = (await request.json().catch(() => ({}))) as {
    leadId?: number;
    text?: string;
    messenger?: string;
  };
  const id = Number(leadId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Нет сделки" }, { status: 400 });
  }
  if (!MESSENGERS.includes(messenger as Messenger)) {
    return NextResponse.json({ error: "Не выбран мессенджер" }, { status: 400 });
  }
  const problem = validateOfferMessage(text);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const botId = (await findOfferBots())[messenger as Messenger];
  if (!botId) {
    return NextResponse.json(
      { error: `В amoCRM нет бота «${BOT_NAME_BY_MESSENGER[messenger as Messenger]}». Скопируйте сообщение и отправьте вручную.` },
      { status: 503 }
    );
  }

  try {
    await sendOfferToChat(id, text!, botId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`Offer send to lead ${id} failed:`, error);
    return NextResponse.json({ error: "amoCRM не принял сообщение. Скопируйте его и отправьте вручную." }, { status: 502 });
  }
}
