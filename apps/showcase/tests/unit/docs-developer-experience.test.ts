/*
 * Installation, AI guidance and the honesty rules around them.
 *
 * These are the claims that can quietly become false: that an install command
 * works, that a version is real, that a prompt does not promise a tool that was
 * never built. Each one is asserted here so that a future edit has to argue with
 * a test rather than with a reader.
 */

import { describe, expect, it } from "vitest";
import {
  DISTRIBUTION_MODES,
  PACKAGE_MANAGERS,
  PACKAGE_NAME,
  PEER_REQUIREMENTS,
  PACKED_TARBALL,
  distributionSpec,
  importLine,
  installCommand,
  setupSnippets,
} from "@/lib/docs/install";
import { buildAiPrompt } from "@/lib/docs/ai-prompt";
import { entryById } from "@/lib/docs/registry";

describe("installation", () => {
  it("offers every package manager a reader actually uses", () => {
    for (const manager of PACKAGE_MANAGERS) {
      const command = installCommand(manager, PACKAGE_NAME);
      expect(command).toContain(PACKAGE_NAME);
      expect(command.split(" ")[0]).toBe(manager);
    }
  });

  it("labels the mode that cannot work yet, and does not pretend otherwise", () => {
    expect(DISTRIBUTION_MODES.source.available).toBe(true);
    expect(DISTRIBUTION_MODES.package.available).toBe(false);
    expect(DISTRIBUTION_MODES.package.note).toContain("not");
  });

  it("never invents a version number", () => {
    const commands = PACKAGE_MANAGERS.flatMap((manager) =>
      (["source", "package"] as const).map((mode) => installCommand(manager, distributionSpec(mode))),
    );
    for (const command of commands) {
      /* A caret, tilde or bare semver in an install command means the page is
       * claiming a release exists. None of them may appear. */
      expect(command, command).not.toMatch(/@[\^~]?\d/);
    }
    expect(distributionSpec("source")).toBe(PACKED_TARBALL);
    expect(distributionSpec("package")).toBe(PACKAGE_NAME);
  });

  it("states the setup a consumer has to perform, in order", () => {
    const snippets = setupSnippets("source");
    expect(snippets.map((snippet) => snippet.title)).toEqual(["Install", "Import the styles", "Install the provider"]);
    expect(snippets[1]?.code).toContain("styles.css");
    expect(snippets[2]?.code).toContain("LucProvider");
    for (const snippet of snippets) {
      expect(snippet.description.length).toBeGreaterThan(20);
      expect(snippet.code.trim().length).toBeGreaterThan(0);
    }
  });

  it("names its peer requirements rather than implying them", () => {
    expect(PEER_REQUIREMENTS.some((requirement) => requirement.includes("react"))).toBe(true);
  });

  it("builds an import line for one symbol and for many", () => {
    expect(importLine("@luc/ui/charts", ["LineChart"])).toBe(
      'import { LineChart } from "@luc/ui/charts";',
    );
    expect(importLine("@luc/ui", ["Text", "Heading"])).toBe(
      'import { Text, Heading } from "@luc/ui";',
    );
  });
});

describe("copy for an AI agent", () => {
  const entry = entryById("button");

  it("has an entry to describe", () => {
    expect(entry).toBeDefined();
  });

  it("carries the facts an agent cannot guess", () => {
    if (!entry) return;
    const prompt = buildAiPrompt({ entry, props: { variant: "danger", loading: true } });
    expect(prompt).toContain(entry.importPath);
    expect(prompt).toContain(entry.title);
    expect(prompt).toContain(entry.summary);
    expect(prompt).toContain("prefers-reduced-motion");
    expect(prompt).toContain("keyboard");
    expect(prompt).toContain("variant");
    expect(prompt).toContain("LucProvider");
  });

  it("does not claim a tool that does not exist", () => {
    if (!entry) return;
    const prompt = buildAiPrompt({ entry, code: "<Button />" });
    for (const claim of ["MCP", "mcp server", "CLI", "npm publish", "registry"]) {
      expect(prompt, `prompt mentions ${claim}`).not.toContain(claim);
    }
  });

  it("includes the generated state when the Playground has one", () => {
    if (!entry) return;
    const withCode = buildAiPrompt({ entry, code: "<Button>Save</Button>" });
    expect(withCode).toContain("```tsx");
    expect(withCode).toContain("<Button>Save</Button>");
    const withoutCode = buildAiPrompt({ entry });
    expect(withoutCode).not.toContain("```tsx");
  });

  it("says so when nothing was configured instead of inventing props", () => {
    if (!entry) return;
    const prompt = buildAiPrompt({ entry });
    expect(prompt).toContain("no props were configured");
  });
});
