"use client";

import { motion, useTransform } from "motion/react";
import { cn } from "../utils/cn";
import { usePointerMotion } from "../hooks/use-pointer-motion";
import { useMotionProfile } from "./intensity";
import { pointer as pointerTokens, type SpringPresetName } from "./tokens";
import type { MotionDivProps } from "./types";

export interface MagneticProps extends MotionDivProps {
  /**
   * Fraction of the pointer offset the target follows (0..1). The house
   * default is deliberately modest — a control that chases the cursor is
   * harder to click than one that leans toward it.
   */
  strength?: number;
  /** Distance, in px, beyond which the pull fades out. */
  radius?: number;
  /** Extra travel for the child slot (`1` = the body and the child move alike). */
  childDepth?: number;
  preset?: SpringPresetName;
  disabled?: boolean;
}

/** Soft radius falloff: full pull at the centre, none far away. */
function falloff(distance: number, radius: number): number {
  return Math.max(0, 1 - distance / (radius + distance));
}

/**
 * LUC Magnetic — a control that leans toward the pointer and springs home.
 *
 * The travel is hard-clamped so a magnetised button can never move far enough
 * for the pointer to miss it, and the whole effect is inert on coarse pointers
 * (there is no hover) and under reduced motion. When it is inert the component
 * renders a plain wrapper with no listeners attached.
 */
export function Magnetic({
  className,
  children,
  strength = pointerTokens.magneticStrength,
  radius = pointerTokens.magneticRadius,
  childDepth = 0.55,
  preset = "responsive",
  disabled = false,
  ...props
}: MagneticProps) {
  const profile = useMotionProfile();
  const { ref, enabled, x, y, handlers } = usePointerMotion<HTMLDivElement>({
    disabled: disabled || !profile.pointer,
    preset,
  });

  // The clamp is in px and independent of element size: 16px of travel at
  // `showcase` intensity, less as the profile quiets down.
  const maxTravel = 16 * Math.max(profile.depth, 0.35);
  const follow = strength * profile.depth;
  const clamp = (value: number) => Math.max(-maxTravel, Math.min(maxTravel, value));
  const apply = (value: number) => clamp(value * follow * falloff(Math.abs(value), radius));

  const bodyX = useTransform(() => apply(x.get()));
  const bodyY = useTransform(() => apply(y.get()));
  const childX = useTransform(() => apply(x.get()) * childDepth);
  const childY = useTransform(() => apply(y.get()) * childDepth);

  if (!enabled) {
    return (
      <div
        ref={ref}
        data-slot="magnetic"
        data-enabled="false"
        className={cn("min-w-0", className)}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      data-slot="magnetic"
      data-enabled="true"
      className={cn("min-w-0", className)}
      style={{ x: bodyX, y: bodyY }}
      {...handlers}
      {...props}
    >
      <motion.div data-slot="magnetic-child" style={{ x: childX, y: childY }}>
        {children}
      </motion.div>
    </motion.div>
  );
}
