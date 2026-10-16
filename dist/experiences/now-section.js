import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/experiences/now-section.tsx
/**
* `YYYY-MM-DD` in, a locale-formatted date out, without `Date` drift.
*
* `new Date("2026-03-01")` is parsed as UTC midnight and then printed in the
* visitor's zone, so a reader in Auckland sees 1 March and a reader in Los
* Angeles sees 28 February — a hydration mismatch on the server and a wrong date
* everywhere else. Parsing the parts and formatting in UTC removes both.
*/
function formatUpdatedAt(iso, locale) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
	if (!match) return iso;
	const [, year, month, day] = match;
	const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
	try {
		return new Intl.DateTimeFormat(locale, {
			year: "numeric",
			month: "long",
			day: "numeric",
			timeZone: "UTC"
		}).format(date);
	} catch {
		return iso;
	}
}
function NowSection({ updatedAt, items, title = "Now", lead, updatedLabel = "Updated {date}", locale = "en-US", className, ...props }) {
	const formatted = formatUpdatedAt(updatedAt, locale);
	return /* @__PURE__ */ jsxs("section", {
		"data-slot": "now-section",
		className: cn("luc-rest flex flex-col gap-5 rounded-md border border-line-subtle bg-surface-raised p-6", className),
		...props,
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "font-display text-heading-sm font-semibold text-fg-primary",
					children: title
				}), /* @__PURE__ */ jsx("p", {
					className: "text-micro text-fg-muted",
					children: /* @__PURE__ */ jsx("time", {
						dateTime: updatedAt,
						className: "luc-numeric",
						children: updatedLabel.replace("{date}", formatted)
					})
				})]
			}),
			lead ? /* @__PURE__ */ jsx("p", {
				className: "max-w-[68ch] text-body text-fg-secondary text-pretty",
				children: lead
			}) : null,
			/* @__PURE__ */ jsx("dl", {
				className: "flex flex-col gap-4",
				children: items.map((item) => /* @__PURE__ */ jsxs("div", {
					className: "grid gap-1 border-t border-line-subtle pt-4 first:border-t-0 first:pt-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6",
					children: [/* @__PURE__ */ jsx("dt", {
						className: "text-micro font-medium text-fg-muted sm:pt-0.5",
						children: item.label
					}), /* @__PURE__ */ jsx("dd", {
						className: "min-w-0 text-body text-fg-secondary text-pretty",
						children: item.value
					})]
				}, item.id))
			})
		]
	});
}
//#endregion
export { NowSection };

//# sourceMappingURL=now-section.js.map