"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { RiPushpinFill, RiPushpinLine } from "@remixicon/react";
import { cn } from "../../utils/cn";
import { useControllableState } from "../../hooks/use-controllable-state";
import { IconButton } from "../../components/icon-button";
import { useChartSyncBus, ChartSyncProvider } from "./sync-context";
import { createChartSyncBus } from "./sync";
import { useChartId } from "./use-chart-theme";

/* =============================================================================
 * Pinned inspection
 *
 * A deferred V0.2 feature, and the reason the sync bus exists.
 *
 *   hover  → transient crosshair and tooltip, exactly as before
 *   click  → the current x is pinned
 *   pin    → the crosshair stops following the pointer, in every chart of the
 *            group, including the one that was clicked
 *   click elsewhere / Escape / the pin button
 *          → unpinned, and the crosshair clears
 *
 * The pin lives on the sync bus as a *cursor*, so both engines already know how
 * to draw it: no adapter grows a second crosshair concept, and a pinned time
 * can be serialised by the consumer like any other shareable state.
 * ========================================================================== */

export interface ChartInspectionValue {
  /** Group this inspection belongs to. */
  groupId: string;
  /** The pinned x in epoch milliseconds, or null. */
  pinned: number | null;
  /** The live pointer x in epoch milliseconds, or null. */
  hover: number | null;
  /** Pin a specific x, or the current hover when omitted. */
  pin: (x?: number | null) => void;
  unpin: () => void;
  /** Pin the current hover, or unpin when already pinned. */
  toggle: () => void;
  /** True when there is a hover to pin and nothing is pinned yet. */
  canPin: boolean;
}

export interface UseChartInspectionOptions {
  groupId: string;
  /** Controlled pinned value. */
  pinned?: number | null;
  defaultPinned?: number | null;
  onPinnedChange?: (pinned: number | null) => void;
}

export function useChartInspection({
  groupId,
  pinned: pinnedProp,
  defaultPinned = null,
  onPinnedChange,
}: UseChartInspectionOptions): ChartInspectionValue {
  const bus = useChartSyncBus();
  const id = useChartId("inspection");
  const [pinned, setPinned] = useControllableState<number | null>({
    value: pinnedProp,
    defaultValue: defaultPinned,
    onChange: onPinnedChange,
  });
  const [hover, setHover] = useState<number | null>(null);
  const pinnedRef = useRef(pinned);
  useEffect(() => {
    pinnedRef.current = pinned;
  }, [pinned]);

  // Publish the pin whenever it changes. The bus then owns the crosshair; the
  // provider only owns the UI state around it.
  useEffect(() => {
    bus.publishPinned(groupId, pinned, id);
  }, [bus, groupId, id, pinned]);

  // Track the hover so a click has something to pin. Hover is deliberately *not*
  // re-published to the bus — it already came from there.
  useEffect(() => {
    return bus.subscribe(groupId, {
      id,
      onCursor: (value) => {
        if (pinnedRef.current !== null) return;
        setHover(value);
      },
    });
  }, [bus, groupId, id]);

  const pin = useCallback(
    (x?: number | null) => {
      const target = x === undefined ? hover : x;
      if (target === null) return;
      setPinned(target);
    },
    [hover, setPinned],
  );

  const unpin = useCallback(() => setPinned(null), [setPinned]);
  const toggle = useCallback(() => {
    if (pinned !== null) setPinned(null);
    else pin();
  }, [pin, pinned, setPinned]);

  return useMemo(
    () => ({ groupId, pinned, hover, pin, unpin, toggle, canPin: pinned === null && hover !== null }),
    [groupId, hover, pin, pinned, toggle, unpin],
  );
}

const ChartInspectionContext = createContext<ChartInspectionValue | null>(null);

export interface ChartInspectionProviderProps extends UseChartInspectionOptions {
  children: ReactNode;
  /**
   * Give the group its own bus. Pass this when two workspaces on one page must
   * not share an inspection, or in tests.
   */
  isolated?: boolean;
}

export function ChartInspectionProvider({ children, isolated = false, ...options }: ChartInspectionProviderProps) {
  // No hooks before the branch: the isolated variant has to create its own bus
  // *above* the hook that reads it.
  if (isolated) {
    return (
      <IsolatedInspectionProvider options={options}>{children}</IsolatedInspectionProvider>
    );
  }
  return <InspectionContext options={options}>{children}</InspectionContext>;
}

function InspectionContext({
  options,
  children,
}: {
  options: UseChartInspectionOptions;
  children: ReactNode;
}) {
  const value = useChartInspection(options);
  return <ChartInspectionContext.Provider value={value}>{children}</ChartInspectionContext.Provider>;
}

function IsolatedInspectionProvider({
  options,
  children,
}: {
  options: UseChartInspectionOptions;
  children: ReactNode;
}) {
  const bus = useMemo(() => createChartSyncBus(), []);
  return (
    <ChartSyncProvider bus={bus}>
      <InspectionContext options={options}>{children}</InspectionContext>
    </ChartSyncProvider>
  );
}

export function useChartInspectionContext(): ChartInspectionValue | null {
  return useContext(ChartInspectionContext);
}

export interface ChartPinButtonProps {
  className?: string;
  /** Accessible name when unpinned. */
  pinLabel?: string;
  /** Accessible name when pinned. */
  unpinLabel?: string;
}

/**
 * The pin control. It reads the inspection from context, so a chart header does
 * not have to thread state through.
 */
