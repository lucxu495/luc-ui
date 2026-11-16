"use client";
import { cn } from "../utils/cn.js";
import { jsx } from "react/jsx-runtime";
import { forwardRef } from "react";
import { ArrowDownUpIcon } from "@animateicons/react/lucide/arrow-down-up-icon";
import { ArrowDownIcon } from "@animateicons/react/lucide/arrow-down-icon";
import { MinusIcon } from "@animateicons/react/lucide/minus-icon";
import { ArrowLeftIcon } from "@animateicons/react/lucide/arrow-left-icon";
import { ArrowRightIcon } from "@animateicons/react/lucide/arrow-right-icon";
import { ArrowUpIcon } from "@animateicons/react/lucide/arrow-up-icon";
import { BellIcon } from "@animateicons/react/lucide/bell-icon";
import { BotIcon } from "@animateicons/react/lucide/bot-icon";
import { CalendarIcon } from "@animateicons/react/lucide/calendar-icon";
import { ChartNoAxesCombinedIcon } from "@animateicons/react/lucide/chart-no-axes-combined-icon";
import { CheckIcon } from "@animateicons/react/lucide/check-icon";
import { CheckCheckIcon } from "@animateicons/react/lucide/check-check-icon";
import { ChevronDownIcon } from "@animateicons/react/lucide/chevron-down-icon";
import { ChevronLeftIcon } from "@animateicons/react/lucide/chevron-left-icon";
import { ChevronRightIcon } from "@animateicons/react/lucide/chevron-right-icon";
import { ChevronUpIcon } from "@animateicons/react/lucide/chevron-up-icon";
import { ChevronsLeftIcon } from "@animateicons/react/lucide/chevrons-left-icon";
import { ChevronsRightIcon } from "@animateicons/react/lucide/chevrons-right-icon";
import { CircleAlertIcon } from "@animateicons/react/lucide/circle-alert-icon";
import { CircleCheckIcon } from "@animateicons/react/lucide/circle-check-icon";
import { CircleStopIcon } from "@animateicons/react/lucide/circle-stop-icon";
import { CircleXIcon } from "@animateicons/react/lucide/circle-x-icon";
import { ClockIcon } from "@animateicons/react/lucide/clock-icon";
import { CloudUploadIcon } from "@animateicons/react/lucide/cloud-upload-icon";
import { CodeIcon } from "@animateicons/react/lucide/code-icon";
import { Columns2Icon } from "@animateicons/react/lucide/columns-2-icon";
import { CopyIcon } from "@animateicons/react/lucide/copy-icon";
import { DownloadIcon } from "@animateicons/react/lucide/download-icon";
import { EllipsisIcon } from "@animateicons/react/lucide/ellipsis-icon";
import { ExpandIcon } from "@animateicons/react/lucide/expand-icon";
import { ExternalLinkIcon } from "@animateicons/react/lucide/external-link-icon";
import { EyeIcon } from "@animateicons/react/lucide/eye-icon";
import { EyeOffIcon } from "@animateicons/react/lucide/eye-off-icon";
import { FileIcon } from "@animateicons/react/lucide/file-icon";
import { GripVerticalIcon } from "@animateicons/react/lucide/grip-vertical-icon";
import { InboxIcon } from "@animateicons/react/lucide/inbox-icon";
import { InfoIcon } from "@animateicons/react/lucide/info-icon";
import { LinkIcon } from "@animateicons/react/lucide/link-icon";
import { ListIcon } from "@animateicons/react/lucide/list-icon";
import { ListFilterIcon } from "@animateicons/react/lucide/list-filter-icon";
import { LoaderCircleIcon } from "@animateicons/react/lucide/loader-circle-icon";
import { LockIcon } from "@animateicons/react/lucide/lock-icon";
import { MaximizeIcon } from "@animateicons/react/lucide/maximize-icon";
import { MenuIcon } from "@animateicons/react/lucide/menu-icon";
import { MoonIcon } from "@animateicons/react/lucide/moon-icon";
import { MoveIcon } from "@animateicons/react/lucide/move-icon";
import "@animateicons/react/lucide/panel-left-close-icon";
import "@animateicons/react/lucide/panel-left-open-icon";
import { PauseIcon } from "@animateicons/react/lucide/pause-icon";
import { PinIcon } from "@animateicons/react/lucide/pin-icon";
import { PlayIcon } from "@animateicons/react/lucide/play-icon";
import { PlusIcon } from "@animateicons/react/lucide/plus-icon";
import { RefreshCwIcon } from "@animateicons/react/lucide/refresh-cw-icon";
import { RotateCcwIcon } from "@animateicons/react/lucide/rotate-ccw-icon";
import { SearchIcon } from "@animateicons/react/lucide/search-icon";
import { SendIcon } from "@animateicons/react/lucide/send-icon";
import { SettingsIcon } from "@animateicons/react/lucide/settings-icon";
import { ShrinkIcon } from "@animateicons/react/lucide/shrink-icon";
import { SparklesIcon } from "@animateicons/react/lucide/sparkles-icon";
import { StarIcon } from "@animateicons/react/lucide/star-icon";
import { SunIcon } from "@animateicons/react/lucide/sun-icon";
import { TableIcon } from "@animateicons/react/lucide/table-icon";
import { Trash2Icon } from "@animateicons/react/lucide/trash-2-icon";
import { TriangleAlertIcon } from "@animateicons/react/lucide/triangle-alert-icon";
import { UnfoldVerticalIcon } from "@animateicons/react/lucide/unfold-vertical-icon";
import { UploadIcon } from "@animateicons/react/lucide/upload-icon";
import { UserRoundIcon } from "@animateicons/react/lucide/user-round-icon";
import { WrenchIcon } from "@animateicons/react/lucide/wrench-icon";
import { XIcon } from "@animateicons/react/lucide/x-icon";
import { ZoomInIcon } from "@animateicons/react/lucide/zoom-in-icon";
import { ZoomOutIcon } from "@animateicons/react/lucide/zoom-out-icon";
//#region src/icons/animated.tsx
function animatedGlyph(Icon, label) {
	const Glyph = forwardRef(function AnimatedGlyph({ size, color, className, style, ...props }, ref) {
		return /* @__PURE__ */ jsx("span", {
			ref,
			...props,
			"data-animated-icon": label,
			className: cn("inline-flex shrink-0 items-center justify-center", className),
			style: {
				...style,
				...size !== void 0 ? {
					width: size,
					height: size
				} : {}
			},
			children: /* @__PURE__ */ jsx(Icon, {
				size: 20,
				color: color ?? "currentColor",
				isAnimated: true,
				className: "size-full [&_svg]:size-full"
			})
		});
	});
	Glyph.displayName = `Animated_${label}`;
	return Glyph;
}
const RiAddLine = /* @__PURE__ */ animatedGlyph(PlusIcon, "plus");
const RiAlertFill = /* @__PURE__ */ animatedGlyph(TriangleAlertIcon, "triangle-alert");
const RiAlertLine = /* @__PURE__ */ animatedGlyph(TriangleAlertIcon, "triangle-alert");
const RiArrowDownSLine = /* @__PURE__ */ animatedGlyph(ChevronDownIcon, "chevron-down");
const RiArrowLeftDoubleLine = /* @__PURE__ */ animatedGlyph(ChevronsLeftIcon, "chevrons-left");
const RiArrowLeftLine = /* @__PURE__ */ animatedGlyph(ArrowLeftIcon, "arrow-left");
const RiArrowLeftSLine = /* @__PURE__ */ animatedGlyph(ChevronLeftIcon, "chevron-left");
const RiArrowRightDoubleLine = /* @__PURE__ */ animatedGlyph(ChevronsRightIcon, "chevrons-right");
const RiArrowRightLine = /* @__PURE__ */ animatedGlyph(ArrowRightIcon, "arrow-right");
const RiArrowRightSLine = /* @__PURE__ */ animatedGlyph(ChevronRightIcon, "chevron-right");
const RiArrowUpDownLine = /* @__PURE__ */ animatedGlyph(ArrowDownUpIcon, "arrow-down-up");
const RiArrowUpLine = /* @__PURE__ */ animatedGlyph(ArrowUpIcon, "arrow-up");
const RiArrowUpSLine = /* @__PURE__ */ animatedGlyph(ChevronUpIcon, "chevron-up");
const RiBellLine = /* @__PURE__ */ animatedGlyph(BellIcon, "bell");
const RiCalendarLine = /* @__PURE__ */ animatedGlyph(CalendarIcon, "calendar");
const RiCheckDoubleLine = /* @__PURE__ */ animatedGlyph(CheckCheckIcon, "check-check");
const RiCheckLine = /* @__PURE__ */ animatedGlyph(CheckIcon, "check");
const RiCheckboxCircleFill = /* @__PURE__ */ animatedGlyph(CircleCheckIcon, "circle-check");
const RiCheckboxCircleLine = /* @__PURE__ */ animatedGlyph(CircleCheckIcon, "circle-check");
const RiCloseCircleLine = /* @__PURE__ */ animatedGlyph(CircleXIcon, "circle-x");
const RiCloseLine = /* @__PURE__ */ animatedGlyph(XIcon, "x");
const RiCodeLine = /* @__PURE__ */ animatedGlyph(CodeIcon, "code");
const RiContractLine = /* @__PURE__ */ animatedGlyph(ShrinkIcon, "shrink");
const RiDeleteBinLine = /* @__PURE__ */ animatedGlyph(Trash2Icon, "trash-2");
const RiDownloadLine = /* @__PURE__ */ animatedGlyph(DownloadIcon, "download");
const RiDragMove2Line = /* @__PURE__ */ animatedGlyph(MoveIcon, "move");
const RiDraggable = /* @__PURE__ */ animatedGlyph(GripVerticalIcon, "grip-vertical");
const RiErrorWarningFill = /* @__PURE__ */ animatedGlyph(CircleAlertIcon, "circle-alert");
const RiErrorWarningLine = /* @__PURE__ */ animatedGlyph(CircleAlertIcon, "circle-alert");
const RiExpandDiagonalLine = /* @__PURE__ */ animatedGlyph(ExpandIcon, "expand");
const RiExpandUpDownLine = /* @__PURE__ */ animatedGlyph(UnfoldVerticalIcon, "unfold-vertical");
const RiExternalLinkLine = /* @__PURE__ */ animatedGlyph(ExternalLinkIcon, "external-link");
const RiEyeLine = /* @__PURE__ */ animatedGlyph(EyeIcon, "eye");
const RiEyeOffLine = /* @__PURE__ */ animatedGlyph(EyeOffIcon, "eye-off");
const RiFileCopyLine = /* @__PURE__ */ animatedGlyph(CopyIcon, "copy");
const RiFileLine = /* @__PURE__ */ animatedGlyph(FileIcon, "file");
const RiFilter3Line = /* @__PURE__ */ animatedGlyph(ListFilterIcon, "list-filter");
const RiFullscreenLine = /* @__PURE__ */ animatedGlyph(MaximizeIcon, "maximize");
const RiInboxLine = /* @__PURE__ */ animatedGlyph(InboxIcon, "inbox");
const RiInformationFill = /* @__PURE__ */ animatedGlyph(InfoIcon, "info");
const RiInformationLine = /* @__PURE__ */ animatedGlyph(InfoIcon, "info");
const RiLayoutColumnLine = /* @__PURE__ */ animatedGlyph(Columns2Icon, "columns-2");
const RiLineChartLine = /* @__PURE__ */ animatedGlyph(ChartNoAxesCombinedIcon, "chart-no-axes-combined");
const RiLinkM = /* @__PURE__ */ animatedGlyph(LinkIcon, "link");
const RiListUnordered = /* @__PURE__ */ animatedGlyph(ListIcon, "list");
const RiLoader4Line = /* @__PURE__ */ animatedGlyph(LoaderCircleIcon, "loader-circle");
const RiLoaderLine = /* @__PURE__ */ animatedGlyph(LoaderCircleIcon, "loader-circle");
const RiLockLine = /* @__PURE__ */ animatedGlyph(LockIcon, "lock");
const RiMenuLine = /* @__PURE__ */ animatedGlyph(MenuIcon, "menu");
const RiMoonLine = /* @__PURE__ */ animatedGlyph(MoonIcon, "moon");
const RiMoreLine = /* @__PURE__ */ animatedGlyph(EllipsisIcon, "ellipsis");
const RiPauseLine = /* @__PURE__ */ animatedGlyph(PauseIcon, "pause");
const RiPlayLine = /* @__PURE__ */ animatedGlyph(PlayIcon, "play");
const RiPushpinFill = /* @__PURE__ */ animatedGlyph(PinIcon, "pin");
const RiPushpinLine = /* @__PURE__ */ animatedGlyph(PinIcon, "pin");
const RiRefreshLine = /* @__PURE__ */ animatedGlyph(RefreshCwIcon, "refresh-cw");
const RiRestartLine = /* @__PURE__ */ animatedGlyph(RotateCcwIcon, "rotate-ccw");
const RiRobot2Line = /* @__PURE__ */ animatedGlyph(BotIcon, "bot");
const RiSearchLine = /* @__PURE__ */ animatedGlyph(SearchIcon, "search");
const RiSendPlaneLine = /* @__PURE__ */ animatedGlyph(SendIcon, "send");
const RiSettings3Line = /* @__PURE__ */ animatedGlyph(SettingsIcon, "settings");
const RiSparklingLine = /* @__PURE__ */ animatedGlyph(SparklesIcon, "sparkles");
const RiStarFill = /* @__PURE__ */ animatedGlyph(StarIcon, "star");
const RiStarLine = /* @__PURE__ */ animatedGlyph(StarIcon, "star");
const RiStopCircleLine = /* @__PURE__ */ animatedGlyph(CircleStopIcon, "circle-stop");
const RiSunLine = /* @__PURE__ */ animatedGlyph(SunIcon, "sun");
const RiTableLine = /* @__PURE__ */ animatedGlyph(TableIcon, "table");
const RiTimeLine = /* @__PURE__ */ animatedGlyph(ClockIcon, "clock");
const RiToolsLine = /* @__PURE__ */ animatedGlyph(WrenchIcon, "wrench");
const RiUploadCloud2Line = /* @__PURE__ */ animatedGlyph(CloudUploadIcon, "cloud-upload");
const RiUploadLine = /* @__PURE__ */ animatedGlyph(UploadIcon, "upload");
const RiUserLine = /* @__PURE__ */ animatedGlyph(UserRoundIcon, "user-round");
const RiZoomInLine = /* @__PURE__ */ animatedGlyph(ZoomInIcon, "zoom-in");
const RiZoomOutLine = /* @__PURE__ */ animatedGlyph(ZoomOutIcon, "zoom-out");
const RiArrowDownLine = /* @__PURE__ */ animatedGlyph(ArrowDownIcon, "arrow-down");
const RiMinusLine = /* @__PURE__ */ animatedGlyph(MinusIcon, "minus");
//#endregion
export { RiAddLine, RiAlertFill, RiAlertLine, RiArrowDownLine, RiArrowDownSLine, RiArrowLeftDoubleLine, RiArrowLeftLine, RiArrowLeftSLine, RiArrowRightDoubleLine, RiArrowRightLine, RiArrowRightSLine, RiArrowUpDownLine, RiArrowUpLine, RiArrowUpSLine, RiBellLine, RiCalendarLine, RiCheckDoubleLine, RiCheckLine, RiCheckboxCircleFill, RiCheckboxCircleLine, RiCloseCircleLine, RiCloseLine, RiCodeLine, RiContractLine, RiDeleteBinLine, RiDownloadLine, RiDragMove2Line, RiDraggable, RiErrorWarningFill, RiErrorWarningLine, RiExpandDiagonalLine, RiExpandUpDownLine, RiExternalLinkLine, RiEyeLine, RiEyeOffLine, RiFileCopyLine, RiFileLine, RiFilter3Line, RiFullscreenLine, RiInboxLine, RiInformationFill, RiInformationLine, RiLayoutColumnLine, RiLineChartLine, RiLinkM, RiListUnordered, RiLoader4Line, RiLoaderLine, RiLockLine, RiMenuLine, RiMinusLine, RiMoonLine, RiMoreLine, RiPauseLine, RiPlayLine, RiPushpinFill, RiPushpinLine, RiRefreshLine, RiRestartLine, RiRobot2Line, RiSearchLine, RiSendPlaneLine, RiSettings3Line, RiSparklingLine, RiStarFill, RiStarLine, RiStopCircleLine, RiSunLine, RiTableLine, RiTimeLine, RiToolsLine, RiUploadCloud2Line, RiUploadLine, RiUserLine, RiZoomInLine, RiZoomOutLine };

//# sourceMappingURL=animated.js.map