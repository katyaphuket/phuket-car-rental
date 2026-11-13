import { describe, expect, it } from "vitest";
import { rentalCharge, rentalDays, rentalPeriod, rentProgPeriod } from "./rental-days";

const at = (day: number, hour: number) => Date.UTC(2026, 10, day, hour);

describe("сутки аренды как в RentProg", () => {
  it("14.11 10:00 → 28.11 10:00 = 14 суток", () => {
    expect(rentalDays(at(14, 10), at(28, 10))).toBe(14);
  });

  it("возврат в 18:00 (на 8 часов позже) = 15 суток", () => {
    expect(rentalDays(at(14, 10), at(28, 18))).toBe(15);
  });

  it("до 4 часов опоздания сутки не добавляются, больше 4 — добавляются", () => {
    expect(rentalDays(at(14, 10), at(28, 14))).toBe(14);
    expect(rentalDays(at(14, 10), Date.UTC(2026, 10, 28, 14, 30))).toBe(15);
  });

  it("возврат в 08:00 — 13 суток и 22 часа, это 14 суток", () => {
    expect(rentalDays(at(14, 10), at(28, 8))).toBe(14);
  });

  it("меньше суток — всё равно 1 сутки", () => {
    expect(rentalDays(at(14, 10), at(14, 12))).toBe(1);
  });
});

describe("почасовая доплата", () => {
  it("+3 часа — 14 суток и 3 часа доплаты", () => {
    expect(rentalPeriod(at(14, 10), at(28, 13))).toEqual({ days: 14, extraHours: 3 });
  });

  it("начатый час считается целым: +2 ч 30 мин = 3 часа", () => {
    expect(rentalPeriod(at(14, 10), Date.UTC(2026, 10, 28, 12, 30))).toEqual({ days: 14, extraHours: 3 });
  });

  it("ровно в то же время — без доплаты", () => {
    expect(rentalPeriod(at(14, 10), at(28, 10))).toEqual({ days: 14, extraHours: 0 });
  });

  it("+8 часов — сутки вместо часов", () => {
    expect(rentalPeriod(at(14, 10), at(28, 18))).toEqual({ days: 15, extraHours: 0 });
  });

  it("даты в формате RentProg", () => {
    expect(rentProgPeriod("14-11-2026 10:00", "28-11-2026 13:00")).toEqual({ days: 14, extraHours: 3 });
  });
});

describe("часы дороже суток — берём сутки", () => {
  it("3 часа по 400 = 1 200 дешевле суток 2 200 — берём часы", () => {
    expect(rentalCharge(14, 3, 2200, 400)).toEqual({ days: 14, hours: 0 + 3, total: 14 * 2200 + 1200 });
  });

  it("4 часа по 400 = 1 600 дороже суток 950 — берём сутки", () => {
    expect(rentalCharge(14, 4, 950, 400)).toEqual({ days: 15, hours: 0, total: 15 * 950 });
  });

  it("без лишних часов — просто сутки", () => {
    expect(rentalCharge(14, 0, 950, 400)).toEqual({ days: 14, hours: 0, total: 14 * 950 });
  });

  it("нет ставки за час — часы не берём", () => {
    expect(rentalCharge(14, 3, 950, 0)).toEqual({ days: 14, hours: 0, total: 14 * 950 });
  });
});