export function ChartPinButton({
  className,
  pinLabel = "Pin inspection",
  unpinLabel = "Unpin inspection",
}: ChartPinButtonProps) {
  const inspection = useChartInspectionContext();
  if (!inspection) return null;
  const pinned = inspection.pinned !== null;
  return (
    <IconButton
      label={pinned ? unpinLabel : pinLabel}
      size="sm"
      variant={pinned ? "accent" : "ghost"}
      aria-pressed={pinned}
      disabled={!pinned && !inspection.canPin}
      className={cn(className)}
      icon={pinned ? <RiPushpinFill /> : <RiPushpinLine />}
      onClick={() => inspection.toggle()}
    />
  );
}

/** Shows whether an inspection is pinned, as text, for a status bar. */
export function ChartPinStatus({ format, className }: { format: (x: number) => ReactNode; className?: string }) {
  const inspection = useChartInspectionContext();
  if (!inspection) return null;
  const value = inspection.pinned ?? inspection.hover;
  if (value === null) return null;
  return (
    <span
      data-slot="chart-pin-status"
      data-pinned={inspection.pinned !== null ? "true" : undefined}
      className={cn("luc-numeric inline-flex items-center gap-1.5 text-caption", className)}
    >
      {inspection.pinned !== null ? <RiPushpinFill aria-hidden="true" className="size-3 text-fg-accent" /> : null}
      {format(value)}
    </span>
  );
}

/* =============================================================================
 * Keyboard inspection
 *
 * Pinning used to be pointer-only, which put a chart's most useful reading
 * behind a mouse. `ChartInspectionArea` wraps the plot in a focusable region
 * that steps a cursor across the *prepared* x values the caller already owns:
 *
 *   ← / →        step one point
 *   Home / End   jump to the first or last point
 *   Enter / Space pin the current point (again to unpin)
 *   Escape       clear the pin
 *
 * It is an enhancement, not the accessible representation: `ChartDataTable`
 * remains the complete semantic fallback for the same data, and this layer
 * deliberately does not try to make every painted pixel reachable.
 * ========================================================================== */

export interface ChartInspectionAreaProps extends Omit<React.ComponentPropsWithRef<"div">, "onKeyDown"> {
  /** Ordered x values (oldest first) the keyboard cursor steps through. */
  xValues: readonly number[];
  /** Accessible name and instructions for the region. */
  label?: string;
  /** How an x is printed in the live status line. Defaults to `String(x)`. */
  format?: (x: number) => ReactNode;
}

/** Index of the value closest to `x`, or -1 for an empty domain. */
function nearestIndex(xValues: readonly number[], x: number) {
  const first = xValues[0];
  if (first === undefined) return -1;
  let best = 0;
  let bestDistance = Math.abs(first - x);
  for (let index = 1; index < xValues.length; index += 1) {
    const value = xValues[index];
    if (value === undefined) continue;
    const distance = Math.abs(value - x);
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  }
  return best;
}

export function ChartInspectionArea({
  xValues,
  label = "Chart plot. Use the arrow keys to inspect a point, Enter to pin it, Escape to clear the pin.",
  format,
  className,
  children,
  ...props
}: ChartInspectionAreaProps) {
  const inspection = useChartInspectionContext();
  const lastIndex = xValues.length - 1;
  // The pinned point decides where stepping resumes; with nothing pinned (or
  // hovered), the cursor starts at the most recent point.
  const startIndex = () => {
    const anchor = inspection?.pinned ?? inspection?.hover;
    if (typeof anchor === "number") return Math.max(0, nearestIndex(xValues, anchor));
    return Math.max(0, lastIndex);
  };

  const moveTo = (next: number): number => {
    const clamped = Math.min(Math.max(next, 0), Math.max(0, lastIndex));
    return xValues[clamped] ?? xValues[0] ?? 0;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!inspection || xValues.length === 0) return;
    const current = startIndex();
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        event.preventDefault();
        inspection.pin(moveTo(current + 1));
        break;
      case "ArrowLeft":
      case "ArrowDown":
        event.preventDefault();
        inspection.pin(moveTo(current - 1));
        break;
      case "Home":
        event.preventDefault();
        inspection.pin(moveTo(0));
        break;
      case "End":
        event.preventDefault();
        inspection.pin(moveTo(lastIndex));
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (inspection.pinned !== null) inspection.unpin();
        else inspection.pin(xValues[current]);
        break;
      case "Escape":
        if (inspection.pinned === null) return;
        event.preventDefault();
        inspection.unpin();
        break;
      default:
    }
  };

  if (!inspection) {
    return (
      <div data-slot="chart-inspection-area" className={className} {...props}>
        {children}
      </div>
    );
  }

  const inspected = inspection.pinned;

  return (
    /*
     * A labelled plot region that the reader can focus and step through. The
     * a11y rules assume a focusable element is a widget; this one is a group
     * *containing* a canvas, and its interactive contract is the key handler
     * below. The complete semantic representation is ChartDataTable, not this.
     */
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      data-slot="chart-inspection-area"
      data-inspecting={inspected !== null ? "true" : undefined}
      role="group"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cn("luc-focus rounded-md", className)}
      {...props}
    >
      {children}
      <span role="status" aria-live="polite" className="sr-only">
        {inspected === null ? "" : (format ? format(inspected) : String(inspected))}
      </span>
    </div>
  );
}
