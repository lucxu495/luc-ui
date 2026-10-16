import { Component, ErrorInfo, ReactNode } from "react";
//#region src/integrations/tradingview/core/boundary.d.ts
/**
 * Last line of defence for a provider widget.
 *
 * Every failure the *loader* can classify (a rejected module, a missing global,
 * a timeout) already becomes the wrapper's own `error` state. This boundary
 * covers the remaining class: a throw during *construction* — the provider
 * element upgrading badly, an adapter invariant breaking, or a caller handing a
 * widget a symbol the provider cannot use. React would otherwise unmount the
 * whole route; a third-party widget must never be able to do that.
 *
 * It renders the same `TradingViewWidgetError` surface as the loader path, so a
 * consumer sees one bounded, accessible "provider unavailable" state whichever
 * stage failed — and the rest of the page keeps working.
 */
export interface TradingViewBoundaryProps {
  children: ReactNode;
  /** Overrides the fallback title (e.g. a construction-specific message). */
  title?: ReactNode;
  /** Overrides the fallback description. */
  description?: ReactNode;
  /** Extra class for the fallback surface. */
  className?: string;
  /** Changing this value clears a previous error (e.g. a new symbol/theme). */
  resetKey?: unknown;
  /** Test/telemetry hook. The error never reaches the DOM. */
  onError?: (error: Error) => void;
}
interface TradingViewBoundaryState {
  error: Error | null;
  attempt: number;
}
export declare class TradingViewBoundary extends Component<TradingViewBoundaryProps, TradingViewBoundaryState> {
  state: TradingViewBoundaryState;
  static getDerivedStateFromError(error: Error): Partial<TradingViewBoundaryState>;
  componentDidUpdate(previous: TradingViewBoundaryProps): void;
  componentDidCatch(error: Error, _info: ErrorInfo): void;
  private retry;
  render(): import("react").JSX.Element;
}
//#endregion
export {};
//# sourceMappingURL=boundary.d.ts.map