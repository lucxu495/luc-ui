import { ControlSize } from "./input.js";
//#region src/components/textarea.d.ts
export interface TextareaProps extends React.ComponentPropsWithRef<"textarea"> {
  size?: ControlSize;
  invalid?: boolean;
  /**
   * Grow with content instead of scrolling. Uses `field-sizing: content` where
   * supported and falls back to a comfortable fixed minimum height.
   */
  autoResize?: boolean;
}
export declare function Textarea({ className, size, invalid, autoResize, id, required, disabled, readOnly, rows, ...props }: TextareaProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=textarea.d.ts.map