/**
 * Reference lines, reference bands and event markers.
 *
 * These are the annotation vocabulary for every cartesian chart, so a threshold
 * looks identical whether it sits on a histogram, a drawdown curve or a funding
 * rate. Bands stay under 14% alpha: a band that competes with the data is a
 * second series pretending to be a background.
 */

import type { AnnotationSpec, EventMarkerSpec } from "../../types";
import type { ChartTheme } from "../../core/theme";
import { toneColor, withAlpha } from "../../core/theme";
import type { Option } from "./option";

/** x coordinates are milliseconds for time axes, a category label otherwise. */
function xCoord(value: number | string | Date): number | string {
  return value instanceof Date ? value.getTime() : value;
}

/**
 * How far from an edge a marker counts as "at the edge", as a fraction of the
 * x extent.
 *
 * A centred label reaches half of its own width past the marker, so the band
 * has to be wide enough to cover a short event label on a typical plot
 * (≈85 px of ~700). It is deliberately a fraction of the *extent* rather than a
 * pixel measurement: the adapter builds the option before the engine has a
 * container size, and the author of the annotation is the only one who knows
 * how long the label is.
 */
const EDGE_BAND = 0.12;

/**
 * The engine symbol each marker shape resolves to.
 *
 * The shape is the *non-colour* half of an event's meaning, so it is stated
 * rather than left to a default: a protocol milestone is a square, a cycle low
 * points up, a cycle high points down. The three legacy shapes keep their
 * original glyphs so an existing annotation is unchanged.
 */
const MARKER_SYMBOL: Record<string, string> = {
  dot: "circle",
  flag: "roundRect",
  pin: "pin",
  square: "rect",
  "triangle-up": "triangle",
  "triangle-down": "triangle",
};

/** Marker sizes: a directional glyph needs a little more room than a dot. */
const MARKER_SIZE: Record<string, number> = {
  dot: 8,
  flag: 10,
  pin: 10,
  square: 9,
  "triangle-up": 11,
  "triangle-down": 11,
};

/** The inward anchor a marker's label needs, or `null` to keep it centred. */
function labelAnchor(
  marker: EventMarkerSpec,
  extent: readonly [number, number] | null | undefined,
): "left" | "right" | null {
  const mode = marker.labelAlign;
  if (mode === undefined || mode === "center") return null;
  if (mode === "start") return "left";
  if (mode === "end") return "right";
  // `auto`: keep the label inside the plot when the marker sits on either edge.
  if (!extent) return null;
  const [min, max] = extent;
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return null;
  const at = xCoord(marker.at);
  const value = typeof at === "number" ? at : Number(at);
  if (!Number.isFinite(value)) return null;
  const position = (value - min) / (max - min);
  if (position <= EDGE_BAND) return "left";
  if (position >= 1 - EDGE_BAND) return "right";
  return null;
}

export function annotationMarks(
  theme: ChartTheme,
  annotations: AnnotationSpec | undefined,
  markerY = 0,
  xExtent?: readonly [number, number] | null,
): Option {
  if (!annotations) return {};

  const markLineData: Option[] = [];
  for (const line of annotations.referenceLines ?? []) {
    const lineColor = line.color ?? (line.tone ? toneColor(theme, line.tone, 0) : theme.reference);
    markLineData.push({
      ...(line.axis === "x"
        ? { xAxis: xCoord(line.value) }
        : { yAxis: typeof line.value === "number" ? line.value : Number(line.value) }),
      ...(line.label
        ? {
            label: {
              show: true,
              formatter: line.label,
              position: "insideEndTop",
              color: theme.textMuted,
              fontFamily: theme.fontFamily,
              fontSize: theme.fontMicro,
            },
          }
        : { label: { show: line.axisLabel ?? false } }),
      lineStyle: { color: lineColor, width: 1, type: line.lineType ?? "dashed" },
    });
  }

  for (const marker of annotations.markers ?? []) {
    if (!marker.line) continue;
    markLineData.push({
      xAxis: xCoord(marker.at),
      lineStyle: {
        color: marker.color ?? toneColor(theme, marker.tone ?? "neutral", 0),
        width: 1,
        type: "dotted",
      },
      label: { show: false },
    });
  }

  const markAreaData = (annotations.referenceBands ?? []).map((band) => [
    {
      ...(band.axis === "x"
        ? { xAxis: xCoord(band.from) }
        : { yAxis: typeof band.from === "number" ? band.from : Number(band.from) }),
      itemStyle: {
        color: band.color ?? withAlpha(toneColor(theme, band.tone ?? "accent", 0), band.opacity ?? 0.08),
      },
      ...(band.label
        ? {
            label: {
              show: true,
              position: "insideTop",
              color: theme.textMuted,
              fontFamily: theme.fontFamily,
              fontSize: theme.fontMicro,
              formatter: band.label,
            },
          }
        : {}),
    },
    {
      ...(band.axis === "x"
        ? { xAxis: xCoord(band.to) }
        : { yAxis: typeof band.to === "number" ? band.to : Number(band.to) }),
    },
  ]);

  const markPointData = (annotations.markers ?? []).map((marker) => {
    /*
     * `position: "top"` centres the text over the symbol. A near-edge marker
     * then loses half its label off the canvas, so an inward-anchored marker
     * keeps the same position and vertical offset but states its own `align`:
     * the text grows into the plot instead of out of it. `align` is a text
     * style the engine reads ahead of the position's own default, so nothing
     * moves vertically and a centred label is byte-identical to before.
     */
    const anchor = labelAnchor(marker, xExtent);
    /*
     * A marker that carries its own detail rows is a **compact** marker: the
     * glyph says "something canonical happened here" and the exact fields are
     * read on hover, through the chart's own tooltip. A permanent label would
     * cover the data it annotates — which is exactly what a dense event layer
     * (a halving, a cycle high, a cycle low on a fifteen-year price) must not do.
     */
    const compact = (marker.detail?.length ?? 0) > 0;
    return {
      coord: [xCoord(marker.at), markerY],
      name: marker.label,
      symbol: MARKER_SYMBOL[marker.shape ?? "flag"] ?? "circle",
      symbolRotate: marker.shape === "triangle-down" ? 180 : 0,
      symbolSize: MARKER_SIZE[marker.shape ?? "flag"] ?? 10,
      itemStyle: { color: marker.color ?? toneColor(theme, marker.tone ?? "accent", 0) },
      label: {
        show: !compact && marker.shape !== "dot",
        formatter: marker.label,
        position: "top",
        ...(anchor ? { align: anchor } : {}),
        color: theme.textMuted,
        fontFamily: theme.fontFamily,
        fontSize: theme.fontMicro,
      },
    };
  });

  return {
    ...(markLineData.length
      ? {
          markLine: {
            silent: true,
            symbol: "none",
            animation: false,
            data: markLineData,
          },
        }
      : {}),
    ...(markAreaData.length
      ? { markArea: { silent: true, animation: false, data: markAreaData } }
      : {}),
    ...(markPointData.length ? { markPoint: { animation: false, data: markPointData } } : {}),
  };
}
