/*
 * The per-entry notes are curation, and curation that names nothing is worse
 * than no curation: it renders an empty section, or a snippet that imports a
 * symbol the page never documents, and both look deliberate.
 *
 * `scripts/docs-registry.mjs` already validates the *keys* — an unknown entry id
 * fails `pnpm verify:docs`. What a generator cannot check is the content, because
 * the content is prose and JSX-like snippets rather than facts about the module.
 * So this file checks the three ways a note can be wrong on its own:
 *
 *   1. a `usage.imports` symbol that the entry's own import path does not publish;
 *   2. a `usage.code` that mentions no export of the entry it belongs to;
 *   3. a guidance or accessibility row so short it cannot be advice.
 *
 * It reads the registry, not the source: the same rows the pages render.
 */

import { describe, expect, it } from "vitest";
import catalog from "../../../../docs/component-catalog.json";
import { ENTRY_NOTES, RELATED_ENTRIES } from "@/lib/docs/curation/notes";
import { docEntries, entryById } from "@/lib/docs/registry";

/** Every named export a subpath publishes, from the package's own catalogue. */
const exportsByImport = new Map(
  Object.values(catalog.entries).map((entry) => [
    (entry as { import: string }).import,
    new Set(((entry as { exports?: { name: string }[] }).exports ?? []).map((item) => item.name)),
  ]),
);

