import { cn } from "../utils/cn";
import { Badge } from "../components/badge";

export type StatusTone = "positive" | "negative" | "warning" | "info" | "neutral";

export interface StatusDefinition {
  tone: StatusTone;
  label: string;
  /** Pulse the dot for genuinely live states. Use sparingly. */
  pulse?: boolean;
}

// A small, opinionated status vocabulary. Products extend it via
// `<StatusBadge status="custom" tone="info" label="…" />` rather than inventing
// new colours.
export const statusPresets = {
  live: { tone: "positive", label: "Live", pulse: true },
  healthy: { tone: "positive", label: "Healthy" },
  positive: { tone: "positive", label: "Positive" },
  degraded: { tone: "warning", label: "Degraded" },
  pending: { tone: "info", label: "Pending" },
  stale: { tone: "warning", label: "Stale" },
  down: { tone: "negative", label: "Down" },
  negative: { tone: "negative", label: "Negative" },
  unknown: { tone: "neutral", label: "Unknown" },
} as const satisfies Record<string, StatusDefinition>;

export type StatusPreset = keyof typeof statusPresets;

export interface StatusBadgeProps extends React.ComponentPropsWithRef<"span"> {
  status: StatusPreset;
  /** Override the preset label. */
  label?: string;
  size?: "sm" | "md";
}

// LUC StatusBadge — status colour, dot and label in one consistent shape.
export function StatusBadge({ className, status, label, size = "md", ...props }: StatusBadgeProps) {
  const preset: StatusDefinition = statusPresets[status];
  return (
    <Badge
      data-slot="status-badge"
      data-status={status}
      tone={preset.tone}
      size={size}
      className={cn("gap-1.5", className)}
      {...props}
    >
      <span className="relative flex size-1.5 shrink-0 items-center justify-center">
        <span className="absolute inline-flex size-full rounded-full bg-current opacity-70" />
        {preset.pulse ? (
          <span
            data-motion-essential
            className="absolute inline-flex size-full animate-pulse-soft rounded-full bg-current"
          />
        ) : null}
      </span>
      {label ?? preset.label}
    </Badge>
  );
}
