"use client";

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

const timers = new WeakMap<Element, ReturnType<typeof setTimeout>>();

function prefersReducedMotion(): boolean {
  if (typeof document !== "undefined") {
    const motion = document.documentElement.dataset.motion;
    if (motion === "reduced") return true;
    if (motion === "full") return false;
  }
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Mark one element, then clear the mark after the beat. */
export function flashElement(element: Element | null, options: FlashTargetOptions = {}): void {
  if (!element) return;
  const { attribute = "data-target-flash", value = "true", durationMs } = options;
  const previous = timers.get(element);
  if (previous) clearTimeout(previous);
  element.setAttribute(attribute, value);
  // Reduced motion gets a shorter, static beat; the CSS is responsible for
  // suppressing the animation itself.
  const hold = durationMs ?? (prefersReducedMotion() ? 650 : 1000);
  timers.set(
    element,
    setTimeout(() => {
      timers.delete(element);
      element.removeAttribute(attribute);
    }, hold),
  );
}

/** Mark the element with this DOM id (no-op when it is not on the page). */
export function flashTarget(targetId: string, options?: FlashTargetOptions): void {
  if (typeof document === "undefined") return;
  flashElement(document.getElementById(targetId), options);
}

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

/** The sticky chrome's own height, so a jump never lands under it. */
function stickyChromeHeight(): number {
  if (typeof window === "undefined") return 64;
  const root = getComputedStyle(document.documentElement);
  const raw = root.getPropertyValue("--shell-topbar-height").trim();
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return 64;
  return raw.endsWith("rem")
    ? value * (Number.parseFloat(root.fontSize) || 16)
    : value;
}

/**
 * Resolve when the document has reached `top` (or the wait gives out).
 *
 * Checking the destination rather than "did the scroll stop" is what makes a
 * smooth jump's emphasis land *on arrival*: an animated scroll passes through
 * every intermediate position, and only the last one is the card the reader was
 * sent to. A page that cannot scroll all the way (a short final card) still
 * resolves — on the timeout, having made all the progress it can.
 */
function settledAt(top: number, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const deadline = performance.now() + timeoutMs;
    const tick = () => {
      if (Math.abs(window.scrollY - top) <= 1 || performance.now() >= deadline) return resolve();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
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
export async function revealTarget(
  targetId: string,
  options: RevealTargetOptions = {},
): Promise<void> {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const element = document.getElementById(targetId);
  if (!element) return;
  const {
    offsetPx = stickyChromeHeight() + 24,
    behavior = "smooth",
    flash = true,
    durationMs,
    settleTimeoutMs = 1400,
  } = options;
  const reduced = prefersReducedMotion();
  const step = reduced ? "auto" : behavior;
  const top = Math.max(
    0,
    element.getBoundingClientRect().top + window.scrollY - offsetPx,
  );
  window.scrollTo({ top, behavior: step });
  // An instant jump has already landed; a smooth one needs the settle signal.
  await (step === "auto" ? Promise.resolve() : settledAt(top, settleTimeoutMs));
  if (!flash) return;
  flashElement(element, { durationMs: durationMs ?? (reduced ? 800 : 1100) });
}
