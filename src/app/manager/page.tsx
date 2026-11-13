import type { Metadata } from "next";
import { cookies } from "next/headers";
import { isManagerCookieValid, isManagerPasswordSet, MANAGER_COOKIE } from "@/lib/offer";
import { ManagerLogin } from "@/components/manager/manager-login";
import { OfferBuilder } from "@/components/manager/offer-builder";

export const metadata: Metadata = {
  title: "Подборка для клиента — KataCars",
  robots: { index: false, follow: false },
};

export default async function ManagerPage() {
  if (!isManagerPasswordSet()) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center text-sm text-foreground-muted">
        Страница выключена: на хостинге не задан пароль менеджеров (MANAGER_PASSWORD).
      </main>
    );
  }

  const cookieStore = await cookies();
  const loggedIn = isManagerCookieValid(cookieStore.get(MANAGER_COOKIE)?.value);

  return loggedIn ? <OfferBuilder /> : <ManagerLogin />;
}
