import { ParamSpecMap, ParamState } from "./params.js";
import { UrlStateAdapter, UrlStateSetOptions } from "./adapter.js";
//#region src/url-state/use-url-state.d.ts
export interface UseUrlStateOptions {
  /** Swap in a framework adapter, or a fake in a test. */
  adapter?: UrlStateAdapter;
  /** History policy for writes. Default `replace`. */
  history?: "push" | "replace";
  /** Server render + first client render both read this. */
  initialSearch?: string;
}
export type UrlStateSetter<M extends ParamSpecMap> = (patch: Partial<ParamState<M>>, options?: UrlStateSetOptions) => void;
/**
 * Bind one parameter set to the address bar, with no framework in the loop.
 *
 * Reading goes through `useSyncExternalStore`, so Back and Forward are picked up
 * without a re-render loop, and the server snapshot is the `initialSearch` the
 * caller passed — there is no address bar on a server, so there must be no
 * address-bar-derived markup in the first HTML either.
 */
export declare function useUrlState<M extends ParamSpecMap>(specs: M, options?: UseUrlStateOptions): [ParamState<M>, UrlStateSetter<M>];
//#endregion
//# sourceMappingURL=use-url-state.d.ts.map