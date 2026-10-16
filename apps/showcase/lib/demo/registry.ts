/*
 * The component demos, in one lookup.
 *
 * Imported by the `/components/[component]` route only, so the demo modules
 * reach exactly the pages that show them. A demo is a server-rendered element
 * of real components: the ordinary ones ship no JavaScript at all, and only the
 * interactive islands (`components/demo/islands`) ship a client bundle.
 */

import { actionDemos } from "./components/actions";
import { dataDisplayDemos } from "./components/data-display";
import { experienceDemos } from "./components/experiences";
import { feedbackDemos } from "./components/feedback";
import { formDemos } from "./components/forms";
import { layoutDemos } from "./components/layout";
import { mediaDemos } from "./components/media";
import { navigationDemos } from "./components/navigation";
import { overlayDemos } from "./components/overlays";
import { typographyDemos } from "./components/typography";
import { indexDemos, type DemoSpec } from "./index";

export const componentDemos: readonly DemoSpec[] = [
  ...actionDemos,
  ...formDemos,
  ...layoutDemos,
  ...navigationDemos,
  ...feedbackDemos,
  ...overlayDemos,
  ...dataDisplayDemos,
  ...mediaDemos,
  ...typographyDemos,
  ...experienceDemos,
];

const byId = indexDemos(componentDemos);

export function componentDemoFor(id: string | undefined): DemoSpec | undefined {
  return id === undefined ? undefined : byId.get(id);
}

export const componentDemoIds: readonly string[] = [...byId.keys()].sort();
