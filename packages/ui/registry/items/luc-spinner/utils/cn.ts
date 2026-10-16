import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * LUC UI renames the Tailwind type scale to semantic roles (`text-label`,
 * `text-body`, `text-display`). Without this, tailwind-merge cannot tell
 * `text-label` (a font size) from `text-fg-muted` (a colour) and silently drops
 * one of them — which is exactly how a primary button ends up with unreadable
 * label colour.
 */
const FONT_SIZE_ROLES = [
  "micro",
  "caption",
  "label",
  "body",
  "body-lg",
  "title",
  "heading-sm",
  "heading",
  "display-sm",
  "display",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: FONT_SIZE_ROLES }],
    },
  },
});

/**
 * Merge conditional class names and de-duplicate conflicting Tailwind
 * utilities (last one wins). Every LUC component funnels `className` here so
 * consumer overrides behave predictably.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
