import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fetchFreeCars } from "@/lib/rentprog";
import { getCarFeatures, translateCarFeatures } from "@/lib/car-features";
import { ZONES } from "@/lib/delivery-rules";
import {
  decodeOffer,
  formatDay,
  formatRange,
  formatTime,
  isOfferExpired,
  listCarPhotos,
  messengerLink,
  type Offer,
  type OfferZone,
} from "@/lib/offer";
import { OFFER_COPY } from "@/lib/offer-copy";
import { Logo } from "@/components/logo";
import { ChooseButton } from "@/components/offer/choose-button";

const AVAILABILITY_TIMEOUT_MS = 4000;

type PageProps = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const offer = decodeOffer(token);
  if (!offer) return { title: "Phuket Car Rental", robots: { index: false, follow: false } };

  const copy = OFFER_COPY[offer.locale];
  const title = `${copy.titleFor(offer.name)} · ${formatRange(offer.start, offer.end, offer.locale)}`;
  const from = Math.min(...offer.cars.map((car) => car.pricePerDay));
  const image = offer.cars.map((car) => listCarPhotos(car.id)[0]).find(Boolean) ?? "/hero-bg.jpg";

  return {
    title,
    description: copy.metaDescription(offer.cars.length, from),
    robots: { index: false, follow: false },
    alternates: { canonical: null },
    openGraph: {
      title,
      description: copy.metaDescription(offer.cars.length, from),
      images: [image],
      type: "website",
      siteName: "Phuket Car Rental",
    },
    twitter: { card: "summary_large_image", title, images: [image] },
  };
}

// Какие машины из подборки ещё свободны. Если RentProg не ответил быстро — считаем, что все.
async function findTakenCars(offer: Offer) {
  try {
    const free = await Promise.race([
      fetchFreeCars(offer.start, offer.end),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), AVAILABILITY_TIMEOUT_MS)),
    ]);
    if (!free) return new Set<number>();
    const freeIds = new Set(free.map((car) => car.id));
    return new Set(offer.cars.filter((car) => !freeIds.has(car.id)).map((car) => car.id));
  } catch (error) {
    console.error("Offer page: RentProg free_cars failed:", error);
    return new Set<number>();
  }
}

function money(value: number, locale: "ru" | "en") {
  return `${value.toLocaleString(locale === "en" ? "en-US" : "ru-RU")} ฿`;
}

function zoneName(zone: OfferZone | undefined, locale: "ru" | "en") {
  return zone ? ZONES.find((item) => item.id === zone.id)?.name[locale] ?? zone.id : null;
}

