//#region src/product-tour/engine.d.ts
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
export type ProductTourTarget = string | Element | (() => Element | null) | undefined | null;
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
  tail: {
    x: number;
    y: number;
    side: "top" | "right" | "bottom" | "left";
  } | null;
}
export interface PositionTourBubbleOptions {
  anchor: TourRect | null;
  bubble: {
    width: number;
    height: number;
  };
  viewport: TourViewport;
  preferred?: ProductTourPlacement;
  gap?: number;
  margin?: number;
}
/**
 * Resolve every supported selector shape without assuming a document exists.
 * A resolver function is useful for React refs and virtualised rows; a selector
 * remains the compact default for page-level tours.
 */
export declare function resolveTourTarget(target: ProductTourTarget, root?: ParentNode): Element | null;
/**
 * `getBoundingClientRect()` is already in viewport coordinates, which is also
 * the coordinate system of the fixed spotlight and bubble. Using scroll offsets
 * here would double-count scrolling, especially inside nested containers.
 */
export declare function measureTarget(element: Element, padding?: number): TourRect | null;
/**
 * Place the bubble, then shift it inside the viewport. A preferred side wins
 * only when it can fit; otherwise the side with the most room wins. The returned
 * tail coordinates stay clamped to the bubble's rounded shoulder.
 */
export declare function positionTourBubble({ anchor, bubble, viewport, preferred, gap, margin }: PositionTourBubbleOptions): TourBubblePosition;
//#endregion
//# sourceMappingURL=engine.d.ts.map