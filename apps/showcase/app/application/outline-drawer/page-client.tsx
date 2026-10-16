"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Card,
  OutlineDrawer,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Text,
  useScrollSpy,
  type OutlineNavGroup,
} from "@luc/ui";
import { Button } from "@luc/ui/components/button";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { EntryFooter } from "@/components/docs/entry-footer";
import { Example } from "@/components/docs/example";
import { ImportLine } from "@/components/docs/family-imports";
import { useI18n } from "@/lib/i18n/provider";

/**
 * The report's outline, in English.
 *
 * Rendered through `tcs` rather than used directly: these labels are visible
 * chrome, not fixture data, so a Chinese page has to show them in Chinese. The
 * ids stay as written — they are the anchors, and an anchor is a contract.
 */
const GROUPS: OutlineNavGroup[] = [
  { id: "market", label: "Market performance", index: "01" },
  {
    id: "trend",
    label: "Trend & momentum",
    index: "02",
    items: [
      { id: "od-trend-stack", label: "Trend stack" },
      { id: "od-momentum", label: "Momentum" },
      { id: "od-weekly", label: "Weekly trend" },
    ],
  },
  { id: "risk", label: "Volatility & risk", index: "03" },
  { id: "volume", label: "Volume & liquidity", index: "04" },
];

/**
 * Outline drawer.
 *
 * A collapsible, right-edge report navigator: groups (one expanded) with the
 * items that jump down the page. It is navigation, not an inspector; the same
 * tree is reused inside a `Sheet` on a narrow viewport.
 */
export function OutlineDrawerPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const [open, setOpen] = useState(true);
  const [groupId, setGroupId] = useState("trend");
  /* The outline is chrome, so it is localized; the ids are the anchors and are
   * not. Built here rather than at module scope because `tcs` needs the locale. */
  const groups = useMemo(
    () =>
      GROUPS.map((group) => ({
        ...group,
        label: tcs(group.label),
        items: group.items?.map((item) => ({ ...item, label: tcs(item.label) })),
      })),
    [tcs],
  );
  const anchorIds = GROUPS.flatMap((group) => [group.id, ...(group.items ?? []).map((item) => item.id)]);
  const spy = useScrollSpy(anchorIds, { attribute: "data-anchor-id" });

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Application")}
        title="Outline drawer"
        lead="A collapsible right-edge navigator: groups navigate, items jump to anchors, one group is open at a time. The same tree is reused on mobile inside a sheet."
      />

      <ImportLine line={'import { OutlineDrawer, useScrollSpy, type OutlineNavGroup } from "@luc/ui/workspace";'} />

      <Example
        title={tcs("Desktop: groups, items and the reading position")}
        description={tcs("Collapse to a rail of group ordinals; expand to read the report contents. Scroll the page and the outline follows the section you are reading, until you choose one yourself.")}
        layout="stage"
        padding="none"
        code={`const GROUPS: OutlineNavGroup[] = [
  { id: "market", label: "Market performance", index: "01" },
  { id: "trend", label: "Trend & momentum", index: "02", items: [
    { id: "od-trend-stack", label: "Trend stack" },
    { id: "od-momentum", label: "Momentum" },
    { id: "od-weekly", label: "Weekly trend" },
  ]},
  { id: "risk", label: "Volatility & risk", index: "03" },
  { id: "volume", label: "Volume & liquidity", index: "04" },
];

/* Every section the outline points at carries the same attribute. */
const anchorIds = GROUPS.flatMap((group) => [
  group.id,
  ...(group.items ?? []).map((item) => item.id),
]);
const spy = useScrollSpy(anchorIds, { attribute: "data-anchor-id" });

<OutlineDrawer
  label="Contents"
  groups={GROUPS}
  open={open}
  onOpenChange={setOpen}
  expandedGroupId={groupId}            // one group is open at a time
  activeItemId={spy.activeId}          // the section currently being read
  onSelectGroup={(group) => {
    setGroupId(group.id);
    return false;                      // false: the caller handled navigation
  }}
  onSelectItem={(id) => spy.lock(id)}  // a chosen item outranks the spy
/>

<section id="trend" data-anchor-id="trend" className="scroll-mt-24">…</section>`}
      >
        <Card className="overflow-hidden p-0">
          <div className="flex items-start gap-6 p-6">
            <div className="min-w-0 flex-1 space-y-8">
              {groups.map((group) => (
                <section key={group.id} data-anchor-id={group.id} id={group.id} className="scroll-mt-24">
                  <h3 className="text-heading-sm text-fg-primary">{group.label}</h3>
                  <Text tone="secondary" className="mt-2 max-w-[60ch]">
                    {tcs(
                      "Sample section: {name}. Scroll the page and the outline highlights the section you are reading.",
                    ).replace("{name}", group.label)}
                  </Text>
                  {(group.items ?? []).map((item) => (
                    <div key={item.id} id={item.id} data-anchor-id={item.id} className="mt-6 scroll-mt-24">
                      <h4 className="text-body font-medium text-fg-primary">{item.label}</h4>
                      <div className="mt-2 h-32 rounded-md border border-line-subtle bg-surface-sunken" />
                    </div>
                  ))}
                </section>
              ))}
            </div>
            <OutlineDrawer
              label={tcs("Contents")}
              groups={groups}
              open={open}
              onOpenChange={setOpen}
              expandedGroupId={groupId}
              activeItemId={spy.activeId}
              onSelectGroup={(group) => {
                setGroupId(group.id);
                return false;
              }}
              onSelectItem={(id) => spy.lock(id)}
            />
          </div>
        </Card>
      </Example>

      <Example
        title={tcs("Mobile: the same tree in a sheet")}
        description={tcs("The same hierarchy, rendered without the collapsible rail.")}
        layout="stage"
        code={`<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Open contents</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Contents</SheetTitle>
    </SheetHeader>
    <OutlineDrawer
      label="Contents"
      groups={GROUPS}
      collapsible={false}        // a sheet has no room for a rail
      className="static w-full"
      expandedGroupId="trend"
    />
  </SheetContent>
</Sheet>`}
      >
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">{tcs("Open contents")}</Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>{tcs("Contents")}</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <OutlineDrawer
                label={tcs("Contents")}
                groups={groups}
                collapsible={false}
                className="static w-full"
                expandedGroupId="trend"
              />
            </div>
          </SheetContent>
        </Sheet>
      </Example>
      {apiSection}
      <EntryFooter />
    </DocPage>
  );
}
