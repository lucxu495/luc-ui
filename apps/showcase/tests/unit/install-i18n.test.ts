/*
 * DOC-005 — the installation and API surface is Chinese on Chinese pages.
 *
 * The independent audit's C-04 was about a *blind spot*, not a missing
 * translation: a registry lead lived in generated data, so nothing in the source
 * named it and `verify:i18n` reported 100% while every Chinese page opened in
 * English. Fixing that one instance did not fix the class, and this is the same
 * class one layer down — `lib/docs/install.ts` holds the distribution modes, the
 * setup steps and their notes, and `doc-entry.tsx` renders them through `tcs`,
 * which the extractor cannot resolve because the argument is a variable.
 *
 * Measured on `/zh/components/native-select`, `/zh/motion/card-stack` and
 * `/zh/charts/line-chart` before this: "Workspace or tarball", "Package
 * registry", "Required setup", "Install — Install the packed tarball …",
 * "NativeSelect is imported from @luc/ui:", and the whole props table header.
 *
 * So the guard is here rather than in the coverage gate: every string this
 * surface can print is collected from its own module and asserted against the
 * dictionary, which is what makes "the installation instructions are in Chinese"
 * a checked claim. A new mode, a new step or a new label fails this test until it
 * is translated.
 */

import { describe, expect, it } from "vitest";
import { dictionaries } from "@/lib/i18n/messages";
import {
  DISTRIBUTION_MODES,
  PACKAGE_MANAGERS,
  PEER_REQUIREMENTS,
  setupSnippets,
} from "@/lib/docs/install";

/**
 * The keys the *runtime* dictionary holds.
 *
 * Read from the module, not from the file with a regex. The regex version — which
 * this test used first, and which the older lead test still uses — scans the
 * whole file, so an entry that lands *outside* the exported map passes the check
 * while never reaching a page. That is not hypothetical: a re-added "Required
 * setup" key landed after the closing brace during this very change, the regex
 * test was happy, and the page would still have printed English.
 */
const chineseKeys = (): Set<string> => new Set(Object.keys(dictionaries["zh-CN"].prose));

/** The literal keys the docs surface looks up, including the interpolated ones. */
const SURFACE_KEYS = [
  "Workspace or tarball",
  "Package registry",
  "Works today",
  "Not published yet",
  "Required setup",
  "Exported symbols",
  "Export",
  "Kind",
  "Signature",
  "Prop",
  "Type",
  "Type:",
  "Default",
  "Notes",
  "Values the compiler reads from the declaration.",
  "This export takes no props of its own.",
  "{name} props",
  "{count} documented props",
  "{name} is imported from",
  "Copy import path",
  "Copy the command",
  "Copy the snippet",
];

describe("the installation surface is translatable", () => {
  it("has a Chinese sentence for every distribution mode", async () => {
    const zh = chineseKeys();
    const missing = Object.values(DISTRIBUTION_MODES)
      .flatMap((mode) => [mode.label, mode.note])
      .filter((text) => !zh.has(text));
    expect(missing, `untranslated distribution copy:\n${missing.join("\n")}`).toEqual([]);
  });

  it("has a Chinese sentence for every setup step, in both modes", async () => {
    const zh = chineseKeys();
    const missing: string[] = [];
    for (const mode of Object.keys(DISTRIBUTION_MODES) as (keyof typeof DISTRIBUTION_MODES)[]) {
      for (const snippet of setupSnippets(mode)) {
        if (!zh.has(snippet.title)) missing.push(`${mode}: ${snippet.title}`);
        if (!zh.has(snippet.description)) missing.push(`${mode}: ${snippet.description}`);
      }
    }
    expect(missing, `untranslated setup steps:\n${missing.join("\n")}`).toEqual([]);
  });

  it("has a Chinese sentence for every literal the surface prints", async () => {
    const zh = chineseKeys();
    const missing = SURFACE_KEYS.filter((key) => !zh.has(key));
    expect(missing, `untranslated surface copy:\n${missing.join("\n")}`).toEqual([]);
  });

  it("leaves the commands and the peer requirements in code, not prose", () => {
    /*
     * The other half of "do not manufacture dictionary entries": a shell command
     * and a version constraint are identifiers. Translating them would break what
     * a reader pastes, so they are asserted to *look* like code — and the test
     * fails if somebody starts wrapping them in prose.
     */
    for (const manager of PACKAGE_MANAGERS) {
      expect(manager).toMatch(/^[a-z]+$/);
    }
    for (const requirement of PEER_REQUIREMENTS) {
      expect(requirement).toMatch(/^[A-Za-z-]+ >= [\d.]+/);
    }
  });
});
