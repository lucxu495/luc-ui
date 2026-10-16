"use client";

import { ScrollArea as RadixScrollArea } from "radix-ui";
import { cn } from "../utils/cn";

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

export const ScrollAreaRoot = RadixScrollArea.Root;

export interface ScrollAreaProps extends React.ComponentPropsWithRef<typeof RadixScrollArea.Root> {
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

export function ScrollArea({
  className,
  viewportClassName,
  type = "hover",
  scrollbarSize = 10,
  corner = true,
  children,
  ...props
}: ScrollAreaProps) {
  const scrollbarClass = cn(
    "flex touch-none select-none p-0.5 luc-transition",
    "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2.5 data-[orientation=vertical]:border-l data-[orientation=vertical]:border-l-transparent",
    "data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:border-t data-[orientation=horizontal]:border-t-transparent",
  );
  const thumbClass = cn(
    "relative flex-1 rounded-full bg-line-strong",
    "before:absolute before:top-1/2 before:left-1/2 before:size-full before:min-h-6 before:min-w-6 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']",
    "hover:bg-fg-disabled",
  );

  return (
    <RadixScrollArea.Root
      data-slot="scroll-area"
      type={type}
      scrollHideDelay={600}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <RadixScrollArea.Viewport
        data-slot="scroll-area-viewport"
        /*
         * A scroll region must be reachable from the keyboard: a keyboard user
         * cannot drag a scrollbar, so the viewport itself takes the tab stop
         * (WCAG 2.1.1, and the same rule `CarouselTrack` follows).
         */
        tabIndex={0}
        className={cn("size-full rounded-[inherit] outline-none luc-focus-inset", viewportClassName)}
      >
        {children}
      </RadixScrollArea.Viewport>
      <RadixScrollArea.Scrollbar
        orientation="vertical"
        style={{ width: scrollbarSize }}
        className={scrollbarClass}
      >
        <RadixScrollArea.Thumb className={thumbClass} />
      </RadixScrollArea.Scrollbar>
      <RadixScrollArea.Scrollbar
        orientation="horizontal"
        style={{ height: scrollbarSize }}
        className={scrollbarClass}
      >
        <RadixScrollArea.Thumb className={thumbClass} />
      </RadixScrollArea.Scrollbar>
      {corner ? <RadixScrollArea.Corner className="bg-transparent" /> : null}
    </RadixScrollArea.Root>
  );
}
