import type { ReactNode } from "react";
import { cn } from "../utils/cn";

/**
 * LUC EmptyState — the reusable "nothing here yet" surface.
 *
 * Chart and table families have their own specialised empty states because they
 * need domain wording and domain actions. This is the general one, so a page, a
 * card, a panel or a workspace pane never invents icon + heading + paragraph +
 * button a fourth time.
 *
 * It is static content: there is no live region and no implicit status role. A
 * consumer whose emptiness is an *event* passes `role="status"` explicitly.
 */

export interface EmptyStateProps extends Omit<React.ComponentPropsWithRef<"div">, "title"> {
  /** Optional mark. Sized and coloured by the component; pass a bare icon. */
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Primary action — usually a Button. */
  action?: ReactNode;
  /** Secondary action, rendered beside the primary one. */
  secondaryAction?: ReactNode;
  /** `sm` for a table region or a pane; `md` for a page or a card. */
  size?: "sm" | "md";
  /**
   * Element used for the title. Defaults to a paragraph so the component can be
   * dropped anywhere without inventing a heading level.
   */
  titleAs?: "p" | "h2" | "h3" | "h4";
}

export function EmptyState({
  className,
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  titleAs: TitleTag = "p",
  children,
  ...props
}: EmptyStateProps) {
  const compact = size === "sm";
  return (
    <div
      data-slot="empty-state"
      data-size={size}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-1.5 px-4 py-6" : "gap-2 px-6 py-10",
        className,
      )}
      {...props}
    >
      {icon ? (
        <span
          aria-hidden="true"
          className={cn(
            "grid shrink-0 place-items-center rounded-lg border border-line-subtle bg-surface-interactive text-fg-muted",
            compact ? "mb-0.5 size-8 [&_svg]:size-4" : "mb-1 size-10 [&_svg]:size-5",
          )}
        >
          {icon}
        </span>
      ) : null}
      <TitleTag className={cn("text-fg-primary", compact ? "text-label" : "text-title")}>{title}</TitleTag>
      {description ? (
        <p className={cn("max-w-[46ch] text-balance", compact ? "text-caption" : "text-body", "text-fg-muted")}>
          {description}
        </p>
      ) : null}
      {children}
      {action || secondaryAction ? (
        <div className={cn("flex flex-wrap items-center justify-center gap-2", compact ? "pt-1" : "pt-2")}>
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
