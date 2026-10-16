"use client";

import { createContext, useContext, useId, useMemo } from "react";
import { cn } from "../utils/cn";
import { useMotionProfile } from "./intensity";

/* -------------------------------------------------------------------------- */
/* Geometry                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Polar → percentage inside the ring box.
 *
 * Angles are degrees, measured counter-clockwise from the 3 o'clock position,
 * which is what everyone means by "angle" and what a diagram author expects.
 * Screen y grows downwards, hence the minus.
 */
function polar(angle: number, radius = 50): { left: string; top: string } {
  const radians = (angle * Math.PI) / 180;
  return {
    left: `${50 + Math.cos(radians) * radius}%`,
    top: `${50 - Math.sin(radians) * radius}%`,
  };
}

interface OrbitFieldContextValue {
  /** Whether the ambient rotation may run at all (motion profile + `paused`). */
  spinning: boolean;
  /** Global speed multiplier applied to every ring's duration. */
  speed: number;
  instance: string;
}

const OrbitFieldContext = createContext<OrbitFieldContextValue | null>(null);

function useOrbitFieldContext(component: string): OrbitFieldContextValue {
  const context = useContext(OrbitFieldContext);
  if (!context) throw new Error(`<${component}> must be rendered inside <OrbitField>.`);
  return context;
}

interface OrbitRingContextValue {
  radius: number;
  duration: number;
  direction: "forward" | "reverse";
  spinning: boolean;
}

const OrbitRingContext = createContext<OrbitRingContextValue | null>(null);

/* -------------------------------------------------------------------------- */
/* Field                                                                       */
/* -------------------------------------------------------------------------- */

export interface OrbitFieldProps extends React.ComponentPropsWithRef<"div"> {
  /** Accessible name. Omit it and the field is decorative to a screen reader. */
  label?: string;
  /** Lean of the orbital plane, in degrees. `0` is a flat, top-down view. */
  tilt?: number;
  /** `perspective()` distance, in px. Smaller = a steeper plane. */
  perspective?: number;
  /** Seconds-per-turn multiplier applied to every ring. `1` is the ring default. */
  speed?: number;
  /** Stop every ring without removing the composition. */
  paused?: boolean;
}

/**
 * LUC `OrbitField` — a geometric composition that actually orbits.
 *
 * It exists because "geometric motion" usually arrives as a decorative
 * background animation that a product cannot reuse. An orbit is a *layout*:
 * things are arranged on rings, the rings turn, the things stay upright and
 * readable, and any node can be a real control. So the field is a container,
 * `OrbitFieldRing` is a track, `OrbitFieldNode` is a seat, and the caller
 * decides what sits in the seats.
 *
 * Engineering notes:
 *
 *  - Rotation is CSS on the compositor. React renders once and then never again,
 *    however many rings turn.
 *  - Every label counter-rotates at exactly the ring's period, so a chip stays
 *    level while it travels — the difference between a designed orbit and a
 *    spinning wheel of unreadable text.
 *  - The reduced-motion clamp collapses `0°→360°` to its end frame, which equals
 *    its start frame: the field freezes into a correct, deliberate arrangement.
 *  - The field is a square by default (`aspect-square`); rings are sized in
 *    percentages of it, so nothing needs measuring and nothing shifts on resize.
 */
