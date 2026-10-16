"use client";

import { Tooltip as RadixTooltip } from "radix-ui";
import type { ReactNode } from "react";
import { ThemeProvider, type ThemeMode } from "./theme-provider";

export interface LucProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeMode;
  storageKey?: string;
  /**
   * Delay before a hovered tooltip appears, shared by every tooltip in the tree
   * so the app has one tooltip rhythm instead of one per component.
   */
  tooltipDelayDuration?: number;
}

/**
 * LUC UI root provider.
 *
 * Wraps the theme and the shared tooltip timing. Render it once, as high in the
 * tree as possible — a product should not have to remember which Radix
 * provider each primitive needs.
 */
export function LucProvider({
  children,
  defaultTheme = "system",
  storageKey = "luc-ui-theme",
  tooltipDelayDuration = 220,
}: LucProviderProps) {
  return (
    <ThemeProvider defaultTheme={defaultTheme} storageKey={storageKey}>
      <RadixTooltip.Provider delayDuration={tooltipDelayDuration} skipDelayDuration={300}>
        {children}
      </RadixTooltip.Provider>
    </ThemeProvider>
  );
}
