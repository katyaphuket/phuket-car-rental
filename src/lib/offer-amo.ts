import { amoFetch, FIELD, findCarOption, getCarOptions, isAmoConfigured } from "@/lib/amocrm";
import { getDisplayName } from "@/lib/car-features";
import { isLeadNotifyConfigured, sendToTelegram } from "@/lib/lead-notify";
import { fetchCarData } from "@/lib/rentprog";
import { formatRange, offerCharge, offerRent, parseRentProgDate, type Offer, type OfferCar } from "@/lib/offer";

// Что подборка делает в amoCRM и Telegram: отправлена → «Отправлено предложение»,
// клиент открыл → примечание, клиент выбрал машину → «Запросили документы», поле «Авто», Telegram.

const AMO_TIMEOUT_MS = 20000;

// Этапы воронок по порядку. Сделку двигаем только вперёд, «Неразобранное» и закрытые не трогаем.
const PIPELINES: Record<number, { order: number[]; sent: number; chosen: number }> = {
  // Продажи
  2538268: {
    order: [26442328, 7669276, 7669278, 70178138, 70178218, 7669282, 70178258, 70178266],
    sent: 7669278, // Отправлено предложение
    chosen: 70178218, // Запросили документы и предоплату
  },
  // Повторные продажи
  8187810: {
    order: [66912270, 66912274, 70107422, 66912278, 70107326, 70107330],
    sent: 66912278, // Отправлено предложение
    chosen: 70107326, // Ждем бронь/документы
  },
};
const UNSORTED_STATUSES = new Set([26442328, 66912270]);

type Step = "sent" | "chosen";

// Новый этап для сделки или null, если двигать не нужно.
export function nextStatus(pipelineId: number, statusId: number, step: Step) {
  const pipeline = PIPELINES[pipelineId];
  if (!pipeline || UNSORTED_STATUSES.has(statusId)) return null;
  const current = pipeline.order.indexOf(statusId);
  const target = pipeline.order.indexOf(pipeline[step]);
  if (current === -1 || target === -1 || current >= target) return null;
  return pipeline[step];
}

function money(value: number) {
  return `${value.toLocaleString("ru-RU")} ฿`;
}

function carLine(car: OfferCar, offer: Pick<Offer, "days" | "extraHours">) {
  const custom = car.listPrice ? ` (своя цена, в RentProg ${money(car.listPrice)}/день)` : "";
  const charge = offerCharge(offer, car);
  const period =
    charge.hours > 0 && car.pricePerHour
      ? `, ${charge.days} дн. + ${charge.hours} ч по ${money(car.pricePerHour)}`
      : charge.days !== offer.days
        ? `, ${charge.days} дн. (часы дороже суток)`
        : "";
  return `• ${getDisplayName(car.id, car.name ?? "")} — ${money(car.pricePerDay)}/день${period}, итого ${money(charge.total)}${custom}`;
}

function periodText(offer: Offer) {
  return `${offer.days} дн.${offer.extraHours ? ` + ${offer.extraHours} ч` : ""}`;
}

function leadUrl(leadId: number) {
  return `${process.env.AMOCRM_BASE_URL?.replace(/\/+$/, "")}/leads/detail/${leadId}`;
}

async function addNote(leadId: number, text: string, signal: AbortSignal) {
  await amoFetch(`leads/${leadId}/notes`, signal, {
    method: "POST",
    body: JSON.stringify([{ note_type: "common", params: { text } }]),
  });
}

type CustomField = { field_id: number; values: { value: string | number }[] };

async function updateLead(
  leadId: number,
  step: Step | null,
  customFields: CustomField[],
  signal: AbortSignal,
  price?: number
) {
  const res = await amoFetch(`leads/${leadId}`, signal);
  const lead: { pipeline_id: number; status_id: number } = await res.json();
  const statusId = step ? nextStatus(lead.pipeline_id, lead.status_id, step) : null;
  if (!statusId && customFields.length === 0 && price === undefined) return;
  const patch = (fields: CustomField[]) =>
    amoFetch(`leads/${leadId}`, signal, {
      method: "PATCH",
      body: JSON.stringify({
        ...(statusId ? { status_id: statusId } : {}),
        ...(price !== undefined ? { price } : {}),
        ...(fields.length > 0 ? { custom_fields_values: fields } : {}),
      }),
    });
  // Удалили или переименовали поле в amoCRM — этап и бюджет всё равно запишем.
  await patch(customFields).catch((error) => {
    if (customFields.length === 0) throw error;
    console.error(`Offer: amoCRM lead ${leadId} fields rejected, retrying without them:`, error);
    return patch([]);
  });
}

