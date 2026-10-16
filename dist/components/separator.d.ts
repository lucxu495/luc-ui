import { Separator } from "radix-ui";
//#region src/components/separator.d.ts
export interface SeparatorProps extends React.ComponentPropsWithRef<typeof Separator.Root> {
  /** `line` for hairlines, `ornament` for a short centred rule. */
  variant?: "line" | "ornament";
}
declare function Separator$1({ className, orientation, variant, ...props }: SeparatorProps): import("react").JSX.Element;
//#endregion
export { Separator$1 as Separator };
//# sourceMappingURL=separator.d.ts.map