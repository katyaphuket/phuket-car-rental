import { after, NextRequest, NextResponse } from "next/server";
import { amoFetch, isAmoConfigured } from "@/lib/amocrm";
import { getDisplayName } from "@/lib/car-features";
import { decodeOffer, formatRange } from "@/lib/offer";

// Клиент нажал «Хочу эту» в подборке. Если менеджер указал сделку — пишем примечание в amoCRM.
export async function POST(request: NextRequest) {
  const { token, carId } = (await request.json().catch(() => ({}))) as { token?: string; carId?: number };
  const offer = token ? decodeOffer(token) : null;
  const car = offer?.cars.find((item) => item.id === Number(carId));

  if (!offer || !car) {
    return NextResponse.json({ error: "bad offer" }, { status: 400 });
  }
  if (!offer.leadId || !isAmoConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const text = [
    "КЛИЕНТ ВЫБРАЛ МАШИНУ В ПОДБОРКЕ",
    "",
    `Машина: ${getDisplayName(car.id, car.name ?? "")} (ID ${car.id} в RentProg)`,
    `Даты: ${formatRange(offer.start, offer.end, "ru")} (${offer.start} → ${offer.end}), ${offer.days} дн.`,
    `Цена в подборке: ${car.pricePerDay.toLocaleString("ru-RU")} ฿/день, итого ${(car.pricePerDay * offer.days).toLocaleString("ru-RU")} ฿`,
    ...(car.listPrice
      ? [`Цену поставил менеджер вручную (в RentProg было ${car.listPrice.toLocaleString("ru-RU")} ฿/день)`]
      : []),
  ].join("\n");

  const leadId = offer.leadId;
  after(() =>
    amoFetch(`leads/${leadId}/notes`, AbortSignal.timeout(15000), {
      method: "POST",
      body: JSON.stringify([{ note_type: "common", params: { text } }]),
    }).catch((error) => console.error("Offer choose: amoCRM note failed:", error))
  );

  return NextResponse.json({ ok: true });
}
