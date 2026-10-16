/**
 * `@luc/ui/experiences` — layer C: the reusable pieces a product page is made of.
 *
 * Layer B (the root barrel) is one control at a time. A real personal site or
 * product page is not a control, it is an assembly of six or seven of them with
 * a data contract, and every site was writing the same assemblies by hand: a
 * hero with a name and a row of links, a career in order, a bibliography you can
 * filter, a shelf with progress, a `/now` block with a date on it.
 *
 * These are published because the assemblies — not the pixels — are what is
 * repeated, and because getting them wrong is expensive in ways that do not show
 * up in a screenshot: an unlabelled icon link, a "present" that never ends, a
 * date that shifts by a day across time zones, a filter bar whose facets drift
 * out of sync with the data.
 *
 * What is *not* here is as deliberate: no pricing table, no testimonial wall, no
 * FAQ. Those are compositions of `Card`, `Accordion` and `Button` with the
 * caller's own content, and publishing them would be publishing this Showcase's
 * copy rather than a contract. See `docs/EXPERIENCE_GUIDE.md` for those recipes.
 *
 * Every export is presentational and provider-free: no data fetching, no router,
 * no engine, and the same three-attribute theming (`data-palette`,
 * `data-typeface`, `data-personality`) as the rest of the library.
 */

export * from "./social-links";
export * from "./profile-hero";
export * from "./experience-timeline";
export * from "./project-showcase";
export * from "./publication-list";
export * from "./reading-shelf";
export * from "./now-section";
