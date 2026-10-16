"use client";
import { DatePicker } from "../date-picker.js";
import { jsx } from "react/jsx-runtime";
//#region src/datetime/datetime-picker.tsx
/**
* A local date and time: "2026-09-27 09:30", no time zone attached. Two people
* in different zones see the same wall clock, which is exactly what a local
* schedule (a market session, a meeting time) means.
*/
function DateTimePicker({ granularity = "minute", ...props }) {
	return /* @__PURE__ */ jsx(DatePicker, {
		...props,
		granularity
	});
}
function ZonedDateTimePicker({ granularity = "minute", ...props }) {
	return /* @__PURE__ */ jsx(DatePicker, {
		...props,
		granularity
	});
}
//#endregion
export { DateTimePicker, ZonedDateTimePicker };

//# sourceMappingURL=datetime-picker.js.map