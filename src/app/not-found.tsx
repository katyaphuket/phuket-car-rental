import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader forceSolid />

      <main className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-32 text-center">
        <span className="font-display text-[clamp(3rem,8vw,6rem)] font-extrabold text-[#0EA5C9]">
          404
        </span>
        <h1 className="mt-2 font-display text-[clamp(1.5rem,3vw,2rem)] font-semibold text-foreground">
          Страница не найдена
        </h1>
        <p className="mt-3 max-w-md text-foreground-muted">
          Возможно, страница была перемещена или удалена. Проверьте адрес или
          вернитесь на главную.
        </p>
        <Link
          href="/"
          className="mt-8 cursor-pointer rounded-lg bg-[#0EA5C9] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 ease-[ease] hover:-translate-y-px hover:bg-[#0284C7] hover:shadow-[0_4px_12px_rgba(14,165,201,0.3)]"
        >
          На главную
        </Link>
      </main>

      <SiteFooter />
    </div>
  );
}
