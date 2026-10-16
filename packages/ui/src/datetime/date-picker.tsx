"use client";

import {
  Button as RacButton,
  DateField as RacDateField,
  DateInput,
  DatePicker as RacDatePicker,
  DateRangePicker as RacDateRangePicker,
  Dialog as RacDialog,
  Group as RacGroup,
  Popover as RacPopover,
  type DateFieldProps as RacDateFieldProps,
  type DatePickerProps as RacDatePickerProps,
  type DateRangePickerProps as RacDateRangePickerProps,
  type DateSegment as DateSegmentType,
} from "react-aria-components";
import { RiArrowDownSLine, RiCalendarLine, RiCloseLine } from "@remixicon/react";
import {
  Time,
  toCalendarDateTime,
  getLocalTimeZone,
  toCalendarDate,
  today,
  toZoned,
  type CalendarDate,
  type DateValue,
} from "@internationalized/date";
import type { ReactNode } from "react";
import { useField } from "../components/field";
import { inputShellClass, type ControlSize } from "../components/input";
import { useControllableState } from "../hooks/use-controllable-state";
import { cn } from "../utils/cn";
import { Calendar, CalendarActionButton, CalendarFooter, RangeCalendar } from "./calendar";
import { renderSegment } from "./segments";
import { formatDateOnly, isSameCalendarDate, type DateRange } from "./format";
import { LocaleProvider } from "../providers/locale-provider";

/*
 * LUC date fields and pickers.
 *
 * The field is segmented (DD / MM / YYYY in the locale's order) rather than a
 * free-text box: every segment is a labelled spinbutton, the order follows the
 * locale, and there is no ambiguous "2/3/4" to parse. The popover adds a
 * calendar for people who would rather look at a month.
 *
 * Values are `CalendarDate`: no clock, no time zone, and no
 * `new Date("YYYY-MM-DD")` anywhere in the path.
 */

const dateInputClass = "flex flex-1 items-center gap-0.5 overflow-hidden px-2.5";

const shellBySize: Record<ControlSize, string> = {
  sm: "h-control-sm rounded-sm text-label",
  md: "h-control-md rounded-md text-label",
  lg: "h-control-lg rounded-md text-body",
};

/*
 * A trailing icon inside a date field is also a target, and WCAG 2.2's minimum
 * is 24 × 24 CSS pixels. `sm` used to be 20 px, which is the one size a date
 * field is most likely to be used at — so `sm` and `md` now share a 24 px
 * target. The icon inside stays 16 px; it is the *hit area* that had to grow,
 * and there is room for it because the smallest control is 26 px tall.
 */
const triggerBySize: Record<ControlSize, string> = {
  sm: "size-6",
  md: "size-6",
  lg: "size-7",
};

const popoverClass = cn(
  "z-[var(--z-popover)] rounded-lg border border-line-default bg-surface-overlay text-fg-primary luc-float",
  "data-[entering]:animate-[luc-overlay-in_var(--motion-fast)_var(--ease-enter)]",
  "data-[exiting]:animate-[luc-overlay-out_var(--motion-fast)_var(--ease-exit)]",
);

type Granularity = "day" | "hour" | "minute" | "second" | undefined;

/**
 * What "Today" means for this field.
 *
 * A date-only field gets today's date. A date-and-time field keeps the clock
 * the user already chose (or midnight when empty), and a zoned field keeps its
 * zone — so the action never silently changes the value's shape.
 */
function todayFor<T extends DateValue>({
  todayValue,
  reference,
  granularity,
}: {
  todayValue?: CalendarDate;
  reference?: T | null;
  granularity?: Granularity;
}): T {
  const base = todayValue ?? today(getLocalTimeZone());
  if (granularity === undefined || granularity === "day") return base as unknown as T;
  const time =
    reference && "hour" in reference
      ? new Time(
          reference.hour,
          reference.minute,
          "second" in reference ? (reference.second ?? 0) : 0,
        )
      : undefined;
  const dateTime = toCalendarDateTime(base, time);
  if (reference && "timeZone" in reference) return toZoned(dateTime, reference.timeZone) as unknown as T;
  return dateTime as unknown as T;
}

