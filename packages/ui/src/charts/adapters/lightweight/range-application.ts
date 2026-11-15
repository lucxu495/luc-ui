export interface ControlledVisibleRange {
  fromMs: number;
  toMs: number;
}

export type VisibleRangeAction =
  | { kind: "fit" }
  | { kind: "set"; fromMs: number; toMs: number }
  | { kind: "preserve" };

export function visibleRangeKey(range: ControlledVisibleRange | null | undefined): string {
  if (range === undefined) return "uncontrolled";
  if (range === null) return "all";
  return `${range.fromMs}:${range.toMs}`;
}

/**
 * Decide whether a render may move the time scale.
 *
 * Initial mount always gets one explicit frame. Afterwards `undefined` means
 * the caller owns the viewport, so data/theme/pane rebuilds preserve it. A
 * controlled value moves it only when its value changes; `null` is an explicit
 * "fit all", not an absent prop.
 */
export function resolveVisibleRangeAction(
  range: ControlledVisibleRange | null | undefined,
  previousKey: string | null,
  initialised: boolean,
): VisibleRangeAction {
  if (!initialised) {
    return range ? { kind: "set", fromMs: range.fromMs, toMs: range.toMs } : { kind: "fit" };
  }

  const nextKey = visibleRangeKey(range);
  if (nextKey === previousKey) return { kind: "preserve" };
  if (range === undefined) return { kind: "preserve" };
  if (range === null) return { kind: "fit" };
  return { kind: "set", fromMs: range.fromMs, toMs: range.toMs };
}
