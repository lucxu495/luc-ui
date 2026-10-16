"use client";

import { motion } from "motion/react";
import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "../utils/cn";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { spring } from "./tokens";

interface CardStackContextValue {
  index: number;
  count: number;
  setIndex: (next: number) => void;
  step: (delta: number) => void;
  loop: boolean;
}

const CardStackContext = createContext<CardStackContextValue | null>(null);

function useCardStackContext(component: string): CardStackContextValue {
  const context = useContext(CardStackContext);
  if (!context) throw new Error(`<${component}> must be rendered inside <CardStack>.`);
  return context;
}

/** The public hook, for a caller that wants to drive its own controls. */
export function useCardStack(): CardStackContextValue {
  return useCardStackContext("useCardStack");
}

export interface CardStackProps extends Omit<React.ComponentPropsWithRef<"div">, "onKeyDown"> {
  /** Controlled position. Pair with `onIndexChange`. */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** How many cards stay visible behind the active one. */
  visible?: number;
  /** Horizontal offset per layer, in px. Negative fans to the left. */
  offsetX?: number;
  /** Vertical offset per layer, in px. Positive sinks the deck downwards. */
  offsetY?: number;
  /** Scale lost per layer. `0.04` reads as a deck; `0` reads as a strip. */
  shrink?: number;
  /** Rotation per layer, in degrees — a small value fans the deck. */
  spread?: number;
  /**
   * Opacity lost per layer behind the active card.
   *
   * Without it every layer is drawn at full opacity, and a deck whose cards have
   * transparent or semi-transparent surfaces becomes unreadable: the labels of
   * three layers sit on top of each other with nothing to separate them. Depth is
   * the whole point of a stack, so it is expressed on the layer rather than left
   * to every caller to remember. `0` restores the old flat behaviour.
   */
  dim?: number;
  /** Wrap past the ends instead of stopping. */
  loop?: boolean;
  /** Accessible name for the group. */
  label?: string;
}

/**
 * LUC `CardStack` — depth as navigation.
 *
 * Five cards in a row is a carousel; five cards in a deck is a *stack*, and the
 * difference is that a stack tells you where you are: the active card is largest
 * and closest, the ones behind it recede on three axes at once (z, scale and a
 * little rotation), and stepping moves the whole deck rather than sliding a
 * track.
 *
 * It stays usable everywhere:
 *
 *  - Arrow keys, Home and End step the deck; the container is focusable and the
 *    cards behind the active one are `inert`, so Tab can never land inside a card
 *    the user cannot see.
 *  - A horizontal pointer drag (48px threshold, `touch-action: pan-y`) steps on
 *    touch without stealing vertical scrolling.
 *  - Reduced motion keeps the arrangement and drops the travel: positions are
 *    computed the same way, they just resolve instantly.
 *  - A polite live region announces "2 / 5", so the deck is navigable by ear.
 *
 * Direct children should be `CardStackItem`s; anything else is rendered on top
 * of the deck, which is how `<CardStackControls />` gets a place to live.
 */
