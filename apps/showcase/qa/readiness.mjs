/**
 * Readiness conditions.
 *
 * The one rule this file exists to enforce: **never wait for a third party's
 * network to go quiet.** The previous implementation called
 * `waitForLoadState("networkidle")` on every route, which on a live provider
 * page either burned its full timeout or returned because the provider happened
 * to pause — a duration decided by TradingView, not by LUC.
 *
 * Instead:
 *   1. the document is parsed              (`domcontentloaded`, done by `goto`);
 *   2. the application is hydrated          (`data-luc-hydrated`, LUC-owned);
 *   3. fonts are settled                    (`document.fonts.ready`);
 *   4. provider wrappers report their own   (`data-luc-tv-status`);
 *      lifecycle — *after* they are scrolled into view, which is what starts
 *      the lazy load in the first place.
 *
 * Every condition is a DOM/application fact and every wait is bounded.
 */

const HYDRATION_ATTR = "lucHydrated";
const PROVIDER_STATUS_ATTR = "data-luc-tv-status";

/**
 * Wait until the Showcase has hydrated.
 *
 * `AppFrame` sets the marker from an effect, so it appears only after React has
 * committed the whole tree. A missing marker is a real defect, so this throws
 * with an actionable message instead of continuing to a meaningless screenshot.
 */
export async function waitForAppReady(page, { timeoutMs = 20_000 } = {}) {
  try {
    await page.waitForFunction(
      (attribute) => document.documentElement.dataset[attribute] === "1",
      HYDRATION_ATTR,
      { timeout: timeoutMs },
    );
  } catch {
    throw new Error(
      `[qa] The Showcase did not hydrate within ${timeoutMs}ms (${page.url()}). ` +
        "The page shell is server-rendered; a missing marker means the client bundle failed " +
        "or a console error stopped hydration. Check the console problems in qa-report.json.",
    );
  }
}

/** Fonts plus a short, bounded layout settle. No network condition involved. */
export async function waitForStable(page, { settleMs = 300 } = {}) {
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  if (settleMs > 0) await page.waitForTimeout(settleMs);
}

/**
 * The full navigation contract: parse, hydrate, settle.
 * Returns the readiness timings so the report can attribute them.
 */
export async function navigateAndReady(page, url, { timeoutMs = 20_000, settleMs = 300 } = {}) {
  const started = performance.now();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const navigationMs = performance.now() - started;
  const readyStarted = performance.now();
  await waitForAppReady(page, { timeoutMs });
  await waitForStable(page, { settleMs });
  return { navigationMs, readinessMs: performance.now() - readyStarted };
}

/**
 * Scroll the page the way a reader would, so scroll-triggered reveals and
 * IntersectionObserver mounts have happened before a full-page capture.
 *
 * Full-page screenshots resize the viewport without firing the observers in
 * time, and lazy provider widgets never even *request* their module until they
 * are near the viewport — which is why the provider settle below must scroll
 * first.
 */
export async function readThrough(page, { stepDelayMs = 60, tailMs = 180, endMs = 120 } = {}) {
  await page.evaluate(
    async ({ stepDelay, tail, end }) => {
      /*
       * The Showcase sets `scroll-behavior: smooth` on the document. A smooth
       * scroll cannot keep up with a scripted read-through: every `scrollTo`
       * re-targets the animation, so the page never actually reached the bottom
       * and everything below the first screen — lazy provider widgets included —
       * was never intersected or requested. Force instant scrolling for the
       * pass and restore the author's setting afterwards.
       */
      const root = document.documentElement;
      const previousBehaviour = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      const to = (y) => window.scrollTo({ top: y, left: 0, behavior: "instant" });
      try {
        const step = Math.max(200, Math.round(window.innerHeight * 0.8));
        for (let y = 0; y <= root.scrollHeight; y += step) {
          to(y);
          await new Promise((resolve) => setTimeout(resolve, stepDelay));
        }
        to(root.scrollHeight);
        await new Promise((resolve) => setTimeout(resolve, tail));
        to(0);
        await new Promise((resolve) => setTimeout(resolve, end));
      } finally {
        root.style.scrollBehavior = previousBehaviour;
      }
    },
    { stepDelay: stepDelayMs, tail: tailMs, end: endMs },
  );
}

/** Current lifecycle counts across every TradingView wrapper on the page. */
export async function providerStatusCounts(page) {
  return page.evaluate((attribute) => {
    const nodes = Array.from(document.querySelectorAll(`[${attribute}]`));
    const counts = { idle: 0, loading: 0, ready: 0, error: 0, pending: 0, total: nodes.length };
    for (const node of nodes) {
      const status = node.getAttribute(attribute);
      if (status && status in counts) counts[status] += 1;
    }
    counts.pending = counts.idle + counts.loading;
    return counts;
  }, PROVIDER_STATUS_ATTR);
}

