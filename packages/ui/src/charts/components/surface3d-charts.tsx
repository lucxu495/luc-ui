"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ChartFormat } from "../types";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme";
import { formatChartValue } from "../core/formatters";
import { rampColor, sequentialPalette } from "../core/palette";
import { baseOption, gridFragment, tooltipShell, type Option } from "../adapters/echarts/option";
import { tooltipGridHtml, tooltipShellHtml } from "../core/tooltip-html";
import { cn } from "../../utils/cn";
import { ChartSurface } from "./chart";
import type { FamilyCommonProps } from "./chart-common";

/**
 * A true 3D surface, with no 3D engine.
 *
 * The usual answer is `echarts-gl`, and it was considered and rejected here for
 * a measurable reason: it is a large WebGL dependency (a second renderer, a
 * GPU context per surface) that would have to be installed for every consumer
 * of `@luc/ui/charts` — or shipped behind a second entry point that also needs
 * the shader/layout machinery. A gridded surface, however, is a solved problem
 * in two dimensions: rotate, project orthographically, sort the quads by depth
 * and paint them back to front. That is ~120 lines of arithmetic, no renderer,
 * no GPU context, deterministic output, and it works in the same
 * `ChartSurface` shell as every other chart in the library (tooltip, export,
 * reduced motion, aria).
 *
 * It is a **display projection of supplied values**, exactly like a log axis:
 * the grid is the caller's, the heights are the caller's, and nothing is
 * interpolated, fitted or filled in. A missing cell is a hole in the surface.
 */

export interface Surface3DChartProps extends FamilyCommonProps {
  /** `z[row][column]`. One row per `yLabel`. Non-finite cells are holes. */
  z: readonly (readonly number[])[];
  xLabels?: readonly (string | number)[];
  yLabels?: readonly (string | number)[];
  xLabel?: string;
  yLabel?: string;
  zLabel?: string;
  /** View azimuth in degrees. Pair with `onViewChange` to control it. */
  azimuth?: number;
  /** View elevation in degrees (0 = edge-on, 90 = straight down). */
  elevation?: number;
  onViewChange?: (view: { azimuth: number; elevation: number }) => void;
  /** `surface` paints shaded quads, `wireframe` draws only the mesh. Default `surface`. */
  mode?: "surface" | "wireframe";
  /** Height of the z range relative to the base plane. Default 0.72. */
  zScale?: number;
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  zFormat?: ChartFormat;
  title?: string;
  description?: string;
}

interface View {
  azimuth: number;
  elevation: number;
}

const DEFAULT_VIEW: View = { azimuth: -34, elevation: 28 };

/** The caller's own axis label when it has one, otherwise the formatted index. */
function axisLabelText(
  labels: readonly (string | number)[] | undefined,
  index: number,
  format: ChartFormat | undefined,
): string {
  const label = labels?.[index];
  if (typeof label === "string") return label;
  if (typeof label === "number") return formatChartValue(label, format);
  return formatChartValue(index, format);
}

interface Quad {
  /** Projected corner coordinates, in grid pixels. */
  corners: [number, number][];
  /** The same corners in data space `[x, y, z]`, for the lighting pass. */
  world: [number, number, number][];
  depth: number;
  /** Normalised value at the cell centre, used for the ramp. */
  t: number;
  /** The grid cells this quad sits on, for the tooltip. */
  row: number;
  column: number;
}

/**
 * The light, in *view* space: upper-left, in front of the surface.
 *
 * View space here is the frame the projection produces — `x` to the right,
 * `y` up the screen (the projection flips it), `z` towards the viewer — so the
 * shading follows the surface as the reader rotates it without the light moving.
 */
const VIEW_LIGHT = (() => {
  const [x, y, z] = [-0.4, 0.5, 0.75];
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length] as const;
})();

/**
 * Lambert term for one quad, 0…1.
 *
 * The normal is computed in data space from two edge vectors and then rotated by
 * the same yaw and pitch the projection applies, so a face tilted away from the
 * light is darker whichever way the chart is turned. Faces seen from behind (a
 * folded surface) are flipped so they are shaded as the front of the sheet.
 */
