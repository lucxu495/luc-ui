"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import {
  MorphingDialog,
  MorphingDialogClose,
  MorphingDialogContent,
  MorphingDialogDescription,
  MorphingDialogTitle,
  MorphingDialogTrigger,
} from "../../motion/morphing-dialog";
import { IconButton } from "../../components/icon-button";
import { RiCloseLine } from "@remixicon/react";
import { FullscreenButton, RangeSelector } from "../chart-card";
import { ScaleSelector } from "../chart-card";
import type { YScaleMode } from "../core/axis";
import {
  INSPECTOR_MIN_HEIGHT,
  INSPECTOR_MIN_WIDTH,
  type InspectorSize,
  maxInspectorSize,
  openingInspectorSize,
  resizeInspector,
  storeInspectorSize,
} from "../core/inspector-size";
import { ChartExportButton } from "./chart-toolbar";

/**
 * Expanded chart inspector.
 *
 * A research workbench, not a big modal:
 *
 * - **Centred on the viewport.** The portal lives on `<body>`, the positioning
 *   frame is `fixed inset-0`, and nothing about the product's shell takes part in
 *   the centring. (An earlier version padded the frame by the measured rail and
 *   outline widths to "fill the workspace" — which moved the panel's centre to
 *   the *workspace* centre: +120px to the right on a page with a left rail and no
 *   right column. The reader asked for a viewport-centred inspector and that is
 *   what this does.)
 * - **Large by default, and the reader can change it.** The opening size is a
 *   fraction of the viewport (clamped by floors and ceilings), and eight handles
 *   — four edges, four corners — resize it. The size is remembered across opens
 *   and clamped against whatever viewport the reader is on now.
 * - **Resizing is not a range change.** Nothing here touches the chart's data or
 *   its sync group: the panel gets more pixels for the same reader-selected
 *   window, which is precisely the ADR-035 semantics (a resize is not a write).
 * - **The chart is re-rendered at the larger size, never reparented.** Engines
 *   react to their own container's size (Lightweight Charts `autoSize`, ECharts'
 *   resize observer), so a drag grows the plot continuously without a remount.
 */

/** Localized accessible names for the resize controls. */
export interface InspectorResizeLabels {
  /** e.g. "Resize chart inspector width". */
  width: string;
  /** e.g. "Resize chart inspector height". */
  height: string;
}

export interface FullscreenResearchViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Accessible name of the close control (localized by the caller). */
  closeLabel?: string;
  /** Accessible names for the resize handles (localized by the caller). */
  resizeLabels?: InspectorResizeLabels;
  /**
   * Where focus returns when the view closes.
   *
   * The caller owns the trigger (it lives in the chart's own toolbar), so it
   * hands its ref over: Radix would otherwise look for a `Dialog.Trigger` this
   * view intentionally does not have, and a reader would be dropped on `<body>`
   * after pressing Escape.
   */
  returnFocusTo?: React.RefObject<HTMLElement | null>;
  /** Latest values, shown beside the title. */
  metrics?: ReactNode;
  /** The chart itself. The height is 100% inside the dialog. */
  renderChart: (options: { height: number | string; fullscreen: boolean }) => ReactNode;
  legend?: ReactNode;
  ranges?: readonly string[];
  range?: string;
  onRangeChange?: (range: string) => void;
  /**
   * The Linear/Log control.
   *
   * The mode lives with the caller (a URL, a preference store), so opening the
   * fullscreen view shows the same scale as the inline chart and closing it
   * leaves the choice untouched.
   */
  scale?: {
    allowed: readonly YScaleMode[];
    value: YScaleMode;
    onValueChange: (mode: YScaleMode) => void;
    labels?: Partial<Record<YScaleMode, string>>;
  };
  /** Extra toolbar controls. */
  actions?: ReactNode;
  exportTarget?: () => unknown;
  exportFilename?: string;
}

/** How far one arrow key moves a handle, and how far Shift moves it. */
const KEY_STEP = 16;
const KEY_STEP_LARGE = 64;

interface ResizeHandleSpec {
  /** `left` / `right` / `top` / `bottom` / corners. */
  id: string;
  /** Which sign of the pointer delta widens the panel. */
  flipX: boolean;
  flipY: boolean;
  horizontal: boolean;
  vertical: boolean;
  className: string;
  /** Corners are pointer affordances; the four edges are the accessible controls. */
  decorative: boolean;
  orientation: "vertical" | "horizontal";
}

