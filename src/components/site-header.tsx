"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { Logo } from "./logo";

type SiteHeaderProps = {
  forceSolid?: boolean;
};

export function SiteHeader({ forceSolid = false }: SiteHeaderProps) {
  const { locale, setLocale, t } = useLocale();
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolledPast(window.scrollY > 40);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrolled = forceSolid || scrolledPast;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "border-b border-border/70 bg-background/85 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Logo dark={scrolled} />

        <div className="flex items-center gap-7">
          <nav
            className={`hidden items-center gap-7 text-sm transition-colors duration-300 md:flex ${
              scrolled ? "text-foreground-muted" : "text-white/90"
            }`}
          >
            <a href="/#fleet" className={scrolled ? "hover:text-foreground" : "hover:text-white"}>
              {t.nav.fleet}
            </a>
            <a href="/terms" className={scrolled ? "hover:text-foreground" : "hover:text-white"}>
              {t.nav.terms}
            </a>
            <a href="/#contacts" className={scrolled ? "hover:text-foreground" : "hover:text-white"}>
              {t.nav.contacts}
            </a>
          </nav>

          <div
            className={`flex overflow-hidden rounded-full border text-xs transition-colors duration-300 ${
              scrolled ? "border-border" : "border-white/40"
            }`}
          >
            <button
              type="button"
              onClick={() => setLocale("ru")}
              className={`px-3 py-1 cursor-pointer ${
                locale === "ru"
                  ? scrolled
                    ? "bg-foreground text-background"
                    : "border border-accent bg-white text-foreground"
                  : scrolled
                    ? "text-foreground-muted"
                    : "text-white/80"
              }`}
            >
              RU
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`px-3 py-1 cursor-pointer ${
                locale === "en"
                  ? scrolled
                    ? "bg-foreground text-background"
                    : "border border-accent bg-white text-foreground"
                  : scrolled
                    ? "text-foreground-muted"
                    : "text-white/80"
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
