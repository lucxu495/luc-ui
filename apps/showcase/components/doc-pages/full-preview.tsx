"use client";

/*
 * The stage a reference experience is shown in.
 *
 * An experience is a whole website, and the honest way to review one is at the
 * width a browser would give it. Inside the documentation that width does not
 * exist: the app shell's sidebar, the outline rail and the page gutters are all
 * using some of it, so the simulated product is being judged in a room smaller
 * than the one it will live in.
 *
 * The escape hatch is deliberately *not* a scaled screenshot and not a
 * `transform: scale()`. It is the same DOM, moved to the viewport: `position:
 * fixed` on the wrapper changes where the layout is, not which elements exist,
 * so every piece of state a reviewer has set — an opened project, a filtered
 * gallery, a half-written comment — is still there when the preview expands.
 * Re-mounting the tree inside a modal would have thrown all of it away.
 *
 * Because the overlay does cover the page, it behaves like a dialog and says
 * so: `aria-modal`, a focus trap, Escape, a scroll lock that is released on
 * unmount, and focus returned to the control that opened it. The trap is the
 * one piece Radix would have given us for free and is worth the twenty lines —
 * a modal that lets Tab wander into the hidden page behind it is worse than no
 * modal at all.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button, cn } from "@luc/ui";
import { RiCloseLine, RiFullscreenLine } from "@remixicon/react";
import { useI18n } from "@/lib/i18n/provider";

export interface ExperienceStageProps {
  /** Product name, used for the accessible name of the expanded region. */
  product: string;
  children: React.ReactNode;
}

export function ExperienceStage({ product, children }: ExperienceStageProps) {
  const { tcs } = useI18n();
  const [full, setFull] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const headingId = useId();

  const exit = useCallback(() => {
    setFull(false);
    /* Focus follows the reader back to the control, not to the top of the page. */
    requestAnimationFrame(() => toggleRef.current?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    if (!full) return;
    /*
     * The scroll lock is taken on the document element rather than on `body`,
     * and it is released in the cleanup, so an unmount mid-preview cannot leave
     * the whole Showcase unscrollable — which is exactly the failure mode a
     * leaked lock produces and the reason it is written as a cleanup.
     */
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    panelRef.current?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        exit();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable.item(0);
      const last = focusable.item(focusable.length - 1);
      if (!first || !last) return;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.documentElement.style.overflow = previous;
    };
  }, [full, exit]);

  return (
    <div
      ref={panelRef}
      {...(full
        ? {
            role: "dialog" as const,
            "aria-modal": true,
            "aria-labelledby": headingId,
            tabIndex: -1,
          }
        : {})}
      className={cn(
        "flex flex-col overflow-hidden border-line-subtle bg-surface-canvas",
        "rounded-lg border",
        "focus:outline-none",
        /*
         * The site's own measure, raised when it takes the viewport. This is
         * what makes the expanded preview show a wider product rather than the
         * same composition with more room around it.
         */
        full ? "[--experience-max:112rem]" : "[--experience-max:88rem]",
        full && "fixed inset-0 z-[var(--z-modal)] rounded-none border-0",
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line-subtle bg-surface-sunken px-3 py-2">
        <span id={headingId} className="truncate text-caption text-fg-muted">
          {full
            ? tcs("Full-width preview — {product}").replace("{product}", product)
            : tcs("Preview")}
        </span>
        {full ? (
          <Button
            ref={toggleRef}
            variant="ghost"
            size="sm"
            leadingIcon={<RiCloseLine aria-hidden="true" />}
            onClick={exit}
          >
            {tcs("Exit full preview")}
          </Button>
        ) : (
          <Button
            ref={toggleRef}
            variant="ghost"
            size="sm"
            leadingIcon={<RiFullscreenLine aria-hidden="true" />}
            onClick={() => setFull(true)}
          >
            {tcs("Full preview")}
          </Button>
        )}
      </div>
      {/*
       * One mount, two geometries. The wrapper above changes position; this
       * element keeps the same children across the change, which is what
       * preserves the simulated product's state.
       */}
      <div
        data-slot="experience-host"
        className={cn("min-h-0", full ? "flex-1 overflow-y-auto overscroll-contain" : "overflow-hidden")}
      >
        {children}
      </div>
    </div>
  );
}