function quadIntensity(world: readonly [number, number, number][], view: View): number {
  const [a, b, c] = world;
  if (!a || !b || !c) return 0.55;
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]] as const;
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]] as const;
  let normal: [number, number, number] = [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0],
  ];
  const length = Math.hypot(normal[0], normal[1], normal[2]);
  if (!(length > 0)) return 0.55;
  normal = [normal[0] / length, normal[1] / length, normal[2] / length];
  if (normal[2] < 0) normal = [-normal[0], -normal[1], -normal[2]];
  const azimuth = (view.azimuth * Math.PI) / 180;
  const elevation = (view.elevation * Math.PI) / 180;
  const x1 = normal[0] * Math.cos(azimuth) - normal[1] * Math.sin(azimuth);
  const y1 = normal[0] * Math.sin(azimuth) + normal[1] * Math.cos(azimuth);
  const y2 = y1 * Math.cos(elevation) - normal[2] * Math.sin(elevation);
  const z2 = y1 * Math.sin(elevation) + normal[2] * Math.cos(elevation);
  const intensity = x1 * VIEW_LIGHT[0] + -y2 * VIEW_LIGHT[1] + z2 * VIEW_LIGHT[2];
  return Math.max(0, Math.min(1, intensity));
}

function project(
  x: number,
  y: number,
  z: number,
  view: View,
): { sx: number; sy: number; depth: number } {
  const azimuth = (view.azimuth * Math.PI) / 180;
  const elevation = (view.elevation * Math.PI) / 180;
  const x1 = x * Math.cos(azimuth) - y * Math.sin(azimuth);
  const y1 = x * Math.sin(azimuth) + y * Math.cos(azimuth);
  const y2 = y1 * Math.cos(elevation) - z * Math.sin(elevation);
  const depth = y1 * Math.sin(elevation) + z * Math.cos(elevation);
  return { sx: x1, sy: -y2, depth };
}

