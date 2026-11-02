"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { useControllableState } from "../hooks/use-controllable-state";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import {
  measureTarget,
  resolveTourTarget,
  revealTourTarget,
  sameTourRect,
  type ProductTourPlacement,
  type ProductTourTarget,
  type TourRect,
} from "./engine";
import {
  ProductTourBubble,
  type ProductTourBubbleLabels,
} from "./bubble";
import { ProductTourSpotlight } from "./spotlight";

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
 * An optional welcome moment before step one. The target is highlighted first;
 * accepting the intro starts the first step, while declining dismisses the tour.
 */
export interface ProductTourIntro {
  target?: ProductTourTarget;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  placement?: ProductTourPlacement;
  padding?: number;
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

function useViewport() {
  const [viewport, setViewport] = useState(() =>
    typeof window === "undefined"
      ? { width: 0, height: 0 }
      : { width: window.innerWidth, height: window.innerHeight },
  );

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const visual = window.visualViewport;
        setViewport((current) => {
          const next = {
            width: visual?.width ?? window.innerWidth,
            height: visual?.height ?? window.innerHeight,
          };
          return current.width === next.width && current.height === next.height
            ? current
            : next;
        });
      });
    };
    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, []);

  return viewport;
}

function isVisiblePage(): boolean {
  return typeof document === "undefined" || document.visibilityState !== "hidden";
}

/**
 * LUC ProductTour — a guided layer over a live product surface.
 *
 * Visual identity lives in `ProductTourBubble` and `ProductTourSpotlight`;
 * positioning lives in the adapter (`engine.ts`), and this file owns only the
 * lifecycle. The separation is intentional: a different positioning engine can
 * replace the adapter without changing the public component contract.
 */
