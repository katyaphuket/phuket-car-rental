"use client";

import { useRef } from "react";
import { useLocale } from "@/lib/locale-context";

const OVERALL_RATING = 4.8;
const REVIEW_COUNT = 241;

function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5 text-sm leading-none text-accent" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <span key={index}>★</span>
      ))}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Reviews() {
  const { t } = useLocale();
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollByCard(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("[data-review-card]");
    const cardWidth = card ? card.offsetWidth + 16 : 340;
    track.scrollBy({ left: direction * cardWidth, behavior: "smooth" });
  }

  return (
    <section id="reviews" className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-2.5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-accent">
            <span className="h-px w-5 bg-accent" />
            {t.reviews.eyebrow}
          </div>
          <h2 className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">{t.reviews.title}</h2>
          <div className="mt-2 flex items-center gap-2 text-sm text-foreground-muted">
            <span className="font-medium text-foreground">{OVERALL_RATING.toLocaleString("ru-RU")}</span>
            <Stars />
            <span>{t.reviews.ratingCount(REVIEW_COUNT)}</span>
            <span className="text-foreground-faint">· {t.reviews.source}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a href="#reviews" className="text-sm text-accent hover:underline">
            {t.reviews.readAll}
          </a>
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            className="rounded-full border border-border p-1.5 text-foreground-muted hover:bg-surface-muted cursor-pointer"
            aria-label="Previous review"
          >
            <i className="ti ti-chevron-left" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            className="rounded-full border border-border p-1.5 text-foreground-muted hover:bg-surface-muted cursor-pointer"
            aria-label="Next review"
          >
            <i className="ti ti-chevron-right" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {t.reviews.items.map((review) => (
          <div
            key={review.name}
            data-review-card
            className="card-elevate relative w-[320px] flex-none scroll-ml-6 overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:w-[380px]"
            style={{ scrollSnapAlign: "start" }}
          >
            <i
              className="ti ti-quote absolute -top-2 right-4 text-7xl text-surface-muted"
              aria-hidden="true"
            />

            <div className="relative mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
                {initials(review.name)}
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{review.name}</div>
                <Stars />
              </div>
            </div>

            <p className="relative text-sm leading-relaxed text-foreground-muted">{review.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
