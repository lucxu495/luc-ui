import { ProductTourPlacement, ProductTourTarget } from "./engine.js";
import { ProductTourBubbleLabels } from "./bubble.js";
import { ReactNode, Ref } from "react";
//#region src/product-tour/product-tour.d.ts
export type ProductTourVariant = "minimal-glass" | "cloud-glass";
export type ProductTourMode = "manual" | "auto";
export type ProductTourStatus = "idle" | "running" | "paused" | "completed" | "dismissed";
export interface ProductTourStep {
  id: string;
  target?: ProductTourTarget;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  placement?: ProductTourPlacement;
  padding?: number;
}
/**
 * An optional welcome moment before step one. With no target it opens as a
 * centred global spotlight; accepting starts step one in the same layer.
 */
export interface ProductTourIntro {
  target?: ProductTourTarget;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  placement?: ProductTourPlacement;
  padding?: number;
  /** Advance into step one after this many milliseconds. Omit for manual choice. */
  autoStartAfter?: number;
}
export interface ProductTourLabels extends ProductTourBubbleLabels {
  region?: string;
}
export interface ProductTourHandle {
  start: (index?: number) => void;
  next: () => void;
  previous: () => void;
  goTo: (index: number) => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  complete: () => void;
  close: () => void;
  restart: () => void;
}
export interface ProductTourProps {
  steps: readonly ProductTourStep[];
  intro?: ProductTourIntro;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  stepIndex?: number;
  defaultStepIndex?: number;
  onStepChange?: (index: number, step: ProductTourStep) => void;
  variant?: ProductTourVariant;
  mode?: ProductTourMode;
  /** Milliseconds per step in auto mode. Default 2000. */
  interval?: number;
  spotlight?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
  onClose?: () => void;
  onTargetUnavailable?: (step: ProductTourStep) => void;
  onStatusChange?: (status: ProductTourStatus) => void;
  labels?: ProductTourLabels;
  className?: string;
  ref?: Ref<ProductTourHandle>;
}
/**
 * LUC ProductTour — a guided layer over a live product surface.
 *
 * Visual identity lives in `ProductTourBubble` and `ProductTourSpotlight`;
 * positioning lives in the adapter (`engine.ts`), and this file owns only the
 * lifecycle. The separation is intentional: a different positioning engine can
 * replace the adapter without changing the public component contract.
 */
export declare function ProductTour({ steps, intro, open: controlledOpen, defaultOpen, onOpenChange, stepIndex: controlledIndex, defaultStepIndex, onStepChange, variant, mode, interval, spotlight, onComplete, onSkip, onClose, onTargetUnavailable, onStatusChange, labels, className, ref }: ProductTourProps): import("react").ReactPortal | null;
//#endregion
//# sourceMappingURL=product-tour.d.ts.map