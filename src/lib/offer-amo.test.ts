import { describe, expect, it } from "vitest";
import { chosenCarFields, nextStatus } from "./offer-amo";
import type { Offer } from "./offer";

const SALES = 2538268;
const REPEAT = 8187810;

describe("этапы воронки из подборки", () => {
  it("«Взят в работу» → «Отправлено предложение», когда менеджер создал подборку", () => {
    expect(nextStatus(SALES, 7669276, "sent")).toBe(7669278);
  });

  it("клиент выбрал машину → «Запросили документы и предоплату»", () => {
    expect(nextStatus(SALES, 7669278, "chosen")).toBe(70178218);
    expect(nextStatus(REPEAT, 66912278, "chosen")).toBe(70107326);
  });

  it("назад не двигает: «Забронировано» остаётся", () => {
    expect(nextStatus(SALES, 7669282, "chosen")).toBeNull();
    expect(nextStatus(SALES, 70178218, "sent")).toBeNull();
  });

  it("«Неразобранное», закрытые сделки и чужие воронки не трогает", () => {
    expect(nextStatus(SALES, 26442328, "sent")).toBeNull();
    expect(nextStatus(SALES, 142, "chosen")).toBeNull();
    expect(nextStatus(SALES, 143, "chosen")).toBeNull();
    expect(nextStatus(999, 1, "sent")).toBeNull();
  });
});

describe("поля сделки, когда клиент выбрал машину", () => {
  const offer: Offer = {
    start: "10-12-2026 10:00",
    end: "17-12-2026 10:00",
    days: 7,
    locale: "ru",
    name: "",
    pickup: { id: "airport", fee: 1000 },
    messenger: "telegram",
    createdAt: 0,
    cars: [{ id: 1, pricePerDay: 950, deposit: 6000 }],
  };

  it("даты по Пхукету, дни, цена за сутки, депозит и доставка", () => {
    const fields = Object.fromEntries(chosenCarFields(offer, offer.cars[0]).map((f) => [f.field_id, f.values[0].value]));
    expect(fields[1734217]).toBe(Date.UTC(2026, 11, 10, 3, 0) / 1000); // 10:00 на Пхукете = 03:00 UTC
    expect(fields[1734219]).toBe(Date.UTC(2026, 11, 17, 3, 0) / 1000);
    expect(fields[1734225]).toBe(7);
    expect(fields[1734227]).toBe(950);
    expect(fields[1734255]).toBe(6000);
    expect(fields[1734229]).toBe(1000);
    expect(fields[1734253]).toBeUndefined(); // возврат не указан — поле не трогаем
  });
});
