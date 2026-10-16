import { describe, expect, it } from "vitest";
import { CalendarDate } from "@internationalized/date";
import {
  booleanParam,
  dateOnlyParam,
  enumParam,
  instantParam,
  listParam,
  nullableParam,
  numberParam,
  sortListParam,
  sortParam,
  stringParam,
} from "./codecs";

describe("scalar codecs", () => {
  it("reads and writes a string, rejecting empty and oversized input", () => {
    const codec = stringParam({ maxLength: 8 });
    expect(codec.decode("value")).toBe("value");
    expect(codec.decode("")).toBeUndefined();
    expect(codec.decode(null)).toBeUndefined();
    expect(codec.decode("x".repeat(9))).toBeUndefined();
    expect(codec.encode("value")).toBe("value");
  });

  it("only accepts the two boolean spellings", () => {
    const codec = booleanParam();
    expect(codec.decode("1")).toBe(true);
    expect(codec.decode("false")).toBe(false);
    expect(codec.decode("yes")).toBeUndefined();
    expect(codec.encode(true)).toBe("1");
    expect(codec.encode(false)).toBe("0");
  });

  it("clamps numbers and can require integers", () => {
    const codec = numberParam({ min: 1, max: 10, integer: true });
    expect(codec.decode("5")).toBe(5);
    expect(codec.decode("0")).toBeUndefined();
    expect(codec.decode("11")).toBeUndefined();
    expect(codec.decode("2.5")).toBeUndefined();
    expect(codec.decode("NaN")).toBeUndefined();
  });

  it("only accepts members of an enum", () => {
    const codec = enumParam(["1m", "6m", "1y", "all"] as const);
    expect(codec.decode("1y")).toBe("1y");
    expect(codec.decode("garbage")).toBeUndefined();
  });
});

describe("dateOnlyParam", () => {
  const codec = dateOnlyParam();

  it("round-trips a calendar date without touching a JavaScript Date", () => {
    const value = new CalendarDate(2026, 9, 27);
    expect(codec.encode(value)).toBe("2026-09-27");
    const decoded = codec.decode("2026-09-27");
    expect(decoded?.toString()).toBe("2026-09-27");
    expect(decoded?.day).toBe(27);
    expect(decoded?.month).toBe(9);
  });

  it("rejects malformed and impossible dates", () => {
    expect(codec.decode("2026-9-7")).toBeUndefined();
    expect(codec.decode("banana")).toBeUndefined();
    expect(codec.decode("2026-02-30")).toBeUndefined();
    expect(codec.decode("")).toBeUndefined();
  });

  it("compares by calendar day, not object identity", () => {
    const a = new CalendarDate(2026, 1, 1);
    const b = new CalendarDate(2026, 1, 1);
    expect(codec.equals?.(a, b)).toBe(true);
    expect(a === b).toBe(false);
  });
});

describe("instantParam", () => {
  const codec = instantParam();
  it("speaks ISO-8601 and keeps epoch milliseconds in state", () => {
    const ms = Date.UTC(2026, 5, 20, 12, 0, 0);
    expect(codec.encode(ms)).toBe("2026-06-20T12:00:00.000Z");
    expect(codec.decode("2026-06-20T12:00:00.000Z")).toBe(ms);
    expect(codec.decode("not-a-date")).toBeUndefined();
  });
});

describe("listParam", () => {
  it("splits, trims nothing, and drops duplicates", () => {
    const codec = listParam(stringParam());
    expect(codec.decode("close,sma50,close")).toEqual(["close", "sma50"]);
    expect(codec.encode(["close", "sma50"])).toBe("close,sma50");
  });

  it("honours a maximum item count so a URL cannot grow without bound", () => {
    const codec = listParam(stringParam(), { maxItems: 2 });
    expect(codec.decode("a,b,c,d")).toEqual(["a", "b"]);
    expect(codec.encode(["a", "b", "c"])).toBe("a,b");
  });

  it("returns undefined for an empty list", () => {
    expect(listParam(stringParam()).decode("")).toBeUndefined();
    expect(listParam(stringParam()).decode(",,,")).toBeUndefined();
  });
});

describe("sort codecs", () => {
  it("reads the conventional ascending/descending form", () => {
    expect(sortParam().decode("sharpe")).toEqual({ id: "sharpe", desc: false });
    expect(sortParam().decode("-sharpe")).toEqual({ id: "sharpe", desc: true });
    expect(sortParam().encode({ id: "sharpe", desc: true })).toBe("-sharpe");
    expect(sortParam().decode("has spaces")).toBeUndefined();
  });

  it("keeps the significance order of a multi-sort", () => {
    const codec = sortListParam();
    const decoded = codec.decode("-sharpe,symbol");
    expect(decoded).toEqual([
      { id: "sharpe", desc: true },
      { id: "symbol", desc: false },
    ]);
    expect(codec.encode(decoded!)).toBe("-sharpe,symbol");
  });
});

describe("nullableParam", () => {
  const codec = nullableParam(dateOnlyParam());

  it("reads a missing or empty parameter as null, not as invalid", () => {
    expect(codec.decode(null)).toBeNull();
    expect(codec.decode("")).toBeNull();
    expect(codec.decode("banana")).toBeNull();
    expect(codec.decode("2026-06-20")?.toString()).toBe("2026-06-20");
  });

  it("serializes null to nothing, so an unset optional leaves no stub", () => {
    expect(codec.encode(null)).toBe("");
    expect(codec.encode(new CalendarDate(2026, 6, 20))).toBe("2026-06-20");
  });

  it("compares nulls and values independently", () => {
    expect(codec.equals?.(null, null)).toBe(true);
    expect(codec.equals?.(null, new CalendarDate(2026, 6, 20))).toBe(false);
    expect(codec.equals?.(new CalendarDate(2026, 6, 20), new CalendarDate(2026, 6, 20))).toBe(true);
  });
});
