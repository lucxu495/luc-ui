import { ReactNode } from "react";
//#region src/components/alert.d.ts
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
export declare function Alert({ className, tone, emphasis, title, description, icon, actions, onDismiss, dismissLabel, live, children, ...props }: AlertProps): import("react").JSX.Element;
/**
 * A persistent contextual notice. Same surface as `Alert`, quieter by default,
 * and never a live region unless the caller asks for one.
 */
export declare function Callout({ emphasis, live, ...props }: AlertProps): import("react").JSX.Element;
export type AlertTitleProps = React.ComponentPropsWithRef<"p">;
export declare function AlertTitle({ className, ...props }: AlertTitleProps): import("react").JSX.Element;
export type AlertDescriptionProps = React.ComponentPropsWithRef<"div">;
export declare function AlertDescription({ className, ...props }: AlertDescriptionProps): import("react").JSX.Element;
export type AlertActionsProps = React.ComponentPropsWithRef<"div">;
export declare function AlertActions({ className, ...props }: AlertActionsProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=alert.d.ts.map