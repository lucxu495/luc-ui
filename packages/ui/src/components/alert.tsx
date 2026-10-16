import type { ReactNode } from "react";
import {
  RiAlertLine,
  RiCheckboxCircleLine,
  RiCloseLine,
  RiErrorWarningLine,
  RiInformationLine,
} from "@remixicon/react";
import { cn } from "../utils/cn";

/**
 * LUC Alert / Callout — an inline message block.
 *
 * Two names, one implementation, one honest difference in intent:
 *
 *   Alert    → a status message about something that just happened or needs
 *              attention. Opt into `live` when it appears *after* mount.
 *   Callout  → a persistent explanation attached to a form, a setting or a
 *              chart. Static content, no live semantics.
 *
 * Neither forces `role="alert"`: announcing a page-level paragraph as an urgent
 * interruption is worse than not announcing it. `live` maps to the ARIA role
 * the caller actually means — `polite` → `role="status"`, `assertive` →
 * `role="alert"`, `off` (the default) → no role at all.
 *
 * Visually it is a surface with a semantic edge and a semantic icon, not a
 * fully flooded panel: these blocks sit inside dense analytical pages next to
 * tables and charts, and a wall of colour destroys the hierarchy.
 */

export type AlertTone = "neutral" | "info" | "success" | "warning" | "danger";
export type AlertLive = "off" | "polite" | "assertive";

interface ToneStyle {
  edge: string;
  icon: string;
  defaultIcon: ReactNode;
}

const toneStyles: Record<AlertTone, ToneStyle> = {
  neutral: { edge: "border-l-line-strong", icon: "text-fg-muted", defaultIcon: <RiInformationLine /> },
  info: { edge: "border-l-info", icon: "text-fg-info", defaultIcon: <RiInformationLine /> },
  success: { edge: "border-l-positive", icon: "text-fg-positive", defaultIcon: <RiCheckboxCircleLine /> },
  warning: { edge: "border-l-warning", icon: "text-fg-warning", defaultIcon: <RiAlertLine /> },
  danger: { edge: "border-l-negative", icon: "text-fg-negative", defaultIcon: <RiErrorWarningLine /> },
};

export interface AlertProps extends Omit<React.ComponentPropsWithRef<"div">, "title"> {
  tone?: AlertTone;
  /**
   * `alert` (default) is the stronger surface for a status message; `quiet` is
   * the persistent Callout treatment.
   */
  emphasis?: "alert" | "quiet";
  title?: ReactNode;
  description?: ReactNode;
  /** Override the tone icon; pass `null` for a text-only block. */
  icon?: ReactNode;
  actions?: ReactNode;
  /** Renders a dismiss control. Persistence is the consumer's job. */
  onDismiss?: () => void;
  dismissLabel?: string;
  live?: AlertLive;
}

const liveRoles: Record<AlertLive, "status" | "alert" | undefined> = {
  off: undefined,
  polite: "status",
  assertive: "alert",
};

export function Alert({
  className,
  tone = "neutral",
  emphasis = "alert",
  title,
  description,
  icon,
  actions,
  onDismiss,
  dismissLabel = "Dismiss",
  live = "off",
  children,
  ...props
}: AlertProps) {
  const styles = toneStyles[tone];
  const resolvedIcon = icon === undefined ? styles.defaultIcon : icon;
  return (
    <div
      data-slot="alert"
      data-tone={tone}
      data-emphasis={emphasis}
      role={liveRoles[live]}
      className={cn(
        "relative flex items-start gap-3 rounded-lg border border-line-subtle border-l-2 p-3.5",
        emphasis === "quiet" ? "bg-surface-sunken" : "bg-surface-default",
        styles.edge,
        className,
      )}
      {...props}
    >
      {resolvedIcon ? (
        <span aria-hidden="true" className={cn("mt-0.5 shrink-0 [&_svg]:size-4", styles.icon)}>
          {resolvedIcon}
        </span>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title ? <AlertTitle>{title}</AlertTitle> : null}
        {description ?? children ? <AlertDescription>{description ?? children}</AlertDescription> : null}
        {actions ? <AlertActions>{actions}</AlertActions> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          aria-label={dismissLabel}
          onClick={onDismiss}
          className={cn(
            "-mt-1 -mr-1 grid size-6 shrink-0 place-items-center rounded-sm text-fg-muted luc-transition luc-focus",
            "hover:bg-surface-interactive-hover hover:text-fg-primary",
          )}
        >
          <RiCloseLine aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

/**
 * A persistent contextual notice. Same surface as `Alert`, quieter by default,
 * and never a live region unless the caller asks for one.
 */
export function Callout({ emphasis = "quiet", live = "off", ...props }: AlertProps) {
  return <Alert emphasis={emphasis} live={live} {...props} />;
}

export type AlertTitleProps = React.ComponentPropsWithRef<"p">;

export function AlertTitle({ className, ...props }: AlertTitleProps) {
  return <p data-slot="alert-title" className={cn("text-label font-medium text-fg-primary", className)} {...props} />;
}

export type AlertDescriptionProps = React.ComponentPropsWithRef<"div">;

export function AlertDescription({ className, ...props }: AlertDescriptionProps) {
  return (
    <div
      data-slot="alert-description"
      className={cn("flex flex-col gap-1 text-caption text-fg-secondary [&_a]:text-fg-accent", className)}
      {...props}
    />
  );
}

export type AlertActionsProps = React.ComponentPropsWithRef<"div">;

export function AlertActions({ className, ...props }: AlertActionsProps) {
  return (
    <div
      data-slot="alert-actions"
      className={cn("flex flex-wrap items-center gap-2 pt-1", className)}
      {...props}
    />
  );
}
