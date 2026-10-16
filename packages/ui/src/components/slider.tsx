"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Slider as SliderPrimitive } from "radix-ui";
import { cn } from "../utils/cn";
import { useField } from "./field";
import type { ControlSize } from "./input";

/**
 * LUC Slider / RangeSlider — a continuous numeric control.
 *
 * The use cases are thresholds, lookbacks, weights, opacities and any other
 * value that is easier to *feel* than to type. Radix supplies the hard parts
 * (pointer maths, `role="slider"` per thumb, arrow / Home / End / PageUp
 * keyboard stepping, RTL and the hidden form input); LUC supplies the groove,
 * the filled range, the thumb and the value bubble.
 *
 * It is deliberately not a mobile-style fat knob: the visible thumb is small,
 * the hit target is far larger, and the track stays quiet until the control is
 * actually being used.
 *
 *   Slider        → one value
 *   RangeSlider   → an inclusive `[min, max]` pair, two thumbs
 *
 * Values are never rescaled: a percentage slider is `min={0} max={1}` and the
 * consumer formats it, so the control cannot silently change a unit.
 */

export interface SliderMark {
  value: number;
  /** Optional caption under the tick. Omit for a bare tick. */
  label?: ReactNode;
}

type ValueDisplay = "auto" | "always" | "never";

interface SliderSizeStyle {
  root: string;
  track: string;
  thumb: string;
  bubble: string;
  tick: string;
  /**
   * Room reserved *outside* the groove for the decorations that sit outside it.
   *
   * The defect this fixes, measured on `/components/slider` before it landed:
   * the value bubble is `bottom-full` on the thumb and the mark captions are
   * `top-full` on the tick, so both were painted above and below the root's own
   * box — a root sized to the groove and the thumb (20 px at `md`) cannot contain
   * a 21 px bubble plus its 8 px gap. The bubble covered the field label above
   * the control by 21 px and a mark caption covered the description below it by
   * 7 px, which the Showcase had been working around with `mt-6`/`mb-5` on the
   * *page*. Padding is the honest fix: the room belongs to the control that
   * draws the decoration, and it is only added when that decoration is
   * configured (`showValue="never"` and mark ticks without captions reserve
   * nothing, so a compact toolbar slider keeps its 20 px).
   */
  bubbleRoom: string;
  markRoom: string;
}

const sizeStyles: Record<ControlSize, SliderSizeStyle> = {
  sm: {
    root: "h-4",
    track: "h-1",
    thumb: "size-3",
    bubble: "mb-1.5",
    tick: "size-1",
    bubbleRoom: "pt-8",
    markRoom: "pb-5",
  },
  md: {
    root: "h-5",
    track: "h-1.5",
    thumb: "size-3.5",
    bubble: "mb-2",
    tick: "size-1",
    bubbleRoom: "pt-8",
    markRoom: "pb-5",
  },
  lg: {
    root: "h-6",
    track: "h-2",
    thumb: "size-4",
    bubble: "mb-2",
    tick: "size-1.5",
    bubbleRoom: "pt-8",
    markRoom: "pb-6",
  },
};

export interface SliderProps
  extends Omit<
    React.ComponentPropsWithRef<typeof SliderPrimitive.Root>,
    "value" | "defaultValue" | "onValueChange" | "onValueCommit" | "children"
  > {
  /** Single value. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Fired when a drag or key-step settles — the right place to commit. */
  onValueCommit?: (value: number) => void;
  size?: ControlSize;
  /** Accessible name for the thumb when no `Field` label is present. */
  label?: string;
  invalid?: boolean;
  /** When to print the value next to the thumb. Default `auto` (hover, focus, drag). */
  showValue?: ValueDisplay;
  formatValue?: (value: number) => ReactNode;
  /** Optional ticks. Never generated automatically. */
  marks?: readonly SliderMark[];
}

function percentOf(value: number, min: number, max: number) {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 100;
}

/**
 * The shared shell. Both Slider and RangeSlider are this component with a
 * different value arity, so a single-thumb and a two-thumb control can never
 * drift apart visually.
 */
