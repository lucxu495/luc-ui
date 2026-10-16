"use client";

import { cn } from "../utils/cn";
import { useSpotlight } from "../hooks/use-spotlight";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { useMotionProfile } from "./intensity";

export type GlowIntensity = "subtle" | "normal" | "strong";

export interface BorderGlowProps extends React.ComponentPropsWithRef<"div"> {
  /** How loud the ring gets. `subtle` is the house default for dense UI. */
  intensity?: GlowIntensity;
  /**
   * `travel` sweeps a light around the perimeter (needs attention).
   * `follow` only reacts to the pointer (the calm choice for dashboards).
   */
  mode?: "travel" | "follow";
  /** Persistent accent ring, independent of hover. */
  selected?: boolean;
  /** Ring radius. Must match the wrapped surface. */
  radius?: "md" | "lg" | "xl" | "full";
  /** Seconds per perimeter sweep. Slower reads as more expensive. */
  speed?: number;
}

const intensityValue: Record<GlowIntensity, number> = {
  subtle: 0.55,
  normal: 0.85,
  strong: 1.15,
};

const radiusClass = {
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
} as const;

// LUC BorderGlow.
//
// The perimeter carries a light. At rest: nothing. On hover or focus: a thin
// accent line that either travels around the edge or brightens near the
// pointer. Selected: a calm, persistent ring.
//
// Reimplemented independently for LUC UI — see docs/sources/source-registry.md.
// The only animation is a conic-gradient rotation on a 1px mask: no canvas, no
// per-frame React state, no always-running JavaScript.
export function BorderGlow({
  className,
  children,
  intensity = "subtle",
  mode = "follow",
  selected = false,
  radius = "lg",
  speed = 5.5,
  ...props
}: BorderGlowProps) {
  const reducedMotion = useReducedMotion();
  const profile = useMotionProfile();
  const { ref, isActive, enabled, handlers } = useSpotlight<HTMLDivElement>({ prefix: "glow" });
  // A travelling ring is decorative, so it is also gated on the resolved
  // intensity: `functional`/`none` keep the calm follow behaviour only.
  const travelling = mode === "travel" && !reducedMotion && profile.ambient;

  return (
    <div
      ref={ref}
      data-slot="border-glow"
      data-selected={selected || undefined}
      data-active={isActive || undefined}
      className={cn(
        "group/border-glow relative isolate",
        radiusClass[radius],
        "[--glow-strength:var(--effect-border-glow-strength)]",
        className,
      )}
      style={
        {
          "--glow-opacity": Math.min(1.25, (selected ? 0.9 : intensityValue[intensity]) * Math.max(profile.glow, 0.4)),
          "--glow-speed": `${speed}s`,
        } as React.CSSProperties
      }
      {...handlers}
      {...props}
    >
      <span
        aria-hidden="true"
        data-slot="border-glow-ring"
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit] p-px opacity-0",
          "[transition:opacity_var(--motion-normal)_var(--ease-standard)]",
          "group-hover/border-glow:opacity-100 group-focus-within/border-glow:opacity-100",
          "group-data-[selected]/border-glow:opacity-100",
          travelling && [
            "group-hover/border-glow:[animation:luc-glow-rotate_var(--glow-speed)_linear_infinite]",
            "group-focus-within/border-glow:[animation:luc-glow-rotate_var(--glow-speed)_linear_infinite]",
            "group-data-[selected]/border-glow:[animation:luc-glow-rotate_var(--glow-speed)_linear_infinite]",
          ],
          "[mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)]",
          "[mask-composite:exclude]",
        )}
        style={{
          opacity: selected ? "var(--glow-opacity)" : undefined,
          background: travelling
            ? "conic-gradient(from var(--glow-angle,0deg), transparent 0%, color-mix(in oklab, var(--accent-default) 70%, transparent) 8%, transparent 22%, transparent 78%, color-mix(in oklab, var(--accent-default) 45%, transparent) 90%, transparent 100%)"
            : "conic-gradient(from 180deg, color-mix(in oklab, var(--accent-default) 62%, transparent) 0%, transparent 30%, transparent 70%, color-mix(in oklab, var(--accent-default) 40%, transparent) 100%)",
        }}
      />
      <span
        aria-hidden="true"
        data-slot="border-glow-spot"
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit] p-px opacity-0",
          "[transition:opacity_var(--motion-normal)_var(--ease-standard)]",
          "group-hover/border-glow:opacity-100",
          "[mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)]",
          "[mask-composite:exclude]",
        )}
        style={{
          background:
            "radial-gradient(180px circle at var(--glow-x, 50%) var(--glow-y, 0%), color-mix(in oklab, var(--accent-strong) 85%, transparent), transparent 65%)",
          opacity: enabled ? undefined : 0,
        }}
      />
      <span
        aria-hidden="true"
        data-slot="border-glow-bloom"
        className={cn(
          "pointer-events-none absolute -inset-px -z-10 rounded-[inherit] opacity-0 blur-[6px]",
          "[transition:opacity_var(--motion-slow)_var(--ease-standard)]",
          "group-hover/border-glow:opacity-[0.32] group-focus-within/border-glow:opacity-[0.32]",
        )}
        style={{
          background:
            "radial-gradient(240px circle at var(--glow-x, 50%) var(--glow-y, 50%), color-mix(in oklab, var(--accent-default) 40%, transparent), transparent 70%)",
        }}
      />
      <div className="relative [border-radius:inherit]">{children}</div>
    </div>
  );
}
