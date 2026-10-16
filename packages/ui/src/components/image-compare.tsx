"use client";

import { useId, useState } from "react";
import { cn } from "../utils/cn";

/**
 * LUC ImageCompare — a before/after wipe.
 *
 * The mechanism is a real `<input type="range">` lying over the picture, not a
 * custom pointer handler. That choice buys the whole keyboard and touch story
 * for free — arrow keys step, Home/End jump, a tap anywhere on a track sets the
 * value, and assistive technology announces "38, slider" instead of an
 * unlabelled div — while the visible parts (the two images, the divider, the
 * labels) stay decorative.
 *
 * It is used for a processed vs. original image, a forecast vs. a baseline, or
 * a design revision against its predecessor: any pair where the interesting
 * information is the *difference* at a given position.
 */

export interface CompareImage {
  src: string;
  alt: string;
}

export interface ImageCompareProps extends Omit<React.ComponentPropsWithRef<"div">, "onChange"> {
  /** Shown on the left of the wipe. */
  before: CompareImage;
  /** Shown on the right of the wipe. */
  after: CompareImage;
  /** 0–100. The share of the frame given to `before`. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Accessible name for the slider. */
  label?: string;
  beforeLabel?: string;
  afterLabel?: string;
  aspect?: "square" | "video" | "wide";
}

const aspectClass = {
  square: "aspect-square",
  video: "aspect-video",
  wide: "aspect-[21/9]",
} as const;

export function ImageCompare({
  before,
  after,
  value,
  defaultValue = 50,
  onValueChange,
  label = "Compare images",
  beforeLabel = "Before",
  afterLabel = "After",
  aspect = "video",
  className,
  ...props
}: ImageCompareProps) {
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const position = Math.min(Math.max(controlled ? (value as number) : internal, 0), 100);
  const inputId = useId();

  const commit = (next: number) => {
    if (!controlled) setInternal(next);
    onValueChange?.(next);
  };

  return (
    <div
      data-slot="image-compare"
      className={cn(
        "relative overflow-hidden rounded-lg border border-line-subtle bg-surface-sunken luc-rest",
        aspectClass[aspect],
        className,
      )}
      {...props}
    >
      <img src={after.src} alt={after.alt} className="absolute inset-0 size-full object-cover" draggable={false} />
      <img
        src={before.src}
        alt={before.alt}
        draggable={false}
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        className="absolute inset-0 size-full object-cover"
      />

      <span
        aria-hidden="true"
        className="absolute top-2 left-2 rounded-sm bg-surface-overlay/80 px-1.5 py-0.5 text-micro text-fg-secondary backdrop-blur-sm"
      >
        {beforeLabel}
      </span>
      <span
        aria-hidden="true"
        className="absolute top-2 right-2 rounded-sm bg-surface-overlay/80 px-1.5 py-0.5 text-micro text-fg-secondary backdrop-blur-sm"
      >
        {afterLabel}
      </span>

      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <input
        id={inputId}
        type="range"
        min={0}
        max={100}
        step={1}
        value={position}
        onChange={(event) => commit(Number(event.target.value))}
        className="peer absolute inset-0 size-full cursor-ew-resize appearance-none bg-transparent opacity-0"
      />
      <span
        aria-hidden="true"
        style={{ left: `${position}%` }}
        className={cn(
          "pointer-events-none absolute inset-y-0 -translate-x-1/2 luc-transition",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring",
        )}
      >
        <span className="block h-full w-0.5 bg-surface-overlay shadow-[0_0_0_1px_var(--line-strong)]" />
        <span className="absolute top-1/2 left-1/2 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line-strong bg-surface-overlay text-fg-secondary shadow-rest">
          <span className="block h-3 w-0.5 bg-fg-muted" />
          <span className="absolute h-3 w-0.5 translate-x-1.5 bg-fg-muted" />
        </span>
      </span>
      <span aria-hidden="true" className="sr-only luc-numeric">
        {position}
      </span>
    </div>
  );
}
