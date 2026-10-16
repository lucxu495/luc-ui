/**
 * LUC URL state — router-agnostic.
 *
 * The package owns the *vocabulary* of a shareable view (codecs + parameter
 * sets) and a small history-API hook, and nothing else. A framework adapter
 * (Next/nuqs in the Showcase) replaces the hook; the codecs stay the same.
 */

export {
  booleanParam,
  currencyParam,
  dateOnlyParam,
  enumParam,
  instantParam,
  listParam,
  nullableParam,
  numberParam,
  sortListParam,
  sortParam,
  stringParam,
  structuralEquals,
  type ListParamOptions,
  type NumberParamOptions,
  type ParamCodec,
  type SortValue,
  type StringParamOptions,
} from "./codecs";

export {
  decodeParams,
  defaultState,
  encodeParams,
  mergeParams,
  param,
  params,
  patchParams,
  searchToString,
  type ParamSpec,
  type ParamSpecMap,
  type ParamState,
} from "./params";

export {
  createBrowserUrlStateAdapter,
  type BrowserUrlStateAdapterOptions,
  type UrlStateAdapter,
  type UrlStateSetOptions,
} from "./adapter";

export { useUrlState, type UrlStateSetter, type UseUrlStateOptions } from "./use-url-state";
