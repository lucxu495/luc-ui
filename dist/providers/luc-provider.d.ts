import { ThemeMode } from "./theme-provider.js";
import { ReactNode } from "react";
//#region src/providers/luc-provider.d.ts
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
export declare function LucProvider({ children, defaultTheme, storageKey, tooltipDelayDuration }: LucProviderProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=luc-provider.d.ts.map