/*
 * DOC-004 — the sidebar is a map, and its labels are the road signs.
 *
 * The independent audit quoted one row as the example: the Visuals
 * documentation entry read "Entry points, capacity rules, diagnostics,
 * isolation." — four internal headings, no answer to "what do I get if I click
 * this". The acceptance criteria are user language, at most twelve words, in
 * both locales.
 *
 * The word budget is checked here rather than reviewed once, because a sidebar
 * row is the cheapest thing in the codebase to add and the easiest to let grow:
 * the audit's count was already up to 13 words on two rows by the time anyone
 * looked. The vocabulary half is a ratio: a description may contain at most one
 * term from a short list of internal nouns, because several of them in one
 * sentence is what turns a sign into a table of contents.
 */

import { describe, expect, it } from "vitest";
import { navigation } from "@/lib/navigation";
import { NAV_AREAS } from "@/lib/discovery/areas";

const WORDS = 12;
const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** Words that name how a page is organised rather than what a reader gets. */
const INTERNAL = [
  "capacity",
  "diagnostic",
  "isolation",
  "provenance",
  "invariant",
  "idempotent",
  "deterministic",
];

describe("the sidebar copy budget", () => {
  it("keeps every navigation description to 12 words", () => {
    const over: string[] = [];
    for (const group of navigation) {
      for (const item of group.items) {
        if (item.description && words(item.description) > WORDS) {
          over.push(`${item.title} → ${item.description} (${words(item.description)} words)`);
        }
        for (const child of item.children ?? []) {
          if (child.description && words(child.description) > WORDS) {
            over.push(`${child.title} → ${child.description} (${words(child.description)} words)`);
          }
        }
      }
    }
    expect(over).toEqual([]);
  });

  it("keeps every area description to 12 words", () => {
    /* An area's sentence is printed in the sidebar header and the site map, so it
     * is a sidebar row too — and Build's four subareas share theirs with the
     * navigation rows above. */
    const over = NAV_AREAS.filter((area) => words(area.description) > WORDS).map(
      (area) => `${area.id} (${words(area.description)} words)`,
    );
    expect(over).toEqual([]);
  });

  it("does not describe a destination in the words of its implementation", () => {
    const offenders: string[] = [];
    const scan = (title: string, description: string) => {
      const hits = INTERNAL.filter((term) => description.toLowerCase().includes(term));
      if (hits.length > 1) offenders.push(`${title}: ${hits.join(", ")}`);
    };
    for (const group of navigation) {
      for (const item of group.items) {
        if (item.description) scan(item.title, item.description);
        for (const child of item.children ?? []) {
          if (child.description) scan(child.title, child.description);
        }
      }
    }
    for (const area of NAV_AREAS) scan(area.id, area.description);
    expect(offenders).toEqual([]);
  });
});
