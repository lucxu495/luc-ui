/*
 * The discovery layer's types.
 *
 * Why this exists next to `lib/docs/types.ts`, rather than inside it: the
 * documentation registry answers "what is this component" (id, exports, props,
 * route). Discovery answers a different question — *when would I reach for it* —
 * and that question has three axes the registry has no opinion about:
 *
 *   use case        research, finance, résumé, editorial, …
 *   art direction   which of the six visual languages it belongs to
 *   kind            component, chart, motion, block, studio, experience, visual, …
 *
 * Keeping them apart matters because they have different sources of truth. The
 * registry is *generated* from the package exports and cannot be wrong about
 * them; discovery is *curated* by a person and can be wrong, so the generator
 * validates every curated id against the registry and fails on a typo rather
 * than shipping a category with nothing in it.
 */

/** What a catalog row is. A reader filters on this; nothing else depends on it. */
export type DiscoveryKind =
  /** A public React component or composite. */
  | "component"
  /** A public chart — a separate kind because charting is a separate discipline. */
  | "chart"
  /** A motion or spatial component. */
  | "motion"
  /** A page section assembled from components (Blocks). */
  | "block"
  /** A whole page or product starter (Templates, Experiences). */
  | "experience"
  /** A configuration workspace (Chart / Motion / Theme / Template Studio). */
  | "studio"
  /** A composition recipe that solves a whole problem. */
  | "pattern"
  /** Documentation: a guide, a foundation essay, an installation page. */
  | "doc";

/** How much a reader should trust the row. */
export type DiscoveryStatus =
  /** A public component with a real page. */
  | "public"
  /** A design study. Not an API, not installed, and it says so. */
  | "study";

/** One use case. `code` is the compact form the generated projection carries. */
export interface UseCase {
  id: string;
  code: string;
  label: string;
  description: string;
}

/**
 * One of the six art directions.
 *
 * The four `knobs` are the point: an art direction in Luc UI is a *combination
 * of the token layer's own attributes* plus a composition discipline — never a
 * new palette. Setting them on a subtree is the documented mechanism
 * (`tokens.css`), so a study can pin a direction without changing the page.
 */
export interface ArtDirection {
  id: string;
  code: string;
  label: string;
  /** The premise, in one sentence. */
  premise: string;
  /** What it is for — the contexts where a product would choose it. */
  usage: string;
  knobs: {
    palette: string;
    typeface: string;
    personality: string;
    space: string;
  };
  /** The three compositional decisions that make it different from the others. */
  type: string;
  geometry: string;
  contrast: string;
}

/** One Visuals category. Four of the six have no public element yet, and say so. */
/**
 * A resolved discovery row: what the UI reads.
 *
 * `summary` is present only in the server-side view. The client projection
 * (`lib/docs/generated/discovery`) omits it: a documentation site already ships
 * one sentence per entry on the page it belongs to, and repeating 223 of them
 * in the search bundle costs more than the search gains.
 */
export interface DiscoveryEntry {
  id: string;
  title: string;
  route: string;
  kind: DiscoveryKind;
  /** Nav area id from `lib/discovery/areas.ts`. */
  area: string;
  family?: string;
  status: DiscoveryStatus;
  aliases: readonly string[];
  tags: readonly string[];
  useCases: readonly string[];
  artDirections: readonly string[];
  featured?: boolean;
}

/**
 * The generated projection: the same row, with short keys and joined lists.
 *
 * Every page of the Showcase loads this (the header search, the Explore filters
 * and the galleries all read it), so the field names cost real bytes: `aliases`
 * joined with `|` and `u`/`d` as two-letter codes rather than the ids. The
 * decoder in `lib/discovery/catalog.ts` is the only place that has to know.
 *
 * `p` is "picked": the entry is featured on `/explore`. It is `1` rather than
 * `true` because it is absent for almost every row.
 */
export interface DiscoveryRow {
  /** id */
  i: string;
  /** title */
  t: string;
  /** route */
  r: string;
  /** kind */
  k: DiscoveryKind;
  /** area id */
  a: string;
  /** family id, when the row comes from the documentation registry */
  f?: string;
  /** status */
  s: DiscoveryStatus;
  /** aliases, `|`-joined */
  x?: string;
  /** use-case codes, `,`-joined */
  u?: string;
  /** art-direction codes, `,`-joined */
  d?: string;
  /** tags, `|`-joined */
  g?: string;
  /** featured */
  p?: 1;
}
