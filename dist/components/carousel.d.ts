//#region src/components/carousel.d.ts
/**
 * LUC Carousel — a horizontal rail of items.
 *
 * Dependency-free on purpose. The native `scroll-snap` engine already gives us
 * momentum, a rubber band, RTL correctness, trackpad gestures and touch, and it
 * does it on the compositor. A JS transform carousel has to re-implement all of
 * that and still loses the platform's own momentum; the only things missing are
 * controls and a keyboard contract, which is what this file adds.
 *
 * Accessibility properties that the contract enforces:
 *
 *  · The track is a labelled `region` with `tabindex="0"`, so it is reachable
 *    and arrow-scrollable from the keyboard (the browser owns the scrolling).
 *  · `aria-roledescription="carousel"` plus a polite live region announce the
 *    current slide *only when it changes*, never on every scroll event.
 *  · Controls are real buttons with names; `aria-controls` ties them to the rail.
 *  · Autoplay is opt-in, pauses on hover, focus and when the tab is hidden, and
 *    stops entirely under `prefers-reduced-motion` — a carousel that moves
 *    without being asked is a trap for anyone reading slowly.
 */
interface CarouselContextValue {
  trackId: string;
  index: number;
  setIndex: (index: number) => void;
  count: number;
  setCount: (count: number) => void;
  scrollTo: (index: number) => void;
}
export interface CarouselProps extends React.ComponentPropsWithRef<"section"> {
  /** Required: a carousel is a landmark and must be named. */
  label: string;
  /** Controlled index. */
  index?: number;
  /** Uncontrolled start index. */
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Advance automatically. Off by default. */
  autoplay?: boolean;
  /** Autoplay interval in ms. Default 6000. */
  interval?: number;
  /** Human-readable announcement for the current slide. */
  itemLabel?: (index: number, count: number) => string;
}
export declare function Carousel({ className, label, index, defaultIndex, onIndexChange, autoplay, interval, itemLabel, children, ...props }: CarouselProps): import("react").JSX.Element;
export interface CarouselTrackProps extends React.ComponentPropsWithRef<"div"> {
  /** Item width. The track owns the rhythm so every item matches. */
  itemWidth?: string;
  /** Gap between items. Default `1rem`. */
  gap?: string;
}
export declare function CarouselTrack({ className, itemWidth, gap, children, style, ...props }: CarouselTrackProps): import("react").JSX.Element;
export interface CarouselItemProps extends React.ComponentPropsWithRef<"div"> {
  /** Accessible name for the slide, e.g. "Product 1 of 6". */
  label?: string;
  width?: string;
  /** Injected by `CarouselTrack`. Do not pass manually. */
  index?: number;
  /** Injected by `CarouselTrack`. Do not pass manually. */
  count?: number;
}
export declare function CarouselItem({ className, label, width, index, count, children, ...props }: CarouselItemProps): import("react").JSX.Element;
export interface CarouselControlsProps extends React.ComponentPropsWithRef<"div"> {
  /** Render dot indicators. Default `true`. */
  dots?: boolean;
  /** Render previous/next buttons. Default `true`. */
  arrows?: boolean;
  previousLabel?: string;
  nextLabel?: string;
  /** Accessible name for the dot tablist. Defaults to English. */
  dotsLabel?: string;
}
export declare function CarouselControls({ className, dots, arrows, previousLabel, nextLabel, dotsLabel, ...props }: CarouselControlsProps): import("react").JSX.Element;
/** Read-only access for a consumer that wants to build its own controls. */
export declare function useCarousel(): Omit<CarouselContextValue, "setCount">;
//#endregion
export {};
//# sourceMappingURL=carousel.d.ts.map