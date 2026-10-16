"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export interface IndicatorRect {
  left: number;
  width: number;
}

/**
 * Measures the active item inside a container so a single absolutely
 * positioned element can slide between them.
 *
 * Why measure instead of `layoutId`: the indicator also has to survive font
 * loading, container resizes, and label changes — and it needs to animate
 * *width* as well as position. One rAF-free measurement per change is cheaper
 * and far more predictable.
 *
 * Returns `rect: null` until the first measurement so callers can keep the
 * indicator invisible instead of flashing at position 0.
 */
export function useSlidingIndicator<T extends HTMLElement = HTMLDivElement>(activeValue: string | undefined) {
  const containerRef = useRef<T | null>(null);
  const itemsRef = useRef(new Map<string, HTMLElement>());
  const [rect, setRect] = useState<IndicatorRect | null>(null);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const item = activeValue ? itemsRef.current.get(activeValue) : undefined;
    if (!container || !item) {
      setRect(null);
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    setRect({ left: itemRect.left - containerRect.left, width: itemRect.width });
  }, [activeValue]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => measure());
    observer.observe(container);
    itemsRef.current.forEach((item) => observer.observe(item));
    window.addEventListener("resize", measure);
    void document.fonts?.ready.then(measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const registerItem = useCallback(
    (value: string) => (node: HTMLElement | null) => {
      if (node) itemsRef.current.set(value, node);
      else itemsRef.current.delete(value);
    },
    [],
  );

  return { containerRef, registerItem, rect, measure };
}
