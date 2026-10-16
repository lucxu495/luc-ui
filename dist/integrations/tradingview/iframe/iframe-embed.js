"use client";
import { cn } from "../../../utils/cn.js";
import "../core/catalog.js";
import { TradingViewRetryAction, TradingViewWidgetError, TradingViewWidgetSkeleton } from "../core/surface.js";
import { TradingViewBoundary } from "../core/boundary.js";
import { createTradingViewEmbed } from "../core/loader.js";
import { useTradingViewInView, useTradingViewStatusChange, useTradingViewTheme } from "../core/use-tradingview.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
//#region src/integrations/tradingview/iframe/iframe-embed.tsx
/**
* Build the provider's own container and inject its embed script.
*
* Extracted from the effect so that a construction failure — the loader
* refusing a URL, or any broken invariant — can be caught and turned into this
* widget's error state. A React error boundary does **not** see a throw from a
* `useEffect`, so an uncaught one here would unmount the whole page.
*/
function mountProviderEmbed(options) {
	const { scriptUrl, host, providerConfig, attribution, onError } = options;
	const container = document.createElement("div");
	container.className = "tradingview-widget-container";
	container.style.height = "100%";
	container.style.width = "100%";
	const target = document.createElement("div");
	target.className = "tradingview-widget-container__widget";
	target.style.height = "calc(100% - 32px)";
	target.style.width = "100%";
	const copyright = document.createElement("div");
	copyright.className = "tradingview-widget-copyright";
	const anchors = [attribution, ...attribution.trailing ?? []];
	anchors.forEach((entry, index) => {
		if (index > 0) {
			const last = index === anchors.length - 1 && anchors.length > 1;
			const comma = document.createElement("span");
			comma.className = last ? "and" : "comma";
			comma.textContent = last ? "\xA0and\xA0" : ", ";
			copyright.append(comma);
		}
		const link = document.createElement("a");
		link.href = entry.href || `https://www.tradingview.com/`;
		link.rel = "noopener nofollow";
		link.target = "_blank";
		const label = document.createElement("span");
		label.className = "blue-text";
		label.textContent = entry.label;
		link.append(label);
		copyright.append(link);
	});
	const trademark = document.createElement("span");
	trademark.className = "trademark";
	trademark.textContent = attribution.trailing?.length ? "\xA0by TradingView" : " by TradingView";
	copyright.append(trademark);
	container.append(target, copyright);
	host.replaceChildren(container);
	return createTradingViewEmbed({
		scriptUrl,
		container,
		target,
		config: providerConfig,
		onError
	});
}
/**
* The one iframe adapter.
*
* React owns a single empty host; everything inside it — the provider's
* container, its `__widget` element, the attribution block and the embed script
* — is built imperatively, because the provider *replaces* the node it is given
* with its iframe. Letting React manage those nodes would leave React's tree
* describing elements that no longer exist, and the resulting removal error
* would only show up on unmount (and in StrictMode).
*
* The attribution block is part of that markup on purpose: it is the provider's
* own copyright element, exactly as the official snippet ships it, and nothing
* here can cover it.
*/
function TradingViewIframe({ definition, providerConfig, attribution, footnote, height, minHeight, className, title, theme: themeProp, loading = "lazy", timeoutMs, onStatusChange, fallback }) {
	const hostRef = useRef(null);
	const { ref: inViewRef, inView } = useTradingViewInView(loading);
	const theme = useTradingViewTheme(themeProp);
	const [status, setStatus] = useState("idle");
	const [error, setError] = useState(void 0);
	const [attempt, setAttempt] = useState(0);
	const hydrated = useSyncExternalStore(() => () => {}, () => true, () => false);
	const configKey = useMemo(() => JSON.stringify(providerConfig), [providerConfig]);
	const attributionKey = useMemo(() => JSON.stringify(attribution), [attribution]);
	const liveRef = useRef({
		providerConfig,
		attribution
	});
	useEffect(() => {
		liveRef.current = {
			providerConfig,
			attribution
		};
	});
	useEffect(() => {
		if (!hydrated || !inView || !definition.scriptUrl) return;
		const host = hostRef.current;
		if (!host) return;
		let cancelled = false;
		setStatus("loading");
		setError(void 0);
		const embed = mountProviderEmbed({
			scriptUrl: definition.scriptUrl ?? "",
			host,
			providerConfig: liveRef.current.providerConfig,
			attribution: liveRef.current.attribution,
			onError: (cause) => {
				if (cancelled) return;
				setError(cause);
				setStatus("error");
			}
		});
		const timer = timeoutMs ? window.setTimeout(() => {
			if (cancelled) return;
			setError(/* @__PURE__ */ new Error(`[luc-ui] The TradingView embed did not load within ${timeoutMs}ms.`));
			setStatus("error");
		}, timeoutMs) : void 0;
		embed.ready.then(() => {
			if (cancelled) return;
			if (timer) window.clearTimeout(timer);
			setStatus("ready");
		}, () => {
			if (cancelled) return;
			if (timer) window.clearTimeout(timer);
			setStatus("error");
		});
		return () => {
			cancelled = true;
			if (timer) window.clearTimeout(timer);
			embed.destroy();
		};
	}, [
		attempt,
		attributionKey,
		configKey,
		definition.scriptUrl,
		hydrated,
		inView,
		timeoutMs
	]);
	useTradingViewStatusChange(status, error, onStatusChange);
	const boxStyle = {
		height: typeof height === "number" ? `${height}px` : height ?? `${definition.defaultHeight}px`,
		minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight
	};
	return /* @__PURE__ */ jsx(TradingViewBoundary, {
		resetKey: definition.scriptUrl,
		children: /* @__PURE__ */ jsxs("div", {
			ref: inViewRef,
			className: cn("relative w-full min-w-0", className),
			style: boxStyle,
			role: "group",
			"aria-label": title ?? definition.name,
			"data-luc-tv-theme": theme,
			"data-luc-tv-status": status,
			children: [
				/* @__PURE__ */ jsx("div", {
					ref: hostRef,
					className: "absolute inset-0"
				}),
				status === "error" ? /* @__PURE__ */ jsx("div", {
					className: "absolute inset-0",
					children: fallback ?? /* @__PURE__ */ jsx(TradingViewWidgetError, { action: /* @__PURE__ */ jsx(TradingViewRetryAction, { onRetry: () => {
						setAttempt((value) => value + 1);
					} }) })
				}) : null,
				status === "idle" || status === "loading" ? /* @__PURE__ */ jsx("div", {
					className: "absolute inset-0",
					children: /* @__PURE__ */ jsx(TradingViewWidgetSkeleton, {})
				}) : null,
				footnote ? /* @__PURE__ */ jsx("div", {
					className: "sr-only",
					children: footnote
				}) : null
			]
		})
	});
}
//#endregion
export { TradingViewIframe };

//# sourceMappingURL=iframe-embed.js.map