"use client";

import { Avatar as RadixAvatar } from "radix-ui";
import { cn } from "../utils/cn";

/**
 * LUC Avatar — identity for a person, a team, a workspace or an agent.
 *
 * Two rules make an avatar usable in a dense product rather than merely
 * decorative:
 *
 *  1. **The fallback is designed, not a failure state.** Radix holds the image
 *     back until it loads, so the initials are what most readers see on a cold
 *     cache. They get a deterministic tint derived from the name, so the same
 *     person is the same colour in a table, a comment thread and a header.
 *  2. **The label is the name.** A single screen-reader string is the only shape
 *     that survives every reader; `alt` on an `<img>` inside a link is read
 *     twice.
 *
 * `AvatarGroup` overlaps its children and exposes the overflow count as real
 * text (`+3`), never as a hidden badge.
 */

export const AvatarRoot = RadixAvatar.Root;

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeClass: Record<AvatarSize, string> = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-micro",
  md: "size-10 text-label",
  lg: "size-12 text-body",
  xl: "size-16 text-title",
};

export type AvatarShape = "circle" | "rounded" | "square";

const shapeClass: Record<AvatarShape, string> = {
  circle: "rounded-full",
  rounded: "rounded-lg",
  square: "rounded-sm",
};

/**
 * Deterministic tint.
 *
 * The name is hashed to one of six semantic surfaces so two people in the same
 * list never share a colour by accident, and the colour does not move when a
 * list is re-sorted — which is exactly what a random tint would do.
 */
function tintIndex(seed: string, buckets: number): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 1_000_003;
  }
  return Math.abs(hash) % buckets;
}

export interface AvatarProps extends React.ComponentPropsWithRef<typeof RadixAvatar.Root> {
  /** Image source. Falls back to `fallback` until it loads. */
  src?: string;
  /** Alt text for the image; also the tint seed when `name` is absent. */
  alt?: string;
  /** Initials, an icon, or any node shown before the image resolves. */
  fallback?: React.ReactNode;
  /** Name used for the accessible label and the deterministic tint. */
  name?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  /** Status dot in the corner. */
  status?: "online" | "away" | "offline";
}

export function Avatar({
  className,
  src,
  alt,
  fallback,
  name,
  size = "md",
  shape = "circle",
  status,
  ...props
}: AvatarProps) {
  const label = name ?? alt;
  const tint = tintIndex(label ?? "luc", 6);
  return (
    <RadixAvatar.Root
      data-slot="avatar"
      /*
       * One name for the whole avatar. `role="img"` with `aria-label` is the
       * only shape that reads identically in every screen reader; the initials
       * and the status dot are decorative and stay out of the tree entirely.
       */
      role="img"
      aria-label={label ?? "Avatar"}
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden",
        "border border-line-subtle bg-surface-interactive font-medium text-fg-secondary shadow-rest",
        sizeClass[size],
        shapeClass[shape],
        className,
      )}
      {...props}
    >
      {src ? (
        <RadixAvatar.Image src={src} alt="" className="size-full object-cover" data-slot="avatar-image" />
      ) : null}
      <RadixAvatar.Fallback
        data-slot="avatar-fallback"
        aria-hidden="true"
        data-tint={tint}
        /*
         * No `src` means the initials *are* the avatar: they must be in the
         * first paint, not appear 200ms later. With an image the delay exists
         * so a slow network does not flash initials before the picture.
         */
        delayMs={src ? 200 : undefined}
        className={cn(
          "grid size-full place-items-center uppercase",
          /*
           * The tint is one of six token pairs, so it survives every palette;
           * no raw colour enters the component.
           */
          tint === 0 && "bg-accent-soft text-fg-accent",
          tint === 1 && "bg-info-soft text-fg-info",
          tint === 2 && "bg-positive-soft text-fg-positive",
          tint === 3 && "bg-warning-soft text-fg-warning",
          tint === 4 && "bg-negative-soft text-fg-negative",
          tint === 5 && "bg-surface-interactive text-fg-secondary",
        )}
      >
        {fallback ?? initialsOf(label)}
      </RadixAvatar.Fallback>
      {status ? (
        <span
          data-slot="avatar-status"
          aria-hidden="true"
          className={cn(
            "absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-surface-default",
            status === "online" && "bg-positive",
            status === "away" && "bg-warning",
            status === "offline" && "bg-fg-disabled",
            size === "xs" && "size-2",
          )}
        />
      ) : null}
    </RadixAvatar.Root>
  );
}

/** "Ada Lovelace" → "AL"; "luc-ui" → "LU"; "谢健" → "谢". */
export function initialsOf(name: string | undefined, max = 2): string {
  if (!name) return "?";
  const trimmed = name.trim();
  if (!trimmed) return "?";
  // CJK names are already short: take the first character, not two.
  if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/.test(trimmed)) {
    return Array.from(trimmed)[0] ?? "?";
  }
  const words = trimmed.split(/[\s._-]+/).filter(Boolean);
  const letters = words.slice(0, max).map((word) => Array.from(word)[0] ?? "");
  return letters.join("").toUpperCase() || "?";
}

export interface AvatarGroupProps extends React.ComponentPropsWithRef<"div"> {
  /** Maximum avatars rendered before the count chip. Default 4. */
  max?: number;
  /** Total number in the set. When greater than `max`, the chip shows the rest. */
  total?: number;
  size?: AvatarSize;
}

export function AvatarGroup({
  className,
  children,
  max = 4,
  total,
  size = "sm",
  ...props
}: AvatarGroupProps) {
  const items = Array.isArray(children) ? children : children ? [children] : [];
  const shown = items.slice(0, max);
  const hidden = Math.max(0, (total ?? items.length) - shown.length);

  return (
    <div data-slot="avatar-group" role="group" className={cn("flex items-center", className)} {...props}>
      {shown.map((child, index) => (
        <span key={index} className={cn("rounded-full ring-2 ring-surface-default", index > 0 && "-ml-2")}>
          {child}
        </span>
      ))}
      {hidden > 0 ? (
        <span
          data-slot="avatar-group-count"
          className={cn(
            "-ml-2 inline-grid place-items-center rounded-full border border-line-subtle bg-surface-interactive",
            "font-medium text-fg-secondary ring-2 ring-surface-default",
            sizeClass[size],
          )}
        >
          +{hidden}
        </span>
      ) : null}
    </div>
  );
}
