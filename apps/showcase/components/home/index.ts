/*
 * The homepage sections, as a barrel.
 *
 * `app/page.tsx` remains the only place that decides the order and the
 * container; these components are deliberately chrome-free (no `DocPage`, no
 * page header) so the page can compose them, reorder them, or drop one without
 * editing anything in here.
 */

export { HomeHero } from "./hero-section";
export { HomeInstall } from "./install-section";
export { HomeProductStory } from "./product-story-section";
export { HomeResources } from "./resources-section";
export { HomeChartFeature } from "./chart-feature";
export { HomeMotionFeature } from "./motion-feature";
export { HomeClosing } from "./closing-section";
