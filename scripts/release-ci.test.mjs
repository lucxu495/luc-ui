import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import {
  BASELINE_HOST,
  missingHostedBaseline,
} from "../apps/showcase/tests/baseline-host.mjs";

const root = new URL("../", import.meta.url);
const workflow = readFileSync(new URL(".github/workflows/ci.yml", root), "utf8");
const jobsSource = workflow.slice(workflow.indexOf("jobs:"));
const executableWorkflow = workflow
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("#"))
  .join("\n");

function job(name) {
  const starts = [...jobsSource.matchAll(/^  ([a-z][a-z0-9-]+):$/gm)];
  const index = starts.findIndex((match) => match[1] === name);
  assert.ok(index >= 0, `missing CI job: ${name}`);
  const start = starts[index].index;
  const end = starts[index + 1]?.index ?? jobsSource.length;
  return jobsSource.slice(start, end);
}

describe("release CI contract", () => {
  it("keeps the four quality responsibilities in separate mandatory jobs", () => {
    const expected = ["verify", "consumer", "browser-qa", "visual-regression"];
    for (const name of expected) assert.ok(job(name), `${name} must remain a job`);

    assert.match(job("browser-qa"), /pnpm qa:full/);
    assert.match(job("visual-regression"), /pnpm qa:baseline/);
    assert.doesNotMatch(workflow, /continue-on-error\s*:/);
  });

  it("does not publish, tag, release or deploy from CI", () => {
    assert.doesNotMatch(executableWorkflow, /\bnpm publish\b|\bpnpm publish\b/);
    assert.doesNotMatch(executableWorkflow, /\bgh release create\b/);
    assert.doesNotMatch(executableWorkflow, /\bgit tag\b|\bgit push\b/);
    assert.match(workflow, /permissions:\s*\n\s*contents: read/);
  });

  it("reports a missing host baseline instead of writing one", () => {
    const existing = fileURLToPath(import.meta.url);
    assert.equal(
      missingHostedBaseline({ snapshotPath: () => existing }, "existing.png"),
      null,
    );

    const missing = missingHostedBaseline(
      { snapshotPath: () => `${existing}.missing` },
      "missing.png",
    );
    assert.match(missing, new RegExp(`no ${BASELINE_HOST} baseline for missing\\.png`));
    assert.match(missing, /ADR-036/);
  });
});
