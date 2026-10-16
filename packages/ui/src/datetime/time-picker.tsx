"use client";

import {
  Button as RacButton,
  DateInput,
  Group as RacGroup,
  TimeField as RacTimeField,
  type TimeFieldProps as RacTimeFieldProps,
} from "react-aria-components";
import { RiTimeLine } from "@remixicon/react";
import { Time, getLocalTimeZone, now } from "@internationalized/date";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useField } from "../components/field";
import { inputShellClass, type ControlSize } from "../components/input";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "../components/popover";
import { LocaleProvider } from "../providers/locale-provider";
import { cn } from "../utils/cn";
import { formatTimeValue, type TimeFormatOptions } from "./format";
import { renderSegment } from "./segments";

// LUC TimePicker.
//
// A time-only value is a wall clock: there is no date and no time zone in it.
// The segmented field owns exact editing (React Aria's TimeField gives every
// segment a spinbutton role, locale ordering and arrow/typing behaviour); the
// popover adds coarse picking with a real `minuteStep`, which is the one thing a
// segmented field cannot express.

const shellBySize: Record<ControlSize, string> = {
  sm: "h-control-sm rounded-sm text-label",
  md: "h-control-md rounded-md text-label",
  lg: "h-control-lg rounded-md text-body",
};

interface ColumnOption {
  value: number;
  label: string;
}

