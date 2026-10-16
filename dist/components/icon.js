"use client";
import { cn } from "../utils/cn.js";
import { jsx } from "react/jsx-runtime";
import { createElement } from "react";
import { RiAddLine, RiAlertLine, RiArrowDownSLine, RiArrowLeftLine, RiArrowRightLine, RiArrowUpLine, RiBellLine, RiCalendarLine, RiCheckLine, RiCloseLine, RiCodeLine, RiDeleteBinLine, RiDownloadLine, RiDraggable, RiErrorWarningLine, RiExternalLinkLine, RiEyeLine, RiEyeOffLine, RiFileCopyLine, RiFilter3Line, RiFullscreenLine, RiInformationLine, RiLineChartLine, RiLinkM, RiLockLine, RiMoonLine, RiMoreLine, RiPauseLine, RiPlayLine, RiRefreshLine, RiSearchLine, RiSettings3Line, RiSparklingLine, RiStarLine, RiSunLine, RiTableLine, RiTimeLine, RiUploadLine, RiUserLine } from "@remixicon/react";
//#region src/components/icon.tsx
const SIZE_CLASS = {
	xs: "[&_svg]:size-3",
	sm: "[&_svg]:size-4",
	md: "[&_svg]:size-[18px]",
	lg: "[&_svg]:size-5",
	xl: "[&_svg]:size-6"
};
const TONE_CLASS = {
	inherit: "",
	muted: "text-fg-muted",
	secondary: "text-fg-secondary",
	primary: "text-fg-primary",
	accent: "text-fg-accent",
	positive: "text-fg-positive",
	negative: "text-fg-negative",
	warning: "text-fg-warning",
	info: "text-fg-info"
};
function Icon({ className, icon, name, size = "md", tone = "inherit", label, spin, ...props }) {
	const glyph = icon ?? (name === void 0 ? void 0 : iconFor(name));
	if (glyph === void 0) throw new Error(name === void 0 ? "Icon: pass `icon` (a Remix Icon component) or `name` (see `iconNames`)." : `Icon: "${name}" is not in the LUC icon set. See \`iconNames\` for the names that are.`);
	return /* @__PURE__ */ jsx("span", {
		"data-slot": "icon",
		"data-name": name,
		...label === void 0 ? { "aria-hidden": true } : {
			role: "img",
			"aria-label": label
		},
		className: cn("inline-grid shrink-0 place-items-center", SIZE_CLASS[size], TONE_CLASS[tone], spin === true && "animate-spin motion-reduce:animate-none", className),
		...props,
		children: createElement(glyph)
	});
}
/**
* The glyphs the library draws with, addressable by name.
*
* Curated rather than generated on purpose. A set mirroring all of Remix Icon
* would bloat every bundle that imports it and would be a copy of a package
* rather than an API; this is the set `@luc/ui` itself uses, so `name="close"`
* and the `RiCloseLine` inside `Alert` are literally the same glyph.
*/
const iconSet = [
	{
		name: "add",
		glyph: RiAddLine,
		keywords: [
			"plus",
			"new",
			"create",
			"添加",
			"新建"
		]
	},
	{
		name: "alert",
		glyph: RiAlertLine,
		keywords: [
			"warning",
			"caution",
			"警告"
		]
	},
	{
		name: "arrow-down",
		glyph: RiArrowDownSLine,
		keywords: [
			"chevron",
			"expand",
			"下"
		]
	},
	{
		name: "arrow-left",
		glyph: RiArrowLeftLine,
		keywords: [
			"back",
			"previous",
			"返回"
		]
	},
	{
		name: "arrow-right",
		glyph: RiArrowRightLine,
		keywords: [
			"forward",
			"next",
			"下一个"
		]
	},
	{
		name: "arrow-up",
		glyph: RiArrowUpLine,
		keywords: ["collapse", "上"]
	},
	{
		name: "bell",
		glyph: RiBellLine,
		keywords: [
			"notification",
			"alert",
			"unread",
			"通知"
		]
	},
	{
		name: "calendar",
		glyph: RiCalendarLine,
		keywords: [
			"date",
			"schedule",
			"日期"
		]
	},
	{
		name: "chart",
		glyph: RiLineChartLine,
		keywords: [
			"line",
			"series",
			"trend",
			"折线",
			"图表"
		]
	},
	{
		name: "check",
		glyph: RiCheckLine,
		keywords: [
			"done",
			"success",
			"tick",
			"完成"
		]
	},
	{
		name: "close",
		glyph: RiCloseLine,
		keywords: [
			"x",
			"dismiss",
			"cancel",
			"关闭"
		]
	},
	{
		name: "code",
		glyph: RiCodeLine,
		keywords: [
			"source",
			"snippet",
			"代码"
		]
	},
	{
		name: "copy",
		glyph: RiFileCopyLine,
		keywords: [
			"duplicate",
			"clipboard",
			"复制"
		]
	},
	{
		name: "delete",
		glyph: RiDeleteBinLine,
		keywords: [
			"trash",
			"remove",
			"删除"
		]
	},
	{
		name: "download",
		glyph: RiDownloadLine,
		keywords: [
			"export",
			"save",
			"下载"
		]
	},
	{
		name: "drag",
		glyph: RiDraggable,
		keywords: [
			"handle",
			"reorder",
			"move",
			"拖动"
		]
	},
	{
		name: "error",
		glyph: RiErrorWarningLine,
		keywords: [
			"failure",
			"wrong",
			"错误"
		]
	},
	{
		name: "external",
		glyph: RiExternalLinkLine,
		keywords: [
			"link",
			"new tab",
			"外链"
		]
	},
	{
		name: "eye",
		glyph: RiEyeLine,
		keywords: [
			"show",
			"reveal",
			"visible",
			"显示"
		]
	},
	{
		name: "eye-off",
		glyph: RiEyeOffLine,
		keywords: [
			"hide",
			"conceal",
			"隐藏"
		]
	},
	{
		name: "filter",
		glyph: RiFilter3Line,
		keywords: [
			"facet",
			"narrow",
			"筛选"
		]
	},
	{
		name: "fullscreen",
		glyph: RiFullscreenLine,
		keywords: [
			"expand",
			"maximise",
			"全屏"
		]
	},
	{
		name: "info",
		glyph: RiInformationLine,
		keywords: [
			"hint",
			"help",
			"信息"
		]
	},
	{
		name: "link",
		glyph: RiLinkM,
		keywords: [
			"url",
			"anchor",
			"链接"
		]
	},
	{
		name: "lock",
		glyph: RiLockLine,
		keywords: [
			"secure",
			"private",
			"锁定"
		]
	},
	{
		name: "moon",
		glyph: RiMoonLine,
		keywords: [
			"dark",
			"theme",
			"night",
			"深色"
		]
	},
	{
		name: "more",
		glyph: RiMoreLine,
		keywords: [
			"overflow",
			"menu",
			"更多"
		]
	},
	{
		name: "pause",
		glyph: RiPauseLine,
		keywords: [
			"stop",
			"hold",
			"暂停"
		]
	},
	{
		name: "play",
		glyph: RiPlayLine,
		keywords: [
			"run",
			"start",
			"execute",
			"运行"
		]
	},
	{
		name: "refresh",
		glyph: RiRefreshLine,
		keywords: [
			"reload",
			"retry",
			"sync",
			"刷新"
		]
	},
	{
		name: "search",
		glyph: RiSearchLine,
		keywords: [
			"find",
			"query",
			"magnifier",
			"搜索"
		]
	},
	{
		name: "settings",
		glyph: RiSettings3Line,
		keywords: [
			"preferences",
			"config",
			"gear",
			"设置"
		]
	},
	{
		name: "sparkle",
		glyph: RiSparklingLine,
		keywords: [
			"ai",
			"magic",
			"generate",
			"智能"
		]
	},
	{
		name: "star",
		glyph: RiStarLine,
		keywords: [
			"favourite",
			"bookmark",
			"收藏"
		]
	},
	{
		name: "sun",
		glyph: RiSunLine,
		keywords: [
			"light",
			"theme",
			"day",
			"浅色"
		]
	},
	{
		name: "table",
		glyph: RiTableLine,
		keywords: [
			"grid",
			"rows",
			"columns",
			"表格"
		]
	},
	{
		name: "time",
		glyph: RiTimeLine,
		keywords: [
			"clock",
			"duration",
			"时间"
		]
	},
	{
		name: "upload",
		glyph: RiUploadLine,
		keywords: [
			"import",
			"send",
			"上传"
		]
	},
	{
		name: "user",
		glyph: RiUserLine,
		keywords: [
			"account",
			"profile",
			"person",
			"用户"
		]
	}
];
/** Every name in the set, in the order it is curated in. */
const iconNames = iconSet.map((entry) => entry.name);
const ICONS = new Map(iconSet.map((entry) => [entry.name, entry.glyph]));
/** The glyph for a name, or `undefined` — for a caller resolving a stored value. */
function iconFor(name) {
	return ICONS.get(name);
}
/**
* The names matching a search box's text.
*
* Name and keywords only — no fuzzy matching and no ranking. A thirty-nine item
* list does not need either, and a false positive here is a reader choosing the
* wrong icon. Case-insensitive, substring ("down" finds `download` and
* `arrow-down`), and an empty query returns the whole set in curated order.
*/
function searchIcons(query) {
	const needle = query.trim().toLowerCase();
	if (needle === "") return iconNames;
	return iconSet.filter((entry) => entry.name.includes(needle) || entry.keywords.some((word) => word.includes(needle))).map((entry) => entry.name);
}
//#endregion
export { Icon, iconFor, iconNames, iconSet, searchIcons };

//# sourceMappingURL=icon.js.map