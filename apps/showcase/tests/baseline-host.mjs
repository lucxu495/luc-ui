import { existsSync } from "node:fs";

/**
 * Playwright appends the host platform to a snapshot name. ADR-036 forbids
 * comparing a Linux capture with a macOS baseline, so a missing baseline for the
 * current host must be a reported skip rather than an implicit snapshot write.
 */
export const BASELINE_HOST = process.platform === "darwin" ? "darwin" : "linux";

export function missingHostedBaseline(testInfo, name) {
  if (existsSync(testInfo.snapshotPath(name))) return null;
  return `no ${BASELINE_HOST} baseline for ${name} — baselines are host-local (ADR-036: never diff across hosts)`;
}
