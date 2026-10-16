//#region src/hooks/use-flash-target.d.ts
/**
 * Landing emphasis for a jump-to target.
 *
 * A navigator (an outline, a table of contents) scrolls the page to a card; the
 * scroll alone does not always make *which* card obvious, especially when two
 * neighbours look alike. `flashTarget` marks the destination with
 * `data-target-flash="true"` for a short beat so the product's own CSS can raise
 * one subtle ring/shadow, then clears it. Two rules keep it calm:
 *
 *  - it is a *temporary* datum on the element, never a class the product has to
 *    remember to remove, and never a change to the target's own layout;
 *  - `prefers-reduced-motion` (or the LUC `data-motion="reduced"` override) keeps
 *    it static — the CSS shows a brief non-animated emphasis instead of a pulse.
 *
 * It is DOM-only and framework-free so any primitive in LUC UI (or a product
 * binding like Luc Web's navigator) can call it; nothing here decides styling.
 */
export interface FlashTargetOptions {
  /** How long the datum stays before it is cleared. Default 1000ms. */
  durationMs?: number;
  /** The attribute set on the element. Default `data-target-flash`. */
  attribute?: string;
  /** The value written to the attribute. Default `"true"`. */
  value?: string;
}
/** Mark one element, then clear the mark after the beat. */
export declare function flashElement(element: Element | null, options?: FlashTargetOptions): void;
/** Mark the element with this DOM id (no-op when it is not on the page). */
export declare function flashTarget(targetId: string, options?: FlashTargetOptions): void;
export interface RevealTargetOptions {
  /**
   * Space (px) to leave between the sticky chrome and the target's top.
   * Defaults to `--shell-topbar-height` + 24 when it is defined, else 88.
   */
  offsetPx?: number;
  /** Scroll animation. Default `smooth` (suppressed under reduced motion). */
  behavior?: ScrollBehavior;
  /** Whether to flash the target once it arrives. Default true. */
  flash?: boolean;
  /** How long the flash datum stays. Default 1100ms (reduced motion: 800ms). */
  durationMs?: number;
  /** Hard cap on waiting for a smooth scroll to settle. Default 1400ms. */
  settleTimeoutMs?: number;
}
/**
 * Scroll to a jump target and flash it **when it arrives**.
 *
 * Flashing at click time is wrong whenever the jump animates: the emphasis is
 * spent while the page is still moving, and the reader arrives at a card that is
 * already back to normal. So the emphasis is a consequence of arrival — scroll,
 * wait for the document to settle, then mark the card. The caller keeps the
 * navigator's active state pinned for the same interval with `lock`/`release`.
 */
export declare function revealTarget(targetId: string, options?: RevealTargetOptions): Promise<void>;
//#endregion
//# sourceMappingURL=use-flash-target.d.ts.map