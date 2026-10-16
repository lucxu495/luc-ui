/*
 * The shape of the generated API facts.
 *
 * These types are the contract between `scripts/docs-registry.mjs` and the
 * documentation pages. The generator asserts its output against them with
 * `satisfies`, so a change here that the generator does not satisfy is a
 * typecheck failure rather than a runtime surprise on a published page.
 */

export interface ApiProp {
  name: string;
  optional: boolean;
  /** The compiler's text for the type. Clipped; the declaration has the rest. */
  type?: string;
  /** From a `@default` JSDoc tag on the declaration, when the library states one. */
  default?: string;
  description?: string;
  /** Declared outside `packages/ui/src` — inherited from a primitive's props. */
  inherited?: boolean;
}

export interface ApiSymbol {
  name: string;
  kind: "value" | "type";
  /** The compiler's signature. Clipped to keep a page readable. */
  signature: string;
  /** The props type's name, e.g. `ButtonProps`, when the symbol takes props. */
  propsType?: string;
  /** The props the compiler sees, minus the DOM's own attributes. */
  props?: readonly ApiProp[];
}

/** The client-safe projection of a registry row. Keys are short on purpose. */
export interface NavRow {
  id: string;
  t: string;
  r: string;
  f: string;
  g: string;
  /** Coverage status: `reference` rows have no page of their own. */
  s: "curated" | "generated" | "reference";
}

/**
 * A documentation entry, projected for the Playground.
 *
 * The fields the panel and the AI prompt read, and nothing else — the point is
 * that a *client* page can mount a Playground without importing the API tables.
 * See `generated/playgrounds.ts`.
 */
export interface PlaygroundRow {
  id: string;
  title: string;
  route: string;
  importPath: string;
  summary: string;
  exports: readonly string[];
  /** The adapter id, resolved by the Playground's registries. */
  playground: string;
}
