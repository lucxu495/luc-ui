//#region src/motion/orbit-field.d.ts
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
export declare function OrbitField({ className, children, label, tilt, perspective, speed, paused, style, ...props }: OrbitFieldProps): import("react").JSX.Element;
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
export declare function OrbitFieldRing({ className, children, radius, duration, direction, dashed, trackless, restOnHover, style, ...props }: OrbitFieldRingProps): import("react").JSX.Element;
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
export declare function OrbitFieldNode({ className, children, angle, onSelect, active, label, ...props }: OrbitFieldNodeProps): import("react").JSX.Element;
/**
 * The hub at the centre of an `OrbitField`. Pointer events pass straight
 * through the empty area, so a ring's seats stay clickable underneath.
 */
export declare function OrbitFieldCore({ className, children, ...props }: React.ComponentPropsWithRef<"div">): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=orbit-field.d.ts.map