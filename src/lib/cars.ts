import type { RentProgCarData, RentProgFreeCar } from "./rentprog";

export type Car = {
  id: string;
  name: string;
  classKey: "economy" | "crossover" | "premium";
  pricePerDayThb: number;
  pricePerPeriodThb: number;
  depositThb: number;
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

export function mapRentProgCar(free: RentProgFreeCar, data: RentProgCarData, days: number): Car {
  const name = data.car_name || free.car_name;
  return {
    id: String(free.id),
    name,
    classKey: mapClassKey(data.car_class, name),
    pricePerDayThb: data.selected_price,
    pricePerPeriodThb: data.selected_price * Math.max(days, 1),
    depositThb: data.deposit,
    transmission: data.transmission || free.transmission,
  };
}
