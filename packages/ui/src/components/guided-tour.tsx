"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine, RiCloseLine } from "@remixicon/react";
import { cn } from "../utils/cn";
import { Button } from "./button-base";
import { IconButton } from "./icon-button";

/**
 * LUC GuidedTour — walk a user through a live interface.
 *
 * Three decisions keep this honest:
 *
 *   1. **It points at the product, it does not duplicate it.** A step names a
 *      CSS selector; the spotlight is measured from the real element on every
 *      scroll and resize, so the tour cannot drift out of sync with a layout it
 *      does not own.
 *   2. **The scrim is a shadow, not four rectangles.** One box-shadow draws the
 *      hole, which means the highlighted region is exactly one element and
 *      there is no seam to get wrong.
 *   3. **It is dismissible from the keyboard.** Escape leaves the tour from any
 *      step, focus moves into the card when it opens and returns to the page
 *      when it closes, and the controls are real buttons.
 *
 * The overlay is only mounted while `open`, so nothing measures, listens or
 * renders on a page where the tour is not running.
 */

export type TourPlacement = "bottom" | "top" | "right" | "left";

export interface TourStep {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  /** CSS selector of the element to spotlight. Omit for a centred, targetless step. */
  target?: string;
  placement?: TourPlacement;
  /** Breathing room around the spotlight rect, in pixels. Default 8. */
  padding?: number;
}

export interface GuidedTourLabels {
  next?: string;
  previous?: string;
  skip?: string;
  done?: string;
  /** Step counter, e.g. `(index, total) => \`Step 2 of 5\``. */
  counter?: (index: number, total: number) => string;
  close?: string;
}

