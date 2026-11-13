import { after, NextRequest, NextResponse } from "next/server";
import { decodeOffer } from "@/lib/offer";
import { onOfferViewed } from "@/lib/offer-amo";

// Клиент открыл подборку. Присылает браузер клиента (не превью мессенджеров) один раз на ссылку.
export async function POST(request: NextRequest) {
  const { token } = (await request.json().catch(() => ({}))) as { token?: string };
  const offer = token ? decodeOffer(token) : null;
  if (!offer) return NextResponse.json({ error: "bad offer" }, { status: 400 });

  after(() => onOfferViewed(offer).catch((error) => console.error("Offer view: amoCRM note failed:", error)));
  return NextResponse.json({ ok: true });
}
