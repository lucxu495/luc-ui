import { describe, expect, it } from "vitest";
import { formatAbsoluteTime, formatRelativeTime, resolveFreshness } from "./time";

const NOW = new Date("2026-09-26T12:00:00Z");
const ago = (seconds: number) => new Date(NOW.getTime() - seconds * 1000);

describe("formatRelativeTime", () => {
  it("renders a compact short form", () => {
    expect(formatRelativeTime(ago(42), { now: NOW })).toBe("42s ago");
    expect(formatRelativeTime(ago(180), { now: NOW })).toBe("3m ago");
    expect(formatRelativeTime(ago(7200), { now: NOW })).toBe("2h ago");
    expect(formatRelativeTime(ago(172_800), { now: NOW })).toBe("2d ago");
  });

  it("uses the verbose form when asked", () => {
    expect(formatRelativeTime(ago(180), { now: NOW, short: false })).toBe("3 minutes ago");
  });

  it("is stable and guarded", () => {
    expect(formatRelativeTime(null, { now: NOW })).toBe("—");
    expect(formatRelativeTime("not-a-date", { now: NOW })).toBe("—");
  });
});

describe("formatAbsoluteTime", () => {
  it("formats in a fixed time zone", () => {
    expect(formatAbsoluteTime(NOW, { style: "time" })).toBe("12:00 UTC");
    expect(formatAbsoluteTime(NOW, { style: "datetime" })).toBe("Sep 26, 12:00 UTC");
  });
});

describe("resolveFreshness", () => {
  it("applies explicit thresholds", () => {
    expect(resolveFreshness(ago(30), {}, NOW)).toBe("live");
    expect(resolveFreshness(ago(300), {}, NOW)).toBe("fresh");
    expect(resolveFreshness(ago(1800), {}, NOW)).toBe("stale");
    expect(resolveFreshness(ago(7200), {}, NOW)).toBe("expired");
    expect(resolveFreshness(null, {}, NOW)).toBe("expired");
  });

  it("honours custom windows", () => {
    expect(resolveFreshness(ago(300), { freshSeconds: 60, staleSeconds: 600 }, NOW)).toBe("stale");
  });
});
