import { ReactNode } from "react";
//#region src/components/transfer-list.d.ts
/**
 * LUC TransferList — move items between two sets without losing sight of either.
 *
 * The whole reason this exists rather than a multi-select Combobox is
 * *visibility*: an operator assigning columns, permissions or instruments needs
 * to see what is excluded as clearly as what is included.
 *
 * Both panes are `listbox`es with a roving active option
 * (`aria-activedescendant`) so the list is a single Tab stop per pane;
 * Space/Enter toggles the active option, `Ctrl/Cmd+A` selects everything in the
 * focused pane, and the four buttons move the current selection either way.
 * `value` is the right-hand set — the only state a form usually needs.
 */
export interface TransferItem {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}
export interface TransferListProps extends Omit<React.ComponentPropsWithRef<"div">, "onChange" | "defaultValue"> {
  items: readonly TransferItem[];
  /** Ids on the right-hand side. */
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (ids: string[]) => void;
  sourceLabel?: string;
  targetLabel?: string;
  /** Pane height in pixels. Default 240. */
  height?: number;
}
export declare function TransferList({ items, value, defaultValue, onValueChange, sourceLabel, targetLabel, height, className, ...props }: TransferListProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=transfer-list.d.ts.map