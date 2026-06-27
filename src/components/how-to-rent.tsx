"use client";

import { useLocale } from "@/lib/locale-context";

export function HowToRent() {
  const { t } = useLocale();

  return (
    <section id="how-to" className="bg-[#E8F4F8] px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="mb-2.5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-[#0EA5C9]">
            <span className="h-px w-5 bg-[#0EA5C9]" />
            {t.howTo.eyebrow}
          </div>
          <h2 className="font-display text-2xl tracking-tight text-[#1C1C1E] sm:text-3xl">
            {t.howTo.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {t.howTo.steps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="font-display text-4xl font-medium text-[#0EA5C9]">{index + 1}</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0EA5C9]/15 text-[#0EA5C9]">
                  <i className={`ti ${step.icon} text-xl`} aria-hidden="true" />
                </div>
              </div>
              <div className="mb-1.5 text-sm font-medium text-[#1C1C1E]">{step.title}</div>
              <p className="text-xs leading-relaxed text-foreground-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
