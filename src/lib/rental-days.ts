// Срок аренды — так же, как считает RentProg.
// Полные сутки от времени получения. Остаток до HOURS_LIMIT часов включительно — почасовая
// доплата (price_hour машины за каждый начатый час), больше HOURS_LIMIT — ещё сутки.
// HOURS_LIMIT — настройка RentProg (`hours_limit` в car_data, сейчас 4).
// Поменяют её в RentProg — поменять и здесь.
export const HOURS_LIMIT = 4;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function rentalPeriod(startMs: number, endMs: number) {
  const total = endMs - startMs;
  if (!(total > 0)) return { days: 1, extraHours: 0 };
  const fullDays = Math.floor(total / DAY_MS);
  const restHours = (total - fullDays * DAY_MS) / HOUR_MS;
  if (fullDays === 0) return { days: 1, extraHours: 0 };
  if (restHours > HOURS_LIMIT) return { days: fullDays + 1, extraHours: 0 };
  return { days: fullDays, extraHours: Math.ceil(restHours) };
}

export function rentalDays(startMs: number, endMs: number) {
  return rentalPeriod(startMs, endMs).days;
}

// "DD-MM-YYYY H:mm" (формат RentProg) -> миллисекунды; часовой пояс для разницы неважен.
export function rentProgDateMs(value: string) {
  const match = value.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const [day, month, year, hours, minutes] = match.slice(1).map(Number);
  return Date.UTC(year, month - 1, day, hours, minutes);
}

export function rentProgPeriod(start: string, end: string) {
  const startMs = rentProgDateMs(start);
  const endMs = rentProgDateMs(end);
  return startMs === null || endMs === null ? null : rentalPeriod(startMs, endMs);
}

// Сколько берём с клиента за срок: сутки + почасовая доплата.
// Если часы выходят дороже ещё одних суток — берём сутки, а не часы.
export function rentalCharge(days: number, extraHours: number, pricePerDay: number, pricePerHour = 0) {
  const hoursCost = extraHours * pricePerHour;
  if (extraHours > 0 && hoursCost > pricePerDay) {
    return { days: days + 1, hours: 0, total: pricePerDay * (days + 1) };
  }
  const hours = hoursCost > 0 ? extraHours : 0;
  return { days, hours, total: pricePerDay * days + (hours > 0 ? hoursCost : 0) };
}
