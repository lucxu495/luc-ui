"use client";

import { useMemo } from "react";
import type { ChartFormat, SeriesTone } from "../types";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme";
import { formatChartValue } from "../core/formatters";
import { withAlpha } from "../core/theme";
import { baseOption, tooltipShell, type Option } from "../adapters/echarts/option";
import { tooltipGridHtml, tooltipShellHtml } from "../core/tooltip-html";
import { ChartSurface, type ChartState } from "./chart";
import type { EChartsInstance } from "../adapters/echarts/runtime";
import type { EChartEvent } from "../adapters/echarts/echart-surface";

export interface FlowCommonProps {
  state?: ChartState;
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
}

export interface SankeyNode {
  name: string;
  tone?: SeriesTone;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyChartProps extends FlowCommonProps {
  nodes: readonly SankeyNode[];
  links: readonly SankeyLink[];
  format?: ChartFormat;
  title?: string;
  description?: string;
}

/**
 * Flow between named stages.
 *
 * Links are deliberately quiet — low opacity, no gradient — so the nodes, which
 * carry the meaning, stay visually dominant. A bright sankey is a decoration.
 */
export function SankeyChart({
  nodes,
  links,
  format,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
}: SankeyChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(
    () => ({
      ...baseOption(theme, motion),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = (Array.isArray(params) ? params[0] : params) as {
            dataType?: "node" | "edge";
            name?: string;
            data?: { source?: string; target?: string; value?: number };
          };
          if (item.dataType === "edge") {
            const link = item.data ?? {};
            return tooltipShellHtml(
              `${link.source ?? ""} to ${link.target ?? ""}`,
              tooltipGridHtml([["Flow", formatChartValue(link.value ?? null, format)]]),
            );
          }
          const outflow = links
            .filter((link) => link.source === item.name)
            .reduce((sum, link) => sum + link.value, 0);
          return tooltipShellHtml(
            item.name,
            tooltipGridHtml([["Outflow", formatChartValue(outflow || null, format)]]),
          );
        },
      }),
      series: [
        {
          id: "sankey",
          type: "sankey",
          left: 4,
          right: 12,
          top: 12,
          bottom: 12,
          nodeWidth: 11,
          nodeGap: 10,
          draggable: false,
          emphasis: { focus: "adjacency" },
          lineStyle: {
            color: withAlpha(theme.neutral, 0.34),
            curveness: 0.5,
            opacity: 0.55,
          },
          itemStyle: { borderWidth: 0, borderRadius: 3 },
          label: {
            color: theme.textMuted,
            fontFamily: theme.fontFamily,
            fontSize: theme.fontMicro,
          },
          data: nodes.map((node) => ({ name: node.name })),
          links: links.map((link) => ({
            source: link.source,
            target: link.target,
            value: link.value,
          })),
        },
      ],
    }),
    [format, links, motion, nodes, theme],
  );

  return (
    <ChartSurface
      option={option}
      state={nodes.length === 0 || links.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Sankey flow"}
      ariaDescription={ariaDescription ?? description}
      onReady={onReady}
      onEvent={onEvent}
    />
  );
}

export interface GraphNode {
  id: string;
  name?: string;
  value?: number;
  group?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  value?: number;
}

export interface GraphChartProps extends FlowCommonProps {
  nodes: readonly GraphNode[];
  links: readonly GraphLink[];
  groups?: readonly string[];
  layout?: "force" | "circular";
  format?: ChartFormat;
  title?: string;
  description?: string;
}

/**
 * Network graph.
 *
 * Force layout by default with a restrained repulsion, so the labels stay
 * legible instead of collapsing into a hairball.
 */
export function GraphChart({
  nodes,
  links,
  groups,
  layout = "force",
  format,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
}: GraphChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const maxValue = Math.max(1, ...nodes.map((node) => node.value ?? 1));
    return {
      ...baseOption(theme, motion),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = (Array.isArray(params) ? params[0] : params) as {
            dataType?: "node" | "edge";
            name?: string;
            data?: { source?: string; target?: string; value?: number };
          };
          if (item.dataType === "edge") {
            const link = item.data ?? {};
            return tooltipShellHtml(
              `${link.source ?? ""} to ${link.target ?? ""}`,
              tooltipGridHtml([["Weight", formatChartValue(link.value ?? null, format)]]),
            );
          }
          const node = nodes.find((entry) => (entry.name ?? entry.id) === item.name);
          const rows: Array<[string, string]> = [
            ["Weight", formatChartValue(node?.value ?? null, format)],
          ];
          if (node?.group) rows.push(["Group", node.group]);
          return tooltipShellHtml(item.name, tooltipGridHtml(rows));
        },
      }),
      series: [
        {
          id: "graph",
          type: "graph",
          layout,
          roam: false,
          draggable: false,
          top: 12,
          bottom: 12,
          left: 12,
          right: 12,
          ...(layout === "force"
            ? { force: { repulsion: 240, edgeLength: [40, 110], gravity: 0.12, friction: 0.5 } }
            : { circular: { rotateLabel: false } }),
          lineStyle: {
            color: withAlpha(theme.neutral, 0.28),
            width: 1,
            curveness: 0.12,
          },
          label: {
            show: true,
            position: "right",
            color: theme.textMuted,
            fontFamily: theme.fontFamily,
            fontSize: theme.fontMicro,
            formatter: "{b}",
          },
          itemStyle: { borderWidth: 0 },
          emphasis: {
            focus: "adjacency",
            scale: 1.1,
            label: { color: theme.textPrimary },
          },
          data: nodes.map((node) => ({
            id: node.id,
            name: node.name ?? node.id,
            value: node.value ?? 1,
            symbolSize: 8 + Math.sqrt((node.value ?? 1) / maxValue) * 16,
            ...(node.group ? { category: groups?.indexOf(node.group) ?? 0 } : {}),
          })),
          links: links.map((link) => ({
            source: link.source,
            target: link.target,
            value: link.value ?? 1,
          })),
          ...(groups?.length ? { categories: groups.map((name) => ({ name })) } : {}),
        },
      ],
    };
  }, [format, groups, layout, links, motion, nodes, theme]);

  return (
    <ChartSurface
      option={option}
      state={nodes.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Network graph"}
      ariaDescription={ariaDescription ?? description}
      onReady={onReady}
      onEvent={onEvent}
    />
  );
}
