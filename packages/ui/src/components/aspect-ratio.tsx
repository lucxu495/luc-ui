"use client";

import { AspectRatio as RadixAspectRatio } from "radix-ui";
import { cn } from "../utils/cn";

/**
 * LUC AspectRatio — a box that keeps a ratio while it is being laid out.
 *
 * `radix-ui`'s implementation is the only one worth having: it reserves the
 * space with a padding-based slot before the child loads, so a media card never
 * causes a layout shift and never triggers a Cumulative Layout Shift penalty.
 * `image` and `video` presets exist because nobody remembers that a 16:9 video
 * is `16 / 9` and not `1.78`.
 */

export type AspectPreset = "square" | "video" | "photo" | "wide" | "portrait" | "ultrawide";

const presetRatio: Record<AspectPreset, number> = {
  square: 1,
  video: 16 / 9,
  photo: 4 / 3,
  wide: 21 / 9,
  portrait: 3 / 4,
  ultrawide: 32 / 9,
};

export interface AspectRatioProps
  extends Omit<React.ComponentPropsWithRef<typeof RadixAspectRatio.Root>, "ratio"> {
  /** A numeric ratio, or a named preset. Default `1` (square). */
  ratio?: number | AspectPreset;
}

export function AspectRatio({ className, ratio = "square", ...props }: AspectRatioProps) {
  const resolved = typeof ratio === "number" ? ratio : (presetRatio[ratio] ?? 1);
  return (
    <RadixAspectRatio.Root
      data-slot="aspect-ratio"
      ratio={resolved}
      className={cn("relative w-full overflow-hidden", className)}
      {...props}
    />
  );
}
