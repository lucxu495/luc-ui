"use client";

import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  cloneElement,
} from "react";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import { cn } from "../utils/cn";
import { IconButton } from "./icon-button";

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

const CarouselContext = createContext<CarouselContextValue | null>(null);

function useCarouselContext(component: string): CarouselContextValue {
  const value = useContext(CarouselContext);
  if (!value) throw new Error(`${component} must be used inside <Carousel> — see the Showcase page.`);
  return value;
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

export function Carousel({
  className,
  label,
  index,
  defaultIndex = 0,
  onIndexChange,
  autoplay = false,
  interval = 6000,
  itemLabel,
  children,
  ...props
}: CarouselProps) {
  /*
   * `useId` rather than a random string: the links between the track and its
   * controls must survive hydration, and a random id would differ between the
   * server and the client render (a real `aria-controls` mismatch).
   */
  const trackId = `luc-carousel-${useId()}`;
  const [internalIndex, setInternalIndex] = useState(defaultIndex);
  const [count, setCount] = useState(0);
  const current = index ?? internalIndex;
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const setIndex = useCallback(
    (next: number) => {
      if (index === undefined) setInternalIndex(next);
      onIndexChange?.(next);
    },
    [index, onIndexChange],
  );

  const scrollTo = useCallback((next: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const slide = viewport.querySelector<HTMLElement>(`[data-carousel-index="${next}"]`);
    if (!slide) return;
    const target = slide.offsetLeft - viewport.offsetLeft;
    /*
     * `scrollTo` does not exist in every environment (jsdom, very old Safari),
     * so the fallback is a plain assignment rather than a crash — the rail is
     * still usable, it just jumps.
     */
    if (typeof viewport.scrollTo === "function") {
      viewport.scrollTo({ left: target, behavior: "smooth" });
    } else {
      viewport.scrollLeft = target;
    }
  }, []);

  /*
   * The rail reports its own resting slide. Reading `scrollLeft` on the scroll
   * event keeps React out of the pointer path entirely: there is no re-render
   * per frame, only one when the snapped slide actually changes.
   */
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const slides = Array.from(viewport.querySelectorAll<HTMLElement>("[data-carousel-index]"));
        if (slides.length === 0) return;
        const center = viewport.scrollLeft + viewport.clientWidth / 2;
        let nearest = 0;
        let distance = Number.POSITIVE_INFINITY;
        for (const slide of slides) {
          const slideCenter = slide.offsetLeft - viewport.offsetLeft + slide.clientWidth / 2;
          const next = Math.abs(slideCenter - center);
          if (next < distance) {
            distance = next;
            nearest = Number(slide.dataset.carouselIndex ?? 0);
          }
        }
        setIndex(nearest);
      });
    };
    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("scroll", onScroll);
    };
  }, [setIndex]);

  useEffect(() => {
    if (!autoplay || count <= 1) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    let paused = false;
    const pause = () => {
      paused = true;
    };
    const resume = () => {
      paused = false;
    };
    viewport.addEventListener("pointerenter", pause);
    viewport.addEventListener("pointerleave", resume);
    viewport.addEventListener("focusin", pause);
    viewport.addEventListener("focusout", resume);
    const timer = window.setInterval(() => {
      if (paused || document.hidden) return;
      scrollTo((current + 1) % count);
    }, interval);
    return () => {
      window.clearInterval(timer);
      viewport.removeEventListener("pointerenter", pause);
      viewport.removeEventListener("pointerleave", resume);
      viewport.removeEventListener("focusin", pause);
      viewport.removeEventListener("focusout", resume);
    };
  }, [autoplay, count, current, interval, scrollTo]);

  const value: CarouselContextValue = {
    trackId,
    index: current,
    setIndex,
    count,
    setCount,
    scrollTo,
  };

  return (
    <CarouselContext.Provider value={value}>
      <section
        data-slot="carousel"
        aria-roledescription="carousel"
        aria-label={label}
        className={cn("relative flex flex-col gap-3", className)}
        {...props}
      >
        <div ref={viewportRef} data-slot="carousel-viewport" className="contents">
          {children}
        </div>
        <span aria-live="polite" aria-atomic="true" className="sr-only">
          {count > 0
            ? (itemLabel?.(current, count) ?? `Slide ${current + 1} of ${count}`)
            : null}
        </span>
      </section>
    </CarouselContext.Provider>
  );
}

export interface CarouselTrackProps extends React.ComponentPropsWithRef<"div"> {
  /** Item width. The track owns the rhythm so every item matches. */
  itemWidth?: string;
  /** Gap between items. Default `1rem`. */
  gap?: string;
}

