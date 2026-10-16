"use client";

import { Component, Fragment, type ErrorInfo, type ReactNode } from "react";
import { TradingViewRetryAction, TradingViewWidgetError } from "./surface";

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

export class TradingViewBoundary extends Component<TradingViewBoundaryProps, TradingViewBoundaryState> {
  override state: TradingViewBoundaryState = { error: null, attempt: 0 };

  static getDerivedStateFromError(error: Error): Partial<TradingViewBoundaryState> {
    return { error };
  }

  override componentDidUpdate(previous: TradingViewBoundaryProps) {
    // A prop change (new symbol, new theme) is a new attempt, not a permanent
    // failure: re-render instead of showing a stale error surface.
    if (previous.resetKey !== this.props.resetKey && this.state.error) {
      this.setState((state) => ({ error: null, attempt: state.attempt + 1 }));
    }
  }

  override componentDidCatch(error: Error, _info: ErrorInfo) {
    this.props.onError?.(error);
  }

  private retry = () => {
    this.setState((state) => ({ error: null, attempt: state.attempt + 1 }));
  };

  override render() {
    if (this.state.error) {
      return (
        <TradingViewWidgetError
          className={this.props.className}
          title={this.props.title ?? "Market widget unavailable"}
          description={
            this.props.description ??
            "This market widget could not be initialized. The rest of this page is unaffected."
          }
          action={<TradingViewRetryAction onRetry={this.retry} />}
        />
      );
    }
    // Remounting on retry is what makes "try again" meaningful when the failure
    // happened during construction rather than during the network load.
    return <Fragment key={this.state.attempt}>{this.props.children}</Fragment>;
  }
}