describe("the per-entry documentation notes", () => {
  it("documents something the registry knows", () => {
    for (const id of Object.keys(ENTRY_NOTES)) {
      expect(entryById(id), `${id} is not a documented entry`).toBeDefined();
    }
  });

  it("imports only symbols the entry's own import path publishes", () => {
    const wrong: string[] = [];
    for (const [id, note] of Object.entries(ENTRY_NOTES)) {
      const entry = entryById(id);
      if (!entry) continue;
      const published = exportsByImport.get(entry.importPath);
      if (!published) continue;
      for (const symbol of note.usage?.imports ?? []) {
        if (!published.has(symbol)) {
          wrong.push(`${id}: ${entry.importPath} does not export ${symbol}`);
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  it("prints a minimal call that uses what the page documents", () => {
    const wrong: string[] = [];
    for (const [id, note] of Object.entries(ENTRY_NOTES)) {
      const entry = entryById(id);
      if (!entry || note.usage?.code === undefined) continue;
      if (!entry.exports.some((name) => note.usage?.code?.includes(`<${name}`))) {
        wrong.push(`${id}: the snippet renders none of ${entry.exports.join(", ")}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it("writes advice as advice", () => {
    const thin: string[] = [];
    for (const [id, note] of Object.entries(ENTRY_NOTES)) {
      for (const row of [...(note.guidance?.use ?? []), ...(note.guidance?.avoid ?? [])]) {
        /* Six words is the floor at which a row can say what to do and when.
         * Anything shorter is a label, and the two columns are not a word list. */
        if (row.split(/\s+/).filter(Boolean).length < 6) thin.push(`${id}: "${row}"`);
      }
      const detail = note.accessibility?.detail;
      if (detail !== undefined && detail.length < 80) thin.push(`${id}: accessibility detail is a fragment`);
    }
    expect(thin).toEqual([]);
  });

  it("keeps every related row inside the family and never points at itself", () => {
    const wrong: string[] = [];
    for (const [id, related] of Object.entries(RELATED_ENTRIES)) {
      const entry = entryById(id);
      if (!entry) continue;
      if (related.length < 2 || related.length > 4) {
        wrong.push(`${id}: ${related.length} related row(s) — the footer renders 2 to 4`);
      }
      for (const target of related) {
        const other = entryById(target);
        if (!other) wrong.push(`${id} → ${target} is not an entry`);
        else if (other.id === entry.id) wrong.push(`${id} lists itself`);
        else if (other.family !== entry.family) wrong.push(`${id} → ${target} leaves the family`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it("gives every Actions entry the three notes its page can render", () => {
    /* The category this revision covers. A new Actions entry without notes is a
     * page that silently loses its Usage, Guidelines and Accessibility sections,
     * which is a gap rather than a decision — so it fails here. */
    const actions = docEntries.filter((entry) => entry.family === "actions");
    expect(actions.length).toBeGreaterThan(4);
    const missing = actions
      .filter((entry) => {
        const note = ENTRY_NOTES[entry.id];
        return !note?.usage?.code || !note.guidance?.use?.length || !note.accessibility?.detail;
      })
      .map((entry) => entry.id);
    expect(missing).toEqual([]);
  });

  it("gives every Forms entry the three notes its page can render", () => {
    /*
     * The same contract for the second category, and the reason it is asserted
     * rather than trusted: a Forms entry without notes renders the canonical page
     * without Usage, Guidelines or Accessibility, and the page that loses them
     * looks deliberate. `file-input` and `file-upload` share one route, so both
     * sets of notes are read by that one page — the file-upload route renders
     * them side by side.
     */
    const forms = docEntries.filter((entry) => entry.family === "forms");
    expect(forms.length).toBeGreaterThan(20);
    const missing = forms
      .filter((entry) => {
        const note = ENTRY_NOTES[entry.id];
        return !note?.usage?.code || !note.guidance?.use?.length || !note.accessibility?.detail;
      })
      .map((entry) => entry.id);
    expect(missing).toEqual([]);
  });

  it("gives every Layout entry the notes its page can render", () => {
    /*
     * The same contract for the third family. One refinement: a *curated* page
     * owns its Usage section, so a note without a `usage` snippet is complete
     * for it — the rule the file's own header states, that a snippet here is
     * only for a page the registry renders. Guidance and the accessibility
     * statement come from the notes either way, which is what keeps ten Layout
     * pages from writing the same advice ten times.
     */
    const layout = docEntries.filter((entry) => entry.family === "layout");
    expect(layout.length).toBeGreaterThanOrEqual(10);
    const missing = layout
      .filter((entry) => {
        const note = ENTRY_NOTES[entry.id];
        const usageOwnedByPage = entry.status === "curated" && entry.pageFile !== undefined;
        return (
          (!usageOwnedByPage && !note?.usage?.code) ||
          !note.guidance?.use?.length ||
          !note.accessibility?.detail
        );
      })
      .map((entry) => entry.id);
    expect(missing).toEqual([]);
  });

  it("gives every Date and time entry guidance and an accessibility statement", () => {
    /*
     * All three date entries are curated pages, so Usage lives on the page and
     * is not asserted here. What is asserted is the part that cannot live on a
     * page without being written three times: the value-type guidance (`a date
     * is not an instant`) and the per-component accessibility detail.
     */
    /*
     * A reference row has no page of its own — `datetime-picker` and
     * `month-year-picker` are documented inside `/date-time/date-picker` — so it
     * renders no notes section and cannot be asked for one. What the family
     * contract covers is the entries a reader can open directly.
     */
    const dateTime = docEntries.filter(
      (entry) => entry.family === "date-time" && entry.status !== "reference",
    );
    expect(dateTime.length).toBeGreaterThanOrEqual(3);
    const missing = dateTime
      .filter((entry) => {
        const note = ENTRY_NOTES[entry.id];
        return !note?.guidance?.use?.length || !note.accessibility?.detail;
      })
      .map((entry) => entry.id);
    expect(missing).toEqual([]);
  });

  it("gives every Navigation entry the three notes its page renders", () => {
    /*
     * The family this revision covers, and the assertion is deliberately the
     * strongest of the four because of how this family is shaped: four entries are
     * curated pages and one (`stepper`) is generated, so a note that only owned
     * *some* of them would leave one page's Usage section empty. All three notes
     * are read by all five pages — the curated ones take the minimal call from
     * here as well, so the same sentence cannot exist twice.
     */
    /* Same rule as Date and time: `sidebar`, `breadcrumbs` and `page-header` are
     * documented on the AppShell page, not on pages of their own. */
    const navigation = docEntries.filter(
      (entry) => entry.family === "navigation" && entry.status !== "reference",
    );
    expect(navigation.length).toBe(5);
    const missing = navigation
      .filter((entry) => {
        const note = ENTRY_NOTES[entry.id];
        return !note?.usage?.code || !note.guidance?.use?.length || !note.accessibility?.detail;
      })
      .map((entry) => entry.id);
    expect(missing).toEqual([]);
  });

  it("gives every Feedback entry the three notes its page renders", () => {
    /*
     * The family this batch covers, and the assertion is the same three-part
     * contract the other four use: a minimal call, advice, and one accessibility
     * statement that is true of *this* component rather than of the family. The
     * reason it matters more here than anywhere else is that eight of the ten
     * Feedback pages say something about *when to choose them*, which is exactly
     * the kind of guidance that gets written once in a family paragraph and then
     * never reaches the page a reader is on.
     */
    const feedback = docEntries.filter((entry) => entry.family === "feedback");
    expect(feedback.length).toBe(10);
    const missing = feedback
      .filter((entry) => {
        const note = ENTRY_NOTES[entry.id];
        return !note?.usage?.code || !note.guidance?.use?.length || !note.accessibility?.detail;
      })
      .map((entry) => entry.id);
    expect(missing).toEqual([]);
  });
});
