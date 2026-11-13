import type { OfferLocale } from "./offer";

// Тексты страницы подборки для клиента (/o/...)
export const OFFER_COPY = {
  ru: {
    titleFor: (name: string) => (name ? `${name}, ваша подборка авто` : "Ваша подборка авто"),
    subtitle: "Мы проверили наличие и подобрали машины на ваши даты",
    pickup: "Получение",
    dropoff: "Возврат",
    office: "Офис в Кате",
    days: (days: number, hours = 0) => `${days} ${ruDays(days)}${hours > 0 ? ` и ${hours} ч` : ""}`,
    perDay: "/день",
    rent: (days: number, hours = 0) => `Аренда за ${days} ${ruDays(days)}${hours > 0 ? ` и ${hours} ч` : ""}`,
    perHour: "/ч",
    deliveryPickup: "Доставка",
    deliveryReturn: "Возврат машины",
    free: "бесплатно",
    total: "Итого",
    deposit: "Депозит (возвращается)",
    mileage: (days: number) => (days >= 5 ? "Пробег без ограничений" : `Пробег 120 км/сутки`),
    seats: (seats: number) => `${seats} мест`,
    choose: "Хочу эту машину",
    personalPrice: (percent: number) => `Персональная цена для вас · −${percent}%`,
    chooseMessage: (car: string, range: string) => `Здравствуйте! Выбираю ${car} на ${range}.`,
    taken: "Эту машину уже забронировали",
    expiredTitle: "Подборка устарела",
    expiredText: "Цены и наличие могли измениться. Напишите нам — обновим подборку за пару минут.",
    included: ["Страховка включена", "Без залога документов", "Детское кресло и держатель для телефона бесплатно"],
    contact: "Есть вопросы? Напишите нам",
    contactShort: "Написать нам",
    allCars: "Все машины на сайте",
    photo: (n: number) => `Фото ${n}`,
    metaDescription: (count: number, from: number) => `${count} ${ruCars(count)} · от ${from.toLocaleString("ru-RU")} ฿/день · Пхукет`,
    notFoundTitle: "Ссылка не открылась",
    notFoundText: "Похоже, ссылка скопировалась не полностью. Напишите нам — пришлём заново.",
  },
  en: {
    titleFor: (name: string) => (name ? `${name}, your car selection` : "Your car selection"),
    subtitle: "We checked availability and picked cars for your dates",
    pickup: "Pick-up",
    dropoff: "Return",
    office: "Office in Kata",
    days: (days: number, hours = 0) => `${days} ${days === 1 ? "day" : "days"}${hours > 0 ? ` ${hours} h` : ""}`,
    perDay: "/day",
    rent: (days: number, hours = 0) => `Rental for ${days} ${days === 1 ? "day" : "days"}${hours > 0 ? ` ${hours} h` : ""}`,
    perHour: "/h",
    deliveryPickup: "Delivery",
    deliveryReturn: "Return pick-up",
    free: "free",
    total: "Total",
    deposit: "Deposit (refundable)",
    mileage: (days: number) => (days >= 5 ? "Unlimited mileage" : "120 km per day"),
    seats: (seats: number) => `${seats} seats`,
    choose: "I want this car",
    personalPrice: (percent: number) => `Personal price for you · −${percent}%`,
    chooseMessage: (car: string, range: string) => `Hi! I'd like the ${car} for ${range}.`,
    taken: "This car has already been booked",
    expiredTitle: "This selection is out of date",
    expiredText: "Prices and availability may have changed. Message us and we'll update it in a couple of minutes.",
    included: ["Insurance included", "No passport deposit", "Free child seat and phone holder"],
    contact: "Questions? Message us",
    contactShort: "Message us",
    allCars: "All cars on our website",
    photo: (n: number) => `Photo ${n}`,
    metaDescription: (count: number, from: number) => `${count} ${count === 1 ? "car" : "cars"} · from ${from.toLocaleString("en-US")} ฿/day · Phuket`,
    notFoundTitle: "This link didn't open",
    notFoundText: "It looks like the link was copied only partly. Message us and we'll send it again.",
  },
} satisfies Record<OfferLocale, unknown>;

function ruPlural(value: number, one: string, few: string, many: string) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function ruDays(days: number) {
  return ruPlural(days, "день", "дня", "дней");
}

function ruCars(count: number) {
  return ruPlural(count, "машина", "машины", "машин");
}
