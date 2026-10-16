/**
 * Chart image export.
 *
 * Both engines can hand back a canvas, so export is one function with two
 * branches and no shared state. Data export (CSV) and shareable URL state are
 * deliberately out of scope — see docs/CHART_GUIDE.md.
 */

import { normalizeCssColor } from "./theme";

export interface ExportImageOptions {
  filename: string;
  /** Background painted behind transparent areas. Defaults to the card surface. */
  backgroundColor?: string;
  pixelRatio?: number;
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function resolveBackground(explicit?: string): string {
  if (explicit) return explicit;
  if (typeof document === "undefined") return "#ffffff";
  const value = getComputedStyle(document.documentElement).getPropertyValue("--surface-raised").trim();
  if (!value) return "#ffffff";
  return normalizeCssColor(value) || "#ffffff";
}

/**
 * Export a chart instance to a PNG download.
 *
 * Accepts an ECharts instance (has `getDataURL`) or a Lightweight Charts chart
 * (has `takeScreenshot`). A target that is neither resolves quietly rather than
 * throwing inside a click handler.
 */
export async function exportChartImage(target: unknown, options: ExportImageOptions): Promise<boolean> {
  if (typeof document === "undefined" || !target) return false;
  const background = resolveBackground(options.backgroundColor);

  const echartsLike = target as {
    getDataURL?: (opts: Record<string, unknown>) => string;
  };
  if (typeof echartsLike.getDataURL === "function") {
    const url = echartsLike.getDataURL({
      type: "png",
      pixelRatio: options.pixelRatio ?? 2,
      backgroundColor: background,
    });
    triggerDownload(url, options.filename);
    return true;
  }

  const lightweightLike = target as { takeScreenshot?: () => HTMLCanvasElement };
  if (typeof lightweightLike.takeScreenshot === "function") {
    const source = lightweightLike.takeScreenshot();
    const canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    const context = canvas.getContext("2d");
    if (!context) return false;
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0);
    triggerDownload(canvas.toDataURL("image/png"), options.filename);
    return true;
  }

  return false;
}
