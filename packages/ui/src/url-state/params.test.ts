import { describe, expect, it } from "vitest";
import { CalendarDate } from "@internationalized/date";
import { dateOnlyParam, enumParam, listParam, sortListParam, stringParam } from "./codecs";
import {
  decodeParams,
  defaultState,
  encodeParams,
  mergeParams,
  param,
  params,
  patchParams,
  searchToString,
} from "./params";

const viewParams = params({
  range: param(enumParam(["1m", "6m", "1y", "all"] as const), "1y"),
  series: param(listParam(stringParam()), ["close"]),
  from: param(dateOnlyParam(), new CalendarDate(2026, 1, 1)),
  sort: param(sortListParam(), []),
});

describe("decodeParams", () => {
  it("falls back to the defaults for a missing or invalid URL", () => {
    expect(decodeParams("", viewParams)).toEqual({
      range: "1y",
      series: ["close"],
      from: new CalendarDate(2026, 1, 1),
      sort: [],
    });
    expect(decodeParams("?range=garbage&series=&from=banana", viewParams).range).toBe("1y");
    expect(decodeParams("?range=garbage", viewParams).series).toEqual(["close"]);
    expect(decodeParams("?from=banana", viewParams).from.toString()).toBe("2026-01-01");
  });

  it("reads a well-formed URL exactly", () => {
    const state = decodeParams("?range=6m&series=close,sma50&from=2026-03-01&sort=-sharpe,symbol", viewParams);
    expect(state.range).toBe("6m");
    expect(state.series).toEqual(["close", "sma50"]);
    expect(state.from.toString()).toBe("2026-03-01");
    expect(state.sort).toEqual([
      { id: "sharpe", desc: true },
      { id: "symbol", desc: false },
    ]);
  });
});

describe("encodeParams", () => {
  it("omits every value that matches its default", () => {
    expect(encodeParams(defaultState(viewParams), viewParams).toString()).toBe("");
  });

  it("writes in declaration order so a copied link is stable", () => {
    const encoded = encodeParams(
      {
        range: "1m",
        series: ["close", "sma50"],
        from: new CalendarDate(2026, 3, 1),
        sort: [{ id: "sharpe", desc: true }],
      },
      viewParams,
    );
    expect(encoded.toString()).toBe("range=1m&series=close%2Csma50&from=2026-03-01&sort=-sharpe");
  });

  it("never writes an empty stub for a value that serializes to nothing", () => {
    const encoded = encodeParams({ series: [] }, viewParams);
    expect(encoded.has("series")).toBe(false);
  });
});

describe("mergeParams", () => {
  it("leaves parameters owned by another feature alone", () => {
    const merged = mergeParams("?utm_source=docs&range=1m&cursor=2026-06-20", { range: "6m" }, viewParams);
    expect(merged.get("utm_source")).toBe("docs");
    expect(merged.get("range")).toBe("6m");
    // A key this set does not own is untouched, even if it looks like state.
    expect(merged.get("cursor")).toBe("2026-06-20");
  });

  it("drops a parameter that has returned to its default", () => {
    const merged = mergeParams("?range=1m", { range: "1y" }, viewParams);
    expect(merged.has("range")).toBe(false);
  });
});

describe("patchParams", () => {
  it("re-reads the URL instead of trusting stale state", () => {
    const next = patchParams("?range=6m&series=close,sma50", viewParams, { range: "1m" });
    expect(next.get("range")).toBe("1m");
    expect(next.get("series")).toBe("close,sma50");
  });
});

describe("searchToString", () => {
  it("produces a bare empty string for an all-default view", () => {
    expect(searchToString(new URLSearchParams())).toBe("");
    expect(searchToString("a=1")).toBe("?a=1");
  });
});
