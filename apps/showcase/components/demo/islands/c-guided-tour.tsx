"use client";

/*
 * The `GuidedTour` specimen.
 *
 * A tour exists only while it is open, so a static specimen cannot show it: the
 * component has no "closed" rendering at all. This island owns the open state,
 * which is what makes the specimen real — press the button, the tour spotlights
 * live elements, Escape closes it and focus comes back to the trigger.
 *
 * Three things the specimen now proves that the first version did not:
 *
 *   1. a tour longer than two steps, with the step counter the component builds
 *      from `labels.counter`;
 *   2. a *targetless* final step — a summary that is centred rather than pointing
 *      at something, which is the shape a real tour ends on;
 *   3. a step whose `target` resolves to nothing, because that is the failure a
 *      consumer will hit (a selector that moved, an element behind a closed
 *      overlay) and the component's answer is a centred card rather than a crash.
 *
 * The targets are real elements in this specimen, so the measurement path the
 * component uses is exercised rather than mocked.
 */

import { useState } from "react";
import { Button, Card, GuidedTour, Inline, Text } from "@luc/ui";
import type { TourStep } from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";

export type GuidedTourDemoVariant = "full" | "missing" | "targetless";

export function GuidedTourDemo({ variant = "full" }: { variant?: GuidedTourDemoVariant }) {
  const { tcs } = useI18n();
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(false);

  const steps: TourStep[] = [
    {
      id: "runs",
      title: tcs("Runs"),
      description: tcs("Every backtest you have started, newest first."),
      target: "#tour-runs",
    },
    {
      id: "filters",
      title: tcs("Filters"),
      description: tcs("Narrow the list by instrument or by date range."),
      target: "#tour-filters",
      placement: "bottom",
    },
    {
      id: "columns",
      title: tcs("Columns"),
      description: tcs("The table remembers which columns you keep, per user."),
      target: "#tour-columns",
      placement: "right",
    },
    {
      id: "summary",
      title: tcs("That is the run list"),
      description: tcs(
        "Escape closes the tour from anywhere; focus returns to the button you started it from.",
      ),
    },
  ];

  const brokenSteps: TourStep[] = [
    {
      id: "gone",
      title: tcs("This step lost its anchor"),
      description: tcs(
        "The selector no longer resolves, so the card centres itself instead of pointing at nothing.",
      ),
      target: "#tour-does-not-exist",
    },
  ];

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <Card variant="outline" id="tour-runs" className="flex flex-col gap-1 p-4">
        <Text variant="label" as="p">
          {tcs("Runs")}
        </Text>
        <Text variant="caption" tone="muted" as="p">
          {tcs("btc-sma-2026-09 · finished · 4 artifacts")}
        </Text>
      </Card>

      <Inline gap="sm" align="center" wrap>
        <span id="tour-filters" className="rounded-md border border-line-subtle px-2.5 py-1 text-caption text-fg-secondary">
          {tcs("Filter: last 30 days")}
        </span>
        <span id="tour-columns" className="rounded-md border border-line-subtle px-2.5 py-1 text-caption text-fg-secondary">
          {tcs("Columns: 6 of 9")}
        </span>
      </Inline>

      <Inline gap="sm" wrap>
        {variant === "missing" ? (
          <Button size="sm" variant="secondary" onClick={() => setBroken(true)}>
            {tcs("Start a step whose target is gone")}
          </Button>
        ) : variant === "targetless" ? (
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
            {tcs("Start a targetless step")}
          </Button>
        ) : (
          <>
            <Button size="sm" onClick={() => setOpen(true)}>
              {tcs("Start the tour")}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setBroken(true)}>
              {tcs("A step with a missing target")}
            </Button>
          </>
        )}
      </Inline>

      <GuidedTour
        open={open}
        onOpenChange={setOpen}
        steps={variant === "targetless" ? [steps[3]!] : steps}
        labels={{ counter: (index, total) => tcs("Step {index} of {total}").replace("{index}", String(index + 1)).replace("{total}", String(total)) }}
      />
      <GuidedTour open={broken} onOpenChange={setBroken} steps={brokenSteps} />
    </div>
  );
}
