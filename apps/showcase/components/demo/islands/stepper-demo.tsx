"use client";

/*
 * The Stepper specimen that has to run.
 *
 * `onStepSelect` is a function, and a function can neither be printed as JSX by
 * the structured printer nor serialised across the RSC boundary — so the state
 * lives here, which is also exactly the code the reader has to write. The
 * Navigation review found the page's own note promising "a completed step is a
 * real button that reports its index" while the specimen passed no handler at
 * all: every step was a `<span>`, and the note described a behaviour the page did
 * not show. This is that behaviour.
 *
 * The fixture arrives as a prop rather than being imported from this file: an
 * export of a `"use client"` module is a client reference, so the page's static
 * examples could not have read a constant from here.
 */

import { useState } from "react";
import { Card, Stepper } from "@luc/ui";
import type { StepperStep } from "@luc/ui";

export interface StepperDemoProps {
  steps: readonly StepperStep[];
  /** The step the specimen opens on. */
  current?: number;
  /** Show the step number rather than a check once a step is done. */
  showNumbers?: boolean;
  /** `vertical` stacks the same strip as a checklist. */
  orientation?: "horizontal" | "vertical";
}

export function StepperDemo({ steps, current = 2, showNumbers, orientation }: StepperDemoProps) {
  const [active, setActive] = useState(current);
  return (
    /*
     * `overflow-x-auto` on the frame, not on the page.
     *
     * Four steps with labels and descriptions are about 510px wide, so at 390px
     * the row pushed the whole document sideways by 123px — on `/components`,
     * whose catalogue previews this specimen is one of. The stepper is a row by
     * design (that is what a stepper is), so the honest fix is the one the
     * calendar's two-month specimen already uses: the frame scrolls the specimen
     * instead of the reader scrolling the page.
     */
    <Card variant="outline" tabIndex={0} className="luc-focus w-full overflow-x-auto p-5">
      <Stepper
        steps={steps}
        current={active}
        onStepSelect={setActive}
        {...(showNumbers === undefined ? {} : { showNumbers })}
        {...(orientation === undefined ? {} : { orientation })}
      />
    </Card>
  );
}
