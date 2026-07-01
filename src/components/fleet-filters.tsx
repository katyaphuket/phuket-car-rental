"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/dictionary";

export type ClassFilterValue = "Эконом" | "Кроссовер" | "Пикап" | "Премиум" | "Кабриолет" | "seats7";
export type FleetSortValue = "default" | "asc" | "desc";

export type FleetFilters = {
  classes: ClassFilterValue[];
  priceMin?: number;
  priceMax?: number;
};

export const EMPTY_FILTERS: FleetFilters = { classes: [] };

export function countActiveFilters(filters: FleetFilters) {
  return filters.classes.length + (filters.priceMin != null || filters.priceMax != null ? 1 : 0);
}

const buttonBaseClass =
  "flex cursor-pointer items-center gap-1.5 rounded-md border px-3.5 py-2 text-[13px] font-medium transition-colors";

function FilterPanel({
  t,
  appliedFilters,
  onApply,
  onClose,
}: {
  t: Dictionary;
  appliedFilters: FleetFilters;
  onApply: (filters: FleetFilters) => void;
  onClose: () => void;
}) {
  const [draftClasses, setDraftClasses] = useState<ClassFilterValue[]>(appliedFilters.classes);
  const [draftMin, setDraftMin] = useState(appliedFilters.priceMin?.toString() ?? "");
  const [draftMax, setDraftMax] = useState(appliedFilters.priceMax?.toString() ?? "");

  const classOptions: { value: ClassFilterValue; label: string }[] = [
    { value: "Эконом", label: t.fleet.filterClassEconomy },
    { value: "Кроссовер", label: t.fleet.filterClassCrossover },
    { value: "Пикап", label: t.fleet.filterClassPickup },
    { value: "Премиум", label: t.fleet.filterClassPremium },
    { value: "Кабриолет", label: t.fleet.filterClassCabrio },
    { value: "seats7", label: t.fleet.filterClassSeats7 },
  ];

  function toggleClass(value: ClassFilterValue) {
    setDraftClasses((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  }

  function handleReset() {
    setDraftClasses([]);
    setDraftMin("");
    setDraftMax("");
    onApply(EMPTY_FILTERS);
    onClose();
  }

  function handleApply() {
    const priceMin = draftMin.trim() === "" ? undefined : Number(draftMin);
    const priceMax = draftMax.trim() === "" ? undefined : Number(draftMax);
    onApply({
      classes: draftClasses,
      priceMin: priceMin != null && !Number.isNaN(priceMin) ? priceMin : undefined,
      priceMax: priceMax != null && !Number.isNaN(priceMax) ? priceMax : undefined,
    });
    onClose();
  }

  return (
    <div className="absolute left-0 top-full z-50 mt-2 w-[280px] max-w-[calc(100vw-1.5rem)] rounded-lg border border-[#E5E7EB] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.1)] sm:left-auto sm:right-0">
      <div className="p-4">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-foreground-faint">
          {t.fleet.filterClassSection}
        </div>
        <div className="mb-4 flex flex-col gap-2">
          {classOptions.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 text-sm text-[#1C1C1E] hover:text-[#0EA5C9]"
            >
              <input
                type="checkbox"
                checked={draftClasses.includes(option.value)}
                onChange={() => toggleClass(option.value)}
                className="h-4 w-4 cursor-pointer rounded border-[#E5E7EB] text-[#0EA5C9] accent-[#0EA5C9]"
              />
              {option.label}
            </label>
          ))}
        </div>

        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-foreground-faint">
          {t.fleet.filterPriceSection}
        </div>
        <div className="mb-4 flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={draftMin}
            onChange={(event) => setDraftMin(event.target.value)}
            placeholder={t.fleet.pricePlaceholderFrom}
            className="w-full rounded-md border border-[#E5E7EB] px-2.5 py-1.5 text-[13px] text-[#1C1C1E] outline-none focus:border-[#0EA5C9]"
          />
          <span className="text-foreground-faint">฿</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={draftMax}
            onChange={(event) => setDraftMax(event.target.value)}
            placeholder={t.fleet.pricePlaceholderTo}
            className="w-full rounded-md border border-[#E5E7EB] px-2.5 py-1.5 text-[13px] text-[#1C1C1E] outline-none focus:border-[#0EA5C9]"
          />
          <span className="text-foreground-faint">฿</span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 cursor-pointer rounded-md border border-[#E5E7EB] px-3 py-2 text-[13px] font-medium text-[#1C1C1E] hover:border-[#0EA5C9] hover:text-[#0EA5C9]"
          >
            {t.fleet.reset}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 cursor-pointer rounded-md bg-[#0EA5C9] px-3 py-2 text-[13px] font-medium text-white hover:bg-[#0284C7]"
          >
            {t.fleet.apply}
          </button>
        </div>
      </div>
    </div>
  );
}

function SortDropdown({
  t,
  sortValue,
  onSortChange,
}: {
  t: Dictionary;
  sortValue: FleetSortValue;
  onSortChange: (value: FleetSortValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const sortOptions: { value: FleetSortValue; label: string }[] = [
    { value: "default", label: t.fleet.sortDefault },
    { value: "asc", label: t.fleet.sortCheap },
    { value: "desc", label: t.fleet.sortExpensive },
  ];

  const sortButtonLabel = sortOptions.find((option) => option.value === sortValue)?.label ?? t.fleet.sortDefault;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`${buttonBaseClass} border-[#E5E7EB] bg-white text-[#1C1C1E] hover:border-[#0EA5C9] hover:text-[#0EA5C9]`}
      >
        {sortButtonLabel}
        <span aria-hidden="true">▼</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-lg border border-[#E5E7EB] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onSortChange(option.value);
                setOpen(false);
              }}
              className={`block w-full cursor-pointer px-4 py-2.5 text-left text-sm hover:bg-[#F0F9FF] hover:text-[#0EA5C9] ${
                option.value === sortValue ? "font-medium text-[#0EA5C9]" : "text-[#1C1C1E]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FleetFilters({
  t,
  appliedFilters,
  sortValue,
  onFiltersApply,
  onSortChange,
}: {
  t: Dictionary;
  appliedFilters: FleetFilters;
  sortValue: FleetSortValue;
  onFiltersApply: (filters: FleetFilters) => void;
  onSortChange: (value: FleetSortValue) => void;
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRootRef = useRef<HTMLDivElement>(null);
  const activeCount = countActiveFilters(appliedFilters);

  useEffect(() => {
    if (!filterOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (filterRootRef.current && !filterRootRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterOpen]);

  return (
    <div className="mb-2 flex justify-end gap-2">
      <div ref={filterRootRef} className="relative">
        <button
          type="button"
          onClick={() => setFilterOpen((value) => !value)}
          className={`${buttonBaseClass} ${
            activeCount > 0
              ? "border-[#0EA5C9] text-[#0EA5C9]"
              : "border-[#E5E7EB] bg-white text-[#1C1C1E] hover:border-[#0EA5C9] hover:text-[#0EA5C9]"
          }`}
        >
          {activeCount > 0 ? `${t.fleet.filterLabel} (${activeCount})` : t.fleet.filterLabel}
          <span aria-hidden="true">▼</span>
        </button>

        {filterOpen && (
          <FilterPanel
            t={t}
            appliedFilters={appliedFilters}
            onApply={onFiltersApply}
            onClose={() => setFilterOpen(false)}
          />
        )}
      </div>

      <SortDropdown t={t} sortValue={sortValue} onSortChange={onSortChange} />
    </div>
  );
}
