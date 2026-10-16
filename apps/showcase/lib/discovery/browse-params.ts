/*
 * The browse view's shareable state, as typed parameter specs.
 *
 * Same mechanism as every other URL-backed view in the Showcase (`params` +
 * `param` from `@luc/ui/url-state`), and deliberately in its own module so a unit
 * test can assert the defaults and the encoding without a browser: a filter that
 * cannot be shared is a filter a reader will email as a screenshot instead.
 *
 * `all` rather than an empty string for `kind` and `use`, because "no filter" is
 * a real choice a reader can make and should survive a round trip through the
 * address bar.
 */

import { enumParam, param, params, stringParam } from "@luc/ui";
import { ART_DIRECTIONS, DISCOVERY_KINDS, USE_CASES } from "./taxonomy";

export const BROWSE_KINDS = ["all", ...DISCOVERY_KINDS.map((kind) => kind.id)] as const;
export const BROWSE_USE_CASES = ["all", ...USE_CASES.map((useCase) => useCase.id)] as const;
export const BROWSE_ART_DIRECTIONS = [
  "all",
  ...ART_DIRECTIONS.map((direction) => direction.id),
] as const;

export const browseParams = params({
  q: param(stringParam({ maxLength: 48 }), ""),
  kind: param(enumParam(BROWSE_KINDS), "all"),
  use: param(enumParam(BROWSE_USE_CASES), "all"),
  art: param(enumParam(BROWSE_ART_DIRECTIONS), "all"),
});

export type BrowseKind = (typeof BROWSE_KINDS)[number];
export type BrowseUseCase = (typeof BROWSE_USE_CASES)[number];
export type BrowseArtDirection = (typeof BROWSE_ART_DIRECTIONS)[number];

export interface BrowseState {
  q: string;
  kind: BrowseKind;
  use: BrowseUseCase;
  art: BrowseArtDirection;
}

export const DEFAULT_BROWSE_STATE: BrowseState = {
  q: browseParams.q.default,
  kind: browseParams.kind.default,
  use: browseParams.use.default,
  art: browseParams.art.default,
};

/** True when the reader has narrowed anything — used to offer "clear". */
export function isFiltered(state: BrowseState): boolean {
  return (
    state.q.trim().length > 0 ||
    state.kind !== DEFAULT_BROWSE_STATE.kind ||
    state.use !== DEFAULT_BROWSE_STATE.use ||
    state.art !== DEFAULT_BROWSE_STATE.art
  );
}
