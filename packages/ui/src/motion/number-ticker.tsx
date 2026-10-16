"use client";

import { animate } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";
import { formatNumber, type NumericFormatOptions } from "../utils/format";
import { useReducedMotion } from "../hooks/use-reduced-motion";

export interface NumberTickerProps extends Omit<React.ComponentPropsWithRef<"span">, "children"> {
  value: number | null | undefined;
  kind?: NumericFormatOptions["kind"];
  currency?: string;
  suffix?: string;
  signed?: boolean;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  /** Roll duration in seconds. 0.45–0.7 reads as quick and confident. */
  duration?: number;
  /** Count up from this value on first paint. Omit to start at `value`. */
  startFrom?: number;
  align?: "left" | "right" | "center";
  /**
   * `count` rolls the whole number (the V1.1 behaviour).
   * `digits` rolls each digit column independently, so changing the hundreds
   * place never disturbs the units — the premium treatment for a headline
   * number that updates in place.
   */
  variant?: "count" | "digits";
  /** Replace the built-in formatter entirely. */
  format?: (value: number) => string;
}

// LUC NumberTicker.
//
// Width is reserved by an invisible copy of the final string, so a metric never
// reflows while it counts. Digits are tabular. Under reduced motion the number
// simply *is* the new value — no rolling.
export function NumberTicker({
  className,
  value,
  kind = "number",
  currency,
  suffix,
  signed,
  locale,
  minimumFractionDigits,
  maximumFractionDigits,
  duration = 0.55,
  startFrom,
  align = "left",
  variant = "count",
  format,
  ...props
}: NumberTickerProps) {
  const nodeRef = useRef<HTMLSpanElement | null>(null);
  const previousValue = useRef<number>(startFrom ?? value ?? 0);
  const reducedMotion = useReducedMotion();

  const formatValue = useCallback(
    (input: number) =>
      format
        ? format(input)
        : formatNumber(input, {
            kind,
            currency,
            suffix,
            signed,
            locale,
            minimumFractionDigits,
            maximumFractionDigits,
          }),
    [format, kind, currency, suffix, signed, locale, minimumFractionDigits, maximumFractionDigits],
  );

  const isUnavailable = value === null || value === undefined || !Number.isFinite(value);
  const finalText = isUnavailable ? "—" : formatValue(value as number);
  /*
   * The rolling layer's first value is rendered by React so the number is
   * present in the server HTML (and with JavaScript disabled). After that the
   * effect owns the text: React must not overwrite a frame mid-animation.
   */
  const [initialText] = useState(() => finalText);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    if (isUnavailable) {
      node.textContent = "—";
      return;
    }
    const target = value as number;
    const from = previousValue.current;
    previousValue.current = target;

    if (reducedMotion || duration <= 0 || from === target) {
      node.textContent = formatValue(target);
      return;
    }

    const controls = animate(from, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        node.textContent = formatValue(latest);
      },
      onComplete: () => {
        node.textContent = formatValue(target);
      },
    });

    return () => controls.stop();
  }, [value, isUnavailable, reducedMotion, duration, formatValue]);

  if (variant === "digits") {
    return (
      <span
        data-slot="number-ticker"
        data-variant="digits"
        data-numeric
        className={cn("luc-numeric relative inline-block tabular-nums", className)}
        {...props}
      >
        <span className="invisible" aria-hidden="true">
          {finalText}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-0 flex items-center",
            align === "left" && "justify-start",
            align === "right" && "justify-end",
            align === "center" && "justify-center",
          )}
        >
          <DigitFlow text={finalText} reduced={reducedMotion} duration={duration} />
        </span>
        <span className="sr-only">{finalText}</span>
      </span>
    );
  }

  return (
    <span
      data-slot="number-ticker"
      data-numeric
      className={cn("luc-numeric relative inline-block tabular-nums", className)}
      {...props}
    >
      <span className="invisible" aria-hidden="true">
        {finalText}
      </span>
      <span
        ref={nodeRef}
        aria-hidden="true"
        className={cn(
          "absolute inset-0 flex items-center",
          align === "left" && "justify-start",
          align === "right" && "justify-end",
          align === "center" && "justify-center",
        )}
      >
        {initialText}
      </span>
      <span className="sr-only">{finalText}</span>
    </span>
  );
}

/**
 * The digit-level renderer.
 *
 * Each digit position is a 1em-tall window over a 0–9 column; the column simply
 * translates to the current digit, so a value change moves only the digits that
 * actually changed and everything else stays perfectly still. Punctuation,
 * currency symbols, signs and suffixes are not digits and render statically, so
 * "$1,284.31" keeps its exact shape throughout the transition.
 *
 * Widths come from the reserved invisible copy in `NumberTicker`, and the glyphs
 * are tabular, so nothing reflows mid-roll.
 */
function DigitFlow({ text, reduced, duration }: { text: string; reduced: boolean; duration: number }) {
  return (
    <span data-slot="digit-flow" className="inline-flex items-center tabular-nums">
      {Array.from(text).map((char, index) => {
        if (char >= "0" && char <= "9") {
          return (
            <DigitColumn
              key={`${char}-${index}`}
              digit={Number(char)}
              reduced={reduced}
              duration={duration}
            />
          );
        }
        return (
          <span key={`${char}-${index}`} className="inline-block whitespace-pre">
            {char}
          </span>
        );
      })}
    </span>
  );
}

function DigitColumn({
  digit,
  reduced,
  duration,
}: {
  digit: number;
  reduced: boolean;
  duration: number;
}) {
  const target = `-${digit}em`;
  return (
    <span
      data-slot="digit-column"
      data-digit={digit}
      className="relative inline-block h-[1em] w-[1ch] overflow-hidden align-baseline"
    >
      {/*
       * A CSS transition rather than a Motion animation: the track simply holds
       * the new position, and the browser interpolates between the old and the
       * new value. That keeps the digit flow — the most commonly rendered
       * primitive in the system — free of the Motion runtime, and it inherits
       * the global reduced-motion clamp for free.
       */}
      <span
        data-slot="digit-column-track"
        className={cn(
          "absolute inset-x-0 top-0 flex flex-col items-center",
          !reduced && duration > 0 && "[transition:transform_var(--digit-duration)_cubic-bezier(0.16,1,0.3,1)]",
        )}
        style={
          {
            transform: `translateY(${target})`,
            ["--digit-duration" as string]: `${duration}s`,
          } as React.CSSProperties
        }
      >
        {Array.from({ length: 10 }, (_, value) => (
          <span key={value} className="block h-[1em] leading-[1em]">
            {value}
          </span>
        ))}
      </span>
    </span>
  );
}
