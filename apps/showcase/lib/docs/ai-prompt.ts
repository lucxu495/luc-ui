/*
 * Copy-for-AI.
 *
 * A prompt written for a coding agent is not marketing copy with a different
 * audience — it is a specification. The agent needs the things that are not
 * guessable from a component's name: the exact import path, what has to be
 * installed around it, the data contract, the accessibility expectation, and
 * which props were chosen. Everything else is noise that makes the model
 * improvise.
 *
 * Two honesty rules:
 *
 *  - Nothing here claims a tool, server or integration exists. There is no MCP
 *    adapter in Phase 9, so no prompt mentions one.
 *  - The chosen props are described in words as well as in code, because an
 *    agent reads the sentence and a human pastes the code.
 */

import { PEER_REQUIREMENTS, importLine } from "./install";

/** The entry fields a prompt states. Everything else in a `DocEntry` is noise. */
export interface PromptEntry {
  title: string;
  /** One sentence: what the component is for. */
  summary: string;
  importPath: string;
  exports: readonly string[];
}

export interface AiPromptInput {
  entry: PromptEntry;
  /** The props the reader currently has set in the Playground, if any. */
  props?: Record<string, unknown>;
  /** The generated JSX for the Playground's current state, if any. */
  code?: string;
  /** Extra guidance the page wants to add, e.g. a data contract. */
  contract?: string;
}

/** Render a prop value the way a developer would write it in JSX. */
function renderPropValue(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "" : "{false}";
  if (typeof value === "number") return `{${value}}`;
  return `{${JSON.stringify(value)}}`;
}

/** The props line a prompt uses when there is no generated snippet. */
function propsLine(props: Record<string, unknown> | undefined): string {
  const entries = Object.entries(props ?? {});
  if (entries.length === 0) return "no props were configured, so use the component's own defaults";
  return entries
    .map(([name, value]) => {
      const rendered = renderPropValue(value);
      return rendered === "" ? `\`${name}\`` : `\`${name}=${rendered}\``;
    })
    .join(", ");
}

/**
 * Build the prompt.
 *
 * Kept compact on purpose: a prompt a page long gets skimmed by the model and
 * truncated by the human.
 */
export function buildAiPrompt({ entry, props, code, contract }: AiPromptInput): string {
  const symbols = entry.exports.slice(0, 6);
  const lines: string[] = [
    `Implement \`${entry.title}\` from LUC UI. It is: ${entry.summary}`,
    ``,
    `Import it with: ${importLine(entry.importPath, symbols)}`,
    `Requires: ${PEER_REQUIREMENTS.join("; ")}. Import the stylesheet once at the app root and wrap the tree in \`LucProvider\`. Both come from the package that publishes ${entry.importPath.split("/")[0]}.`,
    ``,
    `Chosen configuration: ${propsLine(props)}.`,
  ];

  if (contract) {
    lines.push(``, `Data contract: ${contract}`);
  }

  lines.push(
    ``,
    `Accessibility: keep the component's own semantics. Do not re-implement its ARIA wiring, do not add roles it does not declare, and make sure every interactive element is reachable and operable from the keyboard with a visible focus state.`,
    `Styling: use LUC UI design tokens and the component's own props. Do not restyle with raw colour literals and do not override the component's internal structure with page CSS.`,
    `Motion: respect \`prefers-reduced-motion\`. The component already does, so do not disable it.`,
  );

  if (code) {
    lines.push(``, `Reproduce this state:`, "```tsx", code.trim(), "```");
  }

  return lines.join("\n");
}
