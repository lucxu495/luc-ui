"use client";
import { createLocalStorageAdapter, readVersioned, writeVersioned } from "../utils/storage.js";
import { useCallback, useRef, useState, useSyncExternalStore } from "react";
//#region src/hooks/use-persistent-state.ts
/**
* A process-wide `localStorage` adapter, created on first use.
*
* Creating it is a small probe write, so it happens the first time a component
* actually reads or writes — never during a server render, and never per
* instance.
*/
let sharedStorage = null;
function defaultStorage() {
	if (sharedStorage === null) sharedStorage = createLocalStorageAdapter();
	return sharedStorage;
}
function readRaw(storage, key) {
	if (!storage) return null;
	try {
		return storage.getItem(key);
	} catch {
		return null;
	}
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
function usePersistentState(options) {
	const { key, version, defaultValue, decode } = options;
	const hasExplicitStorage = "storage" in options;
	const explicitStorage = options.storage;
	const resolveStorage = useCallback(() => hasExplicitStorage ? explicitStorage : defaultStorage(), [explicitStorage, hasExplicitStorage]);
	const cache = useRef({
		raw: "",
		value: void 0
	});
	const getSnapshot = useCallback(() => {
		const storage = resolveStorage();
		const raw = readRaw(storage, key);
		if (cache.current.raw === raw) return cache.current.value;
		const value = readVersioned(storage, key, version, decode);
		cache.current = {
			raw,
			value
		};
		return value;
	}, [
		decode,
		key,
		resolveStorage,
		version
	]);
	const subscribe = useCallback((onChange) => {
		if (typeof window === "undefined") return () => {};
		const onStorage = (event) => {
			if (event.key === null || event.key === key) onChange();
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, [key]);
	const getServerSnapshot = useCallback(() => void 0, []);
	const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
	const [override, setOverride] = useState(null);
	const value = override ? override.value : stored !== void 0 ? stored : defaultValue;
	return [value, useCallback((next) => {
		const resolved = typeof next === "function" ? next(value) : next;
		setOverride({ value: resolved });
		writeVersioned(resolveStorage(), key, version, resolved);
	}, [
		key,
		resolveStorage,
		value,
		version
	])];
}
//#endregion
export { usePersistentState };

//# sourceMappingURL=use-persistent-state.js.map