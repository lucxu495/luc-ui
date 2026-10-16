"use client";

import { createElement } from "react";
import type { RemixiconComponentType } from "@remixicon/react";
import {
  RiAddLine,
  RiAlertLine,
  RiArrowDownSLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiArrowUpLine,
  RiBellLine,
  RiCalendarLine,
  RiCheckLine,
  RiCloseLine,
  RiCodeLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiDraggable,
  RiErrorWarningLine,
  RiExternalLinkLine,
  RiEyeLine,
  RiEyeOffLine,
  RiFileCopyLine,
  RiFilter3Line,
  RiFullscreenLine,
  RiInformationLine,
  RiLineChartLine,
  RiLinkM,
  RiLockLine,
  RiMoonLine,
  RiMoreLine,
  RiPauseLine,
  RiPlayLine,
  RiRefreshLine,
  RiSearchLine,
  RiSettings3Line,
  RiSparklingLine,
  RiStarLine,
  RiSunLine,
  RiTableLine,
  RiTimeLine,
  RiUploadLine,
  RiUserLine,
} from "@remixicon/react";
import { cn } from "../utils/cn";

/**
 * LUC Icon — the library's own icon surface.
 *
 * What existed before this file: forty-six source files inside `@luc/ui`
 * importing `@remixicon/react` directly, and no way for a consumer to draw an
 * icon at the library's size. That is a dependency with no public face. A
 * consumer who wanted an icon matching the ones beside it had two options and
 * both were wrong: install Remix Icon themselves and guess the sizes, or ship an
 * SVG that drifts from everything around it.
 *
 * Three parts, and the boundaries between them matter:
 *
 *  1. **The asset source stays Remix Icon.** Redrawing three thousand glyphs is
 *     not what a design system is for, and a hand-drawn subset would be worse
 *     than the set it replaced. `@luc/ui` already depends on it; this file makes
 *     that dependency *public* rather than hidden.
 *  2. **`Icon` is the wrapper.** It owns size, tone and accessibility — the
 *     three things a caller gets wrong when they use the glyph component
 *     directly, because Remix Icon's own `size` takes a raw pixel number and
 *     knows nothing about `--fg-muted`.
 *  3. **`iconSet` is a named set, with search.** The wrapper makes an icon
 *     addressable by component (`icon={RiPlayLine}`); the set makes the thirty-
 *     nine the library itself draws with addressable by *name* (`name="play"`),
 *     which is what a config, a stored record or a person typing into a search
 *     box needs. It is not a re-export of the whole package, and it says so.
 *
 * Accessibility is derived rather than delegated: an icon with a `label` is an
 * image with that name, and an icon without one is `aria-hidden`, because a
 * glyph sitting next to the word "Close" is decoration and announcing it twice
 * is worse than silence.
 */

/**
 * The glyph type, re-exported from the asset source.
 *
 * Aliased rather than declared so it cannot drift from Remix Icon's real props,
 * and so a consumer writing their own component can check it against the same
 * type instead of guessing. A different icon set renders its own node: this API
 * says "Remix Icon" out loud rather than pretending to be icon-set agnostic.
 */
export type IconGlyph = RemixiconComponentType;

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";
export type IconTone =
  | "inherit"
  | "muted"
  | "secondary"
  | "primary"
  | "accent"
  | "positive"
  | "negative"
  | "warning"
  | "info";

const SIZE_CLASS: Record<IconSize, string> = {
  xs: "[&_svg]:size-3",
  sm: "[&_svg]:size-4",
  md: "[&_svg]:size-[18px]",
  lg: "[&_svg]:size-5",
  xl: "[&_svg]:size-6",
};

const TONE_CLASS: Record<IconTone, string> = {
  inherit: "",
  muted: "text-fg-muted",
  secondary: "text-fg-secondary",
  primary: "text-fg-primary",
  accent: "text-fg-accent",
  positive: "text-fg-positive",
  negative: "text-fg-negative",
  warning: "text-fg-warning",
  info: "text-fg-info",
};

