"use client";

import { Panel, Text, cn } from "@luc/ui";
import { CopyButton } from "./copy-button";
import { useOptionalI18n } from "@/lib/i18n/provider";

export interface PlaygroundProps {
  /** Controls column. */
  controls: React.ReactNode;
  /** Live sample. */
  children: React.ReactNode;
  controlsTitle?: string;
  /** Footnote under the stage. */
  note?: React.ReactNode;
  /**
   * The snippet the controls above are currently producing.
   *
   * MOT-002. Five handwritten Motion pages mounted this playground with controls
   * and a live stage and **no code anywhere on the page** — measured: zero `pre`
   * elements, no copy button — so a reader could drive a control and had nothing
   * to paste. The generated pages have always had this (`PlaygroundShell` prints
   * the snippet from the same values it renders), and a hand-written page can do
   * the same because its controls are its own state.
   *
   * It is the *caller's* string, deliberately: only the page knows the props it is
   * passing, and a playground that guessed would print something the preview does
   * not render.
   */
  code?: string;
  className?: string;
  stageClassName?: string;
}

// A small live editor: controls on the left, the real component on the right.
// Deliberately not a general design tool — just enough to review the states
// that are hard to judge from a static specimen.
export function Playground({
  controls,
  children,
  controlsTitle,
  note,
  code,
  className,
  stageClassName,
}: PlaygroundProps) {
  const i18n = useOptionalI18n();
  const tcs = i18n?.tcs ?? ((source: string) => source);
  // Through the dictionary rather than as a parameter default, so the string
  // stays visible to the coverage checker.
  const title = controlsTitle ?? tcs("Controls");

  return (
    <div data-slot="playground" className={cn("grid items-start gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]", className)}>
      <Panel tone="sunken" data-slot="playground-controls" className="h-fit">
        <div className="flex flex-col gap-4 p-4">
          <Text variant="micro" tone="muted" as="p">
            {title}
          </Text>
          {controls}
        </div>
      </Panel>
      <div className="flex min-w-0 flex-col gap-3">
        <div
          data-slot="playground-stage"
          /*
           * See `components/playground/shell.tsx` for why a stage is clipped and
           * floored: a transform that escapes its box otherwise becomes the
           * document's overflow, and the page twitches whenever a control moves.
           */
          className={cn(
            "grid min-h-[16rem] flex-1 place-items-center overflow-clip rounded-lg border border-line-subtle bg-surface-canvas p-6 [overflow-clip-margin:2rem]",
            stageClassName,
          )}
        >
          {children}
        </div>
        {note ? (
          <Text variant="caption" tone="muted">
            {note}
          </Text>
        ) : null}
        {/*
          * The same block `Demo` prints, for the same reason: a specimen without
          * its source is a picture, and the control panel above promises the
          * opposite.
          */}
        {code ? (
          <div className="group/code relative overflow-hidden rounded-lg border border-line-subtle bg-surface-sunken">
            <div className="absolute top-2 right-2 opacity-0 transition-opacity duration-[var(--motion-fast)] group-hover/code:opacity-100 focus-within:opacity-100">
              <CopyButton value={code} label={tcs("Copy code")} className="bg-surface-overlay/80 backdrop-blur-sm" />
            </div>
            <pre
              tabIndex={0}
              className="luc-table-scroll overflow-x-auto px-3.5 py-3 font-mono text-caption leading-[1.7] text-fg-secondary"
            >
              <code>{code}</code>
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  const i18n = useOptionalI18n();
  const tcs = i18n?.tcs ?? ((source: string) => source);
  return (
    <div className="flex flex-col gap-1.5">
      <Text variant="micro" tone="muted" as="p">
        {tcs(label)}
      </Text>
      {children}
    </div>
  );
}
