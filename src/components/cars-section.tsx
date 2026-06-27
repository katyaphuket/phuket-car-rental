"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/locale-context";
import type { Car } from "@/lib/cars";
import { canDeliver, getRequiredDays, ZONES } from "@/lib/delivery-rules";
import { CarCard } from "./car-card";
import { CarModal } from "./car-modal";
import { formatDate } from "./date-range-picker";
import { SectionHeading } from "./section-heading";

const VISIBLE_LIMIT = 3;

function formatRentProgDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}-${month}-${year} ${date.getHours()}:${minutes}`;
}

function daysBetween(range: { start: Date; end: Date }) {
  return Math.max(Math.round((range.end.getTime() - range.start.getTime()) / 86400000), 1);
}

function CarCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="aspect-[4/3] w-full animate-pulse bg-surface-muted" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-surface-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-surface-muted" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-surface-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-surface-muted" />
        <div className="h-9 w-full animate-pulse rounded-lg bg-surface-muted" />
      </div>
    </div>
  );
}

type CarsSectionProps = {
  range: { start: Date; end: Date };
  searchToken: number;
  pickupZoneId: string;
  returnZoneId: string;
  onPickupOnly: () => void;
  prefillComment?: string;
};

export function CarsSection({
  range,
  searchToken,
  pickupZoneId,
  returnZoneId,
  onPickupOnly,
  prefillComment,
}: CarsSectionProps) {
  const { locale, t } = useLocale();
  const [cars, setCars] = useState<Car[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  async function loadCars(activeRange: { start: Date; end: Date }) {
    setLoading(true);
    setError(false);
    setShowAll(false);

    const days = daysBetween(activeRange);
    const params = new URLSearchParams({
      start_date: formatRentProgDate(activeRange.start),
      end_date: formatRentProgDate(activeRange.end),
      days: String(days),
    });

    try {
      const res = await fetch(`/api/cars?${params.toString()}`);
      if (!res.ok) throw new Error("request failed");
      const data: Car[] = await res.json();
      setCars(data);
    } catch {
      setError(true);
      setCars(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount and whenever a new search is submitted
    loadCars(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchToken]);

  const rangeLabel = `${formatDate(range.start, locale, t.calendar.months)} – ${formatDate(
    range.end,
    locale,
    t.calendar.months
  )}`;

  const days = daysBetween(range);
  const pickupZone = ZONES.find((zone) => zone.id === pickupZoneId) ?? ZONES[0];
  const returnZone = ZONES.find((zone) => zone.id === returnZoneId) ?? ZONES[0];

  function getDelivery(car: Car) {
    const pickupCheck = canDeliver(car.name, pickupZone.id, days, range.start);
    const returnCheck = canDeliver(car.name, returnZone.id, days, range.start);
    const available = pickupCheck.available && returnCheck.available;
    const requiredDays = Math.max(
      getRequiredDays(car.name, pickupZone.id, range.start),
      getRequiredDays(car.name, returnZone.id, range.start)
    );

    return {
      pickupFee: pickupZone.price,
      returnFee: returnZone.price,
      available,
      requiredDays,
    };
  }

  const sortedCars = cars
    ? [...cars].sort((a, b) => Number(!getDelivery(a).available) - Number(!getDelivery(b).available))
    : null;
  const visibleCars = showAll ? sortedCars : sortedCars?.slice(0, VISIBLE_LIMIT);

  return (
    <section id="fleet" className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <SectionHeading eyebrow={t.fleet.eyebrow} title={t.fleet.title} align="center" />
      <p className="mb-6 text-center text-xs uppercase tracking-wide text-foreground-faint">
        {t.fleet.availableFrom(rangeLabel)}
      </p>

      {loading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: VISIBLE_LIMIT }).map((_, index) => (
            <CarCardSkeleton key={index} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-foreground-muted">{t.fleet.errorMessage}</p>
          <button
            type="button"
            onClick={() => loadCars(range)}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted cursor-pointer"
          >
            {t.fleet.retry}
          </button>
        </div>
      )}

      {!loading && !error && cars && cars.length === 0 && (
        <p className="py-10 text-center text-sm text-foreground-muted">{t.fleet.empty}</p>
      )}

      {!loading && !error && cars && cars.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCars?.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                delivery={getDelivery(car)}
                onPickupOnly={onPickupOnly}
                onOpen={() => setSelectedCar(car)}
              />
            ))}
          </div>

          {!showAll && cars.length > VISIBLE_LIMIT && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted cursor-pointer"
              >
                {t.fleet.showAll(cars.length)}
              </button>
            </div>
          )}
        </>
      )}

      {selectedCar && (
        <CarModal
          car={selectedCar}
          delivery={getDelivery(selectedCar)}
          days={days}
          range={range}
          pickupZone={pickupZone}
          returnZone={returnZone}
          prefillComment={prefillComment}
          onClose={() => setSelectedCar(null)}
        />
      )}
    </section>
  );
}
