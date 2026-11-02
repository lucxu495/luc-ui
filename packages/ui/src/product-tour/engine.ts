/**
 * Product Tour positioning adapter.
 *
 * The engine deliberately has no React and no third-party runtime dependency.
 * It resolves a target, measures the *visible* viewport rectangle and returns a
 * collision-aware bubble position. Keeping this layer pure means positioning can
 * be tested without a browser and Luc UI does not pay for a full tour framework
 * merely to add twelve pixels of padding around an element.
 */

export type ProductTourPlacement = "auto" | "top" | "bottom" | "left" | "right";

export type ProductTourTarget =
  | string
  | Element
  | (() => Element | null)
  | undefined
  | null;

export interface TourRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface TourViewport {
  width: number;
  height: number;
}

export interface TourBubblePosition {
  top: number;
  left: number;
  placement: Exclude<ProductTourPlacement, "auto"> | "center";
  tail: { x: number; y: number; side: "top" | "right" | "bottom" | "left" } | null;
}

export interface PositionTourBubbleOptions {
  anchor: TourRect | null;
  bubble: { width: number; height: number };
  viewport: TourViewport;
  preferred?: ProductTourPlacement;
  gap?: number;
  margin?: number;
}

const SIDES = ["bottom", "right", "top", "left"] as const;
type ResolvedSide = (typeof SIDES)[number];

/**
 * Resolve every supported selector shape without assuming a document exists.
 * A resolver function is useful for React refs and virtualised rows; a selector
 * remains the compact default for page-level tours.
 */
export function resolveTourTarget(
  target: ProductTourTarget,
  root?: ParentNode,
): Element | null {
  if (!target) return null;
  if (typeof target === "function") return target();
  if (typeof target !== "string") return target.isConnected ? target : null;
  const scope = root ?? (typeof document === "undefined" ? null : document);
  return scope?.querySelector(target) ?? null;
}

/**
 * `getBoundingClientRect()` is already in viewport coordinates, which is also
 * the coordinate system of the fixed spotlight and bubble. Using scroll offsets
 * here would double-count scrolling, especially inside nested containers.
 */
