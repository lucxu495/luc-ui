"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandMenu,
  CommandSeparator,
  Kbd,
  Text,
  toast,
  useCommandPages,
  useTheme,
} from "@luc/ui";
import {
  RiBarChartBoxLine,
  RiFlashlightLine,
  RiMoonLine,
  RiNotification3Line,
  RiSunLine,
  RiTableLine,
  RiComputerLine,
  RiLayoutLine,
} from "@remixicon/react";
import { featuredEntries, searchDiscovery } from "@/lib/discovery/catalog";
import { kindLabel } from "@/lib/discovery/catalog";
import { kindById } from "@/lib/discovery/taxonomy";
import type { DiscoveryEntry, DiscoveryKind } from "@/lib/discovery/types";
import { useI18n } from "@/lib/i18n/provider";

/**
 * Showcase-only command palette.
 *
 * `@luc/ui` never learns about Next.js routing: the palette is given callbacks
 * and this file supplies them. That is the whole integration story — a product
 * passes its own navigator, its own commands and its own hotkey policy.
 */
export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const pages = useCommandPages();
  const { t, tcs, href } = useI18n();

  /*
   * Results come from the *discovery catalog*, not from the navigation tree.
   *
   * The navigation tree answers "where does this page live"; search answers "what
   * did the reader type", and those are different indexes. The catalog carries the
   * aliases (including Chinese concept words), the kind and the tags, so `表格`,
   * `datagrid` and `data table` all reach the same row — and each result can say
   * what kind of thing it is instead of guessing from the URL prefix.
   *
   * With an empty query the palette offers the eight featured entries rather than
   * four hundred rows: a command palette is a launcher, and a launcher that opens
   * on an unranked list of everything is a directory.
   */
  const results = useMemo(() => {
    const query = pages.search.trim();
    if (!query) return featuredEntries;
    return searchDiscovery(query, 40).map((hit) => hit.entry);
  }, [pages.search]);

  /** Grouped by kind, in the order the catalog lists kinds. */
  const resultGroups = useMemo(() => {
    const groups = new Map<DiscoveryKind, DiscoveryEntry[]>();
    for (const entry of results) {
      const list = groups.get(entry.kind);
      if (list) list.push(entry);
      else groups.set(entry.kind, [entry]);
    }
    return [...groups.entries()];
  }, [results]);

  const close = () => {
    onOpenChange(false);
    pages.reset();
  };

  const go = (target: string) => {
    router.push(href(target));
    close();
  };

  /*
   * Icons follow the *kind*, which is real classification the catalog owns —
   * replacing a heuristic that guessed from the URL prefix, where
   * `/application/navigation` and `/patterns/...` shared an icon because both
   * happened to look like "layout".
   */
  const iconForKind = (kind: DiscoveryKind) => {
    switch (kind) {
      case "chart":
        return <RiBarChartBoxLine />;
      case "component":
        return <RiLayoutLine />;
      case "motion":
        return <RiFlashlightLine />;
      case "block":
      case "experience":
        return <RiComputerLine />;
      default:
        return <RiTableLine />;
    }
  };

  return (
    <CommandMenu
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      label={t("command.label")}
      description={t("command.description")}
      footer={
        <>
          <span className="flex items-center gap-2">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> {t("command.moveHint")}
            <Kbd>↵</Kbd> {t("command.runHint")}
          </span>
          <span className="flex items-center gap-2">
            <Kbd>esc</Kbd> {t("command.closeHint")}
          </span>
        </>
      }
    >
      <Command onKeyDown={pages.onKeyDown}>
        <CommandInput
          placeholder={t("command.placeholder")}
          value={pages.search}
          onValueChange={pages.setSearch}
        />
        <CommandList>
          <CommandEmpty>{t("command.empty", { query: pages.search })}</CommandEmpty>

          {pages.page === undefined ? (
            <>
              {/*
                * One group per kind, so a result list says *what* each hit is.
                * cmdk owns the filtering and the active-item tracking, which is
                * why the grouping is a sequence of `CommandGroup`s rather than a
                * wrapper element around them: an item nested inside an extra
                * `div` is still found by cmdk's queries but its position in the
                * keyboard order stops matching the visual order.
                */}
              {resultGroups.map(([kind, entries]) => (
                <CommandGroup
                  key={kind}
                  heading={tcs(kindById.get(kind)?.label ?? kindLabel(kind))}
                >
                  {entries.map((entry) => (
                    <CommandItem
                      key={entry.id}
                      /*
                       * The searchable value is the string a reader might type,
                       * not the label: identifier, Chinese alias, tags and route
                       * all reach the same row.
                       */
                      value={[entry.title, ...entry.aliases, ...entry.tags, entry.route].join(" ")}
                      icon={iconForKind(entry.kind)}
                      description={entry.route}
                      onSelect={() => go(entry.route)}
                    >
                      {entry.title}
                      {entry.status === "study" ? (
                        <span className="ml-2 text-micro text-fg-muted uppercase">
                          {tcs("Study")}
                        </span>
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
              <CommandSeparator />
              <CommandGroup heading={t("command.jumpTo")}>
                <CommandItem value="charts" icon={<RiBarChartBoxLine />} shortcut="G C" onSelect={() => go("/charts")}>
                  {t("command.chartSystem")}
                </CommandItem>
                <CommandItem value="table" icon={<RiTableLine />} shortcut="G T" onSelect={() => go("/data/table")}>
                  {t("command.dataTable")}
                </CommandItem>
                <CommandItem
                  value="virtual table"
                  icon={<RiTableLine />}
                  onSelect={() => go("/data/table-virtualized")}
                >
                  {t("command.virtualisedTable")}
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading={t("command.settings")}>
                <CommandItem
                  value="switch theme appearance"
                  icon={<RiFlashlightLine />}
                  onSelect={() => pages.push("theme")}
                >
                  {t("command.switchTheme")}
                </CommandItem>
                <CommandItem
                  value="notify toast"
                  icon={<RiNotification3Line />}
                  onSelect={() => {
                    toast.success(t("command.toastTitle"), { description: t("command.toastBody") });
                    close();
                  }}
                >
                  {t("command.testToast")}
                </CommandItem>
              </CommandGroup>
            </>
          ) : null}

          {pages.page === "theme" ? (
            <CommandGroup heading={t("command.theme")}>
              <CommandItem
                value="light"
                icon={<RiSunLine />}
                onSelect={() => {
                  setTheme("light");
                  close();
                }}
              >
                {t("command.light")}
              </CommandItem>
              <CommandItem
                value="dark"
                icon={<RiMoonLine />}
                onSelect={() => {
                  setTheme("dark");
                  close();
                }}
              >
                {t("command.dark")}
              </CommandItem>
              <CommandItem
                value="system"
                icon={<RiComputerLine />}
                onSelect={() => {
                  setTheme("system");
                  close();
                }}
              >
                {t("command.system")}
              </CommandItem>
            </CommandGroup>
          ) : null}
        </CommandList>
        <div className="border-t border-line-subtle px-4 py-2">
          <Text variant="caption" tone="muted">
            {t("command.themeIntent")} <span className="text-fg-secondary">{theme}</span> ·{" "}
            {t("command.painted")}{" "}
            <span className="text-fg-secondary">{resolvedTheme}</span>
          </Text>
        </div>
      </Command>
    </CommandMenu>
  );
}
