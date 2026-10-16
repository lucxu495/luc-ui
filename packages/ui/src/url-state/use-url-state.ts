"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  createBrowserUrlStateAdapter,
  type UrlStateAdapter,
  type UrlStateSetOptions,
} from "./adapter";
import { decodeParams, patchParams, searchToString, type ParamSpecMap, type ParamState } from "./params";

export interface UseUrlStateOptions {
  /** Swap in a framework adapter, or a fake in a test. */
  adapter?: UrlStateAdapter;
  /** History policy for writes. Default `replace`. */
  history?: "push" | "replace";
  /** Server render + first client render both read this. */
  initialSearch?: string;
}

export type UrlStateSetter<M extends ParamSpecMap> = (
  patch: Partial<ParamState<M>>,
  options?: UrlStateSetOptions,
) => void;

/**
 * Bind one parameter set to the address bar, with no framework in the loop.
 *
 * Reading goes through `useSyncExternalStore`, so Back and Forward are picked up
 * without a re-render loop, and the server snapshot is the `initialSearch` the
 * caller passed — there is no address bar on a server, so there must be no
 * address-bar-derived markup in the first HTML either.
 */
export function useUrlState<M extends ParamSpecMap>(
  specs: M,
  options: UseUrlStateOptions = {},
): [ParamState<M>, UrlStateSetter<M>] {
  const { history = "replace", initialSearch = "" } = options;
  const adapter = useMemo(
    () => options.adapter ?? createBrowserUrlStateAdapter({ initialSearch }),
    // The adapter is intentionally stable for the life of the component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const subscribe = useCallback((onChange: () => void) => adapter.subscribe(onChange), [adapter]);
  const getSnapshot = useCallback(() => adapter.getSearch(), [adapter]);
  const getServerSnapshot = useCallback(() => initialSearch, [initialSearch]);

  const search = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const state = useMemo(() => decodeParams(search, specs), [search, specs]);

  const setState = useCallback<UrlStateSetter<M>>(
    (patch, setOptions) => {
      const next = patchParams(adapter.getSearch(), specs, patch);
      adapter.setSearch(searchToString(next), {
        replace: setOptions?.replace ?? history === "replace",
      });
    },
    [adapter, history, specs],
  );

  return [state, setState];
}
