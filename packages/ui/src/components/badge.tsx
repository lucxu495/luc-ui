import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

export const badgeVariants = cva(
  [
    "inline-flex select-none items-center gap-1.5 whitespace-nowrap",
    "font-medium luc-numeric",
    "border border-transparent",
  ],
  {
    variants: {
      tone: {
        neutral: "bg-surface-interactive text-fg-secondary border-line-subtle",
        accent: "bg-accent-soft text-fg-accent border-line-accent",
        positive: "bg-positive-soft text-fg-positive border-positive-line",
        negative: "bg-negative-soft text-fg-negative border-negative-line",
        warning: "bg-warning-soft text-fg-warning border-warning-line",
        info: "bg-info-soft text-fg-info border-info-line",
        outline: "bg-transparent text-fg-secondary border-line-default",
      },
      size: {
        sm: "h-5 rounded-xs px-1.5 text-micro uppercase",
        md: "h-6 rounded-sm px-2 text-caption",
        lg: "h-7 rounded-sm px-2.5 text-label",
      },
      shape: {
        rounded: "",
        pill: "rounded-full",
      },
    },
    defaultVariants: { tone: "neutral", size: "md", shape: "rounded" },
  },
);

export interface BadgeProps
  extends React.ComponentPropsWithRef<"span">,
    VariantProps<typeof badgeVariants> {
  /** Small leading status dot. */
  dot?: boolean;
  dotClassName?: string;
}

export function Badge({ className, tone, size, shape, dot, dotClassName, children, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ tone, size, shape }), className)} {...props}>
      {dot ? (
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full bg-current opacity-80", dotClassName)}
        />
      ) : null}
      {children}
    </span>
  );
}

export interface TagProps extends React.ComponentPropsWithRef<"span"> {
  onRemove?: () => void;
  removeLabel?: string;
}

/** Editable token/label chip — a Badge that can be dismissed. */
export function Tag({ className, children, onRemove, removeLabel = "Remove", ...props }: TagProps) {
  return (
    <span
      data-slot="tag"
      className={cn(
        "inline-flex h-6 select-none items-center gap-1 rounded-sm border border-line-subtle bg-surface-interactive pl-2 text-caption text-fg-secondary",
        onRemove ? "pr-1" : "pr-2",
        className,
      )}
      {...props}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          aria-label={`${removeLabel}: ${typeof children === "string" ? children : ""}`.trim()}
          onClick={onRemove}
          /*
           * `luc-hit` grows the 16 px glyph box to a 24×24 target, and the
           * resting colour is `fg-muted`, not `fg-disabled`: the control is
           * enabled, and `--fg-disabled` is reserved for values that cannot be
           * acted on (docs/ACCESSIBILITY.md).
           */
          className="luc-transition luc-hit grid size-4 place-items-center rounded-xs text-fg-muted hover:bg-surface-interactive-hover hover:text-fg-primary luc-focus"
        >
          <svg viewBox="0 0 16 16" className="size-3" aria-hidden="true">
            <path
              d="M4.5 4.5l7 7m0-7l-7 7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </button>
      ) : null}
    </span>
  );
}
