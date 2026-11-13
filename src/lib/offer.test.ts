import { beforeAll, describe, expect, it } from "vitest";
import { decodeOffer, encodeOffer, formatRange, isOfferExpired, offerRent, type Offer } from "./offer";

beforeAll(() => {
  process.env.OFFER_SECRET = "test-secret";
});

const offer: Offer = {
  start: "10-12-2026 9:30",
  end: "17-12-2026 10:00",
  days: 7,
  locale: "ru",
  name: "Анна | Иванова",
  pickup: { id: "airport", fee: 1000 },
  dropoff: { id: "kata", fee: 0 },
  messenger: "telegram",
  leadId: 1234567,
  createdAt: 1794543920,
  cars: [
    { id: 70264, pricePerDay: 950, deposit: 6000 },
    { id: 99999, pricePerDay: 1200, deposit: 10000, name: "New car: red, #12" },
    { id: 43529, pricePerDay: 1000, deposit: 10000, listPrice: 1200 },
    { id: 43530, pricePerDay: 1100, deposit: 10000, listPrice: 1300, name: "Other" },
  ],
};

describe("подборка в ссылке", () => {
  it("ссылка открывается с теми же данными", () => {
    const decoded = decodeOffer(encodeOffer(offer));
    expect(decoded).toEqual({
      ...offer,
      name: "Анна Иванова",
      cars: [
        { ...offer.cars[0], listPrice: undefined, name: undefined },
        { ...offer.cars[1], listPrice: undefined, name: "New car red #12" },
        { ...offer.cars[2], name: undefined },
        offer.cars[3],
      ],
    });
  });

  it("исправленная клиентом ссылка не открывается", () => {
    const token = encodeOffer(offer);
    const [body, signature] = token.split(".");
    const forged = Buffer.from(Buffer.from(body, "base64url").toString().replace("950", "100")).toString("base64url");
    expect(decodeOffer(`${forged}.${signature}`)).toBeNull();
    expect(decodeOffer(token.slice(0, -3))).toBeNull();
  });

  it("подборка устаревает через 3 дня", () => {
    const created = offer.createdAt * 1000;
    expect(isOfferExpired(offer, created + 2 * 86400000)).toBe(false);
    expect(isOfferExpired(offer, created + 4 * 86400000)).toBe(true);
  });

  it("даты пишутся по-человечески", () => {
    expect(formatRange(offer.start, offer.end, "ru")).toBe("10–17 декабря");
    expect(formatRange("28-12-2026 10:00", "05-01-2027 10:00", "en")).toBe("28 Dec – 5 Jan");
  });
});

describe("почасовая доплата в подборке", () => {
  const withHours: Offer = {
    ...offer,
    end: "17-12-2026 13:00",
    extraHours: 3,
    cars: [
      { id: 70264, pricePerDay: 950, deposit: 6000, pricePerHour: 400 },
      { id: 43529, pricePerDay: 1000, deposit: 10000, pricePerHour: 300, listPrice: 1200, name: "Other" },
    ],
  };

  it("часы и цена часа сохраняются в ссылке", () => {
    const decoded = decodeOffer(encodeOffer(withHours));
    expect(decoded?.extraHours).toBe(3);
    expect(decoded?.cars).toEqual(withHours.cars);
  });

  it("аренда = сутки + часы, а если часы дороже суток — ещё сутки", () => {
    expect(offerRent(withHours, withHours.cars[0])).toBe(950 * 8); // 3 × 400 = 1 200 > 950
    expect(offerRent(withHours, withHours.cars[1], 1200)).toBe(1200 * 7 + 3 * 300);
  });

  it("часы дороже суток — берём сутки", () => {
    const cheap = { id: 1, pricePerDay: 900, deposit: 0, pricePerHour: 400 };
    expect(offerRent({ days: 7, extraHours: 3 }, cheap)).toBe(900 * 8);
  });

  it("подборка без часов — старый формат, без доплаты", () => {
    const decoded = decodeOffer(encodeOffer({ ...offer, cars: [offer.cars[0]] }));
    expect(decoded?.extraHours).toBeUndefined();
    expect(offerRent(decoded!, decoded!.cars[0])).toBe(950 * 7);
  });
});
