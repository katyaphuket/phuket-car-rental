export type CarClass = "economy" | "economy_plus" | "comfort" | "cabrio" | "premium";

// Определение класса по названию из RentProg
export function getCarClass(carName: string): CarClass {
  const name = carName.toLowerCase();
  if (name.includes("кабриолет") || name.includes("cabrio")) return "cabrio";
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

const MIN_DAYS_KATA = { economy: 1, economy_plus: 1, comfort: 1, cabrio: 1, premium: 1 };
const MIN_DAYS_NEAR = { economy: 3, economy_plus: 3, comfort: 1, cabrio: 1, premium: 1 };
const MIN_DAYS_MID = { economy: 5, economy_plus: 5, comfort: 3, cabrio: 1, premium: 1 };
const MIN_DAYS_FAR = { economy: 7, economy_plus: 7, comfort: 5, cabrio: 1, premium: 1 };

export const ZONES: Zone[] = [
  {
    id: "kata",
    name: { ru: "Ката (офис)", en: "Kata (office)" },
    price: 0,
    popular: true,
    minDays: MIN_DAYS_KATA,
  },
  {
    id: "karon",
    name: { ru: "Карон", en: "Karon" },
    price: 150,
    popular: true,
    minDays: MIN_DAYS_NEAR,
  },
  {
    id: "kata_noi",
    name: { ru: "Ката Нои", en: "Kata Noi" },
    price: 150,
    minDays: MIN_DAYS_NEAR,
  },
  {
    id: "chalong",
    name: { ru: "Чалонг", en: "Chalong" },
    price: 300,
    minDays: MIN_DAYS_NEAR,
  },
  {
    id: "rawai",
    name: { ru: "Раваи", en: "Rawai" },
    price: 300,
    minDays: MIN_DAYS_NEAR,
  },
  {
    id: "patong",
    name: { ru: "Патонг", en: "Patong" },
    price: 600,
    popular: true,
    minDays: MIN_DAYS_MID,
  },
  {
    id: "kathu",
    name: { ru: "Кату", en: "Kathu" },
    price: 600,
    minDays: MIN_DAYS_MID,
  },
  {
    id: "phuket_town",
    name: { ru: "Пхукет Таун", en: "Phuket Town" },
    price: 700,
    minDays: MIN_DAYS_MID,
  },
  {
    id: "panwa",
    name: { ru: "Панва", en: "Panwa" },
    price: 700,
    minDays: MIN_DAYS_MID,
  },
  {
    id: "rassada",
    name: { ru: "Рассада", en: "Rassada" },
    price: 700,
    minDays: MIN_DAYS_MID,
  },
  {
    id: "kamala",
    name: { ru: "Камала", en: "Kamala" },
    price: 700,
    minDays: MIN_DAYS_MID,
  },
  {
    id: "bangtao",
    name: { ru: "Бангтао", en: "Bang Tao" },
    price: 1000,
    popular: true,
    minDays: MIN_DAYS_FAR,
  },
  {
    id: "surin",
    name: { ru: "Сурин", en: "Surin" },
    price: 1000,
    minDays: MIN_DAYS_FAR,
  },
  {
    id: "thalang",
    name: { ru: "Таланг", en: "Thalang" },
    price: 1000,
    minDays: MIN_DAYS_FAR,
  },
  {
    id: "naithon",
    name: { ru: "Найтон", en: "Naithon" },
    price: 1000,
    minDays: MIN_DAYS_FAR,
  },
  {
    id: "nai_yang",
    name: { ru: "Найянг", en: "Nai Yang" },
    price: 1000,
    minDays: MIN_DAYS_FAR,
  },
  {
    id: "airport",
    name: { ru: "Аэропорт HKT", en: "HKT Airport" },
    price: 1000,
    popular: true,
    minDays: MIN_DAYS_FAR,
  },
  {
    id: "mai_khao",
    name: { ru: "Май Кхао", en: "Mai Khao" },
    price: 1200,
    minDays: MIN_DAYS_FAR,
  },
];

// Сезонное ограничение: с 15 ноября минимум 3 дня для всех
export function getGlobalMinDays(startDate: Date): number {
  const month = startDate.getMonth() + 1; // 1-12
  const day = startDate.getDate();
  if (month === 11 && day >= 15) return 3;
  if (month === 12 || month <= 3) return 3; // уточните период
  return 1;
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