function SliderShell({
  values,
  onValuesChange,
  onValuesCommit,
  size = "md",
  label,
  thumbLabels,
  rootAriaLabel,
  invalid,
  showValue = "auto",
  formatValue = (value) => String(value),
  marks,
  orientation = "horizontal",
  disabled,
  className,
  id,
  min = 0,
  max = 100,
  ...props
}: Omit<
  SliderProps,
  "value" | "defaultValue" | "onValueChange" | "onValueCommit" | "aria-label"
> & {
  values: number[];
  onValuesChange: (values: number[]) => void;
  onValuesCommit?: (values: number[]) => void;
  /** One accessible name per thumb; falls back to `label`. */
  thumbLabels?: readonly string[];
  /** The consumer's `aria-label`, when it named the control that way instead. */
  rootAriaLabel?: string;
}) {
  const field = useField();
  const styles = sizeStyles[size];
  const isInvalid = invalid ?? field.invalid;
  const isDisabled = disabled ?? field.disabled;
  const vertical = orientation === "vertical";
  const [active, setActive] = useState<number | null>(null);
  /*
   * Whether the box has to make room for a decoration that is drawn outside the
   * groove. A vertical slider never does: its bubble and its captions sit beside
   * the rail, not above and below it.
   */
  const showsBubble = showValue !== "never";
  const hasMarkCaptions = marks?.some((mark) => mark.label !== undefined) ?? false;
  const bubbleRoom = !vertical && showsBubble;
  const markRoom = !vertical && hasMarkCaptions;

  // A drag can end anywhere, including outside the thumb, so the bubble clears
  // on the window rather than on the thumb's own pointerup.
  useEffect(() => {
    if (active === null) return;
    const clear = () => setActive(null);
    window.addEventListener("pointerup", clear);
    window.addEventListener("pointercancel", clear);
    return () => {
      window.removeEventListener("pointerup", clear);
      window.removeEventListener("pointercancel", clear);
    };
  }, [active]);

  const handleValueChange = useCallback(
    (next: number[]) => {
      // Radix can emit unsorted values while crossing thumbs; keep them ordered
      // so a range consumer never has to re-sort.
      const ordered = next.length > 1 ? [...next].sort((a, b) => a - b) : next;
      onValuesChange(ordered);
    },
    [onValuesChange],
  );

  const ariaLabelFor = (index: number) => {
    const explicit = thumbLabels?.[index];
    if (explicit) return explicit;
    if (label && values.length > 1) return `${label} ${index === 0 ? "minimum" : "maximum"}`;
    if (label) return label;
    /*
     * A caller who writes `aria-label` instead of `label` still means "name this
     * control". Radix forwards that attribute to the Root, where it names
     * nothing — a screen reader lands on the thumb — so the string is repeated
     * here as the fallback. Found by an axe scan over a *product page*
     * (`aria-input-field-name`), not by the component's own tests.
     */
    if (rootAriaLabel) return rootAriaLabel;
    /*
     * The primitive names a two-thumb range "Minimum"/"Maximum" itself, but only
     * when the attribute is absent: `thumbProps` is spread *after* its computed
     * `aria-label`, so passing `undefined` explicitly erases the default and the
     * thumb ends up nameless. Repeat the default here instead.
     */
    if (values.length > 1) return index === 0 ? "Minimum" : "Maximum";
    return undefined;
  };

  // A single thumb takes its name from the surrounding `Field` label. A range
  // needs two distinct names, so it relies on `label`/`thumbLabels` and
  // otherwise keeps the primitive's "Minimum value" / "Maximum value" defaults.
  const ariaLabelledBy = label || values.length > 1 ? undefined : field.labelId;

  const trackNode = (
    <SliderPrimitive.Track
      data-slot="slider-track"
      className={cn(
        "relative grow overflow-hidden rounded-full bg-surface-sunken shadow-[inset_0_0_0_1px_var(--line-subtle)]",
        isInvalid && "shadow-[inset_0_0_0_1px_var(--negative)]",
        vertical ? "h-full w-1.5" : styles.track,
      )}
    >
      <SliderPrimitive.Range
        data-slot="slider-range"
        className={cn(
          "absolute rounded-full luc-transition-slow",
          /*
           * A filled range reads as a *level*, so it carries a soft gradient
           * from the accent toward its own tint. The value stays legible in
           * every palette, and an invalid slider still wins with a flat
           * negative fill because that meaning must never be softened.
           */
          isInvalid
            ? "bg-negative"
            : "bg-[linear-gradient(to_right,color-mix(in_oklab,var(--accent-default)_62%,transparent),var(--accent-default))]",
          "group-data-[disabled]/slider:bg-line-strong",
        )}
      />
    </SliderPrimitive.Track>
  );

  const markTicks = marks?.length
    ? marks.map((mark) => {
        const percent = percentOf(mark.value, min, max);
        return (
          <span
            key={mark.value}
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute rounded-full bg-line-strong",
              styles.tick,
              vertical
                ? "left-1/2 -translate-x-1/2 translate-y-1/2"
                : "top-1/2 -translate-x-1/2 -translate-y-1/2",
            )}
            style={vertical ? { bottom: `${percent}%` } : { left: `${percent}%` }}
          >
            {mark.label ? (
              <span
                className={cn(
                  "absolute whitespace-nowrap text-micro text-fg-muted",
                  vertical ? "left-full ml-2 -translate-y-1/2" : "top-full mt-1.5 -translate-x-1/2",
                )}
              >
                {mark.label}
              </span>
            ) : null}
          </span>
        );
      })
    : null;

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      data-size={size}
      id={id ?? field.id}
      min={min}
      max={max}
      orientation={orientation}
      disabled={isDisabled}
      value={values}
      onValueChange={handleValueChange}
      onValueCommit={onValuesCommit}
      className={cn(
        "group/slider relative flex w-full touch-none select-none items-center",
        vertical && "h-40 w-5 flex-col justify-center",
        /*
         * Horizontal: the groove's own height, plus the padding a decoration
         * needs. The fixed `h-*` is dropped in that case rather than kept
         * alongside `pt-*`, because a fixed height *and* padding would shrink
         * the content box to nothing and the track and thumb would move with it.
         */
        !vertical &&
          (bubbleRoom || markRoom
            ? cn(bubbleRoom && styles.bubbleRoom, markRoom && styles.markRoom)
            : styles.root),
        isDisabled && "cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {vertical ? (
        <>
          {trackNode}
          {markTicks}
        </>
      ) : (
        /*
         * The groove and its captions share one rail, and the captions are
         * positioned against *that* box rather than against the padded root.
         *
         * Two reasons, and the first is a bug this closed: once the root carries
         * a padding band for the value bubble, `top: 50%` on a tick resolves
         * against the padded box and lands the tick *above* the groove it
         * annotates (6 px out at `md` with both decorations). Inside a rail that
         * is exactly as tall as the groove, the same rule lands the tick on the
         * groove's centre. The second is that a horizontal percentage now means a
         * percentage of the track's width — which is what a tick's position
         * always meant — instead of a percentage of the track plus one thumb.
         *
         * A vertical slider keeps the previous structure: its captions sit beside
         * the rail, nothing is padded, and its rail is a column whose height the
         * root defines.
         */
        <div data-slot="slider-rail" className="relative flex grow items-center">
          {trackNode}
          {markTicks}
        </div>
      )}

      {values.map((value, index) => {
        const visible = showValue === "always" || (showValue === "auto" && active === index);
        return (
          <SliderPrimitive.Thumb
            key={index}
            data-slot="slider-thumb"
            data-index={index}
            aria-label={ariaLabelFor(index)}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={props["aria-describedby"] ?? field.describedBy}
            aria-invalid={isInvalid || undefined}
            onPointerDown={() => setActive(index)}
            className={cn(
              "group/thumb relative block cursor-grab rounded-full border border-line-strong bg-surface-raised shadow-rest outline-none luc-transition",
              "hover:shadow-hover active:cursor-grabbing",
              /*
               * The visible thumb stays small, but it *answers*: a hover or a
               * drag makes it grow a little and pick up the accent border, so the
               * control confirms which thumb is about to move before it moves.
               * The hit target is the `before:` inset, which never changes size.
               */
              "hover:scale-110 data-[dragging]:scale-110",
              "hover:border-line-accent active:cursor-grabbing",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
              "before:absolute before:-inset-2 before:content-['']",
              "group-data-[disabled]/slider:cursor-not-allowed group-data-[disabled]/slider:border-line-subtle group-data-[disabled]/slider:bg-surface-interactive group-data-[disabled]/slider:shadow-none",
              isInvalid && "border-negative",
              styles.thumb,
            )}
          >
            {showValue === "never" ? null : (
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute z-[var(--z-tooltip)] rounded-sm border border-line-default bg-surface-overlay px-1.5 py-0.5 text-micro whitespace-nowrap text-fg-primary luc-float luc-numeric",
                  vertical
                    ? "left-full top-1/2 ml-2 -translate-y-1/2"
                    : cn("bottom-full left-1/2 -translate-x-1/2", styles.bubble),
                  "luc-transition opacity-0",
                  "group-hover/thumb:opacity-100 group-focus-within/thumb:opacity-100",
                  visible && "opacity-100",
                )}
              >
                {formatValue(value)}
              </span>
            )}
          </SliderPrimitive.Thumb>
        );
      })}
    </SliderPrimitive.Root>
  );
}

