/**
 * Console / page-error / failed-request capture.
 *
 * Provider-origin noise is filtered exactly as before: a blocked TradingView
 * script is the provider's availability, not a LUC defect, and a provider
 * exception is raised inside the provider's own module. Everything the page
 * itself does is still reported.
 */

const PROVIDER_HOSTS = ["tradingview.com", "tradingview-widget.com"];

export function isProviderOrigin(value) {
  if (!value) return false;
  return PROVIDER_HOSTS.some((host) => value.includes(host));
}

/**
 * Attach diagnostics for one page. Returns a `detach()` so a pooled worker can
 * reuse a page across routes without leaking listeners.
 */
export function attachDiagnostics(page, slug, recorder) {
  /*
   * `slug` may be a getter.
   *
   * A pooled worker reuses one page across a route's variants, so the caller
   * passes `() => current` to keep the label describing whatever the page is
   * showing *now*. Interpolating that function straight into a template string
   * produced the recorded slug `() => current` — which made a real page error
   * impossible to attribute to a route. Call it.
   */
  const label = () => (typeof slug === "function" ? String(slug()) : String(slug));
  const onConsole = (message) => {
    if (message.type() !== "error") return;
    const origin = message.location()?.url ?? "";
    if (isProviderOrigin(origin) || isProviderOrigin(message.text())) return;
    recorder.counters.consoleErrors += 1;
    recorder.record("console", `${label()}: ${message.text()}`);
  };
  const onPageError = (error) => {
    if (isProviderOrigin(error.stack ?? "") || isProviderOrigin(error.message)) return;
    recorder.counters.pageErrors += 1;
    recorder.record("pageerror", `${label()}: ${error.message}`);
  };
  const onRequestFailed = (request) => {
    // Next dev prefetches can be aborted on navigation; ignore those.
    const failure = request.failure()?.errorText ?? "";
    if (failure.includes("ERR_ABORTED")) return;
    if (isProviderOrigin(request.url())) return;
    recorder.counters.failedRequests += 1;
    recorder.record("requestfailed", `${label()}: ${request.url()} ${failure}`);
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("requestfailed", onRequestFailed);

  return () => {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("requestfailed", onRequestFailed);
  };
}
