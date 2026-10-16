import { cn } from "../utils/cn";
import { gapClass, type Gap } from "./stack";

export type Columns = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 12;

const columnsClass: Record<Columns, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  8: "grid-cols-2 sm:grid-cols-4 lg:grid-cols-8",
  12: "grid-cols-4 sm:grid-cols-6 lg:grid-cols-12",
};

const minWidthClass = {
  none: "",
  sm: "[grid-template-columns:repeat(auto-fill,minmax(12rem,1fr))]",
  md: "[grid-template-columns:repeat(auto-fill,minmax(16rem,1fr))]",
  lg: "[grid-template-columns:repeat(auto-fill,minmax(20rem,1fr))]",
  xl: "[grid-template-columns:repeat(auto-fill,minmax(26rem,1fr))]",
} as const;

export interface GridProps extends React.ComponentPropsWithRef<"div"> {
  columns?: Columns;
  /** Auto-fit track sizing. Overrides `columns` when set. */
  minItemWidth?: keyof typeof minWidthClass;
  gap?: Gap;
}

/** Responsive grid. Picks a sane breakpoint stack per column count. */
export function Grid({ className, columns = 3, minItemWidth = "none", gap = "md", ...props }: GridProps) {
  return (
    <div
      data-slot="grid"
      className={cn(
        "grid",
        minItemWidth === "none" ? columnsClass[columns] : minWidthClass[minItemWidth],
        gapClass[gap],
        className,
      )}
      {...props}
    />
  );
}
