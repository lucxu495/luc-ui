/**
 * TradingView boundary: deterministic stubbing, and one probe.
 *
 * ## Why a stub at all
 *
 * The full QA sweep has to prove *LUC's* responsibilities — reserved geometry,
 * loading → ready → error lifecycle, lazy-load trigger, attribution, theme
 * bridge, no duplicate mounting. None of that needs TradingView's servers, and
 * every one of those checks currently takes as long as the provider's network
 * happens to take (measured: 10 provider routes were 58% of a 25-minute run).
 *
 * So the deterministic tier intercepts the two official hosts and answers with
 * the *minimum honest substitute*:
 *
 *   - a Web Component module that registers exactly the custom element the
 *     request names, so `customElements.whenDefined` resolves;
 *   - an embed script that appends one iframe into the widget slot, exactly
 *     where the provider puts it.
 *
 * Nothing about LUC's wrapper is bypassed: the real loader runs, the real
 * lifecycle transitions happen, and the real `data-luc-tv-status` attribute is
 * observed. Only the provider's bytes are replaced.
 *
 * The live tier (`pnpm qa:providers`) never installs any of this. It loads the
 * real provider script, in the real browser, on 2–3 representative routes, and
 * is the only tier allowed to conclude anything about TradingView availability.
 */

const MODULE_HOSTS = [
  "https://widgets.tradingview-widget.com/**",
  "https://www.tradingview-widget.com/**",
];
const SCRIPT_HOSTS = ["https://s3.tradingview.com/**"];

/** Widget fixtures that are *supposed* to fail: the LUC error surface's input. */
const FAILURE_MARKER = /luc-missing/i;

function tagForModule(url) {
  const basename = new URL(url).pathname.split("/").pop() ?? "";
  const stem = basename.replace(/\.js$/i, "");
  if (!stem) return undefined;
  return stem.startsWith("tv-") ? stem : `tv-${stem}`;
}

const ALL_PATTERNS = [...MODULE_HOSTS, ...SCRIPT_HOSTS];

/**
 * The one interception handler. Shared by page-level and context-level
 * installation so a behaviour group's own contexts behave identically.
 */
function createStubHandler(served) {
  const cors = {
    "access-control-allow-origin": "*",
    "cache-control": "no-store",
  };

  return async (route) => {
    const url = route.request().url();
    if (FAILURE_MARKER.test(url)) {
      served.failures += 1;
      await route.abort("failed");
      return;
    }

    const looksLikeModule = /\.js(\?|$)/i.test(url) && (url.includes("widgets.tradingview-widget.com/w/") || url.includes("/widget/"));
    if (looksLikeModule) {
      const tag = tagForModule(url);
      served.modules += 1;
      if (!tag) {
        await route.abort("failed");
        return;
      }
      await route.fulfill({
        status: 200,
        headers: { ...cors, "content-type": "text/javascript; charset=utf-8" },
        body: `
globalThis.__lucQaProviderStub = (globalThis.__lucQaProviderStub ?? []).concat(${JSON.stringify(tag)});
if (!customElements.get(${JSON.stringify(tag)})) {
  customElements.define(${JSON.stringify(tag)}, class extends HTMLElement {
    connectedCallback() {
      if (this.dataset.lucQaStub === "1") return;
      this.dataset.lucQaStub = "1";
      const box = document.createElement("div");
      box.setAttribute("data-luc-qa-provider-stub", "web-component");
      box.setAttribute("aria-hidden", "true");
      box.textContent = ${JSON.stringify(tag)};
      box.style.cssText = "display:grid;place-items:center;width:100%;height:100%;font:12px/1.4 system-ui,sans-serif;background:#e9ecef;color:#4b5563;";
      this.append(box);
    }
  });
}
export default globalThis.__lucQaProviderStub;
`,
      });
      return;
    }

    served.embeds += 1;
    await route.fulfill({
      status: 200,
      headers: { ...cors, "content-type": "text/javascript; charset=utf-8" },
      body: `
(function () {
  var script = document.currentScript;
  var container = script && script.parentElement;
  if (!container) return;
  var slot = container.querySelector(".tradingview-widget-container__widget") || container;
  var frame = document.createElement("iframe");
  frame.setAttribute("data-luc-qa-provider-stub", "iframe");
  frame.setAttribute("title", "TradingView widget (deterministic QA stub)");
  frame.setAttribute("loading", "eager");
  frame.style.cssText = "width:100%;height:100%;border:0;display:block;";
  frame.src = "about:blank";
  slot.appendChild(frame);
})();
`,
    });
  };
}

/**
 * Install the deterministic provider on one page.
 *
 * Returns a summary of what was served, so a caller can report "n stubbed"
 * instead of leaving the reader to guess whether the provider was involved.
 */
export async function installProviderStub(page) {
  const served = { modules: 0, embeds: 0, failures: 0 };
  const handler = createStubHandler(served);
  for (const pattern of ALL_PATTERNS) await page.route(pattern, handler);
  return served;
}

/**
 * Install the deterministic provider on a whole context.
 *
 * This is what lets the behaviour groups keep creating their own contexts while
 * still running in the deterministic tier.
 */
export async function installProviderStubOnContext(context) {
  const served = { modules: 0, embeds: 0, failures: 0 };
  const handler = createStubHandler(served);
  for (const pattern of ALL_PATTERNS) await context.route(pattern, handler);
  return served;
}

/**
 * One probe for every provider-facing fact the wrapper owns.
 *
 * Deliberately reads only LUC's own attributes plus the provider's *documented*
 * container class — never a provider-internal selector.
 */
export async function providerState(page) {
  return page.evaluate(() => {
    /*
     * Only the *live* tree counts.
     *
     * When LUC releases a provider widget it parks the container in a hidden
     * teardown lot for a bounded grace period, because the provider script's own
     * callbacks address nodes that would otherwise vanish mid-flight. Those
     * nodes are `aria-hidden`, off-screen and inert — they are not widgets a user
     * can see, so counting them here reported a phantom "second iframe" after a
     * theme flip. `parked` is reported separately, and the teardown-lot check in
     * the providers group is what asserts the lot actually drains.
     */
    const parkedIn = (node) => node.closest("#luc-tv-teardown-lot") !== null;
    const widgets = Array.from(document.querySelectorAll("[data-luc-tv-widget]")).filter((node) => !parkedIn(node));
    const tags = Array.from(new Set(widgets.map((element) => element.tagName.toLowerCase())));
    const containers = Array.from(document.querySelectorAll(".tradingview-widget-container")).filter(
      (node) => !parkedIn(node),
    );
    const statusNodes = Array.from(document.querySelectorAll("[data-luc-tv-status]")).filter((node) => !parkedIn(node));
    const statuses = statusNodes.map((node) => node.getAttribute("data-luc-tv-status"));
    return {
      widgets: widgets.length,
      undefinedTags: tags.filter((tag) => !window.customElements.get(tag)),
      iframes: Array.from(document.querySelectorAll("iframe")).filter((node) => !parkedIn(node)).length,
      parked: Array.from(document.querySelectorAll("#luc-tv-teardown-lot iframe")).length,
      skeletons: document.querySelectorAll('[role="status"]').length,
      boxes: statusNodes.length,
      ready: statuses.filter((status) => status === "ready").length,
      errored: statuses.filter((status) => status === "error").length,
      pending: statuses.filter((status) => status === "idle" || status === "loading").length,
      attribution: containers.filter((container) => {
        const link = container.querySelector(".tradingview-widget-copyright a");
        return !!link && link.target === "_blank" && (container.textContent ?? "").includes("TradingView");
      }).length,
      containers: containers.length,
    };
  });
}
