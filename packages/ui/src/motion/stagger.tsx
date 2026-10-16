"use client";

import { createContext, useContext } from "react";
import { cn } from "../utils/cn";
import { Reveal } from "./reveal";
import { distance } from "./tokens";

/**
 * LUC StaggerGroup — a short, ordered entrance for a *set* of related items.
 *
 * A dashboard's worth of cards is not a list of unrelated elements: revealing
 * them in reading order tells the eye where to start. The stagger is small
 * (≤60ms per item) and capped, so a twelve-card grid still finishes well under
 * half a second — a slow cascade reads as a broken page.
 *
 * Nothing here re-implements `Reveal`: each item delegates to it, so the
 * viewport trigger, the reduced-motion clamp and the no-JS fail-safe are shared.
 */
export interface StaggerGroupProps extends React.ComponentPropsWithRef<"div"> {
  /** Delay added per item, in seconds. Keep it small. */
  step?: number;
  /** Delay before the first item, in seconds. */
  delay?: number;
  /** Cap the total stagger so a large grid does not crawl. */
  maxItems?: number;
}

const StaggerContext = createContext<{ step: number; delay: number; maxItems: number }>({
  step: 0.045,
  delay: 0,
  maxItems: 8,
});

export function StaggerGroup({
  className,
  children,
  step = 0.045,
  delay = 0,
  maxItems = 8,
  ...props
}: StaggerGroupProps) {
  return (
    <StaggerContext.Provider value={{ step, delay, maxItems }}>
      <div data-slot="stagger-group" className={cn("min-w-0", className)} {...props}>
        {children}
      </div>
    </StaggerContext.Provider>
  );
}

export interface StaggerItemProps extends React.ComponentPropsWithRef<"div"> {
  /** Position in the group. The caller owns the order — no child counting. */
  index: number;
  distance?: number;
}

/**
 * One item in a `StaggerGroup`.
 *
 * The explicit `index` is deliberate: an implicit counter breaks as soon as an
 * item is conditionally rendered, and a stagger that shifts when one card is
 * hidden is worse than no stagger.
 */
export function StaggerItem({
  className,
  children,
  index,
  distance: travel = distance.sm,
  ...props
}: StaggerItemProps) {
  const group = useContext(StaggerContext);
  const position = Math.min(index, group.maxItems);
  return (
    <Reveal
      data-slot="stagger-item"
      className={className}
      delay={group.delay + position * group.step}
      distance={travel}
      {...props}
    >
      {children}
    </Reveal>
  );
}
