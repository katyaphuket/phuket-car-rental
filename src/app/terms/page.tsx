"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TermsTable } from "@/components/terms-table";
import { TermsAccordionItem } from "@/components/terms-accordion-item";
import { useLocale } from "@/lib/locale-context";
import { termsContent } from "@/lib/terms-content";

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

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2.5 text-sm text-[#1C1C1E]/80">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span className="text-[#0EA5C9]">✓</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
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

export default function TermsPage() {
  const { locale } = useLocale();
  const c = termsContent[locale];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader forceSolid />

      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-[800px] px-6 pt-28">
          <p className="text-center text-xs text-[#9CA3AF]">{c.legalTag}</p>
        </div>

        <div className="mx-auto max-w-[800px] px-6 pt-4 pb-4">
          <h1 className="font-display text-2xl tracking-tight text-[#1C1C1E] sm:text-3xl">{c.heading}</h1>
          <p className="mt-2 text-sm text-foreground-faint">{c.subheading}</p>
        </div>

        <div className="mx-auto max-w-[800px] px-6">
          <Section>
            <SectionHeading>{c.included.title}</SectionHeading>
            <p className="mt-3 text-sm text-[#1C1C1E]/80">{c.included.intro}</p>
            <CheckList items={c.included.items} />
          </Section>

          <Section>
            <SectionHeading>{c.driver.title}</SectionHeading>
            <p className="mt-3 text-sm text-[#1C1C1E]/80">
              {c.driver.age}
              <br />
              {c.driver.experience}
            </p>

            <p className="mt-5 text-sm font-medium text-[#1C1C1E]">{c.driver.licenseIntro}</p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
                <p className="text-sm font-medium text-[#1C1C1E]">{c.driver.option1Title}</p>
                <p className="mt-2 text-sm text-[#1C1C1E]/80">{c.driver.option1Text}</p>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
                <p className="text-sm font-medium text-[#1C1C1E]">{c.driver.option2Title}</p>
                <p className="mt-2 text-sm text-[#1C1C1E]/80">{c.driver.option2Text}</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-[#FCD34D] bg-[#FEF9C3] p-4 text-sm text-[#1C1C1E]/80">
              {c.driver.warning}
            </div>

            <p className="mt-4 text-sm font-semibold text-[#DC2626]">{c.driver.noLicenseNote}</p>
          </Section>

          <Section>
            <SectionHeading>{c.delivery.title}</SectionHeading>
            <p className="mt-3 text-sm text-[#1C1C1E]/80">{c.delivery.intro}</p>
            <div className="mt-4">
              <TermsTable headers={c.delivery.tableHeaders} rows={c.delivery.rows} />
            </div>
            <p className="mt-4 text-sm text-[#1C1C1E]/80">{c.delivery.note}</p>
          </Section>

          <Section>
            <SectionHeading>{c.minTerm.title}</SectionHeading>
            <p className="mt-3 text-sm text-[#1C1C1E]/80">{c.minTerm.intro}</p>

            <p className="mt-5 text-sm font-medium text-[#1C1C1E]">{c.minTerm.economyTitle}</p>
            <div className="mt-3">
              <TermsTable headers={c.minTerm.tableHeaders} rows={c.minTerm.economyRows} />
            </div>

            <p className="mt-5 text-sm font-medium text-[#1C1C1E]">{c.minTerm.crossoverTitle}</p>
            <div className="mt-3">
              <TermsTable headers={c.minTerm.tableHeaders} rows={c.minTerm.crossoverRows} />
            </div>

            <MultiLine text={c.minTerm.note} className="mt-5" />
          </Section>

          <Section>
            <SectionHeading>{c.payment.title}</SectionHeading>
            <p className="mt-3 text-sm text-[#1C1C1E]/80">{c.payment.intro}</p>
            <DotList items={c.payment.items} />
          </Section>

          <Section>
            <SectionHeading>{c.deposit.title}</SectionHeading>
            <MultiLine text={c.deposit.intro} className="mt-3" />

            <p className="mt-5 text-sm font-medium text-[#1C1C1E]">{c.deposit.accidentTitle}</p>
            <DotList items={c.deposit.accidentItems} />

            <MultiLine
              text={`${c.deposit.amountNote}\n\n${c.deposit.cashNote}\n\n${c.deposit.photoNote}`}
              className="mt-5"
            />
          </Section>

          <Section>
            <SectionHeading>{c.insurance.title}</SectionHeading>
            <p className="mt-3 text-sm text-[#1C1C1E]/80">{c.insurance.intro}</p>
            <p className="mt-5 text-sm font-medium text-[#1C1C1E]">{c.insurance.exclusionsTitle}</p>
            <DotList items={c.insurance.exclusions} />
            <p className="mt-5 text-sm text-[#1C1C1E]/80">{c.insurance.callNote}</p>
          </Section>

          <Section>
            <SectionHeading>{c.mileage.title}</SectionHeading>
            <DotList items={c.mileage.items} />
          </Section>

          <Section>
            <SectionHeading>{c.returning.title}</SectionHeading>
            <p className="mt-3 text-sm text-[#1C1C1E]/80">{c.returning.text}</p>
          </Section>

          <Section>
            <SectionHeading>{c.important.title}</SectionHeading>
            <div className="mt-4">
              <TermsAccordionItem title={c.important.fuelTitle}>{c.important.fuelText}</TermsAccordionItem>
              <TermsAccordionItem title={c.important.batteryTitle}>{c.important.batteryText}</TermsAccordionItem>
              <TermsAccordionItem title={c.important.cleanTitle}>
                <MultiLine text={c.important.cleanText} />
              </TermsAccordionItem>
              <TermsAccordionItem title={c.important.thirdPartyTitle}>
                {c.important.thirdPartyText}
              </TermsAccordionItem>
              <TermsAccordionItem title={c.important.parkingTitle}>{c.important.parkingText}</TermsAccordionItem>
              <TermsAccordionItem title={c.important.earlyReturnTitle}>
                {c.important.earlyReturnText}
              </TermsAccordionItem>
              <TermsAccordionItem title={c.important.inspectionTitle}>
                {c.important.inspectionText}
              </TermsAccordionItem>
            </div>
          </Section>
        </div>

        <section className="bg-[#1C1C1E] px-6 py-16 text-center text-white">
          <h2 className="font-display text-2xl tracking-tight sm:text-3xl">{c.cta.title}</h2>
          <p className="mt-2 text-sm text-white/70">{c.cta.subtitle}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#"
              className="rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              {c.cta.whatsapp}
            </a>
            <a
              href="#"
              className="rounded-lg bg-[#229ED9] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              {c.cta.telegram}
            </a>
          </div>
        </section>

        <p className="px-6 py-6 text-center text-xs text-[#9CA3AF]">
          <span className="mx-auto block max-w-[800px]">{c.legalFooter}</span>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
