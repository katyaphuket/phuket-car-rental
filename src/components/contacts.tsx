"use client";

import { useState } from "react";
import { useLocale } from "@/lib/locale-context";

const PHONE_DISPLAY = "+66 83 985 2000";
const PHONE_WHATSAPP = "66839852000";
const TELEGRAM_HANDLE = "katacars";
const MAP_QUERY = encodeURIComponent("Ibis Phuket Kata, Kata Beach, Phuket");

export function Contacts() {
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section id="contacts" className="bg-[#1C1C1E] px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="mb-2.5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-accent">
            <span className="h-px w-5 bg-accent" />
            {t.contacts.eyebrow}
          </div>
          <h2 className="font-display text-2xl tracking-tight text-white sm:text-3xl">
            {t.contacts.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_1fr]">
          <div className="rounded-2xl border border-white/20 p-5">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="mb-1 text-xs text-white/60">{t.contacts.phoneLabel}</dt>
                <dd>
                  <a href={`tel:${PHONE_DISPLAY.replace(/\s/g, "")}`} className="font-medium text-white hover:text-accent">
                    {PHONE_DISPLAY}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-xs text-white/60">{t.contacts.addressLabel}</dt>
                <dd className="text-white/80">{t.contacts.address}</dd>
              </div>
              <div>
                <dt className="mb-1 text-xs text-white/60">{t.contacts.hoursLabel}</dt>
                <dd className="text-white/80">{t.contacts.hoursValue}</dd>
              </div>
            </dl>

            <div className="mt-5 flex gap-2">
              <a
                href={`https://t.me/${TELEGRAM_HANDLE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white py-2 text-sm font-medium text-white hover:bg-white/10"
              >
                <i className="ti ti-brand-telegram text-base" aria-hidden="true" />
                Telegram
              </a>
              <a
                href={`https://wa.me/${PHONE_WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white py-2 text-sm font-medium text-white hover:bg-white/10"
              >
                <i className="ti ti-brand-whatsapp text-base" aria-hidden="true" />
                WhatsApp
              </a>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/20 lg:col-span-1">
            <iframe
              title="Google Maps"
              src={`https://www.google.com/maps?q=${MAP_QUERY}&output=embed`}
              className="h-full min-h-[260px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="rounded-2xl border border-white/20 p-5">
            <div className="mb-3 text-sm font-medium text-white">{t.contacts.formTitle}</div>
            {submitted ? (
              <p className="text-sm text-white/80">{t.contacts.submitted}</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-2.5">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t.contacts.namePlaceholder}
                  className="w-full rounded-lg border border-white/30 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/50 outline-none focus:border-accent"
                />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder={t.contacts.phonePlaceholder}
                  className="w-full rounded-lg border border-white/30 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/50 outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-accent py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover cursor-pointer"
                >
                  {t.contacts.submit}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
