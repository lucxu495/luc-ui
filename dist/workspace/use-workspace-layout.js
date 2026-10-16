"use client";
import { useIsomorphicLayoutEffect } from "../hooks/use-isomorphic-layout-effect.js";
import { usePersistentState } from "../hooks/use-persistent-state.js";
import { structuralEquals } from "../url-state/codecs.js";
import { useCallback, useRef, useState } from "react";
import { useGroupRef } from "react-resizable-panels";
//#region src/workspace/use-workspace-layout.ts
function validateLayout(panelIds) {
	return (raw) => {
		if (!raw || typeof raw !== "object" || Array.isArray(raw)) return void 0;
		const entries = Object.entries(raw);
		if (entries.length !== panelIds.length) return void 0;
		const layout = {};
		for (const [key, value] of entries) {
			if (!panelIds.includes(key) || typeof value !== "number" || !Number.isFinite(value)) return void 0;
			layout[key] = value;
		}
		return layout;
	};
}
function useWorkspaceLayout({ id, panelIds, version = 1, storage, defaultLayout, persist = true }) {
	const [stored, setStored] = usePersistentState({
		key: `luc-ui:workspace:${id}:${panelIds.join("+") || "none"}`,
		version,
		defaultValue: void 0,
		storage: persist ? storage : void 0,
		decode: validateLayout(panelIds)
	});
	const groupRef = useGroupRef();
	const appliedRef = useRef(false);
	const [restored, setRestored] = useState(false);
	const [epoch, setEpoch] = useState(0);
	useIsomorphicLayoutEffect(() => {
		if (appliedRef.current || !stored) return;
		const group = groupRef.current;
		if (!group) return;
		appliedRef.current = true;
		group.setLayout(stored);
		setRestored(true);
	}, [groupRef, stored]);
	const onLayoutChanged = useCallback((layout) => {
		if (!persist) return;
		setStored((previous) => structuralEquals(previous, layout) ? previous : layout);
	}, [persist, setStored]);
	const resetLayout = useCallback(() => {
		appliedRef.current = false;
		setRestored(false);
		setStored(void 0);
		setEpoch((value) => value + 1);
	}, [setStored]);
	return {
		groupRef,
		defaultLayout: stored ?? defaultLayout,
		onLayoutChanged,
		epoch,
		resetLayout,
		restored
	};
}
//#endregion
export { useWorkspaceLayout };

//# sourceMappingURL=use-workspace-layout.js.map