/**
 * Scroll the whole page so every lazy provider widget is requested, then wait
 * for the wrappers themselves to leave `idle`/`loading`.
 *
 * Bounded by design: a widget that never settles is reported as `timedOut` with
 * the counts that were observed, so a provider slowdown shows up as a *number*
 * in the report instead of as an unexplained minute of wall-clock.
 */
export async function settleProviderWidgets(page, { timeoutMs = 12_000, stepDelayMs = 90 } = {}) {
  const started = performance.now();
  await readThrough(page, { stepDelayMs, tailMs: 150, endMs: 100 });

  const waitStarted = performance.now();
  let timedOut = false;
  try {
    await page.waitForFunction(
      (attribute) =>
        Array.from(document.querySelectorAll(`[${attribute}]`)).every((node) => {
          const status = node.getAttribute(attribute);
          return status === "ready" || status === "error";
        }),
      PROVIDER_STATUS_ATTR,
      { timeout: timeoutMs },
    );
  } catch {
    timedOut = true;
  }
  const providerWaitMs = performance.now() - waitStarted;
  const counts = await providerStatusCounts(page);
  return {
    ...counts,
    timedOut,
    scrollMs: waitStarted - started,
    providerWaitMs,
    totalMs: performance.now() - started,
  };
}

/**
 * Wait for a DOM fact, bounded, and report how long it took.
 *
 * This exists because of a race rather than a product defect. The chart
 * interaction checks moved the pointer and then slept — `waitForTimeout(350)`,
 * `(600)` — and asserted immediately afterwards. ECharts paints asynchronously,
 * so that is a bet on the machine: on an idle laptop the tooltip is in the DOM
 * in tens of milliseconds, and under load (two agents' QA tiers sharing one
 * machine, which is how this was found) 350 ms is not enough and the check
 * reports a missing tooltip that was simply not drawn yet. The same shape of
 * bug as the old `networkidle` waits this file was written to replace: a
 * duration standing in for a fact.
 *
 * So: poll for the fact, return `{ ok, waitedMs }`, and let the caller assert
 * `ok`. `waitedMs` is recorded in the check's detail, which keeps a real
 * regression visible — a tooltip that takes 4 000 ms is a finding even though it
 * arrived, and it is a different finding from one that never arrived.
 *
 * `timeoutMs` is honoured exactly, including `0`, which polls once. That is the
 * negative control: with the ceiling at zero these checks must still fail, and
 * they do, because they assert the fact and not the wait.
 */
export async function waitForDomFact(page, predicate, { timeoutMs = 5_000, pollMs = 50, arg } = {}) {
  const started = performance.now();
  let ok = false;
  for (;;) {
    try {
      /* `arg` is serialised with the predicate, so a caller that needs to look at
       * the *nth* of something can pass the index instead of closing over it —
       * a closure would not survive the trip into the page. */
      ok = Boolean(await page.evaluate(predicate, arg));
    } catch {
      ok = false;
    }
    const waitedMs = performance.now() - started;
    if (ok || waitedMs >= timeoutMs) return { ok, waitedMs: Math.round(waitedMs) };
    await page.waitForTimeout(Math.min(pollMs, Math.max(0, timeoutMs - waitedMs)));
  }
}

/**
 * Measure a drawing until two consecutive readings agree.
 *
 * The pixel-count checks (`box plot draws every mark`, `correlation labels`)
 * navigated, slept a fixed 1 200–1 400 ms and then counted painted pixels on a
 * canvas. An ECharts frame is asynchronous, so on a cold or loaded machine that
 * number came back as a fraction of the drawing — 2 717 mark pixels where the
 * same build reports 12 310 — and the check reported a product regression that
 * was a stopwatch. Two runs of the same source on the same machine disagreed,
 * which is the definition of a flaky probe.
 *
 * This is the rule `reduced-motion.mjs` already uses for geometry: sample until
 * two reads agree, then judge. `minimum` keeps an unpainted canvas (zero) from
 * being called "stable" on the first sample, and the ceiling is bounded, so a
 * drawing that never settles still fails — with its last reading, not with a
 * timeout error.
 */
export async function waitForStableReading(page, measure, { timeoutMs = 8_000, pollMs = 250, minimum = 1 } = {}) {
  const started = performance.now();
  let previous;
  for (;;) {
    const latest = await measure();
    const waitedMs = performance.now() - started;
    /*
     * Settled means: a real reading (not the empty canvas) that is *the same* as
     * the previous one. The first pass can never settle — `previous` is
     * undefined — which is what stops a canvas that has not painted its first
     * frame (zero) from being accepted on the spot.
     */
    if (typeof latest === "number" && latest >= minimum && latest === previous) {
      return { value: latest, stable: true, waitedMs: Math.round(waitedMs) };
    }
    if (waitedMs >= timeoutMs) {
      return { value: latest, stable: false, waitedMs: Math.round(waitedMs) };
    }
    previous = latest;
    await page.waitForTimeout(Math.min(pollMs, Math.max(0, timeoutMs - waitedMs)));
  }
}
