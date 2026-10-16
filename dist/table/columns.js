"use client";
import { cn } from "../utils/cn.js";
import { formatNumber } from "../utils/format.js";
import { formatAbsoluteTime } from "../utils/time.js";
import { StatusBadge } from "../data/status-badge.js";
import { Sparkline } from "../charts/components/sparkline.js";
import { jsx } from "react/jsx-runtime";
//#region src/table/columns.tsx
/**
* Assembles a column definition. The `as` cast is deliberate: TanStack's
* per-column `TValue` generic cannot be threaded through a runtime helper, and
* the value is still checked at the call site via `keyof TData`.
*/
function buildColumn(config) {
	const { key, options } = config;
	const meta = {
		align: options.align,
		label: typeof options.header === "string" ? options.header : options.id ?? key,
		locked: options.locked,
		pin: options.pin,
		headerClassName: options.headerClassName,
		cellClassName: options.cellClassName,
		...config.meta
	};
	return {
		id: options.id ?? key,
		accessorKey: key,
		header: options.description ? /* @__PURE__ */ jsx("span", {
			title: options.description,
			children: options.header
		}) : options.header,
		enableSorting: options.sortable ?? true,
		sortDescFirst: options.sortDescFirst ?? false,
		enableColumnFilter: options.filterable ?? false,
		...options.filterFn ? { filterFn: options.filterFn } : {},
		enableGlobalFilter: true,
		enableHiding: options.locked ? false : true,
		size: options.size,
		minSize: options.minSize,
		maxSize: options.maxSize,
		meta,
		cell: (context) => {
			const row = context.row.original;
			const value = config.valueGetter ? config.valueGetter(row) : context.getValue();
			return config.render(value, row);
		}
	};
}
const DASH = /* @__PURE__ */ jsx("span", {
	className: "text-fg-disabled",
	children: "—"
});
function textOrDash(value) {
	if (value === null || value === void 0 || value === "") return DASH;
	return String(value);
}
function textColumn(key, options) {
	return buildColumn({
		key,
		options,
		render: (raw, row) => {
			const value = raw === null || raw === void 0 ? "" : String(raw);
			if (options.cell) return options.cell(value, row);
			return /* @__PURE__ */ jsx("span", {
				className: cn(options.truncate && "block truncate", options.mono && "font-mono text-caption", options.emphasis && "font-medium text-fg-primary"),
				children: textOrDash(value)
			});
		}
	});
}
function numericColumn(key, options) {
	const { kind = "decimal", tone = "none", unit, formatter, decimals, locale, currency, suffix, signed, minimumFractionDigits, maximumFractionDigits, ...base } = options;
	const formatOptions = {
		kind,
		locale,
		currency,
		suffix: unit ?? suffix,
		signed,
		minimumFractionDigits: decimals ?? minimumFractionDigits,
		maximumFractionDigits: decimals ?? maximumFractionDigits
	};
	return buildColumn({
		key,
		options: {
			...base,
			align: base.align ?? "right"
		},
		meta: {
			numeric: true,
			align: base.align ?? "right"
		},
		render: (raw, row) => {
			const value = typeof raw === "number" ? raw : raw === null || raw === void 0 ? null : Number(raw);
			if (value === null || Number.isNaN(value)) return DASH;
			const text = formatter ? formatter(value, row) : formatNumber(value, formatOptions);
			return /* @__PURE__ */ jsx("span", {
				"data-numeric": "",
				className: cn("text-fg-primary", tone === "signed" && value > 0 && "text-fg-positive", tone === "signed" && value < 0 && "text-fg-negative"),
				children: text
			});
		}
	});
}
function currencyColumn(key, options) {
	return numericColumn(key, {
		kind: "currency",
		...options
	});
}
function percentColumn(key, options) {
	return numericColumn(key, {
		kind: "percent",
		...options
	});
}
function integerColumn(key, options) {
	return numericColumn(key, {
		kind: "number",
		maximumFractionDigits: 0,
		...options
	});
}
function compactColumn(key, options) {
	return numericColumn(key, {
		kind: "compact",
		...options
	});
}
function dateColumn(key, options) {
	const { style = "date", timeZone, locale, ...base } = options;
	return buildColumn({
		key,
		options: base,
		render: (raw) => {
			if (raw === null || raw === void 0) return DASH;
			const text = formatAbsoluteTime(raw, {
				style,
				timeZone,
				locale
			});
			return /* @__PURE__ */ jsx("span", {
				"data-numeric": "",
				className: "text-fg-secondary",
				children: text
			});
		}
	});
}
function statusColumn(key, options) {
	const { map, ...base } = options;
	return buildColumn({
		key,
		options: base,
		render: (raw, row) => {
			const mapped = map(raw === null || raw === void 0 ? "" : String(raw), row);
			return /* @__PURE__ */ jsx(StatusBadge, {
				size: "sm",
				status: mapped.status,
				label: mapped.label
			});
		}
	});
}
function booleanColumn(key, options) {
	return buildColumn({
		key,
		options,
		render: (raw) => {
			if (raw === null || raw === void 0) return DASH;
			const truthy = Boolean(raw);
			return /* @__PURE__ */ jsx("span", {
				className: cn("text-label", truthy ? "text-fg-positive" : "text-fg-disabled"),
				children: truthy ? options.trueLabel ?? "Yes" : options.falseLabel ?? "No"
			});
		}
	});
}
function sparklineColumn(key, options) {
	const { tone = "accent", autoTone, width = 96, height = 24, ...base } = options;
	return buildColumn({
		key,
		options: {
			align: "right",
			sortable: false,
			...base
		},
		meta: { align: "right" },
		render: (raw) => {
			if (!Array.isArray(raw) || raw.length === 0) return DASH;
			return /* @__PURE__ */ jsx(Sparkline, {
				values: raw,
				tone,
				autoTone,
				width,
				height,
				className: "inline-block"
			});
		}
	});
}
function linkColumn(key, options) {
	const { href, label, ...base } = options;
	return buildColumn({
		key,
		options: base,
		render: (raw, row) => {
			if (raw === null || raw === void 0 || raw === "") return DASH;
			const value = String(raw);
			return /* @__PURE__ */ jsx("a", {
				href: href(value, row),
				className: "text-fg-accent underline decoration-line-accent/60 underline-offset-2 hover:decoration-line-accent",
				children: label ? label(value, row) : value
			});
		}
	});
}
/** A column with no accessor: actions, expanders, selection. */
function displayColumn(options) {
	const { id, cell, ...base } = options;
	return {
		id,
		header: base.header,
		enableSorting: base.sortable ?? false,
		enableColumnFilter: false,
		enableGlobalFilter: false,
		enableHiding: base.locked ? false : true,
		size: base.size,
		minSize: base.minSize,
		maxSize: base.maxSize,
		meta: {
			align: base.align ?? "left",
			label: typeof base.header === "string" ? base.header : id,
			locked: base.locked,
			pin: base.pin,
			headerClassName: base.headerClassName,
			cellClassName: base.cellClassName
		},
		cell: (context) => cell(context.row.original)
	};
}
//#endregion
export { booleanColumn, compactColumn, currencyColumn, dateColumn, displayColumn, integerColumn, linkColumn, numericColumn, percentColumn, sparklineColumn, statusColumn, textColumn };

//# sourceMappingURL=columns.js.map