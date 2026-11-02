import { type BookingPayload, mileageLabel, money, yesNo } from "@/lib/booking";

// The booking form gives up after 6 seconds, and the email still has to go out after this.
const AMO_TIMEOUT_MS = 4000;

type AmoPhoneField = {
  field_code?: string | null;
  values?: { value?: string | number }[];
};

type AmoContact = {
  id: number;
  custom_fields_values?: AmoPhoneField[] | null;
};

export function isAmoConfigured() {
  return Boolean(process.env.AMOCRM_BASE_URL && process.env.AMOCRM_ACCESS_TOKEN);
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function optionalNumber(value: string | undefined) {
  const parsed = Number(value);
  return value && Number.isInteger(parsed) ? parsed : undefined;
}

async function amoFetch(path: string, signal: AbortSignal, init?: RequestInit) {
  const baseUrl = process.env.AMOCRM_BASE_URL?.replace(/\/+$/, "");
  const res = await fetch(`${baseUrl}/api/v4/${path}`, {
    ...init,
    signal,
    headers: {
      Authorization: `Bearer ${process.env.AMOCRM_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const details = await res.text().catch(() => "");
    throw new Error(`amoCRM ${path} failed: ${res.status} ${details.slice(0, 300)}`);
  }
  return res;
}

// amoCRM search is full-text, so a hit is only trusted when the whole number matches.
async function findContactIdByPhone(phone: string, signal: AbortSignal) {
  const digits = digitsOnly(phone);
  if (!digits) return null;

  const res = await amoFetch(`contacts?query=${digits}&limit=25`, signal);
  if (res.status === 204) return null;

  const body: { _embedded?: { contacts?: AmoContact[] } } = await res.json();
  const match = body._embedded?.contacts?.find((contact) =>
    contact.custom_fields_values?.some(
      (field) =>
        field.field_code === "PHONE" &&
        field.values?.some((item) => digitsOnly(String(item.value ?? "")) === digits)
    )
  );
  return match?.id ?? null;
}

function buildNoteText(data: BookingPayload) {
  return [
    "ЗАЯВКА С САЙТА",
    "",
    `Машина: ${data.carName} (${data.carClass}, ${data.transmission})`,
    `Получение: ${data.pickupZoneName} · ${data.pickupDateTime}`,
    `Возврат: ${data.returnZoneName} · ${data.returnDateTime}`,
    `Срок: ${data.days} дней`,
    "",
    `Имя: ${data.name}`,
    `Телефон: ${data.phone}`,
    `Мессенджер: ${data.messenger}`,
    `Комментарий: ${data.comment || "Нет"}`,
    "",
    `Детское автокресло: ${yesNo(data.childSeat)}`,
    `Бустер: ${yesNo(data.booster)}`,
    `Держатель для телефона: ${yesNo(data.phoneHolder)}`,
    `Мойка при возврате: ${data.washFee > 0 ? money(data.washFee) : "Нет"}`,
    `Пробег: ${mileageLabel(data.days)}`,
    "",
    `Аренда: ${money(data.rent)}`,
    `Доставка при получении: ${money(data.pickupFee)}`,
    `Возврат: ${money(data.returnFee)}`,
    `ИТОГО: ${money(data.total)}`,
    `Депозит (возвращается): ${money(data.deposit)}`,
  ].join("\n");
}

export async function createAmoLead(data: BookingPayload) {
  const signal = AbortSignal.timeout(AMO_TIMEOUT_MS);

  // A failed lookup must not lose the lead: the worst case is a duplicate contact.
  const contactId = await findContactIdByPhone(data.phone, signal).catch((error) => {
    console.error("amoCRM contact lookup failed:", error);
    return null;
  });

  const contact = contactId
    ? { id: contactId }
    : {
        name: data.name,
        custom_fields_values: [
          { field_code: "PHONE", values: [{ value: data.phone, enum_code: "WORK" }] },
        ],
      };

  const res = await amoFetch("leads/complex", signal, {
    method: "POST",
    body: JSON.stringify([
      {
        name: `${data.name} — ${data.carName} — ${data.pickupDateTime}`,
        price: Math.round(data.total),
        pipeline_id: optionalNumber(process.env.AMOCRM_PIPELINE_ID),
        status_id: optionalNumber(process.env.AMOCRM_STATUS_ID),
        tags_to_add: [{ name: "Сайт" }],
        _embedded: { contacts: [contact] },
      },
    ]),
  });
  const [lead]: { id: number }[] = await res.json();

  // The lead already exists and the email carries the same details, so don't fail here.
  await amoFetch(`leads/${lead.id}/notes`, signal, {
    method: "POST",
    body: JSON.stringify([{ note_type: "common", params: { text: buildNoteText(data) } }]),
  }).catch((error) => {
    console.error("amoCRM note failed:", error);
  });
}
