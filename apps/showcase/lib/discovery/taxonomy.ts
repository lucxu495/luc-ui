/*
 * The two vocabularies discovery is written in.
 *
 * One table per axis, each entry carrying the label a reader sees and the one
 * sentence that explains it. Everything else — the browse filters, the
 * art-direction filter rows, the header panels — is a view of these tables, so a
 * category cannot exist in the navigation and be missing from the filter, or the
 * other way round. (The third vocabulary, the six Phase 10A Visuals categories,
 * was retired with the study pages it described.)
 *
 * The `code` fields are the compact form used by the generated client
 * projection. Two characters rather than the id, because the projection is
 * downloaded by every page and the ids are long.
 *
 * Dependency-free on purpose: `scripts/docs-registry.mjs` transpiles this file
 * on its own (type-only imports only), which is what lets the generator and the
 * browser share one definition instead of two.
 */

import type { ArtDirection, DiscoveryKind, UseCase } from "./types";

/* -------------------------------------------------------------------------- */
/* Use cases                                                                   */
/* -------------------------------------------------------------------------- */

export const USE_CASES = [
  {
    id: "research",
    code: "re",
    label: "Research and science",
    description:
      "Evidence first: figures with units, prepared data, and tables a reviewer can check.",
  },
  {
    id: "finance",
    code: "fi",
    label: "Finance and analytics",
    description:
      "Risk, performance and market data — with the units and the direction of every axis stated.",
  },
  {
    id: "business",
    code: "bu",
    label: "Business software",
    description:
      "The interior of a real product: shells, tables, filters, settings and notifications.",
  },
  {
    id: "personal",
    code: "pe",
    label: "Résumé and personal sites",
    description:
      "One person's work, told properly: a hero, a timeline, projects, publications and a way to write.",
  },
  {
    id: "editorial",
    code: "ed",
    label: "Editorial and publishing",
    description:
      "Reading layouts where typography carries the argument and a chart is evidence.",
  },
  {
    id: "marketing",
    code: "mk",
    label: "Marketing and social",
    description:
      "Pages that have to convince in one screen: pricing, proof, and a form that validates.",
  },
  {
    id: "education",
    code: "le",
    label: "Education and learning",
    description:
      "Teaching surfaces: lesson structure, progress, quizzes and a reading shelf.",
  },
  {
    id: "portfolio",
    code: "pf",
    label: "Portfolio and creative work",
    description:
      "Work shown at scale: galleries, comparison, captions and case-study narrative.",
  },
] as const satisfies readonly UseCase[];

export type UseCaseId = (typeof USE_CASES)[number]["id"];

/* -------------------------------------------------------------------------- */
/* Art directions                                                              */
/* -------------------------------------------------------------------------- */

/*
 * Six directions, each with a genuinely different combination of the token
 * layer's four attributes *and* a different composition discipline. Read down
 * the `knobs` column: no two rows share all four values, and the type /
 * geometry / contrast columns are what stop this from being a colour picker.
 */
