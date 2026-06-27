"use client";

import { useState } from "react";

type TermsAccordionItemProps = {
  title: string;
  children: React.ReactNode;
};

export function TermsAccordionItem({ title, children }: TermsAccordionItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#E5E7EB]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium text-[#1C1C1E] cursor-pointer"
      >
        {title}
        <span className="text-lg text-[#0EA5C9]">{open ? "–" : "+"}</span>
      </button>
      <div
        className={`overflow-hidden text-sm leading-relaxed text-[#1C1C1E]/80 transition-all duration-300 ${
          open ? "max-h-96 pb-4 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