function TriggerButton({
  size,
  className,
  children,
  ...props
}: Omit<React.ComponentPropsWithRef<typeof RacButton>, "className"> & { size: ControlSize; className?: string }) {
  return (
    <RacButton
      {...props}
      className={cn(
        "mr-1 grid shrink-0 place-items-center rounded-xs text-fg-muted luc-transition luc-focus",
        "hover:bg-surface-interactive-hover hover:text-fg-primary",
        "disabled:pointer-events-none disabled:opacity-40",
        triggerBySize[size],
        className,
      )}
    >
      {children}
    </RacButton>
  );
}

/** Shared shell for every segmented date control. */
function shellClass(
  field: ReturnType<typeof useField>,
  invalid: boolean,
  size: ControlSize,
  className?: string,
) {
  return cn(
    inputShellClass,
    shellBySize[size],
    "gap-0",
    invalid && "border-negative shadow-[0_0_0_3px_var(--negative-soft)]",
    field.readOnly && "border-dashed bg-surface-canvas",
    className,
  );
}

/** Segment renderer: the same treatment everywhere a date is editable. */
function segmentRenderer() {
  return (segment: React.ComponentProps<typeof DateSegmentType>["segment"]) => renderSegment(segment);
}

export interface DateFieldProps<T extends DateValue = DateValue>
  extends Omit<RacDateFieldProps<T>, "className" | "children" | "isInvalid" | "isDisabled" | "isReadOnly"> {
  size?: ControlSize;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** BCP-47 locale for segment order, weekday names and the visible month. */
  locale?: string;
  className?: string;
  /** Rendered after the segments — a suffix, a clear button, an icon. */
  trailingAction?: ReactNode;
}

/**
 * A date (or date-and-time) field with segmented editing and no popover. Use it
 * in a dense filter bar where a calendar would be too much surface.
 */
export function DateField<T extends DateValue = DateValue>({
  size = "md",
  invalid,
  disabled,
  readOnly,
  className,
  trailingAction,
  ...props
}: DateFieldProps<T>) {
  const field = useField();
  const isInvalid = invalid ?? field.invalid;
  return (
    <LocaleProvider locale={props.locale}>
      <RacDateField
        {...props}
        id={field.id}
        aria-describedby={field.describedBy}
        aria-labelledby={field.labelId}
        isInvalid={isInvalid}
        isDisabled={disabled ?? field.disabled}
        isReadOnly={readOnly ?? field.readOnly}
        className={shellClass(field, isInvalid, size, className)}
      >
        <DateInput className={dateInputClass}>{segmentRenderer()}</DateInput>
        {trailingAction}
      </RacDateField>
    </LocaleProvider>
  );
}

export interface DatePickerProps<T extends DateValue = DateValue>
  extends Omit<
    RacDatePickerProps<T>,
    "className" | "children" | "isInvalid" | "isDisabled" | "isReadOnly" | "isRequired" | "onChange"
  > {
  /** Called with the new date, or `null` when the field is cleared. */
  onValueChange?: (value: T | null) => void;
  size?: ControlSize;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  locale?: string;
  /** Month/year jump inside the calendar. Default `true`. */
  viewSwitch?: boolean;
  /** "Today" action in the calendar footer. Default `true`. */
  showTodayAction?: boolean;
  /** "Clear" action in the calendar footer. Default `true`. */
  showClearAction?: boolean;
  /** Accessible name for the calendar button. Localized by React Aria by default. */
  calendarButtonLabel?: string;
  /** Extra footer content beside the quick actions. */
  footer?: ReactNode;
  className?: string;
  /**
   * The calendar date the "Today" action should mean. Inject it in demos and
   * tests so a screenshot does not change at midnight.
   */
  todayValue?: CalendarDate;
}

