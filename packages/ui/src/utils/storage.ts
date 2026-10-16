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
export function createLocalStorageAdapter(): KeyValueStorage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    // Safari in private mode exposes `localStorage` and throws on write.
    const probe = "__luc_storage_probe__";
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
  } catch {
    return undefined;
  }
  return {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
    removeItem: (key) => window.localStorage.removeItem(key),
  };
}

/** An in-memory storage — deterministic stand-in for tests and SSR. */
export function createMemoryStorage(seed: Record<string, string> = {}): KeyValueStorage {
  const map = new Map<string, string>(Object.entries(seed));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

interface Envelope {
  v: number;
  value: unknown;
}

/**
 * Read a versioned value.
 *
 * A different version, unparseable JSON or a failed `decode` all read as
 * `undefined`, which the caller turns into its default. Changing a layout is a
 * version bump, not a migration script.
 */
export function readVersioned<T>(
  storage: KeyValueStorage | undefined,
  key: string,
  version: number,
  decode?: (raw: unknown) => T | undefined,
): T | undefined {
  if (!storage) return undefined;
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return undefined;
  }
  if (!raw) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (!parsed || typeof parsed !== "object") return undefined;
  const envelope = parsed as Envelope;
  if (envelope.v !== version) return undefined;
  const value = envelope.value;
  if (!decode) return value as T;
  try {
    return decode(value);
  } catch {
    return undefined;
  }
}

/** Write a versioned value. Failures (quota, disabled storage) are ignored. */
export function writeVersioned<T>(
  storage: KeyValueStorage | undefined,
  key: string,
  version: number,
  value: T,
  encode?: (value: T) => unknown,
): void {
  if (!storage) return;
  try {
    const envelope: Envelope = { v: version, value: encode ? encode(value) : value };
    storage.setItem(key, JSON.stringify(envelope));
  } catch {
    /* storage is a nicety, never a requirement */
  }
}
