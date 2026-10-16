"use client";

import { cn } from "../utils/cn";
import { useSlidingIndicator } from "../hooks/use-sliding-indicator";
import { useReducedMotion } from "../hooks/use-reduced-motion";

/**
 * LUC SharedHighlight — one moving indicator shared by a set of view options.
 *
 * Tabs, view toggles, range pickers and segmented filters are the same
 * interaction: one selection out of a small ordered set. Repainting the
 * selected chip and de-selecting the others reads as a flicker; gliding a
 * single highlight between positions reads as one object moving, which is what
 * the user actually did.
 *
 * It is deliberately **not** a state container: the caller owns `value`, and an
 * item may be a link (`href`), so the same component serves client state
 * (a view toggle) and navigation (page tabs) without a second implementation.
 *
 * The measurement/glide mechanics come from `useSlidingIndicator`, so the
 * segmented control and this primitive cannot drift.
 */
export interface SharedHighlightItem {
  value: string;
  label: React.ReactNode;
  /** Render as a link (navigation) instead of a button (state). */
  href?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  /** Accessible hint for a link, e.g. `aria-current` semantics. */
  current?: boolean;
}

export interface SharedHighlightProps extends Omit<React.ComponentPropsWithRef<"div">, "onChange"> {
  items: readonly SharedHighlightItem[];
  value: string;
  onValueChange?: (value: string) => void;
  size?: "sm" | "md";
  /** `track` is a recessed pill track; `underline` is a bare row with a rule. */
  variant?: "track" | "underline";
  fill?: boolean;
  ariaLabel?: string;
  /** Extra classes for each item (e.g. a link's `scroll={false}` behaviour). */
  itemClassName?: string;
  onNavigate?: (value: string) => void;
}

export function SharedHighlight({
  className,
  items,
  value,
  onValueChange,
  size = "md",
  variant = "track",
  fill = false,
  ariaLabel,
  itemClassName,
  onNavigate,
  ...props
}: SharedHighlightProps) {
  const reduced = useReducedMotion();
  const { containerRef, registerItem, rect } = useSlidingIndicator<HTMLDivElement>(value);
  const underline = variant === "underline";

  const itemClasses = cn(
    "luc-focus relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap text-caption font-medium luc-transition",
    size === "sm" ? "h-6 rounded-[5px] px-2 text-micro" : "h-7 rounded-[6px] px-2.5",
    "text-fg-muted hover:text-fg-secondary data-[active=true]:text-fg-primary",
    itemClassName,
  );

  return (
    <div
      ref={containerRef}
      data-slot="shared-highlight"
      data-variant={variant}
      role={items.length > 0 && items.every((item) => item.href) ? "navigation" : "group"}
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex min-w-0 items-center",
        underline ? "gap-3 border-b border-line-subtle" : "gap-0.5 rounded-md border border-line-subtle bg-surface-sunken p-0.5 shadow-xs",
        fill && !underline && "flex w-full [&>*]:flex-1",
        className,
      )}
      {...props}
    >
      {rect && !underline ? (
        <span
          aria-hidden="true"
          data-slot="shared-highlight-thumb"
          className={cn(
            "pointer-events-none absolute top-0.5 bottom-0.5 left-0 rounded-[6px] border border-line-default bg-surface-raised shadow-sm",
            !reduced &&
              "[transition:transform_var(--motion-normal)_var(--ease-emphasized),width_var(--motion-normal)_var(--ease-emphasized),opacity_var(--motion-fast)_var(--ease-standard)]",
          )}
          style={{ transform: `translateX(${rect.left}px)`, width: rect.width }}
        />
      ) : null}
      {rect && underline ? (
        <span
          aria-hidden="true"
          data-slot="shared-highlight-underline"
          className={cn(
            "pointer-events-none absolute bottom-[-1px] left-0 h-0.5 rounded-full bg-accent-default",
            !reduced &&
              "[transition:transform_var(--motion-normal)_var(--ease-emphasized),width_var(--motion-normal)_var(--ease-emphasized)]",
          )}
          style={{ transform: `translateX(${rect.left}px)`, width: rect.width }}
        />
      ) : null}
      {items.map((item) => {
        const active = item.value === value;
        const content = (
          <>
            {item.icon}
            {item.label}
          </>
        );
        return item.href ? (
          <a
            key={item.value}
            ref={registerItem(item.value)}
            href={item.href}
            data-active={active}
            aria-current={item.current ?? active ? "page" : undefined}
            onClick={() => onNavigate?.(item.value)}
            className={itemClasses}
          >
            {content}
          </a>
        ) : (
          <button
            key={item.value}
            ref={registerItem(item.value)}
            type="button"
            disabled={item.disabled}
            data-active={active}
            aria-pressed={active}
            onClick={() => {
              if (!active) onValueChange?.(item.value);
            }}
            className={itemClasses}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