export interface IconProps extends Omit<React.ComponentPropsWithRef<"span">, "children"> {
  /**
   * The glyph: pass the imported component, `icon={RiPlayLine}`. Or address it
   * by name from the curated set, `name="play"`. One of the two is required.
   */
  icon?: IconGlyph;
  /** A name from `iconSet`, for callers that cannot import a component. */
  name?: string;
  size?: IconSize;
  /** Defaults to `inherit`, so an icon inside a Button takes the button's tone. */
  tone?: IconTone;
  /** The icon's own name, for a glyph that carries meaning by itself. */
  label?: string;
  /** Rotate continuously — a refresh in flight, a job still running. */
  spin?: boolean;
}

export function Icon({ className, icon, name, size = "md", tone = "inherit", label, spin, ...props }: IconProps) {
  const glyph = icon ?? (name === undefined ? undefined : iconFor(name));
  if (glyph === undefined) {
    /* Louder and earlier than a bug report: a named icon that is not in the set
     * is a typo, and a typo that renders nothing is invisible until someone
     * notices the page is missing a picture. */
    throw new Error(
      name === undefined
        ? "Icon: pass `icon` (a Remix Icon component) or `name` (see `iconNames`)."
        : `Icon: "${name}" is not in the LUC icon set. See \`iconNames\` for the names that are.`,
    );
  }
  return (
    <span
      data-slot="icon"
      data-name={name}
      {...(label === undefined ? { "aria-hidden": true } : { role: "img", "aria-label": label })}
      className={cn(
        "inline-grid shrink-0 place-items-center",
        SIZE_CLASS[size],
        TONE_CLASS[tone],
        spin === true && "animate-spin motion-reduce:animate-none",
        className,
      )}
      {...props}
    >
      {/*
        * `createElement`, not `<Glyph />`.
        *
        * The glyph is a value resolved at render time — from the `icon` prop or
        * from the named set — and rendering it as JSX reads to `react-hooks`'s
        * static analysis as "a component defined during render", which is a real
        * bug in the case it is looking for and not one here: both sources are
        * module-level components. Creating the element explicitly is the same
        * output with the false positive gone, rather than a disabled rule that
        * would also hide the real thing.
        */}
      {createElement(glyph)}
    </span>
  );
}

/** One glyph in the curated set: a name to address it by, and how to find it. */
export interface IconEntry {
  name: string;
  glyph: IconGlyph;
  /**
   * Extra search terms, lower case, in both languages — a reader may type
   * either one into the search box on `/components/icon`.
   */
  keywords: readonly string[];
}

/**
 * The glyphs the library draws with, addressable by name.
 *
 * Curated rather than generated on purpose. A set mirroring all of Remix Icon
 * would bloat every bundle that imports it and would be a copy of a package
 * rather than an API; this is the set `@luc/ui` itself uses, so `name="close"`
 * and the `RiCloseLine` inside `Alert` are literally the same glyph.
 */
