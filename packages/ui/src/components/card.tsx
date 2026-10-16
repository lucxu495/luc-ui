import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

export const cardVariants = cva("relative flex flex-col", {
  variants: {
    variant: {
      /** Quiet at rest: hairlined surface on the canvas. */
      default: "rounded-lg border border-line-subtle bg-surface-default shadow-rest",
      /** Higher in the stack: brighter surface, deeper shadow. */
      raised: "rounded-lg border border-line-subtle bg-surface-raised shadow-layer-2",
      /** Transparent shell for content that already has its own surface. */
      outline: "rounded-lg border border-line-default bg-transparent",
      /** No chrome at all — grouping only. */
      ghost: "rounded-lg",
    },
    interactive: {
      true: [
        "cursor-pointer luc-transition luc-press",
        "hover:border-line-default hover:bg-surface-interactive-hover hover:shadow-hover",
        "luc-focus",
      ],
      false: "",
    },
    /*
     * V1.2 interaction modes. `interactive`/`selected` above are the V1.1
     * booleans and stay for compatibility; `interaction` names the *intent*, so
     * a reviewer can see at a glance how loud a surface is meant to be.
     * `featured` is the loudest **static** mode — the spatial effects (tilt,
     * glare, border trail, pointer spotlight) live in the motion primitives,
     * which wrap a Card rather than being baked into it.
     */
    interaction: {
      static: "",
      interactive: [
        "cursor-pointer luc-transition luc-press luc-focus",
        "hover:translate-y-[calc(-1*var(--spatial-lift))] hover:border-line-default hover:bg-surface-interactive-hover hover:shadow-hover",
      ],
      selectable: [
        "cursor-pointer luc-transition luc-press luc-focus",
        "hover:translate-y-[calc(-1*var(--spatial-lift))] hover:border-line-default hover:shadow-hover",
        "data-[selected=true]:border-accent-default data-[selected=true]:bg-surface-selected",
      ],
      featured: [
        "cursor-pointer luc-transition luc-press luc-focus",
        "border-line-default shadow-[var(--layer-2-shadow),var(--glow-subtle)]",
        "hover:translate-y-[calc(-1*var(--spatial-lift))] hover:shadow-[var(--layer-3-shadow),var(--glow-accent)]",
      ],
    },
    selected: {
      true: "border-line-accent bg-surface-selected shadow-[var(--layer-2-shadow),var(--glow-subtle)]",
      false: "",
    },
    padding: {
      none: "p-0",
      sm: "p-3",
      md: "p-4",
      lg: "p-5",
    },
  },
  defaultVariants: {
    variant: "default",
    interactive: false,
    interaction: "static",
    selected: false,
    padding: "none",
  },
});

export interface CardProps
  extends React.ComponentPropsWithRef<"div">,
    VariantProps<typeof cardVariants> {
  as?: "div" | "article" | "section" | "li" | "button" | "a";
  /** Anchor target. Only meaningful when `as="a"`. */
  href?: string;
  target?: string;
  rel?: string;
}

/**
 * LUC Card — foundational surface.
 *
 * Deliberately quiet: a hairline, a small shadow, a luminance step above the
 * canvas. Interactive and selected states are opt-in. Creative effects
 * (BorderGlow, SpotlightSurface) *wrap* a Card; they are never baked in.
 */
export function Card({
  className,
  variant,
  interactive,
  interaction,
  selected,
  padding,
  as = "div",
  ...props
}: CardProps) {
  const Tag = as as React.ElementType;
  return (
    <Tag
      data-slot="card"
      data-interaction={interaction && interaction !== "static" ? interaction : undefined}
      data-selected={selected || undefined}
      className={cn(cardVariants({ variant, interactive, interaction, selected, padding }), className)}
      {...props}
    />
  );
}

export interface CardHeaderProps extends React.ComponentPropsWithRef<"div"> {
  /** Right-aligned slot for a menu, badge or icon button. */
  actions?: React.ReactNode;
  /** Leading slot for an icon or avatar. */
  icon?: React.ReactNode;
}

export function CardHeader({ className, actions, icon, children, ...props }: CardHeaderProps) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex items-start gap-3 border-b border-line-subtle px-4 py-3.5", className)}
      {...props}
    >
      {icon ? (
        <span className="grid size-8 shrink-0 place-items-center rounded-md border border-line-subtle bg-surface-interactive text-fg-secondary">
          {icon}
        </span>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">{children}</div>
      {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.ComponentPropsWithRef<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-title text-fg-primary", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, ...props }: React.ComponentPropsWithRef<"p">) {
  return (
    <p data-slot="card-description" className={cn("text-caption text-fg-muted", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: React.ComponentPropsWithRef<"div">) {
  return <div data-slot="card-content" className={cn("flex min-w-0 flex-col gap-3 p-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("mt-auto flex flex-wrap items-center gap-2 border-t border-line-subtle px-4 py-3", className)}
      {...props}
    />
  );
}
