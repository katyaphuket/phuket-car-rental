"use client";

import { useState } from "react";

export function ManagerLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(false);
    const res = await fetch("/api/manager/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    if (res?.ok) {
      window.location.reload();
      return;
    }
    setBusy(false);
    setError(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <form onSubmit={submit} className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-foreground">Подборка для клиента</h1>
        <p className="mt-1 text-sm text-foreground-muted">Вход для менеджеров KataCars</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Пароль"
          className="mt-5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
        {error && <p className="mt-2 text-sm text-red-600">Неверный пароль</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="mt-4 w-full cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
        >
          {busy ? "Проверяю…" : "Войти"}
        </button>
      </form>
    </main>
  );
}
