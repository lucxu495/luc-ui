"use client";

import { CalendarDate, type DateValue } from "@internationalized/date";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { IconButton } from "../components/icon-button";
import { useControllableState } from "../hooks/use-controllable-state";
import { cn } from "../utils/cn";
import { formatMonthName, formatMonthYear } from "./format";

/*
 * LUC MonthPicker and YearPicker.
 *
 * React Aria ships a day grid, not a month grid, so these two are Luc UI's own —
 * built as an ARIA grid with roving focus, which is enough behaviour to be
 * honest about and small enough to read. The same components power the calendar
 * header's month/year jump, so a user never has to page through 120 months.
 */

interface PickerItem {
  key: string;
  label: string;
  accessibleLabel: string;
  value: CalendarDate;
  selected: boolean;
  disabled: boolean;
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) rows.push(items.slice(index, index + size));
  return rows;
}

const NAV_BUTTON = cn(
  "grid size-6 shrink-0 place-items-center rounded-sm text-fg-muted luc-transition luc-focus",
  "hover:bg-surface-interactive-hover hover:text-fg-primary",
  "disabled:pointer-events-none disabled:opacity-40",
);

/** The grid itself: roving focus, arrows, Home/End, PageUp/PageDown, Enter/Space. */
function PickerGrid({
  label,
  items,
  columns,
  activeIndex,
  onActiveIndexChange,
  onSelect,
  className,
}: {
  label: string;
  items: PickerItem[];
  columns: number;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onSelect: (item: PickerItem) => void;
  className?: string;
}) {
  const refs = useRef<Array<HTMLDivElement | null>>([]);

  const focusIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, index));
    onActiveIndexChange(clamped);
    refs.current[clamped]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
    const columns_ = columns;
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        focusIndex(index - 1);
        break;
      case "ArrowRight":
        event.preventDefault();
        focusIndex(index + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusIndex(index - columns_);
        break;
      case "ArrowDown":
        event.preventDefault();
        focusIndex(index + columns_);
        break;
      case "Home":
        event.preventDefault();
        focusIndex(index - (index % columns_));
        break;
      case "End":
        event.preventDefault();
        focusIndex(index - (index % columns_) + columns_ - 1);
        break;
      case "PageUp":
        event.preventDefault();
        focusIndex(index - columns_ * 4);
        break;
      case "PageDown":
        event.preventDefault();
        focusIndex(index + columns_ * 4);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (items[index]) onSelect(items[index]);
        break;
      default:
        break;
    }
  };

  const rows = chunk(items, columns);

  return (
    <div role="grid" aria-label={label} aria-colcount={columns} className={cn("flex flex-col gap-1", className)}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} role="row" className="contents">
          {row.map((item, cellIndex) => {
            const index = rowIndex * columns + cellIndex;
            return (
              <div
                key={item.key}
                ref={(node) => {
                  refs.current[index] = node;
                }}
                role="gridcell"
                aria-selected={item.selected}
                aria-label={item.accessibleLabel}
                aria-disabled={item.disabled || undefined}
                tabIndex={index === activeIndex ? 0 : -1}
                onClick={() => {
                  if (item.disabled) return;
                  onActiveIndexChange(index);
                  onSelect(item);
                }}
                onFocus={() => onActiveIndexChange(index)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={cn(
                  "flex h-8 cursor-default items-center justify-center rounded-sm text-label luc-transition",
                  "text-fg-secondary hover:bg-surface-interactive-hover hover:text-fg-primary",
                  "focus-visible:outline-none focus-visible:shadow-[var(--glow-focus)] focus-visible:text-fg-primary",
                  item.selected && "bg-accent-soft text-fg-accent shadow-xs",
                  item.disabled && "pointer-events-none text-fg-disabled",
                )}
              >
                {item.label}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export interface MonthPickerProps {
  /** Selected month. The day is ignored. */
  value?: CalendarDate | null;
  onValueChange?: (value: CalendarDate) => void;
  /** Year on display. Controlled or `defaultYear`. */
  year?: number;
  defaultYear?: number;
  onYearChange?: (year: number) => void;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  /** A month is unavailable when its first day is. */
  isMonthUnavailable?: (firstDayOfMonth: CalendarDate) => boolean;
  locale?: string;
  /** Year navigation row. Hidden inside a calendar that already has one. */
  withYearNavigation?: boolean;
  /** Rendered under the grid — a "today" or "clear" affordance. */
  footer?: ReactNode;
  className?: string;
  "aria-label"?: string;
}

/** Twelve months in a 3×4 grid, with a year strip above it. */
export function MonthPicker({
  value,
  onValueChange,
  year,
  defaultYear,
  onYearChange,
  minValue,
  maxValue,
  isMonthUnavailable,
  locale = "en-US",
  withYearNavigation = true,
  footer,
  className,
  ...props
}: MonthPickerProps) {
  const fallbackYear = value?.year ?? defaultYear ?? new Date().getFullYear();
  const [activeYear, setActiveYear] = useControllableState<number>({
    value: year,
    defaultValue: fallbackYear,
    onChange: onYearChange,
  });
  const [activeIndex, setActiveIndex] = useState(0);

  const months: PickerItem[] = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const date = new CalendarDate(activeYear, month, 1);
    const label = formatMonthName(date, { locale });
    const beforeMin = minValue ? date.compare(minValue) < 0 : false;
    const afterMax = maxValue ? date.compare(maxValue) > 0 : false;
    return {
      key: `${activeYear}-${month}`,
      label,
      accessibleLabel: formatMonthYear(date, { locale }),
      value: date,
      selected: Boolean(value && value.year === activeYear && value.month === month),
      disabled: beforeMin || afterMax || Boolean(isMonthUnavailable?.(date)),
    };
  });

  const yearDisabled = (direction: -1 | 1) => {
    if (direction === -1 && minValue) return activeYear <= minValue.year;
    if (direction === 1 && maxValue) return activeYear >= maxValue.year;
    return false;
  };

  return (
    <div data-slot="month-picker" className={cn("flex w-56 flex-col gap-2", className)} {...props}>
      {withYearNavigation ? (
        <div className="flex items-center justify-between gap-1">
          <IconButton
            label="Previous year"
            size="sm"
            variant="ghost"
            className={NAV_BUTTON}
            disabled={yearDisabled(-1)}
            onClick={() => setActiveYear(activeYear - 1)}
            icon={<Chevron direction="left" />}
          />
          <span className="text-label font-medium text-fg-primary luc-numeric">{activeYear}</span>
          <IconButton
            label="Next year"
            size="sm"
            variant="ghost"
            className={NAV_BUTTON}
            disabled={yearDisabled(1)}
            onClick={() => setActiveYear(activeYear + 1)}
            icon={<Chevron direction="right" />}
          />
        </div>
      ) : null}
      <PickerGrid
        label={props["aria-label"] ?? "Select month"}
        items={months}
        columns={3}
        activeIndex={activeIndex}
        onActiveIndexChange={setActiveIndex}
        onSelect={(item) => onValueChange?.(item.value)}
      />
      {footer}
    </div>
  );
}

export interface YearPickerProps {
  value?: CalendarDate | null;
  onValueChange?: (value: CalendarDate) => void;
  /** First year of the visible page. */
  pageStart?: number;
  defaultPageStart?: number;
  onPageStartChange?: (year: number) => void;
  /** Years per page. Default 10, aligned to the decade — "2020–2029". */
  yearsPerPage?: number;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  locale?: string;
  className?: string;
  "aria-label"?: string;
}

/** Years in a page, with fast page navigation across a wide range. */
export function YearPicker({
  value,
  onValueChange,
  pageStart,
  defaultPageStart,
  onPageStartChange,
  yearsPerPage = 10,
  minValue,
  maxValue,
  locale = "en-US",
  className,
  ...props
}: YearPickerProps) {
  const anchorYear = value?.year ?? new Date().getFullYear();
  const fallbackPageStart = Math.floor(anchorYear / yearsPerPage) * yearsPerPage;
  const [activePageStart, setActivePageStart] = useControllableState<number>({
    value: pageStart,
    defaultValue: defaultPageStart ?? fallbackPageStart,
    onChange: onPageStartChange,
  });
  const [activeIndex, setActiveIndex] = useState(0);

  const years: PickerItem[] = Array.from({ length: yearsPerPage }, (_, index) => {
    const year = activePageStart + index;
    const date = new CalendarDate(year, 1, 1);
    // Numerals follow the locale: `ar-EG` shows Arabic-Indic digits, `en-US`
    // shows Latin ones — the value is the number either way.
    const formatted = new Intl.NumberFormat(locale, { useGrouping: false }).format(year);
    return {
      key: String(year),
      label: formatted,
      accessibleLabel: formatted,
      value: date,
      selected: value?.year === year,
      disabled: (minValue ? year < minValue.year : false) || (maxValue ? year > maxValue.year : false),
    };
  });

  return (
    <div data-slot="year-picker" className={cn("flex w-56 flex-col gap-2", className)} {...props}>
      <div className="flex items-center justify-between gap-1">
        <IconButton
          label={`Previous ${yearsPerPage} years`}
          size="sm"
          variant="ghost"
          className={NAV_BUTTON}
          disabled={minValue ? activePageStart <= minValue.year : false}
          onClick={() => setActivePageStart(activePageStart - yearsPerPage)}
          icon={<Chevron direction="left" />}
        />
        <span className="text-label font-medium text-fg-primary luc-numeric">
          {activePageStart}–{activePageStart + yearsPerPage - 1}
        </span>
        <IconButton
          label={`Next ${yearsPerPage} years`}
          size="sm"
          variant="ghost"
          className={NAV_BUTTON}
          disabled={maxValue ? activePageStart + yearsPerPage - 1 >= maxValue.year : false}
          onClick={() => setActivePageStart(activePageStart + yearsPerPage)}
          icon={<Chevron direction="right" />}
        />
      </div>
      <PickerGrid
        label={props["aria-label"] ?? "Select year"}
        items={years}
        columns={3}
        activeIndex={activeIndex}
        onActiveIndexChange={setActiveIndex}
        onSelect={(item) => onValueChange?.(item.value)}
      />
    </div>
  );
}

export function Chevron({ direction }: { direction: "left" | "right" | "down" }) {
  const rotation = direction === "left" ? 90 : direction === "right" ? -90 : 0;
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      style={{ transform: `rotate(${rotation}deg)` }}
      className="size-3.5"
    >
      <path d="M4 6.5 8 10.5l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
