import { beforeAll, describe, expect, it } from "vitest";
import { decodeOffer, encodeOffer, formatRange, isOfferExpired, type Offer } from "./offer";

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
