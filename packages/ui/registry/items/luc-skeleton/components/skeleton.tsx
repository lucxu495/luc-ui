import { cn } from "@/components/luc-ui/utils/cn";

export interface SkeletonProps extends React.ComponentPropsWithRef<"div"> {
  /** `text` is a single line, `block` a surface, `circle` an avatar. */
  variant?: "text" | "block" | "circle";
  /** Sweep a highlight across the placeholder. Default `true`. */
  shimmer?: boolean;
}

/**
 * LUC Skeleton — the default loading treatment for content and data.
 *
 * A skeleton communicates *shape*; a spinner only communicates *waiting*.
 * Prefer skeletons for pages and panels, spinners for small actions.
 */
export function Skeleton({ className, variant = "block", shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "relative isolate overflow-hidden bg-surface-interactive",
        variant === "text" && "h-3 w-full rounded-sm",
        variant === "block" && "min-h-8 w-full rounded-md",
        variant === "circle" && "size-8 rounded-full",
        shimmer &&
          "after:absolute after:inset-0 after:-translate-x-full after:bg-linear-to-r after:from-transparent after:via-line-default after:to-transparent motion-safe:after:animate-shimmer",
        className,
      )}
      {...props}
    />
  );
}

export interface SkeletonTextProps extends Omit<SkeletonProps, "variant"> {
  lines?: number;
  /** Vary line widths so the block reads as prose, not a table. */
  widths?: string[];
}

export function SkeletonText({ lines = 3, widths, className, ...props }: SkeletonTextProps) {
  const defaultWidths = ["100%", "92%", "78%", "88%", "64%"];
  return (
    <div data-slot="skeleton-text" className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          style={{ width: widths?.[index] ?? defaultWidths[index % defaultWidths.length] }}
          {...props}
        />
      ))}
    </div>
  );
}
