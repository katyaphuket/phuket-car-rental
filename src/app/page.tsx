"use client";

import { useState } from "react";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { BookingSearch } from "@/components/booking-search";
import { CarsSection } from "@/components/cars-section";
import { Freebies } from "@/components/freebies";
import { WhyUs } from "@/components/why-us";
import { HowToRent } from "@/components/how-to-rent";
import { Reviews } from "@/components/reviews";
import { Contacts } from "@/components/contacts";
import { SiteFooter } from "@/components/site-footer";
import { useLocale } from "@/lib/locale-context";

const PICKUP_HOUR = 12;

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(PICKUP_HOUR, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function defaultRange() {
  const start = addDays(startOfDay(new Date()), 1);
  return { start, end: addDays(start, 7) };
}

export default function Home() {
  const { t } = useLocale();
  const [range, setRange] = useState(defaultRange);
  const [searchToken, setSearchToken] = useState(0);
  const [pickupZoneId, setPickupZoneId] = useState("kata");
  const [returnZoneId, setReturnZoneId] = useState("kata");
  const [prefillComment, setPrefillComment] = useState("");

  function handleSearch() {
    setSearchToken((token) => token + 1);
  }

  function handlePickupOnly() {
    setPickupZoneId("kata");
    setReturnZoneId("kata");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative flex min-h-screen flex-col text-center">
          <Image src="/hero-bg.jpg" alt="" fill priority className="-z-10 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/50 to-black/30" />

          <div className="relative z-10 flex min-h-screen flex-col items-center px-6 pb-4 pt-20 sm:pt-24">
            <div className="flex flex-1 flex-col items-center justify-center">
              <div
                className="mb-2 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-white/80"
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
              >
                <i className="ti ti-map-pin text-sm" aria-hidden="true" />
                {t.hero.eyebrow}
              </div>

              <h1 className="mx-auto flex flex-wrap items-baseline justify-center gap-x-2 text-center font-display leading-tight text-white">
                <span className="text-[clamp(2.5rem,5vw,4rem)] font-light">{t.hero.titleLine1}</span>
                <span className="text-[clamp(3.5rem,6.5vw,5.5rem)] font-extrabold">{t.hero.titleLine2}</span>
              </h1>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {[t.hero.badges.noDeposit, t.hero.badges.insurance, t.hero.badges.support].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-white/30 bg-black/30 px-3 py-1.5 text-xs text-white sm:text-sm"
                  >
                    {label}
                  </span>
                ))}
              </div>

              <div className="mt-5 w-full max-w-2xl">
                <p className="mb-2 text-center text-[0.95rem] text-white">{t.hero.formIntro}</p>
                <BookingSearch
                  range={range}
                  onChange={setRange}
                  onTimeNoteChange={setPrefillComment}
                  pickupZoneId={pickupZoneId}
                  returnZoneId={returnZoneId}
                  onPickupZoneChange={setPickupZoneId}
                  onReturnZoneChange={setReturnZoneId}
                  onSubmit={handleSearch}
                />
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 pt-4">
              <div className="rounded-full bg-black/30 px-4 py-1.5 text-xs text-white backdrop-blur-sm sm:text-sm">
                <span aria-hidden="true">★★★★★</span> {t.hero.social.rating} ·{" "}
                <span aria-hidden="true">💬</span> {t.hero.social.reviews} ·{" "}
                <span aria-hidden="true">🚗</span> {t.hero.social.fleet}
              </div>
              <i className="ti ti-chevron-down animate-bounce text-xl text-white" aria-hidden="true" />
            </div>
          </div>
        </section>

        <CarsSection
          range={range}
          searchToken={searchToken}
          pickupZoneId={pickupZoneId}
          returnZoneId={returnZoneId}
          onPickupOnly={handlePickupOnly}
          prefillComment={prefillComment}
        />

        <Freebies />
        <WhyUs />
        <HowToRent />
        <Reviews />
        <Contacts />
      </main>

      <SiteFooter />
    </div>
  );
}
