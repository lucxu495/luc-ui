import { Progress } from "radix-ui";
//#region src/components/progress.d.ts
export interface ProgressProps extends React.ComponentPropsWithRef<typeof Progress.Root> {
  /** 0–100. Omit for an indeterminate bar. */
  value?: number | null;
  tone?: "accent" | "positive" | "negative" | "warning";
  size?: "sm" | "md";
}
/**
 * LUC Progress — determinate by default; an indeterminate sweep is available
 * for operations whose length is genuinely unknown.
 */
declare function Progress$1({ className, value, tone, size, ...props }: ProgressProps): import("react").JSX.Element;
//#endregion
export { Progress$1 as Progress };
//# sourceMappingURL=progress.d.ts.map