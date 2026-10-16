import { Tooltip } from "radix-ui";
//#region src/components/tooltip.d.ts
export declare const TooltipProvider: import("react").FC<Tooltip.TooltipProviderProps>;
export interface TooltipProps extends Omit<React.ComponentPropsWithRef<typeof Tooltip.Root>, "children"> {
  content: React.ReactNode;
  children: React.ReactNode;
  /** Render a small pointer arrow. Default `true`. */
  arrow?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  className?: string;
  /** Extra content under the label, e.g. a keyboard hint. */
  hint?: React.ReactNode;
}
declare function Tooltip$1({ content, children, arrow, side, align, sideOffset, className, hint, ...props }: TooltipProps): import("react").JSX.Element;
//#endregion
export { Tooltip$1 as Tooltip };
//# sourceMappingURL=tooltip.d.ts.map