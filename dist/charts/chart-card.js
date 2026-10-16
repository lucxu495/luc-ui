"use client";
import { cn } from "../utils/cn.js";
import { Button } from "../components/button-base.js";
import { Card, CardFooter } from "../components/card.js";
import { SegmentedControl, SegmentedItem } from "../components/segmented-control.js";
import { Skeleton } from "../components/skeleton.js";
import { Tooltip } from "../components/tooltip.js";
import { normalizeScaleCapability } from "./core/axis.js";
import { ChartSyncGroupProvider } from "./core/sync-context.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
//#region src/charts/chart-card.tsx
function ChartCard({ className, height = 320, children, ...props }) {
	return /* @__PURE__ */ jsx(Card, {
		"data-slot": "chart-card",
		variant: "raised",
		className: cn("min-w-0", className),
		style: { ["--chart-height"]: typeof height === "number" ? `${height}px` : height },
		...props,
		children
	});
}
function ChartHeader({ className, title, description, toolbar, readout, ...props }) {
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "chart-header",
		className: cn("flex flex-wrap items-start justify-between gap-3 border-b border-line-subtle px-4 py-3", className),
		...props,
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex min-w-0 flex-col gap-0.5",
			children: [/* @__PURE__ */ jsx("h3", {
				className: "text-title text-fg-primary",
				children: title
			}), description ? /* @__PURE__ */ jsx("p", {
				className: "text-caption text-fg-muted",
				children: description
			}) : null]
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex flex-wrap items-center gap-2",
			children: [readout, toolbar]
		})]
	});
}
function ChartPlot({ className, children, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "chart-plot",
		className: cn("relative w-full", className),
		style: { height: "var(--chart-height)" },
		...props,
		children
	});
}
function RangeSelector({ ranges, value, onValueChange, className }) {
	return /* @__PURE__ */ jsx(SegmentedControl, {
		value,
		onValueChange: (next) => next && onValueChange(next),
		className,
		children: ranges.map((range) => /* @__PURE__ */ jsx(SegmentedItem, {
			value: range,
			className: "px-2 uppercase",
			children: range
		}, range))
	});
}
/**
* The Linear / Log control.
*
* A chart's scale is a *presentation* choice: switching it re-maps the same
* values and never reloads, re-queries or mutates them. It is a segmented
* toggle group, so it carries radio semantics (`aria-pressed` per item) and is
* fully keyboard operable; the selected mode is never communicated by colour
* alone. The copy comes from the caller so a localized page stays localized.
*/
function ScaleSelector({ allowed, value, onValueChange, labels, className }) {
	const capability = normalizeScaleCapability({
		allowed,
		default: value
	});
	if (capability.allowedScaleModes.length < 2) return null;
	const copy = {
		linear: labels?.linear ?? "Linear",
		log: labels?.log ?? "Log"
	};
	return /* @__PURE__ */ jsx(SegmentedControl, {
		"data-slot": "chart-scale",
		"data-scale": value,
		"aria-label": copy.linear + " / " + copy.log,
		value,
		onValueChange: (next) => {
			if (next === "linear" || next === "log") onValueChange(next);
		},
		className: cn("text-micro", className),
		children: capability.allowedScaleModes.map((mode) => /* @__PURE__ */ jsx(SegmentedItem, {
			value: mode,
			className: "px-2",
			children: copy[mode]
		}, mode))
	});
}
const LEGEND_DASH = {
	solid: void 0,
	dashed: "5 4",
	dotted: "1 3"
};
const LEGEND_STROKE = {
	thin: 1.5,
	regular: 2.25,
	strong: 3
};
/**
* The legend's sample of one series: the plot's own encoding, at legend size.
*
* A chart whose bars, areas and dashed reference lines are all drawn as a small
* coloured square asks the reader to remember what each series looked like. The
* sample is thick enough to read (22×12) and carries the mark, the dash and the
* relative weight, so the legend can be mapped back to the plot at a glance.
*/
function SeriesSample({ color, mark = "line", line = "solid", weight = "regular", muted = false }) {
	if (mark === "bar") return /* @__PURE__ */ jsx("svg", {
		"aria-hidden": "true",
		width: "22",
		height: "12",
		viewBox: "0 0 22 12",
		className: "shrink-0",
		children: /* @__PURE__ */ jsx("rect", {
			x: "7",
			y: "1.5",
			width: "8",
			height: "9",
			rx: "1.5",
			fill: color,
			opacity: muted ? .5 : 1
		})
	});
	return /* @__PURE__ */ jsxs("svg", {
		"aria-hidden": "true",
		width: "22",
		height: "12",
		viewBox: "0 0 22 12",
		className: "shrink-0",
		children: [mark === "area" ? /* @__PURE__ */ jsx("path", {
			d: "M1 9.5 L11 3 L21 9.5 Z",
			fill: color,
			opacity: muted ? .16 : .26
		}) : null, /* @__PURE__ */ jsx("line", {
			x1: "1",
			y1: "6",
			x2: "21",
			y2: "6",
			stroke: color,
			strokeWidth: LEGEND_STROKE[weight],
			strokeDasharray: LEGEND_DASH[line],
			strokeLinecap: "round",
			opacity: muted ? .6 : 1
		})]
	});
}
/** Legend doubles as the series visibility control. One control, two jobs. */
function ChartLegend({ series, visible, onToggle, className }) {
	return /* @__PURE__ */ jsx("ul", {
		"data-slot": "chart-legend",
		className: cn("flex flex-wrap items-center gap-x-4 gap-y-2", className),
		children: series.map((item) => {
			const isVisible = visible.includes(item.id);
			const color = item.color ?? toneToColor(item.tone);
			const encoded = item.mark !== void 0 || item.line !== void 0 || item.weight !== void 0 || item.muted !== void 0;
			return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("button", {
				type: "button",
				"aria-pressed": isVisible,
				onClick: () => onToggle(item.id),
				...item.attributes,
				className: cn("luc-transition luc-focus inline-flex items-center gap-2 rounded-xs px-1 py-0.5", "text-caption", isVisible ? "text-fg-secondary hover:text-fg-primary" : "text-fg-muted opacity-60 line-through"),
				children: [encoded ? /* @__PURE__ */ jsx("span", {
					className: "inline-flex",
					children: /* @__PURE__ */ jsx(SeriesSample, {
						color,
						mark: item.mark,
						line: item.line,
						weight: item.weight,
						muted: item.muted
					})
				}) : /* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					className: cn("h-2.5 w-2.5 rounded-[3px] border", isVisible ? "border-transparent" : "border-line-strong bg-transparent"),
					style: isVisible ? { backgroundColor: color } : void 0
				}), item.label]
			}) }, item.id);
		})
	});
}
function toneToColor(tone) {
	switch (tone) {
		case "positive": return "var(--positive)";
		case "negative": return "var(--negative)";
		case "warning": return "var(--warning)";
		case "info": return "var(--info)";
		case "neutral": return "var(--fg-muted)";
		default: return "var(--accent-default)";
	}
}
function ChartToolbar({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "chart-toolbar",
		className: cn("flex items-center gap-1.5", className),
		...props
	});
}
/** Positioned by the engine; styled by LUC. Pass it down as the tooltip node. */
function ChartTooltipSurface({ className, title, children, ...props }) {
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "chart-tooltip",
		className: cn("pointer-events-none min-w-40 rounded-md border border-chart-tooltip-border bg-chart-tooltip-surface p-2.5 shadow-overlay", className),
		...props,
		children: [title ? /* @__PURE__ */ jsx("p", {
			className: "mb-1.5 text-micro text-fg-muted uppercase",
			children: title
		}) : null, /* @__PURE__ */ jsx("div", {
			className: "flex flex-col gap-1",
			children
		})]
	});
}
function ChartTooltipRow({ label, value, tone, className }) {
	return /* @__PURE__ */ jsxs("div", {
		className: cn("flex items-center justify-between gap-4 text-caption", className),
		children: [/* @__PURE__ */ jsxs("span", {
			className: "flex items-center gap-1.5 text-fg-muted",
			children: [/* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				className: "size-2 rounded-[2px]",
				style: { backgroundColor: toneToColor(tone) }
			}), label]
		}), /* @__PURE__ */ jsx("span", {
			className: "luc-numeric font-medium text-fg-primary",
			children: value
		})]
	});
}
function FullscreenButton({ onClick, className, label = "Toggle fullscreen", tooltip = "Fullscreen" }) {
	return /* @__PURE__ */ jsx(Tooltip, {
		content: tooltip,
		side: "bottom",
		children: /* @__PURE__ */ jsx(Button, {
			size: "sm",
			variant: "ghost",
			onClick,
			className,
			leadingIcon: /* @__PURE__ */ jsx("svg", {
				viewBox: "0 0 16 16",
				"aria-hidden": "true",
				className: "size-3.5",
				children: /* @__PURE__ */ jsx("path", {
					d: "M6 2.5H2.5V6M10 2.5h3.5V6M6 13.5H2.5V10M10 13.5h3.5V10",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: "1.4",
					strokeLinecap: "round",
					strokeLinejoin: "round"
				})
			}),
			children: /* @__PURE__ */ jsx("span", {
				className: "sr-only",
				children: label
			})
		})
	});
}
function ChartSkeleton({ height = 320, className }) {
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "chart-skeleton",
		className: cn("flex flex-col gap-3 p-4", className),
		style: { height: typeof height === "number" ? `${height}px` : height },
		"aria-busy": "true",
		"aria-live": "polite",
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "sr-only",
				children: "Loading chart"
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-start justify-between gap-4",
				children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-32" }), /* @__PURE__ */ jsx(Skeleton, { className: "h-7 w-40" })]
			}),
			/* @__PURE__ */ jsx(Skeleton, { className: "min-h-0 flex-1" }),
			/* @__PURE__ */ jsxs("div", {
				className: "flex gap-4",
				children: [
					/* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-16" }),
					/* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-20" }),
					/* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-14" })
				]
			})
		]
	});
}
function ChartState({ title, description, action, icon, tone = "neutral", className, compact = false }) {
	return /* @__PURE__ */ jsxs("div", {
		className: cn("flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center", compact && "flex-none py-8", className),
		style: compact ? void 0 : { height: "100%" },
		children: [
			icon ? /* @__PURE__ */ jsx("span", {
				className: cn("grid size-10 place-items-center rounded-lg border border-line-subtle bg-surface-interactive", tone === "negative" ? "text-fg-negative" : "text-fg-disabled"),
				children: icon
			}) : null,
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-col gap-1",
				children: [/* @__PURE__ */ jsx("p", {
					className: "text-label font-medium text-fg-secondary",
					children: title
				}), description ? /* @__PURE__ */ jsx("p", {
					className: "max-w-72 text-caption text-fg-muted",
					children: description
				}) : null]
			}),
			action
		]
	});
}
function ChartEmptyState(props) {
	return /* @__PURE__ */ jsx(ChartState, {
		...props,
		icon: props.icon ?? /* @__PURE__ */ jsx("svg", {
			viewBox: "0 0 20 20",
			"aria-hidden": "true",
			className: "size-5",
			children: /* @__PURE__ */ jsx("path", {
				d: "M3 16.5V6.2M7.5 16.5V9.4M12 16.5v-4.6M16.5 16.5V4.2",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.5",
				strokeLinecap: "round",
				opacity: "0.5"
			})
		})
	});
}
function ChartErrorState(props) {
	return /* @__PURE__ */ jsx(ChartState, {
		...props,
		tone: "negative",
		icon: props.icon ?? /* @__PURE__ */ jsxs("svg", {
			viewBox: "0 0 20 20",
			"aria-hidden": "true",
			className: "size-5",
			children: [
				/* @__PURE__ */ jsx("path", {
					d: "M10 2.8 18.4 17H1.6z",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: "1.5",
					strokeLinejoin: "round"
				}),
				/* @__PURE__ */ jsx("path", {
					d: "M10 7.6v3.8",
					stroke: "currentColor",
					strokeWidth: "1.5",
					strokeLinecap: "round"
				}),
				/* @__PURE__ */ jsx("circle", {
					cx: "10",
					cy: "14",
					r: "0.9",
					fill: "currentColor"
				})
			]
		})
	});
}
/**
* Declares a sync group and makes its id inherit to the charts inside.
*
* The live crosshair/range state lives in the sync bus (`core/sync.ts`), not
* here — this component only scopes the group id, so a chart inside it that does
* not name its own `syncGroup` joins the surrounding group automatically.
*/
function ChartSyncGroup({ groupId, children, className }) {
	return /* @__PURE__ */ jsx(ChartSyncGroupProvider, {
		groupId,
		children: /* @__PURE__ */ jsx("div", {
			"data-slot": "chart-sync-group",
			"data-sync-group": groupId,
			className: cn("flex flex-col gap-3", className),
			children
		})
	});
}
/** Small helper for local UI state in chart toolbars. */
function useRangeState(defaultRange) {
	const [range, setRange] = useState(defaultRange);
	return [range, setRange];
}
//#endregion
export { ChartCard, ChartEmptyState, ChartErrorState, CardFooter as ChartFooter, ChartHeader, ChartLegend, ChartPlot, ChartSkeleton, ChartSyncGroup, ChartToolbar, ChartTooltipRow, ChartTooltipSurface, FullscreenButton, RangeSelector, ScaleSelector, useRangeState };

//# sourceMappingURL=chart-card.js.map