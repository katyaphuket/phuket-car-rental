"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/locale-context";

type ContactMethod = "whatsapp" | "telegram" | "max" | "call";

export function RuAccessForm() {
  const { t } = useLocale();
  const copy = t.fleet.accessIssue;

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [contactMethods, setContactMethods] = useState<ContactMethod[]>([]);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState(false);

  const methodOptions: { value: ContactMethod; label: string }[] = [
    { value: "whatsapp", label: copy.whatsapp },
    { value: "telegram", label: copy.telegram },
    { value: "max", label: copy.max },
    { value: "call", label: copy.call },
  ];

  const canSubmit = name.trim().length > 0 && contact.trim().length > 0 && consent;

  function toggleMethod(value: ContactMethod) {
    setContactMethods((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError(false);
    try {
      const res = await fetch("/api/ru-access-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          contact,
          contactMethods: contactMethods.map((value) => methodOptions.find((option) => option.value === value)?.label ?? value),
        }),
      });
      if (!res.ok) throw new Error("request failed");
      setSubmitted(true);
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <i className="ti ti-check text-2xl" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-foreground">{copy.successTitle}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="mb-6 text-center">
        <p className="text-base font-semibold text-foreground">{copy.title}</p>
        <p className="mt-1 text-sm text-foreground-muted">{copy.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={copy.namePlaceholder}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
          />
          {touched && !name.trim() && <p className="mt-1 text-xs text-red-600">{copy.nameRequired}</p>}
        </div>

        <div>
          <input
            type="text"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            placeholder={copy.contactPlaceholder}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
          />
          {touched && !contact.trim() && <p className="mt-1 text-xs text-red-600">{copy.contactRequired}</p>}
        </div>

        <div>
          <p className="mb-1.5 text-xs text-foreground-faint">{copy.contactMethodLabel}</p>
          <div className="flex flex-wrap gap-2">
            {methodOptions.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${
                  contactMethods.includes(option.value)
                    ? "border-accent bg-accent-soft text-accent-soft-foreground"
                    : "border-border text-foreground-muted hover:bg-surface-muted"
                }`}
              >
                <input
                  type="checkbox"
                  checked={contactMethods.includes(option.value)}
                  onChange={() => toggleMethod(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-xs text-foreground-muted">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0 accent-accent"
          />
          <span>
            {copy.consentPrefix}{" "}
            <Link href="/privacy" className="text-[#0EA5C9] hover:underline">
              {copy.consentLabel}
            </Link>
          </span>
        </label>

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {submitting ? copy.submitting : copy.submit}
        </button>

        {submitError && <p className="text-center text-xs text-red-600">{copy.submitError}</p>}
      </form>
    </div>
  );
}
