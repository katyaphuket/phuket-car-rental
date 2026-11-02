import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAmoLead, isAmoConfigured } from "@/lib/amocrm";
import { type BookingPayload, mileageLabel, money, yesNo } from "@/lib/booking";

function buildEmailHtml(data: BookingPayload) {
  return `
    <div style="font-family: Arial, sans-serif; color: #16302c; max-width: 560px;">
      <h2 style="margin-bottom: 4px;">🚗 НОВАЯ ЗАЯВКА НА АРЕНДУ</h2>

      <h3 style="border-top: 1px solid #e4e0d6; padding-top: 12px; margin-bottom: 6px;">АВТОМОБИЛЬ</h3>
      <p style="margin: 2px 0;">Машина: <strong>${data.carName}</strong></p>
      <p style="margin: 2px 0;">Класс: ${data.carClass}</p>
      <p style="margin: 2px 0;">Трансмиссия: ${data.transmission}</p>

      <h3 style="border-top: 1px solid #e4e0d6; padding-top: 12px; margin-bottom: 6px;">ДЕТАЛИ АРЕНДЫ</h3>
      <p style="margin: 2px 0;">Получение: ${data.pickupZoneName} · ${data.pickupDateTime}</p>
      <p style="margin: 2px 0;">Возврат: ${data.returnZoneName} · ${data.returnDateTime}</p>
      <p style="margin: 2px 0;">Срок: ${data.days} дней</p>

      <h3 style="border-top: 1px solid #e4e0d6; padding-top: 12px; margin-bottom: 6px;">КЛИЕНТ</h3>
      <p style="margin: 2px 0;">Имя: ${data.name}</p>
      <p style="margin: 2px 0;">Телефон: ${data.phone}</p>
      <p style="margin: 2px 0;">Мессенджер: ${data.messenger}</p>
      <p style="margin: 2px 0;">Комментарий: ${data.comment || "Нет"}</p>

      <h3 style="border-top: 1px solid #e4e0d6; padding-top: 12px; margin-bottom: 6px;">ВЫБРАННЫЕ ОПЦИИ</h3>
      <p style="margin: 2px 0;">Детское автокресло: ${yesNo(data.childSeat)}</p>
      <p style="margin: 2px 0;">Бустер: ${yesNo(data.booster)}</p>
      <p style="margin: 2px 0;">Держатель для телефона: ${yesNo(data.phoneHolder)}</p>
      <p style="margin: 2px 0;">Мойка при возврате: ${data.washFee > 0 ? "Да (+400฿)" : "Нет"}</p>
      <p style="margin: 2px 0;">Пробег: ${mileageLabel(data.days)}</p>

      <h3 style="border-top: 1px solid #e4e0d6; padding-top: 12px; margin-bottom: 6px;">СТОИМОСТЬ</h3>
      <p style="margin: 2px 0;">Аренда: ${money(data.rent)}</p>
      <p style="margin: 2px 0;">Доставка при получении: ${money(data.pickupFee)}</p>
      <p style="margin: 2px 0;">Возврат: ${money(data.returnFee)}</p>
      <p style="margin: 2px 0;">Мойка при возврате: ${data.washFee > 0 ? money(data.washFee) : "Не выбрана"}</p>
      <p style="margin: 8px 0 2px; font-weight: bold; font-size: 16px;">ИТОГО: ${money(data.total)}</p>
      <p style="margin: 2px 0;">Депозит (возвращается): ${money(data.deposit)}</p>
    </div>
  `;
}

async function sendBookingEmail(data: BookingPayload, crmFailed: boolean) {
  const apiKey = process.env.RESEND_API_KEY;
  const contactEmail = process.env.CONTACT_EMAIL;

  if (!apiKey || !contactEmail) {
    console.error("Booking email not sent: RESEND_API_KEY or CONTACT_EMAIL is not configured");
    return false;
  }

  try {
    const resend = new Resend(apiKey);
    // Resend reports API errors in the result instead of throwing.
    const { error } = await resend.emails.send({
      from: "Phuket Car Rental <onboarding@resend.dev>",
      to: contactEmail,
      subject: `${crmFailed ? "[НЕ ПОПАЛА В AMOCRM] " : ""}Новая заявка — ${data.name} — ${data.carName} — ${data.pickupDateTime}`,
      html: buildEmailHtml(data),
    });

    if (error) {
      console.error("Resend booking email failed:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Resend booking email failed:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const data = (await request.json()) as BookingPayload;

  if (!data.name?.trim() || !data.phone?.trim()) {
    return NextResponse.json({ error: "name and phone are required" }, { status: 400 });
  }

  let savedToCrm = false;
  let crmFailed = false;
  if (isAmoConfigured()) {
    try {
      await createAmoLead(data);
      savedToCrm = true;
    } catch (error) {
      console.error("amoCRM booking failed:", error);
      crmFailed = true;
    }
  }

  const emailSent = await sendBookingEmail(data, crmFailed);

  // The client only needs one copy of the lead to have reached the company.
  if (savedToCrm || emailSent) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Failed to save booking" }, { status: 502 });
}
