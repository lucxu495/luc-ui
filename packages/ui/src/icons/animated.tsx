"use client";

import { forwardRef, type ComponentType, type HTMLAttributes } from "react";
import { cn } from "../utils/cn";
import { ArrowDownUpIcon as Icon_ArrowDownUp } from "@animateicons/react/lucide/arrow-down-up-icon";
import { ArrowDownIcon as Icon_ArrowDown } from "@animateicons/react/lucide/arrow-down-icon";
import { MinusIcon as Icon_Minus } from "@animateicons/react/lucide/minus-icon";
import { ArrowLeftIcon as Icon_ArrowLeft } from "@animateicons/react/lucide/arrow-left-icon";
import { ArrowRightIcon as Icon_ArrowRight } from "@animateicons/react/lucide/arrow-right-icon";
import { ArrowUpIcon as Icon_ArrowUp } from "@animateicons/react/lucide/arrow-up-icon";
import { BellIcon as Icon_Bell } from "@animateicons/react/lucide/bell-icon";
import { BotIcon as Icon_Bot } from "@animateicons/react/lucide/bot-icon";
import { CalendarIcon as Icon_Calendar } from "@animateicons/react/lucide/calendar-icon";
import { ChartNoAxesCombinedIcon as Icon_ChartNoAxesCombined } from "@animateicons/react/lucide/chart-no-axes-combined-icon";
import { CheckIcon as Icon_Check } from "@animateicons/react/lucide/check-icon";
import { CheckCheckIcon as Icon_CheckCheck } from "@animateicons/react/lucide/check-check-icon";
import { ChevronDownIcon as Icon_ChevronDown } from "@animateicons/react/lucide/chevron-down-icon";
import { ChevronLeftIcon as Icon_ChevronLeft } from "@animateicons/react/lucide/chevron-left-icon";
import { ChevronRightIcon as Icon_ChevronRight } from "@animateicons/react/lucide/chevron-right-icon";
import { ChevronUpIcon as Icon_ChevronUp } from "@animateicons/react/lucide/chevron-up-icon";
import { ChevronsLeftIcon as Icon_ChevronsLeft } from "@animateicons/react/lucide/chevrons-left-icon";
import { ChevronsRightIcon as Icon_ChevronsRight } from "@animateicons/react/lucide/chevrons-right-icon";
import { CircleAlertIcon as Icon_CircleAlert } from "@animateicons/react/lucide/circle-alert-icon";
import { CircleCheckIcon as Icon_CircleCheck } from "@animateicons/react/lucide/circle-check-icon";
import { CircleStopIcon as Icon_CircleStop } from "@animateicons/react/lucide/circle-stop-icon";
import { CircleXIcon as Icon_CircleX } from "@animateicons/react/lucide/circle-x-icon";
import { ClockIcon as Icon_Clock } from "@animateicons/react/lucide/clock-icon";
import { CloudUploadIcon as Icon_CloudUpload } from "@animateicons/react/lucide/cloud-upload-icon";
import { CodeIcon as Icon_Code } from "@animateicons/react/lucide/code-icon";
import { Columns2Icon as Icon_Columns2 } from "@animateicons/react/lucide/columns-2-icon";
import { CopyIcon as Icon_Copy } from "@animateicons/react/lucide/copy-icon";
import { DownloadIcon as Icon_Download } from "@animateicons/react/lucide/download-icon";
import { EllipsisIcon as Icon_Ellipsis } from "@animateicons/react/lucide/ellipsis-icon";
import { ExpandIcon as Icon_Expand } from "@animateicons/react/lucide/expand-icon";
import { ExternalLinkIcon as Icon_ExternalLink } from "@animateicons/react/lucide/external-link-icon";
import { EyeIcon as Icon_Eye } from "@animateicons/react/lucide/eye-icon";
import { EyeOffIcon as Icon_EyeOff } from "@animateicons/react/lucide/eye-off-icon";
import { FileIcon as Icon_File } from "@animateicons/react/lucide/file-icon";
import { GripVerticalIcon as Icon_GripVertical } from "@animateicons/react/lucide/grip-vertical-icon";
import { InboxIcon as Icon_Inbox } from "@animateicons/react/lucide/inbox-icon";
import { InfoIcon as Icon_Info } from "@animateicons/react/lucide/info-icon";
import { LinkIcon as Icon_Link } from "@animateicons/react/lucide/link-icon";
import { ListIcon as Icon_List } from "@animateicons/react/lucide/list-icon";
import { ListFilterIcon as Icon_ListFilter } from "@animateicons/react/lucide/list-filter-icon";
import { LoaderCircleIcon as Icon_LoaderCircle } from "@animateicons/react/lucide/loader-circle-icon";
import { LockIcon as Icon_Lock } from "@animateicons/react/lucide/lock-icon";
import { MaximizeIcon as Icon_Maximize } from "@animateicons/react/lucide/maximize-icon";
import { MenuIcon as Icon_Menu } from "@animateicons/react/lucide/menu-icon";
import { MoonIcon as Icon_Moon } from "@animateicons/react/lucide/moon-icon";
import { MoveIcon as Icon_Move } from "@animateicons/react/lucide/move-icon";
import { PanelLeftCloseIcon as Icon_PanelLeftClose } from "@animateicons/react/lucide/panel-left-close-icon";
import { PanelLeftOpenIcon as Icon_PanelLeftOpen } from "@animateicons/react/lucide/panel-left-open-icon";
import { PauseIcon as Icon_Pause } from "@animateicons/react/lucide/pause-icon";
import { PinIcon as Icon_Pin } from "@animateicons/react/lucide/pin-icon";
import { PlayIcon as Icon_Play } from "@animateicons/react/lucide/play-icon";
import { PlusIcon as Icon_Plus } from "@animateicons/react/lucide/plus-icon";
import { RefreshCwIcon as Icon_RefreshCw } from "@animateicons/react/lucide/refresh-cw-icon";
import { RotateCcwIcon as Icon_RotateCcw } from "@animateicons/react/lucide/rotate-ccw-icon";
import { SearchIcon as Icon_Search } from "@animateicons/react/lucide/search-icon";
import { SendIcon as Icon_Send } from "@animateicons/react/lucide/send-icon";
import { SettingsIcon as Icon_Settings } from "@animateicons/react/lucide/settings-icon";
import { ShrinkIcon as Icon_Shrink } from "@animateicons/react/lucide/shrink-icon";
import { SparklesIcon as Icon_Sparkles } from "@animateicons/react/lucide/sparkles-icon";
import { StarIcon as Icon_Star } from "@animateicons/react/lucide/star-icon";
import { SunIcon as Icon_Sun } from "@animateicons/react/lucide/sun-icon";
import { TableIcon as Icon_Table } from "@animateicons/react/lucide/table-icon";
import { Trash2Icon as Icon_Trash2 } from "@animateicons/react/lucide/trash-2-icon";
import { TriangleAlertIcon as Icon_TriangleAlert } from "@animateicons/react/lucide/triangle-alert-icon";
import { UnfoldVerticalIcon as Icon_UnfoldVertical } from "@animateicons/react/lucide/unfold-vertical-icon";
import { UploadIcon as Icon_Upload } from "@animateicons/react/lucide/upload-icon";
import { UserRoundIcon as Icon_UserRound } from "@animateicons/react/lucide/user-round-icon";
import { WrenchIcon as Icon_Wrench } from "@animateicons/react/lucide/wrench-icon";
import { XIcon as Icon_X } from "@animateicons/react/lucide/x-icon";
import { ZoomInIcon as Icon_ZoomIn } from "@animateicons/react/lucide/zoom-in-icon";
import { ZoomOutIcon as Icon_ZoomOut } from "@animateicons/react/lucide/zoom-out-icon";

