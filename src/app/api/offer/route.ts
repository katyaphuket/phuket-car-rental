import { after, NextRequest, NextResponse } from "next/server";
import { onOfferCreated } from "@/lib/offer-amo";
import { fetchCarData } from "@/lib/rentprog";
import { rentProgPeriod } from "@/lib/rental-days";
import { ZONES } from "@/lib/delivery-rules";
import { CAR_FEATURES } from "@/lib/car-features";
import {
  cleanName,
  encodeOffer,
  isManagerCookieValid,
  MANAGER_COOKIE,
  MESSENGERS,
  type Messenger,
  type Offer,
  type OfferZone,
  offerBaseUrl,
  parseRentProgDate,
} from "@/lib/offer";

type CreateOfferBody = {
  start?: string;
  end?: string;
  days?: number;
  name?: string;
  locale?: string;
  pickupZoneId?: string;
  returnZoneId?: string;
  messenger?: string;
  lead?: string;
  carIds?: (string | number)[];
  // своя цена за день, которую поставил менеджер: { "70264": 900 }
  prices?: Record<string, number | string>;
};

const MAX_PRICE_PER_DAY = 1_000_000;

function customPrice(value: number | string | undefined) {
  const price = Math.round(Number(value));
  return price > 0 && price <= MAX_PRICE_PER_DAY ? price : undefined;
}

function zone(id: string | undefined): OfferZone | undefined {
  const found = id ? ZONES.find((item) => item.id === id) : undefined;
  return found ? { id: found.id, fee: found.price } : undefined;
}

export async function POST(request: NextRequest) {
  if (!isManagerCookieValid(request.cookies.get(MANAGER_COOKIE)?.value)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as CreateOfferBody;
  const days = Number(body.days);
  const carIds = [...new Set((body.carIds ?? []).map(Number).filter(Number.isInteger))];

  if (!body.start || !body.end || !parseRentProgDate(body.start) || !parseRentProgDate(body.end) || !(days > 0)) {
    return NextResponse.json({ error: "Укажите даты" }, { status: 400 });
  }
  if (carIds.length === 0) {
    return NextResponse.json({ error: "Отметьте хотя бы одну машину" }, { status: 400 });
  }

  // Часы сверх полных суток (до 4) — почасовая доплата, как в RentProg.
  const period = rentProgPeriod(body.start, body.end);
  const extraHours = period && period.days === days ? period.extraHours : 0;

  // Цены берём из RentProg заново, а не из браузера менеджера; своя цена менеджера — поверх.
  const cars = [];
  for (const id of carIds) {
    try {
      const data = await fetchCarData(id, body.start, body.end, days);
      const manual = customPrice(body.prices?.[String(id)]);
      const changed = manual !== undefined && manual !== data.selected_price;
      cars.push({
        id,
        pricePerDay: changed ? manual : data.selected_price,
        deposit: data.deposit,
        listPrice: changed ? data.selected_price : undefined,
        pricePerHour: extraHours > 0 ? Number(data.price_hour) || 0 : undefined,
        name: CAR_FEATURES[id] ? undefined : data.car_name,
      });
    } catch (error) {
      console.error(`Offer: RentProg car_data failed for car ${id}:`, error);
    }
  }
  if (cars.length === 0) {
    return NextResponse.json({ error: "RentProg не ответил, попробуйте ещё раз" }, { status: 502 });
  }

  const messenger = MESSENGERS.includes(body.messenger as Messenger) ? (body.messenger as Messenger) : "whatsapp";
  const leadId = Number(body.lead?.match(/(\d{4,})\D*$/)?.[1]) || undefined;

  const offer: Offer = {
    start: body.start,
    end: body.end,
    days,
    locale: body.locale === "en" ? "en" : "ru",
    name: cleanName(body.name),
    pickup: zone(body.pickupZoneId),
    dropoff: zone(body.returnZoneId),
    messenger,
    leadId,
    createdAt: Math.floor(Date.now() / 1000),
    extraHours: extraHours > 0 ? extraHours : undefined,
    cars,
  };
  const url = `${offerBaseUrl(request.nextUrl.origin)}/o/${encodeOffer(offer)}`;

  // Подборка из сделки: примечание со ссылкой и этап «Отправлено предложение».
  after(() => onOfferCreated(offer, url).catch((error) => console.error("Offer created: amoCRM update failed:", error)));

  return NextResponse.json({
    url,
    missing: carIds.length - cars.length,
  });
}
