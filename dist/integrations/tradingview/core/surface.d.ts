import { ReactNode } from "react";
//#region src/integrations/tradingview/core/surface.d.ts
/**
 * Loading surface for an external widget.
 *
 * It reserves the widget's own geometry — a title line, a plot band, a footer
 * line — so the page does not jump when TradingView takes over. No spinner: the
 * provider's content arrives as a block, not as a status.
 */
export declare function TradingViewWidgetSkeleton({ className, label }: {
  className?: string;
  label?: string;
}): import("react").JSX.Element;
/**
 * Failure surface.
 *
 * Deliberately does not invent market data: when the provider is unreachable
 * the honest answer is "unavailable", with a retry, and the rest of the page
 * keeps working.
 */
export declare function TradingViewWidgetError({ className, title, description, action }: {
  className?: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}): import("react").JSX.Element;
export interface TradingViewWidgetFrameProps {
  /** Panel title. Omit for a bare widget. */
  title?: ReactNode;
  description?: ReactNode;
  /** Rendered opposite the title. Keep to secondary actions. */
  actions?: ReactNode;
  /** The widget itself. */
  children: ReactNode;
  className?: string;
}
/**
 * Optional outer surface for a provider widget.
 *
 * Two rules: it never overlaps the widget box (so the provider's attribution
 * can never be covered), and it never adds its own background behind the widget
 * — a double-framed widget looks like a mistake, which is why this is opt-in and
 * the wrappers themselves render bare.
 */
export declare function TradingViewWidgetFrame({ title, description, actions, children, className }: TradingViewWidgetFrameProps): import("react").JSX.Element;
/** Retry affordance shared by both wrapper formats. */
export declare function TradingViewRetryAction({ onRetry }: {
  onRetry: () => void;
}): import("react").JSX.Element;
/**
 * Construction fallback for a symbol the provider cannot accept.
 *
 * The typed widgets reject an obviously malformed symbol (empty, or characters
 * that cannot appear in `EXCHANGE:TICKER`) *before* anything is requested from
 * TradingView. That is a bounded state, not a crash: the widget renders this
 * surface and the rest of the page keeps working. It deliberately does not echo
 * the offending value back into the UI.
 */
export declare function TradingViewSymbolError({ className, title }: {
  className?: string;
  title?: ReactNode;
}): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=surface.d.ts.map