// All Luc UI components now use the actual AnimateIcons animated React SVGs.
// Keep the old Ri* symbols as an internal compatibility layer so calling
// components never silently switch to static SVG icons or break accessibility.
// The consumer can still inject a custom glyph through <Icon icon={...}>.
export type AnimatedIconProps = Omit<HTMLAttributes<HTMLSpanElement>, "color"> & {
  size?: string | number;
  color?: string;
};
export type AnimatedIconComponentType = ComponentType<AnimatedIconProps>;

type AnimatedSource = ComponentType<{
  size?: number;
  color?: string;
  className?: string;
  isAnimated?: boolean;
}>;

function animatedGlyph(Icon: AnimatedSource, label: string): AnimatedIconComponentType {
  const Glyph = forwardRef<HTMLSpanElement, AnimatedIconProps>(function AnimatedGlyph(
    { size, color, className, style, ...props }, ref,
  ) {
    return (
      <span ref={ref} {...props}
        data-animated-icon={label}
        className={cn("inline-flex shrink-0 items-center justify-center", className)}
        style={{ ...style, ...(size !== undefined ? { width: size, height: size } : {}) }}>
        <Icon size={20} color={color ?? "currentColor"} isAnimated
          className="size-full [&_svg]:size-full" />
      </span>
    );
  });
  Glyph.displayName = `Animated_${label}`;
  return Glyph;
}
export const RiAddLine = /* @__PURE__ */ animatedGlyph(Icon_Plus, "plus");
export const RiAlertFill = /* @__PURE__ */ animatedGlyph(Icon_TriangleAlert, "triangle-alert");
export const RiAlertLine = /* @__PURE__ */ animatedGlyph(Icon_TriangleAlert, "triangle-alert");
export const RiArrowDownSLine = /* @__PURE__ */ animatedGlyph(Icon_ChevronDown, "chevron-down");
export const RiArrowLeftDoubleLine = /* @__PURE__ */ animatedGlyph(Icon_ChevronsLeft, "chevrons-left");
export const RiArrowLeftLine = /* @__PURE__ */ animatedGlyph(Icon_ArrowLeft, "arrow-left");
export const RiArrowLeftSLine = /* @__PURE__ */ animatedGlyph(Icon_ChevronLeft, "chevron-left");
export const RiArrowRightDoubleLine = /* @__PURE__ */ animatedGlyph(Icon_ChevronsRight, "chevrons-right");
export const RiArrowRightLine = /* @__PURE__ */ animatedGlyph(Icon_ArrowRight, "arrow-right");
export const RiArrowRightSLine = /* @__PURE__ */ animatedGlyph(Icon_ChevronRight, "chevron-right");
export const RiArrowUpDownLine = /* @__PURE__ */ animatedGlyph(Icon_ArrowDownUp, "arrow-down-up");
export const RiArrowUpLine = /* @__PURE__ */ animatedGlyph(Icon_ArrowUp, "arrow-up");
export const RiArrowUpSLine = /* @__PURE__ */ animatedGlyph(Icon_ChevronUp, "chevron-up");
export const RiBellLine = /* @__PURE__ */ animatedGlyph(Icon_Bell, "bell");
export const RiCalendarLine = /* @__PURE__ */ animatedGlyph(Icon_Calendar, "calendar");
export const RiCheckDoubleLine = /* @__PURE__ */ animatedGlyph(Icon_CheckCheck, "check-check");
export const RiCheckLine = /* @__PURE__ */ animatedGlyph(Icon_Check, "check");
export const RiCheckboxCircleFill = /* @__PURE__ */ animatedGlyph(Icon_CircleCheck, "circle-check");
export const RiCheckboxCircleLine = /* @__PURE__ */ animatedGlyph(Icon_CircleCheck, "circle-check");
export const RiCloseCircleLine = /* @__PURE__ */ animatedGlyph(Icon_CircleX, "circle-x");
export const RiCloseLine = /* @__PURE__ */ animatedGlyph(Icon_X, "x");
export const RiCodeLine = /* @__PURE__ */ animatedGlyph(Icon_Code, "code");
export const RiContractLine = /* @__PURE__ */ animatedGlyph(Icon_Shrink, "shrink");
export const RiDeleteBinLine = /* @__PURE__ */ animatedGlyph(Icon_Trash2, "trash-2");
export const RiDownloadLine = /* @__PURE__ */ animatedGlyph(Icon_Download, "download");
export const RiDragMove2Line = /* @__PURE__ */ animatedGlyph(Icon_Move, "move");
export const RiDraggable = /* @__PURE__ */ animatedGlyph(Icon_GripVertical, "grip-vertical");
export const RiErrorWarningFill = /* @__PURE__ */ animatedGlyph(Icon_CircleAlert, "circle-alert");
export const RiErrorWarningLine = /* @__PURE__ */ animatedGlyph(Icon_CircleAlert, "circle-alert");
export const RiExpandDiagonalLine = /* @__PURE__ */ animatedGlyph(Icon_Expand, "expand");
export const RiExpandUpDownLine = /* @__PURE__ */ animatedGlyph(Icon_UnfoldVertical, "unfold-vertical");
export const RiExternalLinkLine = /* @__PURE__ */ animatedGlyph(Icon_ExternalLink, "external-link");
export const RiEyeLine = /* @__PURE__ */ animatedGlyph(Icon_Eye, "eye");
export const RiEyeOffLine = /* @__PURE__ */ animatedGlyph(Icon_EyeOff, "eye-off");
export const RiFileCopyLine = /* @__PURE__ */ animatedGlyph(Icon_Copy, "copy");
export const RiFileLine = /* @__PURE__ */ animatedGlyph(Icon_File, "file");
export const RiFilter3Line = /* @__PURE__ */ animatedGlyph(Icon_ListFilter, "list-filter");
export const RiFullscreenLine = /* @__PURE__ */ animatedGlyph(Icon_Maximize, "maximize");
export const RiInboxLine = /* @__PURE__ */ animatedGlyph(Icon_Inbox, "inbox");
export const RiInformationFill = /* @__PURE__ */ animatedGlyph(Icon_Info, "info");
export const RiInformationLine = /* @__PURE__ */ animatedGlyph(Icon_Info, "info");
export const RiLayoutColumnLine = /* @__PURE__ */ animatedGlyph(Icon_Columns2, "columns-2");
export const RiLineChartLine = /* @__PURE__ */ animatedGlyph(Icon_ChartNoAxesCombined, "chart-no-axes-combined");
export const RiLinkM = /* @__PURE__ */ animatedGlyph(Icon_Link, "link");
export const RiListUnordered = /* @__PURE__ */ animatedGlyph(Icon_List, "list");
export const RiLoader4Line = /* @__PURE__ */ animatedGlyph(Icon_LoaderCircle, "loader-circle");
export const RiLoaderLine = /* @__PURE__ */ animatedGlyph(Icon_LoaderCircle, "loader-circle");
export const RiLockLine = /* @__PURE__ */ animatedGlyph(Icon_Lock, "lock");
export const RiMenuLine = /* @__PURE__ */ animatedGlyph(Icon_Menu, "menu");
export const RiMoonLine = /* @__PURE__ */ animatedGlyph(Icon_Moon, "moon");
export const RiMoreLine = /* @__PURE__ */ animatedGlyph(Icon_Ellipsis, "ellipsis");
export const RiPauseLine = /* @__PURE__ */ animatedGlyph(Icon_Pause, "pause");
export const RiPlayLine = /* @__PURE__ */ animatedGlyph(Icon_Play, "play");
export const RiPushpinFill = /* @__PURE__ */ animatedGlyph(Icon_Pin, "pin");
export const RiPushpinLine = /* @__PURE__ */ animatedGlyph(Icon_Pin, "pin");
export const RiRefreshLine = /* @__PURE__ */ animatedGlyph(Icon_RefreshCw, "refresh-cw");
export const RiRestartLine = /* @__PURE__ */ animatedGlyph(Icon_RotateCcw, "rotate-ccw");
export const RiRobot2Line = /* @__PURE__ */ animatedGlyph(Icon_Bot, "bot");
export const RiSearchLine = /* @__PURE__ */ animatedGlyph(Icon_Search, "search");
export const RiSendPlaneLine = /* @__PURE__ */ animatedGlyph(Icon_Send, "send");
export const RiSettings3Line = /* @__PURE__ */ animatedGlyph(Icon_Settings, "settings");
export const RiSidebarFoldLine = /* @__PURE__ */ animatedGlyph(Icon_PanelLeftClose, "panel-left-close");
export const RiSidebarUnfoldLine = /* @__PURE__ */ animatedGlyph(Icon_PanelLeftOpen, "panel-left-open");
export const RiSparklingLine = /* @__PURE__ */ animatedGlyph(Icon_Sparkles, "sparkles");
export const RiStarFill = /* @__PURE__ */ animatedGlyph(Icon_Star, "star");
export const RiStarLine = /* @__PURE__ */ animatedGlyph(Icon_Star, "star");
export const RiStopCircleLine = /* @__PURE__ */ animatedGlyph(Icon_CircleStop, "circle-stop");
export const RiSunLine = /* @__PURE__ */ animatedGlyph(Icon_Sun, "sun");
export const RiTableLine = /* @__PURE__ */ animatedGlyph(Icon_Table, "table");
export const RiTimeLine = /* @__PURE__ */ animatedGlyph(Icon_Clock, "clock");
export const RiToolsLine = /* @__PURE__ */ animatedGlyph(Icon_Wrench, "wrench");
export const RiUploadCloud2Line = /* @__PURE__ */ animatedGlyph(Icon_CloudUpload, "cloud-upload");
export const RiUploadLine = /* @__PURE__ */ animatedGlyph(Icon_Upload, "upload");
export const RiUserLine = /* @__PURE__ */ animatedGlyph(Icon_UserRound, "user-round");
export const RiZoomInLine = /* @__PURE__ */ animatedGlyph(Icon_ZoomIn, "zoom-in");
export const RiZoomOutLine = /* @__PURE__ */ animatedGlyph(Icon_ZoomOut, "zoom-out");

export const RiArrowDownLine = /* @__PURE__ */ animatedGlyph(Icon_ArrowDown, "arrow-down");
export const RiMinusLine = /* @__PURE__ */ animatedGlyph(Icon_Minus, "minus");
