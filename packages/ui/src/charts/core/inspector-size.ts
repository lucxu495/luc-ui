/**
 * The size of the expanded chart inspector, and the reader's remembered
 * preference for it.
 *
 * Three rules, all of them the kind that must not live in a component's head:
 *
 *  1. **The default is viewport-relative, not a pixel size for one laptop.** A
 *     24" display must get a much larger plotting area than a 13" one, so the
 *     default is a fraction of the viewport, clamped by absolute floors and
 *     ceilings.
 *  2. **A remembered size is a preference, never a trap.** It is clamped against
 *     the *current* viewport every time the inspector opens, with a margin, so a
 *     size chosen on a large external monitor can never make the panel
 *     inaccessible on a laptop — and the reader never has to clear storage.
 *  3. **Only the size is remembered.** Versioned key, two numbers, nothing else:
 *     no chart, no range, no series, no data.
 *
 * Everything here is pure so the geometry can be asserted without a browser.
 */

/** Versioned storage key. A future shape gets `v2` rather than a migration. */
export const INSPECTOR_SIZE_KEY = "luc.chartInspector.size.v1";

/** The smallest inspector that is still a workbench rather than a tooltip. */
export const INSPECTOR_MIN_WIDTH = 480;
export const INSPECTOR_MIN_HEIGHT = 320;

/** The share of the viewport the default opens on. */
export const INSPECTOR_DEFAULT_WIDTH_RATIO = 0.88;
export const INSPECTOR_DEFAULT_HEIGHT_RATIO = 0.84;

/** Absolute ceilings, so a 4K display does not stretch a series into a field. */
export const INSPECTOR_MAX_WIDTH = 1800;
export const INSPECTOR_MAX_HEIGHT = 1080;

/** The margin kept between the inspector and the viewport edges. */
export const INSPECTOR_VIEWPORT_GUTTER = 16;

/** Below this viewport width the inspector is a sheet, not a landscape panel. */
export const INSPECTOR_NARROW_VIEWPORT = 768;

export interface InspectorSize {
  width: number;
  height: number;
}

export interface InspectorViewport {
  width: number;
  height: number;
}

function positive(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * The largest inspector the current viewport allows, margins included.
 *
 * A viewport smaller than the floors wins: an inspector that does not fit is
 * worse than one that is smaller than the design minimum, so the floor is
 * dropped rather than letting the panel overflow.
 */
export function maxInspectorSize(
  viewport: InspectorViewport,
  gutter = INSPECTOR_VIEWPORT_GUTTER,
): InspectorSize {
  return {
    width: Math.max(1, Math.round(viewport.width - gutter * 2)),
    height: Math.max(1, Math.round(viewport.height - gutter * 2)),
  };
}

/** The size a fresh inspector opens on for this viewport. */
export function defaultInspectorSize(viewport: InspectorViewport): InspectorSize {
  const max = maxInspectorSize(viewport);
  if (viewport.width < INSPECTOR_NARROW_VIEWPORT) {
    // A phone gets the sheet: nearly the whole viewport, still inside the margin.
    return { width: max.width, height: max.height };
  }
  /*
   * The *default* is restrained by an absolute ceiling as well as the viewport:
   * a 5K display should open on a workspace, not on a 4500px field with a chart
   * adrift in it. The ceiling is a default, not a limit — the reader can still
   * drag the panel larger, up to what the viewport allows.
   */
  const wanted = {
    width: Math.round(viewport.width * INSPECTOR_DEFAULT_WIDTH_RATIO),
    height: Math.round(viewport.height * INSPECTOR_DEFAULT_HEIGHT_RATIO),
  };
  return {
    width: Math.min(wanted.width, INSPECTOR_MAX_WIDTH, max.width),
    height: Math.min(wanted.height, INSPECTOR_MAX_HEIGHT, max.height),
  };
}

/** Clamp any candidate size into what this viewport can actually show. */
export function clampInspectorSize(
  size: Partial<InspectorSize> | null | undefined,
  viewport: InspectorViewport,
  options: { min?: InspectorSize; max?: InspectorSize; gutter?: number } = {},
): InspectorSize {
  const hardMax = maxInspectorSize(viewport, options.gutter);
  const minWidth = Math.min(options.min?.width ?? INSPECTOR_MIN_WIDTH, hardMax.width);
  const minHeight = Math.min(options.min?.height ?? INSPECTOR_MIN_HEIGHT, hardMax.height);
  const width =
    size?.width === undefined ? minWidth : Math.round(Math.min(Math.max(size.width, minWidth), hardMax.width));
  const height =
    size?.height === undefined ? minHeight : Math.round(Math.min(Math.max(size.height, minHeight), hardMax.height));
  return { width, height };
}

/**
 * Apply one resize gesture.
 *
 * The panel is centred, so a drag on an edge moves *both* edges: dragging the
 * left edge by `dx` widens the panel by `2 * -dx` around the same centre. Sizes
 * are clamped per axis, which is also what keeps a drag from inverting the box.
 */
export function resizeInspector(
  from: InspectorSize,
  delta: { dx?: number; dy?: number; horizontal: boolean; vertical: boolean },
  viewport: InspectorViewport,
  options: { min?: InspectorSize; gutter?: number } = {},
): InspectorSize {
  const hardMax = maxInspectorSize(viewport, options.gutter);
  const minWidth = Math.min(options.min?.width ?? INSPECTOR_MIN_WIDTH, hardMax.width);
  const minHeight = Math.min(options.min?.height ?? INSPECTOR_MIN_HEIGHT, hardMax.height);
  const width = delta.horizontal
    ? Math.min(Math.max(from.width + 2 * (delta.dx ?? 0), minWidth), hardMax.width)
    : from.width;
  const height = delta.vertical
    ? Math.min(Math.max(from.height + 2 * (delta.dy ?? 0), minHeight), hardMax.height)
    : from.height;
  return { width: Math.round(width), height: Math.round(height) };
}

/** Read the remembered size. Storage failures (private mode, quota) are not errors. */
export function readInspectorSize(
  storage: Pick<Storage, "getItem"> | null | undefined = safeStorage(),
): InspectorSize | null {
  if (!storage) return null;
  let raw: string | null = null;
  try {
    raw = storage.getItem(INSPECTOR_SIZE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { width?: unknown; height?: unknown };
    const width = positive(parsed?.width);
    const height = positive(parsed?.height);
    return width !== null && height !== null ? { width, height } : null;
  } catch {
    return null;
  }
}

/** Remember the size. Never throws: a preference is not worth a broken dialog. */
export function storeInspectorSize(
  size: InspectorSize,
  storage: Pick<Storage, "setItem"> | null | undefined = safeStorage(),
): boolean {
  if (!storage) return false;
  const width = positive(size.width);
  const height = positive(size.height);
  if (width === null || height === null) return false;
  try {
    storage.setItem(INSPECTOR_SIZE_KEY, JSON.stringify({ width: Math.round(width), height: Math.round(height) }));
    return true;
  } catch {
    return false;
  }
}

/**
 * The size the inspector should open on: the remembered one when it still fits,
 * the viewport default otherwise.
 */
export function openingInspectorSize(
  viewport: InspectorViewport,
  storage?: Pick<Storage, "getItem"> | null,
): InspectorSize {
  const remembered = readInspectorSize(storage === undefined ? safeStorage() : storage);
  return remembered ? clampInspectorSize(remembered, viewport) : defaultInspectorSize(viewport);
}

function safeStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