export function CarouselTrack({
  className,
  itemWidth = "min(20rem, 82%)",
  gap = "1rem",
  children,
  style,
  ...props
}: CarouselTrackProps) {
  const { trackId, setCount } = useCarouselContext("CarouselTrack");
  const items = Children.toArray(children);

  /*
   * The track owns the count, because the track is the only place that can see
   * every slide. Reporting it here (rather than asking the consumer to pass
   * `count`) keeps the dots and the arrows correct when items are conditional.
   */
  useEffect(() => {
    setCount(items.length);
  }, [items.length, setCount]);

  return (
    <div
      id={trackId}
      data-slot="carousel-track"
      /*
       * A horizontally scrollable region must be reachable from the keyboard:
       * a keyboard user cannot drag a rail, so `tabindex` plus arrow scrolling
       * is the only way in. `role="region"` with the carousel's own label is the
       * recommended pattern (the same reason a scrollable table needs one).
       */
      tabIndex={0}
      role="region"
      aria-roledescription="carousel track"
      className={cn(
        "flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth",
        "pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "luc-focus-inset",
        className,
      )}
      style={{ gap, scrollPaddingInline: gap, ...style }}
      data-item-width={itemWidth}
      {...props}
    >
      {items.map((child, position) =>
        isValidElement<CarouselItemProps>(child)
          ? cloneElement(child, { index: position, count: items.length, width: child.props.width ?? itemWidth } as Partial<CarouselItemProps>)
          : child,
      )}
    </div>
  );
}

export interface CarouselItemProps extends React.ComponentPropsWithRef<"div"> {
  /** Accessible name for the slide, e.g. "Product 1 of 6". */
  label?: string;
  width?: string;
  /** Injected by `CarouselTrack`. Do not pass manually. */
  index?: number;
  /** Injected by `CarouselTrack`. Do not pass manually. */
  count?: number;
}

export function CarouselItem({
  className,
  label,
  width,
  index = 0,
  count = 0,
  children,
  ...props
}: CarouselItemProps) {
  return (
    <div
      data-slot="carousel-item"
      data-carousel-index={index}
      role="group"
      aria-roledescription="slide"
      aria-label={label ?? `Slide ${index + 1}${count ? ` of ${count}` : ""}`}
      className={cn("shrink-0 snap-start", className)}
      style={{ width, flexBasis: width }}
      {...props}
    >
      {children}
    </div>
  );
}

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

export function CarouselControls({
  className,
  dots = true,
  arrows = true,
  previousLabel = "Previous slide",
  nextLabel = "Next slide",
  dotsLabel = "Slides",
  ...props
}: CarouselControlsProps) {
  const { index, count, scrollTo, setIndex, trackId } = useCarouselContext("CarouselControls");
  return (
    <div
      data-slot="carousel-controls"
      className={cn("flex items-center justify-between gap-3", className)}
      {...props}
    >
      {dots ? (
        <div className="flex items-center gap-0.5" role="tablist" aria-label={dotsLabel}>
          {Array.from({ length: count }).map((_, position) => (
            <button
              key={position}
              type="button"
              role="tab"
              aria-selected={position === index}
              aria-controls={trackId}
              aria-label={`Go to slide ${position + 1}`}
              /*
               * The index moves immediately and the scroll follows: the live
               * region and any consumer state must not lag a smooth scroll.
               */
              onClick={() => {
                setIndex(position);
                scrollTo(position);
              }}
              /*
               * A dot is 8px, but its *target* is 24px: the button is the target
               * and the visible dot is inside it. WCAG 2.5.8 asks for 24×24, and
               * a carousel whose dots cannot be hit on a phone is decoration.
               */
              className="grid size-6 place-items-center rounded-full luc-focus"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "block h-2 rounded-full luc-transition",
                  position === index
                    ? "w-5 bg-accent-default shadow-[var(--glow-subtle)]"
                    : "w-2 bg-line-strong group-hover/carousel:bg-fg-muted",
                )}
              />
            </button>
          ))}
        </div>
      ) : (
        <span />
      )}
      {arrows ? (
        <div className="flex items-center gap-2">
          <IconButton
            variant="solid"
            size="sm"
            label={previousLabel}
            icon={<RiArrowLeftSLine />}
            disabled={index <= 0}
            onClick={() => {
              setIndex(index - 1);
              scrollTo(index - 1);
            }}
          />
          <IconButton
            variant="solid"
            size="sm"
            label={nextLabel}
            icon={<RiArrowRightSLine />}
            disabled={index >= count - 1}
            onClick={() => {
              setIndex(index + 1);
              scrollTo(index + 1);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

/** Read-only access for a consumer that wants to build its own controls. */
export function useCarousel(): Omit<CarouselContextValue, "setCount"> {
  const { trackId, index, setIndex, count, scrollTo } = useCarouselContext("useCarousel");
  return { trackId, index, setIndex, count, scrollTo };
}
