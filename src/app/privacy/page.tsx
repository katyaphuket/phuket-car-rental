"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLocale } from "@/lib/locale-context";
import { privacyContent } from "@/lib/privacy-content";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[1.5rem] font-semibold text-[#0EA5C9]">{children}</h2>;
}

function Section({ children }: { children: React.ReactNode }) {
  return <section className="border-b border-[#E5E7EB] py-12 last:border-b-0">{children}</section>;
}

function MultiLine({ text, className = "" }: { text: string; className?: string }) {
  return (
    <p className={`text-sm text-[#1C1C1E]/80 ${className}`}>
      {text.split("\n\n").map((paragraph, index) => (
        <span key={paragraph}>
          {index > 0 && (
            <>
              <br />
              <br />
            </>
          )}
          {paragraph}
        </span>
      ))}
    </p>
  );
}

function DotList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2.5 text-sm text-[#1C1C1E]/80">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span className="text-[#0EA5C9]">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  const { locale } = useLocale();
  const c = privacyContent[locale];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader forceSolid />

      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-[800px] px-6 pt-32 pb-4">
          <h1 className="font-display text-2xl tracking-tight text-[#1C1C1E] sm:text-3xl">{c.heading}</h1>
          <p className="mt-2 text-sm text-foreground-faint">{c.subheading}</p>
        </div>

        <div className="mx-auto max-w-[800px] px-6 pb-12">
          <Section>
            <SectionHeading>{c.general.title}</SectionHeading>
            <MultiLine text={c.general.text} className="mt-3" />
          </Section>

          <Section>
            <SectionHeading>{c.collected.title}</SectionHeading>
            <p className="mt-3 text-sm text-[#1C1C1E]/80">{c.collected.intro}</p>
            <DotList items={c.collected.items} />
            <p className="mt-5 text-sm text-[#1C1C1E]/80">{c.collected.notCollected}</p>
          </Section>

          <Section>
            <SectionHeading>{c.usage.title}</SectionHeading>
            <p className="mt-3 text-sm text-[#1C1C1E]/80">{c.usage.intro}</p>
            <DotList items={c.usage.items} />
            <p className="mt-5 text-sm text-[#1C1C1E]/80">{c.usage.notUsed}</p>
          </Section>

          <Section>
            <SectionHeading>{c.retention.title}</SectionHeading>
            <p className="mt-3 text-sm text-[#1C1C1E]/80">{c.retention.text}</p>
          </Section>

          <Section>
            <SectionHeading>{c.rights.title}</SectionHeading>
            <p className="mt-3 text-sm text-[#1C1C1E]/80">{c.rights.intro}</p>
            <DotList items={c.rights.items} />
            <p className="mt-5 text-sm text-[#1C1C1E]/80">
              {c.rights.contact}
              <br />
              {c.rights.response}
            </p>
          </Section>

          <Section>
            <SectionHeading>{c.cookies.title}</SectionHeading>
            <MultiLine text={c.cookies.text} className="mt-3" />
          </Section>

          <Section>
            <SectionHeading>{c.contacts.title}</SectionHeading>
            <p className="mt-3 text-sm text-[#1C1C1E]/80">
              {c.contacts.companyName}
              <br />
              {c.contacts.address}
              <br />
              {c.contacts.email}
              <br />
              {c.contacts.phone}
            </p>
          </Section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
