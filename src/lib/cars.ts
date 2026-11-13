import type { RentProgCarData, RentProgFreeCar } from "./rentprog";
import { rentalCharge } from "./rental-days";

export type Car = {
  id: string;
  name: string;
  number?: string;
  classKey: "economy" | "crossover" | "premium";
  pricePerDayThb: number;
  pricePerPeriodThb: number; // аренда за весь срок, вместе с почасовой доплатой
  depositThb: number;
  extraHours?: number; // часы сверх полных суток (до 4), за которые берём почасовую доплату
  pricePerHourThb?: number;
  chargedDays?: number; // если часы вышли дороже суток — берём сутки: дней на одни больше
  transmission?: string;
  popular?: boolean;
};

export type Delivery = {
  pickupFee: number;
  returnFee: number;
  available: boolean;
  requiredDays: number;
};

const THB_TO_USD = 0.028;

export function thbToUsd(priceThb: number) {
  return Math.round(priceThb * THB_TO_USD);
}

function mapClassKey(carClass: string | null, name: string): Car["classKey"] {
  const lower = (carClass ?? name).toLowerCase();
  if (/(кроссовер|suv|crossover)/.test(lower)) return "crossover";
  if (/(бизнес|премиум|premium|business)/.test(lower)) return "premium";
  return "economy";
}

export function mapRentProgCar(free: RentProgFreeCar, data: RentProgCarData, days: number, extraHours = 0): Car {
  const name = data.car_name || free.car_name;
  const pricePerHour = Number(data.price_hour) || 0;
  const charge = rentalCharge(Math.max(days, 1), extraHours, data.selected_price, pricePerHour);
  return {
    id: String(free.id),
    name,
    number: data.number?.trim() || undefined,
    classKey: mapClassKey(data.car_class, name),
    pricePerDayThb: data.selected_price,
    pricePerPeriodThb: charge.total,
    depositThb: data.deposit,
    transmission: data.transmission || free.transmission,
    ...(extraHours > 0 && pricePerHour > 0 ? { pricePerHourThb: pricePerHour } : {}),
    ...(charge.hours > 0 ? { extraHours: charge.hours } : {}),
    ...(charge.days !== Math.max(days, 1) ? { chargedDays: charge.days } : {}),
  };
}
