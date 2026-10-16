import { ReactNode } from "react";
//#region src/providers/theme-provider.d.ts
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
export declare function ThemeProvider({ children, defaultTheme, storageKey, attribute }: ThemeProviderProps): import("react").JSX.Element;
export declare function useTheme(): ThemeContextValue;
/**
 * Context-free variant for components that also work outside `LucProvider`
 * (portalled overlays, the Toaster). Returns `null` instead of throwing so a
 * component can fall back to a sane default rather than crash a product that
 * has not adopted the provider yet.
 */
export declare function useOptionalTheme(): ThemeContextValue | null;
//#endregion
//# sourceMappingURL=theme-provider.d.ts.map