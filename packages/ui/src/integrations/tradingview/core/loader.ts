/**
 * Loader for TradingView's official widget code.
 *
 * Two mechanisms, because the provider ships two formats:
 *
 *  - **Web Components** are ES modules. We import the official module URL once
 *    per URL and wait for `customElements.whenDefined`, so ten widgets on a page
 *    share one download and one registration.
 *  - **iframes** are built by a classic embed script that reads its own JSON
 *    configuration out of `document.currentScript`. That script has to be
 *    injected imperatively (React will not execute a script it renders) and
 *    removed on unmount so a remount cannot stack two widgets.
 *
 * Security: only the two official hosts are accepted. Component props never
 * reach a script URL — the URL comes from the registry.
 */

import { TRADINGVIEW_MODULE_HOST, TRADINGVIEW_SCRIPT_HOST, TRADINGVIEW_WIDGET_HOST } from "./catalog";
import type { TradingViewRawConfig } from "./types";

export type TradingViewLoadState = "pending" | "ready" | "failed";

export interface TradingViewLoadRecord {
  state: TradingViewLoadState;
  error?: Error;
}

const ALLOWED_HOSTS = new Set(
  [TRADINGVIEW_MODULE_HOST, TRADINGVIEW_SCRIPT_HOST, TRADINGVIEW_WIDGET_HOST].map(
    (host) => new URL(host).host,
  ),
);

/**
 * Reject anything that is not an official TradingView widget URL.
 *
 * This is the guard that keeps a `config` escape hatch or a future prop from
 * turning into `<script src={userInput}>`.
 */
export function assertTradingViewUrl(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`[luc-ui] Not a TradingView widget URL: ${url}`);
  }
  if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.has(parsed.host)) {
    throw new Error(`[luc-ui] Refusing to load a non-TradingView script: ${url}`);
  }
  return parsed;
}

/* -------------------------------------------------------------------------- */
/* Store                                                                      */
/* -------------------------------------------------------------------------- */

const records = new Map<string, TradingViewLoadRecord>();
const listeners = new Map<string, Set<() => void>>();
const inFlight = new Map<string, Promise<void>>();

function emit(url: string) {
  for (const listener of listeners.get(url) ?? []) listener();
}

function setRecord(url: string, record: TradingViewLoadRecord) {
  records.set(url, record);
  emit(url);
}

/** Current state for a URL. `"pending"` when nothing has been requested yet. */
export function getTradingViewLoadState(url: string): TradingViewLoadState {
  return records.get(url)?.state ?? "pending";
}

export function getTradingViewLoadError(url: string): Error | undefined {
  return records.get(url)?.error;
}

/** Subscribe to transitions for one URL. Returns an unsubscribe function. */
export function subscribeTradingViewLoad(url: string, listener: () => void): () => void {
  let set = listeners.get(url);
  if (!set) {
    set = new Set();
    listeners.set(url, set);
  }
  set.add(listener);
  return () => {
    set?.delete(listener);
    if (set && set.size === 0) listeners.delete(url);
  };
}

/**
 * Load an official Web Component module and wait for its element to register.
 *
 * Deduplicated per URL and concurrency-safe: the same URL always returns the
 * same promise. `timeoutMs` reports a slow/failed registration as `"failed"`
 * *without* cancelling the wait — if the element registers later the state
 * still becomes `"ready"`, so a slow network recovers instead of sticking.
 */
