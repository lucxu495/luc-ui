"use client";
import { cn } from "../../utils/cn.js";
import { SegmentedControl, SegmentedItem } from "../../components/segmented-control.js";
import { DataTable } from "../../table/data-table.js";
import { DataTablePagination } from "../../table/data-table-pagination.js";
import { numericColumn } from "../../table/columns.js";
import { formatChartValue } from "../core/formatters.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
//#region src/charts/components/chart-data-table.tsx
function ChartDataTable({ rows, xKey, xLabel = "Date", xFormat = { kind: "date" }, series, caption, pageSize = 10, maxHeight = 320, className }) {
	const columns = useMemo(() => {
		return [numericColumn(xKey, {
			header: xLabel,
			align: "left",
			locked: true,
			cellClassName: "text-fg-secondary",
			formatter: (value) => formatChartValue(value, xFormat)
		}), ...series.map((spec) => numericColumn(spec.key, {
			header: spec.label,
			tone: spec.tone,
			kind: "decimal",
			formatter: (value) => spec.formatter ? spec.formatter(value) : formatChartValue(value, spec.format ?? {
				kind: "decimal",
				decimals: 2
			})
		}))];
	}, [
		series,
		xFormat,
		xKey,
		xLabel
	]);
	const data = useMemo(() => pageSize === 0 ? rows.slice(0, 500) : rows, [pageSize, rows]);
	return /* @__PURE__ */ jsx(DataTable, {
		ariaLabel: caption ?? "Chart data table",
		caption,
		columns,
		data,
		getRowId: (row, index) => `${String(row[xKey] ?? index)}-${index}`,
		density: "compact",
		stickyHeader: true,
		maxHeight,
		defaultSorting: [{
			id: xKey,
			desc: true
		}],
		enableRowSelection: false,
		pageSize: pageSize === 0 ? Math.max(data.length, 1) : pageSize,
		className,
		footer: pageSize === 0 ? null : /* @__PURE__ */ jsx(DataTablePagination, { className: "rounded-b-lg border-x border-b border-line-subtle bg-surface-default" })
	});
}
/**
* The chart/table switch. A segmented control rather than two buttons because
* the choice is exclusive, and it is the control that makes the table reachable
* by keyboard.
*/
function ChartDataViewToggle({ value, onValueChange, label = "Chart or table view", labels = {
	chart: "Chart",
	table: "Table"
}, className }) {
	return /* @__PURE__ */ jsxs(SegmentedControl, {
		className,
		size: "sm",
		"aria-label": label,
		value,
		onValueChange: (next) => next && onValueChange(next),
		children: [/* @__PURE__ */ jsx(SegmentedItem, {
			size: "sm",
			value: "chart",
			children: labels.chart
		}), /* @__PURE__ */ jsx(SegmentedItem, {
			size: "sm",
			value: "table",
			children: labels.table
		})]
	});
}
/** Renders one of the two views. Keeps both in the same card frame. */
function ChartDataView({ view, chart, table }) {
	if (view === "chart") return /* @__PURE__ */ jsx("div", {
		className: cn("h-full min-h-0 w-full"),
		children: chart
	});
	return /* @__PURE__ */ jsx(ChartDataTable, { ...table });
}
//#endregion
export { ChartDataTable, ChartDataView, ChartDataViewToggle };

//# sourceMappingURL=chart-data-table.js.map