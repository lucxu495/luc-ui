/**
 * LUC UI — browser QA entry point.
 *
 *   LUC_QA_BASE_URL=http://127.0.0.1:5300 node scripts/visual-qa.mjs
 *
 * The implementation lives in `qa/`; this file only forwards argv so the
 * historical command keeps working:
 *
 *   node scripts/visual-qa.mjs --mode=full
 *   node scripts/visual-qa.mjs --mode=changed
 *   node scripts/visual-qa.mjs --mode=behaviour --group=charts
 *   node scripts/visual-qa.mjs --mode=providers --provider-mode=live
 *   node scripts/visual-qa.mjs --routes=buttons,components-slider
 *
 * Modes and tiers are documented in `luc-ui/docs/QA_WORKFLOW.md`.
 */

import { main } from "../qa/run.mjs";

try {
  await main(process.argv.slice(2), process.env);
} catch (error) {
  console.error(`\nLUC UI QA failed to start: ${error?.message ?? error}`);
  process.exitCode = 1;
}
