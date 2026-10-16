//#region src/data/status-badge.d.ts
export type StatusTone = "positive" | "negative" | "warning" | "info" | "neutral";
export interface StatusDefinition {
  tone: StatusTone;
  label: string;
  /** Pulse the dot for genuinely live states. Use sparingly. */
  pulse?: boolean;
}
export declare const statusPresets: {
  readonly live: {
    readonly tone: "positive";
    readonly label: "Live";
    readonly pulse: true;
  };
  readonly healthy: {
    readonly tone: "positive";
    readonly label: "Healthy";
  };
  readonly positive: {
    readonly tone: "positive";
    readonly label: "Positive";
  };
  readonly degraded: {
    readonly tone: "warning";
    readonly label: "Degraded";
  };
  readonly pending: {
    readonly tone: "info";
    readonly label: "Pending";
  };
  readonly stale: {
    readonly tone: "warning";
    readonly label: "Stale";
  };
  readonly down: {
    readonly tone: "negative";
    readonly label: "Down";
  };
  readonly negative: {
    readonly tone: "negative";
    readonly label: "Negative";
  };
  readonly unknown: {
    readonly tone: "neutral";
    readonly label: "Unknown";
  };
};
export type StatusPreset = keyof typeof statusPresets;
export interface StatusBadgeProps extends React.ComponentPropsWithRef<"span"> {
  status: StatusPreset;
  /** Override the preset label. */
  label?: string;
  size?: "sm" | "md";
}
export declare function StatusBadge({ className, status, label, size, ...props }: StatusBadgeProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=status-badge.d.ts.map