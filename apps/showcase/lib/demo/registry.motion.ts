/*
 * The motion demos, in one lookup.
 *
 * Imported by `/motion/[motion]` only. Motion primitives are client components
 * by nature, so these demos are the group that genuinely needs the browser —
 * and each one is required to respect `prefers-reduced-motion`, which is the
 * library's contract rather than the demo's choice.
 */

import { motionFeedbackDemos } from "./motion/feedback";
import { motionSpatialDemos } from "./motion/spatial";
import { motionSurfaceDemos } from "./motion/surfaces";
import { motionTypographyDemos } from "./motion/typography";
import { indexDemos, type DemoSpec } from "./index";

export const motionDemos: readonly DemoSpec[] = [
  ...motionTypographyDemos,
  ...motionSurfaceDemos,
  ...motionSpatialDemos,
  ...motionFeedbackDemos,
];

const byId = indexDemos(motionDemos);

export function motionDemoFor(id: string | undefined): DemoSpec | undefined {
  return id === undefined ? undefined : byId.get(id);
}

export const motionDemoIds: readonly string[] = [...byId.keys()].sort();
