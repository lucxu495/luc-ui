"use client";
import { useControllableState } from "../hooks/use-controllable-state.js";
import { cn } from "../utils/cn.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
//#region src/experiences/publication-list.tsx
const ALL = "all";
function facets(publications) {
	return {
		years: Array.from(new Set(publications.map((entry) => entry.year))).sort((a, b) => b - a),
		kinds: Array.from(new Set(publications.map((entry) => entry.kind).filter((kind) => !!kind))).sort(),
		topics: Array.from(new Set(publications.flatMap((entry) => entry.topics ?? []))).sort()
	};
}
function PublicationList({ publications, value, defaultValue, onValueChange, filters = true, filterLabel = "Filter publications", emptyText = "No publications match these filters.", headingLevel = 3, className, ...props }) {
	const [selection, setSelection] = useControllableState({
		value,
		defaultValue: defaultValue ?? {
			year: ALL,
			kind: ALL,
			topic: ALL
		},
		onChange: onValueChange
	});
	const options = useMemo(() => facets(publications), [publications]);
	const year = selection.year ?? ALL;
	const kind = selection.kind ?? ALL;
	const topic = selection.topic ?? ALL;
	const visible = publications.filter((entry) => (year === ALL || entry.year === year) && (kind === ALL || entry.kind === kind) && (topic === ALL || (entry.topics ?? []).includes(topic)));
	const Heading = headingLevel === 4 ? "h4" : "h3";
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "publication-list",
		className: cn("flex flex-col gap-5", className),
		...props,
		children: [filters ? /* @__PURE__ */ jsxs("div", {
			role: "group",
			"aria-label": filterLabel,
			className: "flex flex-wrap items-end gap-x-6 gap-y-3 rounded-md border border-line-subtle bg-surface-raised p-4",
			children: [
				/* @__PURE__ */ jsx(Facet, {
					label: "Year",
					value: String(year),
					onChange: (next) => setSelection({
						...selection,
						year: next === ALL ? ALL : Number(next)
					}),
					options: [{
						value: ALL,
						label: "All years"
					}, ...options.years.map((option) => ({
						value: String(option),
						label: String(option)
					}))]
				}),
				options.kinds.length > 1 ? /* @__PURE__ */ jsx(Facet, {
					label: "Type",
					value: kind,
					onChange: (next) => setSelection({
						...selection,
						kind: next
					}),
					options: [{
						value: ALL,
						label: "All types"
					}, ...options.kinds.map((option) => ({
						value: option,
						label: option
					}))]
				}) : null,
				options.topics.length > 1 ? /* @__PURE__ */ jsx(Facet, {
					label: "Topic",
					value: topic,
					onChange: (next) => setSelection({
						...selection,
						topic: next
					}),
					options: [{
						value: ALL,
						label: "All topics"
					}, ...options.topics.map((option) => ({
						value: option,
						label: option
					}))]
				}) : null,
				/* @__PURE__ */ jsxs("p", {
					"aria-live": "polite",
					className: "ml-auto text-caption text-fg-muted luc-numeric",
					children: [
						visible.length,
						" of ",
						publications.length
					]
				})
			]
		}) : null, visible.length === 0 ? /* @__PURE__ */ jsx("p", {
			className: "rounded-md border border-dashed border-line-default bg-surface-sunken p-6 text-center text-body text-fg-muted",
			children: emptyText
		}) : /* @__PURE__ */ jsx("ol", {
			className: "flex list-none flex-col",
			children: visible.map((entry) => /* @__PURE__ */ jsxs("li", {
				className: "flex flex-col gap-2 border-t border-line-subtle py-5 first:border-t-0 first:pt-0",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-baseline gap-x-3 gap-y-1",
						children: [/* @__PURE__ */ jsx(Heading, {
							className: "max-w-[70ch] text-title font-semibold text-fg-primary text-balance",
							children: entry.title
						}), entry.kind ? /* @__PURE__ */ jsx("span", {
							className: "rounded-xs border border-line-subtle bg-surface-interactive px-2 py-0.5 text-micro text-fg-muted",
							children: entry.kind
						}) : null]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "max-w-[80ch] text-body text-fg-secondary text-pretty",
						children: entry.authors
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-fg-muted",
						children: [
							/* @__PURE__ */ jsx("cite", {
								className: "not-italic",
								children: entry.venue
							}),
							/* @__PURE__ */ jsx("span", {
								"aria-hidden": "true",
								children: "·"
							}),
							/* @__PURE__ */ jsx("span", {
								className: "luc-numeric",
								children: entry.year
							}),
							entry.citations !== void 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("span", {
								"aria-hidden": "true",
								children: "·"
							}), /* @__PURE__ */ jsxs("span", {
								className: "luc-numeric",
								children: [entry.citations, " citations"]
							})] }) : null
						]
					}),
					entry.note ? /* @__PURE__ */ jsx("p", {
						className: "text-caption text-fg-accent",
						children: entry.note
					}) : null,
					entry.doi || entry.url ? /* @__PURE__ */ jsxs("p", {
						className: "flex flex-wrap gap-4 pt-1",
						children: [entry.doi ? /* @__PURE__ */ jsxs("a", {
							href: `https://doi.org/${entry.doi}`,
							target: "_blank",
							rel: "noreferrer noopener",
							className: "luc-focus rounded-xs text-caption font-medium text-fg-accent underline decoration-line-accent underline-offset-4",
							"aria-label": `DOI ${entry.doi} — opens in a new tab`,
							children: ["DOI ", entry.doi]
						}) : null, entry.url ? /* @__PURE__ */ jsx("a", {
							href: entry.url,
							target: "_blank",
							rel: "noreferrer noopener",
							className: "luc-focus rounded-xs text-caption font-medium text-fg-accent underline decoration-line-accent underline-offset-4",
							children: "Read"
						}) : null]
					}) : null
				]
			}, entry.id))
		})]
	});
}
function Facet({ label, value, onChange, options }) {
	const id = `publication-facet-${label.toLowerCase()}`;
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-col gap-1.5",
		children: [/* @__PURE__ */ jsx("label", {
			htmlFor: id,
			className: "text-micro text-fg-muted",
			children: label
		}), /* @__PURE__ */ jsx("select", {
			id,
			value,
			onChange: (event) => onChange(event.target.value),
			className: cn("luc-well luc-focus h-8 min-w-[9rem] rounded-sm border border-line-default", "bg-surface-sunken px-2 text-label text-fg-primary"),
			children: options.map((option) => /* @__PURE__ */ jsx("option", {
				value: option.value,
				children: option.label
			}, option.value))
		})]
	});
}
//#endregion
export { PublicationList };

//# sourceMappingURL=publication-list.js.map