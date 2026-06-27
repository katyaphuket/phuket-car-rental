"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import { Logo } from "./logo";

export function SiteFooter() {
  const { t } = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo dark />
          <p className="mt-1 max-w-xs text-xs text-foreground-faint">{t.footer.tagline}</p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex items-center gap-1.5 text-xs text-foreground-faint">
            <Logo dark className="w-auto scale-75" />
            <span>
              · {year} · {t.footer.rights}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-[#9CA3AF]">
            <Link href="/terms" className="hover:text-[#0EA5C9]">
              {t.footer.termsLink}
            </Link>
            <Link href="/privacy" className="hover:text-[#0EA5C9]">
              {t.footer.privacyLink}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
