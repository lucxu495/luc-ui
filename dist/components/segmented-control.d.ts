import { ToggleGroup } from "radix-ui";
//#region src/components/segmented-control.d.ts
export interface SegmentedControlProps extends Omit<ToggleGroup.ToggleGroupSingleProps, "type" | "rovingFocus"> {
  /** Match the item size. `sm` is for toolbars and topbars. */
  size?: "sm" | "md";
  fill?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}
export declare function SegmentedControl({ className, size, fill, value, defaultValue, onValueChange, ref, children, ...props }: SegmentedControlProps): import("react").JSX.Element;
export interface SegmentedItemProps extends React.ComponentPropsWithRef<typeof ToggleGroup.Item> {
  leadingIcon?: React.ReactNode;
  size?: "sm" | "md";
}
export declare function SegmentedItem({ className, children, leadingIcon, value, size, ...props }: SegmentedItemProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=segmented-control.d.ts.map