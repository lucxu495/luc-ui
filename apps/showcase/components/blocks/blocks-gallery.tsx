"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Inline, Section, Text, buttonVariants } from "@luc/ui";

interface FilterCategory {
  id: string;
  title: string;
  summary: string;
  count: number;
}

interface BlocksGalleryProps {
  allLabel: string;
  allCount: number;
  allSummary: string;
  filterTitle: string;
  filterDescription: string;
  allHref: string;
  categories: readonly FilterCategory[];
  categoryHrefs: Readonly<Record<string, string>>;
  sections: readonly { id: string; node: ReactNode }[];
}

function BlocksView({
  active,
  ...props
}: BlocksGalleryProps & { active?: string }) {
  const activeMeta = props.categories.find((category) => category.id === active);
  return (
    <>
      <Section title={props.filterTitle} description={props.filterDescription}>
        <Inline gap="sm" wrap>
          <Link
            href={props.allHref}
            className={buttonVariants({
              variant: activeMeta ? "outline" : "primary",
              size: "sm",
            })}
            aria-current={activeMeta ? undefined : "page"}
          >
            {props.allLabel} ({props.allCount})
          </Link>
          {props.categories.map((category) => (
            <Link
              key={category.id}
              href={props.categoryHrefs[category.id] ?? props.allHref}
              className={buttonVariants({
                variant: activeMeta?.id === category.id ? "primary" : "outline",
                size: "sm",
              })}
              aria-current={activeMeta?.id === category.id ? "page" : undefined}
            >
              {category.title} ({category.count})
            </Link>
          ))}
        </Inline>
        <Text variant="caption" tone="muted" as="p">
          {activeMeta?.summary ?? props.allSummary}
        </Text>
      </Section>
      {props.sections
        .filter((section) => !activeMeta || section.id === activeMeta.id)
        .map((section) => (
          <div key={section.id}>{section.node}</div>
        ))}
    </>
  );
}

function BlocksWithQuery(props: BlocksGalleryProps) {
  const params = useSearchParams();
  const requested = params.get("category");
  const active = props.categories.some((category) => category.id === requested)
    ? requested ?? undefined
    : undefined;
  return <BlocksView {...props} active={active} />;
}

/**
 * The Block catalogue's filter is client-side so the page itself can be
 * prerendered. The categories still come from the registry, and every section
 * remains server-rendered; this component only decides which pre-rendered
 * section to show for the current query.
 */
export function BlocksGallery(props: BlocksGalleryProps) {
  return (
    <Suspense fallback={<BlocksView {...props} />}>
      <BlocksWithQuery {...props} />
    </Suspense>
  );
}
