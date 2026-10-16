"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "../utils/cn";
import { mergeRefs } from "../utils/refs";
import { usePointerGlow } from "../hooks/use-pointer-glow";
import { RippleLayer, usePressRipple } from "../motion/press-ripple";
import { Spinner } from "./spinner";

const iconButtonVariants = cva(
  [
    "relative isolate inline-grid place-items-center select-none",
    "luc-transition luc-focus luc-press luc-cursor-light",
    "disabled:pointer-events-none disabled:opacity-45",
  ],
  {
    variants: {
      variant: {
        solid: "bg-surface-interactive text-fg-secondary border border-line-default hover:border-line-strong hover:text-fg-primary hover:bg-surface-interactive-hover shadow-rest hover:shadow-hover",
        ghost: "text-fg-muted hover:bg-surface-interactive-hover hover:text-fg-primary",
        accent:
          "bg-accent-soft text-fg-accent hover:bg-accent-soft-hover hover:text-accent-strong border border-transparent hover:border-line-accent",
        danger: "text-fg-muted hover:bg-negative-soft hover:text-fg-negative",
      },
      size: {
        sm: "size-control-sm rounded-sm [&_svg]:size-4",
        md: "size-control-md rounded-md [&_svg]:size-[18px]",
        lg: "size-control-lg rounded-md [&_svg]:size-5",
      },
    },
    defaultVariants: { variant: "ghost", size: "md" },
  },
);

export interface IconButtonProps
  extends Omit<React.ComponentPropsWithRef<"button">, "aria-label">,
    VariantProps<typeof iconButtonVariants> {
  /**
   * Required: an icon-only control must have an accessible name.
   */
  label: string;
  icon: ReactNode;
  loading?: boolean;
  /** Show the label as a real tooltip on hover. Use `@luc/ui` Tooltip for rich content. */
  showTooltip?: boolean;
  /** Press ink and pointer light. Off for a static or print surface. */
  tactile?: boolean;
}

export function IconButton({
  className,
  variant,
  size,
  label,
  icon,
  loading = false,
  showTooltip = true,
  tactile = true,
  type = "button",
  title,
  onClick,
  onPointerDown,
  onPointerEnter,
  onPointerMove,
  onPointerLeave,
  ref,
  ...props
}: IconButtonProps) {
  const ripple = usePressRipple({ rings: 1, disabled: !tactile || loading });
  const glow = usePointerGlow({ disabled: !tactile });
  return (
    <button
      ref={mergeRefs(glow.ref, ref)}
      data-slot="icon-button"
      type={type}
      aria-label={label}
      aria-busy={loading || undefined}
      title={showTooltip ? (title ?? label) : title}
      onPointerEnter={(event) => {
        glow.handlers.onPointerEnter(event);
        onPointerEnter?.(event);
      }}
      onPointerMove={(event) => {
        glow.handlers.onPointerMove(event);
        onPointerMove?.(event);
      }}
      onPointerLeave={(event) => {
        glow.handlers.onPointerLeave();
        onPointerLeave?.(event);
      }}
      onPointerDown={(event) => {
        ripple.onPointerDown(event);
        onPointerDown?.(event);
      }}
      onClick={(event) => {
        if (loading) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      className={cn(
        iconButtonVariants({ variant, size }),
        loading && "pointer-events-none",
        className,
      )}
      {...props}
    >
      {tactile ? <RippleLayer ripples={ripple.ripples} /> : null}
      <span className={cn("[&_svg]:size-full", loading && "opacity-0")}>{icon}</span>
      {loading ? (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner size={16} label={null} className="text-current" />
        </span>
      ) : null}
    </button>
  );
}


export { iconButtonVariants };
