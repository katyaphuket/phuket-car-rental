"use client";

import { useEffect } from "react";

// Сообщает сайту, что клиент открыл подборку, — один раз на ссылку в этом браузере.
// Превью ссылок в мессенджерах JavaScript не запускают, поэтому их открытия не считаются.
export function ViewTracker({ token }: { token: string }) {
  useEffect(() => {
    const key = `kc-offer-viewed:${token.slice(-16)}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {
      // без localStorage просто отправим отметку
    }
    // Менеджер, проверяющий свою ссылку, тоже сюда попадёт — отличить его нельзя.
    fetch("/api/offer/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      keepalive: true,
    }).catch(() => {});
  }, [token]);

  return null;
}
