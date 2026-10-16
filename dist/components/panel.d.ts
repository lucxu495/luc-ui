//#region src/components/panel.d.ts
export interface PanelProps extends React.ComponentPropsWithRef<"div"> {
  /** `sunken` sits inside cards; `default` sits on the canvas. */
  tone?: "default" | "sunken" | "raised";
  /** Hairline frame. Default `true`. */
  bordered?: boolean;
}
/**
 * LUC Panel — a dense, low-chrome surface for toolbars, sidebars, code blocks
 * and nested regions. Panels do not carry elevation by default; they are the
 * structural layer beneath Cards.
 */
export declare function Panel({ className, tone, bordered, ...props }: PanelProps): import("react").JSX.Element;
export interface PanelHeaderProps extends React.ComponentPropsWithRef<"div"> {
  actions?: React.ReactNode;
}
export declare function PanelHeader({ className, actions, children, ...props }: PanelHeaderProps): import("react").JSX.Element;
export declare function PanelBody({ className, ...props }: React.ComponentPropsWithRef<"div">): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=panel.d.ts.map