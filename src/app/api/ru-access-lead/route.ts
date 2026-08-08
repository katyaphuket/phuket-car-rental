import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

type RuAccessLeadPayload = {
  name: string;
  contact: string;
  contactMethods: string[];
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmailHtml(data: RuAccessLeadPayload) {
  const methods = data.contactMethods.length > 0 ? data.contactMethods.join(", ") : "Не указано";
  return `
    <div style="font-family: Arial, sans-serif; color: #16302c; max-width: 560px;">
      <h2 style="margin-bottom: 4px;">🇷🇺 ЗАЯВКА ОТ ПОЛЬЗОВАТЕЛЯ БЕЗ ДОСТУПА К САЙТУ</h2>
      <p style="margin: 2px 0;">Имя: <strong>${escapeHtml(data.name)}</strong></p>
      <p style="margin: 2px 0;">Телефон/Telegram: ${escapeHtml(data.contact)}</p>
      <p style="margin: 2px 0;">Удобный способ связи: ${escapeHtml(methods)}</p>
    </div>
  `;
}

export async function POST(request: NextRequest) {
  const data = (await request.json()) as RuAccessLeadPayload;

  if (!data.name?.trim() || !data.contact?.trim()) {
    return NextResponse.json({ error: "name and contact are required" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const contactEmail = process.env.CONTACT_EMAIL;

  if (!apiKey || !contactEmail) {
    console.error("RU access lead email not sent: RESEND_API_KEY or CONTACT_EMAIL is not configured");
    return NextResponse.json({ error: "Email is not configured" }, { status: 500 });
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: "Phuket Car Rental <onboarding@resend.dev>",
      to: contactEmail,
      subject: `Заявка (нет доступа к сайту) — ${data.name}`,
      html: buildEmailHtml(data),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Resend RU access lead email failed:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
  }
}
