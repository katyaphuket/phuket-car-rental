import { after, NextRequest, NextResponse } from "next/server";
import { decodeOffer } from "@/lib/offer";
import { onCarChosen } from "@/lib/offer-amo";

// Клиент нажал «Хочу эту машину»: примечание и этап в amoCRM, сообщение менеджерам в Telegram.
export async function POST(request: NextRequest) {
  const { token, carId } = (await request.json().catch(() => ({}))) as { token?: string; carId?: number };
  const offer = token ? decodeOffer(token) : null;
  const car = offer?.cars.find((item) => item.id === Number(carId));

  if (!offer || !car) {
    return NextResponse.json({ error: "bad offer" }, { status: 400 });
  }

  after(() => onCarChosen(offer, car));
  return NextResponse.json({ ok: true });
}
