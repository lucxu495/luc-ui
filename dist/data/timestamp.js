import { cn } from "../utils/cn.js";
import { formatAbsoluteTime, formatRelativeTime, resolveFreshness } from "../utils/time.js";
import { StatusBadge } from "./status-badge.js";
import { jsx } from "react/jsx-runtime";
//#region src/data/timestamp.tsx
function Timestamp({ className, value, display = "relative", style = "datetime", locale, timeZone, now, ...props }) {
	if (value === null || value === void 0) return /* @__PURE__ */ jsx("span", {
		"data-slot": "timestamp",
		className: cn("text-fg-disabled", className),
		...props,
		children: "—"
	});
	const date = value instanceof Date ? value : new Date(value);
	const isValid = !Number.isNaN(date.getTime());
	const relative = formatRelativeTime(date, {
		locale,
		now
	});
	const absolute = formatAbsoluteTime(date, {
		locale,
		style,
		timeZone
	});
	return /* @__PURE__ */ jsx("time", {
		"data-slot": "timestamp",
		dateTime: isValid ? date.toISOString() : void 0,
		title: isValid ? date.toISOString() : void 0,
		className: cn("luc-numeric text-fg-muted", className),
		...props,
		children: display === "relative" ? relative : absolute
	});
}
const freshnessMap = {
	live: {
		status: "live",
		label: "Live"
	},
	fresh: {
		status: "healthy",
		label: "Fresh"
	},
	stale: {
		status: "stale",
		label: "Stale"
	},
	expired: {
		status: "down",
		label: "Outdated"
	}
};
function FreshnessBadge({ className, updatedAt, freshSeconds = 300, staleSeconds = 3600, now, showAge = false, locale, ...props }) {
	const level = resolveFreshness(updatedAt, {
		freshSeconds,
		staleSeconds
	}, now);
	const preset = freshnessMap[level];
	const age = showAge ? formatRelativeTime(updatedAt, {
		locale,
		now
	}) : null;
	return /* @__PURE__ */ jsx(StatusBadge, {
		"data-slot": "freshness-badge",
		"data-freshness": level,
		status: preset.status,
		label: age ? `${preset.label} · ${age}` : preset.label,
		className: cn("luc-numeric", className),
		...props
	});
}
//#endregion
export { FreshnessBadge, Timestamp };

//# sourceMappingURL=timestamp.js.map