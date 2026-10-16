import { Switch } from "radix-ui";
//#region src/components/switch.d.ts
export interface SwitchProps extends React.ComponentPropsWithRef<typeof Switch.Root> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  size?: "sm" | "md";
}
declare function Switch$1({ className, label, description, size, id, disabled, ...props }: SwitchProps): import("react").JSX.Element;
//#endregion
export { Switch$1 as Switch };
//# sourceMappingURL=switch.d.ts.map