"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import {
  createLocalStorageAdapter,
  readVersioned,
  writeVersioned,
  type KeyValueStorage,
} from "../utils/storage";

/**
 * A process-wide `localStorage` adapter, created on first use.
 *
 * Creating it is a small probe write, so it happens the first time a component
 * actually reads or writes — never during a server render, and never per
 * instance.
 */
let sharedStorage: KeyValueStorage | undefined | null = null;
function defaultStorage(): KeyValueStorage | undefined {
  if (sharedStorage === null) sharedStorage = createLocalStorageAdapter();
  return sharedStorage;
}

function readRaw(storage: KeyValueStorage | undefined, key: string): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

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
export function usePersistentState<T>(
  options: PersistentStateOptions<T>,
): [T, (next: T | ((previous: T) => T)) => void] {
  const { key, version, defaultValue, decode } = options;

  // An explicit adapter wins — including an explicit `undefined`, which turns
  // persistence off. Otherwise fall back to `localStorage` on the client.
  const hasExplicitStorage = "storage" in options;
  const explicitStorage = options.storage;
  const resolveStorage = useCallback(
    () => (hasExplicitStorage ? explicitStorage : defaultStorage()),
    [explicitStorage, hasExplicitStorage],
  );

  // `useSyncExternalStore` requires a snapshot that is referentially stable
  // between real changes, so the parsed value is cached against the raw string.
  const cache = useRef<{ raw: string | null; value: T | undefined }>({ raw: "", value: undefined });

  const getSnapshot = useCallback((): T | undefined => {
    const storage = resolveStorage();
    const raw = readRaw(storage, key);
    if (cache.current.raw === raw) return cache.current.value;
    const value = readVersioned(storage, key, version, decode);
    cache.current = { raw, value };
    return value;
  }, [decode, key, resolveStorage, version]);

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined") return () => {};
      const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === key) onChange();
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    },
    [key],
  );

  const getServerSnapshot = useCallback((): T | undefined => undefined, []);
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [override, setOverride] = useState<{ value: T } | null>(null);
  const value = override ? override.value : stored !== undefined ? stored : defaultValue;

  const setValue = useCallback(
    (next: T | ((previous: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (previous: T) => T)(value) : next;
      setOverride({ value: resolved });
      writeVersioned(resolveStorage(), key, version, resolved);
    },
    [key, resolveStorage, value, version],
  );

  return [value, setValue];
}
