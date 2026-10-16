"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { chartMotion } from "../../motion/tokens";
import { defaultChartTheme, modeOf, resolveChartTheme, type ChartTheme } from "./theme";
import type { ChartAnimationPreset } from "../types";

let cacheKey: string | null = null;
let cacheTheme: ChartTheme = defaultChartTheme;

function subscribe(onChange: () => void): () => void {
  if (typeof document === "undefined") return () => {};
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): ChartTheme {
  const mode = modeOf();
  if (cacheKey !== mode) {
    cacheTheme = resolveChartTheme();
    cacheKey = mode;
  }
  return cacheTheme;
}

function getServerSnapshot(): ChartTheme {
  return defaultChartTheme;
}

/**
 * The resolved chart theme for the current LUC theme, kept in sync without a
 * re-render loop: the snapshot only changes when `<html>` flips theme.
 */
export function useChartTheme(): ChartTheme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Past this many plotted points a per-point entrance animation is waste. */
export const CHART_ANIMATION_POINT_LIMIT = 4000;

export interface ChartMotionBudget {
  reduced: boolean;
  /** Intro animation duration in ms; 0 when motion is reduced or disabled. */
  intro: number;
  /** Duration for a data/range update. */
  update: number;
  /** Hover/emphasis feedback duration. */
  emphasis: number;
  /** Whether the caller asked for a universal (morph) transition. */
  universal: boolean;
}

const PRESET_SCALE: Record<ChartAnimationPreset, number> = {
  none: 0,
  subtle: 0.5,
  standard: 1,
  emphasized: 1.45,
};

/**
 * Chart motion budget.
 *
 * Precedence: reduced motion wins over everything (a chart under
 * `prefers-reduced-motion` renders its final frame immediately — motion is
 * never merely slowed down). Then the caller's preset, then a **large-data
 * clamp**: a 20 000-point scatter does not animate twenty thousand marks into
 * place, it appears.
 */
export function useChartMotion(
  theme: ChartTheme,
  preset: ChartAnimationPreset = "standard",
  pointCount?: number,
): ChartMotionBudget {
  const reduced = useReducedMotion();
  if (reduced) {
    return { reduced: true, intro: 0, update: 0, emphasis: 0, universal: false };
  }
  const scale = PRESET_SCALE[preset];
  if (scale === 0) {
    return { reduced: false, intro: 0, update: 0, emphasis: 0, universal: false };
  }
  const dense = typeof pointCount === "number" && pointCount > CHART_ANIMATION_POINT_LIMIT;
  const intro = Math.round((theme.motionSlow + (chartMotion.intro - theme.motionSlow) * scale) * (dense ? 0.35 : 1));
  const update = Math.round((theme.motionNormal + (chartMotion.update - theme.motionNormal) * scale) * (dense ? 0.5 : 1));
  return {
    reduced: false,
    intro,
    update,
    emphasis: reduced ? 0 : theme.motionFast,
    universal: !dense,
  };
}

export interface ElementSize {
  width: number;
  height: number;
}

/**
 * Observe an element's box. Returns `null` until the first measurement so a
 * caller can decide whether rendering an engine is worth it yet.
 */
export function useElementSize<T extends HTMLElement>(): [React.RefObject<T | null>, ElementSize | null] {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<ElementSize | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const box = entry.contentRect;
      setSize((current) =>
        current && Math.abs(current.width - box.width) < 0.5 && Math.abs(current.height - box.height) < 0.5
          ? current
          : { width: box.width, height: box.height },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}

/** Stable per-instance id for sync-group origins and ARIA wiring. */
export function useChartId(prefix = "luc-chart"): string {
  /*
   * `useId`, not a module counter.
   *
   * The id reaches the DOM as `id` + `aria-describedby` whenever a chart carries
   * an `ariaDescription`, so a counter that restarts on the client produces a
   * different string there than the server rendered — a hydration mismatch on
   * every page with a described chart. `useId` is stable across both.
   */
  const id = useId();
  return `${prefix}-${id}`;
}

/**
 * A ref that always holds the latest value, updated after each commit rather
 * than during render (which React's hooks linting rejects, and which breaks
 * concurrent rendering). Engines read these from event handlers and effects
 * where the freshest value is what matters.
 */
export function useLatest<T>(value: T): React.RefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}

export function useStableCallback<Args extends unknown[]>(fn: (...args: Args) => void) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  }, [fn]);
  return useCallback((...args: Args) => ref.current(...args), []);
}
