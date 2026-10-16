"use client";

import { useCallback, useState } from "react";

/**
 * One state slice that works both controlled and uncontrolled.
 *
 * LUC UI builds every stateful component this way: pass `value` plus
 * `onChange` to own the state outside, or pass `defaultValue` and let the
 * component hold it. `DataTable` uses it for sorting, filters, pagination,
 * selection and column visibility, so a Showcase demo and a server-driven
 * product screen use exactly the same props.
 */
export function useControllableState<T>(options: {
  value?: T;
  defaultValue: T;
  onChange?: (next: T) => void;
}): [T, (next: T | ((current: T) => T)) => void] {
  const { value, defaultValue, onChange } = options;
  const [internal, setInternal] = useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? (value as T) : internal;

  const setValue = useCallback(
    (next: T | ((previous: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (previous: T) => T)(current) : next;
      if (resolved === current) return;
      if (!isControlled) setInternal(resolved);
      onChange?.(resolved);
    },
    [current, isControlled, onChange],
  );

  return [current, setValue];
}
