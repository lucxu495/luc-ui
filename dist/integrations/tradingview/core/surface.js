"use client";
import { cn } from "../../../utils/cn.js";
import { Button } from "../../../components/button-base.js";
import { Skeleton } from "../../../components/skeleton.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/integrations/tradingview/core/surface.tsx
/**
* Loading surface for an external widget.
*
* It reserves the widget's own geometry — a title line, a plot band, a footer
* line — so the page does not jump when TradingView takes over. No spinner: the
* provider's content arrives as a block, not as a status.
*/
function TradingViewWidgetSkeleton({ className, label = "Loading market widget" }) {
	return /* @__PURE__ */ jsxs("div", {
		className: cn("flex h-full w-full flex-col gap-3 p-3", className),
		role: "status",
		"aria-live": "polite",
		"aria-label": label,
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ jsx(Skeleton, { className: "size-7 rounded-full" }), /* @__PURE__ */ jsxs("div", {
				className: "flex flex-1 flex-col gap-1.5",
				children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-24" }), /* @__PURE__ */ jsx(Skeleton, { className: "h-2.5 w-16" })]
			})]
		}), /* @__PURE__ */ jsx(Skeleton, { className: "min-h-0 flex-1 rounded-md" })]
	});
}
/**
* Failure surface.
*
* Deliberately does not invent market data: when the provider is unreachable
* the honest answer is "unavailable", with a retry, and the rest of the page
* keeps working.
*/
function TradingViewWidgetError({ className, title = "Market widget unavailable", description = "TradingView could not be reached. The rest of this page is unaffected.", action }) {
	return /* @__PURE__ */ jsxs("div", {
		className: cn("flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center", className),
		role: "alert",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-label font-medium text-fg-primary",
				children: title
			}),
			/* @__PURE__ */ jsx("p", {
				className: "max-w-[32ch] text-caption text-fg-muted",
				children: description
			}),
			action
		]
	});
}
/**
* Optional outer surface for a provider widget.
*
* Two rules: it never overlaps the widget box (so the provider's attribution
* can never be covered), and it never adds its own background behind the widget
* — a double-framed widget looks like a mistake, which is why this is opt-in and
* the wrappers themselves render bare.
*/
function TradingViewWidgetFrame({ title, description, actions, children, className }) {
	return /* @__PURE__ */ jsxs("section", {
		className: cn("flex min-h-0 flex-col gap-3", className),
		children: [title || description || actions ? /* @__PURE__ */ jsxs("header", {
			className: "flex items-start justify-between gap-4",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex min-w-0 flex-col gap-1",
				children: [title ? /* @__PURE__ */ jsx("h3", {
					className: "text-label font-medium text-fg-primary",
					children: title
				}) : null, description ? /* @__PURE__ */ jsx("p", {
					className: "text-caption text-fg-muted",
					children: description
				}) : null]
			}), actions ? /* @__PURE__ */ jsx("div", {
				className: "flex shrink-0 items-center gap-1.5",
				children: actions
			}) : null]
		}) : null, /* @__PURE__ */ jsx("div", {
			className: "min-h-0",
			children
		})]
	});
}
/** Retry affordance shared by both wrapper formats. */
function TradingViewRetryAction({ onRetry }) {
	return /* @__PURE__ */ jsx(Button, {
		size: "sm",
		variant: "secondary",
		onClick: onRetry,
		className: "mt-1",
		children: "Try again"
	});
}
/**
* Construction fallback for a symbol the provider cannot accept.
*
* The typed widgets reject an obviously malformed symbol (empty, or characters
* that cannot appear in `EXCHANGE:TICKER`) *before* anything is requested from
* TradingView. That is a bounded state, not a crash: the widget renders this
* surface and the rest of the page keeps working. It deliberately does not echo
* the offending value back into the UI.
*/
function TradingViewSymbolError({ className, title }) {
	return /* @__PURE__ */ jsx(TradingViewWidgetError, {
		className,
		title: title ?? "Market widget unavailable",
		description: "This widget needs a valid TradingView symbol in EXCHANGE:TICKER form, so nothing was requested from the provider."
	});
}
//#endregion
export { TradingViewRetryAction, TradingViewSymbolError, TradingViewWidgetError, TradingViewWidgetFrame, TradingViewWidgetSkeleton };

//# sourceMappingURL=surface.js.map