/** One date, chosen from a calendar or typed segment by segment. */
export function DatePicker<T extends DateValue = DateValue>({
  onValueChange,
  size = "md",
  invalid,
  disabled,
  readOnly,
  required,
  locale,
  viewSwitch = true,
  showTodayAction = true,
  showClearAction = true,
  calendarButtonLabel,
  footer,
  className,
  todayValue,
  value,
  ...props
}: DatePickerProps<T>) {
  const field = useField();
  const isInvalid = invalid ?? field.invalid;
  const resolvedToday = todayFor<T>({ todayValue, reference: value, granularity: props.granularity });

  return (
    <LocaleProvider locale={locale}>
      <RacDatePicker
        {...props}
        value={value}
        onChange={(next) => onValueChange?.(next as T | null)}
        isInvalid={isInvalid}
        isDisabled={disabled ?? field.disabled}
        isReadOnly={readOnly ?? field.readOnly}
        isRequired={required ?? field.required}
        className="flex min-w-0 flex-col gap-1.5"
      >
      <RacGroup
        className={shellClass(field, isInvalid, size, className)}
        id={field.id}
        aria-describedby={field.describedBy}
        aria-labelledby={field.labelId}
      >
        <DateInput className={dateInputClass}>{segmentRenderer()}</DateInput>
        <TriggerButton slot="calendar" size={size} aria-label={calendarButtonLabel}>
          <RiCalendarLine aria-hidden="true" className="size-4" />
        </TriggerButton>
      </RacGroup>
      <RacPopover offset={8} className={popoverClass}>
        <RacDialog className="outline-none">
          <Calendar
            locale={locale}
            viewSwitch={viewSwitch}
            value={value ?? null}
            onChange={(next) => onValueChange?.(next as unknown as T)}
            minValue={props.minValue}
            maxValue={props.maxValue}
            isDateUnavailable={props.isDateUnavailable}
            className="border-0 shadow-none"
            footer={
              showTodayAction || showClearAction || footer ? (
                <CalendarFooter>
                  {showTodayAction ? (
                    <CalendarActionButton onClick={() => onValueChange?.(resolvedToday)}>Today</CalendarActionButton>
                  ) : (
                    <span />
                  )}
                  <div className="flex items-center gap-2">
                    {footer}
                    {showClearAction ? (
                      <CalendarActionButton
                        className="inline-flex items-center gap-1"
                        onClick={() => onValueChange?.(null)}
                      >
                        <RiCloseLine aria-hidden="true" className="size-3" />
                        Clear
                      </CalendarActionButton>
                    ) : null}
                  </div>
                </CalendarFooter>
              ) : null
            }
          />
        </RacDialog>
      </RacPopover>
      </RacDatePicker>
    </LocaleProvider>
  );
}

export interface DateRangePreset {
  id: string;
  label: string;
  /**
   * A fixed range of calendar dates, or a factory evaluated against the current
   * day. Presets are calendar-date based on purpose — "last 7 days" is a date
   * range, not an instant range.
   */
  range: DateRange | ((context: { today: CalendarDate }) => DateRange);
}

export interface DateRangePickerProps<T extends DateValue = DateValue>
  extends Omit<
    RacDateRangePickerProps<T>,
    | "className"
    | "children"
    | "isInvalid"
    | "isDisabled"
    | "isReadOnly"
    | "isRequired"
    | "onChange"
    | "startName"
    | "endName"
  > {
  onValueChange?: (value: DateRange<T> | null) => void;
  size?: ControlSize;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  locale?: string;
  /** Months shown at once. Default `2`; the caller drops to 1 on mobile. */
  months?: 1 | 2;
  /** Consumer-defined quick ranges. LUC hard-codes no business windows. */
  presets?: DateRangePreset[];
  showTodayAction?: boolean;
  showClearAction?: boolean;
  calendarButtonLabel?: string;
  footer?: ReactNode;
  className?: string;
  /**
   * The calendar date the "Today" action should mean. Inject it in demos and
   * tests so a screenshot does not change at midnight.
   */
  todayValue?: CalendarDate;
}

/**
 * A start/end date range. Both ends are inclusive and neither is nudged to
 * 23:59:59 — a range of dates is a pair of dates, and what it means to a query
 * is the consumer's decision.
 */
