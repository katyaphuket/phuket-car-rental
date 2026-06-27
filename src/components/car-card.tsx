"use client";

import { useLocale } from "@/lib/locale-context";
import { thbToUsd, type Car, type Delivery } from "@/lib/cars";
import { CAR_CLASS_EN, getCarFeatures, getDisplayName } from "@/lib/car-features";
import { CarPhoto } from "./car-photo";

const classIcon: Record<Car["classKey"], string> = {
  economy: "ti-car",
  crossover: "ti-car-suv",
  premium: "ti-car",
};

type CarCardProps = {
  car: Car;
  delivery: Delivery;
  onPickupOnly: () => void;
  onOpen: () => void;
};

export function CarCard({ car, delivery, onPickupOnly, onOpen }: CarCardProps) {
  const { t, locale } = useLocale();
  const displayName = getDisplayName(Number(car.id), car.name);
  const { carClass, year, seats } = getCarFeatures(Number(car.id), car.name);
  const carClassLabel = locale === "en" ? CAR_CLASS_EN[carClass] : carClass;

  if (!delivery.available) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-muted opacity-75">
        <CarPhoto carId={car.id} alt={displayName} icon={classIcon[car.classKey]} className="aspect-[4/3] w-full" />

        <div className="p-4">
          <div className="text-base font-medium text-foreground">{displayName}</div>
          <div className="mb-3 text-xs text-foreground-faint">
            {carClassLabel} · {t.cars.automatic} · {t.cars.year(year)}
          </div>

          <p className="mb-3 text-xs text-foreground-muted">
            {t.fleet.deliveryUnavailable(delivery.requiredDays)}
          </p>

          <button
            type="button"
            onClick={onPickupOnly}
            className="w-full rounded-lg border border-border bg-surface py-2.5 text-sm font-medium text-foreground hover:bg-surface-muted cursor-pointer"
          >
            {t.fleet.pickupFromOffice}
          </button>
        </div>
      </div>
    );
  }

  const totalWithDelivery = car.pricePerPeriodThb + delivery.pickupFee + delivery.returnFee;

  return (
    <div
      onClick={onOpen}
      className={`card-elevate relative cursor-pointer overflow-hidden rounded-2xl border bg-surface ${
        car.popular ? "border-2 border-accent" : "border-border"
      }`}
    >
      {car.popular && (
        <span className="absolute left-3 top-3 z-10 rounded-md bg-accent-soft px-2.5 py-0.5 text-[11px] font-medium text-accent-soft-foreground">
          {t.fleet.popular}
        </span>
      )}

      <div className="relative">
        <CarPhoto carId={car.id} alt={displayName} icon={classIcon[car.classKey]} className="aspect-[4/3] w-full" />
        {seats === 7 && (
          <span className="absolute right-3 top-3 z-10 rounded-md bg-white px-2.5 py-0.5 text-[11px] font-medium text-gray-900">
            {t.cars.seats(7)}
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="text-base font-medium text-foreground">{displayName}</div>
        <div className="mb-3 text-xs text-foreground-faint">
          {carClassLabel} · {t.cars.automatic} · {t.cars.year(year)}
        </div>

        <div className="mb-2 text-xs text-foreground-faint">
          ฿{car.pricePerPeriodThb.toLocaleString("ru-RU")} · ฿{car.pricePerDayThb.toLocaleString("ru-RU")}
          {t.fleet.perDay} · ≈ ${thbToUsd(car.pricePerDayThb)}
        </div>

        {delivery.pickupFee > 0 && (
          <div className="mb-1 flex items-center justify-between text-xs text-foreground-faint">
            <span>{t.fleet.delivery}</span>
            <span>+฿{delivery.pickupFee.toLocaleString("ru-RU")}</span>
          </div>
        )}
        {delivery.returnFee > 0 && (
          <div className="mb-2 flex items-center justify-between text-xs text-foreground-faint">
            <span>{t.fleet.returnFee}</span>
            <span>+฿{delivery.returnFee.toLocaleString("ru-RU")}</span>
          </div>
        )}

        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-xl font-bold text-foreground">
            ฿{totalWithDelivery.toLocaleString("ru-RU")}
          </span>
          <span className="text-[11px] text-foreground-faint">{t.fleet.totalWithDelivery}</span>
        </div>

        <div className="mb-3 text-xs text-foreground-faint">
          {t.fleet.deposit}: ฿{car.depositThb.toLocaleString("ru-RU")}
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          className="w-full cursor-pointer rounded-lg bg-[#0EA5C9] px-5 py-3 text-sm font-semibold text-white transition-all duration-200 ease-[ease] hover:-translate-y-px hover:bg-[#0284C7] hover:shadow-[0_4px_12px_rgba(14,165,201,0.3)]"
        >
          {t.fleet.request} →
        </button>
      </div>
    </div>
  );
}
