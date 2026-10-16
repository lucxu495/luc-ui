//#region src/motion/pressable.d.ts
type PressableTag = "div" | "span" | "li" | "button" | "a" | "article";
export interface PressableProps extends React.ComponentPropsWithRef<"div"> {
  as?: PressableTag;
  href?: string;
  /** Lift the element on hover. */
  lift?: boolean;
  /** Scale down while pressed. */
  press?: boolean;
  /** Scale up slightly on hover. */
  growOnHover?: boolean;
  disabled?: boolean;
}
/**
 * LUC Pressable — the physical half of an interactive surface.
 *
 * Hover lifts and a press compresses, both spring-driven, both expressed in
 * *fractions of the resolved intensity* rather than seconds. It is deliberately
 * separate from `MotionSurface`: a surface decides how something looks, a
 * Pressable decides how it responds to being touched. Compose them, or use the
 * `interactive` variants of Card/Button/StatCard which do it for you.
 *
 * Reduced motion renders an inert element with the same DOM and semantics.
 */
export declare function Pressable({ className, children, as, href, lift, press, growOnHover, disabled, ...props }: PressableProps): import("react").JSX.Element;
//#endregion
export {};
//# sourceMappingURL=pressable.d.ts.map