export function DateRangePicker<T extends DateValue = DateValue>({
  onValueChange,
  size = "md",
  invalid,
  disabled,
  readOnly,
  required,
  locale,
  months = 2,
  presets,
  showTodayAction = true,
  showClearAction = true,
  calendarButtonLabel,
  footer,
  className,
  todayValue,
  value,
  defaultValue,
  ...props
}: DateRangePickerProps<T>) {
  const field = useField();
  const isInvalid = invalid ?? field.invalid;
  const resolvedToday = todayFor<CalendarDate>({ todayValue });
  // One source of truth for the range: RAC stays controlled, and the preset
  // highlight and the footer summary read the same value the field is showing.
  const [current, setCurrent] = useControllableState<DateRange<T> | null>({
    value,
    defaultValue: defaultValue ?? null,
    onChange: onValueChange,
  });

  const resolvePreset = (preset: DateRangePreset): DateRange =>
    typeof preset.range === "function"
      ? preset.range({ today: toCalendarDate(resolvedToday) })
      : preset.range;

  return (
    <LocaleProvider locale={locale}>
      <RacDateRangePicker
        {...props}
        value={current}
        onChange={(next) => setCurrent(next as unknown as DateRange<T> | null)}
        isInvalid={isInvalid}
        isDisabled={disabled ?? field.disabled}
        isReadOnly={readOnly ?? field.readOnly}
        isRequired={required ?? field.required}
        className={cn("flex min-w-0 flex-col gap-1.5", className)}
      >
      <RacGroup
        className={shellClass(field, isInvalid, size)}
        id={field.id}
        aria-describedby={field.describedBy}
        aria-labelledby={field.labelId}
      >
        <DateInput slot="start" className={dateInputClass}>
          {segmentRenderer()}
        </DateInput>
        <span aria-hidden="true" className="px-0.5 text-fg-muted">
          –
        </span>
        <DateInput slot="end" className={cn(dateInputClass, "pl-0.5")}>
          {segmentRenderer()}
        </DateInput>
        <TriggerButton slot="calendar" size={size} aria-label={calendarButtonLabel}>
          <RiArrowDownSLine aria-hidden="true" className="size-4" />
        </TriggerButton>
      </RacGroup>
      <RacPopover offset={8} className={popoverClass}>
        <RacDialog className="outline-none">
          <div className="flex max-w-[calc(100vw-2rem)] flex-col sm:max-w-none sm:flex-row">
            {presets && presets.length > 0 ? (
              <div className="flex gap-1 overflow-x-auto border-b border-line-subtle p-2 sm:w-40 sm:flex-col sm:border-r sm:border-b-0 sm:overflow-visible">
                <p className="hidden px-2 pt-1 pb-1.5 text-micro font-medium text-fg-muted uppercase sm:block">
                  Ranges
                </p>
                {presets.map((preset) => {
                  const presetRange = resolvePreset(preset);
                  const selected =
                    Boolean(current) &&
                    isSameCalendarDate(current!.start, presetRange.start) &&
                    isSameCalendarDate(current!.end, presetRange.end);
                  return (
                    // A native button: presets are plain actions, and React Aria's
                    // Button here would inherit the popover trigger's props.
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onValueChange?.(presetRange as DateRange<T>)}
                      className={cn(
                        "shrink-0 rounded-sm px-2 py-1.5 text-left text-label luc-transition luc-focus",
                        "hover:bg-surface-interactive-hover hover:text-fg-primary",
                        selected ? "bg-accent-soft text-fg-accent" : "text-fg-secondary",
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <RangeCalendar
              locale={locale}
              months={months}
              value={current ?? null}
              onChange={(next) => setCurrent(next as unknown as DateRange<T> | null)}
              minValue={props.minValue}
              maxValue={props.maxValue}
              isDateUnavailable={props.isDateUnavailable}
              className="border-0 shadow-none"
              footer={
                showTodayAction || showClearAction || footer ? (
                  <CalendarFooter>
                    <span className="text-caption text-fg-muted">
                      {current
                        ? `${formatDateOnly(current.start, { locale })} – ${formatDateOnly(current.end, { locale })}`
                        : "Select a start and end date"}
                    </span>
                    <div className="flex items-center gap-2">
                      {footer}
                      {showTodayAction ? (
                        <CalendarActionButton
                          onClick={() =>
                            setCurrent({
                              start: todayFor<T>({
                                todayValue,
                                reference: current?.start,
                                granularity: props.granularity,
                              }),
                              end: todayFor<T>({
                                todayValue,
                                reference: current?.end,
                                granularity: props.granularity,
                              }),
                            } as DateRange<T>)
                          }
                        >
                          Today
                        </CalendarActionButton>
                      ) : null}
                      {showClearAction ? (
                        <CalendarActionButton onClick={() => onValueChange?.(null)}>Clear</CalendarActionButton>
                      ) : null}
                    </div>
                  </CalendarFooter>
                ) : null
              }
            />
          </div>
        </RacDialog>
      </RacPopover>
      </RacDateRangePicker>
    </LocaleProvider>
  );
}
