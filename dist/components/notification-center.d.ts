import { ReactNode } from "react";
//#region src/components/notification-center.d.ts
/**
 * LUC NotificationCenter — the inbox a bell icon opens.
 *
 * A toast is for something the user just caused; this is for everything that
 * accumulated while they were elsewhere. That difference is why it is a list
 * with state (`read`, `tone`, `timestamp`) rather than a queue that expires:
 * nothing here disappears on a timer, and "mark all read" is an explicit act.
 *
 * The list is fully controlled — the application owns persistence, the badge
 * count and what "read" means for its product — while the open/closed state of
 * the panel stays local, because a popover is not a route.
 */
export interface NotificationTone {
  tone?: "neutral" | "info" | "positive" | "warning" | "negative";
}
export interface NotificationItem extends NotificationTone {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  /** Pre-formatted by the caller — a relative time is a product decision. */
  timestamp?: ReactNode;
  read?: boolean;
  icon?: ReactNode;
  /** Renders the row as a link. */
  href?: string;
}
export interface NotificationCenterProps {
  items: readonly NotificationItem[];
  onRead?: (id: string) => void;
  onReadAll?: () => void;
  onDismiss?: (id: string) => void;
  onOpenItem?: (id: string) => void;
  label?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  footer?: ReactNode;
  className?: string;
}
export declare function NotificationCenter({ items, onRead, onReadAll, onDismiss, onOpenItem, label, emptyTitle, emptyDescription, footer, className }: NotificationCenterProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=notification-center.d.ts.map