"use client";

/*
 * The Playground shell.
 *
 * The shape of the interaction is deliberate: the preview never leaves the
 * screen. A documentation playground that hides the stage behind a tab makes
 * the reader click twice to learn one thing, so controls stay on the left, the
 * stage stays on the right, and the code and the AI prompt are disclosures
 * underneath — visible when wanted, out of the way when not.
 *
 * The stage can render in light or dark, and at three widths. Both are real:
 * `data-theme` is the same attribute the library's own theme provider writes,
 * and the width is a real container width, not a scaled screenshot.
 */

import { useMemo } from "react";
import {
  Badge,
  Button,
  Inline,
  Panel,
  SegmentedControl,
  SegmentedItem,
  Text,
  cn,
} from "@luc/ui";
import { buildAiPrompt } from "@/lib/docs/ai-prompt";
import { useI18n } from "@/lib/i18n/provider";
import { CopyButton } from "@/components/docs/copy-button";
import { ControlField } from "./controls";
import { activePreset, buildSnippet, controlsInGroup, disabledReasons, isDirty, presetsOf } from "./engine";
import { rememberSticky, usePlaygroundState, useStickyStore } from "./state";
import type { PlaygroundSpec } from "./types";
import type { PlaygroundEntry } from "./boundary";

type StageTheme = "light" | "dark";
type StageWidth = "auto" | "medium" | "small";

/*
 * `03_SHOWCASE_DESIGN_SPEC.md` §6.2 rule 4 names three preview widths — small,
 * medium and full. They are labelled in pixels rather than with breakpoint names
 * on purpose: this is a real *container* width, so a media query inside the
 * specimen still resolves against the browsing context (ADR-018) and calling it
 * "mobile" would claim a viewport the preview does not have.
 */
const WIDTHS: Record<StageWidth, string | undefined> = {
  auto: undefined,
  medium: "48rem",
  small: "24.375rem",
};

const WIDTH_LABELS: Record<StageWidth, string> = { auto: "Full", medium: "768", small: "390" };

export interface PlaygroundShellProps {
  spec: PlaygroundSpec;
  entry: PlaygroundEntry;
  /** Extra guidance handed to the AI prompt, e.g. a data contract. */
  contract?: string;
}