// Что клиент выбрал — в поля сделки, как у заявки с сайта.
// «Бюджет» — только аренда без доставки: из него зарплатный бот считает процент менеджера.
export function chosenCarFields(offer: Offer, car: OfferCar): CustomField[] {
  const fields: CustomField[] = [];
  const add = (fieldId: number, value: string | number | undefined) => {
    if (value !== undefined && value !== "") fields.push({ field_id: fieldId, values: [{ value }] });
  };
  const start = parseRentProgDate(offer.start);
  const end = parseRentProgDate(offer.end);
  add(FIELD.startDate, start ? start.getTime() / 1000 : undefined);
  add(FIELD.endDate, end ? end.getTime() / 1000 : undefined);
  add(FIELD.days, offerCharge(offer, car).days);
  add(FIELD.pricePerDay, car.pricePerDay);
  add(FIELD.deposit, car.deposit);
  if (offer.pickup) add(FIELD.pickupFee, offer.pickup.fee);
  if (offer.dropoff) add(FIELD.returnFee, offer.dropoff.fee);
  return fields;
}

// Менеджер создал подборку из сделки.
export async function onOfferCreated(offer: Offer, url: string) {
  if (!offer.leadId || !isAmoConfigured()) return;
  const signal = AbortSignal.timeout(AMO_TIMEOUT_MS);
  await addNote(
    offer.leadId,
    [
      "📋 ОТПРАВЛЕНА ПОДБОРКА",
      `Даты: ${formatRange(offer.start, offer.end, "ru")} (${offer.start} → ${offer.end}), ${periodText(offer)}`,
      ...offer.cars.map((car) => carLine(car, offer)),
      "",
      url,
    ].join("\n"),
    signal
  );
  await updateLead(offer.leadId, "sent", [], signal);
}

// Клиент открыл подборку (браузер присылает один раз на ссылку).
export async function onOfferViewed(offer: Offer) {
  if (!offer.leadId || !isAmoConfigured()) return;
  const time = new Date().toLocaleString("ru-RU", { timeZone: "Asia/Bangkok", dateStyle: "short", timeStyle: "short" });
  await addNote(offer.leadId, `👀 Клиент открыл подборку (${time} по Пхукету)`, AbortSignal.timeout(AMO_TIMEOUT_MS));
}

// Клиент нажал «Хочу эту машину».
export async function onCarChosen(offer: Offer, car: OfferCar) {
  const carName = getDisplayName(car.id, car.name ?? "");
  const range = formatRange(offer.start, offer.end, "ru");
  const tasks: Promise<unknown>[] = [];

  if (offer.leadId && isAmoConfigured()) {
    const leadId = offer.leadId;
    tasks.push(
      (async () => {
        const signal = AbortSignal.timeout(AMO_TIMEOUT_MS);
        await addNote(
          leadId,
          [
            "✅ КЛИЕНТ ВЫБРАЛ МАШИНУ В ПОДБОРКЕ",
            `Даты: ${range} (${offer.start} → ${offer.end}), ${periodText(offer)}`,
            carLine(car, offer),
            `Депозит: ${money(car.deposit)}`,
          ].join("\n"),
          signal
        );

        // Машину — в поле «Авто», если найдётся подходящий вариант (по номеру из RentProg).
        const carNumber = await fetchCarData(car.id, offer.start, offer.end, offer.days)
          .then((data) => data.number?.trim() || undefined)
          .catch(() => undefined);
        const option = findCarOption(await getCarOptions(signal), { carId: String(car.id), carNumber, carName });
        const fields = chosenCarFields(offer, car);
        if (option) fields.push({ field_id: FIELD.car, values: [{ value: option }] });
        // Бюджет — вся аренда, с почасовой доплатой, без доставки.
        await updateLead(leadId, "chosen", fields, signal, offerRent(offer, car));
      })().catch((error) => console.error(`Offer choose: amoCRM lead ${leadId} failed:`, error))
    );
  }

  if (isLeadNotifyConfigured()) {
    tasks.push(
      sendToTelegram(
        [
          "🔥 Клиент выбрал машину в подборке",
          "",
          offer.name ? `Клиент: ${offer.name}` : null,
          `Машина: ${carName}`,
          `Даты: ${range}, ${periodText(offer)}`,
          `Цена: ${money(car.pricePerDay)}/день, итого ${money(offerRent(offer, car))}`,
          "",
          offer.leadId ? leadUrl(offer.leadId) : "Сделка в подборке не указана — клиент напишет в мессенджер.",
        ]
          .filter((line) => line !== null)
          .join("\n")
      ).catch((error) => console.error("Offer choose: Telegram failed:", error))
    );
  }

  await Promise.all(tasks);
}
