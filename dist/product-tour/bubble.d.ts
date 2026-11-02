import { ProductTourPlacement, TourRect } from "./engine.js";
import { ReactNode } from "react";
//#region src/product-tour/bubble.d.ts
export interface ProductTourBubbleLabels {
  back?: string;
  next?: string;
  finish?: string;
  skip?: string;
  close?: string;
  pause?: string;
  resume?: string;
  step?: (current: number, total: number) => string;
  introMeta?: (total: number) => string;
  introAutoStart?: (seconds: number) => string;
  introStatus?: string;
  takeTour?: string;
  exploreAlone?: string;
  unavailableTitle?: string;
  unavailableDescription?: string;
}
export interface ProductTourBubbleProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  index: number;
  total: number;
  placement: ProductTourPlacement;
  anchor: TourRect | null;
  variant: "minimal-glass" | "cloud-glass";
  auto: boolean;
  interval: number;
  paused: boolean;
  missing: boolean;
  intro?: boolean;
  introAutoStartAfter?: number;
  onBack: () => void;
  onNext: () => void;
  onAutoAdvance: () => void;
  onSkip: () => void;
  onClose: () => void;
  onTogglePause: () => void;
  labels?: ProductTourBubbleLabels;
  titleId: string;
  descriptionId: string;
  bubbleRef: React.Ref<HTMLDivElement>;
  onHoverChange: (hovered: boolean) => void;
}
export declare function ProductTourBubble({ eyebrow, title, description, icon, index, total, placement, anchor, variant, auto, interval, paused, missing, intro, introAutoStartAfter, onBack, onNext, onAutoAdvance, onSkip, onClose, onTogglePause, labels, titleId, descriptionId, bubbleRef, onHoverChange }: ProductTourBubbleProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=bubble.d.ts.map