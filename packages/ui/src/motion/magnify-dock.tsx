"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { cn } from "../utils/cn";
import { useMotionProfile } from "./intensity";

interface DockContextValue {
  register: (node: HTMLElement | null) => void;
}

const DockContext = createContext<DockContextValue | null>(null);

export interface MagnifyDockProps extends React.ComponentPropsWithRef<"div"> {
  /** Distance in px at which a neighbour starts to grow. */
  range?: number;
  /** Extra scale at the very centre of an item. `0.55` is the house default. */
  scale?: number;
  /** Rise in px at the very centre of an item. */
  lift?: number;
  /** Lanes stack vertically; every other use is horizontal. */
  orientation?: "horizontal" | "vertical";
}

/**
 * LUC MagnifyDock — a row of actions that swells toward the pointer.
 *
 * The interaction physics of the macOS dock, applied to product toolbars: a
 * chart's range controls, a canvas' tool rail, an editor's formatting strip, a
 * media viewer's transport. It answers the most basic question a dense toolbar
 * raises ("which of these am I about to hit?") without a tooltip.
 *
 * Why it is implemented the way it is:
 *
 *  - **Pointer move never re-renders React.** The container holds a list of
 *    element references and writes two custom properties straight onto them
 *    inside one rAF. Twenty items cost the same as two.
 *  - **The geometry is a cosine falloff**, so an item's neighbours swell
 *    smoothly rather than popping at an invisible boundary.
 *  - **Rest state is real state.** Items are laid out at their normal size, so
 *    the dock is fully usable (and keyboard-navigable) with no pointer at all,
 *    on a touch device, and under reduced motion — where the listeners are never
 *    attached in the first place.
 */
export function MagnifyDock({
  className,
  children,
  range = 130,
  scale = 0.55,
  lift = 7,
  orientation = "horizontal",
  onPointerMove,
  onPointerLeave,
  ...props
}: MagnifyDockProps) {
  const profile = useMotionProfile();
  const enabled = profile.pointer && profile.travel > 0;
  const items = useRef<Set<HTMLElement>>(new Set());
  const frame = useRef<number | null>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);

  const register = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    items.current.add(node);
    return () => {
      items.current.delete(node);
    };
  }, []);

  const context = useMemo<DockContextValue>(() => ({ register }), [register]);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    },
    [],
  );

  const paint = useCallback(() => {
    frame.current = null;
    const point = pointer.current;
    items.current.forEach((node) => {
      if (!point) {
        node.style.removeProperty("--dock-scale");
        node.style.removeProperty("--dock-lift");
        return;
      }
      const rect = node.getBoundingClientRect();
      const centre =
        orientation === "horizontal"
          ? { x: rect.left + rect.width / 2, y: point.y }
          : { x: point.x, y: rect.top + rect.height / 2 };
      const distance =
        orientation === "horizontal"
          ? Math.abs(point.x - centre.x)
          : Math.abs(point.y - centre.y);
      // Cosine bell: 1 at the centre, 0 at `range`, with a smooth shoulder.
      const influence = distance >= range ? 0 : 0.5 + 0.5 * Math.cos((distance / range) * Math.PI);
      const eased = influence * influence;
      node.style.setProperty("--dock-scale", (1 + scale * eased).toFixed(3));
      node.style.setProperty("--dock-lift", (lift * eased).toFixed(2));
    });
  }, [lift, orientation, range, scale]);

  const schedule = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled) return;
      pointer.current = { x: event.clientX, y: event.clientY };
      if (frame.current === null) frame.current = requestAnimationFrame(paint);
    },
    [enabled, paint],
  );

  return (
    <DockContext.Provider value={context}>
      <div
        data-slot="magnify-dock"
        data-orientation={orientation}
        className={cn(
          "flex items-end",
          orientation === "horizontal" ? "flex-row" : "flex-col items-center",
          className,
        )}
        onPointerMove={(event) => {
          schedule(event);
          onPointerMove?.(event);
        }}
        onPointerLeave={(event) => {
          pointer.current = null;
          if (frame.current === null) frame.current = requestAnimationFrame(paint);
          onPointerLeave?.(event);
        }}
        {...props}
      >
        {children}
      </div>
    </DockContext.Provider>
  );
}

export interface MagnifyDockItemProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * The item's accessible name. A dock item is usually a control inside it, so
   * this is only needed when the item itself carries meaning.
   */
  label?: string;
}

/**
 * One lane of a `MagnifyDock`.
 *
 * The element owns the transform and nothing else, so whatever you put inside
 * keeps its own focus ring, its own disabled state and its own semantics. The
 * transition is on `transform` only, which the compositor can animate without
 * touching layout.
 *
 * A labelled item is a `group`, not a bare `div`: `aria-label` on an element
 * whose role is `generic` is prohibited — axe reports it as
 * `aria-prohibited-attr`, and the name it carries reaches no one, because a
 * generic container is not exposed as a named node. `group` is the role that
 * says exactly what the label says ("these children belong together and are
 * called this") without inventing an interactive role the item does not have.
 * An item with no `label` stays a plain `div`.
 */
export function MagnifyDockItem({
  className,
  children,
  label,
  style,
  ...props
}: MagnifyDockItemProps) {
  const context = useContext(DockContext);

  // A ref callback that both registers with the dock and cleans up on unmount.
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      const dispose = context?.register(node);
      return dispose;
    },
    [context],
  );

  return (
    <div
      ref={ref}
      data-slot="magnify-dock-item"
      {...(label ? { role: "group" as const, "aria-label": label } : null)}
      className={cn(
        "origin-bottom luc-transition-slow will-change-transform",
        "motion-safe:transition-transform",
        className,
      )}
      style={{
        transform: "translateY(calc(var(--dock-lift, 0) * -1px)) scale(var(--dock-scale, 1))",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
