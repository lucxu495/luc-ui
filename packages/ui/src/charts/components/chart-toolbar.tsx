"use client";

import { useState, type ReactNode } from "react";
import { RiDownloadLine, RiRestartLine } from "@remixicon/react";
import { Button } from "../../components/button";
import { Tooltip } from "../../components/tooltip";
import { exportChartImage } from "../core/export";

export interface ChartExportButtonProps {
  /** Returns the live engine instance. `null` before the chart is ready. */
  getTarget: () => unknown;
  filename: string;
  label?: string;
  className?: string;
}

/**
 * Image export. Disabled until the chart reports an instance, so a click can
 * never produce a blank file.
 */
export function ChartExportButton({
  getTarget,
  filename,
  label = "Export PNG",
  className,
}: ChartExportButtonProps) {
  const [busy, setBusy] = useState(false);
  return (
    <Tooltip content={label} side="bottom">
      <Button
        size="sm"
        variant="ghost"
        className={className}
        loading={busy}
        leadingIcon={busy ? undefined : <RiDownloadLine />}
        onClick={async () => {
          const target = getTarget();
          if (!target) return;
          setBusy(true);
          try {
            await exportChartImage(target, { filename });
          } finally {
            setBusy(false);
          }
        }}
      >
        <span className="sr-only">{label}</span>
      </Button>
    </Tooltip>
  );
}

export interface ChartResetButtonProps {
  onReset: () => void;
  label?: string;
  className?: string;
}

/** Reset zoom / visible range. Appears only when the caller tracks that state. */
export function ChartResetButton({ onReset, label = "Reset zoom", className }: ChartResetButtonProps) {
  return (
    <Tooltip content={label} side="bottom">
      <Button
        size="sm"
        variant="ghost"
        className={className}
        leadingIcon={<RiRestartLine />}
        onClick={onReset}
      >
        <span className="sr-only">{label}</span>
      </Button>
    </Tooltip>
  );
}

export interface ChartTabsProps {
  children: ReactNode;
  className?: string;
}

/** Thin wrapper so a chart toolbar's item spacing stays consistent. */
export function ChartToolbarGroup({ children, className }: ChartTabsProps) {
  return <div className={className ? `flex items-center gap-1.5 ${className}` : "flex items-center gap-1.5"}>{children}</div>;
}
