//#region src/hooks/use-controllable-state.d.ts
/**
 * One state slice that works both controlled and uncontrolled.
 *
 * LUC UI builds every stateful component this way: pass `value` plus
 * `onChange` to own the state outside, or pass `defaultValue` and let the
 * component hold it. `DataTable` uses it for sorting, filters, pagination,
 * selection and column visibility, so a Showcase demo and a server-driven
 * product screen use exactly the same props.
 */
export declare function useControllableState<T>(options: {
  value?: T;
  defaultValue: T;
  onChange?: (next: T) => void;
}): [T, (next: T | ((current: T) => T)) => void];
//#endregion
//# sourceMappingURL=use-controllable-state.d.ts.map