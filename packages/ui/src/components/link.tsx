import { cn } from "../utils/cn";

export interface LinkProps extends React.ComponentPropsWithRef<"a"> {
  variant?: "default" | "muted" | "accent";
  /** Show the underline on hover only (default) or always. */
  underline?: "hover" | "always" | "none";
}

/**
 * Text link. Uses a background-image underline so the rule sits below the
 * descenders and animates without shifting layout.
 */
export function Link({ className, variant = "default", underline = "hover", children, ...props }: LinkProps) {
  return (
    <a
      data-slot="link"
      className={cn(
        "luc-transition luc-focus relative inline-flex items-center gap-1 rounded-xs",
        "decoration-line-strong decoration-[1.5px] underline-offset-[3px]",
        variant === "default" && "text-fg-primary hover:text-fg-accent",
        variant === "muted" && "text-fg-secondary hover:text-fg-primary",
        variant === "accent" && "text-fg-accent hover:text-accent-strong",
        underline === "hover" && "underline decoration-transparent hover:decoration-current",
        underline === "always" && "underline",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}
