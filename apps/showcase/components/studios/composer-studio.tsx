"use client";

/*
 * Template Composer.
 *
 * An archetype picks a starting arrangement; the reader moves Blocks, removes
 * them and adds others, and the preview is the real Block components — the same
 * ones the gallery documents. Nothing is executed, nothing is pasted, and the
 * copyable outline is generated from the arrangement on screen.
 */

import { useState } from "react";
import {
  Badge,
  Button,
  Code,
  Inline,
  Panel,
  SegmentedControl,
  SegmentedItem,
  Stack,
  Text,
} from "@luc/ui";
import { CopyButton } from "@/components/docs/copy-button";
import { useI18n } from "@/lib/i18n/provider";
import { blockById } from "@/lib/blocks";
import {
  ARCHETYPES,
  addableBlocks,
  composerOutline,
  defaultArrangement,
  moveBlock,
  removeBlock,
  type Archetype,
} from "@/lib/studios/composer";

export function ComposerStudio() {
  const { tcs, href } = useI18n();
  const [archetype, setArchetype] = useState<Archetype>("marketing");
  const [order, setOrder] = useState<string[]>(defaultArrangement("marketing"));

  function chooseArchetype(next: Archetype) {
    setArchetype(next);
    setOrder(defaultArrangement(next));
  }

  const addable = addableBlocks(order);

  return (
    <Stack gap="lg">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <Panel tone="sunken" className="h-fit">
          <Stack gap="md" className="p-4">
            <Inline justify="between" align="center">
              <Text variant="label" as="span">
                {tcs("Archetype")}
              </Text>
              <SegmentedControl
                size="sm"
                value={archetype}
                onValueChange={(next) => chooseArchetype(next as Archetype)}
              >
                {ARCHETYPES.map((id) => (
                  <SegmentedItem key={id} value={id}>
                    {id}
                  </SegmentedItem>
                ))}
              </SegmentedControl>
            </Inline>

            <Stack gap="xs">
              <Text variant="label" as="p">
                {tcs("The page, in order")}
              </Text>
              {order.length === 0 ? (
                <Text variant="caption" tone="muted" as="p">
                  {tcs("No Blocks left. Add one, or start again from the archetype.")}
                </Text>
              ) : null}
              {order.map((id, index) => (
                <Inline key={id} justify="between" align="center" gap="sm">
                  <Text variant="caption" as="span">
                    {index + 1}. {blockById(id)?.title ?? id}
                  </Text>
                  <Inline gap="xs">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={index === 0}
                      onClick={() => setOrder(moveBlock(order, id, -1))}
                      aria-label={tcs("Move up")}
                    >
                      ↑
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={index === order.length - 1}
                      onClick={() => setOrder(moveBlock(order, id, 1))}
                      aria-label={tcs("Move down")}
                    >
                      ↓
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setOrder(removeBlock(order, id))}
                      aria-label={tcs("Remove")}
                    >
                      ✕
                    </Button>
                  </Inline>
                </Inline>
              ))}
            </Stack>

            <Stack gap="xs">
              <Text variant="label" as="p">
                {tcs("Add a Block")}
              </Text>
              <Inline gap="xs" className="flex-wrap">
                {addable.map((block) => (
                  <Button
                    key={block.id}
                    size="sm"
                    variant="outline"
                    onClick={() => setOrder([...order, block.id])}
                  >
                    {block.title}
                  </Button>
                ))}
              </Inline>
            </Stack>
          </Stack>
        </Panel>

        <Stack gap="md">
          <Inline justify="between" align="center" gap="sm">
            <Inline gap="sm" align="center">
              <Badge tone="neutral">{order.length}</Badge>
              <Text variant="caption" tone="muted" as="p">
                {tcs("Blocks, rendered by the real components in the order you set.")}
              </Text>
            </Inline>
            <CopyButton value={composerOutline(archetype, order)} label={tcs("Copy the outline")} />
          </Inline>
          <Stack gap="lg" className="rounded-lg border border-line-subtle bg-surface-canvas p-4">
            {order.map((id) => (
              <div key={id} data-block={id}>
                {blockById(id)?.render(href, tcs)}
              </div>
            ))}
          </Stack>
          {/*
           * The library's block form: focusable because it scrolls, and
           * `contain: inline-size` so a long outline scrolls inside its own box
           * instead of widening the studio column.
           */}
          <Code block>{composerOutline(archetype, order)}</Code>
        </Stack>
      </div>
    </Stack>
  );
}