/*
 * Eight handles. The panel is centred, so an edge drag moves both edges: the
 * resize model doubles the delta, which is why "drag the left edge left" and
 * "drag the right edge right" both mean "wider". The hit areas are 10–14px bands
 * even though the visible affordance is a hairline — a 4px invisible corner is
 * exactly what the reader complained about.
 *
 * They sit *inside* the panel's box on purpose. The panel clips its overflow
 * (rounded corners), and a handle straddling the edge would have half of its hit
 * area clipped away — the reader would aim at the middle of a control that is not
 * there. Flush with the inside edge, the whole band is grabbable.
 */
const RESIZE_HANDLES: readonly ResizeHandleSpec[] = [
  { id: "left", flipX: true, flipY: false, horizontal: true, vertical: false, decorative: false, orientation: "vertical", className: "left-0 inset-y-3 w-2.5 cursor-ew-resize" },
  { id: "right", flipX: false, flipY: false, horizontal: true, vertical: false, decorative: false, orientation: "vertical", className: "right-0 inset-y-3 w-2.5 cursor-ew-resize" },
  { id: "top", flipX: false, flipY: true, horizontal: false, vertical: true, decorative: false, orientation: "horizontal", className: "top-0 inset-x-3 h-2.5 cursor-ns-resize" },
  { id: "bottom", flipX: false, flipY: false, horizontal: false, vertical: true, decorative: false, orientation: "horizontal", className: "bottom-0 inset-x-3 h-2.5 cursor-ns-resize" },
  { id: "top-left", flipX: true, flipY: true, horizontal: true, vertical: true, decorative: true, orientation: "vertical", className: "top-0 left-0 size-4 cursor-nwse-resize" },
  { id: "top-right", flipX: false, flipY: true, horizontal: true, vertical: true, decorative: true, orientation: "vertical", className: "top-0 right-0 size-4 cursor-nesw-resize" },
  { id: "bottom-left", flipX: true, flipY: false, horizontal: true, vertical: true, decorative: true, orientation: "vertical", className: "bottom-0 left-0 size-4 cursor-nesw-resize" },
  { id: "bottom-right", flipX: false, flipY: false, horizontal: true, vertical: true, decorative: true, orientation: "vertical", className: "bottom-0 right-0 size-4 cursor-nwse-resize" },
];

function viewport(): { width: number; height: number } {
  if (typeof window === "undefined") return { width: 1440, height: 900 };
  return { width: window.innerWidth, height: window.innerHeight };
}

