/**
 * Which kind of page is this, and what does UX-005 owe it?
 *
 * The navigation probe used to assert the related/previous-next footer on every
 * route it was given — including `/charts/catalog`, which is a *collection*: a
 * catalogue of charts is not a registry entry, has no family to draw siblings
 * from and no place in the reading order, so `EntryFooter` correctly renders
 * nothing there and the probe called it a failure. The choice was to invent
 * navigation for a catalogue page or to make the contract say what it means.
 *
 * The three kinds, and what each owes a reader:
 *
 *   entry      one registry entry: a component, a chart, a motion primitive. It
 *              owes 2–4 related links and a two-link pager (UX-005).
 *   collection a catalogue, an index, a roadmap. It owes a way *into* the thing
 *              it lists — which its body is — and nothing at the foot.
 *   standalone a guide, a pattern walkthrough, a reference page. Same as a
 *              collection: there is no reading order to be next in.
 *
 * Pure and dependency-free so the probe and a test can share it: the rule is the
 * thing worth pinning, not the browser that happens to exercise it.
 */

/** The generated navigation projection's rows, as `{ route, status }`. */
export function entryRoutes(navRows) {
  return new Set(navRows.filter((row) => row.status !== "reference").map((row) => row.route));
}

export function classifyRoute(route, routes) {
  return routes.has(route) ? "entry" : "collection";
}

/**
 * The problems a footer has, given the page's kind.
 *
 * An entry page with nothing at its foot is the defect UX-005 is about; a
 * collection with nothing at its foot is not a defect at all. Keeping this in one
 * function is what makes the negative case testable without a browser.
 */
export function footerProblems(route, kind, footer) {
  if (kind !== "entry") return [];
  const problems = [];
  if (!footer) return [`${route}: no footer at all on a registry entry page`];
  if (footer.related.length < 2) problems.push(`only ${footer.related.length} related link(s)`);
  if (footer.related.length > 4) problems.push(`${footer.related.length} related links (a catalogue, not a row)`);
  for (const link of footer.related) {
    if (!link.href?.startsWith("/")) problems.push(`related link is not canonical: ${link.href}`);
    if ((link.name ?? "").length < 2) problems.push(`related link ${link.href} has no accessible name`);
    if (link.href === route) problems.push("related link points at the page itself");
  }
  if (footer.prevNext.length !== 2) problems.push(`previous/next has ${footer.prevNext.length} link(s)`);
  for (const link of footer.prevNext) {
    if (!/^(Previous|Next)/.test(link.name ?? "")) problems.push(`pager link is unnamed: "${link.name}"`);
  }
  return problems;
}
