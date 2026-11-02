"use client";

import { useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Heading,
  Inline,
  Input,
  ProductTour,
  SegmentedControl,
  SegmentedItem,
  Text,
  type ProductTourStep,
  type ProductTourHandle,
  type ProductTourVariant,
} from "@luc/ui";
import {
  RiArrowDownSLine,
  RiArrowRightUpLine,
  RiBookmark3Line,
  RiCheckLine,
  RiCommandLine,
  RiCompass3Line,
  RiFileChartLine,
  RiGridLine,
  RiInboxArchiveLine,
  RiListCheck3,
  RiMore2Fill,
  RiPlayLine,
  RiRefreshLine,
  RiSearchLine,
  RiSparkling2Line,
  RiStopCircleLine,
  RiTimeLine,
} from "@remixicon/react";
import { useI18n } from "@/lib/i18n/provider";

type DemoScenario = "welcome" | "manual" | "auto" | "nested" | "edge" | "recovery";

const boardRows = [
  { title: "Materials refresh", meta: "3 changes", tone: "positive" as const },
  { title: "Search ranking review", meta: "Due today", tone: "warning" as const },
  { title: "Preview palette", meta: "2 open notes", tone: "info" as const },
  { title: "Mobile spacing audit", meta: "Ready", tone: "accent" as const },
  { title: "Release notes", meta: "Draft", tone: "neutral" as const },
];

const rowToneClass = {
  positive: "bg-positive",
  warning: "bg-warning",
  info: "bg-info",
  accent: "bg-accent-default",
  neutral: "bg-fg-muted",
} as const;