export function ProductTour({
  steps,
  intro,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  stepIndex: controlledIndex,
  defaultStepIndex = 0,
  onStepChange,
  variant = "minimal-glass",
  mode = "manual",
  interval = 2000,
  spotlight = true,
  onComplete,
  onSkip,
  onClose,
  onTargetUnavailable,
  onStatusChange,
  labels,
  className,
  ref,
}: ProductTourProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [open, setOpen] = useControllableState({
    value: controlledOpen,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const [index, setIndex] = useControllableState({
    value: controlledIndex,
    defaultValue: defaultStepIndex,
    onChange: (next) => {
      const step = steps[next];
      if (step) onStepChange?.(next, step);
    },
  });
  const safeIndex = Math.min(Math.max(index, 0), Math.max(0, steps.length - 1));
  const step = steps[safeIndex];
  const [introDone, setIntroDone] = useState(false);
  const introActive = Boolean(intro) && !introDone && steps.length > 0;
  const activeStep = useMemo<ProductTourStep | undefined>(
    () =>
      introActive && intro
        ? {
            id: "__product-tour-intro__",
            target: intro.target,
            eyebrow: intro.eyebrow,
            title: intro.title,
            description: intro.description,
            icon: intro.icon,
            placement: intro.placement,
            padding: intro.padding,
          }
        : step,
    [intro, introActive, step],
  );
  const [rect, setRect] = useState<TourRect | null>(null);
  const [missing, setMissing] = useState(false);
  const [paused, setPaused] = useState(false);
  const [bubbleHovered, setBubbleHovered] = useState(false);
  const [targetEngaged, setTargetEngaged] = useState(false);
  const [pageVisible, setPageVisible] = useState(isVisiblePage);
  const [finalStatus, setFinalStatus] = useState<"idle" | "completed" | "dismissed">("idle");
  const bubbleRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<Element | null>(null);
  const viewport = useViewport();
  const reducedMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const statusId = useId();
  const stepRef = useRef(activeStep);
  const callbacks = useRef({ onComplete, onSkip, onClose, onTargetUnavailable });
  useEffect(() => {
    callbacks.current = { onComplete, onSkip, onClose, onTargetUnavailable };
  }, [onClose, onComplete, onSkip, onTargetUnavailable]);

  useEffect(() => {
    stepRef.current = activeStep;
  }, [activeStep]);

  const autoPaused =
    paused || (mode === "auto" && (bubbleHovered || targetEngaged || !pageVisible));
  const status: ProductTourStatus = !open
    ? finalStatus
    : autoPaused
      ? "paused"
      : "running";

  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  const dismiss = useCallback(
    (kind: "skip" | "close") => {
      setIntroDone(true);
      setPaused(false);
      setFinalStatus(kind === "skip" ? "dismissed" : "dismissed");
      setOpen(false);
      if (kind === "skip") callbacks.current.onSkip?.();
      else callbacks.current.onClose?.();
    },
    [setOpen],
  );

  const complete = useCallback(() => {
    setIntroDone(true);
    setPaused(false);
    setFinalStatus("completed");
    setOpen(false);
    callbacks.current.onComplete?.();
  }, [setOpen]);

  const goTo = useCallback(
    (next: number) => {
      if (steps.length === 0) return;
      setIntroDone(true);
      const bounded = Math.min(Math.max(next, 0), steps.length - 1);
      if (bounded === safeIndex) return;
      if (mode === "auto") setPaused(true);
      setBubbleHovered(false);
      setIndex(bounded);
    },
    [mode, safeIndex, setIndex, steps.length],
  );

  const autoAdvance = useCallback(() => {
    if (safeIndex >= steps.length - 1) return;
    setPaused(false);
    setBubbleHovered(false);
    setIndex(safeIndex + 1);
  }, [safeIndex, setIndex, steps.length]);

  const next = useCallback(() => {
    if (introActive) {
      setIntroDone(true);
      setPaused(false);
      setBubbleHovered(false);
      return;
    }
    if (safeIndex >= steps.length - 1) complete();
    else goTo(safeIndex + 1);
  }, [complete, goTo, introActive, safeIndex, steps.length]);

  const start = useCallback(
    (nextIndex = 0) => {
      if (steps.length === 0) return;
      const boundedIndex = Math.min(Math.max(nextIndex, 0), steps.length - 1);
      setPaused(false);
      setBubbleHovered(false);
      setTargetEngaged(false);
      setRect(null);
      setMissing(false);
      setFinalStatus("idle");
      setIntroDone(!intro || boundedIndex !== 0);
      setIndex(boundedIndex);
      setOpen(true);
    },
    [intro, setIndex, setOpen, steps.length],
  );

  useImperativeHandle(
    ref,
    () => ({
      start,
      next,
      previous: () => goTo(safeIndex - 1),
      goTo,
      pause: () => setPaused(true),
      resume: () => setPaused(false),
      skip: () => dismiss("skip"),
      complete,
      close: () => dismiss("close"),
      restart: () => start(0),
    }),
    [complete, dismiss, goTo, next, safeIndex, start],
  );

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement;
    const timer = window.setTimeout(() => bubbleRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(timer);
      const previous = previousFocus.current;
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleVisibility = () => setPageVisible(isVisiblePage());
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleFocus = (event: FocusEvent) => {
      const target = stepRef.current
        ? resolveTourTarget(stepRef.current.target)
        : null;
      setTargetEngaged(Boolean(target && event.target instanceof Node && target.contains(event.target)));
    };
    document.addEventListener("focusin", handleFocus);
    return () => document.removeEventListener("focusin", handleFocus);
  }, [open]);

  const measuredRef = useRef<Element | null>(null);
  useEffect(() => {
    if (!open || !activeStep) return;
    let disposed = false;
    let frame = 0;
    let observer: ResizeObserver | null = null;
    let mutation: MutationObserver | null = null;
    let retryTimers: number[] = [];
    let revealTimer = 0;
    let lastReveal = 0;

    const update = (reveal = false) => {
      if (disposed) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (disposed) return;
        const target = resolveTourTarget(activeStep.target);
        if (!target) {
          measuredRef.current = null;
          observer?.disconnect();
          observer = null;
          setMissing(true);
          setRect(null);
          callbacks.current.onTargetUnavailable?.(activeStep);
          return;
        }
        if (measuredRef.current !== target) {
          measuredRef.current = target;
          observer?.disconnect();
          observer = new ResizeObserver(() => update(false));
          observer.observe(target);
          if (reveal) revealTourTarget(target, reducedMotion);
        }
        const nextRect = measureTarget(target, activeStep.padding ?? 8);
        setMissing(!nextRect);
        setRect((current) => (sameTourRect(current, nextRect) ? current : nextRect));
        if (
          nextRect &&
          (nextRect.top < 0 ||
            nextRect.left < 0 ||
            nextRect.top + nextRect.height > window.innerHeight ||
            nextRect.left + nextRect.width > window.innerWidth) &&
          Date.now() - lastReveal > 400
        ) {
          lastReveal = Date.now();
          window.clearTimeout(revealTimer);
          revealTimer = window.setTimeout(
            () => revealTourTarget(target, reducedMotion),
            40,
          );
        }
      });
    };

    update(true);
    const handleViewportChange = () => update(false);
    mutation = new MutationObserver(() => {
      const target = resolveTourTarget(activeStep.target);
      if (!target || !target.isConnected || measuredRef.current !== target) update(false);
    });
    mutation.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "disabled"],
    });
    retryTimers = [120, 480, 1200].map((delay) =>
      window.setTimeout(() => update(false), delay),
    );
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    window.visualViewport?.addEventListener("scroll", handleViewportChange);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      mutation?.disconnect();
      retryTimers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(revealTimer);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
      window.visualViewport?.removeEventListener("scroll", handleViewportChange);
    };
  }, [activeStep, open, reducedMotion]);

  useEffect(() => {
    if (!open || !activeStep) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const active = document.activeElement;
      const editing =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        (active instanceof HTMLElement && active.isContentEditable);

      if (event.key === "Escape") {
        event.preventDefault();
        dismiss("skip");
        return;
      }
      if (!editing && event.key === "ArrowRight") {
        event.preventDefault();
        next();
        return;
      }
      if (!editing && event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(safeIndex - 1);
        return;
      }
      if (event.key !== "Tab") return;

      const target = resolveTourTarget(activeStep.target);
      const candidates = [
        ...(target
          ? [
              ...(target.matches("a[href], button, input, select, textarea, [tabindex]")
                ? [target as HTMLElement]
                : []),
              ...Array.from(
                target.querySelectorAll<HTMLElement>(
                  'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
                ),
              ),
            ]
          : []),
        ...Array.from(
          bubbleRef.current?.querySelectorAll<HTMLElement>(
            'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ) ?? [],
        ),
      ].filter(
        (node) =>
          !node.hasAttribute("disabled") &&
          !node.getAttribute("aria-hidden"),
      );
      if (candidates.length === 0) return;
      const first = candidates[0]!;
      const last = candidates[candidates.length - 1]!;
      if (event.shiftKey && (active === first || !candidates.includes(active as HTMLElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeStep, dismiss, goTo, next, open, safeIndex]);

  if (!mounted || !activeStep) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="product-tour"
          data-slot="product-tour"
          data-variant={variant}
          data-status={status}
          className={className}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.001 : 0.22, ease: [0.2, 0, 0, 1] }}
        >
          {spotlight ? (
            <ProductTourSpotlight
              rect={rect}
              viewport={viewport}
              visible
              variant={variant}
              onDismiss={() => dismiss("close")}
              dismissLabel={labels?.close ?? "Close tour"}
            />
          ) : null}
          <AnimatePresence initial={false}>
            <ProductTourBubble
              key="bubble"
              eyebrow={activeStep.eyebrow}
              title={activeStep.title}
              description={activeStep.description}
              icon={activeStep.icon}
              index={safeIndex}
              total={steps.length}
              placement={activeStep.placement ?? "auto"}
              anchor={rect}
              variant={variant}
              auto={mode === "auto" && !introActive}
              interval={interval}
              paused={autoPaused}
              missing={missing}
              intro={introActive}
              onBack={() => goTo(safeIndex - 1)}
              onNext={next}
              onAutoAdvance={autoAdvance}
              onSkip={() => dismiss("skip")}
              onClose={() => dismiss("close")}
              onTogglePause={() => setPaused((current) => !current)}
              labels={labels}
              titleId={titleId}
              descriptionId={descriptionId}
              bubbleRef={bubbleRef}
              onHoverChange={setBubbleHovered}
            />
          </AnimatePresence>
          <div
            id={statusId}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {introActive
              ? labels?.introStatus ??
                "Tour welcome. Take the tour or explore on your own."
              : missing
              ? labels?.unavailableTitle ?? "Waiting for the highlighted element"
              : `${labels?.region ?? "Product tour"}. ${labels?.step?.(safeIndex + 1, steps.length) ?? `Step ${safeIndex + 1} of ${steps.length}`}.`}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

