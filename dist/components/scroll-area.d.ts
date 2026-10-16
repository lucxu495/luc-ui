import { ScrollArea } from "radix-ui";
//#region src/components/scroll-area.d.ts
/**
 * LUC ScrollArea — a scroll region with a themed, always-consistent scrollbar.
 *
 * Why a component and not `overflow-auto`: a native scrollbar is painted by the
 * platform, so it is a different width, colour and corner radius on every OS,
 * it disappears on macOS until you scroll, and it overlaps the last row of a
 * table. Radix gives us one scrollbar element we can style, plus
 * `type="scroll"` / `"hover"` / `"always"` / `"auto"` behaviour and the
 * `ScrollAreaCorner` that keeps two axes from overlapping.
 *
 * It is the missing piece under several overlays (a long Command list, a Sheet's
 * body, a DataTable's horizontal axis), so it lives in the core entry rather
 * than in a subpath.
 */
export declare const ScrollAreaRoot: import("react").ForwardRefExoticComponent<ScrollArea.ScrollAreaProps & import("react").RefAttributes<HTMLDivElement>>;
export interface ScrollAreaProps extends React.ComponentPropsWithRef<typeof ScrollArea.Root> {
  /** Scrollbar visibility policy. `hover` is the default — present, not loud. */
  type?: "auto" | "always" | "scroll" | "hover";
  /** Viewport class. Height, padding and layout belong here. */
  viewportClassName?: string;
  /** Fixed size for both scrollbars, in px. */
  scrollbarSize?: number;
  /** Render the corner filler between the two scrollbars. Default `true`. */
  corner?: boolean;
  children?: React.ReactNode;
}
declare function ScrollArea$1({ className, viewportClassName, type, scrollbarSize, corner, children, ...props }: ScrollAreaProps): import("react").JSX.Element;
//#endregion
export { ScrollArea$1 as ScrollArea };
//# sourceMappingURL=scroll-area.d.ts.map