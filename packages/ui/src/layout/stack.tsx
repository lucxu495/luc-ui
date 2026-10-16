import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export type Gap = "none" | "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type Align = "start" | "center" | "end" | "stretch" | "baseline";
export type Justify = "start" | "center" | "end" | "between" | "around";

export const gapClass: Record<Gap, string> = {
  none: "gap-0",
  "2xs": "gap-1",
  xs: "gap-1.5",
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
  xl: "gap-6",
  "2xl": "gap-8",
};

export const alignClass: Record<Align, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

export const justifyClass: Record<Justify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
};

export interface StackProps extends React.ComponentPropsWithRef<"div"> {
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  /** Render as `<section>`, `<ul>`, `<nav>` … without losing the API. */
  as?: "div" | "section" | "ul" | "ol" | "nav" | "aside" | "header" | "footer" | "form";
  children?: ReactNode;
}

/** Vertical rhythm primitive. One direction, one gap, no surprises. */
export function Stack({
  className,
  gap = "md",
  align,
  justify,
  as = "div",
  ...props
}: StackProps) {
  const Tag = as as React.ElementType;
  return (
    <Tag
      data-slot="stack"
      className={cn("flex flex-col", gapClass[gap], align && alignClass[align], justify && justifyClass[justify], className)}
      {...props}
    />
  );
}
