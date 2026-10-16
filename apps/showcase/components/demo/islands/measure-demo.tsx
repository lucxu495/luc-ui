"use client";

/*
 * A live width readout for the layout primitives.
 *
 * `Container`'s whole job is the measure it produces, and "max 76rem" is a
 * number nobody can check by looking — at 1280 px the container is 1216 px, at
 * 900 px it is 900 px minus its gutters, and the difference between `content`
 * and `prose` is invisible until something is inside both. So this renders a
 * container and prints the box it actually got, in pixels, from a
 * `ResizeObserver`.
 *
 * **Self-contained on purpose.** The first version took the container as
 * `children` and injected the ref with `cloneElement`, which is the one shape
 * this boundary cannot carry: those children were created in a server module, so
 * the client received an element whose type it could not resolve and the route
 * failed to render on the server — `Element type is invalid … got: undefined` on
 * `/components/container`, a 500 caught by the browser QA pass. The island
 * therefore imports `Container` and `Text` itself and takes only plain props: a
 * width, a class name and a caption string. Every other island in this directory
 * is self-contained for the same reason.
 *
 * It is a Showcase measurement, not a component behaviour: nothing in
 * `packages/ui` observes anything, no layout primitive gained a prop, and the
 * readout shows a dash until the observer runs rather than guessing a number
 * during the server render — a server has no viewport, and a wrong number
 * printed once is worse than a dash.
 */

import { useEffect, useRef, useState } from "react";
import { Container, Text, cn } from "@luc/ui";

export interface MeasuredWidthProps {
  /** Which measure to render. See `ContainerProps["width"]`. */
  width?: "content" | "prose" | "full";
  /** What is being measured, e.g. "content box". */
  label?: string;
  /** The sentence inside the container. */
  caption?: string;
  /** Classes for the container itself — a boundary to look at. */
  boxClassName?: string;
  /** Classes for the wrapper. */
  className?: string;
}

export function MeasuredWidth({
  width = "content",
  label,
  caption,
  boxClassName,
  className,
}: MeasuredWidthProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [measured, setMeasured] = useState<number | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      /* `contentRect` rather than `borderBoxSize`: the number worth showing is
       * the space the content actually has, which is what a gutter takes away. */
      if (entry) setMeasured(Math.round(entry.contentRect.width));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Container ref={ref} width={width} className={boxClassName}>
        {caption ? (
          <Text variant="body" tone="secondary">
            {caption}
          </Text>
        ) : null}
      </Container>
      <p className="flex items-baseline gap-1.5 text-micro text-fg-muted">
        <span>{label ?? "width"}</span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums text-fg-secondary">
          {measured === null ? "—" : `${measured} px`}
        </span>
      </p>
    </div>
  );
}
