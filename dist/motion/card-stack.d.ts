//#region src/motion/card-stack.d.ts
interface CardStackContextValue {
  index: number;
  count: number;
  setIndex: (next: number) => void;
  step: (delta: number) => void;
  loop: boolean;
}
/** The public hook, for a caller that wants to drive its own controls. */
export declare function useCardStack(): CardStackContextValue;
export interface CardStackProps extends Omit<React.ComponentPropsWithRef<"div">, "onKeyDown"> {
  /** Controlled position. Pair with `onIndexChange`. */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** How many cards stay visible behind the active one. */
  visible?: number;
  /** Horizontal offset per layer, in px. Negative fans to the left. */
  offsetX?: number;
  /** Vertical offset per layer, in px. Positive sinks the deck downwards. */
  offsetY?: number;
  /** Scale lost per layer. `0.04` reads as a deck; `0` reads as a strip. */
  shrink?: number;
  /** Rotation per layer, in degrees — a small value fans the deck. */
  spread?: number;
  /**
   * Opacity lost per layer behind the active card.
   *
   * Without it every layer is drawn at full opacity, and a deck whose cards have
   * transparent or semi-transparent surfaces becomes unreadable: the labels of
   * three layers sit on top of each other with nothing to separate them. Depth is
   * the whole point of a stack, so it is expressed on the layer rather than left
   * to every caller to remember. `0` restores the old flat behaviour.
   */
  dim?: number;
  /** Wrap past the ends instead of stopping. */
  loop?: boolean;
  /** Accessible name for the group. */
  label?: string;
}
/**
 * LUC `CardStack` — depth as navigation.
 *
 * Five cards in a row is a carousel; five cards in a deck is a *stack*, and the
 * difference is that a stack tells you where you are: the active card is largest
 * and closest, the ones behind it recede on three axes at once (z, scale and a
 * little rotation), and stepping moves the whole deck rather than sliding a
 * track.
 *
 * It stays usable everywhere:
 *
 *  - Arrow keys, Home and End step the deck; the container is focusable and the
 *    cards behind the active one are `inert`, so Tab can never land inside a card
 *    the user cannot see.
 *  - A horizontal pointer drag (48px threshold, `touch-action: pan-y`) steps on
 *    touch without stealing vertical scrolling.
 *  - Reduced motion keeps the arrangement and drops the travel: positions are
 *    computed the same way, they just resolve instantly.
 *  - A polite live region announces "2 / 5", so the deck is navigable by ear.
 *
 * Direct children should be `CardStackItem`s; anything else is rendered on top
 * of the deck, which is how `<CardStackControls />` gets a place to live.
 */
export declare function CardStack({ className, children, index, defaultIndex, onIndexChange, visible, offsetX, offsetY, shrink, spread, dim, loop, label, ...props }: CardStackProps): import("react").JSX.Element;
/** A card in a `CardStack`. Its position is decided by the stack, not by you. */
export declare function CardStackItem({ className, children, ...props }: React.ComponentPropsWithRef<"div">): import("react").JSX.Element;
export interface CardStackControlsProps extends React.ComponentPropsWithRef<"div"> {
  /** Accessible names for the two buttons. */
  previousLabel?: string;
  nextLabel?: string;
}
/**
 * Previous/next for a `CardStack`, as a composable slot. It is a separate
 * component rather than a `controls` boolean so a caller can put it anywhere —
 * under the deck, beside it, or inside a toolbar — without the stack growing a
 * prop for every position.
 */
export declare function CardStackControls({ className, previousLabel, nextLabel, children, ...props }: CardStackControlsProps): import("react").JSX.Element;
//#endregion
export {};
//# sourceMappingURL=card-stack.d.ts.map