"use client";

import { IconButton, PopoverContent, PopoverRoot, PopoverTrigger, Text, cn } from "@luc/ui";
import { RiCheckLine, RiPaletteLine } from "@remixicon/react";
import { PALETTES, PERSONALITIES, SPACES, TYPEFACES } from "@/lib/appearance";
import { useAppearance } from "@/lib/use-appearance";
import { useI18n } from "@/lib/i18n/provider";

/**
 * The Showcase's appearance control: brand palette and type voice.
 *
 * It is deliberately a *product* control, not a demo widget — a reviewer can
 * change the accent and the typeface on any page and every component follows,
 * because the only thing that changed is one attribute on `<html>`.
 */
export function AppearanceControl() {
  const { palette, typeface, personality, space, setPalette, setTypeface, setPersonality, setSpace } = useAppearance();
  const { t, tcs } = useI18n();

  return (
    <PopoverRoot>
      <PopoverTrigger asChild>
        <IconButton
          variant="ghost"
          size="sm"
          label={t("appearance.label")}
          icon={<RiPaletteLine />}
        />
      </PopoverTrigger>
      <PopoverContent width="md" align="end" className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto">
        <Section title={t("appearance.paletteTitle")} hint={t("appearance.paletteHint")}>
          {PALETTES.map((option) => (
            <Option
              key={option.id}
              active={palette === option.id}
              onClick={() => setPalette(option.id)}
              label={option.label}
              note={tcs(option.note)}
            >
              {/*
                The swatch carries the palette it previews, so it always shows
                the *current theme's* variant of that palette. Swapping to light
                mode updates every swatch without a second table of colours.
              */}
              <span
                data-palette={option.id}
                aria-hidden="true"
                className="size-4 shrink-0 rounded-full border border-line-default bg-accent-default"
              />
            </Option>
          ))}
        </Section>

        <Section title={t("appearance.typeTitle")} hint={t("appearance.typeHint")}>
          {TYPEFACES.map((option) => (
            <Option
              key={option.id}
              active={typeface === option.id}
              onClick={() => setTypeface(option.id)}
              label={option.label}
              note={tcs(option.note)}
              className="font-display"
            />
          ))}
        </Section>

        <Section title={t("appearance.personalityTitle")} hint={t("appearance.personalityHint")}>
          {PERSONALITIES.map((option) => (
            <Option
              key={option.id}
              active={personality === option.id}
              onClick={() => setPersonality(option.id)}
              label={option.label}
              note={tcs(option.note)}
              data-appearance-option={`personality:${option.id}`}
            >
              <span
                aria-hidden="true"
                className="size-4 shrink-0 rounded-[6px] border border-line-default bg-surface-interactive"
                style={{ borderRadius: personalityRadius(option.id) }}
              />
            </Option>
          ))}
        </Section>

        {/*
          Spatial depth is a *product* control, not a demo widget: `data-space`
          scales the lift and press tokens for the whole subtree, so an ordinary
          component page answers it just as the foundations page does.
        */}
        <Section title={t("appearance.spaceTitle")} hint={t("appearance.spaceHint")}>
          {SPACES.map((option) => (
            <Option
              key={option.id}
              active={space === option.id}
              onClick={() => setSpace(option.id)}
              label={option.label}
              note={t(`space.${option.id}.note`)}
              data-appearance-option={`space:${option.id}`}
            >
              <span
                aria-hidden="true"
                data-space={option.id}
                className="size-4 shrink-0 rounded-[6px] border border-line-default bg-surface-interactive"
                style={{ boxShadow: `0 calc(var(--spatial-lift) * 2) 0 color-mix(in oklab, var(--line-strong) 60%, transparent)` }}
              />
            </Option>
          ))}
        </Section>
      </PopoverContent>
    </PopoverRoot>
  );
}

/*
 * A personality is a *material*, so its swatch shows the material: the corner
 * radius each preset gives the whole system. It is drawn from the same numbers
 * the token block uses, which is the only honest way to preview it.
 */
function personalityRadius(id: string): string {
  switch (id) {
    case "editorial":
      return "9px";
    case "dense":
      return "3px";
    case "expressive":
      return "14px";
    default:
      return "6px";
  }
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Text variant="micro" tone="muted">
        {title}
      </Text>
      <div className="flex flex-col">{children}</div>
      <Text variant="caption" tone="muted" className="px-2 pt-0.5">
        {hint}
      </Text>
    </div>
  );
}

function Option({
  active,
  onClick,
  label,
  note,
  className,
  children,
  "data-appearance-option": dataAttribute,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  note?: string;
  className?: string;
  children?: React.ReactNode;
  "data-appearance-option"?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      data-appearance-option={dataAttribute}
      className={cn(
        "luc-transition luc-focus flex min-h-8 items-center gap-2 rounded-sm px-2 py-1.5 text-left text-label",
        "text-fg-secondary hover:bg-surface-interactive-hover hover:text-fg-primary",
        active && "bg-surface-selected text-fg-primary",
        className,
      )}
    >
      {children}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{label}</span>
        {note ? <span className="truncate text-micro font-normal text-fg-muted">{note}</span> : null}
      </span>
      {active ? <RiCheckLine aria-hidden="true" className="size-3.5 shrink-0 text-fg-accent" /> : null}
    </button>
  );
}