export function Surface3DChart({
  z,
  xLabels,
  yLabels,
  xLabel = "x",
  yLabel = "y",
  zLabel = "z",
  azimuth,
  elevation,
  onViewChange,
  mode = "surface",
  zScale = 0.72,
  xFormat,
  yFormat,
  zFormat,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
  eager,
}: Surface3DChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);
  const controlled = azimuth !== undefined || elevation !== undefined;
  const [internal, setInternal] = useState<View>(DEFAULT_VIEW);
  const view = useMemo<View>(
    () => ({ azimuth: azimuth ?? internal.azimuth, elevation: elevation ?? internal.elevation }),
    [azimuth, elevation, internal.azimuth, internal.elevation],
  );
  const dragRef = useRef<{ azimuth: number; elevation: number; x: number; y: number } | null>(null);

  const applyView = useCallback(
    (next: View) => {
      const clamped: View = {
        azimuth: ((next.azimuth % 360) + 360) % 360,
        elevation: Math.min(Math.max(next.elevation, -85), 85),
      };
      if (!controlled) setInternal(clamped);
      onViewChange?.(clamped);
    },
    [controlled, onViewChange],
  );

  const rows = z.length;
  const columns = rows > 0 ? Math.max(...z.map((row) => row.length)) : 0;
  /** One reading per finite cell — what the pointer can interrogate. */
  const samples = useMemo(() => {
    const points: number[][] = [];
    for (let row = 0; row < z.length; row += 1) {
      for (let column = 0; column < (z[row]?.length ?? 0); column += 1) {
        const value = z[row]?.[column];
        if (typeof value !== "number" || !Number.isFinite(value)) continue;
        points.push([column, row, value]);
      }
    }
    return points;
  }, [z]);

  const { flat, minZ, maxZ } = useMemo(() => {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    const values: number[] = [];
    for (const row of z) {
      for (const value of row) {
        if (typeof value !== "number" || !Number.isFinite(value)) continue;
        values.push(value);
        if (value < min) min = value;
        if (value > max) max = value;
      }
    }
    if (values.length === 0) {
      return { flat: [] as number[], minZ: 0, maxZ: 1 };
    }
    return { flat: values, minZ: min, maxZ: max };
  }, [z]);

  const option = useMemo<Option>(() => {
    const span = maxZ - minZ || 1;
    const ramp = sequentialPalette(theme, 9);
    const normalizeZ = (value: number) => ((value - minZ) / span) * zScale;

    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ left: 0, right: 0, top: 0, bottom: 0, containLabel: false }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { dataIndex?: number; value?: number[] };
          const cell = item.value;
          if (!cell) return "";
          const [column = 0, row = 0, value = 0] = cell;
          return tooltipShellHtml(
            `${xLabel} ${axisLabelText(xLabels, column, xFormat)} · ${yLabel} ${axisLabelText(yLabels, row, yFormat)}`,
            tooltipGridHtml([[zLabel, formatChartValue(value, zFormat)]]),
          );
        },
      }),
      xAxis: { type: "value", min: -1, max: 1, show: false },
      yAxis: { type: "value", min: -1, max: 1, show: false },
      series: [
        {
          name: zLabel,
          type: "custom",
          z: 1,
          silent: true,
          tooltip: { show: false },
          /*
           * One item, one `renderItem`: the whole mesh is emitted in one group
           * so the painter's algorithm can order every quad globally. Drawing
           * quad-by-quad through the series pipeline would order them by data
           * index instead of by depth, and the far side would print on top.
           */
          data: [[0]],
          renderItem: (_params: unknown, api: unknown) => {
            const helpers = api as {
              getWidth: () => number;
              getHeight: () => number;
              style: (extra?: Record<string, unknown>) => Record<string, unknown>;
            };
            const width = helpers.getWidth();
            const heightPx = helpers.getHeight();
            /*
             * A little air on the right for the z axis, and a slightly smaller
             * projection so the mesh and its frame do not meet the canvas edge.
             */
            const scale = (Math.min(width, heightPx) / 2) * 0.78;
            const centerX = width / 2 - 22;
            const centerY = heightPx / 2 + heightPx * 0.08;
            const toPixel = (x: number, y: number, zv: number) => {
              const point = project(x, y, zv, view);
              return [centerX + point.sx * scale, centerY + point.sy * scale] as [number, number];
            };
            const gridX = (column: number) => (columns <= 1 ? 0 : (column / (columns - 1)) * 2 - 1);
            const gridY = (row: number) => (rows <= 1 ? 0 : 1 - (row / (rows - 1)) * 2);
            const at = (row: number, column: number): number => z[row]?.[column] ?? Number.NaN;

            const quads: Quad[] = [];
            for (let row = 0; row < rows - 1; row += 1) {
              for (let column = 0; column < columns - 1; column += 1) {
                const a = at(row, column);
                const b = at(row, column + 1);
                const c = at(row + 1, column + 1);
                const d = at(row + 1, column);
                if (![a, b, c, d].every((value) => Number.isFinite(value))) continue;
                const x0 = gridX(column);
                const x1 = gridX(column + 1);
                const y0 = gridY(row);
                const y1 = gridY(row + 1);
                const corners: [number, number][] = [
                  toPixel(x0, y0, normalizeZ(a)),
                  toPixel(x1, y0, normalizeZ(b)),
                  toPixel(x1, y1, normalizeZ(c)),
                  toPixel(x0, y1, normalizeZ(d)),
                ];
                const depths = [
                  project(x0, y0, normalizeZ(a ?? 0), view).depth,
                  project(x1, y0, normalizeZ(b ?? 0), view).depth,
                  project(x1, y1, normalizeZ(c ?? 0), view).depth,
                  project(x0, y1, normalizeZ(d ?? 0), view).depth,
                ];
                const mean = ((a ?? 0) + (b ?? 0) + (c ?? 0) + (d ?? 0)) / 4;
                quads.push({
                  corners,
                  world: [
                    [x0, y0, normalizeZ(a ?? 0)],
                    [x1, y0, normalizeZ(b ?? 0)],
                    [x1, y1, normalizeZ(c ?? 0)],
                    [x0, y1, normalizeZ(d ?? 0)],
                  ],
                  depth: ((depths[0] ?? 0) + (depths[1] ?? 0) + (depths[2] ?? 0) + (depths[3] ?? 0)) / 4,
                  t: (mean - minZ) / span,
                  row,
                  column,
                });
              }
            }
            quads.sort((left, right) => left.depth - right.depth);

            /*
             * The frame: a base grid with tick labels on the two near edges, and a
             * vertical z axis with real values.
             *
             * A projected surface without axes is a coloured sheet — the Phase
             * 10A.1 report read it as "a flat tilted grid rather than an
             * understandable 3D surface". The grid lines, the x and y tick labels
             * and the z scale are what let a reader place the relief against the
             * data it came from.
             */
            const axisColor = theme.grid;
            const frameFont = `${theme.fontMicro}px ${theme.fontFamily}`;
            const frame: unknown[] = [];
            for (let column = 0; column < columns; column += 1) {
              const x = gridX(column);
              frame.push({
                type: "polyline",
                shape: { points: [toPixel(x, -1, 0), toPixel(x, 1, 0)] },
                style: {
                  ...helpers.style(),
                  fill: "none",
                  stroke: axisColor,
                  lineWidth: 0.6,
                  opacity: 0.45,
                },
              });
            }
            for (let row = 0; row < rows; row += 1) {
              const y = gridY(row);
              frame.push({
                type: "polyline",
                shape: { points: [toPixel(-1, y, 0), toPixel(1, y, 0)] },
                style: {
                  ...helpers.style(),
                  fill: "none",
                  stroke: axisColor,
                  lineWidth: 0.6,
                  opacity: 0.45,
                },
              });
            }
            /* The x axis runs along the near edge; the y axis up the left one. */
            const sampleArea: unknown[] = [];
            for (let column = 0; column < columns; column += 1) {
              const [x, y] = toPixel(gridX(column), -1, 0);
              sampleArea.push({
                type: "text",
                x,
                y: y + 16,
                style: {
                  ...helpers.style(),
                  text: axisLabelText(xLabels, column, xFormat),
                  fill: theme.textMuted,
                  font: frameFont,
                  align: "center",
                  verticalAlign: "top",
                },
              });
            }
            for (let row = 0; row < rows; row += 1) {
              const [x, y] = toPixel(-1, gridY(row), 0);
              sampleArea.push({
                type: "text",
                x: x - 10,
                y,
                style: {
                  ...helpers.style(),
                  text: axisLabelText(yLabels, row, yFormat),
                  fill: theme.textMuted,
                  font: frameFont,
                  align: "right",
                  verticalAlign: "middle",
                },
              });
            }
            /*
             * The z axis stands at the **back-right** corner.
             *
             * The placement is decided by measurement, not by taste. At the left
             * corner its tick labels shared the left edge with the y labels ("2" on
             * top of "0", 126px²). At the right *near* corner they shared the
             * diagonal the x labels run down ("110.00" under "21.00%", 105px² in the
             * volatility surface). The back-right corner is the one place no other
             * label travels, and the axis still reads as standing behind the sheet.
             */
            const zBase = toPixel(1, 1, 0);
            const zTop = toPixel(1, 1, zScale);
            sampleArea.push({
              type: "polyline",
              shape: { points: [zBase, zTop] },
              style: { ...helpers.style(), fill: "none", stroke: axisColor, lineWidth: 1, opacity: 0.8 },
            });
            for (const fraction of [0, 0.5, 1]) {
              const [x, y] = toPixel(1, 1, fraction * zScale);
              sampleArea.push({
                type: "polyline",
                shape: { points: [[x, y], [x + 6, y]] },
                style: { ...helpers.style(), fill: "none", stroke: axisColor, lineWidth: 1 },
              });
              sampleArea.push({
                type: "text",
                x: x + 11,
                y,
                style: {
                  ...helpers.style(),
                  text: formatChartValue(minZ + (maxZ - minZ) * fraction, zFormat),
                  fill: theme.textMuted,
                  font: frameFont,
                  align: "left",
                  verticalAlign: "middle",
                },
              });
            }
            sampleArea.push({
              type: "text",
              /*
               * The axis *name* goes in the top-left corner rather than beside the
               * top tick: the corner above the mesh is the one region of this
               * projection that is always empty, whereas the label beside the axis
               * collided with the last x tick (measured: "105" on top of "0").
               */
              x: 10,
              y: 12,
              style: {
                ...helpers.style(),
                text: zLabel,
                fill: theme.textMuted,
                font: frameFont,
                align: "left",
                verticalAlign: "top",
              },
            });

            return {
              type: "group",
              children: [
                // The base plane, drawn first: it orients the reader.
                {
                  type: "polygon",
                  shape: {
                    points: [
                      toPixel(-1, 1, 0),
                      toPixel(1, 1, 0),
                      toPixel(1, -1, 0),
                      toPixel(-1, -1, 0),
                    ],
                  },
                  style: { ...helpers.style(), fill: theme.surfaceRaised, opacity: 0.5, stroke: "none" },
                },
                ...quads.flatMap((quad) => {
                  const base = {
                    type: "polygon",
                    shape: { points: quad.corners },
                    style: {
                      ...helpers.style(),
                      fill: mode === "wireframe" ? "none" : rampColor(ramp, quad.t),
                      opacity: mode === "wireframe" ? 1 : 0.92,
                      stroke: mode === "wireframe" ? theme.grid : theme.surface,
                      lineWidth: mode === "wireframe" ? 1 : 0.5,
                    },
                  };
                  if (mode === "wireframe") return [base];
                  const intensity = quadIntensity(quad.world, view);
                  const delta = intensity - 0.55;
                  /*
                   * Shading is a neutral overlay, not a second colour: the ramp
                   * keeps meaning "value" and the overlay only says "this face
                   * points away from the light".
                   */
                  return [
                    base,
                    {
                      type: "polygon",
                      shape: { points: quad.corners },
                      silent: true,
                      style: {
                        ...helpers.style(),
                        fill: delta >= 0 ? "#ffffff" : "#000000",
                        opacity: Math.min(0.34, Math.abs(delta) * 0.9),
                        stroke: "none",
                      },
                    },
                  ];
                }),
                ...frame,
                ...sampleArea,
              ],
            };
          },
        },
        {
          name: `${xLabel} / ${yLabel}`,
          type: "custom",
          z: 2,
          data: samples,
          renderItem: (params: unknown, api: unknown) => {
            const p = params as { dataIndex: number };
            const helpers = api as {
              getWidth: () => number;
              getHeight: () => number;
              value: (index: number) => number;
              style: (extra?: Record<string, unknown>) => Record<string, unknown>;
            };
            const width = helpers.getWidth();
            const heightPx = helpers.getHeight();
            const scale = (Math.min(width, heightPx) / 2) * 0.82;
            const centerX = width / 2;
            const centerY = heightPx / 2 + heightPx * 0.08;
            const column = helpers.value(0);
            const row = helpers.value(1);
            const value = helpers.value(2);
            const gridX = columns <= 1 ? 0 : (column / (columns - 1)) * 2 - 1;
            const gridY = rows <= 1 ? 0 : 1 - (row / (rows - 1)) * 2;
            const point = project(gridX, gridY, ((value - minZ) / (maxZ - minZ || 1)) * zScale, view);
            void p;
            return {
              type: "circle",
              shape: { cx: centerX + point.sx * scale, cy: centerY + point.sy * scale, r: 2.4 },
              style: { ...helpers.style(), fill: theme.surface, stroke: theme.accent, lineWidth: 1.2 },
            };
          },
        },
      ],
    };
  }, [
    columns,
    maxZ,
    minZ,
    mode,
    motion,
    rows,
    samples,
    theme,
    view,
    xFormat,
    xLabel,
    xLabels,
    yFormat,
    yLabel,
    yLabels,
    z,
    zFormat,
    zLabel,
    zScale,
  ]);

  const interactive = !controlled;

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the wrapper is the rotation control for the chart canvas inside it
    <div
      data-slot="surface-3d"
      // The wrapper owns rotation: a chart canvas cannot take focus, but the
      // reader still has to be able to turn the surface without a pointer.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- keyboard rotation for a 3D chart
      tabIndex={interactive ? 0 : -1}
      role="group"
      aria-label={
        interactive ? "Interactive 3D surface. Use the arrow keys to rotate, Shift with the arrows to change elevation." : undefined
      }
      onKeyDown={
        interactive
          ? (event) => {
              const step = event.shiftKey ? 6 : 12;
              if (event.key === "ArrowLeft") applyView({ ...view, azimuth: view.azimuth - step });
              else if (event.key === "ArrowRight") applyView({ ...view, azimuth: view.azimuth + step });
              else if (event.key === "ArrowUp") applyView({ ...view, elevation: view.elevation + step });
              else if (event.key === "ArrowDown") applyView({ ...view, elevation: view.elevation - step });
              else if (event.key === "Home") applyView(DEFAULT_VIEW);
              else return;
              event.preventDefault();
            }
          : undefined
      }
      onPointerDown={
        interactive
          ? (event) => {
              event.currentTarget.setPointerCapture?.(event.pointerId);
              dragRef.current = { ...view, x: event.clientX, y: event.clientY };
            }
          : undefined
      }
      onPointerMove={
        interactive
          ? (event) => {
              const start = dragRef.current;
              if (!start) return;
              applyView({
                azimuth: start.azimuth + (event.clientX - start.x) * 0.5,
                elevation: start.elevation - (event.clientY - start.y) * 0.4,
              });
            }
          : undefined
      }
      onPointerUp={() => {
        dragRef.current = null;
      }}
      onPointerCancel={() => {
        dragRef.current = null;
      }}
      /*
       * `h-full` is load-bearing.
       *
       * The wrapper exists to own pointer/keyboard rotation, and the shell it
       * sits in (`ChartPanel` → `ChartPlot`) hands the chart `height="100%"`.
       * A plain `div` between them has an auto height, so that percentage
       * resolves against nothing and the canvas ends up 0 px tall — a chart
       * that mounts, reports no error, and draws nothing. Taking the full height
       * here lets the percentage resolve against the real box.
       */
      className={cn("h-full min-h-0", className)}
    >
      <ChartSurface
        option={option}
        state={flat.length === 0 || rows < 2 || columns < 2 ? "empty" : state}
        height={height ?? 360}
        ariaLabel={ariaLabel ?? title ?? `${zLabel} surface`}
        ariaDescription={
          ariaDescription ??
          description ??
          `A projected gridded surface. Azimuth ${Math.round(view.azimuth)}°, elevation ${Math.round(
            view.elevation,
          )}°.`
        }
        copy={{
          emptyTitle: "Nothing to plot",
          emptyDescription: "A surface needs at least a 2 × 2 grid of finite values.",
        }}
        onReady={onReady}
        onEvent={onEvent}
        eager={eager}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Volatility surface                                                          */
