import type { Locale } from "./dictionary";
import cars from "../../knowledge/cars.json";
import carsEn from "../../knowledge/cars-en.json";

export type Feature = {
  icon: string; // emoji или название иконки
  label: string; // подпись
};

export type CarClass = "Эконом" | "Эконом+" | "Эконом Top" | "Комфорт" | "Кроссовер" | "Пикап" | "Премиум" | "Кабриолет" | "Родстер";

export type CarFeatures = {
  displayName: string; // отображаемое название машины (вместо car_name из RentProg)
  carClass: CarClass;
  year: number;
  description: string;
  features: Feature[];
  bodyType: string; // хэтчбек / седан / кроссовер / пикап / кабриолет
  drive: string; // передний / задний / полный
  engine: string; // например "1.2 бензин" или "2.0 турбо дизель"
  seats?: number; // если не 5 — указываем явно
  highlight?: string; // особая фишка для бейджа на фото: "Люк", "Гибрид", "360°" и т.д.
};

// Описания машин — в knowledge/cars.json, переводы на английский — в knowledge/cars-en.json
export const CAR_FEATURES = cars.cars as unknown as Record<number, CarFeatures>;

// Фолбек если машина не найдена в конфиге
export const DEFAULT_FEATURES = cars.default as Omit<CarFeatures, "displayName">;

// ID машин (RentProg), на которые навешена акция "Низкая цена"
export const LOW_PRICE_CAR_IDS = new Set<number>(cars.lowPriceCarIds);

const CRM_COLORS = ["white", "red", "grey", "gray", "silver", "black", "blue", "yellow"];

// Парсит отображаемое название из car_name RentProg, если для машины нет записи в CAR_FEATURES:
// убирает номер после "#", класс в скобках и название цвета.
export function parseDisplayName(rawName: string): string {
  const withoutNumber = rawName.split("#")[0];
  const withoutClass = withoutNumber.replace(/\([^)]*\)/g, "");
  const colorPattern = new RegExp(`\\b(${CRM_COLORS.join("|")})\\b`, "gi");
  const withoutColor = withoutClass.replace(colorPattern, "");
  return withoutColor.replace(/\s+/g, " ").trim();
}

export function getDisplayName(id: number, rawName: string): string {
  return CAR_FEATURES[id]?.displayName ?? parseDisplayName(rawName);
}

export function getCarFeatures(id: number, rawName = ""): CarFeatures {
  return CAR_FEATURES[id] ?? { ...DEFAULT_FEATURES, displayName: parseDisplayName(rawName) };
}

export const CAR_CLASS_EN = carsEn.carClass as Record<CarClass, string>;

const BODY_TYPE_EN: Record<string, string> = carsEn.bodyType;
const DRIVE_EN: Record<string, string> = carsEn.drive;
const ENGINE_EN: Record<string, string> = carsEn.engine;
const FEATURE_LABEL_EN: Record<string, string> = carsEn.featureLabel;
const HIGHLIGHT_EN: Record<string, string> = carsEn.highlight;
const DESCRIPTION_EN: Record<string, string> = carsEn.description;

function translateOr<T extends string>(map: Record<string, string>, value: T): string {
  return map[value] ?? value;
}

const TRANSMISSION_EN: Record<string, string> = carsEn.transmission;

export function translateTransmission(rawTransmission: string | undefined, locale: Locale, automaticLabel: string): string {
  if (!rawTransmission) return automaticLabel;
  if (locale !== "en") return rawTransmission;
  return TRANSMISSION_EN[rawTransmission] ?? rawTransmission;
}

export function translateCarFeatures(features: CarFeatures, locale: Locale): CarFeatures {
  if (locale !== "en") return features;

  return {
    ...features,
    carClass: (CAR_CLASS_EN[features.carClass] ?? features.carClass) as CarClass,
    description: translateOr(DESCRIPTION_EN, features.description),
    bodyType: translateOr(BODY_TYPE_EN, features.bodyType),
    drive: translateOr(DRIVE_EN, features.drive),
    engine: translateOr(ENGINE_EN, features.engine),
    highlight: features.highlight ? translateOr(HIGHLIGHT_EN, features.highlight) : features.highlight,
    features: features.features.map((feature) => ({
      ...feature,
      label: translateOr(FEATURE_LABEL_EN, feature.label),
    })),
  };
}
