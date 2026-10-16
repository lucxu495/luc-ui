/** Viewports used by the browser QA tiers. */
export const DESKTOP = { width: 1440, height: 1000 };
export const MOBILE = { width: 390, height: 844 };

/** Behaviour groups a caller can select with `--group`. Order is run order. */
export const BEHAVIOUR_GROUPS = [
  "docs",
  "html",
  "primitives",
  "data",
  "forms",
  "charts",
  "application",
  "navigation",
  "motion",
  "spatial",
  "providers",
  "components",
  "experiences",
  "geometry",
];
