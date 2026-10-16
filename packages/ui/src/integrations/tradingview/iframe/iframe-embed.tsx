"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "../../../utils/cn";
import { TradingViewBoundary } from "../core/boundary";
import { TRADINGVIEW_SITE_HOST, type TradingViewWidgetDefinition } from "../core/catalog";
import { createTradingViewEmbed, type TradingViewEmbedHandle } from "../core/loader";
import { TradingViewRetryAction, TradingViewWidgetError, TradingViewWidgetSkeleton } from "../core/surface";
import type { TradingViewRawConfig, TradingViewStatus, TradingViewWidgetBaseProps } from "../core/types";
import { useTradingViewInView, useTradingViewStatusChange, useTradingViewTheme } from "../core/use-tradingview";

export interface TradingViewIframeProps extends TradingViewWidgetBaseProps {
  definition: TradingViewWidgetDefinition;
  /** The provider configuration, already themed and typed by the wrapper. */
  providerConfig: TradingViewRawConfig;
  /** Provider attribution: the link and label of the official copyright block. */
  attribution: { href: string; label: string; trailing?: readonly { href: string; label: string }[] };
  /** Extra LUC-side description appended after the provider's trademark text. */
  footnote?: ReactNode;
}

interface ProviderAttribution {
  href: string;
  label: string;
  trailing?: readonly { href: string; label: string }[];
}

/**
 * Build the provider's own container and inject its embed script.
 *
 * Extracted from the effect so that a construction failure — the loader
 * refusing a URL, or any broken invariant — can be caught and turned into this
 * widget's error state. A React error boundary does **not** see a throw from a
 * `useEffect`, so an uncaught one here would unmount the whole page.
 */
function mountProviderEmbed(options: {
  scriptUrl: string;
  host: HTMLElement;
  providerConfig: TradingViewRawConfig;
  attribution: ProviderAttribution;
  onError: (error: Error) => void;
}): TradingViewEmbedHandle {
  const { scriptUrl, host, providerConfig, attribution, onError } = options;

  const container = document.createElement("div");
  container.className = "tradingview-widget-container";
  container.style.height = "100%";
  container.style.width = "100%";

  const target = document.createElement("div");
  target.className = "tradingview-widget-container__widget";
  // The provider's own snippet reserves 32px for the attribution line.
  target.style.height = "calc(100% - 32px)";
  target.style.width = "100%";

  const copyright = document.createElement("div");
  copyright.className = "tradingview-widget-copyright";
  const anchors = [attribution, ...(attribution.trailing ?? [])];
  anchors.forEach((entry, index) => {
    if (index > 0) {
      const last = index === anchors.length - 1 && anchors.length > 1;
      const comma = document.createElement("span");
      comma.className = last ? "and" : "comma";
      comma.textContent = last ? "\u00a0and\u00a0" : ", ";
      copyright.append(comma);
    }
    const link = document.createElement("a");
    link.href = entry.href || `${TRADINGVIEW_SITE_HOST}/`;
    link.rel = "noopener nofollow";
    link.target = "_blank";
    const label = document.createElement("span");
    label.className = "blue-text";
    label.textContent = entry.label;
    link.append(label);
    copyright.append(link);
  });
  const trademark = document.createElement("span");
  trademark.className = "trademark";
  trademark.textContent = attribution.trailing?.length ? "\u00a0by TradingView" : " by TradingView";
  copyright.append(trademark);

  container.append(target, copyright);
  host.replaceChildren(container);

  return createTradingViewEmbed({
    scriptUrl,
    container,
    target,
    config: providerConfig,
    onError,
  });
}

/**
 * The one iframe adapter.
 *
 * React owns a single empty host; everything inside it — the provider's
 * container, its `__widget` element, the attribution block and the embed script
 * — is built imperatively, because the provider *replaces* the node it is given
 * with its iframe. Letting React manage those nodes would leave React's tree
 * describing elements that no longer exist, and the resulting removal error
 * would only show up on unmount (and in StrictMode).
 *
 * The attribution block is part of that markup on purpose: it is the provider's
 * own copyright element, exactly as the official snippet ships it, and nothing
 * here can cover it.
 */
