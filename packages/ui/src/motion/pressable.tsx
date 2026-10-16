"use client";

import { motion } from "motion/react";
import { cn } from "../utils/cn";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { useMotionProfile } from "./intensity";
import { surfaceResponse } from "./tokens";

type PressableTag = "div" | "span" | "li" | "button" | "a" | "article";

export interface PressableProps extends React.ComponentPropsWithRef<"div"> {
  as?: PressableTag;
  href?: string;
  /** Lift the element on hover. */
  lift?: boolean;
  /** Scale down while pressed. */
  press?: boolean;
  /** Scale up slightly on hover. */
  growOnHover?: boolean;
  disabled?: boolean;
}

type MotionComponent = React.ComponentType<Record<string, unknown>>;

/*
 * Built once at module scope, never during render: a component created inside a
 * render would remount its subtree on every pass and lose its animation state.
 */
const PRESSABLE_COMPONENTS: Record<PressableTag, MotionComponent> = {
  div: motion.div as unknown as MotionComponent,
  span: motion.span as unknown as MotionComponent,
  li: motion.li as unknown as MotionComponent,
  button: motion.button as unknown as MotionComponent,
  a: motion.a as unknown as MotionComponent,
  article: motion.article as unknown as MotionComponent,
};

/**
 * LUC Pressable — the physical half of an interactive surface.
 *
 * Hover lifts and a press compresses, both spring-driven, both expressed in
 * *fractions of the resolved intensity* rather than seconds. It is deliberately
 * separate from `MotionSurface`: a surface decides how something looks, a
 * Pressable decides how it responds to being touched. Compose them, or use the
 * `interactive` variants of Card/Button/StatCard which do it for you.
 *
 * Reduced motion renders an inert element with the same DOM and semantics.
 */
export function Pressable({
  className,
  children,
  as = "div",
  href,
  lift = true,
  press = true,
  growOnHover = false,
  disabled = false,
  ...props
}: PressableProps) {
  const reduced = useReducedMotion();
  const profile = useMotionProfile();
  const Component = PRESSABLE_COMPONENTS[as];

  if (reduced || profile.intensity === "none") {
    const Tag = as as React.ElementType;
    return (
      <Tag
        data-slot="pressable"
        data-enabled="false"
        className={cn("min-w-0", className)}
        aria-disabled={disabled || undefined}
        {...(as === "a" && href ? { href } : {})}
        {...props}
      >
        {children}
      </Tag>
    );
  }

  const travel = profile.travel;
  return (
    <Component
      data-slot="pressable"
      data-enabled="true"
      className={cn("min-w-0", className)}
      aria-disabled={disabled || undefined}
      {...(as === "a" && href ? { href } : {})}
      whileHover={
        disabled
          ? undefined
          : {
              y: lift ? -surfaceResponse.hoverLift * travel : 0,
              scale: growOnHover ? 1 + (surfaceResponse.hoverScale - 1) * travel : 1,
            }
      }
      whileTap={disabled || !press ? undefined : { scale: 1 - (1 - surfaceResponse.pressScale) * travel }}
      transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.7 }}
      {...props}
    >
      {children}
    </Component>
  );
}
