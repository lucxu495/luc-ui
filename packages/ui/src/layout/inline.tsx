import type { ReactNode } from "react";
import { cn } from "../utils/cn";
import { alignClass, gapClass, justifyClass, type Align, type Gap, type Justify } from "./stack";

export interface InlineProps extends React.ComponentPropsWithRef<"div"> {
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  /** Allow items to wrap onto multiple lines. Default `true`. */
  wrap?: boolean;
  as?: "div" | "span" | "ul" | "li" | "nav" | "header" | "footer" | "label";
  children?: ReactNode;
}

/** Horizontal cluster: toolbars, meta rows, label+value pairs. */
export function Inline({
  className,
  gap = "sm",
  align = "center",
  justify,
  wrap = true,
  as = "div",
  ...props
}: InlineProps) {
  const Tag = as as React.ElementType;
  return (
    <Tag
      data-slot="inline"
      className={cn(
        "flex",
        wrap ? "flex-wrap" : "flex-nowrap",
        gapClass[gap],
        alignClass[align],
        justify && justifyClass[justify],
        className,
      )}
      {...props}
    />
  );
}