export function TradingViewIframe({
  definition,
  providerConfig,
  attribution,
  footnote,
  height,
  minHeight,
  className,
  title,
  theme: themeProp,
  loading = "lazy",
  timeoutMs,
  onStatusChange,
  fallback,
}: TradingViewIframeProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const { ref: inViewRef, inView } = useTradingViewInView(loading);
  const theme = useTradingViewTheme(themeProp);
  const [status, setStatus] = useState<TradingViewStatus>("idle");
  const [error, setError] = useState<Error | undefined>(undefined);
  const [attempt, setAttempt] = useState(0);
  /*
   * The provider config depends on resolved LUC tokens (surface colours) and the
   * resolved theme, which only exist after hydration. Building the embed during
   * the first client render would create a script, then rebuild it a tick later
   * when the tokens resolve — and a provider script that is torn down while it
   * is still starting can throw inside its own code. So the embed is created
   * after hydration, once its inputs are final. (Server snapshot: `false`, so
   * the server and the first client render agree.)
   */
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  /*
   * The provider config is rebuilt on every render by the typed wrappers, so the
   * effect keys on its serialized form and reads the live object from a ref.
   * Keying on the object identity would rebuild the iframe on every parent
   * render — the exact "two widgets stacked" failure mode.
   */
  const configKey = useMemo(() => JSON.stringify(providerConfig), [providerConfig]);
  const attributionKey = useMemo(() => JSON.stringify(attribution), [attribution]);
  /* Written from an effect, never during render (see the repo's `useLatest`). */
  const liveRef = useRef({ providerConfig, attribution });
  useEffect(() => {
    liveRef.current = { providerConfig, attribution };
  });

  useEffect(() => {
    if (!hydrated || !inView || !definition.scriptUrl) return;
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    setStatus("loading");
    setError(undefined);

    const embed: TradingViewEmbedHandle = mountProviderEmbed({
      scriptUrl: definition.scriptUrl ?? "",
      host,
      providerConfig: liveRef.current.providerConfig,
      attribution: liveRef.current.attribution,
      onError: (cause) => {
        if (cancelled) return;
        setError(cause);
        setStatus("error");
      },
    });

    const timer = timeoutMs
      ? window.setTimeout(() => {
          if (cancelled) return;
          setError(new Error(`[luc-ui] The TradingView embed did not load within ${timeoutMs}ms.`));
          setStatus("error");
        }, timeoutMs)
      : undefined;

    void embed.ready.then(
      () => {
        if (cancelled) return;
        if (timer) window.clearTimeout(timer);
        setStatus("ready");
      },
      () => {
        // Failure and cancellation both land in the error surface (or are
        // ignored on unmount); neither may become an unhandled rejection.
        if (cancelled) return;
        if (timer) window.clearTimeout(timer);
        setStatus("error");
      },
    );

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      embed.destroy();
    };
  }, [attempt, attributionKey, configKey, definition.scriptUrl, hydrated, inView, timeoutMs]);

  useTradingViewStatusChange(status, error, onStatusChange);

  const boxStyle: CSSProperties = {
    height: typeof height === "number" ? `${height}px` : (height ?? `${definition.defaultHeight}px`),
    minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight,
  };

  return (
    /*
     * Same last line of defence as the Web Component adapter: the script's own
     * error event already classifies a network failure, but a throw while
     * building the provider container would otherwise unmount the page.
     */
    <TradingViewBoundary resetKey={definition.scriptUrl}>
      <div
        ref={inViewRef}
        className={cn("relative w-full min-w-0", className)}
        style={boxStyle}
        role="group"
        aria-label={title ?? definition.name}
        data-luc-tv-theme={theme}
        /*
         * QA-only lifecycle hook; see the Web Component adapter. The iframe
         * adapter deliberately has no `data-luc-tv-widget` identity attribute:
         * its widget is a provider-owned `<iframe>`, not a custom element, so an
         * element-name probe does not apply to it.
         */
        data-luc-tv-status={status}
      >
        {/* The provider writes its container into this host. */}
        <div ref={hostRef} className="absolute inset-0" />
        {status === "error" ? (
          <div className="absolute inset-0">
            {fallback ?? (
              <TradingViewWidgetError
                action={
                  <TradingViewRetryAction
                    onRetry={() => {
                      setAttempt((value) => value + 1);
                    }}
                  />
                }
              />
            )}
          </div>
        ) : null}
        {status === "idle" || status === "loading" ? (
          <div className="absolute inset-0">
            <TradingViewWidgetSkeleton />
          </div>
        ) : null}
        {footnote ? <div className="sr-only">{footnote}</div> : null}
      </div>
    </TradingViewBoundary>
  );
}
