import { describe, expect, it } from "vitest";
import { nextStatus } from "./offer-amo";

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
