//#region src/components/input-group.d.ts
/**
 * LUC InputGroup — a field with leading/trailing addons.
 *
 * Every text control in the library already shares one shell
 * (`inputShellClass`), which is why a search icon, a currency prefix and a
 * unit suffix never line up differently in two components. This file exposes
 * that shell as a composition contract so a consumer can build the same field
 * without hand-writing the geometry:
 *
 *   <InputGroup>
 *     <InputGroupAddon>https://</InputGroupAddon>
 *     <InputGroupInput placeholder="example.com" />
 *     <InputGroupAddon align="end">.com</InputGroupAddon>
 *   </InputGroup>
 *
 * The addon is a real element with a hairline separator rather than a decorative
 * span, so it stays legible at 200% zoom and does not overlap the value.
 */
export interface InputGroupProps extends React.ComponentPropsWithRef<"div"> {
  size?: "sm" | "md" | "lg";
  invalid?: boolean;
  disabled?: boolean;
}
export declare function InputGroup({ className, size, invalid, disabled, children, ...props }: InputGroupProps): import("react").JSX.Element;
export interface InputGroupAddonProps extends React.ComponentPropsWithRef<"span"> {
  /** Which edge the addon sits on. Drives the separator direction. */
  align?: "start" | "end";
  /** Make the addon interactive — it becomes a real button-like target. */
  interactive?: boolean;
}
export declare function InputGroupAddon({ className, align, interactive, ...props }: InputGroupAddonProps): import("react").JSX.Element;
export type InputGroupInputProps = React.ComponentPropsWithRef<"input">;
export declare function InputGroupInput({ className, ...props }: InputGroupInputProps): import("react").JSX.Element;
/** A hairline between the value and an adjacent element inside the shell. */
export declare function InputGroupSeparator({ className, ...props }: React.ComponentPropsWithRef<"span">): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=input-group.d.ts.map