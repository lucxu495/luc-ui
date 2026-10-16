"use client";

import { cn } from "../utils/cn";
import { useParallax } from "../hooks/use-parallax";
import { pointer as pointerTokens } from "./tokens";

export interface ParallaxSceneProps extends Omit<React.ComponentPropsWithRef<"div">, "onPointerMove"> {
  /**
   * Travel, in px, of a layer at depth `1`. The whole vocabulary of the scene:
   * `12` is a restrained product surface, `40` is a hero.
   */
  depth?: number;
  /** `perspective()` distance, in px. Smaller makes the depth more dramatic. */
  perspective?: number;
  /** Lean of the whole scene, in degrees. `0` keeps it flat. */
  tilt?: number;
  /** Freeze the scene at rest but keep the composition. */
  disabled?: boolean;
}

/**
 * LUC `ParallaxScene` — a container that gives its children real depth.
 *
 * Depth here is a *coordinate system*, not an effect: the scene publishes one
 * pointer offset as custom properties, and each `ParallaxLayer` inside decides
 * how much of it to take. A background washes slowly, a mid-ground panel moves
 * a little, a foreground badge moves against the pointer — all from one rAF
 * loop and zero React renders (see `useParallax`).
 *
 * Rules that keep it honest:
 *
 *  1. **Content does not move.** Text sits in a layer at depth `0` (or outside
 *     the scene) so nothing readable ever shifts under a pointer.
 *  2. **The scene still composes at rest.** Layers are separated by `translateZ`
 *     as well as by travel, so the flat frame is deliberate, not degenerate —
 *     which is exactly what touch devices, reduced motion and print receive.
 *  3. **Nothing listens on touch.** The tracker is off on coarse pointers, so a
 *     phone pays for one gradient and no event handlers.
 */
export function ParallaxScene({
  className,
  children,
  depth = pointerTokens.parallaxDepth,
  perspective = pointerTokens.tiltPerspective,
  tilt = 4,
  disabled = false,
  style,
  ...props
}: ParallaxSceneProps) {
  const { ref, enabled, handlers } = useParallax<HTMLDivElement>({ depth, tilt, disabled });

  return (
    <div
      ref={ref}
      data-slot="parallax-scene"
      data-parallax={enabled ? "on" : "off"}
      className={cn("relative", className)}
      style={{ ...style, perspective: `${perspective}px`, perspectiveOrigin: "50% 50%" }}
      {...(enabled ? handlers : null)}
      {...props}
    >
      <div
        data-slot="parallax-stage"
        className="relative size-full [transform-style:preserve-3d]"
        style={{
          transform: "rotateX(var(--luc-parallax-rx, 0deg)) rotateY(var(--luc-parallax-ry, 0deg))",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export interface ParallaxLayerProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * How much of the scene's travel this layer takes. `0` is fixed, `1` is the
   * scene's nominal depth, negative values move *against* the pointer (the
   * classic foreground read) and values above `1` exaggerate the background.
   */
  depth?: number;
  /** Position along the z axis, in px. Negative pushes a layer behind the plane. */
  z?: number;
  /** Which axis the layer answers. Useful for a strictly horizontal sweep. */
  axis?: "both" | "x" | "y";
}

/**
 * One plane inside a `ParallaxScene`.
 *
 * The transform is `translate3d` only — a compositor property — and the two
 * custom properties come from the scene above, so a layer never re-renders when
 * the pointer moves. Without a scene the variables are undefined, the `calc`
 * resolves to `0px` and the layer simply sits at its `z`, which makes the
 * component safe to render outside one.
 */
export function ParallaxLayer({
  className,
  children,
  depth = 1,
  z = 0,
  axis = "both",
  style,
  ...props
}: ParallaxLayerProps) {
  const amount = Number.isFinite(depth) ? depth : 1;
  const x = axis === "y" ? "0px" : `calc(var(--luc-parallax-x, 0px) * ${amount})`;
  const y = axis === "x" ? "0px" : `calc(var(--luc-parallax-y, 0px) * ${amount})`;

  return (
    <div
      data-slot="parallax-layer"
      data-depth={amount}
      className={cn("luc-layer", className)}
      style={{ transform: `translate3d(${x}, ${y}, ${z}px)`, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}
