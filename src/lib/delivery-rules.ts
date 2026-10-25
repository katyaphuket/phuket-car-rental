import delivery from "../../knowledge/delivery.json";

export type CarClass = "economy" | "economy_plus" | "comfort" | "cabrio" | "premium";

// Определение класса по названию из RentProg
export function getCarClass(carName: string): CarClass {
  const name = carName.toLowerCase();
  if (name.includes("mg5") || name.includes("mg 5")) return "economy";
  if (name.includes("кабриолет") || name.includes("cabrio") || name.includes("cyberster")) return "cabrio";
  if (name.includes("премиум") || name.includes("premium")) return "premium";
  if (name.includes("комфорт") || name.includes("пикап") || name.includes("pickup")) return "comfort";
  if (name.includes("эконом+")) return "economy_plus";
  return "economy";
}

export type Zone = {
  id: string;
  name: { ru: string; en: string };
  price: number;
  popular?: boolean;
  minDays: Record<CarClass, number>;
};

// Зоны, цены доставки и минимальные сроки — в knowledge/delivery.json
const MIN_DAYS_GROUPS = delivery.minDaysGroups as Record<string, Record<CarClass, number>>;

export const ZONES: Zone[] = delivery.zones.map(({ minDaysGroup, ...zone }) => ({
  ...zone,
  minDays: MIN_DAYS_GROUPS[minDaysGroup],
}));

// "MM-DD" -> 1115
function monthDayKey(value: string): number {
  const [month, day] = value.split("-").map(Number);
  return month * 100 + day;
}

// Сезонное ограничение: в высокий сезон минимальный срок для всех (period может переходить через Новый год)
export function getGlobalMinDays(startDate: Date): number {
  const { start, end, minDays, offSeasonMinDays } = delivery.season;
  const key = (startDate.getMonth() + 1) * 100 + startDate.getDate();
  const from = monthDayKey(start);
  const to = monthDayKey(end);
  const inSeason = from <= to ? key >= from && key <= to : key >= from || key <= to;
  return inSeason ? minDays : offSeasonMinDays;
}

export function canDeliver(
  carName: string,
  zoneId: string,
  days: number,
  startDate: Date
): { available: boolean; reason?: string } {
  const carClass = getCarClass(carName);
  const zone = ZONES.find((z) => z.id === zoneId);
  if (!zone) return { available: false, reason: "Район не найден" };

  const globalMin = getGlobalMinDays(startDate);
  if (days < globalMin) {
    return {
      available: false,
      reason: `С 15 ноября минимальный срок аренды — ${globalMin} дня`,
    };
  }

  const zoneMin = zone.minDays[carClass];
  if (days < zoneMin) {
    return {
      available: false,
      reason: `Доставка в район "${zone.name.ru}" от ${zoneMin} дней`,
    };
  }

  return { available: true };
}

export function getRequiredDays(carName: string, zoneId: string, startDate: Date): number {
  const carClass = getCarClass(carName);
  const zone = ZONES.find((z) => z.id === zoneId);
  const globalMin = getGlobalMinDays(startDate);
  if (!zone) return globalMin;
  return Math.max(globalMin, zone.minDays[carClass]);
}
