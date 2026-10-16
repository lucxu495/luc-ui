"use client";

import { Button } from "@luc/ui";
import {
  isPalette,
  isPersonality,
  isTypeface,
  paletteLabel,
  personalityLabel,
  typefaceLabel,
  type Palette,
  type Personality,
  type Typeface,
} from "@/lib/appearance";
import { useAppearance } from "@/lib/use-appearance";
import { useI18n } from "@/lib/i18n/provider";

/**
 * "Use this one" buttons for the Themes page.
 *
 * The page itself is server-rendered and needs no JavaScript: the palette cards
 * are live subtrees, so eleven of the twelve demonstrations work with the app's
 * scripts disabled. These two controls only exist to promote a scoped sample to
 * the document — which is worth separating, because it makes the difference
 * between *scope* and *default* visible.
 */

export function ApplyPalette({ id }: { id: string }) {
  const { palette, setPalette } = useAppearance();
  const { t } = useI18n();
  if (!isPalette(id)) return null;
  return (
    <ApplyButton
      active={palette === id}
      onClick={() => setPalette(id as Palette)}
      noun="palette"
      useLabel={t("appearance.apply", { label: paletteLabel(id) })}
      inUseLabel={t("appearance.inUse")}
    />
  );
}

export function ApplyTypeface({ id }: { id: string }) {
  const { typeface, setTypeface } = useAppearance();
  const { t } = useI18n();
  if (!isTypeface(id)) return null;
  return (
    <ApplyButton
      active={typeface === id}
      onClick={() => setTypeface(id as Typeface)}
      noun="type"
      useLabel={t("appearance.apply", { label: typefaceLabel(id) })}
      inUseLabel={t("appearance.inUse")}
    />
  );
}

export function ApplyPersonality({ id }: { id: string }) {
  const { personality, setPersonality } = useAppearance();
  const { t } = useI18n();
  if (!isPersonality(id)) return null;
  return (
    <ApplyButton
      active={personality === id}
      onClick={() => setPersonality(id as Personality)}
      noun="personality"
      useLabel={t("appearance.apply", { label: personalityLabel(id) })}
      inUseLabel={t("appearance.inUse")}
    />
  );
}

function ApplyButton({
  active,
  onClick,
  noun,
  useLabel,
  inUseLabel,
}: {
  active: boolean;
  onClick: () => void;
  noun: string;
  useLabel: string;
  inUseLabel: string;
}) {
  return (
    <Button
      size="sm"
      variant={active ? "accent" : "ghost"}
      onClick={onClick}
      aria-pressed={active}
      data-appearance-apply={noun}
      className="shrink-0"
    >
      {active ? inUseLabel : useLabel}
    </Button>
  );
}