export interface GuidedTourProps {
  steps: readonly TourStep[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stepIndex?: number;
  defaultStepIndex?: number;
  onStepChange?: (index: number) => void;
  labels?: GuidedTourLabels;
  className?: string;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const CARD_WIDTH = 320;
const GAP = 14;

function measure(step: TourStep | undefined): Rect | null {
  if (!step?.target || typeof document === "undefined") return null;
  const element = document.querySelector(step.target);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  const pad = step.padding ?? 8;
  return {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };
}

/** Place the card, flipping to the opposite side when there is no room. */
function place(rect: Rect | null, placement: TourPlacement) {
  if (!rect || typeof window === "undefined") {
    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" } as const;
  }
  const viewport = { w: window.innerWidth, h: window.innerHeight };
  const wants = placement;
  const fits = {
    bottom: rect.top + rect.height + GAP + 180 < viewport.h,
    top: rect.top - GAP - 180 > 0,
    right: rect.left + rect.width + GAP + CARD_WIDTH < viewport.w,
    left: rect.left - GAP - CARD_WIDTH > 0,
  };
  const order: TourPlacement[] = [wants, wants === "bottom" ? "top" : "bottom", "right", "left"];
  const chosen = order.find((candidate) => fits[candidate]) ?? wants;

  switch (chosen) {
    case "top":
      return {
        top: rect.top - GAP,
        left: rect.left + rect.width / 2,
        transform: "translate(-50%, -100%)",
      } as const;
    case "right":
      return {
        top: rect.top + rect.height / 2,
        left: rect.left + rect.width + GAP,
        transform: "translate(0, -50%)",
      } as const;
    case "left":
      return {
        top: rect.top + rect.height / 2,
        left: rect.left - GAP,
        transform: "translate(-100%, -50%)",
      } as const;
    default:
      return {
        top: rect.top + rect.height + GAP,
        left: rect.left + rect.width / 2,
        transform: "translate(-50%, 0)",
      } as const;
  }
}

export function GuidedTour({
  steps,
  open,
  onOpenChange,
  stepIndex,
  defaultStepIndex = 0,
  onStepChange,
  labels,
  className,
}: GuidedTourProps) {
  const controlled = stepIndex !== undefined;
  const [internal, setInternal] = useState(defaultStepIndex);
  const index = Math.min(Math.max(controlled ? (stepIndex as number) : internal, 0), Math.max(steps.length - 1, 0));
  const step = steps[index];
  const [rect, setRect] = useState<Rect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<Element | null>(null);
  const titleId = useId();
  const descId = useId();

  const goTo = useCallback(
    (next: number) => {
      const bounded = Math.min(Math.max(next, 0), steps.length - 1);
      if (!controlled) setInternal(bounded);
      onStepChange?.(bounded);
    },
    [controlled, onStepChange, steps.length],
  );

  useEffect(() => {
    if (!open) return;
    const update = () => setRect(measure(steps[index]));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const timer = window.setTimeout(update, 120);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.clearTimeout(timer);
    };
  }, [index, open, steps]);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement;
    // The card is mounted in the same commit, so it can take focus directly.
    cardRef.current?.focus();
    return () => {
      const previous = restoreRef.current;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [open]);

  if (!open || !step) return null;

  const isLast = index === steps.length - 1;
  const position = place(rect, step.placement ?? "bottom");

  return (
    <div data-slot="guided-tour" className={cn("fixed inset-0 z-[var(--z-overlay)]", className)}>
      {/*
        The spotlight is a positioned element with a shadow big enough to cover
        the viewport. Clicking the shadow dismisses; clicking the hole does not,
        because the hole is covered by the spotlight element itself, which is
        pointer-transparent.
      */}
      {/*
        A real button, not a decorative div: dismissing by clicking outside is a
        pointer affordance, and the element that receives the click has to be an
        interactive one. It is out of the tab order because Escape and Skip
        already cover the keyboard path.
      */}
      <button
        type="button"
        tabIndex={-1}
        aria-label={labels?.close ?? "Close tour"}
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 cursor-default"
        style={{ boxShadow: "0 0 0 9999px var(--surface-scrim)" }}
      />
      <div
        aria-hidden="true"
        /*
         * The spotlight carries its own geometry transition.
         *
         * `luc-transition-slow` moves colour, shadow, opacity and transform —
         * not `top`/`left`/`width`/`height` — so the highlight used to teleport
         * between steps while the card beside it slid, which reads as two
         * different animations happening at once. The spotlight *is* the state
         * change, so it is the element that should travel; the geometry is
         * animated on the emphasized curve, over the same duration the card
         * uses, and the base layer's reduced-motion clamp turns it into a snap
         * for a reader who asked for one.
         */
        className={cn(
          "pointer-events-none absolute rounded-lg ring-2 ring-line-accent",
          "[transition:top_var(--motion-normal)_var(--ease-emphasized),left_var(--motion-normal)_var(--ease-emphasized),width_var(--motion-normal)_var(--ease-emphasized),height_var(--motion-normal)_var(--ease-emphasized),opacity_var(--motion-fast)_var(--ease-standard)]",
        )}
        style={
          rect
            ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
            : { top: "50%", left: "50%", width: 0, height: 0 }
        }
      />
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- a modal dialog owns its own keyboard contract (Escape, arrows, focus ring) */}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={step.description ? descId : undefined}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onOpenChange(false);
          }
          if (event.key === "ArrowRight" && !isLast) goTo(index + 1);
          if (event.key === "ArrowLeft" && index > 0) goTo(index - 1);
          if (event.key === "Tab") {
            // Small, closed focus ring: the card owns the focus while it is up.
            const focusables = cardRef.current?.querySelectorAll<HTMLElement>("button, [href], input, select, textarea");
            const first = focusables?.[0];
            const last = focusables?.[focusables.length - 1];
            if (!first || !last) return;
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first.focus();
            }
          }
        }}
        style={{ position: "fixed", width: CARD_WIDTH, ...position }}
        className={cn(
          "luc-float-high flex flex-col gap-3 rounded-lg border border-line-subtle bg-surface-overlay p-4",
          "luc-settle focus:outline-none",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="flex flex-col gap-1">
            {labels?.counter ? (
              <span className="text-micro text-fg-accent uppercase luc-numeric">
                {labels.counter(index, steps.length)}
              </span>
            ) : null}
            <span id={titleId} className="text-label font-medium text-fg-primary">
              {step.title}
            </span>
          </span>
          <IconButton
            variant="ghost"
            size="sm"
            label={labels?.close ?? "Close tour"}
            icon={<RiCloseLine />}
            onClick={() => onOpenChange(false)}
          />
        </div>
        {step.description ? (
          <p id={descId} className="text-caption text-fg-secondary">
            {step.description}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            {labels?.skip ?? "Skip"}
          </Button>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={index === 0}
              onClick={() => goTo(index - 1)}
            >
              <RiArrowLeftSLine aria-hidden="true" className="size-4" />
              {labels?.previous ?? "Back"}
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={() => (isLast ? onOpenChange(false) : goTo(index + 1))}>
              {isLast ? (labels?.done ?? "Done") : (labels?.next ?? "Next")}
              {isLast ? null : <RiArrowRightSLine aria-hidden="true" className="size-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
