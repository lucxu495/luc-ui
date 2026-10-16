import { ReactNode } from "react";
//#region src/components/empty-state.d.ts
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
export declare function EmptyState({ className, icon, title, description, action, secondaryAction, size, titleAs: TitleTag, children, ...props }: EmptyStateProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=empty-state.d.ts.map