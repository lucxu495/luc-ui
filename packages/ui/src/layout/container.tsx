import { cn } from "../utils/cn";

export interface ContainerProps extends React.ComponentPropsWithRef<"div"> {
  width?: "content" | "prose" | "full";
  /** Horizontal padding. `false` when the caller owns the gutter. */
  gutter?: boolean;
}

/** Page-level width constraint. The only component allowed to set max-width. */
export function Container({
  className,
  width = "content",
  gutter = true,
  ...props
}: ContainerProps) {
  return (
    <div
      data-slot="container"
      className={cn(
        "mx-auto w-full",
        width === "content" && "max-w-[var(--container-content)]",
        width === "prose" && "max-w-[var(--container-prose)]",
        gutter && "px-5 sm:px-7 lg:px-9",
        className,
      )}
      {...props}
    />
  );
}