export function OrbitField({
  className,
  children,
  label,
  tilt = 14,
  perspective = 1000,
  speed = 1,
  paused = false,
  style,
  ...props
}: OrbitFieldProps) {
  const profile = useMotionProfile();
  const instance = useId();
  const spinning = !paused && profile.ambient;

  const value = useMemo<OrbitFieldContextValue>(
    () => ({ spinning, speed: speed > 0 ? speed : 1, instance }),
    [instance, speed, spinning],
  );

  return (
    <OrbitFieldContext.Provider value={value}>
      <div
        data-slot="orbit-field"
        data-spinning={spinning ? "true" : "false"}
        // A field carrying interactive seats must be named; one that is purely
        // decorative simply renders without a role. It is never `aria-hidden`,
        // because that would take its seats out of the accessibility tree.
        {...(label ? { role: "group", "aria-label": label } : {})}
        className={cn("relative aspect-square", className)}
        style={{ ...style, perspective: `${perspective}px` }}
        {...props}
      >
        <div
          data-slot="orbit-plane"
          className="relative size-full [transform-style:preserve-3d]"
          style={{ transform: `rotateX(${tilt}deg)` }}
        >
          {children}
        </div>
      </div>
    </OrbitFieldContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* Ring                                                                        */
/* -------------------------------------------------------------------------- */

export interface OrbitFieldRingProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * Radius as a percentage of the field's **width**. `50` is the largest ring
   * that still fits inside the square; `34` is a comfortable inner tier. Values
   * above 50 deliberately overflow the field, which is useful for a decorative
   * ring but will collide with surrounding content.
   */
  radius?: number;
  /** Seconds for one full turn. Larger is calmer. */
  duration?: number;
  direction?: "forward" | "reverse";
  /** Draw the track as a dashed hairline — a second ring reads as a second tier. */
  dashed?: boolean;
  /** Hide the visible track while keeping the ring's geometry. */
  trackless?: boolean;
  /**
   * Stop the ring while a pointer rests on it or focus is inside one of its
   * seats. On by default: a control that will not hold still is not usable.
   */
  restOnHover?: boolean;
}

/**
 * A track inside an `OrbitField`. Sizing is percentage-based and the ring is
 * centred with negative percentage margins rather than a `translate`, because
 * the rotation animation owns `transform` outright — a translate utility here
 * would be silently overwritten the moment the ring starts turning.
 */
export function OrbitFieldRing({
  className,
  children,
  radius = 44,
  duration = 32,
  direction = "forward",
  dashed = false,
  trackless = false,
  restOnHover = true,
  style,
  ...props
}: OrbitFieldRingProps) {
  const { spinning, speed } = useOrbitFieldContext("OrbitFieldRing");
  const size = `${Math.max(2, Math.min(radius, 100)) * 2}%`;
  const offset = `${-Math.max(2, Math.min(radius, 100))}%`;
  const period = duration / speed;

  const value = useMemo<OrbitRingContextValue>(
    () => ({ radius: Math.max(2, Math.min(radius, 100)), duration: period, direction, spinning }),
    [direction, period, radius, spinning],
  );

  return (
    <OrbitRingContext.Provider value={value}>
      <div
        data-slot="orbit-ring"
        data-direction={direction}
        className={cn(
          "absolute top-1/2 left-1/2 rounded-full [transform-style:preserve-3d]",
          !trackless && "border border-line-subtle",
          !trackless && dashed && "luc-orbit-dashed",
          spinning && "luc-orbit-spin",
          spinning && restOnHover && "luc-orbit-rest",
          className,
        )}
        style={{
          width: size,
          height: size,
          marginLeft: offset,
          marginTop: offset,
          ...(spinning
            ? {
                animationDuration: `${period}s`,
                animationDirection: direction === "reverse" ? "reverse" : "normal",
              }
            : null),
          ...style,
        }}
        {...(trackless ? { "aria-hidden": "true" as const } : {})}
        {...props}
      >
        {children}
      </div>
    </OrbitRingContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* Node                                                                        */
/* -------------------------------------------------------------------------- */

export interface OrbitFieldNodeProps extends Omit<React.ComponentPropsWithRef<"div">, "onSelect"> {
  /** Seat angle, in degrees, counter-clockwise from 3 o'clock. */
  angle?: number;
  /** Selecting is opt-in: pass a handler and the node becomes a real button. */
  onSelect?: () => void;
  /** Marks the node as the chosen one, for both styling and `aria-pressed`. */
  active?: boolean;
  /** Accessible name for an interactive node. Defaults to no label. */
  label?: string;
}

/**
 * A seat on an `OrbitFieldRing`.
 *
 * Two nested elements on purpose. The outer one *positions* the seat with a
 * `translate(-50%, -50%)`; the inner one *rotates* against the ring, and its
 * transform belongs entirely to that animation. Fighting over one `transform`
 * is the classic way an orbiting label ends up tilted 40° and half off its seat.
 *
 * With `onSelect` the seat renders a `<button type="button">`, which brings
 * focus, Enter/Space activation and `aria-pressed` for free — an orbit you can
 * only use with a pointer is a decoration, not a component.
 */
export function OrbitFieldNode({
  className,
  children,
  angle = 0,
  onSelect,
  active = false,
  label,
  ...props
}: OrbitFieldNodeProps) {
  const ring = useContext(OrbitRingContext);
  const seat = polar(angle, 50);
  const spinning = ring?.spinning ?? false;

  /*
   * Counter-rotation has to *subtract the ring's angle*, and which keyframes do
   * that depends on the ring's direction:
   *
   *   ring forward   0° → +360°   needs  0° → -360°   (luc-orbit-counter)
   *   ring reverse  +360° → 0°    needs  0° → +360°   (luc-orbit-spin)
   *
   * Because `animation-direction: reverse` runs a *rotating* keyframe set
   * backwards, the ring's angle is `-360t/T` in that case — so the counter must
   * rotate forwards, not backwards. Getting this wrong leaves every label tilted
   * by the ring's live angle, which is exactly how an orbit ends up unreadable.
   */
  const counterClass = ring?.direction === "reverse" ? "luc-orbit-spin" : "luc-orbit-counter";
  const counterStyle =
    spinning && ring ? { animationDuration: `${ring.duration}s` } : undefined;

  const position = (
    <span
      data-slot="orbit-seat"
      className="absolute block"
      style={{ left: seat.left, top: seat.top, transform: "translate(-50%, -50%)" }}
    >
      <span
        data-slot="orbit-counter"
        className={cn("block", spinning && counterClass)}
        style={counterStyle}
      >
        {children}
      </span>
    </span>
  );

  if (!onSelect) {
    return (
      <div data-slot="orbit-node" data-active={active ? "true" : "false"} className={className} {...props}>
        {position}
      </div>
    );
  }

  return (
    <div data-slot="orbit-node" data-active={active ? "true" : "false"} className={className} {...props}>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        {...(label ? { "aria-label": label } : null)}
        className="luc-focus relative block cursor-pointer rounded-full"
        style={{ position: "absolute", left: seat.left, top: seat.top, transform: "translate(-50%, -50%)" }}
      >
        <span
          data-slot="orbit-counter"
          className={cn("block", spinning && counterClass)}
          style={counterStyle}
        >
          {children}
        </span>
      </button>
    </div>
  );
}

/**
 * The hub at the centre of an `OrbitField`. Pointer events pass straight
 * through the empty area, so a ring's seats stay clickable underneath.
 */
export function OrbitFieldCore({
  className,
  children,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="orbit-core"
      className={cn(
        "pointer-events-none absolute inset-0 grid place-items-center [&>*]:pointer-events-auto",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
