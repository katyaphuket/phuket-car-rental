export type BookingPayload = {
  carName: string;
  carClass: string;
  transmission: string;
  pickupZoneName: string;
  pickupDateTime: string;
  returnZoneName: string;
  returnDateTime: string;
  days: number;
  name: string;
  phone: string;
  messenger: string;
  comment: string;
  childSeat: boolean;
  booster: boolean;
  phoneHolder: boolean;
  rent: number;
  pickupFee: number;
  returnFee: number;
  washFee: number;
  total: number;
  deposit: number;
};

export function money(value: number) {
  return `${value.toLocaleString("ru-RU")} ฿`;
}

export function yesNo(value: boolean) {
  return value ? "Да" : "Нет";
}

export function mileageLabel(days: number) {
  if (days >= 5) return "Без ограничений";
  return `120 км/сутки, итого ${days * 120} км`;
}
