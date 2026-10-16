"use client";

/*
 * A spinner inside the control that is waiting.
 *
 * The old specimen was a bare centred spinner, which is the shape a spinner
 * almost never has in a product: it appears inside the button the reader just
 * pressed, or at the top of the panel that is loading. So this specimen is a
 * button that really becomes busy — `loading` keeps the label, sets `aria-busy`
 * and blocks a second press — and the spinner inside it passes `label={null}`,
 * because the button is already announcing the wait.
 *
 * That pair is the whole point of the example: one announcement, not two.
 */

import { useState } from "react";
import { Button, Inline, Text } from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";

export function SpinnerDemo() {
  const { tcs } = useI18n();
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");

  const run = () => {
    setState("busy");
    window.setTimeout(() => setState("done"), 1400);
  };

  return (
    <Inline gap="sm" align="center" wrap>
      <Button
        variant="secondary"
        loading={state === "busy"}
        loadingLabel={tcs("Rebalancing")}
        onClick={run}
      >
        {state === "busy" ? tcs("Rebalancing…") : tcs("Rebalance portfolio")}
      </Button>
      <Button variant="primary" loading={state === "busy"} onClick={run} loadingLabel={tcs("Running")}>
        {tcs("Run backtest")}
      </Button>
      <Text variant="caption" tone="muted">
        {state === "done"
          ? tcs("Both buttons reported the same wait once.")
          : tcs("Press one: the spinner replaces the leading edge, the label stays, and the button refuses a second press.")}
      </Text>
    </Inline>
  );
}
