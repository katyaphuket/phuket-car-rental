"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import type { Car, Delivery } from "@/lib/cars";
import type { Zone } from "@/lib/delivery-rules";
import { getCarFeatures, getDisplayName, translateCarFeatures, translateTransmission } from "@/lib/car-features";
import { trackBookingSubmit } from "@/lib/analytics";
import { PhotoPlaceholder } from "./photo-placeholder";

const WASH_FEE = 400;
const MAX_PHOTOS = 6;
const WHATSAPP_NUMBER = "66839852000";

type CarModalProps = {
  car: Car;
  delivery: Delivery;
  days: number;
  range: { start: Date; end: Date };
  pickupZone: Zone;
  returnZone: Zone;
  prefillComment?: string;
  onClose: () => void;
};

type Step = "car" | "request" | "thanks" | "error";
type Messenger = "whatsapp" | "telegram" | "max";

function formatPhoneInput(raw: string) {
  const hasPlus = raw.trim().startsWith("+");
  const digits = raw.replace(/\D/g, "").slice(0, 15);
  const grouped = digits.replace(/(\d{1,3})(?=(\d{3})+(?!\d))/g, "$1 ");
  return (hasPlus ? "+" : "") + grouped;
}

function formatDateTime(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function money(value: number) {
  return `฿${value.toLocaleString("ru-RU")}`;
}

export function CarModal({
  car,
  delivery,
  days,
  range,
  pickupZone,
  returnZone,
  prefillComment,
  onClose,
}: CarModalProps) {
  const { locale, t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("car");
  const [washSelected, setWashSelected] = useState(false);
  const [childSeatSelected, setChildSeatSelected] = useState(false);
  const [boosterSelected, setBoosterSelected] = useState(false);
  const [phoneHolderSelected, setPhoneHolderSelected] = useState(false);

  const [photoStatus, setPhotoStatus] = useState<"loading" | "ready">("loading");
  const [photos, setPhotos] = useState<string[]>([]);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [messenger, setMessenger] = useState<Messenger>("whatsapp");
  const [comment, setComment] = useState(prefillComment ?? "");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;

    async function checkPhotos() {
      const indexes = Array.from({ length: MAX_PHOTOS }, (_, index) => index + 1);
      const results = await Promise.all(
        indexes.map(async (index) => {
          try {
            const res = await fetch(`/api/car-image?id=${encodeURIComponent(car.id)}&index=${index}`);
            const data: { url: string | null } = await res.json();
            return data.url;
          } catch {
            return null;
          }
        })
      );
      if (cancelled) return;
      const found = results.filter((value): value is string => value !== null);
      setPhotos(found);
      setActivePhoto(found[0] ?? null);
      setPhotoStatus("ready");
    }

    checkPhotos();
    return () => {
      cancelled = true;
    };
  }, [car.id]);

  const features = translateCarFeatures(getCarFeatures(Number(car.id), car.name), locale);
  const transmissionLabel = translateTransmission(car.transmission, locale, t.cars.automatic);
  const displayName = getDisplayName(Number(car.id), car.name);
  const totalKm = days * 120;
  const rentTotal = car.pricePerPeriodThb;
  const washFee = washSelected ? WASH_FEE : 0;
  const total = rentTotal + delivery.pickupFee + delivery.returnFee + washFee;

  function validate() {
    const nextErrors: { name?: string; phone?: string } = {};
    if (!name.trim()) nextErrors.name = t.carModal.form.nameRequired;
    const digitCount = phone.replace(/\D/g, "").length;
    if (digitCount < 7) nextErrors.phone = t.carModal.form.phoneRequired;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function messengerLabel(value: Messenger) {
    if (value === "whatsapp") return t.carModal.form.whatsapp;
    if (value === "telegram") return t.carModal.form.telegram;
    return t.carModal.form.max;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carName: car.name,
          carClass: t.cars[car.classKey],
          transmission: transmissionLabel,
          pickupZoneName: pickupZone.name[locale],
          pickupDateTime: formatDateTime(range.start),
          returnZoneName: returnZone.name[locale],
          returnDateTime: formatDateTime(range.end),
          days,
          name,
          phone,
          messenger: messengerLabel(messenger),
          comment,
          childSeat: childSeatSelected,
          booster: boosterSelected,
          phoneHolder: phoneHolderSelected,
          rent: rentTotal,
          pickupFee: delivery.pickupFee,
          returnFee: delivery.returnFee,
          washFee,
          total,
          deposit: car.depositThb,
        }),
      });
      if (!res.ok) throw new Error("request failed");
      trackBookingSubmit();
      setStep("thanks");
    } catch {
      setStep("error");
    } finally {
      setSubmitting(false);
    }
  }

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `${car.name} — ${name || "?"} ${phone || ""}`.trim()
  )}`;

  function handleTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < 50) return;
    if (deltaX < 0 && step === "car") setStep("request");
    if (deltaX > 0 && step === "request") setStep("car");
  }

  function renderGallery() {
    if (photoStatus === "loading") {
      return <div className="aspect-[4/3] w-full animate-pulse rounded-xl bg-surface-muted" />;
    }
    if (photos.length === 0 || activePhoto === null) {
      return (
        <div className="relative">
          <PhotoPlaceholder icon="ti-car" className="aspect-[4/3] w-full rounded-xl" />
          {features.highlight && (
            <span className="absolute left-3 top-3 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
              {features.highlight}
            </span>
          )}
        </div>
      );
    }
    return (
      <>
        <div className="relative mb-2 aspect-[4/3] w-full overflow-hidden rounded-xl bg-surface-muted">
          <Image
            src={activePhoto}
            alt={car.name}
            fill
            sizes="(max-width: 640px) 100vw, 560px"
            className="object-cover"
          />
          {features.highlight && (
            <span className="absolute left-3 top-3 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
              {features.highlight}
            </span>
          )}
        </div>
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {photos.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => setActivePhoto(url)}
                className={`relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 cursor-pointer ${
                  url === activePhoto ? "border-accent" : "border-transparent"
                }`}
              >
                <Image src={url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </>
    );
  }

  function renderSummary() {
    return (
      <div className="flex h-full flex-col justify-between rounded-2xl border border-border bg-surface-muted p-4 sm:p-5">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-foreground-muted">{t.carModal.summary.rent(days)}</span>
            <span className="whitespace-nowrap font-medium text-foreground">{money(rentTotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-foreground-muted">{t.carModal.summary.pickupDelivery}</span>
            <span className="whitespace-nowrap font-medium text-foreground">{money(delivery.pickupFee)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-foreground-muted">{t.carModal.summary.returnDelivery}</span>
            <span className="whitespace-nowrap font-medium text-foreground">{money(delivery.returnFee)}</span>
          </div>
          {washSelected && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-foreground-muted">{t.carModal.summary.wash}</span>
              <span className="whitespace-nowrap font-medium text-foreground">{money(WASH_FEE)}</span>
            </div>
          )}
          <div className="my-2 h-px bg-border" />
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-medium text-foreground">{t.carModal.summary.total}</span>
            <span className="whitespace-nowrap text-2xl font-bold text-foreground">{money(total)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-foreground-faint">
            <span>{t.carModal.summary.deposit}</span>
            <span className="whitespace-nowrap">{money(car.depositThb)}</span>
          </div>
        </div>

        {step === "car" && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setStep("request")}
              className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover cursor-pointer"
            >
              {t.carModal.nextStep}
            </button>
            <p className="mt-2 text-center text-xs text-foreground-faint">{t.carModal.payNote}</p>
          </div>
        )}
      </div>
    );
  }

  function renderCarStep() {
    return (
      <div className="space-y-6">
        <div>{renderGallery()}</div>

        <div>
          <h2 className="text-lg font-semibold text-foreground">{displayName}</h2>
          <p className="text-sm text-foreground-faint">
            {t.cars[car.classKey]} · {transmissionLabel}
          </p>
          <p className="mt-1 text-sm text-foreground-faint">
            {features.bodyType} · {features.engine} · {t.cars.year(features.year)}
            {features.seats && ` · ${t.cars.seats(features.seats)}`}
          </p>
          <p className="mt-2 text-sm text-foreground-muted">{features.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {features.features.map((spec) => (
            <div key={spec.label} className="flex items-center gap-2 text-xs text-foreground-muted">
              <span aria-hidden="true">{spec.icon}</span>
              <span>{spec.label}</span>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-sm font-medium text-foreground">{t.carModal.freeOptionsTitle}</h3>
          <p className="mb-2 text-xs text-foreground-faint">{t.carModal.freeOptionsSubtitle}</p>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border p-3 text-sm hover:bg-surface-muted">
              <input
                type="checkbox"
                checked={childSeatSelected}
                onChange={(event) => setChildSeatSelected(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-accent"
              />
              <span>
                <span className="block font-medium text-foreground">{t.carModal.freeOptions.childSeatTitle}</span>
                <span className="block text-xs text-foreground-faint">{t.carModal.freeOptions.childSeatNote}</span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border p-3 text-sm hover:bg-surface-muted">
              <input
                type="checkbox"
                checked={boosterSelected}
                onChange={(event) => setBoosterSelected(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-accent"
              />
              <span>
                <span className="block font-medium text-foreground">{t.carModal.freeOptions.boosterTitle}</span>
                <span className="block text-xs text-foreground-faint">{t.carModal.freeOptions.boosterNote}</span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border p-3 text-sm hover:bg-surface-muted">
              <input
                type="checkbox"
                checked={phoneHolderSelected}
                onChange={(event) => setPhoneHolderSelected(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-accent"
              />
              <span className="font-medium text-foreground">{t.carModal.freeOptions.phoneHolderTitle}</span>
            </label>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border p-3 text-sm hover:bg-surface-muted">
              <input
                type="checkbox"
                checked={washSelected}
                onChange={(event) => setWashSelected(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-accent"
              />
              <span>
                <span className="block font-medium text-foreground">{t.carModal.washTitle}</span>
                <span className="block text-xs text-foreground-faint">{t.carModal.washNote}</span>
              </span>
            </label>

            <p className="px-1 text-sm text-foreground-muted">{t.carModal.freeOptions.guide}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2 text-foreground-muted">
            <i className="ti ti-map-pin mt-0.5 text-accent" aria-hidden="true" />
            <span>
              <span className="font-medium text-foreground">{t.carModal.pickupLabel}:</span>{" "}
              {pickupZone.name[locale]} · {formatDateTime(range.start)}
            </span>
          </div>
          <div className="flex items-start gap-2 text-foreground-muted">
            <i className="ti ti-map-pin mt-0.5 text-accent" aria-hidden="true" />
            <span>
              <span className="font-medium text-foreground">{t.carModal.returnLabel}:</span>{" "}
              {returnZone.name[locale]} · {formatDateTime(range.end)}
            </span>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-foreground">{t.carModal.termsTitle}</h3>

          {days >= 5 ? (
            <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-green-700">
                <i className="ti ti-check" aria-hidden="true" />
                {t.carModal.mileage.unlimitedTitle}
              </p>
              <p className="mt-0.5 text-xs text-green-700/80">{t.carModal.mileage.unlimitedNote}</p>
            </div>
          ) : (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-amber-800">
                <i className="ti ti-alert-triangle" aria-hidden="true" />
                {t.carModal.mileage.limitedTitle(totalKm, days)}
              </p>
              <p className="mt-0.5 text-xs text-amber-800/80">{t.carModal.mileage.overageNote}</p>
              <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-800/80">
                <span aria-hidden="true">💡</span>
                <span>{t.carModal.mileage.tip}</span>
              </p>
            </div>
          )}

          <ul className="space-y-1.5 text-sm text-foreground-muted">
            <li className="flex items-start gap-2">
              <i className="ti ti-check mt-0.5 text-green-600" aria-hidden="true" />
              <span>{t.carModal.terms.area}</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="ti ti-x mt-0.5 text-red-600" aria-hidden="true" />
              <span>{t.carModal.terms.noFerry}</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="ti ti-x mt-0.5 text-red-600" aria-hidden="true" />
              <span>{t.carModal.terms.noOtherProvinces}</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-foreground">{t.carModal.driverTitle}</h3>
          <ul className="space-y-1.5 text-sm text-foreground-muted">
            <li className="flex items-center gap-2">
              <i className="ti ti-id text-accent" aria-hidden="true" />
              <span>{t.carModal.driver.age}</span>
            </li>
            <li className="flex items-center gap-2">
              <i className="ti ti-clock text-accent" aria-hidden="true" />
              <span>{t.carModal.driver.experience}</span>
            </li>
            <li className="flex items-center gap-2">
              <i className="ti ti-passport text-accent" aria-hidden="true" />
              <span>{t.carModal.driver.documents}</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  function renderRequestStep() {
    const messengerOptions: { value: Messenger; label: string }[] = [
      { value: "whatsapp", label: t.carModal.form.whatsapp },
      { value: "telegram", label: t.carModal.form.telegram },
      { value: "max", label: t.carModal.form.max },
    ];

    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t.carModal.form.namePlaceholder}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        <div>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(event) => setPhone(formatPhoneInput(event.target.value))}
            placeholder={t.carModal.form.phonePlaceholder}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
          />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
        </div>

        <div>
          <p className="mb-1.5 text-xs text-foreground-faint">{t.carModal.form.messengerLabel}</p>
          <div className="flex flex-wrap gap-2">
            {messengerOptions.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${
                  messenger === option.value
                    ? "border-accent bg-accent-soft text-accent-soft-foreground"
                    : "border-border text-foreground-muted hover:bg-surface-muted"
                }`}
              >
                <input
                  type="radio"
                  name="messenger"
                  value={option.value}
                  checked={messenger === option.value}
                  onChange={() => setMessenger(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={t.carModal.form.commentPlaceholder}
          rows={3}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-60 cursor-pointer"
        >
          {t.carModal.form.submit}
        </button>
        <p className="text-center text-xs text-[#9CA3AF]">
          {t.carModal.form.consentPrefix}{" "}
          <Link href="/terms" className="text-[#0EA5C9] hover:underline">
            {t.carModal.form.consentTermsLabel}
          </Link>{" "}
          {t.carModal.form.consentAnd}{" "}
          <Link href="/privacy" className="text-[#0EA5C9] hover:underline">
            {t.carModal.form.consentPrivacyLabel}
          </Link>
        </p>
        <p className="text-center text-xs text-foreground-faint">{t.carModal.form.submitNote}</p>
      </form>
    );
  }

  function renderThanks() {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <i className="ti ti-check text-2xl" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{t.carModal.thanks.title}</h2>
        <p className="max-w-sm text-sm text-foreground-muted">
          {t.carModal.thanks.text(messengerLabel(messenger))}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted cursor-pointer"
        >
          {t.carModal.thanks.back}
        </button>
      </div>
    );
  }

  function renderError() {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <i className="ti ti-alert-triangle text-2xl" aria-hidden="true" />
        </div>
        <p className="max-w-sm text-sm text-foreground-muted">{t.carModal.error.title}</p>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
        >
          <i className="ti ti-brand-whatsapp" aria-hidden="true" />
          {t.carModal.error.whatsapp}
        </a>
        <button
          type="button"
          onClick={() => setStep("request")}
          className="text-sm text-foreground-faint underline hover:text-foreground"
        >
          {t.carModal.thanks.back}
        </button>
      </div>
    );
  }

  const showTabs = step === "car" || step === "request";
  const showSummary = step === "car" || step === "request";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`relative flex h-full w-full flex-col overflow-hidden bg-surface transition-all duration-200 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-[900px] sm:rounded-2xl ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
          {showTabs ? (
            <div className="flex gap-1 rounded-lg bg-surface-muted p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setStep("car")}
                className={`rounded-md px-3 py-1.5 cursor-pointer ${
                  step === "car" ? "bg-surface text-foreground shadow-sm" : "text-foreground-faint"
                }`}
              >
                ① {t.carModal.stepCar}
              </button>
              <button
                type="button"
                onClick={() => setStep("request")}
                className={`rounded-md px-3 py-1.5 cursor-pointer ${
                  step === "request" ? "bg-surface text-foreground shadow-sm" : "text-foreground-faint"
                }`}
              >
                ② {t.carModal.stepRequest}
              </button>
            </div>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={t.carModal.close}
            className="rounded-full p-1.5 text-foreground-faint hover:bg-surface-muted cursor-pointer"
          >
            <i className="ti ti-x text-lg" aria-hidden="true" />
          </button>
        </div>

        {showSummary ? (
          <div
            className="grid flex-1 grid-cols-1 overflow-hidden sm:grid-cols-[1.6fr_1fr]"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              {step === "car" ? renderCarStep() : renderRequestStep()}
            </div>
            <div className="overflow-y-auto border-t border-border px-4 py-4 sm:overflow-visible sm:border-t-0 sm:border-l sm:px-5 sm:py-5">
              {renderSummary()}
            </div>
          </div>
        ) : step === "thanks" ? (
          renderThanks()
        ) : (
          renderError()
        )}
      </div>
    </div>
  );
}
