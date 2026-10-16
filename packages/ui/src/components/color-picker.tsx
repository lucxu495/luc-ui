"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import { cn } from "../utils/cn";
import { formatHexColor, hsvToRgb, parseHexColor, rgbToHsv, type Hsv } from "../utils/color";
import { Button } from "./button-base";
import { Input } from "./input";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "./popover";
import { Slider } from "./slider";
import { Text } from "./typography";

/**
 * LUC ColorPicker — pick a colour, get a hex string back.
 *
 * The accessibility decision drives the whole design: a two-axis
 * "saturation × brightness" square is a *paint* surface, not a control, and
 * pretending it is a slider would be a lie a screen-reader user pays for. So
 * the square is pointer-only and `aria-hidden`, and the keyboard path is three
 * real sliders (hue, saturation, brightness) plus a text field that accepts any
 * hex notation. Every value a pointer can reach is reachable from the keyboard;
 * the square is the shortcut, not the mechanism.
 *
 * `value`/`defaultValue` are hex strings — what a form, a CSS variable or a
 * design token actually stores — never an opaque colour object.
 */

export type ColorPickerFormat = "hex" | "rgb";

export interface ColorPickerSwatch {
  value: string;
  /** Shown as the tooltip and the accessible name. */
  label: string;
}

export interface ColorPickerProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Preset swatches. Supply the product's own palette; there is no default set. */
  swatches?: readonly ColorPickerSwatch[];
  label?: string;
  disabled?: boolean;
  className?: string;
}

const DEFAULT_COLOR = "#3b6ef5";

function normalize(input: string): string | null {
  const parsed = parseHexColor(input);
  return parsed ? formatHexColor(parsed) : null;
}

export function ColorPicker({
  value,
  defaultValue = DEFAULT_COLOR,
  onValueChange,
  swatches = [],
  label = "Colour",
  disabled = false,
  className,
}: ColorPickerProps) {
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(() => normalize(defaultValue) ?? DEFAULT_COLOR);
  const current = controlled ? normalize(value) ?? DEFAULT_COLOR : internal;
  const [draft, setDraft] = useState<string | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const fieldId = useId();

  const hsv = useMemo<Hsv>(() => rgbToHsv(parseHexColor(current) ?? { r: 59, g: 110, b: 245, a: 1 }), [current]);

  const commit = useCallback(
    (next: string) => {
      const hex = normalize(next);
      if (!hex) return;
      if (!controlled) setInternal(hex);
      onValueChange?.(hex);
    },
    [controlled, onValueChange],
  );

  const commitHsv = useCallback(
    (next: Hsv) => commit(formatHexColor(hsvToRgb(next))),
    [commit],
  );

  const pickFromArea = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = areaRef.current?.getBoundingClientRect();
      if (!rect) return;
      const s = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
      const v = 1 - Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
      commitHsv({ ...hsv, s, v });
    },
    [commitHsv, hsv],
  );

  const hexValue = draft ?? current;

  return (
    <PopoverRoot>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={`${label}: ${current}`}
          className={cn(
            "luc-transition luc-focus inline-flex h-control-md items-center gap-2 rounded-md border border-line-default bg-surface-default px-2 pr-2.5",
            "text-label text-fg-secondary shadow-rest hover:border-line-strong hover:bg-surface-interactive-hover",
            "disabled:pointer-events-none disabled:opacity-60",
            className,
          )}
        >
          <span
            aria-hidden="true"
            style={{ "--luc-swatch": current } as React.CSSProperties}
            className="size-4 shrink-0 rounded-sm border border-line-subtle bg-[var(--luc-swatch)] shadow-well"
          />
          <span className="font-mono text-caption uppercase">{current}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent width="sm" align="start" className="flex w-64 flex-col gap-3">
        <div
          ref={areaRef}
          aria-hidden="true"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            pickFromArea(event);
          }}
          onPointerMove={(event) => {
            if (event.buttons === 1) pickFromArea(event);
          }}
          style={
            {
              "--luc-hue": formatHexColor(hsvToRgb({ h: hsv.h, s: 1, v: 1 })),
            } as React.CSSProperties
          }
          className={cn(
            "relative h-32 w-full cursor-crosshair rounded-md border border-line-subtle",
            "bg-[linear-gradient(to_top,black,transparent),linear-gradient(to_right,white,var(--luc-hue))]",
          )}
        >
          <span
            className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_var(--line-strong)]"
            style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
          />
        </div>

        <Slider
          value={Math.round(hsv.h)}
          min={0}
          max={360}
          size="sm"
          label={`${label} hue`}
          showValue="never"
          onValueChange={(next) => commitHsv({ ...hsv, h: next })}
        />
        <Slider
          value={Math.round(hsv.s * 100)}
          min={0}
          max={100}
          size="sm"
          label={`${label} saturation`}
          showValue="never"
          onValueChange={(next) => commitHsv({ ...hsv, s: next / 100 })}
        />
        <Slider
          value={Math.round(hsv.v * 100)}
          min={0}
          max={100}
          size="sm"
          label={`${label} brightness`}
          showValue="never"
          onValueChange={(next) => commitHsv({ ...hsv, v: next / 100 })}
        />

        <div className="flex items-center gap-2">
          <label htmlFor={fieldId} className="sr-only">
            {`${label} hex value`}
          </label>
          <Input
            id={fieldId}
            value={hexValue}
            size="sm"
            spellCheck={false}
            autoComplete="off"
            className="font-mono uppercase"
            onChange={(event) => {
              setDraft(event.target.value);
              const hex = normalize(event.target.value);
              if (hex) commit(hex);
            }}
            onBlur={() => setDraft(null)}
          />
        </div>

        {swatches.length > 0 ? (
          <>
            <Text variant="micro" tone="muted">
              Presets
            </Text>
            <div role="group" aria-label={`${label} presets`} className="flex flex-wrap gap-1.5">
              {swatches.map((swatch) => (
                <button
                  key={swatch.value}
                  type="button"
                  aria-label={swatch.label}
                  onClick={() => commit(swatch.value)}
                  style={{ "--luc-swatch": swatch.value } as React.CSSProperties}
                  className={cn(
                    "luc-transition luc-focus size-6 rounded-sm border border-line-subtle bg-[var(--luc-swatch)]",
                    "hover:scale-110 hover:border-line-strong",
                  )}
                />
              ))}
            </div>
          </>
        ) : null}

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <Text variant="caption" tone="muted" className="font-mono luc-numeric">
            {hsvToRgb(hsv).r}, {hsvToRgb(hsv).g}, {hsvToRgb(hsv).b}
          </Text>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => commit(normalize(defaultValue) ?? DEFAULT_COLOR)}
          >
            Reset
          </Button>
        </div>
      </PopoverContent>
    </PopoverRoot>
  );
}