/* -------------------------------------------------------------------------- */

export interface VolatilitySurfaceChartProps extends FamilyCommonProps {
  /** Strike or moneyness values, one per column, ascending. */
  strikes: readonly number[];
  /** Maturity values, one per row, ascending. Units are the caller's (years, days). */
  maturities: readonly number[];
  /** Implied volatilities as a **ratio** (`0.24` = 24%), `vols[maturityIndex][strikeIndex]`. */
  vols: readonly (readonly number[])[];
  /** Caption for the strike axis, e.g. "Strike" or "Moneyness (K/S)". */
  strikeLabel?: string;
  /** Caption for the maturity axis, e.g. "Maturity (years)". */
  maturityLabel?: string;
  /** Show volatilities as percentages. Default `true`. */
  percent?: boolean;
  azimuth?: number;
  elevation?: number;
  onViewChange?: (view: { azimuth: number; elevation: number }) => void;
  mode?: "surface" | "wireframe";
  title?: string;
  description?: string;
}

/**
 * A volatility surface from a **supplied grid** of implied volatilities.
 *
 * The grid shape is deliberate. Turning a scatter of (strike, maturity, IV)
 * quotes into a surface needs interpolation or a fitted parameterisation, and
 * that is exactly the kind of hidden modelling this library refuses to do: the
 * number under the pointer would no longer be a quote. A caller that has quotes
 * fits its own surface, on its own terms, and passes the grid in — so the chart
 * can only ever show volatilities somebody actually computed.
 */
