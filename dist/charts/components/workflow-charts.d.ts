import { ChartFormat, SeriesTone } from "../types.js";
import { FamilyCommonProps } from "./chart-common.js";
//#region src/charts/components/workflow-charts.d.ts
/**
 * Workflow & operations charts — sequence, comparison and schedule.
 *
 * These are the shapes an operations product reaches for: which task ran when,
 * how two periods compare, what moved and by how much. They are deliberately
 * *not* statistical: every one of them shows a number the caller supplied at a
 * position the caller supplied, and none of them infers a state.
 */
export interface GanttTask {
  id: string;
  name: string;
  /** Inclusive start and end, in ms since epoch. */
  start: number;
  end: number;
  /** 0–1 completion. Drawn as a lighter inner bar. */
  progress?: number;
  tone?: SeriesTone;
  /** Optional step/phase label. Rendered next to the name. */
  group?: string;
}
export interface GanttChartProps extends FamilyCommonProps {
  tasks: readonly GanttTask[];
  /** Time-axis format for the header labels. */
  timeFormat?: ChartFormat;
  /** Name the axis, e.g. "Scheduled" or "Actual". */
  axisLabel?: string;
  title?: string;
  description?: string;
}
/**
 * Gantt / schedule.
 *
 * One row per task on a time axis, drawn right-to-left in the task order given,
 * so the list reads top-to-bottom. `progress` is drawn *inside* the bar rather
 * than as a second series, which is what keeps a 200-task plan legible.
 */
export declare function GanttChart({ tasks, timeFormat, axisLabel, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: GanttChartProps): import("react").JSX.Element;
export interface DumbbellRow {
  label: string;
  /** Left-hand value of the pair. */
  from: number;
  /** Right-hand value of the pair. */
  to: number;
  tone?: SeriesTone;
}
export interface DumbbellChartProps extends FamilyCommonProps {
  rows: readonly DumbbellRow[];
  /** What the three marks mean. Default `["From", "To"]`. */
  labels?: readonly [string, string];
  format?: ChartFormat;
  title?: string;
  description?: string;
}
/** Dumbbell — a start and an end per row, with the change drawn as the connector. */
export declare function DumbbellChart({ rows, labels, format, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: DumbbellChartProps): import("react").JSX.Element;
export interface SlopeChartProps extends FamilyCommonProps {
  rows: readonly {
    label: string;
    left: number;
    right: number;
    tone?: SeriesTone;
  }[];
  /** The two period labels drawn under the two columns. */
  periods?: readonly [string, string];
  format?: ChartFormat;
  title?: string;
  description?: string;
}
/**
 * Slope chart — how each member moved between exactly two points in time.
 *
 * The difference from a dumbbell is what is on the axis: a dumbbell measures a
 * quantity, a slope chart measures a *rank or index* at two moments, so the
 * lines are free to cross and the crossing is the message.
 */
export declare function SlopeChart({ rows, periods, format, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: SlopeChartProps): import("react").JSX.Element;
export interface LollipopChartProps extends FamilyCommonProps {
  data: readonly {
    label: string;
    value: number;
    tone?: SeriesTone;
  }[];
  format?: ChartFormat;
  /** Horizontal rows read better past ~12 categories. Default `true`. */
  horizontal?: boolean;
  title?: string;
  description?: string;
}
/** Lollipop — a bar reduced to a stem and a head, for a long ranked list. */
export declare function LollipopChart({ data, format, horizontal, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: LollipopChartProps): import("react").JSX.Element;
export interface BulletRow {
  label: string;
  /** The measured value. */
  value: number;
  /** The target the value is judged against. */
  target: number;
  /** Qualitative ranges, widest first, e.g. `[40, 70, 100]`. */
  ranges?: readonly number[];
}
export interface BulletChartProps extends FamilyCommonProps {
  rows: readonly BulletRow[];
  format?: ChartFormat;
  valueLabel?: string;
  targetLabel?: string;
  title?: string;
  description?: string;
}
/** Bullet — a measured value, a target and the qualitative bands between them. */
export declare function BulletChart({ rows, format, valueLabel, targetLabel, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: BulletChartProps): import("react").JSX.Element;
export interface BumpChartProps extends FamilyCommonProps {
  /** Period labels along the horizontal axis. */
  periods: readonly string[];
  series: readonly {
    label: string;
    /** Rank per period, ascending from 1. `null` breaks the line. */
    ranks: readonly (number | null)[];
    tone?: SeriesTone;
  }[];
  /** Label the vertical axis, e.g. "Rank". */
  rankLabel?: string;
  title?: string;
  description?: string;
}
/**
 * Bump chart — rank over time, with the axis inverted so 1 is at the top.
 *
 * A `null` is a genuine gap (not ranked that period) and is drawn as a break,
 * never interpolated: joining across a missing period would invent a position
 * the data does not claim.
 */
export declare function BumpChart({ periods, series, rankLabel, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: BumpChartProps): import("react").JSX.Element;
export interface MekkoColumn {
  label: string;
  /** Column width weight — usually the column's total. */
  weight: number;
  segments: readonly {
    name: string;
    value: number;
  }[];
}
export interface MekkoChartProps extends FamilyCommonProps {
  columns: readonly MekkoColumn[];
  format?: ChartFormat;
  title?: string;
  description?: string;
}
/**
 * Mekko (mosaic) — a stacked bar whose *width* is the group size.
 *
 * This is the honest version of a stacked bar: it shows that a 12% share inside
 * a tiny column is not the same fact as a 12% share inside the biggest one, which
 * a fixed-width stack hides.
 */
export declare function MekkoChart({ columns, format, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: MekkoChartProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=workflow-charts.d.ts.map