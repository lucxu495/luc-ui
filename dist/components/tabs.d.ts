import { Tabs as Tabs$1 } from "radix-ui";
import { ReactNode } from "react";
//#region src/components/tabs.d.ts
export type TabsVariant = "line" | "surface";
export type TabsSize = "sm" | "md" | "lg";
export interface TabsProps extends React.ComponentPropsWithRef<typeof Tabs$1.Root> {
  variant?: TabsVariant;
  size?: TabsSize;
}
declare function TabsRoot({ className, variant, size, value, defaultValue, onValueChange, children, ...props }: TabsProps): import("react").JSX.Element;
export interface TabsListProps extends React.ComponentPropsWithRef<typeof Tabs$1.List> {
  /** Stretch triggers to fill the available width. */
  fill?: boolean;
}
declare function TabsList({ className, fill, children, ref, ...props }: TabsListProps): import("react").JSX.Element;
declare function TabsIndicator(): import("react").JSX.Element;
export interface TabsTriggerProps extends React.ComponentPropsWithRef<typeof Tabs$1.Trigger> {
  leadingIcon?: ReactNode;
}
declare function TabsTrigger({ className, leadingIcon, children, value, ...props }: TabsTriggerProps): import("react").JSX.Element;
declare function TabsContent({ className, ...props }: React.ComponentPropsWithRef<typeof Tabs$1.Content>): import("react").JSX.Element;
export declare const Tabs: typeof TabsRoot & {
  List: typeof TabsList;
  Trigger: typeof TabsTrigger;
  Content: typeof TabsContent;
  Indicator: typeof TabsIndicator;
};
//#endregion
export {};
//# sourceMappingURL=tabs.d.ts.map