"use client";
import { useCallback, useState } from "react";
//#region src/hooks/use-controllable-state.ts
/**
* One state slice that works both controlled and uncontrolled.
*
* LUC UI builds every stateful component this way: pass `value` plus
* `onChange` to own the state outside, or pass `defaultValue` and let the
* component hold it. `DataTable` uses it for sorting, filters, pagination,
* selection and column visibility, so a Showcase demo and a server-driven
* product screen use exactly the same props.
*/
function useControllableState(options) {
	const { value, defaultValue, onChange } = options;
	const [internal, setInternal] = useState(defaultValue);
	const isControlled = value !== void 0;
	const current = isControlled ? value : internal;
	return [current, useCallback((next) => {
		const resolved = typeof next === "function" ? next(current) : next;
		if (resolved === current) return;
		if (!isControlled) setInternal(resolved);
		onChange?.(resolved);
	}, [
		current,
		isControlled,
		onChange
	])];
}
//#endregion
export { useControllableState };

//# sourceMappingURL=use-controllable-state.js.map