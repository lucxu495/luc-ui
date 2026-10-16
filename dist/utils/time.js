//#region src/utils/time.ts
/**
* Time formatting for data UI. Timestamps are always rendered from an explicit
* `now` so output is deterministic in tests and screenshots.
*/
const DIVISIONS = [
	{
		amount: 60,
		unit: "second"
	},
	{
		amount: 60,
		unit: "minute"
	},
	{
		amount: 24,
		unit: "hour"
	},
	{
		amount: 7,
		unit: "day"
	},
	{
		amount: 4.34524,
		unit: "week"
	},
	{
		amount: 12,
		unit: "month"
	},
	{
		amount: Number.POSITIVE_INFINITY,
		unit: "year"
	}
];
function shorten(part) {
	return part.replace(/\bseconds?\b|\bsec\.?/g, "s").replace(/\bminutes?\b|\bmin\.?/g, "m").replace(/\bhours?\b|\bhrs?\.?/g, "h").replace(/\bdays?\b/g, "d").replace(/\bweeks?\b|\bwks?\.?/g, "w").replace(/\bmonths?\b|\bmos?\.?/g, "mo").replace(/\byears?\b|\byrs?\.?/g, "y").replace(/(\d)\s+(s|m|h|d|w|mo|y)\b/g, "$1$2");
}
function formatRelativeTime(value, options = {}) {
	if (value === null || value === void 0) return "—";
	const { locale = "en-US", now = Date.now(), short = true } = options;
	const target = value instanceof Date ? value.getTime() : new Date(value).getTime();
	if (Number.isNaN(target)) return "—";
	const formatter = new Intl.RelativeTimeFormat(locale, {
		numeric: "auto",
		style: short ? "short" : "long"
	});
	let duration = (target - (now instanceof Date ? now.getTime() : now)) / 1e3;
	for (const division of DIVISIONS) {
		if (Math.abs(duration) < division.amount) {
			const rendered = formatter.format(Math.round(duration), division.unit);
			return short ? shorten(rendered) : rendered;
		}
		duration /= division.amount;
	}
	return "—";
}
function formatAbsoluteTime(value, options = {}) {
	if (value === null || value === void 0) return "—";
	const { locale = "en-US", style = "date", timeZone = "UTC" } = options;
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "—";
	if (style === "time") return `${new Intl.DateTimeFormat(locale, {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
		timeZone
	}).format(date)} ${timeZone}`;
	if (style === "datetime") return `${new Intl.DateTimeFormat(locale, {
		month: "short",
		day: "numeric",
		timeZone
	}).format(date)}, ${new Intl.DateTimeFormat(locale, {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
		timeZone
	}).format(date)} ${timeZone}`;
	const sameYear = date.getUTCFullYear() === (/* @__PURE__ */ new Date()).getUTCFullYear();
	return new Intl.DateTimeFormat(locale, {
		month: "short",
		day: "numeric",
		year: sameYear ? void 0 : "numeric",
		timeZone
	}).format(date);
}
function resolveFreshness(updatedAt, { freshSeconds = 300, staleSeconds = 3600 } = {}, now = Date.now()) {
	if (updatedAt === null || updatedAt === void 0) return "expired";
	const target = updatedAt instanceof Date ? updatedAt.getTime() : new Date(updatedAt).getTime();
	if (Number.isNaN(target)) return "expired";
	const ageSeconds = Math.abs((now instanceof Date ? now.getTime() : now) - target) / 1e3;
	if (ageSeconds <= 60) return "live";
	if (ageSeconds <= freshSeconds) return "fresh";
	if (ageSeconds <= staleSeconds) return "stale";
	return "expired";
}
//#endregion
export { formatAbsoluteTime, formatRelativeTime, resolveFreshness };

//# sourceMappingURL=time.js.map