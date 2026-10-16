//#region src/components/kbd.d.ts
/**
 * LUC KbdGroup — a keyboard chord.
 *
 * The single keycap is `Kbd` (from the typography family, where it belongs next
 * to `Code`). This module adds the sequence: "⌘ K" is one chord, so the `+`
 * separator between the keys is `aria-hidden` and the reader announces a single
 * combination rather than a list of symbols.
 */
export interface KbdGroupProps extends React.ComponentPropsWithRef<"span"> {
  /** Keys of the chord. Hidden separators keep the announcement clean. */
  keys: string[];
  size?: "sm" | "md";
}
export declare function KbdGroup({ className, keys, size, ...props }: KbdGroupProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=kbd.d.ts.map