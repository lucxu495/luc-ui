import { Sparkline as LucSparkline, type SparklineProps } from "@luc/ui";

/**
 * Stat-card sparklines in the Showcase are filled by default. The component
 * itself lives in `@luc/ui`; only the default differs here.
 */
export function Sparkline({ fill = true, ...props }: SparklineProps) {
  return <LucSparkline fill={fill} {...props} />;
}

export type { SparklineProps };
