import { KeyValueStorage } from "../utils/storage.js";
//#region src/hooks/use-persistent-state.d.ts
export interface PersistentStateOptions<T> {
  /** Storage key. Scoped per concern, e.g. `luc-ui:showcase:sidebar`. */
  key: string;
  /** Bump to invalidate a stored shape. There is no migration step. */
  version: number;
  defaultValue: T;
  /**
   * Storage to use. `undefined` disables persistence. When omitted, a local
   * storage adapter is created on the client and `undefined` is used on the
   * server, so a server render never touches `window`.
   */
  storage?: KeyValueStorage | undefined;
  /** Validate/narrow a stored value. Return `undefined` to discard it. */
  decode?: (raw: unknown) => T | undefined;
}
/**
 * State that survives a reload without breaking hydration.
 *
 * The server and the first client render both use `defaultValue`; the stored
 * value arrives through `useSyncExternalStore`, which React hydrates against
 * the server snapshot on purpose. That is the same trick `useMediaQuery` uses:
 * no setState-in-effect cascade, no hydration mismatch, and a cross-tab
 * `storage` event keeps other windows in step.
 *
 * Writes go through a local override first, so the component updates on the
 * same tick as the click rather than waiting for a storage round trip.
 */
export declare function usePersistentState<T>(options: PersistentStateOptions<T>): [T, (next: T | ((previous: T) => T)) => void];
//#endregion
//# sourceMappingURL=use-persistent-state.d.ts.map