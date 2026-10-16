/*
 * Live Demos — Overlays.
 *
 * `hover-card`, `popover`, `tooltip`.
 */

/*
 * Overlay components.
 *
 * All three exist only while they are open, so nothing here is a static
 * specimen: a tooltip that is always visible, or a popover rendered into the
 * document flow, would teach the wrong thing about how they behave. Each
 * specimen is the trigger, and the reader opens it — by pointer or by keyboard,
 * which is the behaviour the checks in `qa/behaviour.mjs` exercise.
 */

import {
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Inline,
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
  Stack,
  Text,
  Tooltip,
  TooltipProvider,
} from "@luc/ui";
import { composition, type DemoSpec } from "../index";

export const overlayDemos: readonly DemoSpec[] = [
  composition({
    id: "tooltip",
    node: (
      <TooltipProvider>
        <Inline gap="sm">
          <Tooltip content="Run the backtest" hint="⌘↵">
            <Button variant="secondary" size="sm">
              Run
            </Button>
          </Tooltip>
          <Tooltip content="Opens on top by default">
            <Button variant="secondary" size="sm">
              Hover me
            </Button>
          </Tooltip>
        </Inline>
      </TooltipProvider>
    ),
    note: "Opens on hover and on focus, and closes on Escape — a tooltip is never pointer-only.",
    code: `<TooltipProvider>
  <Tooltip content="Run the backtest" hint="⌘↵">
    <Button variant="secondary">Run</Button>
  </Tooltip>
</TooltipProvider>`,
  }),
  composition({
    id: "popover",
    node: (
      <PopoverRoot>
        <PopoverTrigger asChild>
          <Button variant="secondary" size="sm">
            Chart filters
          </Button>
        </PopoverTrigger>
        <PopoverContent width="sm" align="start" className="flex flex-col gap-2">
          <Text variant="label" as="p">
            Series
          </Text>
          <Text variant="caption" tone="muted" as="p">
            Two of three series are visible.
          </Text>
        </PopoverContent>
      </PopoverRoot>
    ),
    note: "Anchored to its trigger, focus-trapped while open and closed by Escape.",
    code: `<PopoverRoot>
  <PopoverTrigger asChild>
    <Button variant="secondary">Chart filters</Button>
  </PopoverTrigger>
  <PopoverContent width="sm" align="start">
    <Text variant="label" as="p">Series</Text>
    <Text variant="caption" tone="muted" as="p">Two of three series are visible.</Text>
  </PopoverContent>
</PopoverRoot>`,
  }),
  composition({
    id: "hover-card",
    node: (
      <HoverCard openDelay={180} closeDelay={120}>
        <HoverCardTrigger asChild>
          <Button variant="ghost" size="sm">
            @momentum
          </Button>
        </HoverCardTrigger>
        <HoverCardContent width="sm">
          <Stack gap="xs">
            <Text variant="label" as="p">
              Momentum
            </Text>
            <Text variant="caption" tone="muted" as="p">
              Twelve-month cross-sectional, monthly rebalance.
            </Text>
          </Stack>
        </HoverCardContent>
      </HoverCard>
    ),
    note: "A preview on hover with a longer delay than a tooltip; the trigger is focusable and the card follows focus.",
    code: `<HoverCard>
  <HoverCardTrigger asChild>
    <Button variant="ghost">@momentum</Button>
  </HoverCardTrigger>
  <HoverCardContent width="sm">
    <Text variant="label" as="p">Momentum</Text>
  </HoverCardContent>
</HoverCard>`,
  }),
];
