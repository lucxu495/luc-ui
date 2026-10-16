"use client";
import { jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
//#region src/providers/theme-provider.tsx
const ThemeContext = createContext(null);
const DARK_QUERY = "(prefers-color-scheme: dark)";
function systemTheme() {
	if (typeof window === "undefined") return "dark";
	return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}
function readStoredTheme(storageKey, fallback) {
	if (typeof window === "undefined") return fallback;
	const stored = window.localStorage.getItem(storageKey);
	return stored === "dark" || stored === "light" || stored === "system" ? stored : fallback;
}
function applyTheme(resolved, attribute) {
	const root = document.documentElement;
	root.classList.toggle("dark", resolved === "dark");
	root.dataset.theme = resolved;
	root.style.colorScheme = resolved;
	if (attribute === "data-theme") {}
}
/**
* Owns theme state for LUC products.
*
* LUC UI deliberately ships its own ~100 line provider instead of depending on
* a framework-specific one: the contract is small (class + data attribute +
* localStorage) and the design system must stay portable across products.
*
* Use `lucThemeInitScript()` in a blocking `<script>` (or `<head>`) to avoid a
* flash of the wrong theme on first paint.
*/
function ThemeProvider({ children, defaultTheme = "system", storageKey = "luc-ui-theme", attribute = "class" }) {
	const [theme, setThemeState] = useState(defaultTheme);
	const [resolvedTheme, setResolvedTheme] = useState("dark");
	useEffect(() => {
		const initial = readStoredTheme(storageKey, defaultTheme);
		setThemeState(initial);
		const resolved = initial === "system" ? systemTheme() : initial;
		setResolvedTheme(resolved);
		applyTheme(resolved, attribute);
	}, [
		attribute,
		defaultTheme,
		storageKey
	]);
	useEffect(() => {
		if (theme !== "system") return;
		const list = window.matchMedia(DARK_QUERY);
		const onChange = () => {
			const resolved = systemTheme();
			setResolvedTheme(resolved);
			applyTheme(resolved, attribute);
		};
		list.addEventListener("change", onChange);
		return () => list.removeEventListener("change", onChange);
	}, [attribute, theme]);
	const setTheme = useCallback((next) => {
		setThemeState(next);
		window.localStorage.setItem(storageKey, next);
		const resolved = next === "system" ? systemTheme() : next;
		setResolvedTheme(resolved);
		applyTheme(resolved, attribute);
	}, [attribute, storageKey]);
	const toggleTheme = useCallback(() => {
		setTheme(resolvedTheme === "dark" ? "light" : "dark");
	}, [resolvedTheme, setTheme]);
	const value = useMemo(() => ({
		theme,
		resolvedTheme,
		setTheme,
		toggleTheme
	}), [
		resolvedTheme,
		setTheme,
		theme,
		toggleTheme
	]);
	return /* @__PURE__ */ jsx(ThemeContext.Provider, {
		value,
		children
	});
}
function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) throw new Error("useTheme must be used inside <ThemeProvider> from @luc/ui.");
	return context;
}
/**
* Context-free variant for components that also work outside `LucProvider`
* (portalled overlays, the Toaster). Returns `null` instead of throwing so a
* component can fall back to a sane default rather than crash a product that
* has not adopted the provider yet.
*/
function useOptionalTheme() {
	return useContext(ThemeContext);
}
//#endregion
export { ThemeProvider, useOptionalTheme, useTheme };

//# sourceMappingURL=theme-provider.js.map