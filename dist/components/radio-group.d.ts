import { RadioGroup } from "radix-ui";
//#region src/components/radio-group.d.ts
declare const RadioGroup$1: import("react").ForwardRefExoticComponent<RadioGroup.RadioGroupProps & import("react").RefAttributes<HTMLDivElement>>;
export interface RadioProps extends Omit<React.ComponentPropsWithRef<typeof RadioGroup.Item>, "children"> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  invalid?: boolean;
}
export declare function Radio({ className, label, description, id, disabled, invalid, ...props }: RadioProps): import("react").JSX.Element;
//#endregion
export { RadioGroup$1 as RadioGroup };
//# sourceMappingURL=radio-group.d.ts.map