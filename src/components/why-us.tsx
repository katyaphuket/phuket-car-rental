"use client";

import { useLocale } from "@/lib/locale-context";
import { SectionHeading } from "./section-heading";

export function WhyUs() {
  const { t } = useLocale();

  return (
    <section id="why-us" className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <SectionHeading eyebrow={t.whyUs.eyebrow} title={t.whyUs.title} align="center" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {t.whyUs.items.map((item) => (
          <div
            key={item.title}
            className="card-elevate flex gap-3.5 rounded-2xl border border-border bg-surface p-5"
          >
            <i className="ti ti-circle-check flex-none text-xl text-accent" aria-hidden="true" />
            <div>
              <div className="mb-1 text-sm font-medium text-foreground">{item.title}</div>
              <p className="text-xs leading-relaxed text-foreground-muted">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
