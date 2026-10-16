import { describe, expect, it, vi } from "vitest";
import {
  INSPECTOR_MAX_WIDTH,
  INSPECTOR_MIN_HEIGHT,
  INSPECTOR_MIN_WIDTH,
  INSPECTOR_SIZE_KEY,
  clampInspectorSize,
  defaultInspectorSize,
  maxInspectorSize,
  openingInspectorSize,
  readInspectorSize,
  resizeInspector,
  storeInspectorSize,
} from "./inspector-size";

/*
 * The expanded inspector's geometry contract.
 *
 * The three rules this pins: the default is viewport-relative (a big display gets
 * a big workspace), a remembered size is clamped against the *current* viewport
 * (so it can never trap the reader), and only two numbers are ever stored.
 */

const LARGE = { width: 2560, height: 1440 };
const LAPTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    raw: map,
  };
}

describe("inspector default size", () => {
  it("scales with the viewport, inside absolute floors and ceilings", () => {
    const large = defaultInspectorSize(LARGE);
    const laptop = defaultInspectorSize(LAPTOP);
    expect(large.width).toBeGreaterThan(laptop.width);
    expect(large.height).toBeGreaterThan(laptop.height);
    expect(laptop.width).toBeGreaterThanOrEqual(INSPECTOR_MIN_WIDTH);
    expect(laptop.height).toBeGreaterThanOrEqual(INSPECTOR_MIN_HEIGHT);
    // A 4K display still gets a workspace, not a field: the ceiling binds first.
    expect(defaultInspectorSize({ width: 5120, height: 2880 })).toEqual({
      width: INSPECTOR_MAX_WIDTH,
      height: 1080,
    });
  });

  it("keeps a margin from the viewport edges on a phone", () => {
    const phone = defaultInspectorSize(PHONE);
    expect(phone.width).toBeLessThanOrEqual(PHONE.width);
    expect(phone.height).toBeLessThanOrEqual(PHONE.height);
    expect(phone.width).toBeGreaterThan(PHONE.width * 0.9);
  });
});

describe("inspector clamping and resize", () => {
  it("clamps a size remembered on a large display into a smaller viewport", () => {
    const max = maxInspectorSize(LAPTOP);
    const clamped = clampInspectorSize({ width: 2200, height: 1300 }, LAPTOP);
    expect(clamped.width).toBeLessThanOrEqual(max.width);
    expect(clamped.height).toBeLessThanOrEqual(max.height);
    // Never smaller than the floor either — and a viewport below the floor wins.
    expect(clampInspectorSize({ width: 10, height: 10 }, LAPTOP)).toEqual({
      width: INSPECTOR_MIN_WIDTH,
      height: INSPECTOR_MIN_HEIGHT,
    });
    const tinyViewport = clampInspectorSize({ width: 900, height: 900 }, { width: 400, height: 300 });
    expect(tinyViewport).toEqual({ width: 400 - 32, height: 300 - 32 });
  });

  it("resizes around the centre, one axis at a time, and stops at the bounds", () => {
    const start = { width: 1000, height: 700 };
    // An edge drag moves both edges, so the width changes by twice the delta.
    expect(resizeInspector(start, { dx: 120, dy: 60, horizontal: true, vertical: true }, LARGE)).toEqual({
      width: 1240,
      height: 820,
    });
    // A corner handle is both axes; a left/right handle never changes height.
    expect(resizeInspector(start, { dx: 50, dy: 90, horizontal: true, vertical: false }, LARGE)).toEqual({
      width: 1100,
      height: 700,
    });
    // Bounds: the ceiling of the viewport, the floor of the design minimum.
    const max = maxInspectorSize(LAPTOP);
    expect(resizeInspector(start, { dx: 5000, dy: 5000, horizontal: true, vertical: true }, LAPTOP)).toEqual(max);
    expect(resizeInspector({ width: 600, height: 400 }, { dx: -5000, dy: -5000, horizontal: true, vertical: true }, LAPTOP)).toEqual({
      width: INSPECTOR_MIN_WIDTH,
      height: INSPECTOR_MIN_HEIGHT,
    });
  });
});

describe("inspector preference", () => {
  it("round-trips two numbers under a versioned key", () => {
    const storage = memoryStorage();
    expect(storeInspectorSize({ width: 1200, height: 800 }, storage)).toBe(true);
    expect(readInspectorSize(storage)).toEqual({ width: 1200, height: 800 });
    expect(storage.raw.get(INSPECTOR_SIZE_KEY)).toBe('{"width":1200,"height":800}');
  });

  it("ignores corrupt, unrelated or storage-less environments", () => {
    expect(readInspectorSize(null)).toBeNull();
    expect(readInspectorSize(memoryStorage({ [INSPECTOR_SIZE_KEY]: "not json" }))).toBeNull();
    expect(readInspectorSize(memoryStorage({ [INSPECTOR_SIZE_KEY]: '{"width":-5}' }))).toBeNull();
    expect(readInspectorSize(memoryStorage({ [INSPECTOR_SIZE_KEY]: '{"width":"1200","height":"800"}' }))).toEqual({
      width: 1200,
      height: 800,
    });
    const throwing = {
      getItem: vi.fn(() => {
        throw new Error("SecurityError");
      }),
      setItem: vi.fn(() => {
        throw new Error("QuotaExceededError");
      }),
    };
    expect(readInspectorSize(throwing)).toBeNull();
    expect(storeInspectorSize({ width: 100, height: 100 }, throwing)).toBe(false);
  });

  it("opens on the remembered size when it fits and on the default when it does not", () => {
    const storage = memoryStorage({ [INSPECTOR_SIZE_KEY]: '{"width":1500,"height":900}' });
    expect(openingInspectorSize(LARGE, storage)).toEqual({ width: 1500, height: 900 });
    // The same preference on a smaller laptop is clamped, not rejected.
    const onLaptop = openingInspectorSize(LAPTOP, storage);
    expect(onLaptop).toEqual(clampInspectorSize({ width: 1500, height: 900 }, LAPTOP));
    expect(openingInspectorSize(LARGE, memoryStorage())).toEqual(defaultInspectorSize(LARGE));
  });
});
