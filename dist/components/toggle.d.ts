import { Toggle, ToggleGroup } from "radix-ui";
import { VariantProps } from "class-variance-authority";
//#region src/components/toggle.d.ts
/**
 * LUC Toggle / ToggleGroup — independent on/off controls.
 *
 * Explicitly *not* `SegmentedControl` with a `multiple` prop. They answer
 * different questions and they must not share a contract:
 *
 *   SegmentedControl  one of N, with a sliding indicator  (a value)
 *   ToggleGroup       any of N, each independently pressed (a set of options)
 *
 * So a ToggleGroup has no sliding thumb, its items keep their own pressed
 * state, and the group is a `toolbar`-like roving-focus composite rather than a
 * radio group. Radix supplies the roving focus and `aria-pressed`; LUC supplies
 * the pressed surface — the same "settled into the panel" depth the Slider
 * thumb and the selected Table row use.
 */
export declare const toggleVariants: (props?: ({
  variant?: "default" | "outline" | "soft" | null | undefined;
  size?: "sm" | "md" | "lg" | null | undefined;
  block?: boolean | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface ToggleProps extends React.ComponentPropsWithRef<typeof Toggle.Root>, VariantProps<typeof toggleVariants> {
  /** Required for an icon-only toggle; ignored when children carry text. */
  label?: string;
}
declare function Toggle$1({ className, variant, size, block, label, ...props }: ToggleProps): import("react").JSX.Element;
export type ToggleGroupProps = React.ComponentPropsWithRef<typeof ToggleGroup.Root>;
declare function ToggleGroup$1({ className, ...props }: ToggleGroupProps): import("react").JSX.Element;
export interface ToggleGroupItemProps extends React.ComponentPropsWithRef<typeof ToggleGroup.Item>, VariantProps<typeof toggleVariants> {
  label?: string;
}
export declare function ToggleGroupItem({ className, variant, size, label, ...props }: ToggleGroupItemProps): import("react").JSX.Element;
//#endregion
export { Toggle$1 as Toggle, ToggleGroup$1 as ToggleGroup };
//# sourceMappingURL=toggle.d.ts.map