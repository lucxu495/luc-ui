/*
 * The documentation registry's types.
 *
 * Why a registry at all: Phase 8's Showcase was a page-per-topic gallery
 * (`/components/inputs` covered six inputs). Phase 9 needs a page per public
 * component, and there are hundreds of them. Writing that many pages by hand
 * guarantees they drift from the library, so identity lives here — one typed
 * record per documented thing — and the pages, the sidebar, the search index,
 * the breadcrumbs and the previous/next links are all *views* of it.
 *
 * The fields are deliberately the ones a reader and a test both need. Nothing
 * here is decorative.
 */

/** How complete a page is. The UI states this rather than implying more. */
export type DocStatus =
  /** A handwritten page with real, reviewed examples. */
  | "curated"
  /** Assembled from the registry: real import path, real API, honest preview. */
  | "generated"
  /** Part of the public API surface with no page of its own (helpers, parts). */
  | "reference";

/** The four top-level documentation surfaces. Also the sidebar's top level. */
export type DocGroup = "components" | "charts" | "motion" | "integrations";

export interface DocEntry {
  /** Canonical kebab-case id. Stable: links, tests and search refer to this. */
  id: string;
  /** Public display name, e.g. `LineChart`. Never translated. */
  title: string;
  /** Family id from `taxonomy.ts`. */
  family: string;
  /** Group id: which documentation surface this belongs to. */
  group: DocGroup;
  /** The import statement a reader writes, e.g. `@luc/ui/charts`. */
  importPath: string;
  /** The named exports this page documents, resolved against the real catalog. */
  exports: string[];
  /** One sentence: what it is for, not what it looks like. */
  summary: string;
  /**
   * A chart's own display name, e.g. `Line`.
   *
   * The generated chart lead is one sentence with this noun in it, so a
   * localized page composes the sentence from a single translated template and
   * this name — which the dictionary already holds — instead of needing one
   * dictionary entry per chart.
   */
  chartName?: string;
  /** The rendering engine's display name, for the same lead sentence. */
  chartEngine?: string;
  /** Route, always absolute and without a locale prefix. */
  route: string;
  status: DocStatus;
  /** Playground adapter id (`components/playground/adapters`). */
  playground?: string;
  /** Related ids. Validated to resolve. */
  related?: string[];
  /** Where the page lives on disk, when it is a real file rather than generated. */
  pageFile?: string;
}

/** A real named export from the library, as the generated catalog records it. */
export interface CatalogExport {
  name: string;
  kind: "value" | "type";
  /** The TypeScript signature the catalog extracted. */
  signature: string;
  /** Declaring file, relative to `packages/ui`. */
  source: string;
}

/** A subpath entry of `@luc/ui`, with its handwritten catalog annotations. */
export interface CatalogEntry {
  import: string;
  source: string;
  status: string;
  recommended: boolean;
  category?: string;
  use?: string;
  avoid?: string;
  a11y?: string;
  showcase?: string;
  exports: CatalogExport[];
}

export interface DocFamily {
  id: string;
  title: string;
  /** Shown on the family index and in the sidebar's collapsed state. */
  summary: string;
  group: DocGroup;
  /**
   * A page that already introduces the whole family, when one exists.
   *
   * The Showcase documented charts by topic before it documented them one by
   * one; those pages are the family's front door and keep their URLs.
   */
  landing: string | null;
  /** Ids, in reading order. The registry resolves them. */
  entries: string[];
}

export interface DocGroupMeta {
  id: DocGroup;
  title: string;
  route: string;
  /** One sentence for the group index page. */
  summary: string;
}