function useUncontrolled<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void) {
  const [internal, setInternal] = useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? (value as T) : internal;
  const set = useCallback(
    (next: T) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );
  return [current, set] as const;
}

/**
 * One thumb. `value`/`defaultValue` are plain numbers; the tuple the primitive
 * needs never reaches the consumer.
 */
export function Slider({
  value,
  defaultValue = 0,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  ...props
}: SliderProps) {
  const [current, setCurrent] = useUncontrolled(value, defaultValue, onValueChange);
  const rootAriaLabel = typeof props["aria-label"] === "string" ? props["aria-label"] : undefined;
  return (
    <SliderShell
      {...props}
      rootAriaLabel={rootAriaLabel}
      min={min}
      max={max}
      values={[current]}
      onValuesChange={(next) => setCurrent(next[0] ?? min)}
      onValuesCommit={(next) => onValueCommit?.(next[0] ?? min)}
    />
  );
}

export interface RangeSliderProps
  extends Omit<
    SliderProps,
    "value" | "defaultValue" | "onValueChange" | "onValueCommit" | "label" | "thumbLabels"
  > {
  /** Inclusive `[minimum, maximum]` pair. */
  value?: readonly [number, number];
  defaultValue?: readonly [number, number];
  onValueChange?: (value: [number, number]) => void;
  onValueCommit?: (value: [number, number]) => void;
  label?: string;
  /** One accessible name per thumb, when "minimum"/"maximum" is not enough. */
  thumbLabels?: readonly [string, string];
  /** Minimum gap between the two thumbs, in `step` increments. */
  minStepsBetweenThumbs?: number;
}

/**
 * Two thumbs, one inclusive range. The value is always a sorted tuple, so
 * `values[0] <= values[1]` holds for every consumer.
 */
export function RangeSlider({
  value,
  defaultValue = [25, 75],
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  thumbLabels,
  ...props
}: RangeSliderProps) {
  const [current, setCurrent] = useUncontrolled<[number, number]>(
    value ? [value[0], value[1]] : undefined,
    [defaultValue[0], defaultValue[1]],
    onValueChange,
  );
  const rootAriaLabel = typeof props["aria-label"] === "string" ? props["aria-label"] : undefined;
  return (
    <SliderShell
      {...props}
      rootAriaLabel={rootAriaLabel}
      min={min}
      max={max}
      values={[current[0], current[1]]}
      thumbLabels={thumbLabels}
      onValuesChange={(next) => setCurrent([next[0] ?? min, next[1] ?? max])}
      onValuesCommit={(next) => onValueCommit?.([next[0] ?? min, next[1] ?? max])}
    />
  );
}
