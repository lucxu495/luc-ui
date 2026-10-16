//#region src/motion/magnify-dock.d.ts
export interface MagnifyDockProps extends React.ComponentPropsWithRef<"div"> {
  /** Distance in px at which a neighbour starts to grow. */
  range?: number;
  /** Extra scale at the very centre of an item. `0.55` is the house default. */
  scale?: number;
  /** Rise in px at the very centre of an item. */
  lift?: number;
  /** Lanes stack vertically; every other use is horizontal. */
  orientation?: "horizontal" | "vertical";
}
/**
 * LUC MagnifyDock — a row of actions that swells toward the pointer.
 *
 * The interaction physics of the macOS dock, applied to product toolbars: a
 * chart's range controls, a canvas' tool rail, an editor's formatting strip, a
 * media viewer's transport. It answers the most basic question a dense toolbar
 * raises ("which of these am I about to hit?") without a tooltip.
 *
 * Why it is implemented the way it is:
 *
 *  - **Pointer move never re-renders React.** The container holds a list of
 *    element references and writes two custom properties straight onto them
 *    inside one rAF. Twenty items cost the same as two.
 *  - **The geometry is a cosine falloff**, so an item's neighbours swell
 *    smoothly rather than popping at an invisible boundary.
 *  - **Rest state is real state.** Items are laid out at their normal size, so
 *    the dock is fully usable (and keyboard-navigable) with no pointer at all,
 *    on a touch device, and under reduced motion — where the listeners are never
 *    attached in the first place.
 */
export declare function MagnifyDock({ className, children, range, scale, lift, orientation, onPointerMove, onPointerLeave, ...props }: MagnifyDockProps): import("react").JSX.Element;
export interface MagnifyDockItemProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * The item's accessible name. A dock item is usually a control inside it, so
   * this is only needed when the item itself carries meaning.
   */
  label?: string;
}
/**
 * One lane of a `MagnifyDock`.
 *
 * The element owns the transform and nothing else, so whatever you put inside
 * keeps its own focus ring, its own disabled state and its own semantics. The
 * transition is on `transform` only, which the compositor can animate without
 * touching layout.
 *
 * A labelled item is a `group`, not a bare `div`: `aria-label` on an element
 * whose role is `generic` is prohibited — axe reports it as
 * `aria-prohibited-attr`, and the name it carries reaches no one, because a
 * generic container is not exposed as a named node. `group` is the role that
 * says exactly what the label says ("these children belong together and are
 * called this") without inventing an interactive role the item does not have.
 * An item with no `label` stays a plain `div`.
 */
export declare function MagnifyDockItem({ className, children, label, style, ...props }: MagnifyDockItemProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=magnify-dock.d.ts.map