export function PlaygroundShell({ spec, entry, contract }: PlaygroundShellProps) {
  const { tcs } = useI18n();
  const { values, dirty, setValue, reset } = usePlaygroundState(spec);
  /*
   * WB-005: appearance is the reader's, not the specimen's. Navigating from one
   * component to the next keeps the stage in the theme and the width they chose,
   * so a reviewer comparing ten charts does not re-pick Dark ten times.
   */
  /*
   * The remembered choice is the source of truth, read during render — the same
   * rule the control values follow. `useSyncExternalStore` serves the empty map
   * during hydration, so the first client render matches the server's HTML and
   * the remembered value arrives in the re-render that follows.
   */
  const sticky = useStickyStore();
  const storedTheme = sticky.get("__stageTheme");
  const storedWidth = sticky.get("__stageWidth");
  const theme: StageTheme = storedTheme === "dark" ? "dark" : "light";
  const width: StageWidth = storedWidth === "medium" || storedWidth === "small" ? storedWidth : "auto";
  const chooseTheme = (next: StageTheme) => rememberSticky("__stageTheme", next);
  const chooseWidth = (next: StageWidth) => rememberSticky("__stageWidth", next);

  /*
   * WB-003. The panel is three bands, not a flat list: the decision the
   * component exists to make, the family's declared variants, and the handful of
   * options only a maintainer reaches for — collapsed, per §6.1.
   */
  const essential = controlsInGroup(spec, "essential");
  const variants = controlsInGroup(spec, "variant");
  const advanced = controlsInGroup(spec, "advanced");
  const presets = presetsOf(spec);
  const active = activePreset(spec, values);
  const inert = disabledReasons(spec, values);

  const snippet = useMemo(() => buildSnippet(spec, values), [spec, values]);
  const prompt = useMemo(
    () => buildAiPrompt({ entry, props: values, code: snippet.code, ...(contract ? { contract } : {}) }),
    [entry, values, snippet.code, contract],
  );

  return (
    <div data-slot="playground" className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <Panel tone="sunken" data-slot="playground-controls" className="h-fit">
          <div className="flex flex-col gap-4 p-4">
            <Inline justify="between" align="center" gap="sm">
              <Text variant="micro" tone="muted" as="p">
                {tcs("Controls")}
              </Text>
              {dirty ? (
                <Badge tone="accent" size="sm">
                  {tcs("Modified")}
                </Badge>
              ) : null}
            </Inline>

            {presets.length ? (
              <div className="flex flex-col gap-1.5">
                <Text variant="micro" tone="muted" as="p">
                  {tcs("Presets")}
                </Text>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((preset) => (
                    <Button
                      key={preset.id}
                      variant={active === preset.id ? "accent" : "outline"}
                      size="sm"
                      aria-pressed={active === preset.id}
                      title={preset.description ? tcs(preset.description) : undefined}
                      onClick={() => {
                        /* A preset is a starting point, not a patch: anything it
                         * does not name returns to its documented default. */
                        reset();
                        for (const [name, next] of Object.entries(preset.values)) setValue(name, next);
                      }}
                    >
                      {tcs(preset.label)}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            {[...essential, ...variants].map((control) => (
              <ControlField
                key={control.name}
                control={control}
                value={values[control.name] ?? control.default}
                onChange={(next) => setValue(control.name, next)}
                {...(inert.has(control.name) ? { reason: inert.get(control.name) } : {})}
              />
            ))}

            {advanced.length ? (
              <details data-slot="playground-advanced" className="group rounded-md border border-line-subtle">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-md px-2.5 py-2 text-micro tracking-[0.14em] text-fg-muted uppercase">
                  {tcs("Advanced")}
                </summary>
                <div className="flex flex-col gap-4 border-t border-line-subtle p-2.5">
                  {advanced.map((control) => (
                    <ControlField
                      key={control.name}
                      control={control}
                      value={values[control.name] ?? control.default}
                      onChange={(next) => setValue(control.name, next)}
                      {...(inert.has(control.name) ? { reason: inert.get(control.name) } : {})}
                    />
                  ))}
                </div>
              </details>
            ) : null}

            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              disabled={!isDirty(spec, values)}
              block
            >
              {tcs("Reset to defaults")}
            </Button>
          </div>
        </Panel>

        <div className="flex min-w-0 flex-col gap-3">
          <Inline align="center" justify="between" gap="md" wrap>
            <SegmentedControl
              value={theme}
              onValueChange={(next) => chooseTheme(next === "dark" ? "dark" : "light")}
              size="sm"
              aria-label={tcs("Preview theme")}
            >
              <SegmentedItem value="light">{tcs("Light")}</SegmentedItem>
              <SegmentedItem value="dark">{tcs("Dark")}</SegmentedItem>
            </SegmentedControl>
            <SegmentedControl
              value={width}
              onValueChange={(next) => {
                chooseWidth(next === "medium" || next === "small" ? next : "auto");
              }}
              size="sm"
              aria-label={tcs("Preview width")}
            >
              {(["auto", "medium", "small"] as const).map((option) => (
                <SegmentedItem key={option} value={option}>
                  {WIDTH_LABELS[option] === "Full" ? tcs("Full") : WIDTH_LABELS[option]}
                </SegmentedItem>
              ))}
            </SegmentedControl>
          </Inline>

          <div
            data-theme={theme}
            data-slot="playground-stage"
            /*
             * The stage is a fixed room, not a growing one.
             *
             * `overflow: clip` is the important half. A motion effect that
             * scales, tilts or throws a layer sideways paints outside its box,
             * and without a clip that overflow becomes the document's
             * scrollable area: a horizontal scrollbar appears, every centred
             * element moves half a scrollbar to the left, and the reader sees
             * the whole page twitch every time they touch a slider. Unlike
             * `overflow: hidden` it does not create a scroll container, so
             * there is no scroll position to reset and no second scrollbar to
             * explain. `overflow-clip-margin` keeps the focus ring and a modest
             * glow alive at the edge, which is what a plain `hidden` would eat.
             *
             * Overlays are unaffected: Luc UI's popovers, dropdowns and dialogs
             * render into a portal at the document root, so they were never
             * inside this box to begin with.
             *
             * The `min-h` is the other half. A control that legitimately makes
             * the preview taller — a longer headline, a second message — should
             * not be free to yank the rest of the page up and down; a floor
             * keeps the swap from being a jump.
             */
            className={cn(
              "min-h-[18rem] overflow-clip rounded-lg border border-line-subtle bg-surface-canvas p-6",
              "[overflow-clip-margin:2rem]",
            )}
          >
            <div
              className={cn("mx-auto flex flex-col items-start gap-3", width === "auto" && "w-full")}
              style={WIDTHS[width] ? { width: WIDTHS[width] } : undefined}
            >
              {spec.render(values)}
            </div>
          </div>
          {spec.stageNote ? (
            <Text variant="caption" tone="muted" as="p">
              {tcs(spec.stageNote)}
            </Text>
          ) : null}
        </div>
      </div>

      <CodeDisclosure title={tcs("Code")} value={snippet.full} language="tsx" />

      {spec.unsupported?.length ? (
        <Panel tone="sunken">
          <div className="flex flex-col gap-2 p-4">
            <Text variant="micro" tone="muted" as="p">
              {tcs("Not controllable here")}
            </Text>
            <ul className="flex flex-col gap-1.5">
              {spec.unsupported.map((item) => (
                <li key={item.name} className="text-caption text-fg-muted">
                  <code className="font-mono text-fg-secondary">{item.name}</code> — {tcs(item.reason)}
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      ) : null}

      <CodeDisclosure
        title={tcs("Copy for an AI agent")}
        value={prompt}
        language="text"
        summary={tcs(
          "A specification an agent can act on: the import, the setup, the chosen props, the data contract and the accessibility expectation.",
        )}
      />
    </div>
  );
}

function CodeDisclosure({
  title,
  value,
  language,
  summary,
}: {
  title: string;
  value: string;
  language: string;
  summary?: string;
}) {
  return (
    <details className="group rounded-lg border border-line-subtle bg-surface-sunken">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2.5">
        <span className="text-label font-medium text-fg-primary">{title}</span>
        <span className="text-caption text-fg-muted group-open:hidden">{summary}</span>
      </summary>
      <div className="relative border-t border-line-subtle">
        <div className="absolute top-2 right-2">
          <CopyButton value={value} label={`Copy ${title}`} />
        </div>
        <pre
          tabIndex={0}
          data-language={language}
          className="luc-table-scroll overflow-x-auto px-3.5 py-3 font-mono text-caption leading-[1.7] text-fg-secondary"
        >
          <code>{value}</code>
        </pre>
      </div>
    </details>
  );
}
