"use client";
import { cn } from "../utils/cn.js";
import { jsx } from "react/jsx-runtime";
import { forwardRef } from "react";
import { ArrowDownUpIcon } from "@animateicons/react/lucide/arrow-down-up-icon";
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
import { PanelLeftCloseIcon } from "@animateicons/react/lucide/panel-left-close-icon";
import { PanelLeftOpenIcon } from "@animateicons/react/lucide/panel-left-open-icon";
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
const RiAddLine = animatedGlyph(PlusIcon, "plus");
const RiAlertFill = animatedGlyph(TriangleAlertIcon, "triangle-alert");
const RiAlertLine = animatedGlyph(TriangleAlertIcon, "triangle-alert");
const RiArrowDownSLine = animatedGlyph(ChevronDownIcon, "chevron-down");
const RiArrowLeftDoubleLine = animatedGlyph(ChevronsLeftIcon, "chevrons-left");
const RiArrowLeftLine = animatedGlyph(ArrowLeftIcon, "arrow-left");
const RiArrowLeftSLine = animatedGlyph(ChevronLeftIcon, "chevron-left");
const RiArrowRightDoubleLine = animatedGlyph(ChevronsRightIcon, "chevrons-right");
const RiArrowRightLine = animatedGlyph(ArrowRightIcon, "arrow-right");
const RiArrowRightSLine = animatedGlyph(ChevronRightIcon, "chevron-right");
const RiArrowUpDownLine = animatedGlyph(ArrowDownUpIcon, "arrow-down-up");
const RiArrowUpLine = animatedGlyph(ArrowUpIcon, "arrow-up");
const RiArrowUpSLine = animatedGlyph(ChevronUpIcon, "chevron-up");
const RiBellLine = animatedGlyph(BellIcon, "bell");
const RiCalendarLine = animatedGlyph(CalendarIcon, "calendar");
const RiCheckDoubleLine = animatedGlyph(CheckCheckIcon, "check-check");
const RiCheckLine = animatedGlyph(CheckIcon, "check");
const RiCheckboxCircleFill = animatedGlyph(CircleCheckIcon, "circle-check");
const RiCheckboxCircleLine = animatedGlyph(CircleCheckIcon, "circle-check");
const RiCloseCircleLine = animatedGlyph(CircleXIcon, "circle-x");
const RiCloseLine = animatedGlyph(XIcon, "x");
const RiCodeLine = animatedGlyph(CodeIcon, "code");
const RiContractLine = animatedGlyph(ShrinkIcon, "shrink");
const RiDeleteBinLine = animatedGlyph(Trash2Icon, "trash-2");
const RiDownloadLine = animatedGlyph(DownloadIcon, "download");
const RiDragMove2Line = animatedGlyph(MoveIcon, "move");
const RiDraggable = animatedGlyph(GripVerticalIcon, "grip-vertical");
const RiErrorWarningFill = animatedGlyph(CircleAlertIcon, "circle-alert");
const RiErrorWarningLine = animatedGlyph(CircleAlertIcon, "circle-alert");
const RiExpandDiagonalLine = animatedGlyph(ExpandIcon, "expand");
const RiExpandUpDownLine = animatedGlyph(UnfoldVerticalIcon, "unfold-vertical");
const RiExternalLinkLine = animatedGlyph(ExternalLinkIcon, "external-link");
const RiEyeLine = animatedGlyph(EyeIcon, "eye");
const RiEyeOffLine = animatedGlyph(EyeOffIcon, "eye-off");
const RiFileCopyLine = animatedGlyph(CopyIcon, "copy");
const RiFileLine = animatedGlyph(FileIcon, "file");
const RiFilter3Line = animatedGlyph(ListFilterIcon, "list-filter");
const RiFullscreenLine = animatedGlyph(MaximizeIcon, "maximize");
const RiInboxLine = animatedGlyph(InboxIcon, "inbox");
const RiInformationFill = animatedGlyph(InfoIcon, "info");
const RiInformationLine = animatedGlyph(InfoIcon, "info");
const RiLayoutColumnLine = animatedGlyph(Columns2Icon, "columns-2");
const RiLineChartLine = animatedGlyph(ChartNoAxesCombinedIcon, "chart-no-axes-combined");
const RiLinkM = animatedGlyph(LinkIcon, "link");
const RiListUnordered = animatedGlyph(ListIcon, "list");
const RiLoader4Line = animatedGlyph(LoaderCircleIcon, "loader-circle");
const RiLoaderLine = animatedGlyph(LoaderCircleIcon, "loader-circle");
const RiLockLine = animatedGlyph(LockIcon, "lock");
const RiMenuLine = animatedGlyph(MenuIcon, "menu");
const RiMoonLine = animatedGlyph(MoonIcon, "moon");
const RiMoreLine = animatedGlyph(EllipsisIcon, "ellipsis");
const RiPauseLine = animatedGlyph(PauseIcon, "pause");
const RiPlayLine = animatedGlyph(PlayIcon, "play");
const RiPushpinFill = animatedGlyph(PinIcon, "pin");
const RiPushpinLine = animatedGlyph(PinIcon, "pin");
const RiRefreshLine = animatedGlyph(RefreshCwIcon, "refresh-cw");
const RiRestartLine = animatedGlyph(RotateCcwIcon, "rotate-ccw");
const RiRobot2Line = animatedGlyph(BotIcon, "bot");
const RiSearchLine = animatedGlyph(SearchIcon, "search");
const RiSendPlaneLine = animatedGlyph(SendIcon, "send");
const RiSettings3Line = animatedGlyph(SettingsIcon, "settings");
animatedGlyph(PanelLeftCloseIcon, "panel-left-close");
animatedGlyph(PanelLeftOpenIcon, "panel-left-open");
const RiSparklingLine = animatedGlyph(SparklesIcon, "sparkles");
const RiStarFill = animatedGlyph(StarIcon, "star");
const RiStarLine = animatedGlyph(StarIcon, "star");
const RiStopCircleLine = animatedGlyph(CircleStopIcon, "circle-stop");
const RiSunLine = animatedGlyph(SunIcon, "sun");
const RiTableLine = animatedGlyph(TableIcon, "table");
const RiTimeLine = animatedGlyph(ClockIcon, "clock");
const RiToolsLine = animatedGlyph(WrenchIcon, "wrench");
const RiUploadCloud2Line = animatedGlyph(CloudUploadIcon, "cloud-upload");
const RiUploadLine = animatedGlyph(UploadIcon, "upload");
const RiUserLine = animatedGlyph(UserRoundIcon, "user-round");
const RiZoomInLine = animatedGlyph(ZoomInIcon, "zoom-in");
const RiZoomOutLine = animatedGlyph(ZoomOutIcon, "zoom-out");
//#endregion
export { RiAddLine, RiAlertFill, RiAlertLine, RiArrowDownSLine, RiArrowLeftDoubleLine, RiArrowLeftLine, RiArrowLeftSLine, RiArrowRightDoubleLine, RiArrowRightLine, RiArrowRightSLine, RiArrowUpDownLine, RiArrowUpLine, RiArrowUpSLine, RiBellLine, RiCalendarLine, RiCheckDoubleLine, RiCheckLine, RiCheckboxCircleFill, RiCheckboxCircleLine, RiCloseCircleLine, RiCloseLine, RiCodeLine, RiContractLine, RiDeleteBinLine, RiDownloadLine, RiDragMove2Line, RiDraggable, RiErrorWarningFill, RiErrorWarningLine, RiExpandDiagonalLine, RiExpandUpDownLine, RiExternalLinkLine, RiEyeLine, RiEyeOffLine, RiFileCopyLine, RiFileLine, RiFilter3Line, RiFullscreenLine, RiInboxLine, RiInformationFill, RiInformationLine, RiLayoutColumnLine, RiLineChartLine, RiLinkM, RiListUnordered, RiLoader4Line, RiLoaderLine, RiLockLine, RiMenuLine, RiMoonLine, RiMoreLine, RiPauseLine, RiPlayLine, RiPushpinFill, RiPushpinLine, RiRefreshLine, RiRestartLine, RiRobot2Line, RiSearchLine, RiSendPlaneLine, RiSettings3Line, RiSparklingLine, RiStarFill, RiStarLine, RiStopCircleLine, RiSunLine, RiTableLine, RiTimeLine, RiToolsLine, RiUploadCloud2Line, RiUploadLine, RiUserLine, RiZoomInLine, RiZoomOutLine };

//# sourceMappingURL=animated.js.map