export function VolatilitySurfaceChart({
  strikes,
  maturities,
  vols,
  strikeLabel = "Strike",
  maturityLabel = "Maturity",
  percent = true,
  azimuth,
  elevation,
  onViewChange,
  mode = "surface",
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
  eager,
}: VolatilitySurfaceChartProps) {
  const scaler = percent ? 100 : 1;
  const scaled = useMemo(
    () => vols.map((row) => row.map((value) => (Number.isFinite(value) ? value * scaler : Number.NaN))),
    [scaler, vols],
  );

  return (
    <Surface3DChart
      z={scaled}
      xLabels={strikes}
      yLabels={maturities}
      xLabel={strikeLabel}
      yLabel={maturityLabel}
      zLabel="Implied volatility"
      azimuth={azimuth}
      elevation={elevation}
      onViewChange={onViewChange}
      mode={mode}
      xFormat={{ kind: "number", decimals: 2 }}
      yFormat={{ kind: "number", decimals: 2 }}
      zFormat={percent ? { kind: "percent", decimals: 2 } : { kind: "number", decimals: 4 }}
      title={title}
      description={
        description ??
        "Each cell is an implied volatility the caller computed; the library interpolates nothing."
      }
      state={state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Volatility surface"}
      ariaDescription={ariaDescription}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}
