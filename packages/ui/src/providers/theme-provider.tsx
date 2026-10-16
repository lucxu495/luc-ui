"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemeMode = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

export interface ThemeContextValue {
  /** User/agent intent: an explicit theme or "system". */
  theme: ThemeMode;
  /** What is actually painted right now. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  /** Flip between light and dark, leaving "system" behind. */
  toggleTheme: () => void;
}

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeMode;
  storageKey?: string;
  /** Attribute written on `<html>`. `class` drives the `dark:` variant. */
  attribute?: "class" | "data-theme";
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DARK_QUERY = "(prefers-color-scheme: dark)";

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function readStoredTheme(storageKey: string, fallback: ThemeMode): ThemeMode {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(storageKey);
  return stored === "dark" || stored === "light" || stored === "system" ? stored : fallback;
}

function applyTheme(resolved: ResolvedTheme, attribute: "class" | "data-theme") {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  if (attribute === "data-theme") {
    // class is still applied above so Tailwind's `dark:` variant keeps working.
  }
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
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "luc-ui-theme",
  attribute = "class",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");

  useEffect(() => {
    /*
     * Reads the stored theme and the OS preference on mount, then writes the
     * result onto <html>. The blocking init script already painted the right
     * theme; this only reconciles React state with the DOM.
     */
    const initial = readStoredTheme(storageKey, defaultTheme);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage + matchMedia
    setThemeState(initial);
    const resolved = initial === "system" ? systemTheme() : initial;
    setResolvedTheme(resolved);
    applyTheme(resolved, attribute);
  }, [attribute, defaultTheme, storageKey]);

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

  const setTheme = useCallback(
    (next: ThemeMode) => {
      setThemeState(next);
      window.localStorage.setItem(storageKey, next);
      const resolved = next === "system" ? systemTheme() : next;
      setResolvedTheme(resolved);
      applyTheme(resolved, attribute);
    },
    [attribute, storageKey],
  );

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [resolvedTheme, setTheme, theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside <ThemeProvider> from @luc/ui.");
  }
  return context;
}

/**
 * Context-free variant for components that also work outside `LucProvider`
 * (portalled overlays, the Toaster). Returns `null` instead of throwing so a
 * component can fall back to a sane default rather than crash a product that
 * has not adopted the provider yet.
 */
export function useOptionalTheme(): ThemeContextValue | null {
  return useContext(ThemeContext);
}
