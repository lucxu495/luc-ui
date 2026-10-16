import { Gap } from "./stack.js";
//#region src/layout/grid.d.ts
export type Columns = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 12;
declare const minWidthClass: {
  readonly none: "";
  readonly sm: "[grid-template-columns:repeat(auto-fill,minmax(12rem,1fr))]";
  readonly md: "[grid-template-columns:repeat(auto-fill,minmax(16rem,1fr))]";
  readonly lg: "[grid-template-columns:repeat(auto-fill,minmax(20rem,1fr))]";
  readonly xl: "[grid-template-columns:repeat(auto-fill,minmax(26rem,1fr))]";
};
export interface GridProps extends React.ComponentPropsWithRef<"div"> {
  columns?: Columns;
  /** Auto-fit track sizing. Overrides `columns` when set. */
  minItemWidth?: keyof typeof minWidthClass;
  gap?: Gap;
}
/** Responsive grid. Picks a sane breakpoint stack per column count. */
export declare function Grid({ className, columns, minItemWidth, gap, ...props }: GridProps): import("react").JSX.Element;
//#endregion
export {};
//# sourceMappingURL=grid.d.ts.map