export const ART_DIRECTIONS = [
  {
    id: "editorial-modern",
    code: "em",
    label: "Editorial Modern",
    premise: "A grid you can see, and type that states its case without shouting.",
    usage: "Research writing, documentation essays, long-form product narrative.",
    knobs: { palette: "graphite", typeface: "inter", personality: "instrument", space: "flat" },
    type:
      "Flush-left display at a tight track, a measured deck, and a mono line for authorship and date.",
    geometry: "A visible twelve-column field, one hairline column rule, square corners, no elevation.",
    contrast: "Paper-flat — text on canvas, the accent used once as a registration mark.",
  },
  {
    id: "refined-luxury",
    code: "rl",
    label: "Refined Luxury",
    premise: "One object, given room, with every margin decided on purpose.",
    usage: "A premium catalogue, a system launch page, an invitation.",
    knobs: { palette: "cyan", typeface: "editorial", personality: "editorial", space: "layered" },
    type:
      "A serif display set large and light, generous leading, a letterspaced caption in the margin.",
    geometry: "A wide margin, a single hairline frame around the specimen, and one measured detail.",
    contrast: "Low chroma — two text tones, no status colour, ornament limited to one rule.",
  },
  {
    id: "bold-experimental",
    code: "bx",
    label: "Bold Experimental",
    premise: "Break the rule you just made legible, and break only that one.",
    usage: "A manifesto, a campaign, an experimental feature banner.",
    knobs: { palette: "violet", typeface: "technical", personality: "expressive", space: "deep" },
    type:
      "Display type that overflows its own grid line, one rotated word, and an inverted block carrying the loudest sentence.",
    geometry: "Deliberate misalignment, overlapping planes, a rule that crosses itself.",
    contrast: "Maximum — an accent-filled panel beside the canvas, and nothing in between.",
  },
  {
    id: "scientific-precision",
    code: "sp",
    label: "Scientific Precision",
    premise: "The figure is the argument; everything around it is apparatus.",
    usage: "Papers, lab notebooks, method pages, instrument and clinical dashboards.",
    knobs: { palette: "cobalt", typeface: "technical", personality: "dense", space: "flat" },
    type:
      "Eleven to thirteen pixels of mono metadata, tabular numerals, and the unit inside the title.",
    geometry: "A real plot: axes, ticks, units, error bars, a caption, and measurement brackets.",
    contrast: "Information first — the accent is a data ink, never a highlight.",
  },
  {
    id: "organic-contemporary",
    code: "oc",
    label: "Organic Contemporary",
    premise: "Soft planes, warm ink, and a caption that credits the thing you are looking at.",
    usage: "Brand storytelling, health and sustainability products, editorial features.",
    knobs: { palette: "emerald", typeface: "inter", personality: "editorial", space: "layered" },
    type:
      "A warm sans with loose leading, one short sentence set large, and captions that read like credits.",
    geometry: "Original SVG fields — arcs and rounded planes — inside an aspect-ratio frame.",
    contrast:
      "Tonal: three steps of one hue derived with color-mix from tokens, so it survives both themes.",
  },
  {
    id: "digital-futurism",
    code: "df",
    label: "Digital Futurism",
    premise: "Structured light, measured in the mono face, with nothing decorative.",
    usage: "Real-time systems, AI surfaces, monitoring, developer tooling.",
    knobs: { palette: "cyan", typeface: "technical", personality: "instrument", space: "deep" },
    type:
      "Mono for every measurement, one wide-tracked display line, and live-ness stated rather than implied.",
    geometry: "A concentric lattice, glow taken from the glow tokens, one scanline that stops under reduced motion.",
    contrast: "Dark first — accent glow against the canvas, with disciplined highlights.",
  },
] as const satisfies readonly ArtDirection[];

export type ArtDirectionId = (typeof ART_DIRECTIONS)[number]["id"];

/* -------------------------------------------------------------------------- */
/* Kinds                                                                       */
/* -------------------------------------------------------------------------- */

/** A kind as the UI shows it. Order is the order the browse page lists them in. */
export const DISCOVERY_KINDS = [
  { id: "component", label: "Components", plural: "components" },
  { id: "chart", label: "Charts", plural: "charts" },
  { id: "motion", label: "Motion", plural: "motion components" },
  { id: "block", label: "Blocks", plural: "blocks" },
  { id: "experience", label: "Templates and experiences", plural: "templates and experiences" },
  { id: "studio", label: "Studios", plural: "studios" },
  { id: "pattern", label: "Patterns", plural: "patterns" },
  { id: "doc", label: "Documentation", plural: "guides" },
] as const satisfies readonly { id: DiscoveryKind; label: string; plural: string }[];

/* --------------------------------- lookups -------------------------------- */

export const useCaseById: ReadonlyMap<string, UseCase> = new Map(
  USE_CASES.map((entry) => [entry.id as string, entry]),
);
export const artDirectionById: ReadonlyMap<string, ArtDirection> = new Map(
  ART_DIRECTIONS.map((entry) => [entry.id as string, entry]),
);
export const kindById: ReadonlyMap<string, { id: DiscoveryKind; label: string; plural: string }> =
  new Map(DISCOVERY_KINDS.map((entry) => [entry.id as string, entry]));

/** The code ↔ id tables the generated projection is encoded against. */
export const USE_CASE_CODES: Record<string, string> = Object.fromEntries(
  USE_CASES.map((entry) => [entry.code, entry.id]),
);
export const ART_DIRECTION_CODES: Record<string, string> = Object.fromEntries(
  ART_DIRECTIONS.map((entry) => [entry.code, entry.id]),
);

export function artDirectionLabel(id: string): string {
  return artDirectionById.get(id)?.label ?? id;
}
