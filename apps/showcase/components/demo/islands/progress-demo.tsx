"use client";

/*
 * A progress bar that is actually progressing.
 *
 * The old specimen was one static bar at 62 per cent, which answers "what does
 * it look like" and none of the questions a reader has: does it animate, does it
 * survive being reset, what happens between 0 and 100. The value lives here
 * because a progress bar is a *state* — the caller owns it, and that is the code
 * the reader needs.
 *
 * The step is a timer, not an animation frame: the bar's own width transition
 * does the moving, so the specimen exercises the component rather than a second
 * animation written beside it. Reduced motion is the browser's business (the
 * transition duration is clamped by the base layer), and the data attributes are
 * the same in both modes.
 */

import { useEffect, useRef, useState } from "react";
import { Button, Inline, Progress, Text } from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";

export function ProgressDemo() {
  /* A specimen's own words are still words a reader reads, so they go through
   * the same dictionary the page does — an island is not an excuse to leave the
   * Chinese page in English. */
  const { tcs } = useI18n();
  /* The state is the value itself, so the snippet beside the specimen — which
   * says `useState(62)` — is literally the code that produced it. */
  const [value, setValue] = useState(62);
  const [running, setRunning] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    timer.current = window.setInterval(() => {
      setValue((current) => {
        if (current >= 100) {
          setRunning(false);
          return current;
        }
        return Math.min(100, current + 12);
      });
    }, 700);
    return () => {
      if (timer.current !== null) window.clearInterval(timer.current);
    };
  }, [running]);

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Inline justify="between" className="w-full">
        <Text variant="label" as="p">
          {running
            ? tcs("Ingesting 44 sectors…")
            : value === 100
              ? tcs("Ingest complete")
              : tcs("Ingest paused")}
        </Text>
        <Text variant="caption" tone="muted" as="p" className="luc-numeric">
          {value} %
        </Text>
      </Inline>
      <Progress value={value} aria-label={tcs("Sector ingest")} />
      <Inline gap="sm">
        {value === 100 ? (
          <Button size="sm" variant="secondary" onClick={() => setValue(0)}>
            {tcs("Run again")}
          </Button>
        ) : (
          <Button size="sm" onClick={() => setRunning((current) => !current)}>
            {running ? tcs("Pause") : value === 0 ? tcs("Start ingest") : tcs("Resume")}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => setValue(0)} disabled={value === 0}>
          {tcs("Reset")}
        </Button>
      </Inline>
    </div>
  );
}
