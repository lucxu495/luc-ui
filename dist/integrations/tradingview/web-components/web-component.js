"use client";
import { cn } from "../../../utils/cn.js";
import { tradingViewModuleUrl } from "../core/catalog.js";
import { buildWebComponentAttributes, defaultLocale } from "../core/markup.js";
import { TradingViewRetryAction, TradingViewWidgetError, TradingViewWidgetSkeleton } from "../core/surface.js";
import { TradingViewBoundary } from "../core/boundary.js";
import { useTradingViewElement, useTradingViewInView, useTradingViewStatusChange, useTradingViewTokenBridge } from "../core/use-tradingview.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { createElement, useEffect } from "react";
//#region src/integrations/tradingview/web-components/web-component.tsx
/**
* The one Web Component adapter.
*
* The custom element is rendered by React (in SSR markup too), so before the
* provider module arrives the browser simply paints the placeholder children —
* TradingView's own documented graceful-degradation path. When the element
* upgrades, its closed shadow root takes over and the light DOM stops painting,
* which is why no overlay is needed and why the provider's UI can never be
* covered by LUC.
*/
function TradingViewWebComponent({ definition, settings, derived, urlParams, onSymbolNavigate, symbolUrl, height, minHeight, className, title, theme: themeProp, inheritTheme = true, transparent = false, loading = "lazy", locale, timeoutMs, config, onStatusChange, placeholder, fallback, children, ...aria }) {
	const resolvedLocale = defaultLocale(locale);
	const url = tradingViewModuleUrl(definition, resolvedLocale, urlParams);
	const { ref: boxRef, inView } = useTradingViewInView(loading);
	const { theme: resolvedTheme, style } = useTradingViewTokenBridge({
		theme: themeProp,
		inheritTheme,
		transparent
	});
	const { status, error, retry } = useTradingViewElement({
		url,
		tag: definition.element ?? "",
		active: inView,
		timeoutMs
	});
	useTradingViewStatusChange(status, error, onStatusChange);
	useEffect(() => {
		const element = definition.element ? boxRef.current?.querySelector(definition.element) : null;
		if (!element || !onSymbolNavigate) return;
		const handler = (event) => {
			const detail = event.detail;
			if (!detail?.href) return;
			event.preventDefault();
			onSymbolNavigate(detail);
		};
		element.addEventListener("tv-link-open", handler);
		return () => element.removeEventListener("tv-link-open", handler);
	}, [
		boxRef,
		definition.element,
		onSymbolNavigate,
		status
	]);
	const attributes = buildWebComponentAttributes({
		definition,
		props: settings ?? {},
		extras: {
			...derived,
			...locale ? { locale } : {}
		},
		config
	});
	if (transparent && definition.supports.transparent) attributes.transparent = "";
	if (symbolUrl && definition.supports.symbolUrl) attributes["symbol-url"] = symbolUrl;
	const boxStyle = {
		height: typeof height === "number" ? `${height}px` : height ?? `${definition.defaultHeight}px`,
		minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight
	};
	const elementProps = {
		...attributes,
		theme: resolvedTheme,
		"data-luc-tv-widget": definition.id,
		style: {
			display: "block",
			width: "100%",
			...style ?? {}
		}
	};
	for (const [key, value] of Object.entries(elementProps)) if (value === void 0) delete elementProps[key];
	else if (value === true) elementProps[key] = "";
	return /* @__PURE__ */ jsx(TradingViewBoundary, {
		resetKey: url,
		children: /* @__PURE__ */ jsxs("div", {
			ref: boxRef,
			className: cn("relative w-full min-w-0", className),
			style: boxStyle,
			role: "group",
			"aria-label": aria["aria-label"] ?? title ?? definition.name,
			"data-luc-tv-status": status,
			children: [status === "error" ? fallback ?? /* @__PURE__ */ jsx(TradingViewWidgetError, { action: /* @__PURE__ */ jsx(TradingViewRetryAction, { onRetry: retry }) }) : createElement(definition.element ?? "div", elementProps, status === "ready" ? null : placeholder ?? /* @__PURE__ */ jsx(TradingViewWidgetSkeleton, {})), children]
		})
	});
}
//#endregion
export { TradingViewWebComponent };

//# sourceMappingURL=web-component.js.map