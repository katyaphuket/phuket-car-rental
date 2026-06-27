"use client";

import { useLocale } from "@/lib/locale-context";
import { SectionHeading } from "./section-heading";

export function Freebies() {
  const { t } = useLocale();

  return (
    <section className="bg-accent-soft px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow={t.freebies.eyebrow} title={t.freebies.title} align="center" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {t.freebies.items.map((item) => (
            <div
              key={item.title}
              className="card-elevate rounded-2xl border-2 border-accent bg-surface p-6 text-center"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <i className={`ti ${item.icon} text-xl`} aria-hidden="true" />
              </div>
              <div className="mb-2 text-sm font-medium text-foreground">{item.title}</div>
              <div className="text-xl font-medium text-accent">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