export function loadTradingViewElement(
  url: string,
  options: {
    tag: string;
    timeoutMs?: number;
    signal?: AbortSignal;
    /**
     * Injection point for the module import. Production always uses the dynamic
     * `import()`; the tests use it to exercise registration and timeout without
     * a network round trip.
     */
    loadModule?: (url: string) => Promise<unknown>;
  },
): Promise<void> {
  const existing = inFlight.get(url);
  if (existing) return existing;

  const { tag, timeoutMs = 12_000, signal, loadModule } = options;
  const promise = (async () => {
    /*
     * A rejected URL is a *configuration* error, not a render crash. Recording
     * it as this widget's own failure state keeps the wrapper's contract — any
     * provider problem becomes a bounded, retryable error surface — even when
     * the URL never reaches the network. (Throwing here would escape the
     * effect that called us and unmount the surrounding page.)
     */
    try {
      assertTradingViewUrl(url);
    } catch (cause) {
      const error = cause instanceof Error ? cause : new Error(String(cause));
      setRecord(url, { state: "failed", error });
      return;
    }

    setRecord(url, { state: "pending" });
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const registration = (async () => {
      if (typeof document === "undefined") return;
      const registry = window.customElements;
      if (!registry) throw new Error("[luc-ui] Custom elements are unavailable in this browser.");
      if (registry.get(tag)) return;
      try {
        if (loadModule) await loadModule(url);
        else await import(/* webpackIgnore: true */ /* @vite-ignore */ url);
      } catch (cause) {
        throw new Error(`[luc-ui] The TradingView module failed to load: ${url}`, { cause });
      }
      // The module may register on a microtask after its own evaluation.
      const defined = registry.whenDefined(tag);
      await defined;
    })();

    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`[luc-ui] The TradingView widget "${tag}" did not register within ${timeoutMs}ms.`));
      }, timeoutMs);
    });

    try {
      await Promise.race([registration, timeout]);
      settled = true;
      setRecord(url, { state: "ready" });
      inFlight.delete(url);
    } catch (cause) {
      if (timer) clearTimeout(timer);
      const error = cause instanceof Error ? cause : new Error(String(cause));
      if (!settled) {
        setRecord(url, { state: "failed", error });
        // A late registration still wins: recover rather than stay broken.
        registration
          .then(() => {
            setRecord(url, { state: "ready" });
            inFlight.delete(url);
          })
          .catch(() => {
            inFlight.delete(url);
          });
      }
    } finally {
      if (timer) clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
  })();

  function onAbort() {
    inFlight.delete(url);
  }
  signal?.addEventListener("abort", onAbort, { once: true });

  inFlight.set(url, promise);
  return promise;
}

/**
 * Forget a URL so the next attempt runs again. Used by the error surface's
 * retry: the browser may still serve a cached rejection, and a timeout recovers
 * immediately — both outcomes are honest and neither is hidden.
 */
export function resetTradingViewLoad(url: string) {
  inFlight.delete(url);
  records.delete(url);
  emit(url);
}

/* -------------------------------------------------------------------------- */
/* iframe embeds                                                              */
/* -------------------------------------------------------------------------- */

export interface TradingViewEmbedHandle {
  /** The `<script>` the provider executes. */
  script: HTMLScriptElement;
  /** The element the provider replaces with its iframe. */
  target: HTMLElement;
  ready: Promise<void>;
  destroy: () => void;
}

/**
 * Where a torn-down embed waits before it is really removed.
 *
 * A provider embed is **not** teardown-safe: its script addresses its own
 * container through the running script's `parentNode`, and its callbacks keep
 * addressing the iframe it created — `document.currentScript.parentNode` and
 * `iframe.contentWindow` are both null the moment the nodes leave the document.
 * A client-side navigation therefore produced provider-owned uncaught errors
 * ("Cannot read properties of null", "contentWindow is not available") *after*
 * the route had already changed.
 *
 * So teardown parks the provider's container in a hidden, bounded lot for a
 * grace period instead of detaching it immediately: the provider finishes its
 * own work against nodes that still exist, and the lot is emptied a few seconds
 * later. The queue is capped so an SPA session cannot accumulate dead widgets.
 */
const TEARDOWN_LOT_ID = "luc-tv-teardown-lot";
const TEARDOWN_LOT_LIMIT = 6;
const TEARDOWN_GRACE_MS = 5000;
/*
 * A *settled* embed (its script has loaded and built its widget) can be released
 * almost immediately. The long grace exists for the other case: a script that is
 * still in flight, whose own callbacks would then address nodes that no longer
 * exist. Holding a finished iframe for five seconds bought nothing, and it is
 * what a theme flip turned into "3 → 6 iframes on the page" — the old widget was
 * parked next to the new one rather than released.
 */
