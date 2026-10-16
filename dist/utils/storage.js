//#region src/utils/storage.ts
/** A storage backed by `localStorage`, or `undefined` when there is none. */
function createLocalStorageAdapter() {
	if (typeof window === "undefined") return void 0;
	try {
		const probe = "__luc_storage_probe__";
		window.localStorage.setItem(probe, probe);
		window.localStorage.removeItem(probe);
	} catch {
		return;
	}
	return {
		getItem: (key) => window.localStorage.getItem(key),
		setItem: (key, value) => window.localStorage.setItem(key, value),
		removeItem: (key) => window.localStorage.removeItem(key)
	};
}
/** An in-memory storage — deterministic stand-in for tests and SSR. */
function createMemoryStorage(seed = {}) {
	const map = new Map(Object.entries(seed));
	return {
		getItem: (key) => map.get(key) ?? null,
		setItem: (key, value) => {
			map.set(key, value);
		},
		removeItem: (key) => {
			map.delete(key);
		}
	};
}
/**
* Read a versioned value.
*
* A different version, unparseable JSON or a failed `decode` all read as
* `undefined`, which the caller turns into its default. Changing a layout is a
* version bump, not a migration script.
*/
function readVersioned(storage, key, version, decode) {
	if (!storage) return void 0;
	let raw;
	try {
		raw = storage.getItem(key);
	} catch {
		return;
	}
	if (!raw) return void 0;
	let parsed;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return;
	}
	if (!parsed || typeof parsed !== "object") return void 0;
	const envelope = parsed;
	if (envelope.v !== version) return void 0;
	const value = envelope.value;
	if (!decode) return value;
	try {
		return decode(value);
	} catch {
		return;
	}
}
/** Write a versioned value. Failures (quota, disabled storage) are ignored. */
function writeVersioned(storage, key, version, value, encode) {
	if (!storage) return;
	try {
		const envelope = {
			v: version,
			value: encode ? encode(value) : value
		};
		storage.setItem(key, JSON.stringify(envelope));
	} catch {}
}
//#endregion
export { createLocalStorageAdapter, createMemoryStorage, readVersioned, writeVersioned };

//# sourceMappingURL=storage.js.map