export default async function OfferPage({ params }: PageProps) {
  const { token } = await params;
  const offer = decodeOffer(token);

  if (!offer) {
    const copy = OFFER_COPY.ru;
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <Logo dark />
        <h1 className="text-lg font-semibold text-foreground">{copy.notFoundTitle}</h1>
        <p className="text-sm text-foreground-muted">{copy.notFoundText}</p>
        <a href={messengerLink("whatsapp", "")} className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground">
          WhatsApp
        </a>
      </main>
    );
  }

  const { locale } = offer;
  const copy = OFFER_COPY[locale];
  const expired = isOfferExpired(offer);
  const taken = expired ? new Set<number>() : await findTakenCars(offer);
  const range = formatRange(offer.start, offer.end, locale);
  const pickupName = zoneName(offer.pickup, locale);
  const dropoffName = zoneName(offer.dropoff, locale);
  const deliveryFees = (offer.pickup?.fee ?? 0) + (offer.dropoff?.fee ?? 0);
  const contactHref = messengerLink(offer.messenger, locale === "en" ? `Hi! About my car selection for ${range}` : `Здравствуйте! По поводу подборки на ${range}`);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6">
      <header className="flex items-center justify-between">
        <Logo dark />
        <a href={contactHref} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-accent">
          {copy.contactShort}
        </a>
      </header>

      <h1 className="mt-8 text-2xl font-bold text-foreground">{copy.titleFor(offer.name)}</h1>
      <p className="mt-1 text-sm text-foreground-muted">{copy.subtitle}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-border bg-surface p-4 text-sm">
        <div>
          <p className="text-xs text-foreground-muted">{copy.pickup}</p>
          <p className="font-semibold text-foreground">{formatDay(offer.start, locale)}, {formatTime(offer.start)}</p>
          {pickupName && <p className="text-xs text-foreground-muted">{pickupName}</p>}
        </div>
        <div>
          <p className="text-xs text-foreground-muted">{copy.dropoff}</p>
          <p className="font-semibold text-foreground">{formatDay(offer.end, locale)}, {formatTime(offer.end)}</p>
          {dropoffName && <p className="text-xs text-foreground-muted">{dropoffName}</p>}
        </div>
        <p className="col-span-2 border-t border-border pt-2 text-xs text-foreground-muted">
          {copy.days(offer.days)} · {copy.mileage(offer.days)}
        </p>
      </div>

      {expired && (
        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">{copy.expiredTitle}</p>
          <p className="mt-1">{copy.expiredText}</p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-6">
        {offer.cars.map((car, carIndex) => {
          const features = translateCarFeatures(getCarFeatures(car.id, car.name ?? ""), locale);
          const photos = listCarPhotos(car.id);
          const rent = car.pricePerDay * offer.days;
          // Менеджер снизил цену — показываем обычную зачёркнутой.
          const oldPrice = car.listPrice && car.listPrice > car.pricePerDay ? car.listPrice : undefined;
          const discountPercent = oldPrice ? Math.round((1 - car.pricePerDay / oldPrice) * 100) : 0;
          const isTaken = taken.has(car.id);
          const chooseHref = messengerLink(offer.messenger, copy.chooseMessage(features.displayName, range));

          return (
            <article key={car.id} className={`overflow-hidden rounded-2xl border border-border bg-surface ${isTaken ? "opacity-60" : ""}`}>
              {photos.length > 0 ? (
                <div className="flex snap-x snap-mandatory overflow-x-auto">
                  {photos.map((src, index) => (
                    <div key={src} className={`relative aspect-[4/3] shrink-0 snap-start ${photos.length > 1 ? "w-[88%] sm:w-[80%]" : "w-full"}`}>
                      <Image
                        src={src}
                        alt={`${features.displayName} — ${copy.photo(index + 1)}`}
                        fill
                        sizes="(max-width: 672px) 90vw, 560px"
                        className="object-cover"
                        priority={carIndex === 0 && index === 0}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-surface-muted text-4xl">🚗</div>
              )}
              {photos.length > 1 && (
                <p className="px-4 pt-2 text-right text-xs text-foreground-faint">← {photos.length} {locale === "en" ? "photos" : "фото"} →</p>
              )}

              <div className="p-4 pt-2">
                <h2 className="text-lg font-bold text-foreground">{features.displayName}</h2>
                <p className="text-sm text-foreground-muted">
                  {[features.carClass, features.year, features.bodyType, features.engine, features.seats && features.seats !== 5 ? copy.seats(features.seats) : null]
                    .filter((item, index, list) => item && list.findIndex((other) => String(other).toLowerCase() === String(item).toLowerCase()) === index)
                    .join(" · ")}
                </p>

                {features.features.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {features.features.map((feature) => (
                      <span key={feature.label} className="rounded-full bg-surface-muted px-2.5 py-1 text-xs text-foreground">
                        <span className="mr-1">{feature.icon}</span>{feature.label}
                      </span>
                    ))}
                  </div>
                )}

                {discountPercent >= 1 && (
                  <p className="mt-3 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {copy.personalPrice(discountPercent)}
                  </p>
                )}

                {features.description && <p className="mt-3 text-sm text-foreground-muted">{features.description}</p>}

                <dl className="mt-4 space-y-1.5 rounded-xl bg-background p-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-foreground-muted">{copy.rent(offer.days)}</dt>
                    <dd className="text-foreground">
                      {oldPrice && <s className="mr-1.5 text-xs text-foreground-faint">{money(oldPrice * offer.days, locale)}</s>}
                      {money(rent, locale)} <span className="text-xs text-foreground-muted">({money(car.pricePerDay, locale)}{copy.perDay})</span>
                    </dd>
                  </div>
                  {offer.pickup && (
                    <div className="flex justify-between">
                      <dt className="text-foreground-muted">{copy.deliveryPickup}</dt>
                      <dd className="text-foreground">{offer.pickup.fee ? money(offer.pickup.fee, locale) : copy.free}</dd>
                    </div>
                  )}
                  {offer.dropoff && (
                    <div className="flex justify-between">
                      <dt className="text-foreground-muted">{copy.deliveryReturn}</dt>
                      <dd className="text-foreground">{offer.dropoff.fee ? money(offer.dropoff.fee, locale) : copy.free}</dd>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border pt-1.5 text-base font-bold">
                    <dt className="text-foreground">{copy.total}</dt>
                    <dd className="text-foreground">{money(rent + deliveryFees, locale)}</dd>
                  </div>
                  <div className="flex justify-between text-xs">
                    <dt className="text-foreground-muted">{copy.deposit}</dt>
                    <dd className="text-foreground-muted">{money(car.deposit, locale)}</dd>
                  </div>
                </dl>

                <div className="mt-4">
                  {isTaken ? (
                    <p className="rounded-xl bg-surface-muted px-4 py-3 text-center text-sm text-foreground-muted">{copy.taken}</p>
                  ) : (
                    <ChooseButton href={chooseHref} label={copy.choose} token={token} carId={car.id} />
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-surface p-4">
        <ul className="space-y-1.5 text-sm text-foreground">
          {copy.included.map((item) => (
            <li key={item}>✓ {item}</li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <a
            href={contactHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-xl border border-accent px-4 py-3 text-center text-sm font-semibold text-accent"
          >
            {copy.contact}
          </a>
          <Link href="/" className="flex-1 rounded-xl border border-border px-4 py-3 text-center text-sm text-foreground">
            {copy.allCars}
          </Link>
        </div>
      </section>
    </main>
  );
}