export function FullscreenResearchView({
  open,
  onOpenChange,
  title,
  description,
  closeLabel = "Exit fullscreen",
  resizeLabels = { width: "Resize chart inspector width", height: "Resize chart inspector height" },
  returnFocusTo,
  metrics,
  renderChart,
  legend,
  ranges,
  range,
  onRangeChange,
  scale,
  actions,
  exportTarget,
  exportFilename,
}: FullscreenResearchViewProps) {
  /*
   * Focus comes back to the control that opened the view.
   *
   * Radix restores focus to a `Dialog.Trigger`, and this view deliberately has
   * none — the trigger is the caller's own toolbar button, so Radix's restore
   * would drop the reader on `<body>`. Recording the focused element on open and
   * restoring it on close (preferring the caller's ref when it has one) makes
   * the contract hold for every caller, whatever the content happens to be.
   */
  const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) {
      previousFocus.current =
        returnFocusTo?.current ??
        (typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null);
      return;
    }
    const target = previousFocus.current;
    if (!target) return;
    previousFocus.current = null;
    // After the close handlers (and the exit frame) have run.
    const timer = window.setTimeout(() => {
      if (target.isConnected) target.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open, returnFocusTo]);

  /*
   * The size the panel is on.
   *
   * `null` until the dialog opens (there is no viewport to size against during
   * a server render), then: the remembered size clamped against the current
   * viewport, or the viewport default when nothing is remembered.
   */
  const [size, setSize] = useState<InspectorSize | null>(null);
  const sizeRef = useRef<InspectorSize | null>(null);
  const [resizing, setResizing] = useState<string | null>(null);

  const applySize = useCallback((next: InspectorSize) => {
    setSize(next);
  }, []);
  /*
   * A mirror of `size` for the pointer handlers.
   *
   * Pointer events need the size *at the moment they run*, without re-creating
   * the handlers on every frame of a drag (which would re-render the chart host).
   * Writing a ref from an effect is the supported direction; writing it during
   * render is not, so the mirror is synced here instead.
   */
  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  /*
   * The opening size is derived *during render*, not in an effect.
   *
   * React's documented "adjust state when a prop changes" pattern: the dialog is
   * opened by a click, and deriving the size here means the very first painted
   * frame is already the right size — no flash of the closed-size panel, and no
   * setState-in-an-effect cascade. The value is read from the preference store
   * once per open (a storage read during render is a pure read; the dialog is
   * closed during SSR, so there is nothing to hydrate against).
   */
  const [openedAt, setOpenedAt] = useState(false);
  if (open !== openedAt) {
    setOpenedAt(open);
    if (open) setSize(openingInspectorSize(viewport()));
  }

  /*
   * Keep the panel inside the viewport while it is open.
   *
   * §7 of the brief is about clamping a remembered size on open; the same rule
   * has to hold when the *viewport* shrinks under an open inspector, or a
   * remembered 1500×900 on a laptop would leave the close button off-screen.
   * Coalesced to one frame: a drag already updates on the frame.
   */
  useEffect(() => {
    if (!open) return;
    let frame: number | null = null;
    const reclamp = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        const current = sizeRef.current;
        if (!current) return;
        const bounded = maxInspectorSize(viewport());
        if (current.width <= bounded.width && current.height <= bounded.height) return;
        applySize({
          width: Math.min(current.width, bounded.width),
          height: Math.min(current.height, bounded.height),
        });
      });
    };
    window.addEventListener("resize", reclamp);
    return () => {
      window.removeEventListener("resize", reclamp);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [open, applySize]);

  /**
   * Start a pointer resize.
   *
   * Pointer events are captured on `window` (a drag ends wherever the pointer
   * is), the movement is coalesced to one frame, and the final size is persisted
   * once on release — a preference write per frame would be absurd.
   */
  const startResize = useCallback(
    (handle: ResizeHandleSpec) => (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const start = {
        x: event.clientX,
        y: event.clientY,
        size: sizeRef.current ?? openingInspectorSize(viewport()),
      };
      setResizing(handle.id);
      let frame: number | null = null;
      let pending: { x: number; y: number } = { x: start.x, y: start.y };

      const flush = () => {
        frame = null;
        const dx = (pending.x - start.x) * (handle.flipX ? -1 : 1);
        const dy = (pending.y - start.y) * (handle.flipY ? -1 : 1);
        applySize(
          resizeInspector(start.size, { dx, dy, horizontal: handle.horizontal, vertical: handle.vertical }, viewport()),
        );
      };
      const onMove = (move: PointerEvent) => {
        pending = { x: move.clientX, y: move.clientY };
        if (frame !== null) return;
        frame = window.requestAnimationFrame(flush);
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        if (frame !== null) {
          window.cancelAnimationFrame(frame);
          frame = null;
          flush();
        }
        setResizing(null);
        if (sizeRef.current) storeInspectorSize(sizeRef.current);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [applySize],
  );

  /** The keyboard equivalent of an edge drag (corners are pointer-only). */
  const onHandleKeyDown = useCallback(
    (handle: ResizeHandleSpec) => (event: React.KeyboardEvent<HTMLDivElement>) => {
      const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
      const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
      const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
      if (dx === 0 && dy === 0) return;
      if (!handle.horizontal && dx !== 0) return;
      if (!handle.vertical && dy !== 0) return;
      event.preventDefault();
      const current = sizeRef.current ?? openingInspectorSize(viewport());
      const next = resizeInspector(
        current,
        {
          dx: dx * (handle.flipX ? -1 : 1),
          dy: dy * (handle.flipY ? -1 : 1),
          horizontal: handle.horizontal,
          vertical: handle.vertical,
        },
        viewport(),
      );
      applySize(next);
      storeInspectorSize(next);
    },
    [applySize],
  );

  const bounds = size ? maxInspectorSize(viewport()) : null;

  return (
    <MorphingDialog open={open} onOpenChange={onOpenChange}>
      <MorphingDialogContent
        width="none"
        /*
         * Viewport-centred, and only viewport-centred.
         *
         * The frame is a full-viewport flex box: no padding derived from the
         * product's shell, no measurement of a rail or an outline. The panel's
         * centre is therefore the viewport's centre on every page, and the
         * margin the reader sees comes from the panel's own clamped size (which
         * already keeps a 16px gutter from the viewport edges).
         */
        panelSlot="fullscreen-research-panel"
        panelStyle={
          size
            ? { width: size.width, height: size.height, maxWidth: bounds?.width, maxHeight: bounds?.height }
            : undefined
        }
        panelClassName={cn(
          "relative flex flex-col gap-0 overflow-hidden p-0",
          // Before the client has measured a viewport the panel still opens large.
          !size && "h-[84dvh] w-[88vw] max-w-[1800px]",
        )}
        aria-label={typeof title === "string" ? `${title} fullscreen` : "Chart fullscreen"}
      >
        {RESIZE_HANDLES.map((handle) => (
          <div
            key={handle.id}
            data-slot="inspector-resize-handle"
            data-handle={handle.id}
            data-resizing={resizing === handle.id ? "true" : undefined}
            {...(handle.decorative
              ? { "aria-hidden": true as const }
              : {
                  role: "separator" as const,
                  tabIndex: 0,
                  "aria-label": handle.horizontal ? resizeLabels.width : resizeLabels.height,
                  "aria-orientation": handle.orientation,
                  "aria-valuenow": Math.round(handle.horizontal ? size?.width ?? 0 : size?.height ?? 0),
                  "aria-valuemin": handle.horizontal ? INSPECTOR_MIN_WIDTH : INSPECTOR_MIN_HEIGHT,
                  "aria-valuemax": Math.round(
                    handle.horizontal ? bounds?.width ?? 0 : bounds?.height ?? 0,
                  ),
                  onKeyDown: onHandleKeyDown(handle),
                })}
            onPointerDown={startResize(handle)}
            className={cn(
              "absolute z-10 touch-none select-none",
              handle.className,
              handle.decorative
                ? "opacity-0 active:opacity-100"
                : cn(
                    "rounded-full transition-colors",
                    handle.horizontal ? "my-auto" : "mx-auto",
                    "hover:bg-accent-default/25 focus-visible:bg-accent-default/40 focus-visible:outline-none",
                    handle.orientation === "vertical" ? "bg-line-subtle/40" : "bg-line-subtle/40",
                  ),
            )}
          />
        ))}
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line-subtle px-5 py-4">
          <div className="flex min-w-0 flex-col gap-1">
            <MorphingDialogTitle className="font-display text-heading-sm font-semibold tracking-[-0.018em] text-fg-primary">
              {title}
            </MorphingDialogTitle>
            {description ? (
              <MorphingDialogDescription className="max-w-[70ch] text-caption text-fg-muted">
                {description}
              </MorphingDialogDescription>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {metrics}
            <div className="flex items-center gap-1.5">
              {ranges && range !== undefined && onRangeChange ? (
                <RangeSelector ranges={ranges} value={range} onValueChange={onRangeChange} />
              ) : null}
              {scale ? (
                <ScaleSelector
                  allowed={scale.allowed}
                  value={scale.value}
                  onValueChange={scale.onValueChange}
                  labels={scale.labels}
                />
              ) : null}
              {actions}
              {exportTarget ? (
                <ChartExportButton getTarget={exportTarget} filename={exportFilename ?? "luc-chart"} />
              ) : null}
              <MorphingDialogClose asChild>
                <IconButton label={closeLabel} variant="ghost" size="sm" icon={<RiCloseLine />} />
              </MorphingDialogClose>
            </div>
          </div>
        </header>
        {/*
         * The plot takes every remaining pixel. `min-h-0` is what lets it shrink
         * when the reader drags the panel shorter, and the engines size
         * themselves from this box (no fit call, no range publish).
         */}
        <div className="min-h-0 flex-1 px-3 pt-3 pb-1">{renderChart({ height: "100%", fullscreen: true })}</div>
        {legend ? (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line-subtle px-5 py-3">
            {legend}
          </div>
        ) : null}
      </MorphingDialogContent>
    </MorphingDialog>
  );
}

export interface FullscreenChartProps
  extends Omit<FullscreenResearchViewProps, "open" | "onOpenChange"> {
  /** Trigger element; the dialog wires the click. Defaults to a fullscreen icon. */
  renderTrigger?: () => ReactNode;
  /** Render the inline copy of the chart above the trigger. Default true. */
  inline?: boolean;
  inlineHeight?: number | string;
  className?: string;
}

/**
 * Self-contained variant: renders the chart inline plus its fullscreen dialog.
 * Use FullscreenResearchView when the page already owns the chart chrome and
 * wants the trigger inside its own toolbar.
 */
export function FullscreenChart({
  renderTrigger,
  inline = true,
  inlineHeight = 380,
  className,
  ...view
}: FullscreenChartProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {inline ? (
        <div className={cn("flex min-h-0 w-full flex-col", className)} style={{ height: inlineHeight }}>
          {view.renderChart({ height: "100%", fullscreen: false })}
        </div>
      ) : null}
      <MorphingDialog open={open} onOpenChange={setOpen}>
        <MorphingDialogTrigger className="inline-flex w-fit">
          {renderTrigger ? renderTrigger() : <FullscreenButton onClick={() => setOpen(true)} />}
        </MorphingDialogTrigger>
        <FullscreenResearchView open={open} onOpenChange={setOpen} {...view} />
      </MorphingDialog>
    </>
  );
}
