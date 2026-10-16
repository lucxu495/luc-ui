"use client";

import { useEffect, useState } from "react";
import { SegmentedControl, SegmentedItem, Tooltip } from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";

type MotionMode = "auto" | "reduced";

// Lets a reviewer flip the reduced-motion path without touching OS settings.
// It writes `data-motion` on <html>, which `useReducedMotion()` honours above
// the system preference.
export function MotionControl() {
  const [mode, setMode] = useState<MotionMode>("auto");
  const { t } = useI18n();

  useEffect(() => {
    if (mode === "reduced") document.documentElement.dataset.motion = "reduced";
    else delete document.documentElement.dataset.motion;
  }, [mode]);

  return (
    <Tooltip side="bottom" content={t(mode === "auto" ? "motion.hintAuto" : "motion.hintReduced")}>
      <SegmentedControl
        size="sm"
        aria-label={t("motion.aria")}
        value={mode}
        onValueChange={(next) => next && setMode(next as MotionMode)}
      >
        <SegmentedItem size="sm" value="auto">
          {t("motion.auto")}
        </SegmentedItem>
        <SegmentedItem size="sm" value="reduced">
          {t("motion.reduced")}
        </SegmentedItem>
      </SegmentedControl>
    </Tooltip>
  );
}