export function measureTarget(element: Element, padding = 8): TourRect | null {
  const style = typeof getComputedStyle === "function" ? getComputedStyle(element) : null;
  const rect = element.getBoundingClientRect();
  if (
    !element.isConnected ||
    style?.display === "none" ||
    style?.visibility === "hidden" ||
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    return null;
  }
  return {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

export function sameTourRect(a: TourRect | null, b: TourRect | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

export function isTargetFullyVisible(rect: TourRect | null, viewport: TourViewport): boolean {
  return Boolean(
    rect &&
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.top + rect.height <= viewport.height &&
      rect.left + rect.width <= viewport.width,
  );
}

/**
 * Scroll only when needed. `nearest` avoids jumping the page when the target is
 * already visible, and the container is allowed to process the request first,
 * so nested scroll areas work without a second geometry model.
 */
export function revealTourTarget(
  element: Element,
  reducedMotion: boolean,
): void {
  const rect = element.getBoundingClientRect();
  const viewport = {
    width: typeof window === "undefined" ? 0 : window.innerWidth,
    height: typeof window === "undefined" ? 0 : window.innerHeight,
  };
  if (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= viewport.height &&
    rect.right <= viewport.width
  ) {
    return;
  }
  element.scrollIntoView({
    // A spotlight at the very edge of the viewport leaves the explanation
    // competing with browser chrome. Centre ordinary targets; use `nearest`
    // for a target that is taller than most of the viewport.
    block: rect.height > viewport.height * 0.7 ? "nearest" : "center",
    inline: rect.width > viewport.width * 0.8 ? "nearest" : "center",
    behavior: reducedMotion ? "auto" : "smooth",
  });
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

function candidate(
  side: ResolvedSide,
  anchor: TourRect,
  bubble: { width: number; height: number },
  gap: number,
): { top: number; left: number; fits: boolean } {
  switch (side) {
    case "top":
      return {
        top: anchor.top - gap - bubble.height,
        left: anchor.left + anchor.width / 2 - bubble.width / 2,
        fits: anchor.top - gap >= bubble.height,
      };
    case "right":
      return {
        top: anchor.top + anchor.height / 2 - bubble.height / 2,
        left: anchor.left + anchor.width + gap,
        fits: anchor.left + anchor.width + gap + bubble.width <= Number.POSITIVE_INFINITY,
      };
    case "left":
      return {
        top: anchor.top + anchor.height / 2 - bubble.height / 2,
        left: anchor.left - gap - bubble.width,
        fits: anchor.left - gap >= bubble.width,
      };
    default:
      return {
        top: anchor.top + anchor.height + gap,
        left: anchor.left + anchor.width / 2 - bubble.width / 2,
        fits: false,
      };
  }
}

function availableSpace(side: ResolvedSide, anchor: TourRect, viewport: TourViewport): number {
  switch (side) {
    case "top":
      return anchor.top;
    case "bottom":
      return viewport.height - (anchor.top + anchor.height);
    case "left":
      return anchor.left;
    default:
      return viewport.width - (anchor.left + anchor.width);
  }
}

/**
 * Place the bubble, then shift it inside the viewport. A preferred side wins
 * only when it can fit; otherwise the side with the most room wins. The returned
 * tail coordinates stay clamped to the bubble's rounded shoulder.
 */
export function positionTourBubble({
  anchor,
  bubble,
  viewport,
  preferred = "auto",
  gap = 16,
  margin = 12,
}: PositionTourBubbleOptions): TourBubblePosition {
  if (!anchor) {
    return {
      top: Math.max(margin, (viewport.height - bubble.height) / 2),
      left: Math.max(margin, (viewport.width - bubble.width) / 2),
      placement: "center",
      tail: null,
    };
  }

  const preferredOrder: ResolvedSide[] =
    preferred === "auto"
      ? [...SIDES]
      : [
          preferred,
          ...SIDES.filter((side) => side !== preferred).sort(
            (a, b) => availableSpace(b, anchor, viewport) - availableSpace(a, anchor, viewport),
          ),
        ];
  const side =
    preferredOrder.find((candidateSide) => {
      const rect = candidate(candidateSide, anchor, bubble, gap);
      const minX = margin;
      const maxX = viewport.width - bubble.width - margin;
      const minY = margin;
      const maxY = viewport.height - bubble.height - margin;
      return (
        availableSpace(candidateSide, anchor, viewport) >=
          (candidateSide === "top" || candidateSide === "bottom" ? bubble.height : bubble.width) + gap &&
        rect.left >= minX - 0.5 &&
        rect.left <= maxX + 0.5 &&
        rect.top >= minY - 0.5 &&
        rect.top <= maxY + 0.5
      );
    }) ??
    [...SIDES].sort(
      (a, b) => availableSpace(b, anchor, viewport) - availableSpace(a, anchor, viewport),
    )[0]!;

  const raw = candidate(side, anchor, bubble, gap);
  const left = clamp(raw.left, margin, viewport.width - bubble.width - margin);
  const top = clamp(raw.top, margin, viewport.height - bubble.height - margin);
  const anchorCenterX = anchor.left + anchor.width / 2;
  const anchorCenterY = anchor.top + anchor.height / 2;
  const tailInset = Math.min(28, Math.max(18, bubble.width * 0.08));

  if (side === "top" || side === "bottom") {
    return {
      top,
      left,
      placement: side,
      tail: {
        x: clamp(anchorCenterX - left, tailInset, bubble.width - tailInset),
        y: side === "top" ? bubble.height : 0,
        side: side === "top" ? "bottom" : "top",
      },
    };
  }

  return {
    top,
    left,
    placement: side,
    tail: {
      x: side === "left" ? bubble.width : 0,
      y: clamp(anchorCenterY - top, tailInset, bubble.height - tailInset),
      side: side === "left" ? "right" : "left",
    },
  };
}

