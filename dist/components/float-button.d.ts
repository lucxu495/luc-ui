import { ReactNode } from "react";
//#region src/components/float-button.d.ts
/**
 * LUC FloatButton — an action that stays reachable.
 *
 * The one thing this component owns is *placement*: a control pinned to a corner
 * of the viewport (or of a positioned ancestor) with the offsets, the layer, the
 * safe-area inset and the stacking that make that safe. The control itself is the
 * existing `IconButton`, so a floating action is the same button as every other
 * icon-only control — same focus ring, same press ink, same disabled and loading
 * contracts — and this does not become a second, subtly different button.
 *
 * Two families of bug are what the details below exist to prevent:
 *
 *  1. **A floating control that covers the thing it acts on.** The offsets clear
 *     the home indicator on a phone (`env(safe-area-inset-*)`) and the layer sits
 *     at `--z-sticky`, deliberately *below* overlays: a sheet or a dialog covers a
 *     floating action rather than fighting it for the top of the stack.
 *  2. **A disclosure that is not a disclosure.** `FloatButtonGroup` opens on a
 *     real button with `aria-expanded` and `aria-controls`, moves focus into the
 *     actions it revealed, closes on Escape with focus returned to the trigger,
 *     and closes on a click outside. It is not a menu and does not claim to be
 *     one: the actions are buttons, each with its own name.
 *
 * The badge is decorative — `aria-hidden` — because a count announced *after* a
 * label ("Notifications, 3") is a different sentence in every language. A caller
 * who wants it announced puts the number in `label`.
 */
export type FloatButtonSide = "bottom-right" | "bottom-left" | "top-right" | "top-left";
export interface FloatButtonProps extends Omit<React.ComponentPropsWithRef<"button">, "children" | "aria-label"> {
  icon: ReactNode;
  /** Required: an icon-only control must have an accessible name. */
  label: string;
  /** Which corner of the viewport (or of the positioned ancestor). */
  side?: FloatButtonSide;
  /** `solid` is the neutral action, `accent` the primary one. */
  variant?: "solid" | "accent" | "danger";
  size?: "md" | "lg";
  /**
   * A count on the control. Decorative: put the meaning in `label` if a screen
   * reader has to hear it.
   */
  badge?: number;
  /**
   * Pinned to the viewport (default). `false` positions it inside the nearest
   * `relative` ancestor instead — a canvas, a preview pane, a card.
   */
  fixed?: boolean;
  /** The stack this control belongs to, when one is placed beside another. */
  className?: string;
}
export declare function FloatButton({ icon, label, side, variant, size, badge, fixed, className, ...props }: FloatButtonProps): import("react").JSX.Element;
export interface FloatButtonAction {
  /** Stable key for the action. */
  id: string;
  icon: ReactNode;
  /** The action's accessible name, and its tooltip. */
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}
export interface FloatButtonGroupProps {
  /** The trigger's icon while closed. */
  icon?: ReactNode;
  /**
   * The trigger's accessible name — what this stack of actions is for, e.g.
   * "Quick actions". Not a menu title: the trigger is the only thing named.
   */
  label: string;
  side?: FloatButtonSide;
  actions: readonly FloatButtonAction[];
  /** Open on first paint. Rare; useful in a screenshot or a test. */
  defaultOpen?: boolean;
  fixed?: boolean;
  className?: string;
}
export declare function FloatButtonGroup({ icon, label, side, actions, defaultOpen, fixed, className }: FloatButtonGroupProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=float-button.d.ts.map