export const iconSet: readonly IconEntry[] = [
  { name: "add", glyph: RiAddLine, keywords: ["plus", "new", "create", "添加", "新建"] },
  { name: "alert", glyph: RiAlertLine, keywords: ["warning", "caution", "警告"] },
  { name: "arrow-down", glyph: RiArrowDownSLine, keywords: ["chevron", "expand", "下"] },
  { name: "arrow-left", glyph: RiArrowLeftLine, keywords: ["back", "previous", "返回"] },
  { name: "arrow-right", glyph: RiArrowRightLine, keywords: ["forward", "next", "下一个"] },
  { name: "arrow-up", glyph: RiArrowUpLine, keywords: ["collapse", "上"] },
  { name: "bell", glyph: RiBellLine, keywords: ["notification", "alert", "unread", "通知"] },
  { name: "calendar", glyph: RiCalendarLine, keywords: ["date", "schedule", "日期"] },
  { name: "chart", glyph: RiLineChartLine, keywords: ["line", "series", "trend", "折线", "图表"] },
  { name: "check", glyph: RiCheckLine, keywords: ["done", "success", "tick", "完成"] },
  { name: "close", glyph: RiCloseLine, keywords: ["x", "dismiss", "cancel", "关闭"] },
  { name: "code", glyph: RiCodeLine, keywords: ["source", "snippet", "代码"] },
  { name: "copy", glyph: RiFileCopyLine, keywords: ["duplicate", "clipboard", "复制"] },
  { name: "delete", glyph: RiDeleteBinLine, keywords: ["trash", "remove", "删除"] },
  { name: "download", glyph: RiDownloadLine, keywords: ["export", "save", "下载"] },
  { name: "drag", glyph: RiDraggable, keywords: ["handle", "reorder", "move", "拖动"] },
  { name: "error", glyph: RiErrorWarningLine, keywords: ["failure", "wrong", "错误"] },
  { name: "external", glyph: RiExternalLinkLine, keywords: ["link", "new tab", "外链"] },
  { name: "eye", glyph: RiEyeLine, keywords: ["show", "reveal", "visible", "显示"] },
  { name: "eye-off", glyph: RiEyeOffLine, keywords: ["hide", "conceal", "隐藏"] },
  { name: "filter", glyph: RiFilter3Line, keywords: ["facet", "narrow", "筛选"] },
  { name: "fullscreen", glyph: RiFullscreenLine, keywords: ["expand", "maximise", "全屏"] },
  { name: "info", glyph: RiInformationLine, keywords: ["hint", "help", "信息"] },
  { name: "link", glyph: RiLinkM, keywords: ["url", "anchor", "链接"] },
  { name: "lock", glyph: RiLockLine, keywords: ["secure", "private", "锁定"] },
  { name: "moon", glyph: RiMoonLine, keywords: ["dark", "theme", "night", "深色"] },
  { name: "more", glyph: RiMoreLine, keywords: ["overflow", "menu", "更多"] },
  { name: "pause", glyph: RiPauseLine, keywords: ["stop", "hold", "暂停"] },
  { name: "play", glyph: RiPlayLine, keywords: ["run", "start", "execute", "运行"] },
  { name: "refresh", glyph: RiRefreshLine, keywords: ["reload", "retry", "sync", "刷新"] },
  { name: "search", glyph: RiSearchLine, keywords: ["find", "query", "magnifier", "搜索"] },
  { name: "settings", glyph: RiSettings3Line, keywords: ["preferences", "config", "gear", "设置"] },
  { name: "sparkle", glyph: RiSparklingLine, keywords: ["ai", "magic", "generate", "智能"] },
  { name: "star", glyph: RiStarLine, keywords: ["favourite", "bookmark", "收藏"] },
  { name: "sun", glyph: RiSunLine, keywords: ["light", "theme", "day", "浅色"] },
  { name: "table", glyph: RiTableLine, keywords: ["grid", "rows", "columns", "表格"] },
  { name: "time", glyph: RiTimeLine, keywords: ["clock", "duration", "时间"] },
  { name: "upload", glyph: RiUploadLine, keywords: ["import", "send", "上传"] },
  { name: "user", glyph: RiUserLine, keywords: ["account", "profile", "person", "用户"] },
];

/** Every name in the set, in the order it is curated in. */
export const iconNames: readonly string[] = iconSet.map((entry) => entry.name);

const ICONS: ReadonlyMap<string, IconGlyph> = new Map(iconSet.map((entry) => [entry.name, entry.glyph]));

/** The glyph for a name, or `undefined` — for a caller resolving a stored value. */
export function iconFor(name: string): IconGlyph | undefined {
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
export function searchIcons(query: string): readonly string[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return iconNames;
  return iconSet
    .filter((entry) => entry.name.includes(needle) || entry.keywords.some((word) => word.includes(needle)))
    .map((entry) => entry.name);
}