function ProductTourPreviewSurface({
  recoveryReady,
  edgeVisible,
}: {
  recoveryReady: boolean;
  edgeVisible: boolean;
}) {
  const { tcs } = useI18n();
  return (
    <div
      data-slot="product-tour-demo-surface"
      className="relative min-h-[560px] overflow-hidden rounded-xl border border-line-subtle bg-surface-canvas shadow-rest"
    >
      <div id="tour-workspace-toolbar" className="flex h-12 items-center justify-between border-b border-line-subtle bg-surface-default px-3 sm:px-4">
        <div className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-full border border-line-default bg-surface-raised text-fg-accent">
            <RiCompass3Line aria-hidden="true" className="size-3.5" />
          </span>
          <Text variant="label" as="span" className="font-medium">
            {tcs("Fieldnote")}
          </Text>
          <span className="hidden h-4 w-px bg-line-subtle sm:block" />
          <Text variant="caption" tone="muted" as="span" className="hidden sm:inline">
            {tcs("Product workspace")}
          </Text>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="luc-focus hidden h-7 items-center gap-1.5 rounded-sm px-2 text-caption text-fg-muted transition-colors hover:bg-surface-interactive-hover hover:text-fg-primary sm:flex"
            aria-label={tcs("Search the workspace")}
          >
            <RiSearchLine aria-hidden="true" className="size-3.5" />
            <span>{tcs("Search")}</span>
            <kbd className="ml-3 rounded-xs border border-line-subtle px-1 text-[10px]">⌘K</kbd>
          </button>
          <span className="grid size-6 place-items-center rounded-full bg-accent-soft text-[10px] font-medium text-fg-accent">
            AM
          </span>
        </div>
      </div>

      <div className="grid min-h-[507px] grid-cols-1 sm:grid-cols-[132px_minmax(0,1fr)]">
        <aside id="tour-workspace-nav" className="border-b border-line-subtle bg-surface-default p-2.5 sm:border-b-0 sm:border-r">
          <nav aria-label={tcs("Workspace")} className="flex gap-1 overflow-x-auto sm:flex-col">
            {[
              { label: tcs("Overview"), icon: <RiGridLine />, active: false },
              { label: tcs("Signals"), icon: <RiSparkling2Line />, active: true },
              { label: tcs("Sources"), icon: <RiFileChartLine />, active: false },
              { label: tcs("Archive"), icon: <RiInboxArchiveLine />, active: false },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                aria-current={item.active ? "page" : undefined}
                className="luc-focus inline-flex h-8 shrink-0 items-center gap-2 rounded-sm px-2 text-left text-caption text-fg-muted transition-colors hover:bg-surface-interactive-hover hover:text-fg-primary aria-[current=page]:bg-surface-selected aria-[current=page]:text-fg-primary sm:w-full"
              >
                <span className="[&_svg]:size-3.5">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-5 hidden rounded-md border border-line-subtle bg-surface-sunken p-2.5 sm:block">
            <Text variant="micro" tone="muted" as="p">{tcs("THIS WEEK")}</Text>
            <div className="mt-2 flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full bg-positive-soft text-fg-positive">
                <RiCheckLine aria-hidden="true" className="size-3" />
              </span>
              <div className="min-w-0">
                <Text variant="caption" as="p" className="truncate">{tcs("8 of 12")}</Text>
                <Text variant="micro" tone="muted" as="p">{tcs("captures shaped")}</Text>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 bg-surface-canvas p-3 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Text variant="micro" tone="muted" as="p" className="uppercase tracking-[0.12em]">
                {tcs("TUESDAY, 3 NOVEMBER")}
              </Text>
              <Heading size="title" as="h3" className="mt-1 font-[560]">
                {tcs("Signal desk")}
              </Heading>
            </div>
            <Button
              id="tour-workspace-create"
              size="sm"
              variant="secondary"
              leadingIcon={<RiCommandLine />}
              className="h-8"
            >
              {tcs("New capture")}
            </Button>
          </div>

          <div id="tour-workspace-intro" className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Input
              id="tour-workspace-search"
              aria-label={tcs("Search this workspace")}
              placeholder={tcs("Search notes, sources and people…")}
              leadingIcon={<RiSearchLine />}
              size="sm"
              defaultValue=""
            />
            <SegmentedControl
              id="tour-workspace-views"
              size="sm"
              defaultValue="board"
              aria-label={tcs("View style")}
            >
              <SegmentedItem value="board" size="sm" leadingIcon={<RiGridLine />}>
                {tcs("Board")}
              </SegmentedItem>
              <SegmentedItem value="list" size="sm" leadingIcon={<RiListCheck3 />}>
                {tcs("List")}
              </SegmentedItem>
            </SegmentedControl>
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(180px,.7fr)]">
            <section className="flex min-w-0 flex-col gap-2">
              <div className="flex items-center justify-between">
                <Text variant="caption" tone="muted" as="p">{tcs("Your signals")}</Text>
                <button
                  type="button"
                  className="luc-focus inline-flex h-7 items-center gap-1 rounded-sm px-1.5 text-micro text-fg-muted hover:bg-surface-interactive-hover hover:text-fg-primary"
                >
                  {tcs("This week")}
                  <RiArrowDownSLine aria-hidden="true" className="size-3.5" />
                </button>
              </div>

              <Card
                id="tour-workspace-featured"
                variant="raised"
                className="relative overflow-hidden p-3.5"
              >
                <div aria-hidden="true" className="absolute -right-5 -top-8 size-24 rounded-full bg-accent-soft opacity-45 blur-2xl" />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border border-line-subtle bg-surface-sunken text-fg-accent">
                      <RiSparkling2Line aria-hidden="true" className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Text variant="label" as="p" className="font-medium">
                          {tcs("A quieter weekly brief")}
                        </Text>
                        <Badge tone="positive" size="sm">{tcs("Ready")}</Badge>
                      </div>
                      <Text variant="caption" tone="muted" as="p" className="mt-1 line-clamp-2">
                        {tcs("Three patterns worth carrying into next week, with source links kept close to the claim.")}
                      </Text>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={tcs("More options")}
                    className="luc-focus grid size-7 shrink-0 place-items-center rounded-sm text-fg-muted hover:bg-surface-interactive-hover hover:text-fg-primary"
                  >
                    <RiMore2Fill aria-hidden="true" className="size-3.5" />
                  </button>
                </div>
                <div className="relative mt-3 flex items-center gap-3 border-t border-line-subtle pt-2.5 text-micro text-fg-muted">
                  <span className="inline-flex items-center gap-1"><RiTimeLine className="size-3" /> {tcs("4 min read")}</span>
                  <span className="inline-flex items-center gap-1"><RiBookmark3Line className="size-3" /> {tcs("6 sources")}</span>
                </div>
              </Card>

              <div className="mt-1 flex items-center justify-between">
                <Text variant="caption" tone="muted" as="p">{tcs("Queue")}</Text>
                <Text variant="micro" tone="muted" as="p">{tcs("5 items")}</Text>
              </div>

              <div className="rounded-md border border-line-subtle bg-surface-default">
                {boardRows.slice(0, 3).map((row, rowIndex) => (
                  <div
                    key={row.title}
                    className="flex items-center gap-2.5 border-b border-line-subtle px-3 py-2.5 last:border-b-0"
                  >
                    <span className="grid size-5 place-items-center rounded-full border border-line-subtle bg-surface-sunken">
                      <span className={`size-1.5 rounded-full ${rowToneClass[row.tone]}`} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <Text variant="caption" as="p" className="truncate">{tcs(row.title)}</Text>
                      <Text variant="micro" tone="muted" as="p">{tcs(row.meta)}</Text>
                    </div>
                    <span className="text-micro tabular-nums text-fg-muted">0{rowIndex + 1}</span>
                  </div>
                ))}
              </div>
            </section>

            <aside className="flex min-w-0 flex-col gap-2">
              <div className="flex items-center justify-between">
                <Text variant="caption" tone="muted" as="p">{tcs("Nested queue")}</Text>
                <Badge tone="neutral" size="sm">{tcs("Scroll")}</Badge>
              </div>
              <div
                className="max-h-[228px] overflow-y-auto rounded-md border border-line-subtle bg-surface-default"
                role="region"
                aria-label={tcs("Nested queue")}
                tabIndex={0}
              >
                {boardRows.concat(boardRows.slice(0, 3)).map((row, index) => (
                  <div
                    id={`tour-nested-row-${index + 1}`}
                    key={`${row.title}-${index}`}
                    className="border-b border-line-subtle px-3 py-3 last:border-b-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Text variant="caption" as="p" className="truncate">{tcs(row.title)}</Text>
                      <span className="size-1.5 shrink-0 rounded-full bg-line-strong" />
                    </div>
                    <Text variant="micro" tone="muted" as="p" className="mt-0.5">{tcs(row.meta)}</Text>
                  </div>
                ))}
              </div>
              <div
                id="tour-recovery-anchor"
                className={recoveryReady ? "rounded-md border border-line-default bg-surface-default p-3 shadow-rest" : "h-0 overflow-hidden"}
              >
                {recoveryReady ? (
                  <div className="flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-full bg-positive-soft text-fg-positive">
                      <RiCheckLine aria-hidden="true" className="size-3.5" />
                    </span>
                    <div>
                      <Text variant="caption" as="p">{tcs("Anchor recovered")}</Text>
                      <Text variant="micro" tone="muted" as="p">{tcs("The tour can continue.")}</Text>
                    </div>
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      </div>

      {edgeVisible ? (
        <button
          id="tour-edge-anchor"
          type="button"
          className="luc-focus fixed right-3 top-1/2 z-20 inline-flex -translate-y-1/2 items-center gap-1.5 rounded-full border border-line-default bg-surface-overlay px-3 py-2 text-caption text-fg-primary shadow-layer-3"
        >
          <RiArrowRightUpLine aria-hidden="true" className="size-3.5 text-fg-accent" />
          {tcs("Edge anchor")}
        </button>
      ) : null}
    </div>
  );
}

export function ProductTourDemo() {
  const { tcs } = useI18n();
  const tourRef = useRef<ProductTourHandle>(null);
  const [variant, setVariant] = useState<ProductTourVariant>("cloud-glass");
  const [scenario, setScenario] = useState<DemoScenario>("manual");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("idle");
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [starts, setStarts] = useState(0);

  useEffect(() => {
    if (!open || scenario !== "recovery") return;
    const timer = window.setTimeout(() => setRecoveryReady(true), 1700);
    return () => window.clearTimeout(timer);
  }, [open, scenario, starts]);

  const changeScenario = (next: DemoScenario) => {
    if (open) setOpen(false);
    setScenario(next);
    setStatus("idle");
    setRecoveryReady(next !== "recovery");
  };

  const start = () => {
    if (open) {
      setOpen(false);
      setStatus("dismissed");
      return;
    }
    if (scenario === "recovery") setRecoveryReady(false);
    setStarts((value) => value + 1);
    tourRef.current?.start(0);
  };

  const sharedSteps: ProductTourStep[] = [
    {
      id: "search",
      target: "#tour-workspace-search",
      eyebrow: tcs("WORKSPACE · 01"),
      title: tcs("Find the signal, not the shelf"),
      description: tcs("Search across notes, sources and people without leaving the current view."),
      icon: <RiSearchLine />,
      placement: "bottom",
    },
    {
      id: "capture",
      target: "#tour-workspace-create",
      eyebrow: tcs("WORKSPACE · 02"),
      title: tcs("Keep the next idea one motion away"),
      description: tcs("A capture starts as a draft. It only enters the queue when you decide it is ready."),
      icon: <RiCommandLine />,
      placement: "left",
    },
    {
      id: "featured",
      target: "#tour-workspace-featured",
      eyebrow: tcs("WORKSPACE · 03"),
      title: tcs("Read the shape before the detail"),
      description: tcs("The lead brief keeps status, reading time and provenance in one quiet surface."),
      icon: <RiSparkling2Line />,
      placement: "right",
    },
    {
      id: "views",
      target: "#tour-workspace-views",
      eyebrow: tcs("WORKSPACE · 04"),
      title: tcs("Change the lens, not the data"),
      description: tcs("Board and list share the same selection, so your position in the work survives the switch."),
      icon: <RiGridLine />,
      placement: "bottom",
    },
    {
      id: "nested",
      target: "#tour-nested-row-4",
      eyebrow: tcs("WORKSPACE · 05"),
      title: tcs("The quiet rail keeps its place"),
      description: tcs("Nested scrolling is measured from the live element, so the spotlight follows this row inside its own container."),
      icon: <RiListCheck3 />,
      placement: "left",
    },
  ];

  const nestedSteps: ProductTourStep[] = [
    {
      id: "nested-region",
      target: "#tour-nested-row-1",
      eyebrow: tcs("NESTED SCROLL · 01"),
      title: tcs("A container inside a page"),
      description: tcs("Luc UI measures the real row. Scrolling the rail moves the spotlight without moving the page."),
      icon: <RiListCheck3 />,
      placement: "left",
    },
    {
      id: "nested-target",
      target: "#tour-nested-row-7",
      eyebrow: tcs("NESTED SCROLL · 02"),
      title: tcs("The next step lives below the fold"),
      description: tcs("The adapter asks the nearest scroll container to reveal the target, then measures the settled viewport position."),
      icon: <RiArrowDownSLine />,
      placement: "left",
    },
  ];

  const edgeSteps: ProductTourStep[] = [
    {
      id: "edge",
      target: "#tour-edge-anchor",
      eyebrow: tcs("EDGE COLLISION"),
      title: tcs("Close to the edge, still readable"),
      description: tcs("The bubble flips and shifts inside the viewport. The tail stays attached to the target."),
      icon: <RiArrowRightUpLine />,
      placement: "right",
    },
  ];

  const recoverySteps: ProductTourStep[] = [
    {
      id: "recovery",
      target: "#tour-recovery-anchor",
      eyebrow: tcs("MISSING TARGET"),
      title: tcs("The description waits, the tour does not trap you"),
      description: tcs("This step starts before its target exists. Luc UI waits, watches for the anchor, then moves the spotlight when it appears."),
      icon: <RiRefreshLine />,
      placement: "left",
    },
  ];

  const intro = {
    eyebrow: tcs("WELCOME TO FIELDNOTE"),
    title: tcs("Let’s take a tour?"),
    description: tcs(
      "Five quiet steps through the signal desk. You can leave at any time.",
    ),
    icon: <RiCompass3Line />,
    placement: "bottom" as const,
    autoStartAfter: 5000,
  };

  const steps =
    scenario === "nested"
      ? nestedSteps
      : scenario === "edge"
        ? edgeSteps
        : scenario === "recovery"
          ? recoverySteps
          : sharedSteps;

  const statusText =
    status === "running"
      ? tcs("Running")
      : status === "paused"
        ? tcs("Paused")
        : status === "completed"
          ? tcs("Completed")
          : status === "dismissed"
            ? tcs("Dismissed")
            : tcs("Idle");

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line-subtle bg-surface-default p-2.5 shadow-rest">
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            value={variant}
            onValueChange={(next) => {
              if (next === "minimal-glass" || next === "cloud-glass") setVariant(next);
            }}
            size="sm"
            aria-label={tcs("Tour visual variant")}
          >
            <SegmentedItem value="minimal-glass" size="sm">{tcs("Minimal glass")}</SegmentedItem>
            <SegmentedItem value="cloud-glass" size="sm">{tcs("Soft cloud")}</SegmentedItem>
          </SegmentedControl>
          <SegmentedControl
            value={scenario}
            onValueChange={(next) => {
              if (["welcome", "manual", "auto"].includes(next)) {
                changeScenario(next as DemoScenario);
              }
            }}
            size="sm"
            aria-label={tcs("Tour mode")}
          >
            <SegmentedItem value="welcome" size="sm" className="whitespace-nowrap">{tcs("Welcome")}</SegmentedItem>
            <SegmentedItem value="manual" size="sm" className="whitespace-nowrap">{tcs("Manual")}</SegmentedItem>
            <SegmentedItem value="auto" size="sm" className="whitespace-nowrap">{tcs("Auto · 2s")}</SegmentedItem>
          </SegmentedControl>
          <SegmentedControl
            value={scenario}
            onValueChange={(next) => {
              if (["nested", "edge", "recovery"].includes(next)) {
                changeScenario(next as DemoScenario);
              }
            }}
            size="sm"
            aria-label={tcs("Positioning scenario")}
          >
            <SegmentedItem value="nested" size="sm" className="whitespace-nowrap">{tcs("Nested")}</SegmentedItem>
            <SegmentedItem value="edge" size="sm" className="whitespace-nowrap">{tcs("Edge")}</SegmentedItem>
            <SegmentedItem value="recovery" size="sm" className="whitespace-nowrap">{tcs("Recovery")}</SegmentedItem>
          </SegmentedControl>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-micro text-fg-muted sm:inline">
            {tcs("Status")}: <span className="font-medium text-fg-secondary">{statusText}</span>
          </span>
          <Button
            size="sm"
            variant={open ? "secondary" : "primary"}
            leadingIcon={open ? <RiStopCircleLine /> : <RiPlayLine />}
            onClick={start}
            className="h-8"
          >
            {open
              ? tcs("Stop tour")
              : scenario === "welcome"
                ? tcs("Preview welcome")
                : tcs(starts > 0 ? "Replay tour" : "Start tour")}
          </Button>
        </div>
      </div>

      <ProductTourPreviewSurface
        recoveryReady={scenario === "recovery" && recoveryReady}
        edgeVisible={scenario === "edge"}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-micro text-fg-muted">
        <Inline gap="sm" align="center" wrap>
          <span>{tcs("Try")}</span>
          <kbd className="rounded-xs border border-line-subtle bg-surface-sunken px-1.5 py-0.5">←</kbd>
          <kbd className="rounded-xs border border-line-subtle bg-surface-sunken px-1.5 py-0.5">→</kbd>
          <span>{tcs("to move")}</span>
          <kbd className="rounded-xs border border-line-subtle bg-surface-sunken px-1.5 py-0.5">Esc</kbd>
          <span>{tcs("to leave")}</span>
        </Inline>
        <span>{tcs("Auto pauses on hover, target focus, navigation and hidden pages.")}</span>
      </div>

      <ProductTour
        ref={tourRef}
        steps={steps}
        intro={scenario === "welcome" ? intro : undefined}
        open={open}
        onOpenChange={setOpen}
        variant={variant}
        mode={scenario === "auto" ? "auto" : "manual"}
        interval={2000}
        onStatusChange={setStatus}
        onComplete={() => setStatus("completed")}
        onSkip={() => setStatus("dismissed")}
        onClose={() => setStatus("dismissed")}
        labels={{
          region: tcs("Product tour"),
          step: (current, total) =>
            tcs("Step {current} of {total}")
              .replace("{current}", String(current))
              .replace("{total}", String(total)),
          introMeta: (total) =>
            tcs("{count} quiet steps").replace("{count}", String(total)),
          introAutoStart: (seconds) =>
            tcs("Auto · {seconds}s").replace("{seconds}", String(seconds)),
          introStatus: tcs("Tour welcome. Take the tour or explore on your own."),
          takeTour: tcs("Take the tour"),
          exploreAlone: tcs("I’ll explore on my own"),
          next: tcs("Continue"),
          back: tcs("Back"),
          finish: tcs("Finish"),
          skip: tcs("Skip"),
          close: tcs("Close tour"),
          pause: tcs("Pause"),
          resume: tcs("Resume"),
          unavailableTitle: tcs("The anchor moved"),
          unavailableDescription: tcs(
            "Luc UI is watching for the element to return. You can skip this step or leave the tour now.",
          ),
        }}
      />
    </div>
  );
}
