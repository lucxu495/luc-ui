"use client";

/*
 * Theme Studio.
 *
 * Four attributes decide the whole look, so the Studio is four choosers with a
 * live subtree beside them and the exact `<html>` line underneath. The preview
 * applies the attributes to a `div`, which is the point: a theme is not global
 * state, it is an attribute that any subtree can carry.
 */

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Heading,
  Inline,
  Input,
  Panel,
  Section,
  SegmentedControl,
  SegmentedItem,
  Stack,
  Text,
} from "@luc/ui";
import { CopyButton } from "@/components/docs/copy-button";
import { useI18n } from "@/lib/i18n/provider";
import { PALETTES, PERSONALITIES, SPACES, TYPEFACES } from "@/lib/appearance";
import {
  DEFAULT_THEME,
  THEME_CHOICES,
  themeAttributeString,
  themeAttributes,
  type ThemeSelection,
} from "@/lib/studios/theme";

export function ThemeStudio() {
  const { tcs } = useI18n();
  const [selection, setSelection] = useState<ThemeSelection>(DEFAULT_THEME);
  const attributes = themeAttributes(selection);

  return (
    <Stack gap="lg">
      <Panel tone="sunken">
        <Stack gap="md" className="p-4">
          <Inline justify="between" align="center">
            <Text variant="label" as="span">
              {tcs("Mode")}
            </Text>
            <SegmentedControl
              size="sm"
              value={selection.mode}
              onValueChange={(next) =>
                setSelection({ ...selection, mode: next === "light" ? "light" : "dark" })
              }
            >
              <SegmentedItem value="dark">{tcs("Dark")}</SegmentedItem>
              <SegmentedItem value="light">{tcs("Light")}</SegmentedItem>
            </SegmentedControl>
          </Inline>
          <Inline justify="between" align="center">
            <Text variant="label" as="span">
              {tcs("Palette")}
            </Text>
            {/*
             * Eight palette names in one control is 411px, and the row it sits
             * in does not wrap — so at 390px the control pushed the whole page
             * 58px sideways. The frame scrolls the control instead; a palette
             * picker is a row by design, exactly like the stepper.
             */}
            <div className="min-w-0 max-w-full overflow-x-auto">
              <SegmentedControl
                size="sm"
                value={selection.palette}
                onValueChange={(next) =>
                  setSelection({ ...selection, palette: next as ThemeSelection["palette"] })
                }
              >
                {THEME_CHOICES.palettes.map((id) => (
                  <SegmentedItem key={id} value={id}>
                    {id}
                  </SegmentedItem>
                ))}
              </SegmentedControl>
            </div>
          </Inline>
          <Inline justify="between" align="center">
            <Text variant="label" as="span">
              {tcs("Type voice")}
            </Text>
            <SegmentedControl
              size="sm"
              value={selection.typeface}
              onValueChange={(next) =>
                setSelection({ ...selection, typeface: next as ThemeSelection["typeface"] })
              }
            >
              {THEME_CHOICES.typefaces.map((id) => (
                <SegmentedItem key={id} value={id}>
                  {id}
                </SegmentedItem>
              ))}
            </SegmentedControl>
          </Inline>
          <Inline justify="between" align="center">
            <Text variant="label" as="span">
              {tcs("Personality")}
            </Text>
            <SegmentedControl
              size="sm"
              value={selection.personality}
              onValueChange={(next) =>
                setSelection({ ...selection, personality: next as ThemeSelection["personality"] })
              }
            >
              {THEME_CHOICES.personalities.map((id) => (
                <SegmentedItem key={id} value={id}>
                  {id}
                </SegmentedItem>
              ))}
            </SegmentedControl>
          </Inline>
          <Inline justify="between" align="center">
            <Text variant="label" as="span">
              {tcs("Depth")}
            </Text>
            <SegmentedControl
              size="sm"
              value={selection.space}
              onValueChange={(next) =>
                setSelection({ ...selection, space: next as ThemeSelection["space"] })
              }
            >
              {THEME_CHOICES.spaces.map((id) => (
                <SegmentedItem key={id} value={id}>
                  {id}
                </SegmentedItem>
              ))}
            </SegmentedControl>
          </Inline>
        </Stack>
      </Panel>

      <div {...attributes} className="rounded-xl border border-line-subtle bg-surface-canvas p-6">
        <Stack gap="lg">
          <Stack gap="xs">
            <Heading as="h3" size="heading-sm">
              {tcs("The same components, one attribute set")}
            </Heading>
            <Text tone="muted">
              {tcs(
                "This subtree carries the four attributes. Nothing below was styled for the preview — it is the public API.",
              )}
            </Text>
          </Stack>
          <Card variant="outline" className="gap-3 p-4">
            <Inline gap="sm" align="center">
              <Button variant="primary">{tcs("Primary action")}</Button>
              <Button variant="secondary">{tcs("Secondary")}</Button>
              <Badge tone="accent">{tcs("Accent")}</Badge>
            </Inline>
            <Input placeholder={tcs("A field inherits the theme too")} aria-label={tcs("Example field")} />
            <Inline gap="sm" align="center">
              <Text variant="caption" tone="muted" as="p">
                {tcs("Radius, density, leading and motion come from the personality.")}
              </Text>
            </Inline>
          </Card>
          <Section title={tcs("The configuration")}>
            <Inline justify="between" align="center" gap="sm">
              <Text variant="caption" tone="muted" as="p">
                {tcs("Every value above is a token the library already ships; the Studio adds no new ones.")}
              </Text>
              <CopyButton value={themeAttributeString(selection)} label={tcs("Copy the attributes")} />
            </Inline>
            {/*
              * `tabIndex={0}` because this box scrolls sideways: a scrollable
              * region that cannot take focus cannot be scrolled from the
              * keyboard at all, which is what axe reports as
              * `scrollable-region-focusable`. Every other scrollable `<pre>` in
              * the Showcase carries it; this one was missed.
              */}
            <pre
              tabIndex={0}
              className="luc-table-scroll mt-3 overflow-x-auto rounded-lg border border-line-subtle bg-surface-sunken p-4 text-caption"
            >
              <code>{themeAttributeString(selection)}</code>
            </pre>
          </Section>
        </Stack>
      </div>

      <Text variant="caption" tone="muted" as="p">
        {tcs("Palettes:")} {PALETTES.length} · {tcs("Type voices:")} {TYPEFACES.length} ·{" "}
        {tcs("Personalities:")} {PERSONALITIES.length} · {tcs("Depths:")} {SPACES.length}
      </Text>
    </Stack>
  );
}
