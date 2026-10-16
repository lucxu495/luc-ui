"use client";

import { SegmentedControl, SegmentedItem, useTheme, type ThemeMode } from "@luc/ui";
import { RiComputerLine, RiMoonLine, RiSunLine } from "@remixicon/react";
import { useI18n } from "@/lib/i18n/provider";

const options: { value: ThemeMode; labelKey: string; icon: React.ReactNode }[] = [
  { value: "system", labelKey: "theme.system", icon: <RiComputerLine /> },
  { value: "light", labelKey: "theme.light", icon: <RiSunLine /> },
  { value: "dark", labelKey: "theme.dark", icon: <RiMoonLine /> },
];

export function ThemeControl() {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();

  return (
    <SegmentedControl
      size="sm"
      aria-label={t("theme.aria")}
      value={theme}
      onValueChange={(next) => next && setTheme(next as ThemeMode)}
    >
      {options.map((option) => (
        <SegmentedItem
          key={option.value}
          size="sm"
          value={option.value}
          aria-label={t(option.labelKey)}
          className="px-2"
        >
          {option.icon}
        </SegmentedItem>
      ))}
    </SegmentedControl>
  );
}
