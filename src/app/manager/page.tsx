import type { Metadata } from "next";
import { cookies } from "next/headers";
import { isManagerCookieValid, isManagerPasswordSet, MANAGER_COOKIE } from "@/lib/offer";
import { ManagerLogin } from "@/components/manager/manager-login";
import { OfferBuilder } from "@/components/manager/offer-builder";
import { loadLeadPrefill } from "@/lib/amo-offer-link";
import { isOfferSendConfigured } from "@/lib/offer-send";

export const metadata: Metadata = {
  title: "Подборка для клиента — KataCars",
  robots: { index: false, follow: false },
};

type ManagerPageProps = { searchParams: Promise<{ lead?: string }> };

export default async function ManagerPage({ searchParams }: ManagerPageProps) {
  if (!isManagerPasswordSet()) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center text-sm text-foreground-muted">
        Страница выключена: на хостинге не задан пароль менеджеров (MANAGER_PASSWORD).
      </main>
    );
  }

  const cookieStore = await cookies();
  const loggedIn = isManagerCookieValid(cookieStore.get(MANAGER_COOKIE)?.value);

  if (!loggedIn) return <ManagerLogin />;

  // Открыли из карточки сделки amoCRM — подставляем даты, имя и район из сделки.
  const { lead } = await searchParams;
  const prefill = await loadLeadPrefill(lead);
  return <OfferBuilder key={prefill?.leadId ?? "new"} prefill={prefill} canSend={isOfferSendConfigured()} />;
}
