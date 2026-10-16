"use client";

/**
 * Internal button implementation. Client module — it owns the click/loading
 * behaviour. Public consumers import the family entry (`./button`), which also
 * carries the server-safe recipe.
 */

import type { VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "../utils/cn";
import { usePointerGlow } from "../hooks/use-pointer-glow";
import { RippleLayer, usePressRipple } from "../motion/press-ripple";
import { mergeRefs } from "../utils/refs";
import { Spinner } from "./spinner";
import { buttonVariants } from "./button-variants";

export interface ButtonProps
  extends React.ComponentPropsWithRef<"button">,
    Omit<VariantProps<typeof buttonVariants>, "block"> {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /**
   * Busy state. The button keeps its width, stays in the tab order and reports
   * `aria-busy` — it is *not* the same as `disabled`.
   */
  loading?: boolean;
  loadingLabel?: string;
  block?: boolean;
  /**
   * Press ink and pointer light. On by default — a filled control that answers
   * the finger is the family's signature — and switchable off for print, dense
   * toolbars or a surface that already moves.
   */
  tactile?: boolean;
}

export function Button({
  className,
  variant,
  size,
  block,
  leadingIcon,
  trailingIcon,
  loading = false,
  loadingLabel = "Working",
  tactile = true,
  disabled,
  children,
  onClick,
  type = "button",
  onPointerDown,
  onPointerMove,
  onPointerEnter,
  onPointerLeave,
  ref,
  ...props
}: ButtonProps) {
  const ripple = usePressRipple({ rings: 2, disabled: !tactile || loading || disabled });
  const glow = usePointerGlow({ disabled: !tactile });
  const button = (
    <button
      ref={mergeRefs(glow.ref, ref)}
      data-slot="button"
      data-loading={loading || undefined}
      type={type}
      aria-busy={loading || undefined}
      disabled={disabled}
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
        buttonVariants({ variant, size, block }),
        loading && "pointer-events-none",
        loading && variant === "primary" && "shadow-rest",
        className,
      )}
      {...props}
    >
      {tactile ? <RippleLayer ripples={ripple.ripples} /> : null}
      {loading ? (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner size={size === "lg" ? 18 : 16} label={null} className="text-current opacity-90" />
          <span className="sr-only">{loadingLabel}</span>
        </span>
      ) : null}
      <span
        className={cn(
          "inline-flex items-center gap-[inherit] transition-opacity duration-[var(--motion-fast)]",
          loading ? "opacity-0" : "opacity-100",
        )}
      >
        {leadingIcon ? (
          <span data-slot="icon" className="inline-flex -ml-0.5 items-center">
            {leadingIcon}
          </span>
        ) : null}
        {children}
        {trailingIcon ? (
          <span data-slot="icon" className="inline-flex -mr-0.5 items-center">
            {trailingIcon}
          </span>
        ) : null}
      </span>
    </button>
  );

  return button;
}