export function CardStack({
  className,
  children,
  index,
  defaultIndex = 0,
  onIndexChange,
  visible = 3,
  offsetX = 0,
  offsetY = 14,
  shrink = 0.06,
  spread = 0,
  dim = 0.28,
  loop = false,
  label,
  ...props
}: CardStackProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultIndex);
  const reduced = useReducedMotion();
  const dragStart = useRef<number | null>(null);

  const all = useMemo(() => Children.toArray(children), [children]);
  const items = useMemo(
    () => all.filter((child) => isValidElement(child) && child.type === CardStackItem),
    [all],
  );
  const overlays = useMemo(
    () => all.filter((child) => !(isValidElement(child) && child.type === CardStackItem)),
    [all],
  );
  const count = items.length;

  const raw = index ?? uncontrolled;
  const active = count === 0 ? 0 : ((raw % count) + count) % count;

  const setIndex = useCallback(
    (next: number) => {
      if (count === 0) return;
      const clamped = loop ? ((next % count) + count) % count : Math.min(Math.max(next, 0), count - 1);
      if (index === undefined) setUncontrolled(clamped);
      if (clamped !== active) onIndexChange?.(clamped);
    },
    [active, count, index, loop, onIndexChange],
  );

  const step = useCallback((delta: number) => setIndex(active + delta), [active, setIndex]);

  const value = useMemo<CardStackContextValue>(
    () => ({ index: active, count, setIndex, step, loop }),
    [active, count, loop, setIndex, step],
  );

  const layer = (position: number) => {
    const depth = Math.min(position, visible);
    return {
      x: depth * offsetX,
      y: depth * offsetY,
      scale: 1 - depth * shrink,
      rotate: depth * spread,
      // Bounded on purpose: the overlay slot below sits at z-10, so a deck of
      // fifty cards cannot push its own controls behind the cards.
      zIndex: Math.min(visible, 3) + 1 - depth,
      /*
       * Recede on a fourth axis: light.
       *
       * Scale alone was not enough — a 0.9-scale card behind a 1.0-scale card is
       * very nearly the same card, so a reader saw three equal panels with their
       * text interleaved. Dimming is what a physical stack does and what every
       * other depth idiom in this library does, and it costs nothing: the layer
       * is already animated, so opacity rides the same spring.
       */
      opacity: position > visible ? 0 : Math.max(0.35, 1 - depth * dim),
    };
  };

  return (
    <CardStackContext.Provider value={value}>
      {/*
       * The deck is a *group* whose interactive contract is the key handler and
       * the pointer drag below; the real controls inside it are the cards and
       * `<CardStackControls />`. The a11y rules assume a focusable element is a
       * widget, which a labelled navigation deck is not.
       */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        data-slot="card-stack"
        data-active={active}
        role="group"
        {...(label ? { "aria-label": label } : {})}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className={cn(
          /*
           * The deck needs a stage.
           *
           * Every layer is `absolute inset-0` — that is what lets one card recede
           * behind another — so the group itself has no intrinsic height, and a
           * caller who only set a width got a zero-height deck whose cards spilled
           * over whatever came next (the Phase 10A.1 report: "collapsed into a
           * shallow preview container", "content visually collided with the code
           * example region"). A default minimum gives the stack the stage it needs;
           * an explicit height in `className` still wins.
           */
          "luc-focus relative isolate min-h-60 select-none [perspective:1200px] [transform-style:preserve-3d]",
          "[touch-action:pan-y]",
          className,
        )}
        onKeyDown={(event) => {
          const keys: Record<string, number> = {
            ArrowRight: 1,
            ArrowDown: 1,
            ArrowLeft: -1,
            ArrowUp: -1,
          };
          if (event.key === "Home") {
            event.preventDefault();
            setIndex(0);
            return;
          }
          if (event.key === "End") {
            event.preventDefault();
            setIndex(count - 1);
            return;
          }
          const delta = keys[event.key];
          if (delta === undefined) return;
          event.preventDefault();
          step(delta);
        }}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse" && event.button !== 0) return;
          dragStart.current = event.clientX;
        }}
        onPointerUp={(event) => {
          const start = dragStart.current;
          dragStart.current = null;
          if (start === null) return;
          const delta = event.clientX - start;
          if (Math.abs(delta) < 48) return;
          step(delta < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          dragStart.current = null;
        }}
        {...props}
      >
        <span role="status" aria-live="polite" className="sr-only">
          {count === 0 ? "" : `${active + 1} / ${count}`}
        </span>

        {items.map((child, itemIndex) => {
          const position = count === 0 ? 0 : (itemIndex - active + count) % count;
          const isActive = position === 0;
          return (
            <motion.div
              key={isValidElement(child) && child.key !== null ? child.key : itemIndex}
              data-slot="card-stack-layer"
              data-position={position}
              aria-hidden={isActive ? undefined : true}
              inert={!isActive}
              className={cn("absolute inset-0 [transform-style:preserve-3d]", !isActive && "pointer-events-none")}
              initial={false}
              animate={layer(position)}
              transition={reduced ? { duration: 0 } : spring.responsive}
            >
              {child}
            </motion.div>
          );
        })}

        {/*
         * Anything that is not a `CardStackItem` renders here, above the deck:
         * controls, a caption, a progress indicator. It is an overlay layer, so
         * position its contents absolutely.
         */}
        {overlays.length > 0 ? (
          <div
            data-slot="card-stack-overlay"
            /*
             * Overlays sit at the *bottom* of the stage by default. They used to
             * start at the stage's top-left corner, which put the previous/next
             * controls on top of the active card's own content — the second half of
             * the reported "controls … clipped" defect.
             */
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-2 p-2 [&>*]:pointer-events-auto"
          >
            {overlays}
          </div>
        ) : null}
      </div>
    </CardStackContext.Provider>
  );
}

/** A card in a `CardStack`. Its position is decided by the stack, not by you. */
export function CardStackItem({ className, children, ...props }: React.ComponentPropsWithRef<"div">) {
  return (
    <div data-slot="card-stack-item" className={cn("h-full w-full", className)} {...props}>
      {children}
    </div>
  );
}

export interface CardStackControlsProps extends React.ComponentPropsWithRef<"div"> {
  /** Accessible names for the two buttons. */
  previousLabel?: string;
  nextLabel?: string;
}

/**
 * Previous/next for a `CardStack`, as a composable slot. It is a separate
 * component rather than a `controls` boolean so a caller can put it anywhere —
 * under the deck, beside it, or inside a toolbar — without the stack growing a
 * prop for every position.
 */
export function CardStackControls({
  className,
  previousLabel = "Previous card",
  nextLabel = "Next card",
  children,
  ...props
}: CardStackControlsProps) {
  const { index, count, step, loop } = useCardStackContext("CardStackControls");
  const atStart = !loop && index === 0;
  const atEnd = !loop && index >= count - 1;
  const buttonClass =
    "luc-focus inline-flex size-8 items-center justify-center rounded-full border border-line-subtle bg-surface-raised text-fg-secondary luc-transition hover:border-line-strong hover:text-fg-primary disabled:opacity-40";

  return (
    <div data-slot="card-stack-controls" className={cn("flex items-center gap-2", className)} {...props}>
      <button type="button" onClick={() => step(-1)} disabled={atStart} aria-label={previousLabel} className={buttonClass}>
        <span aria-hidden="true">‹</span>
      </button>
      <button type="button" onClick={() => step(1)} disabled={atEnd} aria-label={nextLabel} className={buttonClass}>
        <span aria-hidden="true">›</span>
      </button>
      {children}
    </div>
  );
}