// One listbox column: roving focus, arrows, Home/End, Enter/Space. This is the
// ARIA listbox pattern — small enough to keep honest. (A nested Radix Select
// inside a Radix Popover would fight over dismiss behaviour.)
function TimeColumn({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: ColumnOption[];
  selected: number;
  onSelect: (value: number) => void;
}) {
  const refs = useRef<Array<HTMLDivElement | null>>([]);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === selected),
  );
  // `null` means "follow the value": the tab stop tracks the selected option
  // until the user moves it themselves.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const effectiveIndex = activeIndex ?? selectedIndex;

  useEffect(() => {
    refs.current[selectedIndex]?.scrollIntoView?.({ block: "nearest" });
  }, [selectedIndex]);

  const focusIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(options.length - 1, index));
    setActiveIndex(clamped);
    refs.current[clamped]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusIndex(index + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusIndex(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusIndex(0);
        break;
      case "End":
        event.preventDefault();
        focusIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (options[index]) onSelect(options[index].value);
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <p className="px-1 text-micro font-medium text-fg-muted uppercase">{label}</p>
      <div
        role="listbox"
        aria-label={label}
        className="luc-table-scroll flex max-h-52 flex-col overflow-y-auto rounded-sm border border-line-subtle bg-surface-sunken p-0.5"
      >
        {options.map((option, index) => (
          <div
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            role="option"
            aria-selected={option.value === selected}
            tabIndex={index === effectiveIndex ? 0 : -1}
            onClick={() => {
              setActiveIndex(index);
              onSelect(option.value);
            }}
            onFocus={() => setActiveIndex(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "flex h-7 cursor-default items-center justify-center rounded-xs text-label luc-numeric luc-transition",
              "text-fg-secondary hover:bg-surface-interactive-hover hover:text-fg-primary",
              "focus-visible:shadow-[var(--glow-focus)] focus-visible:outline-none",
              option.value === selected && "bg-accent-soft text-fg-accent",
            )}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export interface TimePickerProps
  extends Omit<
    RacTimeFieldProps<Time>,
    "className" | "children" | "isInvalid" | "isDisabled" | "isReadOnly"
  > {
  onValueChange?: (value: Time | null) => void;
  size?: ControlSize;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  locale?: string;
  /** Minute granularity in the coarse picker. Default `5`. */
  minuteStep?: number;
  /** Also pick seconds; the field then shows a seconds segment. */
  granularity?: "minute" | "second";
  secondStep?: number;
  /** "Now" action in the popover footer. Default `true`. */
  showNowAction?: boolean;
  className?: string;
  "aria-label"?: string;
}

// A time of day, with or without seconds.
//
// The value is a `Time`: 14:05 is 14:05 in every time zone, because a time-only
// value does not have one. If a product needs "14:05 in Berlin", that is a
// ZonedDateTime — use DateTimePicker.
export function TimePicker({
  onValueChange,
  size = "md",
  invalid,
  disabled,
  readOnly,
  locale,
  minuteStep = 5,
  granularity = "minute",
  secondStep = 5,
  showNowAction = true,
  className,
  value,
  ...props
}: TimePickerProps) {
  const field = useField();
  const isInvalid = invalid ?? field.invalid;
  const [open, setOpen] = useState(false);

  const formatOptions: TimeFormatOptions = {
    locale,
    hourCycle: props.hourCycle === 12 ? 12 : props.hourCycle === 24 ? 24 : undefined,
    granularity,
  };
  const resolved = value ?? null;
  const hourCycle = props.hourCycle ?? (formatTimeValue(new Time(13, 0), formatOptions).includes("PM") ? 12 : 24);
  const step = Math.max(1, Math.round(minuteStep));
  const resolvedSecondStep = Math.max(1, Math.round(secondStep));

  const hourOptions: ColumnOption[] =
    hourCycle === 12
      ? Array.from({ length: 12 }, (_, index) => ({ value: index + 1, label: String(index + 1).padStart(2, "0") }))
      : Array.from({ length: 24 }, (_, hour) => ({ value: hour, label: String(hour).padStart(2, "0") }));

  const minuteOptions: ColumnOption[] = Array.from({ length: Math.ceil(60 / step) }, (_, index) => {
    const minute = index * step;
    return { value: minute, label: String(minute).padStart(2, "0") };
  });

  const secondOptions: ColumnOption[] = Array.from(
    { length: Math.ceil(60 / resolvedSecondStep) },
    (_, index) => {
      const second = index * resolvedSecondStep;
      return { value: second, label: String(second).padStart(2, "0") };
    },
  );

  const meridiem = resolved ? (resolved.hour >= 12 ? 1 : 0) : 0;
  const hour12 = resolved ? (resolved.hour % 12 === 0 ? 12 : resolved.hour % 12) : 12;

  // Commits one column at a time, keeping the rest of the clock intact.
  const commit = (next: { hour?: number; minute?: number; second?: number; meridiem?: number }) => {
    const currentHour = resolved?.hour ?? 0;
    const currentMinute = resolved?.minute ?? 0;
    const currentSecond = resolved && "second" in resolved ? (resolved.second ?? 0) : 0;

    let hour = currentHour;
    if (next.hour !== undefined) {
      hour = hourCycle === 12 ? (next.hour % 12) + ((next.meridiem ?? meridiem) === 1 ? 12 : 0) : next.hour;
    } else if (next.meridiem !== undefined) {
      hour = (hour12 % 12) + (next.meridiem === 1 ? 12 : 0);
    }
    const minute = next.minute ?? currentMinute;
    const second = next.second ?? currentSecond;

    onValueChange?.(granularity === "second" ? new Time(hour, minute, second) : new Time(hour, minute));
  };

  return (
    <LocaleProvider locale={locale}>
      <RacTimeField
        {...props}
        value={value}
        onChange={(next) => onValueChange?.(next)}
        granularity={granularity}
        isInvalid={isInvalid}
        isDisabled={disabled ?? field.disabled}
        isReadOnly={readOnly ?? field.readOnly}
        className="flex min-w-0 flex-col"
      >
      <RacGroup
        className={cn(
          inputShellClass,
          shellBySize[size],
          "gap-0",
          isInvalid && "border-negative shadow-[0_0_0_3px_var(--negative-soft)]",
          field.readOnly && "border-dashed bg-surface-canvas",
          className,
        )}
        id={field.id}
        aria-describedby={field.describedBy}
        aria-labelledby={field.labelId}
      >
        <DateInput className="flex flex-1 items-center gap-0.5 overflow-hidden px-2.5">
          {(segment) => renderSegment(segment)}
        </DateInput>
        <PopoverRoot open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <RacButton
              aria-label="Choose a time"
              className={cn(
                "mr-1 grid shrink-0 place-items-center rounded-xs text-fg-muted luc-transition luc-focus",
                "hover:bg-surface-interactive-hover hover:text-fg-primary",
                /* 24 px at every size: see `triggerBySize` in `date-picker.tsx`. */
                size === "lg" ? "size-7" : "size-6",
              )}
            >
              <RiTimeLine aria-hidden="true" className="size-4" />
            </RacButton>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={6} className="w-fit max-w-[22rem] p-2.5">
            <div className="flex items-stretch gap-2">
              <TimeColumn
                label="Hour"
                options={hourOptions}
                selected={hourCycle === 12 ? hour12 : (resolved?.hour ?? 0)}
                onSelect={(hour) => commit({ hour })}
              />
              <TimeColumn
                label="Minute"
                options={minuteOptions}
                selected={resolved?.minute ?? 0}
                onSelect={(minute) => commit({ minute })}
              />
              {granularity === "second" ? (
                <TimeColumn
                  label="Second"
                  options={secondOptions}
                  selected={resolved && "second" in resolved ? (resolved.second ?? 0) : 0}
                  onSelect={(second) => commit({ second })}
                />
              ) : null}
              {hourCycle === 12 ? (
                <TimeColumn
                  label="AM/PM"
                  options={[
                    { value: 0, label: "AM" },
                    { value: 1, label: "PM" },
                  ]}
                  selected={meridiem}
                  onSelect={(period) => commit({ meridiem: period })}
                />
              ) : null}
            </div>
            {showNowAction ? (
              <div className="mt-2 flex items-center justify-between border-t border-line-subtle pt-2">
                <span className="text-caption text-fg-muted">
                  {resolved ? formatTimeValue(resolved, formatOptions) : "No time set"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const current = now(getLocalTimeZone());
                    const time = new Time(current.hour, current.minute, current.second);
                    onValueChange?.(granularity === "second" ? time : new Time(time.hour, time.minute));
                  }}
                  className={cn(
                    "rounded-xs px-1.5 py-1 text-caption text-fg-muted luc-transition luc-focus",
                    "hover:bg-surface-interactive-hover hover:text-fg-primary",
                  )}
                >
                  Now
                </button>
              </div>
            ) : null}
          </PopoverContent>
        </PopoverRoot>
      </RacGroup>
      </RacTimeField>
    </LocaleProvider>
  );
}
