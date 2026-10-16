/**
 * axe-core scan, unchanged in scope from the original script.
 *
 * Provider-owned DOM (`.tradingview-widget-container`) is excluded and only
 * that: the iframe it creates is a separate document injected by TradingView,
 * and the copyright block's colours are set by the embed script with
 * `!important`. The LUC box around the widget stays in scope. See
 * `docs/ACCESSIBILITY.md` → "Third-party boundaries".
 */

import AxeBuilder from "@axe-core/playwright";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

export async function runAxe(page, slug, recorder) {
  const started = performance.now();
  try {
    const results = await new AxeBuilder({ page })
      .withTags(TAGS)
      .exclude(".tradingview-widget-container")
      /*
       * The deterministic QA stub is not LUC's DOM and not the provider's: it
       * exists only in `providerMode=stub`, and auditing it would report
       * placeholder pixels as product defects. The LUC box around it stays in
       * scope.
       */
      .exclude("[data-luc-qa-provider-stub]")
      .analyze();
    recorder.counters.axeScans += 1;
    const serious = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );
    recorder.axe.push({
      slug,
      durationMs: Math.round(performance.now() - started),
      violations: results.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        nodes: violation.nodes.slice(0, 3).map((node) => node.target.join(" ")),
      })),
    });
    for (const violation of serious) {
      recorder.record(
        "a11y",
        `${slug}: ${violation.id} (${violation.impact}) — ${violation.nodes.length} node(s): ${violation.nodes
          .slice(0, 2)
          .map((node) => node.target.join(" "))
          .join(", ")}`,
      );
    }
  } catch (error) {
    recorder.counters.axeErrors += 1;
    recorder.record("a11y-error", `${slug}: ${error.message}`);
  }
  return Math.round(performance.now() - started);
}
