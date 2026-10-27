import { resolveChartPlotRect } from "../../core/axis.js";
import { numericAxisFormatter, timeAxisFormatter, timeAxisTickPlan } from "../../core/formatters.js";
import { ECHARTS_GLOBAL_OPTION } from "./echart-init.js";
function animationFragment(motion, options = {}) {
	if (motion.reduced) return {
		animation: false,
		animationDuration: 0,
		animationDurationUpdate: 0,
		universalTransition: false
	};
	return {
		animation: true,
		animationDuration: motion.intro,
		animationDurationUpdate: Math.max(140, motion.update),
		animationEasing: "cubicOut",
		animationEasingUpdate: "cubicOut",
		animationThreshold: options.threshold ?? 2500,
		...options.universal && motion.universal ? { universalTransition: true } : {}
	};
}
function baseOption(theme, motion, options = {}) {
	return {
		...ECHARTS_GLOBAL_OPTION,
		...animationFragment(motion, options),
		color: [...theme.palette],
		textStyle: {
			fontFamily: theme.fontFamily,
			fontSize: theme.fontCaption,
			color: theme.textPrimary
		},
		backgroundColor: "transparent",
		emphasis: {
			focus: "series",
			blurScope: "coordinateSystem"
		},
		blur: {
			lineStyle: { opacity: .24 },
			itemStyle: { opacity: .24 },
			areaStyle: { opacity: .1 },
			label: { opacity: .35 }
		}
	};
}
/**
* Default grid for a specialised family.
*
* These families (heatmap, correlation matrix, waterfall, distribution,
* sequence, band, relationship) own their label model — a matrix's header is not
* a value-axis gutter — so they keep their deliberate rectangle and rely on
* `containLabel` to fit it. The declarative cartesian path uses
* `gridForSides` instead, which is what makes a stacked research column share one
* X domain.
*/
function gridFragment(overrides = {}) {
	return {
		left: overrides.left ?? 6,
		right: overrides.right ?? 10,
		top: overrides.top ?? 14,
		bottom: overrides.bottom ?? 6,
		containLabel: overrides.containLabel ?? true,
		...overrides.height !== void 0 ? { height: overrides.height } : {}
	};
}
/**
* The shared plot rectangle for an explicit set of Y-axis sides.
*
* The rectangle is derived from which sides carry a Y axis, so two stacked
* charts whose labels differ by a factor of a thousand still share one data
* area; the gutter is reserved rather than measured. `containLabel` stays off
* here on purpose.
*/
function gridForSides(sides, overrides = {}) {
	const base = resolveChartPlotRect(sides);
	return {
		left: overrides.left ?? base.left,
		right: overrides.right ?? base.right,
		top: overrides.top ?? base.top,
		bottom: overrides.bottom ?? base.bottom,
		containLabel: overrides.containLabel ?? base.containLabel,
		...overrides.height !== void 0 ? { height: overrides.height } : {}
	};
}
function axisFragment(options) {
	const { theme, type } = options;
	if (options.hidden) return {
		show: false,
		type
	};
	const timeSpan = options.labelSpanMs ?? options.spanMs ?? 31536e6;
	const tickPlan = type === "time" ? timeAxisTickPlan(timeSpan) : null;
	const labelFormatter = type === "time" ? timeAxisFormatter(timeSpan) : type === "category" ? null : numericAxisFormatter(options.format);
	const tickFormatter = type === "category" ? null : options.pointLabel ? (value) => options.pointLabel(value) ?? labelFormatter?.(value) ?? String(value) : labelFormatter ? (value) => labelFormatter(value) : null;
	return {
		type,
		...options.name ? { name: options.name } : {},
		...options.nameLocation ? { nameLocation: options.nameLocation } : {},
		...options.nameGap !== void 0 ? { nameGap: options.nameGap } : {},
		...options.position ? { position: options.position } : {},
		...options.min !== void 0 ? { min: options.min } : {},
		...options.max !== void 0 ? { max: options.max } : {},
		...options.nice !== void 0 ? { nice: options.nice } : {},
		...options.scale !== void 0 ? { scale: options.scale } : {},
		...type === "log" ? { logBase: options.logBase ?? 10 } : {},
		...options.splitNumber ? { splitNumber: options.splitNumber } : tickPlan ? { splitNumber: tickPlan.splitNumber } : {},
		boundaryGap: type === "category",
		axisLine: {
			show: options.baseline ?? false,
			lineStyle: {
				color: theme.axisLine,
				width: 1
			}
		},
		axisTick: { show: false },
		axisLabel: {
			show: true,
			color: theme.axisLabel,
			fontFamily: theme.fontFamily,
			fontSize: theme.fontMicro,
			fontWeight: 450,
			hideOverlap: true,
			margin: 8,
			...options.hideMinLabel ? { showMinLabel: false } : {},
			...options.hideMaxLabel ? { showMaxLabel: false } : {},
			...tickFormatter ? { formatter: tickFormatter } : {}
		},
		splitLine: {
			show: options.showGrid ?? (type === "value" || type === "log"),
			lineStyle: {
				color: theme.grid,
				width: 1
			}
		},
		axisPointer: {
			lineStyle: crosshairLineStyle(theme),
			label: axisPointerLabel(theme, tickFormatter ?? void 0)
		}
	};
}
/** The single line treatment used by both axes and the Tooltip's cross pointer. */
function crosshairLineStyle(theme) {
	return {
		color: theme.crosshair,
		width: 1,
		type: "solid",
		opacity: 1
	};
}
function axisPointerLabel(theme, formatter) {
	return {
		backgroundColor: theme.crosshairLabelBg,
		color: theme.crosshairLabelFg,
		fontFamily: theme.fontFamily,
		fontSize: theme.fontMicro,
		fontWeight: 450,
		borderRadius: 4,
		padding: [3, 6],
		margin: 5,
		shadowBlur: 0,
		shadowColor: "transparent",
		...formatter ? { formatter } : {}
	};
}
/**
* Build the one Cartesian crosshair policy shared by every declarative chart.
*
* In ECharts, `tooltip.axisPointer.type = "cross"` asks the Tooltip machinery
* to involve both dimensions; an axis-level `type: "cross"` is a different
* setting and would make each plate draw its own pointer. The base X pointer
* therefore stays a line, snaps X to the nearest valid observation, and lets
* Y follow the pointer continuously. Axis-specific line/label configuration is
* merged after this fragment so a chart may override only its own semantics.
*/
function buildCartesianCrosshairOptions(theme, policy = true) {
	const enabled = typeof policy === "boolean" ? policy : policy?.enabled ?? true;
	const snap = typeof policy === "object" ? policy.snap ?? true : true;
	const lineStyle = crosshairLineStyle(theme);
	const label = {
		...axisPointerLabel(theme),
		show: enabled
	};
	if (!enabled) {
		const invisibleLine = {
			...lineStyle,
			opacity: 0
		};
		return {
			tooltipAxisPointer: {
				type: "none",
				axis: "x",
				show: true,
				snap,
				triggerTooltip: true,
				lineStyle: invisibleLine,
				crossStyle: invisibleLine,
				label: { show: false }
			},
			xAxisPointer: {
				show: "auto",
				snap,
				triggerTooltip: true,
				lineStyle: invisibleLine,
				label: { show: false }
			},
			yAxisPointer: {
				show: false,
				label: { show: false }
			}
		};
	}
	return {
		tooltipAxisPointer: {
			type: "cross",
			axis: "x",
			show: true,
			snap,
			triggerTooltip: true,
			animation: false,
			z: 50,
			lineStyle,
			crossStyle: lineStyle,
			label
		},
		xAxisPointer: {
			show: "auto",
			snap,
			triggerTooltip: true,
			triggerEmphasis: true,
			animation: false,
			lineStyle,
			label: {
				...label,
				show: true
			}
		},
		yAxisPointer: {
			show: "auto",
			snap: false,
			triggerTooltip: false,
			triggerEmphasis: false,
			animation: false,
			lineStyle,
			label: {
				...label,
				show: false
			}
		}
	};
}
function tooltipShell(theme, options) {
	if (options.mode === "none") return { show: false };
	const crosshair = buildCartesianCrosshairOptions(theme, options.crosshair ?? (options.mode === "axis" ? true : false));
	return {
		show: true,
		trigger: options.mode ?? "axis",
		renderMode: "html",
		confine: true,
		appendToBody: false,
		transitionDuration: 0,
		className: "luc-chart-tooltip-shell",
		backgroundColor: "transparent",
		borderWidth: 0,
		borderColor: "transparent",
		padding: 0,
		textStyle: {
			color: theme.textPrimary,
			fontFamily: theme.fontFamily
		},
		extraCssText: "pointer-events:none;box-shadow:none;background:transparent;border:0;padding:0;",
		formatter: options.formatter,
		axisPointer: crosshair.tooltipAxisPointer,
		position: (point, _params, dom, _rect, size) => {
			const gap = 12;
			const width = dom.offsetWidth || size.contentWidth || 160;
			const height = dom.offsetHeight || size.contentHeight || 72;
			return [point[0] + gap + width > size.viewWidth ? Math.max(gap, point[0] - width - gap) : point[0] + gap, Math.min(Math.max(gap, point[1] + gap), Math.max(gap, size.viewHeight - height - gap))];
		}
	};
}
function dataZoomFragment(options) {
	const zoom = options.interaction?.zoom ?? "inside";
	if (zoom === "none") return options.dragOnly ? [{
		type: "inside",
		...options.axisIndices ? { xAxisIndex: options.axisIndices } : {},
		zoomOnMouseWheel: false,
		moveOnMouseMove: false
	}] : [];
	const theme = options.theme;
	const shared = {
		...options.axisIndices ? { xAxisIndex: options.axisIndices } : {},
		...options.start !== void 0 ? {
			start: options.start,
			end: 100
		} : {}
	};
	if (zoom === "slider") return [{
		type: "inside",
		...shared,
		zoomOnMouseWheel: true,
		moveOnMouseMove: true
	}, {
		type: "slider",
		...shared,
		height: 20,
		bottom: 4,
		borderColor: "transparent",
		backgroundColor: theme.surfaceRaised,
		fillerColor: theme.selection,
		handleStyle: {
			color: theme.axisLabel,
			borderColor: "transparent"
		},
		moveHandleStyle: { color: theme.border },
		dataBackground: {
			lineStyle: {
				color: theme.border,
				width: 1
			},
			areaStyle: { color: theme.borderSubtle }
		},
		selectedDataBackground: {
			lineStyle: {
				color: theme.accent,
				width: 1
			},
			areaStyle: { color: theme.selection }
		},
		textStyle: {
			color: theme.textMuted,
			fontSize: theme.fontMicro
		},
		labelFormatter: () => ""
	}];
	return [{
		type: "inside",
		...shared,
		zoomOnMouseWheel: true,
		moveOnMouseMove: true
	}];
}
//#endregion
export { animationFragment, axisFragment, axisPointerLabel, baseOption, buildCartesianCrosshairOptions, crosshairLineStyle, dataZoomFragment, gridForSides, gridFragment, tooltipShell };

//# sourceMappingURL=option.js.map