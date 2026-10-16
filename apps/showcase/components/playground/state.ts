"use client";

/*
 * The Playground's editor state.
 *
 * Deliberately tiny, and deliberately local: `useReducer` over a normalized
 * value set, with the spec as the authority on what a legal value is. The URL
 * is not involved. A Playground configuration is a scratch pad, not a
 * shareable document — putting it in the URL would make every keystroke a
 * navigation, and `@luc/ui` already has a documented URL-state layer for the
 * cases where sharing *is* the point.
 */

import { useCallback, useMemo, useReducer, useSyncExternalStore } from "react";
import { defaultsOf, isDirty, normalizeValue, normalizeValues } from "./engine";
import type { ControlValues, PlaygroundSpec } from "./types";

/*
 * WB-005 — the values that follow the reader to the next specimen.
 *
 * A reader who sets Height to 320 on `/charts/line-chart` and then opens
 * `/charts/area-chart` is asking the same question twice. Values a control
 * marks `sticky` are remembered for the session and reapplied to any sibling
 * spec that declares a control of the same name, which is safe because a
 * `sticky` control is by declaration *presentation with one meaning* — never
 * content like a title or a fixture choice.
 *
 * The store is deliberately a module variable rather than `localStorage` and
 * deliberately absent from the URL. A Playground configuration is a scratch
 * pad; the values that are worth sharing are the ones the *page* already
 * exposes as anchors and query parameters (`ADR-011`'s URL-state layer), and
 * putting a slider in the address bar would make every drag a history entry.
 */
const remembered = new Map<string, ControlValues[string]>();
const listeners = new Set<() => void>();
const STORAGE_KEY = "luc-ui:playground";

function subscribeSticky(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * `sessionStorage`, not `localStorage`: the memory is a working session's, and a
 * reviewer who closes the tab is done with it. It is also not the URL — see the
 * note above — but it does have to outlive a *page load*, because a shared link
 * into the Showcase is a full load and a reader who set Dark should not watch it
 * flip back to Light when they open a second chart in a new tab.
 */
const EMPTY: ReadonlyMap<string, ControlValues[string]> = new Map();
let snapshot: ReadonlyMap<string, ControlValues[string]> = EMPTY;
let restored = false;

function restore() {
  if (restored) return;
  restored = true;
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) snapshot = new Map(Object.entries(JSON.parse(raw) as Record<string, ControlValues[string]>));
  } catch {
    /* A blocked or full storage is not a reason to break the panel. */
  }
}

/** A snapshot stable between changes, as `useSyncExternalStore` requires. */
function stickySnapshot(): ReadonlyMap<string, ControlValues[string]> {
  restore();
  return snapshot;
}

/**
 * What the server renders, which is always the empty map.
 *
 * This is what keeps hydration honest: the stored values are applied *after*
 * mount, so the first client render matches the server byte for byte and a
 * reviewer never sees a mismatch in the console.
 */
function serverSnapshot(): ReadonlyMap<string, ControlValues[string]> {
  return EMPTY;
}

function publish(next: Map<string, ControlValues[string]>) {
  snapshot = new Map(next);
  remembered.clear();
  for (const [name, value] of next) remembered.set(name, value);
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(snapshot)));
    } catch {
      /* Ignore: the in-memory value still works for this page. */
    }
  }
  for (const listener of listeners) listener();
}

export function rememberSticky(name: string, value: ControlValues[string] | undefined) {
  if (value === undefined || remembered.get(name) === value) return;
  publish(new Map(remembered).set(name, value));
}

export function forgetSticky(names: readonly string[]) {
  const next = new Map(remembered);
  let changed = false;
  for (const name of names) changed = next.delete(name) || changed;
  if (changed) publish(next);
}

/** The remembered value of one control, or `undefined` when nothing is stored. */
export function stickyValue(name: string): ControlValues[string] | undefined {
  restore();
  return snapshot.get(name);
}

/**
 * The remembered values this spec can use, as a plain object.
 *
 * Exported so the shell can apply the *stage* preferences (theme, width) the
 * same way the panel applies control values: after mount, never during the
 * hydration render.
 */
export function stickyOverrides(
  spec: Pick<PlaygroundSpec, "controls">,
  store: ReadonlyMap<string, ControlValues[string]>,
): ControlValues {
  restore();
  const values: ControlValues = {};
  for (const control of spec.controls) {
    if (!control.sticky) continue;
    const stored = store.get(control.name);
    if (stored !== undefined) values[control.name] = stored;
  }
  return values;
}

/** Subscribe to the sticky store; the value updates after mount, not during it. */
export function useStickyStore(): ReadonlyMap<string, ControlValues[string]> {
  return useSyncExternalStore(subscribeSticky, stickySnapshot, serverSnapshot);
}

interface State {
  values: ControlValues;
  /**
   * The controls this panel has set itself.
   *
   * A remembered value fills in a control the reader has not touched *here*; it
   * must never win over a value they just chose. Keeping the two apart is what
   * makes the remembered set a default rather than an override.
   */
  touched: ReadonlySet<string>;
}

type Action =
  | { type: "set"; name: string; value: unknown }
  | { type: "reset"; values: ControlValues };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "set":
      return {
        values: { ...state.values, [action.name]: action.value as ControlValues[string] },
        touched: new Set(state.touched).add(action.name),
      };
    case "reset":
      return { values: action.values, touched: new Set() };
  }
}

export interface PlaygroundState {
  values: ControlValues;
  dirty: boolean;
  setValue: (name: string, value: unknown) => void;
  reset: () => void;
}

/**
 * `spec` must be stable for the lifetime of the panel — it is a module-level
 * constant in every adapter, which is why this hook does not guard against a
 * changing spec with an effect (an effect would flash the default state).
 */
export function usePlaygroundState(spec: Pick<PlaygroundSpec, "controls">): PlaygroundState {
  /* The panel starts at its documented defaults so the first client render
   * matches the server's; the remembered values are layered on during render,
   * which is also why they can never fight with a value the reader just set. */
  const initial = useMemo(() => defaultsOf(spec), [spec]);
  const [state, dispatch] = useReducer(reducer, { values: initial, touched: new Set<string>() }, (start) => ({
    values: normalizeValues(spec, start.values),
    touched: start.touched,
  }));

  const sticky = useStickyStore();
  const values = useMemo(() => {
    const remembered = stickyOverrides(spec, sticky);
    const inherited: ControlValues = {};
    for (const [name, value] of Object.entries(remembered)) {
      if (!state.touched.has(name)) inherited[name] = value;
    }
    return Object.keys(inherited).length === 0
      ? state.values
      : normalizeValues(spec, { ...state.values, ...inherited });
  }, [spec, state.values, state.touched, sticky]);

  const setValue = useCallback(
    (name: string, value: unknown) => {
      const control = spec.controls.find((candidate) => candidate.name === name);
      const normalized = control ? normalizeValue(control, value) : value;
      dispatch({
        type: "set",
        name,
        value: normalized,
      });
      if (control?.sticky) rememberSticky(name, normalized as ControlValues[string]);
    },
    [spec],
  );

  /*
   * Reset means defaults, including the memory: a reader who presses it expects
   * the page they will open next to be at its default as well, not carrying the
   * value they just discarded.
   */
  const reset = useCallback(() => {
    forgetSticky(spec.controls.filter((control) => control.sticky).map((control) => control.name));
    dispatch({ type: "reset", values: defaultsOf(spec) });
  }, [spec]);

  return {
    values,
    dirty: isDirty(spec, values),
    setValue,
    reset,
  };
}
