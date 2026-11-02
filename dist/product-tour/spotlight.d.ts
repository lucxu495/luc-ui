import { TourRect } from "./engine.js";
//#region src/product-tour/spotlight.d.ts
export interface ProductTourSpotlightProps {
  rect: TourRect | null;
  viewport: {
    width: number;
    height: number;
  };
  visible: boolean;
  variant: "minimal-glass" | "cloud-glass";
  onDismiss: () => void;
  dismissLabel: string;
}
/**
 * Four scrim plates leave the highlighted rectangle genuinely interactive.
 * A single shadow-based cut-out looks identical in a screenshot, but it blocks
 * the target underneath; a guided product tour has to be able to explain an
 * input that the reader can still use.
 */
export declare function ProductTourSpotlight({ rect, viewport, visible, variant, onDismiss, dismissLabel }: ProductTourSpotlightProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=spotlight.d.ts.map