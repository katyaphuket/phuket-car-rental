import { NextRequest, NextResponse } from "next/server";
import { isManagerCookieValid, MANAGER_COOKIE } from "@/lib/offer";
import { isOfferSendConfigured, sendOfferToChat, validateOfferMessage } from "@/lib/offer-send";

// Менеджер нажал «Отправить клиенту»: сообщение уходит в чат сделки через Salesbot.
export async function POST(request: NextRequest) {
  if (!isManagerCookieValid(request.cookies.get(MANAGER_COOKIE)?.value)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isOfferSendConfigured()) {
    return NextResponse.json({ error: "Автоотправка не настроена" }, { status: 503 });
  }

  const { leadId, text } = (await request.json().catch(() => ({}))) as { leadId?: number; text?: string };
  const id = Number(leadId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Нет сделки" }, { status: 400 });
  }
  const problem = validateOfferMessage(text);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  try {
    await sendOfferToChat(id, text!);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`Offer send to lead ${id} failed:`, error);
    return NextResponse.json({ error: "amoCRM не принял сообщение. Скопируйте его и отправьте вручную." }, { status: 502 });
  }
}
