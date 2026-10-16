"use client";
import { useControllableState } from "../../hooks/use-controllable-state.js";
import { cn } from "../../utils/cn.js";
import { IconButton } from "../../components/icon-button.js";
import { createChartSyncBus } from "./sync.js";
import { ChartSyncProvider, useChartSyncBus } from "./sync-context.js";
import { useChartId } from "./use-chart-theme.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { RiPushpinFill, RiPushpinLine } from "@remixicon/react";
//#region src/charts/core/inspection.tsx
function useChartInspection({ groupId, pinned: pinnedProp, defaultPinned = null, onPinnedChange }) {
	const bus = useChartSyncBus();
	const id = useChartId("inspection");
	const [pinned, setPinned] = useControllableState({
		value: pinnedProp,
		defaultValue: defaultPinned,
		onChange: onPinnedChange
	});
	const [hover, setHover] = useState(null);
	const pinnedRef = useRef(pinned);
	useEffect(() => {
		pinnedRef.current = pinned;
	}, [pinned]);
	useEffect(() => {
		bus.publishPinned(groupId, pinned, id);
	}, [
		bus,
		groupId,
		id,
		pinned
	]);
	useEffect(() => {
		return bus.subscribe(groupId, {
			id,
			onCursor: (value) => {
				if (pinnedRef.current !== null) return;
				setHover(value);
			}
		});
	}, [
		bus,
		groupId,
		id
	]);
	const pin = useCallback((x) => {
		const target = x === void 0 ? hover : x;
		if (target === null) return;
		setPinned(target);
	}, [hover, setPinned]);
	const unpin = useCallback(() => setPinned(null), [setPinned]);
	const toggle = useCallback(() => {
		if (pinned !== null) setPinned(null);
		else pin();
	}, [
		pin,
		pinned,
		setPinned
	]);
	return useMemo(() => ({
		groupId,
		pinned,
		hover,
		pin,
		unpin,
		toggle,
		canPin: pinned === null && hover !== null
	}), [
		groupId,
		hover,
		pin,
		pinned,
		toggle,
		unpin
	]);
}
const ChartInspectionContext = createContext(null);
function ChartInspectionProvider({ children, isolated = false, ...options }) {
	if (isolated) return /* @__PURE__ */ jsx(IsolatedInspectionProvider, {
		options,
		children
	});
	return /* @__PURE__ */ jsx(InspectionContext, {
		options,
		children
	});
}
function InspectionContext({ options, children }) {
	const value = useChartInspection(options);
	return /* @__PURE__ */ jsx(ChartInspectionContext.Provider, {
		value,
		children
	});
}
function IsolatedInspectionProvider({ options, children }) {
	const bus = useMemo(() => createChartSyncBus(), []);
	return /* @__PURE__ */ jsx(ChartSyncProvider, {
		bus,
		children: /* @__PURE__ */ jsx(InspectionContext, {
			options,
			children
		})
	});
}
function useChartInspectionContext() {
	return useContext(ChartInspectionContext);
}
/**
* The pin control. It reads the inspection from context, so a chart header does
* not have to thread state through.
*/
function ChartPinButton({ className, pinLabel = "Pin inspection", unpinLabel = "Unpin inspection" }) {
	const inspection = useChartInspectionContext();
	if (!inspection) return null;
	const pinned = inspection.pinned !== null;
	return /* @__PURE__ */ jsx(IconButton, {
		label: pinned ? unpinLabel : pinLabel,
		size: "sm",
		variant: pinned ? "accent" : "ghost",
		"aria-pressed": pinned,
		disabled: !pinned && !inspection.canPin,
		className: cn(className),
		icon: pinned ? /* @__PURE__ */ jsx(RiPushpinFill, {}) : /* @__PURE__ */ jsx(RiPushpinLine, {}),
		onClick: () => inspection.toggle()
	});
}
/** Shows whether an inspection is pinned, as text, for a status bar. */
function ChartPinStatus({ format, className }) {
	const inspection = useChartInspectionContext();
	if (!inspection) return null;
	const value = inspection.pinned ?? inspection.hover;
	if (value === null) return null;
	return /* @__PURE__ */ jsxs("span", {
		"data-slot": "chart-pin-status",
		"data-pinned": inspection.pinned !== null ? "true" : void 0,
		className: cn("luc-numeric inline-flex items-center gap-1.5 text-caption", className),
		children: [inspection.pinned !== null ? /* @__PURE__ */ jsx(RiPushpinFill, {
			"aria-hidden": "true",
			className: "size-3 text-fg-accent"
		}) : null, format(value)]
	});
}
/** Index of the value closest to `x`, or -1 for an empty domain. */
function nearestIndex(xValues, x) {
	const first = xValues[0];
	if (first === void 0) return -1;
	let best = 0;
	let bestDistance = Math.abs(first - x);
	for (let index = 1; index < xValues.length; index += 1) {
		const value = xValues[index];
		if (value === void 0) continue;
		const distance = Math.abs(value - x);
		if (distance < bestDistance) {
			best = index;
			bestDistance = distance;
		}
	}
	return best;
}
function ChartInspectionArea({ xValues, label = "Chart plot. Use the arrow keys to inspect a point, Enter to pin it, Escape to clear the pin.", format, className, children, ...props }) {
	const inspection = useChartInspectionContext();
	const lastIndex = xValues.length - 1;
	const startIndex = () => {
		const anchor = inspection?.pinned ?? inspection?.hover;
		if (typeof anchor === "number") return Math.max(0, nearestIndex(xValues, anchor));
		return Math.max(0, lastIndex);
	};
	const moveTo = (next) => {
		return xValues[Math.min(Math.max(next, 0), Math.max(0, lastIndex))] ?? xValues[0] ?? 0;
	};
	const handleKeyDown = (event) => {
		if (!inspection || xValues.length === 0) return;
		const current = startIndex();
		switch (event.key) {
			case "ArrowRight":
			case "ArrowUp":
				event.preventDefault();
				inspection.pin(moveTo(current + 1));
				break;
			case "ArrowLeft":
			case "ArrowDown":
				event.preventDefault();
				inspection.pin(moveTo(current - 1));
				break;
			case "Home":
				event.preventDefault();
				inspection.pin(moveTo(0));
				break;
			case "End":
				event.preventDefault();
				inspection.pin(moveTo(lastIndex));
				break;
			case "Enter":
			case " ":
				event.preventDefault();
				if (inspection.pinned !== null) inspection.unpin();
				else inspection.pin(xValues[current]);
				break;
			case "Escape":
				if (inspection.pinned === null) return;
				event.preventDefault();
				inspection.unpin();
		}
	};
	if (!inspection) return /* @__PURE__ */ jsx("div", {
		"data-slot": "chart-inspection-area",
		className,
		...props,
		children
	});
	const inspected = inspection.pinned;
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "chart-inspection-area",
		"data-inspecting": inspected !== null ? "true" : void 0,
		role: "group",
		tabIndex: 0,
		"aria-label": label,
		onKeyDown: handleKeyDown,
		className: cn("luc-focus rounded-md", className),
		...props,
		children: [children, /* @__PURE__ */ jsx("span", {
			role: "status",
			"aria-live": "polite",
			className: "sr-only",
			children: inspected === null ? "" : format ? format(inspected) : String(inspected)
		})]
	});
}
//#endregion
export { ChartInspectionArea, ChartInspectionProvider, ChartPinButton, ChartPinStatus, useChartInspection, useChartInspectionContext };

//# sourceMappingURL=inspection.js.map