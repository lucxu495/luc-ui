//#region src/utils/storage.d.ts
/**
 * LUC storage.
 *
 * Personal presentation state — a collapsed sidebar, workspace pane sizes, an
 * inspector that was left open — belongs in local storage, not in the URL. But
 * it must never produce a hydration mismatch, never throw in a private-mode
 * browser with storage disabled, and never resurrect an old schema after a
 * layout change.
 *
 * So: a tiny adapter interface, a versioned envelope, and total failure modes.
 * Nothing here writes global storage on its own — a caller has to opt in by
 * passing a key.
 */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}
/** A storage backed by `localStorage`, or `undefined` when there is none. */
export declare function createLocalStorageAdapter(): KeyValueStorage | undefined;
/** An in-memory storage — deterministic stand-in for tests and SSR. */
export declare function createMemoryStorage(seed?: Record<string, string>): KeyValueStorage;
/**
 * Read a versioned value.
 *
 * A different version, unparseable JSON or a failed `decode` all read as
 * `undefined`, which the caller turns into its default. Changing a layout is a
 * version bump, not a migration script.
 */
export declare function readVersioned<T>(storage: KeyValueStorage | undefined, key: string, version: number, decode?: (raw: unknown) => T | undefined): T | undefined;
/** Write a versioned value. Failures (quota, disabled storage) are ignored. */
export declare function writeVersioned<T>(storage: KeyValueStorage | undefined, key: string, version: number, value: T, encode?: (value: T) => unknown): void;
//#endregion
//# sourceMappingURL=storage.d.ts.map