const SETTLED_GRACE_MS = 600;

function parkProviderContainer(container: HTMLElement, graceMs = TEARDOWN_GRACE_MS): void {
  if (typeof document === "undefined" || !document.body) {
    container.replaceChildren();
    return;
  }
  let lot = document.getElementById(TEARDOWN_LOT_ID);
  if (!lot) {
    lot = document.createElement("div");
    lot.id = TEARDOWN_LOT_ID;
    lot.setAttribute("aria-hidden", "true");
    lot.style.cssText =
      "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none";
    document.body.append(lot);
  }
  lot.append(container);
  while (lot.childElementCount > TEARDOWN_LOT_LIMIT) lot.firstElementChild?.remove();
  // The provider's own callbacks are done well inside the grace period; the
  // nodes are then released for good.
  window.setTimeout(() => {
    container.replaceChildren();
    container.remove();
    if (lot && lot.childElementCount === 0) lot.remove();
  }, graceMs);
}

/**
 * Inject an official iframe embed script into `target`'s container.
 *
 * Mirrors the provider's own snippet exactly: the script carries the JSON
 * configuration as its text content, and the provider replaces it with an
 * iframe. The script is re-created whenever the configuration changes, and on
 * destroy its container is parked (see above) and then removed — which is what
 * keeps React StrictMode's double mount from stacking two widgets.
 */
export function createTradingViewEmbed(options: {
  scriptUrl: string;
  container: HTMLElement;
  target: HTMLElement;
  config: TradingViewRawConfig;
  onError?: (error: Error) => void;
}): TradingViewEmbedHandle {
  const { container, target, config, onError } = options;

  let settled = false;
  let resolveReady: () => void = () => {};
  let rejectReady: (error: Error) => void = () => {};
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  // The caller may not attach a handler immediately.
  ready.catch(() => {});

  /*
   * A refused URL is reported through the handle's own `ready` rejection rather
   * than thrown: the caller is a `useEffect`, and a synchronous throw there is
   * not visible to a React error boundary — it would unmount the page.
   */
  let parsed: URL;
  try {
    parsed = assertTradingViewUrl(options.scriptUrl);
  } catch (cause) {
    const error = cause instanceof Error ? cause : new Error(String(cause));
    settled = true;
    rejectReady(error);
    onError?.(error);
    return {
      script: document.createElement("script"),
      target,
      ready,
      destroy: () => container.replaceChildren(),
    };
  }

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = parsed.href;
  script.async = true;
  script.setAttribute("async", "");
  script.textContent = JSON.stringify(config);
  script.addEventListener("load", () => {
    settled = true;
    resolveReady();
  });
  script.addEventListener("error", () => {
    settled = true;
    const error = new Error(`[luc-ui] The TradingView embed script failed to load: ${parsed.href}`);
    rejectReady(error);
    onError?.(error);
  });

  // The provider replaces the script node with its iframe, so the placeholder
  // must exist first and the script must be appended last.
  container.appendChild(script);

  return {
    script,
    target,
    ready,
    destroy: () => {
      if (!settled) rejectReady(new Error("[luc-ui] The TradingView embed was cancelled before it loaded."));
      /*
       * Park, then release.
       *
       * Detaching the provider's nodes the moment React unmounts them is what
       * made the provider throw during a client-side navigation: its script and
       * its iframe callbacks address nodes that no longer exist. Parking the
       * container keeps the provider's own task and callbacks valid while the
       * route changes, and the bounded grace period releases the nodes right
       * after. Only nodes this handle created are touched, so a re-mount in the
       * same tick is unaffected.
       *
       * The grace is short once the embed has settled: at that point the
       * provider has run its script and owns an iframe of its own, and nothing
       * in its contract reaches back into this container. An in-flight script
       * keeps the long grace.
       */
      parkProviderContainer(container, settled ? SETTLED_GRACE_MS : TEARDOWN_GRACE_MS);
    },
  };
}
